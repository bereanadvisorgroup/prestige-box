"use client";

import { useState } from "react";

import { CreditCard, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase.client";
import type { Client, LoanInfo } from "@/types/crm";

export function LiabilitiesTab({ client }: { client: Client }) {
  const [liabilities, setLiabilities] = useState<LoanInfo[]>(client.liabilities || []);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [loanType, setLoanType] = useState<LoanInfo["loanType"] | "">("");
  const [creditorName, setCreditorName] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [statementFile, setStatementFile] = useState<File | null>(null);

  const handleAdd = async () => {
    if (!loanType || !creditorName || !currentBalance) {
      toast.error("Loan Type, Creditor Name, and Balance are required");
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
        creditorName,
        currentBalance: parseFloat(currentBalance),
        statementPath,
      };

      const updated = [...liabilities, newLoan];
      const res = await updateClient(client.id!, { liabilities: updated });
      if (res.success) {
        setLiabilities(updated);
        setLoanType("");
        setCreditorName("");
        setCurrentBalance("");
        setStatementFile(null);
        const fileInput = document.getElementById("liability-file-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
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

  return (
    <Card className="fade-in animate-in border-none bg-gradient-to-b from-card to-muted/20 shadow-md duration-500">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle>Liabilities & Loans</CardTitle>
        <CardDescription>Add and manage financial liabilities for this client.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Loan Type</Label>
              <Select value={loanType} onValueChange={(val) => setLoanType(val as LoanInfo["loanType"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {["Auto", "Boat", "Business", "Student", "Credit Card"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Creditor Name</Label>
              <Input
                value={creditorName}
                onChange={(e) => setCreditorName(e.target.value)}
                placeholder="e.g. Chase Bank"
              />
            </div>
            <div className="space-y-2">
              <Label>Current Balance ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Statement</Label>
              <input
                id="liability-file-upload"
                type="file"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleAdd} disabled={isLoading || !loanType || !creditorName || !currentBalance}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Liability
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {liabilities.length > 0 ? (
            liabilities.map((loan, index) => (
              <div
                key={loan.id || `loan-${index}`}
                className="flex flex-col justify-between gap-4 rounded-md border bg-background p-4 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded border border-primary/20 bg-primary/10 p-2 text-primary">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      {loan.creditorName || (loan as unknown as { creditor?: string }).creditor || "Unknown Creditor"}
                      <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-xs uppercase">
                        {loan.loanType || (loan as unknown as { type?: string }).type || "Unknown"}
                      </span>
                    </p>
                    <p className="font-bold text-foreground/90 text-xl tracking-tight">
                      $
                      {(loan.currentBalance ?? (loan as unknown as { amount?: number }).amount ?? 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 self-end md:self-center">
                  {loan.statementPath && (
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={loan.statementPath} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3 w-3" /> View Statement
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
            ))
          ) : (
            <div className="rounded-lg border-2 border-dashed bg-muted/10 p-8 text-center text-muted-foreground">
              <CreditCard className="mx-auto mb-3 h-8 w-8 opacity-20" />
              <p className="text-sm">No liabilities recorded yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
