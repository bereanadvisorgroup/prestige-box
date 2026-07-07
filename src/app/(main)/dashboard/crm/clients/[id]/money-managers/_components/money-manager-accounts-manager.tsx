"use client";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { linkClientToMoneyManager } from "@/actions/money-managers";
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
import { cn, formatCurrency } from "@/lib/utils";
import type { Client, InsuranceBeneficiary, InsuranceBeneficiaryRef, MoneyManagerAccount } from "@/types/crm";

import { ClientHeaderPortal } from "../../_components/client-header-portal";
import type { BeneficiaryParty } from "../../_components/insurance-policy-manager";

interface NamedOption {
  id: string;
  name: string;
}

interface MoneyManagerAccountsManagerProps {
  client: Client;
  /** Money manager firms selectable for an account and used to group the landing page. */
  moneyManagers: NamedOption[];
  /** Admin "Financial Type" list. */
  financialTypes: NamedOption[];
  /** Admin "Custodian" list. */
  custodians: NamedOption[];
  /** People and companies selectable as beneficiaries. Trusts are derived from the client's estate documents. */
  parties: BeneficiaryParty[];
}

const NONE_SELECT = "__none__";

// --- Beneficiary reference helpers ---------------------------------------------------------------

const refKey = (ref: InsuranceBeneficiaryRef) => `${ref.kind}:${ref.id}`;
const parseRefKey = (key: string): InsuranceBeneficiaryRef => {
  const [kind, ...rest] = key.split(":");
  return { kind: kind as InsuranceBeneficiaryRef["kind"], id: rest.join(":") };
};

interface Option {
  key: string;
  label: string;
  sublabel?: string;
}

// --- Form state ---------------------------------------------------------------------------------

interface BeneficiaryRow {
  rowId: string;
  key: string; // composite beneficiary key, "" when unselected
  percent: string; // kept as string for the controlled number input
}

interface FormState {
  moneyManagerId: string;
  financialTypeId: string;
  accountNumber: string;
  title: string;
  value: string;
  managementBeginDate: string;
  closeDate: string;
  custodianId: string;
  beneficiaries: BeneficiaryRow[];
  contingentBeneficiaries: BeneficiaryRow[];
}

const emptyForm: FormState = {
  moneyManagerId: "",
  financialTypeId: "",
  accountNumber: "",
  title: "",
  value: "",
  managementBeginDate: "",
  closeDate: "",
  custodianId: "",
  beneficiaries: [],
  contingentBeneficiaries: [],
};

const rowsFromBeneficiaries = (list: InsuranceBeneficiary[]): BeneficiaryRow[] =>
  (list || []).map((b) => ({ rowId: crypto.randomUUID(), key: refKey(b.ref), percent: String(b.percent ?? "") }));

const formFromAccount = (a: MoneyManagerAccount): FormState => ({
  moneyManagerId: a.moneyManagerId || "",
  financialTypeId: a.financialTypeId || "",
  accountNumber: a.accountNumber || "",
  title: a.title || "",
  value: a.value != null ? String(a.value) : "",
  managementBeginDate: a.managementBeginDate || "",
  closeDate: a.closeDate || "",
  custodianId: a.custodianId || "",
  beneficiaries: rowsFromBeneficiaries(a.beneficiaries),
  contingentBeneficiaries: rowsFromBeneficiaries(a.contingentBeneficiaries),
});

/** Convert form rows into stored beneficiaries, dropping unselected rows. Returns null if any percent is invalid. */
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

const formatDate = (value?: string) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
};

// --- Single-select searchable beneficiary picker (inline results; safe inside a modal Dialog) -----

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

