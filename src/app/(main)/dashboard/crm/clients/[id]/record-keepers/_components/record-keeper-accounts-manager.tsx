"use client";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowUpRight, Check, ChevronsUpDown, Database, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { linkClientToRecordKeeper } from "@/actions/record-keepers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency } from "@/lib/utils";
import type { Client, RecordKeeperAccount } from "@/types/crm";

import { ClientHeaderPortal } from "../../_components/client-header-portal";

interface NamedOption {
  id: string;
  name: string;
}

interface RecordKeeperAccountsManagerProps {
  client: Client;
  /** Record keeper firms selectable for an account and used to group the landing page. */
  recordKeepers: NamedOption[];
  /** Admin "Financial Type" list. */
  financialTypes: NamedOption[];
}

const NONE_SELECT = "__none__";

// --- Form state ---------------------------------------------------------------------------------

interface FormState {
  recordKeeperId: string;
  financialTypeId: string;
  accountNumber: string;
  title: string;
  value: string;
  managementBeginDate: string;
  closeDate: string;
  notes: string;
}

const emptyForm: FormState = {
  recordKeeperId: "",
  financialTypeId: "",
  accountNumber: "",
  title: "",
  value: "",
  managementBeginDate: "",
  closeDate: "",
  notes: "",
};

const formFromAccount = (a: RecordKeeperAccount): FormState => ({
  recordKeeperId: a.recordKeeperId || "",
  financialTypeId: a.financialTypeId || "",
  accountNumber: a.accountNumber || "",
  title: a.title || "",
  value: a.value != null ? String(a.value) : "",
  managementBeginDate: a.managementBeginDate || "",
  closeDate: a.closeDate || "",
  notes: a.notes || "",
});

const formatDate = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
};

// --- Main manager -------------------------------------------------------------------------------

