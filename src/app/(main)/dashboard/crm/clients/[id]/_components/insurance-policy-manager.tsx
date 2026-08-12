"use client";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronsUpDown,
  File as FileIcon,
  Globe,
  Loader2,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { supabase } from "@/lib/supabase.client";
import { cn, formatCurrency, formatPhoneNumber } from "@/lib/utils";
import type {
  Client,
  InsuranceAgency,
  InsuranceBeneficiary,
  InsuranceBeneficiaryRef,
  InsurancePolicy,
} from "@/types/crm";

import { ClientHeaderPortal } from "./client-header-portal";

/** Which client column this manager reads/writes. */
export type PolicyField = "lifePolicies" | "disabilityPolicies" | "ltcPolicies";

/** A vendor insurance company (shape shared by Life / Disability / LTC companies). */
export interface VendorCompany {
  id?: string;
  name: string;
  websiteUrl?: string;
  phone?: string | null;
  clientIds?: string[] | null;
}

/** A selectable person or company for the beneficiary picker. */
export interface BeneficiaryParty {
  id: string;
  name: string;
  kind: "person" | "company";
}

type ActionResult = { success: boolean; error?: string };

interface Option {
  key: string;
  label: string;
  sublabel?: string;
}

interface InsurancePolicyManagerProps {
  client: Client;
  /** Vendor companies of this insurance type, each carrying its own `clientIds`. */
  companies: VendorCompany[];
  /** People and companies selectable as beneficiaries. Trusts are derived from the client's estate documents. */
  parties: BeneficiaryParty[];
  policyField: PolicyField;
  /** Human label, e.g. "Life Insurance". */
  sectionName: string;
  /** Admin route base for the company detail/create links. */
  adminBasePath: string;
  insuranceAgencies?: InsuranceAgency[];
  linkCompany: (companyId: string, clientId: string) => Promise<ActionResult>;
  unlinkCompany: (companyId: string, clientId: string) => Promise<ActionResult>;
}

// --- Beneficiary reference helpers ---------------------------------------------------------------

const refKey = (ref: InsuranceBeneficiaryRef) => `${ref.kind}:${ref.id}`;
const parseRefKey = (key: string): InsuranceBeneficiaryRef => {
  const [kind, ...rest] = key.split(":");
  return { kind: kind as InsuranceBeneficiaryRef["kind"], id: rest.join(":") };
};

// --- Form state ---------------------------------------------------------------------------------

interface BeneficiaryRow {
  rowId: string;
  key: string; // composite beneficiary key, "" when unselected
  percent: string; // kept as string for the controlled number input
}

interface FormFile {
  file: File;
  title: "Issued Illustration" | "Policy Receipts" | "Other";
}

interface FormState {
  companyId: string;
  policyNumber: string;
  policyName: string;
  issueDate: string;
  renewalDate: string;
  anniversaryDate: string;
  premiumFrequency: "Monthly" | "Quarterly" | "Semi-Annual" | "Annually" | "";
  premiumPayment: number;
  note: string;
  eliminationPeriod: "60 days" | "90 days" | "120 days" | "365 days" | "";
  beneficiaries: BeneficiaryRow[];
  contingentBeneficiaries: BeneficiaryRow[];
  files: FormFile[];
  isUnderManagement: boolean;
  managingAgencyId: string;
}

const emptyForm: FormState = {
  companyId: "",
  policyNumber: "",
  policyName: "",
  issueDate: "",
  renewalDate: "",
  anniversaryDate: "",
  premiumFrequency: "",
  premiumPayment: 0,
  note: "",
  eliminationPeriod: "",
  beneficiaries: [],
  contingentBeneficiaries: [],
  files: [],
  isUnderManagement: false,
  managingAgencyId: "",
};

const rowsFromBeneficiaries = (list: InsuranceBeneficiary[]): BeneficiaryRow[] =>
  (list || []).map((b) => ({ rowId: crypto.randomUUID(), key: refKey(b.ref), percent: String(b.percent ?? "") }));