export function MoneyManagerAccountsManager({
  client,
  moneyManagers,
  financialTypes,
  custodians,
  parties,
}: MoneyManagerAccountsManagerProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();

  const [accounts, setAccounts] = useState<MoneyManagerAccount[]>(
    (client.moneyManagerAccounts as MoneyManagerAccount[]) || [],
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [managerComboOpen, setManagerComboOpen] = useState(false);

  const isEditing = editingId !== null;

  // Lookup maps for names shown on the cards.
  const managerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of moneyManagers) map.set(m.id, m.name);
    return map;
  }, [moneyManagers]);
  const financialTypeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of financialTypes) map.set(t.id, t.name);
    return map;
  }, [financialTypes]);
  const custodianNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of custodians) map.set(c.id, c.name);
    return map;
  }, [custodians]);

  // Beneficiary picker options: people + companies + this client's estate trusts.
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

  // Group accounts by money manager. Only managers that have at least one account get a group.
  const groups = useMemo(() => {
    const byManager = new Map<string, MoneyManagerAccount[]>();
    for (const a of accounts) {
      const key = a.moneyManagerId || "";
      const list = byManager.get(key) || [];
      list.push(a);
      byManager.set(key, list);
    }
    return Array.from(byManager.entries())
      .map(([managerId, list]) => ({
        managerId,
        managerName: managerNameById.get(managerId) || "Unknown Money Manager",
        accounts: list,
      }))
      .sort((a, b) => a.managerName.localeCompare(b.managerName));
  }, [accounts, managerNameById]);

  const persist = async (updated: MoneyManagerAccount[]) => {
    const res = await updateClient(client.id!, { moneyManagerAccounts: updated });
    if (!res.success) throw new Error(res.error || "Failed to save changes");
    setAccounts(updated);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const openCreate = (moneyManagerId = "") => {
    resetForm();
    setForm({ ...emptyForm, moneyManagerId });
    setIsDialogOpen(true);
  };

  const openEdit = (account: MoneyManagerAccount) => {
    setEditingId(account.id);
    setForm(formFromAccount(account));
    setIsDialogOpen(true);
  };

  /** Build the persisted record from the form, validating value and beneficiary percentages. */
  const buildAccount = (): Omit<MoneyManagerAccount, "id" | "createdAt" | "updatedAt"> | null => {
    if (!form.moneyManagerId) {
      toast.error("Please select a money manager");
      return null;
    }
    const value = form.value.trim() === "" ? 0 : Number.parseFloat(form.value);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Value must be a positive number");
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
    return {
      moneyManagerId: form.moneyManagerId,
      financialTypeId: form.financialTypeId || undefined,
      accountNumber: form.accountNumber.trim() || undefined,
      title: form.title.trim() || undefined,
      value,
      managementBeginDate: form.managementBeginDate || undefined,
      closeDate: form.closeDate || undefined,
      custodianId: form.custodianId || undefined,
      beneficiaries,
      contingentBeneficiaries,
    };
  };

  /** Keep the money manager firm associated with the client (drives the Associated Vendors view). */
  const ensureManagerLinked = async (managerId: string) => {
    try {
      const res = await linkClientToMoneyManager(managerId, client.id!);
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
        const newAccount: MoneyManagerAccount = {
          id: crypto.randomUUID(),
          ...built,
          createdAt: new Date().toISOString(),
        };
        await persist([...accounts, newAccount]);
        toast.success("Account added");
      }
      await ensureManagerLinked(built.moneyManagerId);
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

  const selectedManagerName = form.moneyManagerId ? managerNameById.get(form.moneyManagerId) : "";

  const renderAccountCard = (account: MoneyManagerAccount) => {
    const isClosed = Boolean(account.closeDate);
    const financialTypeName = account.financialTypeId ? financialTypeNameById.get(account.financialTypeId) : null;
    const custodianName = account.custodianId ? custodianNameById.get(account.custodianId) : null;
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
              {custodianName && <span>Custodian: {custodianName}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
              {account.managementBeginDate && <span>Managed since: {formatDate(account.managementBeginDate)}</span>}
              {account.closeDate && <span>Closed: {formatDate(account.closeDate)}</span>}
            </div>
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

        {(account.beneficiaries?.length > 0 || account.contingentBeneficiaries?.length > 0) && (
          <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2">
            <BeneficiarySummary title="Beneficiaries" list={account.beneficiaries} label={beneficiaryLabel} />
            <BeneficiarySummary
              title="Contingent Beneficiaries"
              list={account.contingentBeneficiaries}
              label={beneficiaryLabel}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <ClientHeaderPortal sectionName="Money Managers">
        <Button
          size="sm"
          onClick={() => openCreate()}
          disabled={moneyManagers.length === 0}
          className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Account
        </Button>
      </ClientHeaderPortal>

      {moneyManagers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-2 border-muted/30 border-dashed bg-muted/5 px-6 py-12 text-center text-muted-foreground">
          <Building2 className="mb-4 h-12 w-12 opacity-20" />
          <h3 className="font-bold text-foreground text-sm">No Money Managers Available</h3>
          <p className="mt-1 max-w-sm text-xs">Create a money manager firm before adding managed accounts.</p>
          <Button variant="outline" size="sm" asChild className="mt-6">
            <Link href={`/dashboard/admin/money-managers/new?clientId=${client.id}`}>Create Money Manager</Link>
          </Button>
        </Card>
      ) : accounts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-2 border-muted/30 border-dashed bg-muted/5 px-6 py-12 text-center text-muted-foreground">
          <TrendingUp className="mb-4 h-12 w-12 opacity-20" />
          <h3 className="font-bold text-foreground text-sm">No Managed Accounts</h3>
          <p className="mt-1 max-w-sm text-xs">
            Add a managed account to track its value, custodian, and beneficiaries. Each account's value is included in
            the client's total net worth.
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
              <div key={group.managerId || "unknown"} className="space-y-4">
                <div className="border-muted/20 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="flex items-center gap-1 font-bold text-foreground text-lg">
                      <span>{group.managerName}</span>
                      {group.managerId && (
                        <Link
                          href={`/dashboard/admin/money-managers/${group.managerId}?clientId=${client.id}`}
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
                      onClick={() => openCreate(group.managerId)}
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
              <TrendingUp className="h-5 w-5 text-primary" />
              {isEditing ? "Edit" : "Add"} Money Manager Account
            </DialogTitle>
            <DialogDescription>
              Enter the account details and beneficiaries. The status is Open until a close date is set.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Money Manager */}
            <div className="space-y-2">
              <Label>
                Money Manager <span className="text-destructive">*</span>
              </Label>
              <Popover open={managerComboOpen} onOpenChange={setManagerComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={managerComboOpen}
                    className="w-full justify-between text-left font-normal text-sm"
                  >
                    {selectedManagerName || "Select money manager"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search money managers..." />
                    <CommandList>
                      <CommandEmpty>No money managers found.</CommandEmpty>
                      <CommandGroup>
                        {moneyManagers.map((manager) => (
                          <CommandItem
                            key={manager.id}
                            value={manager.name}
                            onSelect={() => {
                              setForm((f) => ({ ...f, moneyManagerId: manager.id }));
                              setManagerComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 opacity-0",
                                form.moneyManagerId === manager.id && "opacity-100",
                              )}
                            />
                            {manager.name}
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

              {/* Custodian */}
              <div className="space-y-2">
                <Label>Custodian</Label>
                <Select
                  value={form.custodianId || NONE_SELECT}
                  onValueChange={(v) => setForm({ ...form, custodianId: v === NONE_SELECT ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select custodian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_SELECT}>— None —</SelectItem>
                    {custodians.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mm-account-number">Account Number</Label>
                <Input
                  id="mm-account-number"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="e.g. 1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mm-title">Title</Label>
                <Input
                  id="mm-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Joint Brokerage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mm-value">Value ($)</Label>
                <Input
                  id="mm-value"
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
                <Label htmlFor="mm-begin-date">Management Begin Date</Label>
                <Input
                  id="mm-begin-date"
                  type="date"
                  value={form.managementBeginDate}
                  onChange={(e) => setForm({ ...form, managementBeginDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mm-close-date">Close Date</Label>
                <Input
                  id="mm-close-date"
                  type="date"
                  value={form.closeDate}
                  onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
                />
                <p className="text-muted-foreground text-xs">Leave empty to keep the account Open.</p>
              </div>
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

/** Compact read-only list of beneficiaries shown on an account card. */
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