export function RecordKeeperAccountsManager({
  client,
  recordKeepers,
  financialTypes,
}: RecordKeeperAccountsManagerProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();

  const [accounts, setAccounts] = useState<RecordKeeperAccount[]>(
    (client.recordKeeperAccounts as RecordKeeperAccount[]) || [],
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [keeperComboOpen, setKeeperComboOpen] = useState(false);

  const isEditing = editingId !== null;

  // Lookup maps for names shown on the cards.
  const keeperNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const k of recordKeepers) map.set(k.id, k.name);
    return map;
  }, [recordKeepers]);
  const financialTypeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of financialTypes) map.set(t.id, t.name);
    return map;
  }, [financialTypes]);

  // Group accounts by record keeper. Only keepers that have at least one account get a group.
  const groups = useMemo(() => {
    const byKeeper = new Map<string, RecordKeeperAccount[]>();
    for (const a of accounts) {
      const key = a.recordKeeperId || "";
      const list = byKeeper.get(key) || [];
      list.push(a);
      byKeeper.set(key, list);
    }
    return Array.from(byKeeper.entries())
      .map(([keeperId, list]) => ({
        keeperId,
        keeperName: keeperNameById.get(keeperId) || "Unknown Record Keeper",
        accounts: list,
      }))
      .sort((a, b) => a.keeperName.localeCompare(b.keeperName));
  }, [accounts, keeperNameById]);

  const persist = async (updated: RecordKeeperAccount[]) => {
    const res = await updateClient(client.id!, { recordKeeperAccounts: updated });
    if (!res.success) throw new Error(res.error || "Failed to save changes");
    setAccounts(updated);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreate = (recordKeeperId = "") => {
    resetForm();
    setForm({ ...emptyForm, recordKeeperId });
    setIsDialogOpen(true);
  };

  const openEdit = (account: RecordKeeperAccount) => {
    setEditingId(account.id);
    setForm(formFromAccount(account));
    setIsDialogOpen(true);
  };

  /** Build the persisted record from the form, validating the value. */
  const buildAccount = (): Omit<RecordKeeperAccount, "id" | "createdAt" | "updatedAt"> | null => {
    if (!form.recordKeeperId) {
      toast.error("Please select a record keeper");
      return null;
    }
    const value = form.value.trim() === "" ? 0 : Number.parseFloat(form.value);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Value must be a positive number");
      return null;
    }
    return {
      ownerIds: client.id ? [client.id] : [],
      ownershipType: "INDIVIDUAL",
      recordKeeperId: form.recordKeeperId,
      financialTypeId: form.financialTypeId || undefined,
      accountNumber: form.accountNumber.trim() || undefined,
      title: form.title.trim() || undefined,
      value,
      managementBeginDate: form.managementBeginDate || undefined,
      closeDate: form.closeDate || undefined,
      notes: form.notes.trim() || undefined,
    };
  };

  /** Keep the record keeper firm associated with the client (drives the Associated Vendors view). */
  const ensureKeeperLinked = async (keeperId: string) => {
    try {
      const res = await linkClientToRecordKeeper(keeperId, client.id!);
      if (res.success) window.dispatchEvent(new CustomEvent("association-change"));
    } catch {
      // Non-fatal: the account is saved regardless of the association link.
    }
  };

  const handleSubmit = async () => {
    const built = buildAccount();
    if (!built) return;

    setIsSaving(true);
    try {
      if (isEditing && editingId) {
        const updated = accounts.map((a) =>
          a.id === editingId ? { ...a, ...built, updatedAt: new Date().toISOString() } : a,
        );
        await persist(updated);
        toast.success("Account updated");
      } else {
        const newAccount: RecordKeeperAccount = {
          id: crypto.randomUUID(),
          ...built,
          createdAt: new Date().toISOString(),
        };
        await persist([...accounts, newAccount]);
        toast.success("Account added");
      }
      await ensureKeeperLinked(built.recordKeeperId);
      setIsDialogOpen(false);
      resetForm();
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save account");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      await persist(accounts.filter((a) => a.id !== accountId));
      toast.success("Account deleted");
      startTransition(() => router.refresh());
    } catch (_e) {
      toast.error("Failed to delete account");
    }
  };

  const selectedKeeperName = form.recordKeeperId ? keeperNameById.get(form.recordKeeperId) : "";

  const renderAccountCard = (account: RecordKeeperAccount) => {
    const isClosed = Boolean(account.closeDate);
    const financialTypeName = account.financialTypeId ? financialTypeNameById.get(account.financialTypeId) : null;
    return (
      <div
        key={account.id}
        className="rounded-xl border border-muted/20 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-base text-foreground leading-tight">
                {account.title || account.accountNumber || "Untitled Account"}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0",
                  isClosed
                    ? "border-muted-foreground/30 text-muted-foreground"
                    : "border-emerald-500/30 bg-emerald-500/5 text-emerald-600",
                )}
              >
                {isClosed ? "Closed" : "Open"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
              {account.accountNumber && <span>Account #: {account.accountNumber}</span>}
              {financialTypeName && <span>Type: {financialTypeName}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
              {account.managementBeginDate && <span>Managed since: {formatDate(account.managementBeginDate)}</span>}
              {account.closeDate && <span>Closed: {formatDate(account.closeDate)}</span>}
            </div>
            {account.notes && (
              <p className="mt-1 text-muted-foreground text-xs whitespace-pre-wrap">
                <span className="font-medium text-foreground">Notes:</span> {account.notes}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-bold text-base text-foreground tabular-nums">
              {formatCurrency(Number(account.value) || 0)}
            </span>
            <Button variant="ghost" size="icon" onClick={() => openEdit(account)} title="Edit account">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(account.id)}
              title="Delete account"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <ClientHeaderPortal sectionName="Record Keepers">
        <Button
          size="sm"
          onClick={() => openCreate()}
          disabled={recordKeepers.length === 0}
          className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Account
        </Button>
      </ClientHeaderPortal>

      {recordKeepers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-2 border-muted/30 border-dashed bg-muted/5 px-6 py-12 text-center text-muted-foreground">
          <Database className="mb-4 h-12 w-12 opacity-20" />
          <h3 className="font-bold text-foreground text-sm">No Record Keepers Available</h3>
          <p className="mt-1 max-w-sm text-xs">Create a record keeper firm before adding accounts.</p>
          <Button variant="outline" size="sm" asChild className="mt-6">
            <Link href={`/dashboard/admin/record-keepers/new?clientId=${client.id}`}>Create Record Keeper</Link>
          </Button>
        </Card>
      ) : accounts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-2 border-muted/30 border-dashed bg-muted/5 px-6 py-12 text-center text-muted-foreground">
          <Database className="mb-4 h-12 w-12 opacity-20" />
          <h3 className="font-bold text-foreground text-sm">No Record Keeper Accounts</h3>
          <p className="mt-1 max-w-sm text-xs">
            Add an account to track its value and financial type. Each account's value is included in the client's total
            net worth.
          </p>
          <Button size="sm" onClick={() => openCreate()} className="mt-6">
            <Plus className="mr-1.5 h-4 w-4" /> Add Account
          </Button>
        </Card>
      ) : (
        <div className="max-w-4xl space-y-10">
          {groups.map((group) => {
            const groupTotal = group.accounts.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
            return (
              <div key={group.keeperId || "unknown"} className="space-y-4">
                <div className="border-muted/20 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="flex items-center gap-1 font-bold text-foreground text-lg">
                      <span>{group.keeperName}</span>
                      {group.keeperId && (
                        <Link
                          href={`/dashboard/admin/record-keepers/${group.keeperId}?clientId=${client.id}`}
                          className="text-muted-foreground transition-colors hover:text-primary"
                        >
                          <ArrowUpRight className="inline h-4 w-4" />
                        </Link>
                      )}
                    </h3>
                    <Badge variant="secondary" className="ml-1 tabular-nums">
                      {formatCurrency(groupTotal)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCreate(group.keeperId)}
                      className="ml-auto text-muted-foreground text-xs hover:text-foreground"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Account
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pl-2 md:pl-4">{group.accounts.map(renderAccountCard)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Account Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto border border-muted/20 bg-background sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              {isEditing ? "Edit" : "Add"} Record Keeper Account
            </DialogTitle>
            <DialogDescription>
              Enter the account details. The status is Open until a close date is set.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Record Keeper */}
            <div className="space-y-2">
              <Label>
                Record Keeper <span className="text-destructive">*</span>
              </Label>
              <Popover open={keeperComboOpen} onOpenChange={setKeeperComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={keeperComboOpen}
                    className="w-full justify-between text-left font-normal text-sm"
                  >
                    {selectedKeeperName || "Select record keeper"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search record keepers..." />
                    <CommandList>
                      <CommandEmpty>No record keepers found.</CommandEmpty>
                      <CommandGroup>
                        {recordKeepers.map((keeper) => (
                          <CommandItem
                            key={keeper.id}
                            value={keeper.name}
                            onSelect={() => {
                              setForm((f) => ({ ...f, recordKeeperId: keeper.id }));
                              setKeeperComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 opacity-0",
                                form.recordKeeperId === keeper.id && "opacity-100",
                              )}
                            />
                            {keeper.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Financial Type */}
              <div className="space-y-2">
                <Label>Financial Type</Label>
                <Select
                  value={form.financialTypeId || NONE_SELECT}
                  onValueChange={(v) => setForm({ ...form, financialTypeId: v === NONE_SELECT ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_SELECT}>— None —</SelectItem>
                    {financialTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rk-account-number">Account Number</Label>
                <Input
                  id="rk-account-number"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="e.g. 1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rk-title">Title</Label>
                <Input
                  id="rk-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 401(k) Plan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rk-value">Value ($)</Label>
                <Input
                  id="rk-value"
                  type="number"
                  step="0.01"
                  min={0}
                  inputMode="decimal"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rk-begin-date">Management Begin Date</Label>
                <Input
                  id="rk-begin-date"
                  type="date"
                  value={form.managementBeginDate}
                  onChange={(e) => setForm({ ...form, managementBeginDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rk-close-date">Close Date</Label>
                <Input
                  id="rk-close-date"
                  type="date"
                  value={form.closeDate}
                  onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
                />
                <p className="text-muted-foreground text-xs">Leave empty to keep the account Open.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rk-notes">Notes</Label>
              <Textarea
                id="rk-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Enter any notes about this account..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : isEditing ? (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
