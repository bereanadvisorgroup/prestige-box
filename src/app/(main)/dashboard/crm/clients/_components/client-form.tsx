"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Heart, Trash2, Trophy } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient, updateClient } from "@/actions/clients";
import { getPeople } from "@/actions/people";
import { getClientPoliciesByClient } from "@/actions/policies";
import { PersonAvatar } from "@/components/crm/person-avatar";
import { PersonSearchSelect } from "@/components/crm/person-search-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { sportsTeams } from "@/data/sports-teams";
import { formatPhoneNumber } from "@/lib/utils";
import {
  type Client,
  type ClientFormInput,
  ClientFormSchema,
  type ClientFormValues,
  type PaymentAccount,
  type Person,
} from "@/types/crm";

interface ClientFormProps {
  client?: Client;
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [paymentAccountInput, setPaymentAccountInput] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const form = useForm<ClientFormInput, any, ClientFormValues>({
    resolver: zodResolver(ClientFormSchema),
    defaultValues: client
      ? {
          id: client.id,
          personId: client.personId,
          hobbies: client.hobbies,
          favoriteSportsTeams: client.favoriteSportsTeams,
          paymentAccounts: client.paymentAccounts,
        }
      : {
          personId: "",
          hobbies: [],
          favoriteSportsTeams: [],
          paymentAccounts: [],
        },
  });

  const watchedTeams = form.watch("favoriteSportsTeams") || [];

  const filteredSportsTeams = useMemo(() => {
    const base = sportsTeams.filter((team) => !watchedTeams.includes(team.name));
    if (!teamSearchQuery) return base;
    return base.filter(
      (team) =>
        team.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
        team.league.toLowerCase().includes(teamSearchQuery.toLowerCase()),
    );
  }, [teamSearchQuery, watchedTeams]);

  useEffect(() => {
    async function fetchPeople() {
      const result = await getPeople();
      if (result.success && result.people) {
        setAvailablePeople(result.people);
      }
    }
    fetchPeople();
  }, []);

  const handleAddHobby = () => {
    if (!hobbyInput.trim()) return;
    const current = form.getValues("hobbies") || [];
    if (current.includes(hobbyInput.trim())) return;
    form.setValue("hobbies", [...current, hobbyInput.trim()]);
    setHobbyInput("");
  };

  const handleRemoveHobby = (hobby: string) => {
    const current = form.getValues("hobbies") || [];
    form.setValue(
      "hobbies",
      current.filter((h) => h !== hobby),
    );
  };

  const handleToggleSportsTeam = (teamId: string) => {
    const current = form.getValues("favoriteSportsTeams") || [];
    if (current.includes(teamId)) {
      form.setValue(
        "favoriteSportsTeams",
        current.filter((id) => id !== teamId),
      );
    } else {
      form.setValue("favoriteSportsTeams", [...current, teamId]);
    }
  };

  const handleAddPaymentAccount = () => {
    if (!paymentAccountInput.trim()) return;
    const current = form.getValues("paymentAccounts") || [];
    const newAccount: PaymentAccount = {
      id: crypto.randomUUID(),
      name: paymentAccountInput.trim(),
    };
    form.setValue("paymentAccounts", [...current, newAccount]);
    setPaymentAccountInput("");
  };

  const handleRemovePaymentAccount = async (accountId: string) => {
    if (client?.id) {
      // Check if this account is used by any policy
      const result = await getClientPoliciesByClient(client.id);
      if (result.success && result.policies) {
        const isInUse = result.policies.some((p) => p.paymentAccountId === accountId);
        if (isInUse) {
          toast.error("Cannot delete payment account because it is currently associated with a policy.");
          return;
        }
      }
    }

    const current = form.getValues("paymentAccounts") || [];
    form.setValue(
      "paymentAccounts",
      current.filter((a) => a.id !== accountId),
    );
  };