const formFromPolicy = (p: InsurancePolicy): FormState => ({
  companyId: p.companyId || "",
  policyNumber: p.policyNumber || "",
  policyName: p.policyName || "",
  issueDate: p.issueDate || "",
  renewalDate: p.renewalDate || p.anniversaryDate || "",
  anniversaryDate: p.anniversaryDate || p.renewalDate || "",
  premiumFrequency: p.premiumFrequency || "",
  premiumPayment: p.premiumPayment ?? 0,
  note: p.note || "",
  eliminationPeriod: p.eliminationPeriod || "",
  beneficiaries: rowsFromBeneficiaries(p.beneficiaries),
  contingentBeneficiaries: rowsFromBeneficiaries(p.contingentBeneficiaries),
  files: [],
  isUnderManagement: p.isUnderManagement ?? false,
  managingAgencyId: p.managingAgencyId || "",
});

/** Convert form rows into stored beneficiaries, dropping unselected rows. Returns null if any row's percent is invalid. */
const beneficiariesFromRows = (rows: BeneficiaryRow[]): InsuranceBeneficiary[] | null => {
  const result: InsuranceBeneficiary[] = [];
  for (const row of rows) {
    if (!row.key) continue;
    const percent = Number.parseFloat(row.percent);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) return null;
    result.push({ id: crypto.randomUUID(), ref: parseRefKey(row.key), percent });
  }
  return result;
};

const sumPercent = (rows: BeneficiaryRow[]) =>
  rows.reduce((acc, r) => acc + (r.key ? Number.parseFloat(r.percent) || 0 : 0), 0);

// --- Single-select searchable picker (inline results; safe inside a modal Dialog) ----------------

