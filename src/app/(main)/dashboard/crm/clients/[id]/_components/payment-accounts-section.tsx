"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { getClientPoliciesByClient } from "@/actions/policies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Bank, Client, PaymentAccount } from "@/types/crm";

export function PaymentAccountsSection({ client, associatedBanks }: { client: Client; associatedBanks: Bank[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(client.paymentAccounts || []);
  const [paymentAccountInput, setPaymentAccountInput] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string>("");

  const handleUpdate = async (updates: Partial<Client>) => {
    try {
      setIsLoading(true);
      const res = await updateClient(client.id!, updates);
      if (res.success) {
        toast.success("Payment accounts updated");
        router.refresh();
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to update payment accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentAccount = () => {
    if (!paymentAccountInput.trim() || !selectedBankId) {
      toast.error("Please enter an account name and select a bank.");
      return;
    }
    const newAccount: PaymentAccount = {
      id: crypto.randomUUID(),
      name: paymentAccountInput.trim(),
      bankId: selectedBankId,
    };
    const next = [...paymentAccounts, newAccount];
    setPaymentAccounts(next);
    handleUpdate({ paymentAccounts: next });
    setPaymentAccountInput("");
    setSelectedBankId("");
  };

  const handleRemovePaymentAccount = async (accountId: string) => {
    const result = await getClientPoliciesByClient(client.id!);
    if (result.success && result.policies) {
      const isInUse = result.policies.some((p) => p.paymentAccountId === accountId);
      if (isInUse) {
        toast.error("Cannot delete payment account because it is currently associated with a policy.");
        return;
      }
    }
    const next = paymentAccounts.filter((a) => a.id !== accountId);
    setPaymentAccounts(next);
    handleUpdate({ paymentAccounts: next });
  };

  return (
    <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
      <CardHeader className="bg-muted/10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-primary" /> Payment Accounts
        </CardTitle>
        <CardDescription>Manage multiple bank or financial accounts for billing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="w-full sm:w-1/3">
            <Select value={selectedBankId} onValueChange={setSelectedBankId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Bank" />
              </SelectTrigger>
              <SelectContent>
                {associatedBanks.length > 0 ? (
                  associatedBanks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id!}>
                      {bank.firmName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No associated banks
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-full flex-1 gap-2">
            <Input
              placeholder="e.g. Personal Checking"
              value={paymentAccountInput}
              onChange={(e) => setPaymentAccountInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPaymentAccount();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddPaymentAccount}
              disabled={isLoading || associatedBanks.length === 0}
            >
              Add
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {paymentAccounts.length === 0 && (
            <p className="rounded-md border bg-muted/20 p-2 text-center text-muted-foreground text-xs italic">
              No payment accounts added yet.
            </p>
          )}
          {paymentAccounts.map((account) => {
            const bank = associatedBanks.find((b) => b.id === account.bankId);
            return (
              <div
                key={account.id}
                className="group flex items-center justify-between rounded-md border bg-background p-3"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{account.name}</p>
                    {bank && <p className="text-muted-foreground text-xs">{bank.firmName}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePaymentAccount(account.id)}
                  className="text-muted-foreground opacity-0 transition-colors hover:text-destructive group-hover:opacity-100"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