  async function onSubmit(values: ClientFormValues) {
    try {
      setIsLoading(true);
      const isEditing = !!client?.id;

      const result = isEditing ? await updateClient(client.id!, values) : await createClient(values);

      if (result.success) {
        toast.success(isEditing ? "Client record updated" : "Client record created");
        router.push("/dashboard/crm/clients");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} client record`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedPerson = availablePeople.find((p) => p.id === form.watch("personId"));

  return (
    <Card className="mx-auto w-full max-w-3xl shadow-sm">
      <CardHeader>
        <CardTitle>{client ? "Edit Client Profile" : "Create Client Profile"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {!client && (
              <div className="space-y-4">
                <h3 className="border-b pb-2 font-medium text-sm">Person Association</h3>
                <FormField
                  control={form.control}
                  name="personId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Select Person</FormLabel>
                      <PersonSearchSelect
                        value={field.value}
                        onValueChange={(val) => field.onChange(val)}
                        people={availablePeople}
                        onPersonCreated={(newPerson) => {
                          setAvailablePeople((prev) => [...prev, newPerson]);
                          field.onChange(newPerson.id);
                        }}
                        disabled={!!client}
                      />
                      <FormDescription>Select the person you want to create a CRM client record for.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {selectedPerson && (
              <div
                className={`${client ? "" : "mt-4"} flex items-start gap-4 rounded-lg border bg-muted/30 p-4 text-sm shadow-sm`}
              >
                <PersonAvatar
                  photoUrl={selectedPerson.photoUrl}
                  firstName={selectedPerson.firstName}
                  lastName={selectedPerson.lastName}
                  size="default"
                />
                <div className="grid gap-1">
                  <p className="font-bold text-base leading-none">
                    {selectedPerson.firstName} {selectedPerson.lastName}
                  </p>
                  <div className="mt-1 flex flex-col gap-0.5 text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-foreground/70">Email:</span>{" "}
                      {selectedPerson.emails?.find((e) => e.isPrimary)?.address ||
                        selectedPerson.emails?.[0]?.address ||
                        "N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-foreground/70">Phone:</span>{" "}
                      {formatPhoneNumber(
                        selectedPerson.phones?.find((p) => p.isPrimary)?.number || selectedPerson.phones?.[0]?.number,
                      ) || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <h3 className="flex items-center gap-2 border-b pb-2 font-medium text-sm">
                <Heart className="h-4 w-4 text-primary" />
                Interests & Hobbies
              </h3>

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
                <Button type="button" variant="secondary" onClick={handleAddHobby}>
                  Add
                </Button>
              </div>

              <div className="mt-4 flex min-h-[40px] flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
                {(form.watch("hobbies") || []).length === 0 && (
                  <p className="p-1 text-muted-foreground text-xs italic">No hobbies listed yet.</p>
                )}
                {(form.watch("hobbies") || []).map((hobby, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
                    {hobby}
                    <button
                      type="button"
                      onClick={() => handleRemoveHobby(hobby)}
                      className="ml-1 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="flex items-center gap-2 border-b pb-2 font-medium text-sm">
                <Trophy className="h-4 w-4 text-primary" />
                Favorite Sports Teams
              </h3>

              <div className="space-y-2">
                <FormLabel>Search and Link Teams</FormLabel>
                <Combobox
                  onValueChange={(val) => {
                    if (typeof val === "string") {
                      handleToggleSportsTeam(val);
                      setTeamSearchQuery("");
                    }
                  }}
                  inputValue={teamSearchQuery}
                  onInputValueChange={setTeamSearchQuery}
                >
                  <ComboboxInput placeholder="Search NFL, MLB, NBA, NHL..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {filteredSportsTeams.map((team) => (
                        <ComboboxItem key={team.id} value={team.name}>
                          <span className="mr-2 font-bold text-muted-foreground text-xs">[{team.league}]</span>
                          {team.name}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div className="mt-4 flex min-h-[40px] flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
                {(form.watch("favoriteSportsTeams") || []).length === 0 && (
                  <p className="p-1 text-muted-foreground text-xs italic">No sports teams linked yet.</p>
                )}
                {(form.watch("favoriteSportsTeams") || []).map((teamName, index) => (
                  <Badge
                    key={index}
                    variant="default"
                    className="gap-1 bg-primary px-3 py-1 font-bold text-primary-foreground shadow-sm"
                  >
                    {teamName}
                    <button
                      type="button"
                      onClick={() => handleToggleSportsTeam(teamName)}
                      className="ml-1 hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <h3 className="flex items-center gap-2 border-b pb-2 font-medium text-sm">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment Accounts
              </h3>

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
                <Button type="button" variant="secondary" onClick={handleAddPaymentAccount}>
                  Add
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                {(form.watch("paymentAccounts") || []).length === 0 && (
                  <p className="rounded-md border bg-muted/20 p-2 text-muted-foreground text-xs italic">
                    No payment accounts added yet.
                  </p>
                )}
                {(form.watch("paymentAccounts") || []).map((account) => (
                  <div
                    key={account.id}
                    className="group flex items-center justify-between rounded-md border bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{account.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePaymentAccount(account.id)}
                      className="text-muted-foreground opacity-0 transition-colors hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6 font-semibold">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-bold">
                {isLoading ? "Saving..." : client ? "Update Client Profile" : "Create Client Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
