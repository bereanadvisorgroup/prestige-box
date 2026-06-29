"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar, FileText, Loader2, Paperclip, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { createTask, updateTask } from "@/actions/tasks";
import { getUsers } from "@/actions/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase.client";
import {
  type TaskAssociation,
  type TaskAttachment,
  TaskCategories,
  type TaskFormInput,
  TaskFormSchema,
  type TaskFormValues,
  TaskPriorities,
  TaskStatuses,
  type TaskWithRelations,
} from "@/types/crm";

import { MultiSelect, type MultiSelectOption } from "./multi-select";
import { RichTextEditor } from "./rich-text-editor";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Provided when editing an existing task. */
  task?: TaskWithRelations | null;
  /** Pre-selected associations (e.g. on a client/company scoped page). */
  defaultAssociations?: TaskAssociation[];
  onSaved?: () => void;
}

const assocKey = (a: TaskAssociation) => `${a.entityType}:${a.entityId}`;
const parseAssocKey = (key: string): TaskAssociation => {
  const [entityType, entityId] = key.split(":");
  return { entityType: entityType as TaskAssociation["entityType"], entityId };
};

const todayInput = () => new Date().toISOString().slice(0, 10);

export function TaskFormDialog({ open, onOpenChange, task, defaultAssociations = [], onSaved }: TaskFormDialogProps) {
  const isEditing = !!task?.id;
  const [isSaving, setIsSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [assigneeOptions, setAssigneeOptions] = React.useState<MultiSelectOption[]>([]);
  const [associationOptions, setAssociationOptions] = React.useState<MultiSelectOption[]>([]);

  const form = useForm<TaskFormInput, any, TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      name: "",
      status: "New",
      category: "Other",
      priority: "Low",
      description: "",
      attachments: [],
      dueDate: todayInput(),
      assigneeIds: [],
      associations: defaultAssociations,
    },
  });

  // Reset the form whenever the dialog opens for a new/different task.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset is keyed to open/task only, by design.
  React.useEffect(() => {
    if (!open) return;
    if (task) {
      form.reset({
        id: task.id,
        name: task.name,
        status: task.status,
        category: task.category,
        priority: task.priority,
        description: task.description ?? "",
        attachments: task.attachments ?? [],
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : todayInput(),
        assigneeIds: task.assignees.map((a) => a.userId),
        associations: task.associations.map((a) => ({ entityType: a.entityType, entityId: a.entityId })),
      });
    } else {
      form.reset({
        name: "",
        status: "New",
        category: "Other",
        priority: "Low",
        description: "",
        attachments: [],
        dueDate: todayInput(),
        assigneeIds: [],
        associations: defaultAssociations,
      });
    }
  }, [open, task]);

  // Load assignee (admin/advisor) and association (client/company) options once.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const [usersRes, clientsRes, companiesRes] = await Promise.all([getUsers(), getClients(), getCompanies()]);
      if (cancelled) return;

      if (usersRes.success && usersRes.users) {
        setAssigneeOptions(
          usersRes.users
            .filter((u) => u.role === "admin" || u.role === "advisor")
            .map((u) => ({
              value: u.uid,
              label: `${u.firstName} ${u.lastName}`.trim() || u.email,
              hint: u.role,
            })),
        );
      }

      const opts: MultiSelectOption[] = [];
      if (clientsRes.success && clientsRes.clients) {
        for (const c of clientsRes.clients) {
          opts.push({
            value: `client:${c.id}`,
            label: `${c.person?.firstName ?? ""} ${c.person?.lastName ?? ""}`.trim() || "Unnamed client",
            group: "Clients",
          });
        }
      }
      if (companiesRes.success && companiesRes.companies) {
        for (const c of companiesRes.companies) {
          opts.push({ value: `company:${c.id}`, label: c.name || "Unnamed company", group: "Companies" });
        }
      }
      setAssociationOptions(opts);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const current = form.getValues("attachments") ?? [];
      const uploaded: TaskAttachment[] = [];
      for (const file of Array.from(files)) {
        const filePath = `tasks/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(filePath);
        uploaded.push({
          id: crypto.randomUUID(),
          name: file.name,
          url: publicUrl,
          type: file.type || "file",
          uploadedAt: new Date().toISOString(),
        });
      }
      form.setValue("attachments", [...current, ...uploaded], { shouldDirty: true });
    } catch (err) {
      toast.error(`Upload failed: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(id?: string) {
    const current = form.getValues("attachments") ?? [];
    form.setValue(
      "attachments",
      current.filter((a) => a.id !== id),
      { shouldDirty: true },
    );
  }

  async function onSubmit(values: TaskFormValues) {
    setIsSaving(true);
    try {
      const result = isEditing ? await updateTask(task!.id!, values) : await createTask(values);
      if (result.success) {
        toast.success(isEditing ? "Task updated" : "Task created");
        onOpenChange(false);
        onSaved?.();
      } else {
        toast.error(result.error || "Failed to save task");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  const attachments = form.watch("attachments") ?? [];
  const status = form.watch("status");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Task" : "New Task"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the task details below." : "Create a task and assign it to admins or advisors."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Task name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TaskStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TaskPriorities.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TaskCategories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Create / Complete dates are system-managed and shown read-only when editing. */}
              {isEditing && (
                <div className="flex flex-col justify-end gap-1 text-sm text-muted-foreground">
                  {task?.createdAt && <div>Created {format(new Date(task.createdAt), "MMM d, yyyy")}</div>}
                  {status === "Complete" && task?.completeDate && (
                    <div>Completed {format(new Date(task.completeDate), "MMM d, yyyy")}</div>
                  )}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="assigneeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignees</FormLabel>
                  <MultiSelect
                    options={assigneeOptions}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Assign to admins or advisors…"
                    searchPlaceholder="Search team…"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="associations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associations</FormLabel>
                  <MultiSelect
                    options={associationOptions}
                    value={(field.value ?? []).map(assocKey)}
                    onChange={(keys) => field.onChange(keys.map(parseAssocKey))}
                    placeholder="Link clients or companies…"
                    searchPlaceholder="Search clients & companies…"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <RichTextEditor value={field.value ?? ""} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Attachments</FormLabel>
              <div className="space-y-2">
                {attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <a href={a.url} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline">
                      {a.name}
                    </a>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeAttachment(a.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Add files"}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || uploading}>
                {isSaving ? "Saving…" : isEditing ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
