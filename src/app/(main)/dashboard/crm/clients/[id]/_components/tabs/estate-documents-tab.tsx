"use client";

import { useState } from "react";

import { File as FileIcon, Loader2, Plus, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase.client";
import type { Client, EstateDocument, EstateDocumentType, EstatePartyRef } from "@/types/crm";

import { ClientHeaderPortal } from "../client-header-portal";

const DOCUMENT_TYPES: EstateDocumentType[] = ["Will", "Revocable Trust", "Irrevocable Trust", "Other"];

const isTrust = (type: string) => type === "Revocable Trust" || type === "Irrevocable Trust";

export interface EstateParty {
  id: string;
  name: string;
  kind: "person" | "company";
}

export interface EstateFirm {
  id: string;
  name: string;
}

/** Composite key so a Combobox can hold either a person or a company reference. */
const partyKey = (ref: EstatePartyRef) => `${ref.kind}:${ref.id}`;
const parsePartyKey = (key: string): EstatePartyRef => {
  const [kind, ...rest] = key.split(":");
  return { kind: kind as "person" | "company", id: rest.join(":") };
};

/**
 * Searchable single/multi picker. Results render inline (no portalled popup) so it works
 * reliably inside a modal Dialog, where a portalled combobox popup loses clicks to the
 * dialog's focus trap. Selection state is managed by the parent.
 */
function SearchSelect({
  options,
  selected,
  onChange,
  multiple = false,
  placeholder,
  emptyText = "No matches",
}: {
  options: { key: string; label: string; sublabel?: string }[];
  selected: string[];
  onChange: (keys: string[]) => void;
  multiple?: boolean;
  placeholder: string;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? options.filter((o) => o.label.toLowerCase().includes(trimmed) && !selected.includes(o.key)).slice(0, 8)
    : [];
  const selectedOptions = selected.map((k) => options.find((o) => o.key === k)).filter(Boolean) as {
    key: string;
    label: string;
    sublabel?: string;
  }[];

  const add = (key: string) => {
    if (multiple) {
      if (!selected.includes(key)) onChange([...selected, key]);
    } else {
      onChange([key]);
    }
    setQuery("");
  };

  return (
    <div className="space-y-2">
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} />
      {trimmed && (
        <div className="max-h-52 overflow-auto rounded-md border bg-popover p-1 shadow-sm">
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <button
                type="button"
                key={o.key}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => add(o.key)}
              >
                <span>{o.label}</span>
                {o.sublabel && <span className="text-muted-foreground text-xs">{o.sublabel}</span>}
              </button>
            ))
          ) : (
            <div className="px-2 py-1.5 text-center text-muted-foreground text-sm">{emptyText}</div>
          )}
        </div>
      )}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <Badge key={o.key} variant="secondary" className="gap-1">
              {o.label}
              {o.sublabel && <span className="text-muted-foreground text-xs">{o.sublabel}</span>}
              <button
                type="button"
                className="rounded-sm opacity-60 hover:opacity-100"
                onClick={() => onChange(selected.filter((k) => k !== o.key))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

interface FormState {
  type: EstateDocumentType | "";
  effectiveDate: string;
  amendmentDate: string;
  beneficiaries: string;
  trustName: string;
  attorneyFirmId: string;
  grantorKeys: string[];
  trusteeKeys: string[];
  description: string;
  files: File[];
}

const emptyForm: FormState = {
  type: "",
  effectiveDate: "",
  amendmentDate: "",
  beneficiaries: "",
  trustName: "",
  attorneyFirmId: "",
  grantorKeys: [],
  trusteeKeys: [],
  description: "",
  files: [],
};

export function EstateDocumentsTab({
  client,
  lawFirms,
  parties,
  useHeaderPortal = false,
  noCard = false,
}: {
  client: Client;
  lawFirms: EstateFirm[];
  parties: EstateParty[];
  useHeaderPortal?: boolean;
  noCard?: boolean;
}) {
  const [documents, setDocuments] = useState<EstateDocument[]>(client.estateDocuments || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [addFilesFor, setAddFilesFor] = useState<string | null>(null);

  const partyOptions = parties.map((p) => ({
    key: partyKey({ kind: p.kind, id: p.id }),
    label: p.name,
    sublabel: p.kind === "company" ? "Company" : "Person",
  }));
  const firmOptions = lawFirms.map((f) => ({ key: f.id, label: f.name }));

  const partyLabel = (ref?: EstatePartyRef) => {
    if (!ref) return null;
    const match = parties.find((p) => p.kind === ref.kind && p.id === ref.id);
    return match ? match.name : "Unknown";
  };
  const firmLabel = (id?: string) => (id ? lawFirms.find((f) => f.id === id)?.name || "Unknown firm" : null);

  const persist = async (updated: EstateDocument[]) => {
    const res = await updateClient(client.id!, { estateDocuments: updated });
    if (!res.success) throw new Error(res.error || "Failed to update database");
    setDocuments(updated);
  };

  const uploadFiles = async (repoId: string, files: File[]) => {
    const uploaded: EstateDocument["files"] = [];
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const randomStr = Math.random().toString(36).substring(7);
      const filePath = `clients/${client.id}/estateDocuments/${repoId}/${randomStr}_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("documents").upload(filePath, file);
      if (error) throw error;
      const {
        data: { publicUrl: url },
      } = supabase.storage.from("documents").getPublicUrl(filePath);
      uploaded.push({ id: crypto.randomUUID(), name: file.name, url, uploadedAt: new Date().toISOString() });
    }
    return uploaded;
  };

  const resetForm = () => setForm(emptyForm);

  const handleCreate = async () => {
    if (!form.type) {
      toast.error("Please select a document type");
      return;
    }
    if (form.files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    try {
      setIsUploading(true);
      const repoId = crypto.randomUUID();
      const uploaded = await uploadFiles(repoId, form.files);

      const newDoc: EstateDocument = {
        id: repoId,
        type: form.type,
        files: uploaded,
        trustees: [],
        createdAt: new Date().toISOString(),
      };

      if (form.type === "Will") {
        newDoc.effectiveDate = form.effectiveDate || undefined;
        newDoc.beneficiaries = form.beneficiaries || undefined;
      } else if (isTrust(form.type)) {
        newDoc.trustName = form.trustName || undefined;
        newDoc.effectiveDate = form.effectiveDate || undefined;
        newDoc.amendmentDate = form.amendmentDate || undefined;
        newDoc.attorneyFirmId = form.attorneyFirmId || undefined;
        newDoc.grantor = form.grantorKeys[0] ? parsePartyKey(form.grantorKeys[0]) : undefined;
        newDoc.trustees = form.trusteeKeys.map(parsePartyKey);
        newDoc.beneficiaries = form.beneficiaries || undefined;
      } else if (form.type === "Other") {
        newDoc.description = form.description || undefined;
      }

      await persist([...documents, newDoc]);
      toast.success("Document added successfully");
      resetForm();
      setIsDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to add document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddFiles = async (repoId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    try {
      setAddFilesFor(repoId);
      const uploaded = await uploadFiles(repoId, Array.from(fileList));
      const updated = documents.map((d) => (d.id === repoId ? { ...d, files: [...(d.files || []), ...uploaded] } : d));
      await persist(updated);
      toast.success("File(s) added");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to add file(s)");
    } finally {
      setAddFilesFor(null);
    }
  };

  const handleDeleteFile = async (repoId: string, fileId: string) => {
    try {
      const updated = documents.map((d) =>
        d.id === repoId ? { ...d, files: (d.files || []).filter((f) => f.id !== fileId) } : d,
      );
      await persist(updated);
      toast.success("File removed");
    } catch (_e) {
      toast.error("Failed to remove file");
    }
  };

  const handleDeleteDocument = async (repoId: string) => {
    try {
      await persist(documents.filter((d) => d.id !== repoId));
      toast.success("Document removed");
    } catch (_e) {
      toast.error("Failed to remove document");
    }
  };

  const canSubmit = !!form.type && form.files.length > 0 && !isUploading;

  const headerActions = (
    <Button onClick={() => setIsDialogOpen(true)} size="sm" className="ml-4 shrink-0">
      <Plus className="mr-2 h-4 w-4" /> Add Document
    </Button>
  );

  const dialog = (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Estate Planning Document</DialogTitle>
          <DialogDescription>
            Choose a document type, then fill in its details and attach one or more files.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="estate-doc-type">Document Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...emptyForm, type: v as EstateDocumentType })}>
              <SelectTrigger id="estate-doc-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Will */}
          {form.type === "Will" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="will-effective-date">Effective Date of Will</Label>
                <Input
                  id="will-effective-date"
                  type="date"
                  value={form.effectiveDate}
                  onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="will-beneficiaries">Beneficiaries</Label>
                <Textarea
                  id="will-beneficiaries"
                  value={form.beneficiaries}
                  onChange={(e) => setForm({ ...form, beneficiaries: e.target.value })}
                  placeholder="List beneficiaries..."
                />
              </div>
            </>
          )}

          {/* Revocable / Irrevocable Trust */}
          {isTrust(form.type) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="trust-name">Name of Trust</Label>
                <Input
                  id="trust-name"
                  value={form.trustName}
                  onChange={(e) => setForm({ ...form, trustName: e.target.value })}
                  placeholder="e.g. The Smith Family Revocable Trust"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="trust-effective-date">Effective Date</Label>
                  <Input
                    id="trust-effective-date"
                    type="date"
                    value={form.effectiveDate}
                    onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trust-amendment-date">Amendment Date</Label>
                  <Input
                    id="trust-amendment-date"
                    type="date"
                    value={form.amendmentDate}
                    onChange={(e) => setForm({ ...form, amendmentDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trust-attorney">Attorney</Label>
                <Select value={form.attorneyFirmId} onValueChange={(v) => setForm({ ...form, attorneyFirmId: v })}>
                  <SelectTrigger id="trust-attorney">
                    <SelectValue placeholder="Select a law firm" />
                  </SelectTrigger>
                  <SelectContent>
                    {firmOptions.length > 0 ? (
                      firmOptions.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No law firms available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Grantor</Label>
                <SearchSelect
                  options={partyOptions}
                  selected={form.grantorKeys}
                  onChange={(keys) => setForm({ ...form, grantorKeys: keys.slice(-1) })}
                  placeholder="Search people or companies..."
                />
              </div>
              <div className="space-y-2">
                <Label>Trustees</Label>
                <SearchSelect
                  options={partyOptions}
                  selected={form.trusteeKeys}
                  onChange={(keys) => setForm({ ...form, trusteeKeys: keys })}
                  multiple
                  placeholder="Search people or companies..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trust-beneficiaries">Beneficiaries</Label>
                <Textarea
                  id="trust-beneficiaries"
                  value={form.beneficiaries}
                  onChange={(e) => setForm({ ...form, beneficiaries: e.target.value })}
                  placeholder="List beneficiaries..."
                />
              </div>
            </>
          )}

          {/* Other */}
          {form.type === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="other-description">Description</Label>
              <Textarea
                id="other-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe this document..."
              />
            </div>
          )}

          {form.type && (
            <div className="space-y-2">
              <Label htmlFor="estate-files">Files</Label>
              <input
                id="estate-files"
                type="file"
                multiple
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setForm({ ...form, files: e.target.files ? Array.from(e.target.files) : [] })}
              />
              {form.files.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {form.files.length} file{form.files.length === 1 ? "" : "s"} selected
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={!canSubmit}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" /> Add Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const mainContent = (
    <div className="space-y-6">
      {useHeaderPortal && <ClientHeaderPortal sectionName="Estate Planning">{headerActions}</ClientHeaderPortal>}

      {dialog}

      <div className="mt-4 space-y-4">
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="rounded-lg border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{doc.type}</Badge>
                    {doc.trustName && <span className="font-medium text-foreground text-sm">{doc.trustName}</span>}
                  </div>
                  <EstateMeta doc={doc} partyLabel={partyLabel} firmLabel={firmLabel} />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteDocument(doc.id)}
                  title="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 space-y-2 border-t pt-3">
                {(doc.files || []).length > 0 ? (
                  (doc.files || []).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-md border bg-muted/10 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <FileIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" asChild>
                          <a href={f.url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteFile(doc.id, f.id)}
                          title="Remove file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-xs italic">No files in this document yet.</p>
                )}

                <div>
                  <label
                    htmlFor={`add-files-${doc.id}`}
                    className="inline-flex cursor-pointer items-center text-primary text-xs hover:underline"
                  >
                    {addFilesFor === doc.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="mr-1 h-3 w-3" />
                    )}
                    Add file(s)
                  </label>
                  <input
                    id={`add-files-${doc.id}`}
                    type="file"
                    multiple
                    className="hidden"
                    disabled={addFilesFor === doc.id}
                    onChange={(e) => {
                      handleAddFiles(doc.id, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border-2 border-dashed bg-muted/10 p-8 text-center text-muted-foreground">
            <FileIcon className="mx-auto mb-3 h-8 w-8 opacity-20" />
            <p className="text-sm">No estate planning documents yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (noCard) {
    return mainContent;
  }

  return (
    <Card className="fade-in animate-in border-none bg-gradient-to-b from-card to-muted/20 shadow-md duration-500">
      {!useHeaderPortal && (
        <CardHeader className="flex flex-row items-center justify-between bg-muted/10 pb-4">
          <CardTitle>Estate Planning Documents</CardTitle>
          {headerActions}
        </CardHeader>
      )}
      <CardContent className="space-y-6 pt-6">{mainContent}</CardContent>
    </Card>
  );
}

/** Renders the type-specific metadata summary for a saved estate document. */
function EstateMeta({
  doc,
  partyLabel,
  firmLabel,
}: {
  doc: EstateDocument;
  partyLabel: (ref?: EstatePartyRef) => string | null;
  firmLabel: (id?: string) => string | null;
}) {
  const rows: { label: string; value: string }[] = [];

  if (doc.type === "Will") {
    if (doc.effectiveDate) rows.push({ label: "Effective Date", value: doc.effectiveDate });
    if (doc.beneficiaries) rows.push({ label: "Beneficiaries", value: doc.beneficiaries });
  } else if (doc.type === "Revocable Trust" || doc.type === "Irrevocable Trust") {
    if (doc.effectiveDate) rows.push({ label: "Effective Date", value: doc.effectiveDate });
    if (doc.amendmentDate) rows.push({ label: "Amendment Date", value: doc.amendmentDate });
    const attorney = firmLabel(doc.attorneyFirmId);
    if (attorney) rows.push({ label: "Attorney", value: attorney });
    const grantor = partyLabel(doc.grantor);
    if (grantor) rows.push({ label: "Grantor", value: grantor });
    const trustees = (doc.trustees || []).map((t) => partyLabel(t)).filter(Boolean) as string[];
    if (trustees.length) rows.push({ label: "Trustees", value: trustees.join(", ") });
    if (doc.beneficiaries) rows.push({ label: "Beneficiaries", value: doc.beneficiaries });
  } else if (doc.type === "Other") {
    if (doc.description) rows.push({ label: "Description", value: doc.description });
  }

  if (rows.length === 0) return null;

  return (
    <dl className="grid gap-x-6 gap-y-0.5 text-xs sm:grid-cols-[auto_1fr]">
      {rows.map((r) => (
        <div key={r.label} className="sm:contents">
          <dt className="font-medium text-muted-foreground">{r.label}</dt>
          <dd className="mb-1 text-foreground sm:mb-0">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