function BeneficiaryPicker({
  options,
  value,
  onChange,
  placeholder = "Search people, companies, or trusts...",
}: {
  options: Option[];
  value: string;
  onChange: (key: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const selected = value ? options.find((o) => o.key === value) : undefined;

  if (selected) {
    return (
      <div className="flex h-10 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm">
        <span className="truncate">
          {selected.label}
          {selected.sublabel && <span className="ml-1 text-muted-foreground text-xs">({selected.sublabel})</span>}
        </span>
        <button
          type="button"
          className="shrink-0 rounded-sm opacity-60 hover:opacity-100"
          onClick={() => onChange("")}
          title="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed ? options.filter((o) => o.label.toLowerCase().includes(trimmed)).slice(0, 8) : [];

  return (
    <div className="space-y-1">
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} />
      {trimmed && (
        <div className="max-h-52 overflow-auto rounded-md border bg-popover p-1 shadow-sm">
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <button
                type="button"
                key={o.key}
                className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onChange(o.key);
                  setQuery("");
                }}
              >
                <span>{o.label}</span>
                {o.sublabel && <span className="text-muted-foreground text-xs">{o.sublabel}</span>}
              </button>
            ))
          ) : (
            <div className="px-2 py-1.5 text-center text-muted-foreground text-sm">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Repeating beneficiary rows -----------------------------------------------------------------

function BeneficiaryRows({
  title,
  rows,
  options,
  onChange,
}: {
  title: string;
  rows: BeneficiaryRow[];
  options: Option[];
  onChange: (rows: BeneficiaryRow[]) => void;
}) {
  const total = sumPercent(rows);
  const over = total > 100;

  const setRow = (rowId: string, patch: Partial<BeneficiaryRow>) =>
    onChange(rows.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  const addRow = () => onChange([...rows, { rowId: crypto.randomUUID(), key: "", percent: "" }]);
  const removeRow = (rowId: string) => onChange(rows.filter((r) => r.rowId !== rowId));

  return (
    <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{title}</Label>
        {rows.length > 0 && (
          <span className={cn("text-xs", over ? "font-semibold text-destructive" : "text-muted-foreground")}>
            Total: {total}%
          </span>
        )}
      </div>

      {rows.map((row) => (
        <div key={row.rowId} className="flex items-start gap-2">
          <div className="flex-1">
            <BeneficiaryPicker options={options} value={row.key} onChange={(key) => setRow(row.rowId, { key })} />
          </div>
          <div className="relative w-24 shrink-0">
            <Input
              type="number"
              min={0}
              max={100}
              inputMode="decimal"
              placeholder="%"
              className="pr-6"
              value={row.percent}
              onChange={(e) => setRow(row.rowId, { percent: e.target.value })}
            />
            <span className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-2 text-muted-foreground text-xs">
              %
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive hover:bg-destructive/10"
            onClick={() => removeRow(row.rowId)}
            title="Remove beneficiary"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {over && <p className="text-destructive text-xs">Total cannot exceed 100%.</p>}

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="w-full">
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add {title.toLowerCase().includes("contingent") ? "contingent " : ""}
        beneficiary
      </Button>
    </div>
  );
}

// --- Main manager -------------------------------------------------------------------------------

export function InsurancePolicyManager({
  client,
  companies,
  parties,
  policyField,
  sectionName,
  adminBasePath,
  insuranceAgencies = [],
  linkCompany,
  unlinkCompany,
}: InsurancePolicyManagerProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();

  const [policies, setPolicies] = useState<InsurancePolicy[]>((client[policyField] as InsurancePolicy[]) || []);

  // Add / edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [companyComboOpen, setCompanyComboOpen] = useState(false);
  const [addFilesFor, setAddFilesFor] = useState<string | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<{
    policyId: string;
    files: FormFile[];
  } | null>(null);

  // Link company dialog
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkCompanyId, setLinkCompanyId] = useState("");
  const [linkComboOpen, setLinkComboOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const isEditing = editingId !== null;

  // Beneficiary picker options: all people + all companies + this client's estate trusts.
  const beneficiaryOptions = useMemo<Option[]>(() => {
    const partyOptions = parties.map((p) => ({
      key: refKey({ kind: p.kind, id: p.id }),
      label: p.name,
      sublabel: p.kind === "company" ? "Company" : "Person",
    }));
    const trustOptions = (client.estateDocuments || [])
      .filter((d) => d.type === "Revocable Trust" || d.type === "Irrevocable Trust")
      .map((d) => ({ key: `trust:${d.id}`, label: d.trustName || "Unnamed Trust", sublabel: "Trust" }));
    return [...partyOptions, ...trustOptions];
  }, [parties, client.estateDocuments]);

  const beneficiaryLabelByKey = useMemo(() => {
    const map = new Map<string, Option>();
    for (const o of beneficiaryOptions) map.set(o.key, o);
    return map;
  }, [beneficiaryOptions]);

  const beneficiaryLabel = (ref: InsuranceBeneficiaryRef) => beneficiaryLabelByKey.get(refKey(ref))?.label ?? "Unknown";

  const associatedCompanies = useMemo(
    () => companies.filter((c) => c.clientIds?.includes(client.id || "")),
    [companies, client.id],
  );
  const availableCompaniesToLink = useMemo(
    () => companies.filter((c) => !c.clientIds?.includes(client.id || "")),
    [companies, client.id],
  );
  const companyNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of companies) if (c.id) map.set(c.id, c.name);
    return map;
  }, [companies]);

  const policiesByCompany = useMemo(() => {
    const map = new Map<string, InsurancePolicy[]>();
    for (const p of policies) {
      if (p.companyId) {
        const list = map.get(p.companyId) || [];
        list.push(p);
        map.set(p.companyId, list);
      }
    }
    return map;
  }, [policies]);

  // Policies with no company, or a company that is not currently associated.
  const generalPolicies = useMemo(
    () => policies.filter((p) => !p.companyId || !associatedCompanies.some((c) => c.id === p.companyId)),
    [policies, associatedCompanies],
  );

  const persist = async (updated: InsurancePolicy[]) => {
    const res = await updateClient(client.id!, { [policyField]: updated });
    if (!res.success) throw new Error(res.error || "Failed to save changes");
    setPolicies(updated);
  };

  const uploadFilesWithMetadata = async (
    policyId: string,
    formFiles: FormFile[],
  ): Promise<InsurancePolicy["files"]> => {
    const uploaded: InsurancePolicy["files"] = [];
    for (const item of formFiles) {
      const { file, title } = item;
      const fileExt = file.name.split(".").pop();
      const randomStr = Math.random().toString(36).substring(7);
      const filePath = `clients/${client.id}/${policyField}/${policyId}/${randomStr}_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from("documents").upload(filePath, file);
      if (error) throw error;
      const {
        data: { publicUrl: url },
      } = supabase.storage.from("documents").getPublicUrl(filePath);
      uploaded.push({
        id: crypto.randomUUID(),
        name: file.name,
        url,
        title,
        uploadedAt: new Date().toISOString(),
      });
    }
    return uploaded;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreate = (companyId = "") => {
    resetForm();
    setForm({ ...emptyForm, companyId });
    setIsDialogOpen(true);
  };

  const openEdit = (policy: InsurancePolicy) => {
    setEditingId(policy.id);
    setForm(formFromPolicy(policy));
    setIsDialogOpen(true);
  };

  const buildPolicyMetadata = (): Omit<InsurancePolicy, "id" | "files"> | null => {
    if (!form.companyId) {
      toast.error("Insurance Company is a required field");
      return null;
    }
    if (form.premiumPayment === undefined || form.premiumPayment < 0) {
      toast.error("Premium Payment is required and must be at least 0");
      return null;
    }
    const beneficiaries = beneficiariesFromRows(form.beneficiaries);
    const contingentBeneficiaries = beneficiariesFromRows(form.contingentBeneficiaries);
    if (!beneficiaries || !contingentBeneficiaries) {
      toast.error("Each beneficiary percentage must be between 0 and 100");
      return null;
    }
    if (beneficiaries.reduce((a, b) => a + b.percent, 0) > 100) {
      toast.error("Total of all beneficiaries cannot exceed 100%");
      return null;
    }
    if (contingentBeneficiaries.reduce((a, b) => a + b.percent, 0) > 100) {
      toast.error("Total of all contingent beneficiaries cannot exceed 100%");
      return null;
    }

    const dateVal = form.anniversaryDate || form.renewalDate;

    return {
      ownerIds: client.id ? [client.id] : [],
      ownershipType: "INDIVIDUAL",
      companyId: form.companyId || undefined,
      policyNumber: form.policyNumber.trim() || undefined,
      policyName: form.policyName.trim() || undefined,
      issueDate: form.issueDate || undefined,
      renewalDate: dateVal || undefined,
      anniversaryDate: dateVal || undefined,
      premiumFrequency: form.premiumFrequency || undefined,
      premiumPayment: form.premiumPayment ?? 0,
      note: form.note || undefined,
      eliminationPeriod: form.eliminationPeriod || undefined,
      beneficiaries,
      contingentBeneficiaries,
      isUnderManagement: form.isUnderManagement,
      managingAgencyId: form.isUnderManagement ? undefined : form.managingAgencyId || undefined,
    };
  };

  /** Link the selected vendor company to the client if it isn't already associated. */
  const ensureCompanyLinked = async (companyId?: string) => {
    if (!companyId || associatedCompanies.some((c) => c.id === companyId)) return;
    const res = await linkCompany(companyId, client.id!);
    if (res.success) {
      window.dispatchEvent(new CustomEvent("association-change"));
    } else {
      toast.warning("Policy saved, but the company could not be linked automatically.");
    }
  };

  const handleSubmit = async () => {
    if (!form.policyName.trim() && !form.policyNumber.trim()) {
      toast.error("Please enter a policy name or policy number");
      return;
    }
    const metadata = buildPolicyMetadata();
    if (!metadata) return;

    setIsSaving(true);
    try {
      if (isEditing && editingId) {
        const existing = policies.find((p) => p.id === editingId);
        const uploaded = form.files.length > 0 ? await uploadFilesWithMetadata(editingId, form.files) : [];
        const updated = policies.map((p) =>
          p.id === editingId
            ? {
                ...p,
                ...metadata,
                files: [...(existing?.files || []), ...uploaded],
                updatedAt: new Date().toISOString(),
              }
            : p,
        );
        await persist(updated);
        await ensureCompanyLinked(metadata.companyId);
        toast.success("Policy updated");
      } else {
        const policyId = crypto.randomUUID();
        const files = form.files.length > 0 ? await uploadFilesWithMetadata(policyId, form.files) : [];
        const newPolicy: InsurancePolicy = {
          id: policyId,
          ...metadata,
          files,
          createdAt: new Date().toISOString(),
        };
        await persist([...policies, newPolicy]);
        await ensureCompanyLinked(metadata.companyId);
        toast.success("Policy added");
      }
      setIsDialogOpen(false);
      resetForm();
      startTransition(() => router.refresh());
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save policy");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFile = async (policyId: string, fileId: string) => {
    try {
      const updated = policies.map((p) =>
        p.id === policyId ? { ...p, files: (p.files || []).filter((f) => f.id !== fileId) } : p,
      );
      await persist(updated);
      toast.success("File removed");
    } catch (_e) {
      toast.error("Failed to remove file");
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    try {
      await persist(policies.filter((p) => p.id !== policyId));
      toast.success("Policy deleted");
      startTransition(() => router.refresh());
    } catch (_e) {
      toast.error("Failed to delete policy");
    }
  };

  const handleLinkCompany = async () => {
    if (!linkCompanyId) return;
    setIsLinking(true);
    try {
      const result = await linkCompany(linkCompanyId, client.id!);
      if (result.success) {
        toast.success(`${sectionName} company linked`);
        window.dispatchEvent(new CustomEvent("association-change"));
        setIsLinkOpen(false);
        setLinkCompanyId("");
        startTransition(() => router.refresh());
      } else {
        toast.error(result.error || "Failed to link company");
      }
    } catch (_e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkCompany = async (companyId: string) => {
    if (!window.confirm(`Remove the association with this ${sectionName.toLowerCase()} company?`)) return;
    try {
      const result = await unlinkCompany(companyId, client.id!);
      if (result.success) {
        toast.success("Company association removed");
        window.dispatchEvent(new CustomEvent("association-change"));
        startTransition(() => router.refresh());
      } else {
        toast.error(result.error || "Failed to remove association");
      }
    } catch (_e) {
      toast.error("An unexpected error occurred");
    }
  };

  const selectedCompanyName = form.companyId ? companyNameById.get(form.companyId) : "";
  const selectedLinkCompanyName = linkCompanyId ? companies.find((c) => c.id === linkCompanyId)?.name : "";

  const renderPolicyCard = (policy: InsurancePolicy) => (
    <div
      key={policy.id}
      className="rounded-xl border border-muted/20 bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-semibold text-base text-foreground leading-tight">
            {policy.policyName || policy.policyNumber || "Untitled Policy"}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
            {policy.isUnderManagement ? (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] py-0">
                Under Management
              </Badge>
            ) : policy.managingAgencyId ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] py-0">
                Agency: {insuranceAgencies.find((a) => a.id === policy.managingAgencyId)?.firmName || "External Agency"}
              </Badge>
            ) : null}
            {policy.policyNumber && <span>Policy #: {policy.policyNumber}</span>}
            {policy.issueDate && <span>Issued: {policy.issueDate}</span>}
            {(policy.anniversaryDate || policy.renewalDate) && (
              <span>Anniversary Date: {policy.anniversaryDate || policy.renewalDate}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 border-t border-dashed pt-1 text-muted-foreground text-xs">
            <span>
              Premium:{" "}
              <span className="font-semibold text-green-700">{formatCurrency(policy.premiumPayment ?? 0)}</span>
            </span>
            {policy.premiumFrequency && (
              <span>
                Frequency: <span className="font-medium text-foreground">{policy.premiumFrequency}</span>
              </span>
            )}
            {policy.eliminationPeriod && (
              <span>
                Elimination Period: <span className="font-medium text-foreground">{policy.eliminationPeriod}</span>
              </span>
            )}
          </div>
          {policy.note && (
            <p className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md border border-muted/20 italic whitespace-pre-wrap">
              Note: {policy.note}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(policy)} title="Edit policy">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => handleDeletePolicy(policy.id)}
            title="Delete policy"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(policy.beneficiaries?.length > 0 || policy.contingentBeneficiaries?.length > 0) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <BeneficiarySummary title="Beneficiaries" list={policy.beneficiaries} label={beneficiaryLabel} />
          <BeneficiarySummary
            title="Contingent Beneficiaries"
            list={policy.contingentBeneficiaries}
            label={beneficiaryLabel}
          />
        </div>
      )}

      <div className="mt-3 space-y-2 border-t pt-3">
        {(policy.files || []).length > 0 ? (
          (policy.files || []).map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-md border bg-muted/10 px-3 py-2">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 mr-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-medium">{f.name}</span>
                </div>
                {f.title && (
                  <Badge
                    variant="outline"
                    className="w-fit text-[10px] py-0 px-1.5 uppercase font-semibold text-muted-foreground bg-muted/10"
                  >
                    {f.title}
                  </Badge>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="outline" size="sm" asChild>
                  <a href={f.url} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteFile(policy.id, f.id)}
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-xs italic">No documents attached yet.</p>
        )}

        <div>
          <label
            htmlFor={`add-files-${policy.id}`}
            className="inline-flex cursor-pointer items-center text-primary text-xs hover:underline"
          >
            {addFilesFor === policy.id ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Plus className="mr-1 h-3 w-3" />
            )}
            Add file(s)
          </label>
          <input
            id={`add-files-${policy.id}`}
            type="file"
            multiple
            className="hidden"
            disabled={addFilesFor === policy.id}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files).map((f) => ({
                  file: f,
                  title: "Issued Illustration" as const,
                }));
                setFilesToUpload({ policyId: policy.id, files });
              }
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <ClientHeaderPortal sectionName={sectionName}>
        <Button
          size="sm"
          onClick={() => openCreate()}
          className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Policy
        </Button>
      </ClientHeaderPortal>

      {associatedCompanies.length === 0 && generalPolicies.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-2 border-muted/30 border-dashed bg-muted/5 px-6 py-12 text-center text-muted-foreground">
          <Building2 className="mb-4 h-12 w-12 opacity-20" />
          <h3 className="font-bold text-foreground text-sm">No Policies or Companies</h3>
          <p className="mt-1 max-w-sm text-xs">
            Connect this client to a {sectionName.toLowerCase()} company or add a policy to get started.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsLinkOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Link a Company
            </Button>
            <Button size="sm" onClick={() => openCreate()}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Policy
            </Button>
          </div>
        </Card>
      ) : (
        <div className="max-w-4xl space-y-10">
          {associatedCompanies.map((company) => {
            const companyPolicies = policiesByCompany.get(company.id!) || [];
            return (
              <div key={company.id ?? company.name} className="space-y-4">
                <div className="border-muted/20 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="flex items-center gap-1 font-bold text-foreground text-lg">
                      <span>{company.name}</span>
                      <Link
                        href={`${adminBasePath}/${company.id}`}
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        <ArrowUpRight className="inline h-4 w-4" />
                      </Link>
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openCreate(company.id)}
                      className="ml-auto text-muted-foreground text-xs hover:text-foreground"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Policy
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleUnlinkCompany(company.id!)}
                      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Remove Association"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                    {company.websiteUrl && (
                      <a
                        href={
                          company.websiteUrl.startsWith("http") ? company.websiteUrl : `https://${company.websiteUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {company.websiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {company.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {formatPhoneNumber(company.phone)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pl-6 md:pl-12">
                  {companyPolicies.length > 0 ? (
                    companyPolicies.map(renderPolicyCard)
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-muted/30 border-dashed bg-muted/5 p-6 text-center text-muted-foreground">
                      <FileIcon className="mb-2 h-6 w-6 opacity-30" />
                      <p className="text-xs">No policies for this company yet.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {generalPolicies.length > 0 && (
            <div className="space-y-4">
              <div className="border-muted/20 border-b pb-2">
                <h3 className="font-bold text-foreground text-lg">Other Policies</h3>
                <p className="mt-1 text-muted-foreground text-xs">Policies not associated with a linked company.</p>
              </div>
              <div className="space-y-3 pl-6 md:pl-12">{generalPolicies.map(renderPolicyCard)}</div>
            </div>
          )}

          {availableCompaniesToLink.length > 0 && (
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLinkOpen(true)}
                className="text-muted-foreground text-xs hover:text-foreground"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Link Another Company
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Policy Dialog */}
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
              <UploadCloud className="h-5 w-5 text-primary" />
              {isEditing ? "Edit" : "Add"} {sectionName} Policy
            </DialogTitle>
            <DialogDescription>
              Enter the policy details and beneficiaries, then attach one or more documents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Company */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Insurance Company <span className="text-destructive">*</span>
              </Label>
              <Popover open={companyComboOpen} onOpenChange={setCompanyComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyComboOpen}
                    className="w-full justify-between text-left font-normal text-sm"
                  >
                    {selectedCompanyName || "Select company *"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search companies..." />
                    <CommandList>
                      <CommandEmpty>No companies found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setForm((f) => ({ ...f, companyId: "" }));
                            setCompanyComboOpen(false);
                          }}
                          className="text-muted-foreground italic"
                        >
                          <Check className={cn("mr-2 h-4 w-4 opacity-0", !form.companyId && "opacity-100")} />
                          No Company
                        </CommandItem>
                        {companies.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              setForm((f) => ({ ...f, companyId: company.id || "" }));
                              setCompanyComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4 opacity-0", form.companyId === company.id && "opacity-100")}
                            />
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="policy-number">Policy Number</Label>
                <Input
                  id="policy-number"
                  value={form.policyNumber}
                  onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
                  placeholder="e.g. LIF-12345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy-name">Policy Name</Label>
                <Input
                  id="policy-name"
                  value={form.policyName}
                  onChange={(e) => setForm({ ...form, policyName: e.target.value })}
                  placeholder="e.g. 20-Year Term Life"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy-issue-date">Issue Date</Label>
                <Input
                  id="policy-issue-date"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy-renewal-date">Anniversary Date</Label>
                <Input
                  id="policy-renewal-date"
                  type="date"
                  value={form.anniversaryDate || form.renewalDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, anniversaryDate: val, renewalDate: val });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="policy-premium-frequency">Premium Frequency</Label>
                <Select
                  value={form.premiumFrequency}
                  onValueChange={(val) => setForm({ ...form, premiumFrequency: val as FormState["premiumFrequency"] })}
                >
                  <SelectTrigger id="policy-premium-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="policy-premium-payment" className="flex items-center gap-1">
                  Premium Payment <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="policy-premium-payment"
                    type="number"
                    min={0}
                    step="0.01"
                    className="pl-7"
                    value={form.premiumPayment}
                    onChange={(e) => setForm({ ...form, premiumPayment: Number(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-md border p-3 bg-background">
              <Checkbox
                id="policy-is-under-management"
                checked={form.isUnderManagement}
                onCheckedChange={(checked) =>
                  setForm({
                    ...form,
                    isUnderManagement: !!checked,
                    managingAgencyId: checked ? "" : form.managingAgencyId,
                  })
                }
              />
              <Label htmlFor="policy-is-under-management" className="cursor-pointer font-medium text-sm">
                Under our Management
              </Label>
            </div>

            {!form.isUnderManagement && (
              <div className="space-y-2">
                <Label htmlFor="policy-managing-agency">Managing Insurance Agency</Label>
                <Select
                  value={form.managingAgencyId}
                  onValueChange={(val) => setForm({ ...form, managingAgencyId: val })}
                >
                  <SelectTrigger id="policy-managing-agency">
                    <SelectValue placeholder="Select Insurance Agency" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceAgencies && insuranceAgencies.length > 0 ? (
                      insuranceAgencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id || ""}>
                          {agency.firmName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_none" disabled>
                        No Insurance Agencies found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(policyField === "disabilityPolicies" || policyField === "ltcPolicies") && (
              <div className="space-y-2">
                <Label htmlFor="policy-elimination-period">Elimination Period</Label>
                <Select
                  value={form.eliminationPeriod}
                  onValueChange={(val) =>
                    setForm({ ...form, eliminationPeriod: val as FormState["eliminationPeriod"] })
                  }
                >
                  <SelectTrigger id="policy-elimination-period">
                    <SelectValue placeholder="Select elimination period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60 days">60 days</SelectItem>
                    <SelectItem value="90 days">90 days</SelectItem>
                    <SelectItem value="120 days">120 days</SelectItem>
                    <SelectItem value="365 days">365 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="policy-note">Note</Label>
              <Textarea
                id="policy-note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Enter notes about the policy..."
              />
            </div>

            <BeneficiaryRows
              title="Beneficiaries"
              rows={form.beneficiaries}
              options={beneficiaryOptions}
              onChange={(rows) => setForm({ ...form, beneficiaries: rows })}
            />
            <BeneficiaryRows
              title="Contingent Beneficiaries"
              rows={form.contingentBeneficiaries}
              options={beneficiaryOptions}
              onChange={(rows) => setForm({ ...form, contingentBeneficiaries: rows })}
            />

            <div className="space-y-2">
              <Label htmlFor="policy-files">Documents</Label>
              <input
                id="policy-files"
                type="file"
                multiple
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => {
                  const fileList = e.target.files ? Array.from(e.target.files) : [];
                  const newFiles = fileList.map((f) => ({
                    file: f,
                    title: "Issued Illustration" as const,
                  }));
                  setForm({ ...form, files: [...form.files, ...newFiles] });
                }}
              />
              {form.files.length > 0 && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <Label className="text-xs font-semibold">Selected Files to Upload</Label>
                  {form.files.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border p-2 bg-muted/5">
                      <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate text-xs flex-1" title={item.file.name}>
                        {item.file.name}
                      </span>
                      <Select
                        value={item.title}
                        onValueChange={(val) => {
                          const updated = [...form.files];
                          updated[idx].title = val as FormFile["title"];
                          setForm({ ...form, files: updated });
                        }}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Issued Illustration">Issued Illustration</SelectItem>
                          <SelectItem value="Policy Receipts">Policy Receipts</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setForm({
                            ...form,
                            files: form.files.filter((_, i) => i !== idx),
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
                <p className="text-muted-foreground text-xs">
                  Existing documents are managed from the policy card. Selecting files here adds more.
                </p>
              )}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEditing ? "Saving..." : "Saving..."}
                </>
              ) : isEditing ? (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" /> Add Policy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Company Dialog */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="border border-muted/20 bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Link {sectionName} Company
            </DialogTitle>
            <DialogDescription>Link an existing {sectionName.toLowerCase()} company to this client.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <Label>Insurance Company</Label>
              <Popover open={linkComboOpen} onOpenChange={setLinkComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={linkComboOpen}
                    className="w-full justify-between text-left font-normal text-sm"
                  >
                    {selectedLinkCompanyName || "Select company..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search companies..." />
                    <CommandList>
                      <CommandEmpty>No companies found.</CommandEmpty>
                      <CommandGroup>
                        {availableCompaniesToLink.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              setLinkCompanyId(company.id || "");
                              setLinkComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4 opacity-0", linkCompanyId === company.id && "opacity-100")}
                            />
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-muted/20 border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button variant="outline" asChild className="w-full">
              <Link href={`${adminBasePath}/new?clientId=${client.id}`}>Create New Company</Link>
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleLinkCompany} disabled={isLinking || !linkCompanyId}>
              {isLinking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Linking...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" /> Link Company
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Files Dialog with Metadata */}
      <Dialog
        open={filesToUpload !== null}
        onOpenChange={(open) => {
          if (!open) setFilesToUpload(null);
        }}
      >
        <DialogContent className="border border-muted/20 bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" /> Title Uploaded Documents
            </DialogTitle>
            <DialogDescription>Assign a document type to each file before uploading.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[50vh] overflow-y-auto">
            {filesToUpload?.files.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 rounded-md border p-3 bg-muted/5">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-xs font-medium flex-1" title={item.file.name}>
                    {item.file.name}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">Document Type:</span>
                  <Select
                    value={item.title}
                    onValueChange={(val) => {
                      if (!filesToUpload) return;
                      const updated = [...filesToUpload.files];
                      updated[idx].title = val as FormFile["title"];
                      setFilesToUpload({ ...filesToUpload, files: updated });
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Issued Illustration">Issued Illustration</SelectItem>
                      <SelectItem value="Policy Receipts">Policy Receipts</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setFilesToUpload(null)}>
              Cancel
            </Button>
            <Button
              disabled={addFilesFor !== null}
              onClick={async () => {
                if (!filesToUpload) return;
                const { policyId, files } = filesToUpload;
                setFilesToUpload(null);
                try {
                  setAddFilesFor(policyId);
                  const uploaded = await uploadFilesWithMetadata(policyId, files);
                  const updated = policies.map((p) =>
                    p.id === policyId ? { ...p, files: [...(p.files || []), ...uploaded] } : p,
                  );
                  await persist(updated);
                  toast.success("Document(s) uploaded successfully");
                } catch (e) {
                  console.error(e);
                  toast.error(e instanceof Error ? e.message : "Failed to upload document(s)");
                } finally {
                  setAddFilesFor(null);
                }
              }}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Compact read-only list of beneficiaries shown on a policy card. */
function BeneficiarySummary({
  title,
  list,
  label,
}: {
  title: string;
  list: InsuranceBeneficiary[];
  label: (ref: InsuranceBeneficiaryRef) => string;
}) {
  if (!list || list.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="font-medium text-muted-foreground text-xs">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {list.map((b) => (
          <Badge key={b.id} variant="secondary" className="gap-1 font-normal">
            {label(b.ref)}
            <span className="text-muted-foreground">· {b.percent}%</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
