"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Eye, EyeOff, Heart, Trash2, Trophy } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient, updateClient } from "@/actions/clients";
import { getPeople } from "@/actions/people";
import { getClientPoliciesByClient } from "@/actions/policies";
import { createUser, getUsers } from "@/actions/users";
import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { PersonSearchSelect } from "@/components/features/crm/person-search-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SsnInput } from "@/components/ui/ssn-input";
import { sportsTeams } from "@/data/sports-teams";
import { formatPersonName, formatPhoneNumber } from "@/lib/utils";
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
  const [advisors, setAdvisors] = useState<{ uid: string; name: string }[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [createPortalAccount, setCreatePortalAccount] = useState(true);
  const [showSSN, setShowSSN] = useState(false);

  const form = useForm<ClientFormInput, any, ClientFormValues>({
    resolver: zodResolver(ClientFormSchema),
    defaultValues: client
      ? {
          id: client.id,
          personId: client.personId,
          advisorId: client.advisorId ?? null,
          hobbies: client.hobbies,
          favoriteSportsTeams: client.favoriteSportsTeams,
          paymentAccounts: client.paymentAccounts,
          driversLicense: client.driversLicense
            ? {
                number: client.driversLicense.number ?? "",
                issueState:
                  ((client.driversLicense as Record<string, unknown>).issueState as string) ??
                  ((client.driversLicense as Record<string, unknown>).state as string) ??
                  "",
                issueDate: client.driversLicense.issueDate ?? "",
                expirationDate: client.driversLicense.expirationDate ?? "",
              }
            : {
                number: "",
                issueState: "",
                issueDate: "",
                expirationDate: "",
              },
          pii: client.pii
            ? {
                ssn: client.pii.ssn ?? "",
                biologicalGender: client.pii.biologicalGender ?? undefined,
                birthDate: client.pii.birthDate ?? "",
              }
            : {
                ssn: "",
                biologicalGender: undefined,
                birthDate: "",
              },
        }
      : {
          personId: "",
          advisorId: null,
          hobbies: [],
          favoriteSportsTeams: [],
          paymentAccounts: [],
          driversLicense: {
            number: "",
            issueState: "",
            issueDate: "",
            expirationDate: "",
          },
          pii: {
            ssn: "",
            biologicalGender: undefined,
            birthDate: "",
          },
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
    async function fetchAdvisors() {
      const result = await getUsers();
      if (result.success && result.users) {
        setAdvisors(
          result.users
            .filter((u) => u.role === "admin" || u.role === "advisor")
            .map((u) => ({ uid: u.uid, name: `${u.firstName} ${u.lastName}`.trim() || u.email })),
        );
      }
    }
    fetchPeople();
    fetchAdvisors();
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

  async function onSubmit(values: ClientFormValues) {
    try {
      setIsLoading(true);
      const isEditing = !!client?.id;

      // Clean up empty optional compound objects if not fully filled out
      const submission = { ...values };
      if (!submission.driversLicense?.number && !submission.driversLicense?.issueState) {
        delete submission.driversLicense;
      }
      if (!submission.pii?.ssn && !submission.pii?.biologicalGender && !submission.pii?.birthDate) {
        delete submission.pii;
      }

      const result = isEditing ? await updateClient(client.id!, submission) : await createClient(submission);

      if (result.success) {
        toast.success(isEditing ? "Client record updated" : "Client record created");

        if (!isEditing && createPortalAccount && selectedPerson) {
          const email = selectedPerson.emails?.find((e) => e.isPrimary)?.address || selectedPerson.emails?.[0]?.address;
          if (email) {
            const userResult = await createUser({
              email,
              firstName: selectedPerson.firstName,
              lastName: selectedPerson.lastName,
              role: "client",
              origin: window.location.origin,
            });
            if (userResult.success) {
              toast.success("Client portal account created successfully.");
            } else {
              toast.error("Failed to create portal account: " + userResult.error);
            }
          } else {
            toast.warning("Could not create portal account: Person has no email address.");
          }
        }

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
                {selectedPerson && (
                  <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <Checkbox
                      id="createPortalAccount"
                      checked={createPortalAccount}
                      onCheckedChange={(checked) => setCreatePortalAccount(checked === true)}
                    />
                    <div className="space-y-1 leading-none">
                      <label htmlFor="createPortalAccount" className="font-medium text-sm leading-none cursor-pointer">
                        Create Client Portal Account
                      </label>
                      <p className="text-muted-foreground text-sm">
                        Automatically create a user account for this client. An email with a password setup link will be
                        sent to their primary email address.
                      </p>
                    </div>
                  </div>
                )}
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
                  goesBy={selectedPerson.goesBy}
                  size="default"
                />
                <div className="grid gap-1">
                  <p className="font-bold text-base leading-none">{formatPersonName(selectedPerson)}</p>
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

            <FormField
              control={form.control}
              name="advisorId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Assigned Advisor</FormLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select advisor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {advisors.map((a) => (
                        <SelectItem key={a.uid} value={a.uid}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Auto-generated birthday, anniversary, and renewal tasks are assigned to this advisor.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Drivers License Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="border-b pb-2 font-medium text-sm">Driver&apos;s License</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="driversLicense.number"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>DL Number</FormLabel>
                      <FormControl>
                        <Input placeholder="D12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="driversLicense.issueState"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Issue State</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="driversLicense.issueDate"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="driversLicense.expirationDate"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Expiration Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* PII Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="border-b pb-2 font-medium text-sm">Personal Identifiable Information (PII)</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="pii.ssn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SSN</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <SsnInput type={showSSN ? "text" : "password"} placeholder="XXX-XX-XXXX" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowSSN(!showSSN)}
                        >
                          {showSSN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showSSN ? "Hide SSN" : "Show SSN"}</span>
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pii.biologicalGender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biological Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pii.birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {!!client && (
              <>
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
              </>
            )}

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
