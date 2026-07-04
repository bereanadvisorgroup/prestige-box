"use client";

import { useState } from "react";

import {
  Building2,
  CalendarRange,
  CreditCard,
  FileText,
  Layers,
  Loader2,
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase.client";
import type { Asset, Bank, Client, LoanInfo } from "@/types/crm";

import { ClientHeaderPortal } from "../client-header-portal";

const LOAN_TYPES = ["Auto", "Boat", "Business", "Credit Card", "Mortgage", "Student"] as const;

const LOAN_TYPE_COLORS: Record<string, string> = {
  Auto: "bg-blue-500/10 text-blue-600 border-blue-200",
  Boat: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  Business: "bg-amber-500/10 text-amber-600 border-amber-200",
  "Credit Card": "bg-rose-500/10 text-rose-600 border-rose-200",
  Mortgage: "bg-violet-500/10 text-violet-600 border-violet-200",
  Student: "bg-green-500/10 text-green-600 border-green-200",
};

function fmt(n: number | undefined) {
  if (n === undefined) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface LiabilitiesTabProps {
  client: Client;
  associatedBanks?: Bank[];
  clientAssets?: Asset[];
}

export function LiabilitiesTab({ client, associatedBanks = [], clientAssets = [] }: LiabilitiesTabProps) {
  const [liabilities, setLiabilities] = useState<LoanInfo[]>(client.liabilities || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [loanType, setLoanType] = useState<string>("");
  const [assetId, setAssetId] = useState("");
  const [bankId, setBankId] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statementFile, setStatementFile] = useState<File | null>(null);

  const resetForm = () => {
    setLoanType("");
    setAssetId("");
    setBankId("");
    setCurrentBalance("");
    setMonthlyPayment("");
    setStartDate("");
    setEndDate("");
    setStatementFile(null);
  };

  const handleAdd = async () => {
    if (!loanType || !currentBalance) {
      toast.error("Loan Type and Balance are required");
      return;
    }
    try {
      setIsLoading(true);
      let statementPath: string | undefined;

      if (statementFile) {
        const fileExt = statementFile.name.split(".").pop();
        const randomStr = Math.random().toString(36).substring(7);
        const filePath = `clients/${client.id}/liabilities/${randomStr}_${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage.from("documents").upload(filePath, statementFile);
        if (error) throw error;
        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(filePath);
        statementPath = publicUrl;
      }

      const newLoan: LoanInfo = {
        id: crypto.randomUUID(),
        loanType: loanType as LoanInfo["loanType"],
        assetId: assetId || null,
        bankId: bankId || null,
        currentBalance: parseFloat(currentBalance),
        monthlyPayment: monthlyPayment ? parseFloat(monthlyPayment) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        statementPath,
      };

      const updated = [...liabilities, newLoan];
      const res = await updateClient(client.id!, { liabilities: updated });
      if (res.success) {
        setLiabilities(updated);
        resetForm();
        setIsDialogOpen(false);
        toast.success("Liability added");
      } else {
        throw new Error("Failed to update client with new liability details.");
      }
    } catch (error) {
      console.error("Liability upload error:", error);
      toast.error(error instanceof Error ? error.message : "Error adding liability");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const updated = liabilities.filter((l) => l.id !== id);
      const res = await updateClient(client.id!, { liabilities: updated });
      if (res.success) {
        setLiabilities(updated);
        toast.success("Liability removed");
      }
    } catch {
      toast.error("Error removing liability");
    }
  };

  const totalBalance = liabilities.reduce((sum, l) => sum + (l.currentBalance ?? 0), 0);
  const totalMonthly = liabilities.reduce((sum, l) => sum + (l.monthlyPayment ?? 0), 0);

  return (
    <div className="space-y-6">
      <ClientHeaderPortal sectionName="Liabilities">
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Liability
          </Button>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Liability</DialogTitle>
              <DialogDescription>Enter the details of the loan, mortgage, or credit obligation.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Loan Type */}
              <div className="grid gap-2">
                <Label>
                  Loan Type <span className="text-destructive">*</span>
                </Label>
                <Select value={loanType} onValueChange={setLoanType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Associated Asset */}
              <div className="grid gap-2">
                <Label>Associated Asset (Optional)</Label>
                <Select value={assetId} onValueChange={setAssetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Link to an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clientAssets.map((a) => (
                      <SelectItem key={a.id} value={a.id!}>
                        {a.name} — {a.subType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bank */}
              <div className="grid gap-2">
                <Label>Bank (Optional)</Label>
                <Select value={bankId} onValueChange={setBankId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select associated bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {associatedBanks.map((b) => (
                      <SelectItem key={b.id} value={b.id!}>
                        {b.firmName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {associatedBanks.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Associate a bank with this client first to link one here.
                  </p>
                )}
              </div>

              <Separator />

              {/* Balance + Monthly Payment */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>
                    Current Balance ($) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Monthly Payment ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={monthlyPayment}
                    onChange={(e) => setMonthlyPayment(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>End / Payoff Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>

              {/* Statement Upload */}
              <div className="grid gap-2">
                <Label>Statement (Optional)</Label>
                <input
                  id="liability-file-upload"
                  type="file"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={isLoading || !loanType || !currentBalance}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Liability
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ClientHeaderPortal>

      <div className="space-y-6">
        {/* Summary Row */}
        {liabilities.length > 0 && (
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/10 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-destructive">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <p className="font-bold text-lg">{fmt(totalBalance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-primary/20 bg-primary/10 p-2 text-primary">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Monthly</p>
                <p className="font-bold text-lg">{fmt(totalMonthly)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Liability Cards */}
        <div className="space-y-3">
          {liabilities.length > 0 ? (
            liabilities.map((loan, index) => {
              const bank = associatedBanks.find((b) => b.id === loan.bankId);
              const asset = clientAssets.find((a) => a.id === loan.assetId);
              const colorClass = LOAN_TYPE_COLORS[loan.loanType] ?? "bg-muted text-muted-foreground border-border";

              return (
                <div
                  key={loan.id || `loan-${index}`}
                  className="flex flex-col justify-between gap-4 rounded-xl border bg-background p-5 shadow-sm transition-all hover:shadow-md md:flex-row md:items-start"
                >
                  {/* Left: Icon + Info */}
                  <div className="flex flex-1 items-start gap-4">
                    <div className="shrink-0 rounded-lg border border-primary/20 bg-primary/10 p-2.5 text-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      {/* Header row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`font-medium text-xs uppercase ${colorClass}`}>
                          {loan.loanType}
                        </Badge>
                        {bank && (
                          <span className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Building2 className="h-3.5 w-3.5" />
                            {bank.firmName}
                          </span>
                        )}
                        {asset && (
                          <span className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Layers className="h-3.5 w-3.5" />
                            {asset.name}
                          </span>
                        )}
                      </div>

                      {/* Amounts row */}
                      <div className="flex flex-wrap gap-6 pt-1">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Balance
                          </p>
                          <p className="font-bold text-foreground text-lg">{fmt(loan.currentBalance)}</p>
                        </div>
                        {loan.monthlyPayment !== undefined && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              / Month
                            </p>
                            <p className="font-semibold text-foreground/80">{fmt(loan.monthlyPayment)}</p>
                          </div>
                        )}
                        {(loan.startDate || loan.endDate) && (
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                              <CalendarRange className="h-3 w-3" /> Term
                            </p>
                            <p className="text-sm text-foreground/80">
                              {loan.startDate ? new Date(loan.startDate).toLocaleDateString() : "—"}
                              {" → "}
                              {loan.endDate ? new Date(loan.endDate).toLocaleDateString() : "Open"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex shrink-0 items-center gap-2 self-start">
                    {loan.statementPath && (
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <a href={loan.statementPath} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-3.5 w-3.5" /> Statement
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(loan.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border-2 border-dashed bg-muted/10 p-12 text-center text-muted-foreground">
              <CreditCard className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm">No liabilities recorded yet.</p>
              <p className="mt-1 text-xs opacity-70">Click "Add Liability" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
