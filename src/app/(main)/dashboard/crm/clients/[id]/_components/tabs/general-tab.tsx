"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { CreditCard, Heart, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { getClientPoliciesByClient } from "@/actions/policies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { sportsTeams } from "@/data/sports-teams";
import type { Client, PaymentAccount } from "@/types/crm";

export function GeneralTab({ client }: { client: Client }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hobbies, setHobbies] = useState<string[]>(client.hobbies || []);
  const [hobbyInput, setHobbyInput] = useState("");
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(client.favoriteSportsTeams || []);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(client.paymentAccounts || []);
  const [paymentAccountInput, setPaymentAccountInput] = useState("");

  const handleUpdate = async (updates: Partial<Client>) => {
    try {
      setIsLoading(true);
      const res = await updateClient(client.id!, updates);
      if (res.success) {
        toast.success("Preferences updated");
        router.refresh();
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to update preferences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHobby = () => {
    if (!hobbyInput.trim()) return;
    if (hobbies.includes(hobbyInput.trim())) return;
    const next = [...hobbies, hobbyInput.trim()];
    setHobbies(next);
    handleUpdate({ hobbies: next });
    setHobbyInput("");
  };

  const handleRemoveHobby = (hobby: string) => {
    const next = hobbies.filter((h) => h !== hobby);
    setHobbies(next);
    handleUpdate({ hobbies: next });
  };

  const handleToggleSportsTeam = (teamName: string) => {
    let next;
    if (favoriteTeams.includes(teamName)) {
      next = favoriteTeams.filter((t) => t !== teamName);
    } else {
      next = [...favoriteTeams, teamName];
    }
    setFavoriteTeams(next);
    handleUpdate({ favoriteSportsTeams: next });
  };

  const handleAddPaymentAccount = () => {
    if (!paymentAccountInput.trim()) return;
    const newAccount: PaymentAccount = {
      id: crypto.randomUUID(),
      name: paymentAccountInput.trim(),
    };
    const next = [...paymentAccounts, newAccount];
    setPaymentAccounts(next);
    handleUpdate({ paymentAccounts: next });
    setPaymentAccountInput("");
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
    <div className="space-y-6">
      <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
        <CardHeader className="bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" /> Interests & Hobbies
          </CardTitle>
          <CardDescription>Manage the client's interests and leisure activities.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Golfing"
              value={hobbyInput}
              onChange={(e) => setHobbyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddHobby();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleAddHobby} disabled={isLoading}>
              Add
            </Button>
          </div>
          <div className="mt-4 flex min-h-[40px] flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
            {hobbies.length === 0 && <p className="p-1 text-muted-foreground text-xs italic">No hobbies listed yet.</p>}
            {hobbies.map((hobby, index) => (
              <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
                {hobby}
                <button
                  type="button"
                  onClick={() => handleRemoveHobby(hobby)}
                  className="ml-1 hover:text-destructive"
                  disabled={isLoading}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
        <CardHeader className="bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" /> Favorite Sports Teams
          </CardTitle>
          <CardDescription>Link individual sports teams for relevant news updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Combobox
            onValueChange={(val: any) => {
              if (typeof val === "string") handleToggleSportsTeam(val);
            }}
          >
            <ComboboxInput placeholder="Search NFL, MLB, NBA, NHL..." />
            <ComboboxContent>
              <ComboboxList>
                {sportsTeams
                  .filter((team) => !favoriteTeams.includes(team.name))
                  .map((team) => (
                    <ComboboxItem key={team.id} value={team.name}>
                      <span className="mr-2 font-bold text-muted-foreground text-xs">[{team.league}]</span>
                      {team.name}
                    </ComboboxItem>
                  ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <div className="mt-4 flex min-h-[40px] flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
            {favoriteTeams.length === 0 && (
              <p className="p-1 text-muted-foreground text-xs italic">No sports teams linked yet.</p>
            )}
            {favoriteTeams.map((teamName, index) => (
              <Badge
                key={index}
                variant="default"
                className="gap-1 bg-primary px-3 py-1 font-bold text-primary-foreground"
              >
                {teamName}
                <button
                  type="button"
                  onClick={() => handleToggleSportsTeam(teamName)}
                  className="ml-1 hover:text-destructive-foreground"
                  disabled={isLoading}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
        <CardHeader className="bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" /> Payment Accounts
          </CardTitle>
          <CardDescription>Manage multiple bank or financial accounts for billing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-2">
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
            <Button type="button" variant="secondary" onClick={handleAddPaymentAccount} disabled={isLoading}>
              Add
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2">
            {paymentAccounts.length === 0 && (
              <p className="rounded-md border bg-muted/20 p-2 text-center text-muted-foreground text-xs italic">
                No payment accounts added yet.
              </p>
            )}
            {paymentAccounts.map((account) => (
              <div
                key={account.id}
                className="group flex items-center justify-between rounded-md border bg-background p-3"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{account.name}</span>
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
