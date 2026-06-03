"use client";

import { useState } from "react";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { CreditCard, FileText, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage } from "@/lib/firebase.client";
import type { Client, LoanInfo } from "@/types/crm";

export function LiabilitiesTab({ client }: { client: Client }) {
  const [liabilities, setLiabilities] = useState<LoanInfo[]>(client.liabilities || []);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [loanType, setLoanType] = useState("");
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
      let statementPath;

      if (statementFile) {
        const fileExt = statementFile.name.split(".").pop();
        const randomStr = Math.random().toString(36).substring(7);
        const storageRef = ref(storage, `clients/${client.id}/liabilities/${randomStr}_${Date.now()}.${fileExt}`);
        const snapshot = await uploadBytes(storageRef, statementFile);
        statementPath = await getDownloadURL(snapshot.ref);
      }

      const newLoan: LoanInfo = {
        id: crypto.randomUUID(),
        loanType: loanType as any,
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
    } catch (error: any) {
      console.error("Liability upload error:", error);
      toast.error(error.message || "Error adding liability");
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
    <Card className="border-none shadow-md animate-in fade-in duration-500 bg-gradient-to-b from-card to-muted/20">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle>Liabilities & Loans</CardTitle>
        <CardDescription>Add and manage financial liabilities for this client.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-background p-4 rounded-lg border shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Loan Type</Label>
              <Select value={loanType} onValueChange={setLoanType}>
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleAdd} disabled={isLoading || !loanType || !creditorName || !currentBalance}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Liability
            </Button>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {liabilities.length > 0 ? (
            liabilities.map((loan) => (
              <div
                key={loan.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-md bg-background shadow-sm hover:shadow-md transition-all gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded border border-primary/20 text-primary shrink-0">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      {loan.creditorName}
                      <span className="text-xs uppercase bg-muted px-2 py-0.5 rounded-full font-medium">
                        {loan.loanType}
                      </span>
                    </p>
                    <p className="text-xl font-bold tracking-tight text-foreground/90">
                      $
                      {loan.currentBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
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
            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
              <CreditCard className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No liabilities recorded yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
