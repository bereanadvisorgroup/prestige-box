"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CreditCard, Heart, Link as LinkIcon, Trash2, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { getClientPoliciesByClient } from "@/actions/policies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sportsTeams } from "@/data/sports-teams";
import type { Client, PaymentAccount } from "@/types/crm";

export function GeneralTab({
  client,
  allClients = [],
  allCompanies = [],
  allPeople = [],
  allReferralTypes = [],
}: {
  client: Client;
  allClients?: any[];
  allCompanies?: any[];
  allPeople?: any[];
  allReferralTypes?: any[];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hobbies, setHobbies] = useState<string[]>(client.hobbies || []);
  const [hobbyInput, setHobbyInput] = useState("");
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(client.favoriteSportsTeams || []);
  // Referral states
  const [referredByType, setReferredByType] = useState<string | null>(client.referredByType || null);
  const [referredById, setReferredById] = useState<string | null>(client.referredById || null);
  const [referredByCompanyId, setReferredByCompanyId] = useState<string | null>(client.referredByCompanyId || null);
  const [referredByPersonId, setReferredByPersonId] = useState<string | null>(client.referredByPersonId || null);
  const [referredByReferralTypeId, setReferredByReferralTypeId] = useState<string | null>(
    client.referredByReferralTypeId || null,
  );

  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(client.paymentAccounts || []);
  const [paymentAccountInput, setPaymentAccountInput] = useState("");

  const [referrerSearchQuery, setReferrerSearchQuery] = useState("");

  // Sync state with client prop changes
  useEffect(() => {
    setReferredByType(client.referredByType || null);
    setReferredById(client.referredById || null);
    setReferredByCompanyId(client.referredByCompanyId || null);
    setReferredByPersonId(client.referredByPersonId || null);
    setReferredByReferralTypeId(client.referredByReferralTypeId || null);
  }, [client]);

  const referredClients = allClients.filter((c) => c.referredById === client.id);

  // Determine current active entity ID based on type
  const activeEntityId = useMemo(() => {
    if (!referredByType || referredByType === "none") return "";
    if (referredByType === "client") return referredById || "";
    if (referredByType === "company") return referredByCompanyId || "";
    if (referredByType === "person") return referredByPersonId || "";
    if (referredByType === "referral_type") return referredByReferralTypeId || "";
    return "";
  }, [referredByType, referredById, referredByCompanyId, referredByPersonId, referredByReferralTypeId]);

  // Compute active referrer name for display in input
  const activeLabel = useMemo(() => {
    if (!referredByType || referredByType === "none") return "";
    if (referredByType === "client") {
      const match = allClients.find((c) => c.id === referredById);
      return match ? `${match.person?.firstName || ""} ${match.person?.lastName || ""}`.trim() : "";
    }
    if (referredByType === "company") {
      const match = allCompanies.find((c) => c.id === referredByCompanyId);
      return match ? match.name : "";
    }
    if (referredByType === "person") {
      const match = allPeople.find((p) => p.id === referredByPersonId);
      return match ? `${match.firstName || ""} ${match.lastName || ""}`.trim() : "";
    }
    if (referredByType === "referral_type") {
      const match = allReferralTypes.find((rt) => rt.id === referredByReferralTypeId);
      return match ? match.name : "";
    }
    return "";
  }, [
    referredByType,
    referredById,
    referredByCompanyId,
    referredByPersonId,
    referredByReferralTypeId,
    allClients,
    allCompanies,
    allPeople,
    allReferralTypes,
  ]);

  useEffect(() => {
    setReferrerSearchQuery(activeLabel);
  }, [activeLabel]);

  // Filter lists based on search queries
  const clientOptions = useMemo(() => {
    const list = allClients.filter((c) => c.id !== client.id);
    if (!referrerSearchQuery) return list;
    return list.filter((c) => {
      const name = `${c.person?.firstName || ""} ${c.person?.lastName || ""}`.toLowerCase();
      return name.includes(referrerSearchQuery.toLowerCase());
    });
  }, [allClients, client.id, referrerSearchQuery]);

  const companyOptions = useMemo(() => {
    if (!referrerSearchQuery) return allCompanies;
    return allCompanies.filter((c) => c.name.toLowerCase().includes(referrerSearchQuery.toLowerCase()));
  }, [allCompanies, referrerSearchQuery]);

  const personOptions = useMemo(() => {
    if (!referrerSearchQuery) return allPeople;
    return allPeople.filter((p) => {
      const name = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
      return name.includes(referrerSearchQuery.toLowerCase());
    });
  }, [allPeople, referrerSearchQuery]);

  const referralTypeOptions = useMemo(() => {
    if (!referrerSearchQuery) return allReferralTypes;
    return allReferralTypes.filter((rt) => rt.name.toLowerCase().includes(referrerSearchQuery.toLowerCase()));
  }, [allReferralTypes, referrerSearchQuery]);

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
    const next = favoriteTeams.includes(teamName)
      ? favoriteTeams.filter((t) => t !== teamName)
      : [...favoriteTeams, teamName];
    setFavoriteTeams(next);
    handleUpdate({ favoriteSportsTeams: next });
  };

  const handleTypeChange = (type: string) => {
    const newType = type === "none" ? null : type;
    setReferredByType(newType);
    setReferrerSearchQuery("");

    setReferredById(null);
    setReferredByCompanyId(null);
    setReferredByPersonId(null);
    setReferredByReferralTypeId(null);

    if (!newType) {
      handleUpdate({
        referredByType: null,
        referredById: null,
        referredByCompanyId: null,
        referredByPersonId: null,
        referredByReferralTypeId: null,
      });
    }
  };

  const handleEntitySelect = (entityId: string) => {
    const isClear = entityId === "none";

    const payload = {
      referredByType: isClear ? null : referredByType,
      referredById: !isClear && referredByType === "client" ? entityId : null,
      referredByCompanyId: !isClear && referredByType === "company" ? entityId : null,
      referredByPersonId: !isClear && referredByType === "person" ? entityId : null,
      referredByReferralTypeId: !isClear && referredByType === "referral_type" ? entityId : null,
    };

    setReferredById(payload.referredById);
    setReferredByCompanyId(payload.referredByCompanyId);
    setReferredByPersonId(payload.referredByPersonId);
    setReferredByReferralTypeId(payload.referredByReferralTypeId);

    if (isClear) {
      setReferredByType(null);
    }

    handleUpdate(payload);
  };

  return (
    <div className="space-y-6">
      <Card className="border-none bg-gradient-to-b from-card to-muted/20 shadow-md">
        <CardHeader className="bg-muted/10">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" /> Referrals:{" "}
            {activeLabel && <span className="text-primary font-semibold ml-1">{activeLabel}</span>}
          </CardTitle>
          <CardDescription>Manage who referred this client and the clients they have referred.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="referrer-type-select" className="font-semibold text-foreground text-sm">
                Referrer Type
              </label>
              <Select value={referredByType || "none"} onValueChange={handleTypeChange} disabled={isLoading}>
                <SelectTrigger
                  id="referrer-type-select"
                  className="w-full bg-white dark:bg-zinc-950 border-neutral-300"
                >
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground italic">None / Clear</span>
                  </SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="referral_type">Referral Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {referredByType && referredByType !== "none" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="referrer-entity-select" className="font-semibold text-foreground text-sm">
                    Select Referrer
                  </label>
                  {activeLabel && <span className="text-xs font-semibold text-primary">Current: {activeLabel}</span>}
                </div>
                <Combobox
                  value={activeEntityId}
                  onValueChange={(val: unknown) => {
                    if (typeof val === "string") handleEntitySelect(val);
                  }}
                  inputValue={referrerSearchQuery}
                  onInputValueChange={setReferrerSearchQuery}
                  disabled={isLoading}
                >
                  <ComboboxInput
                    id="referrer-entity-select"
                    placeholder={`Search ${referredByType === "referral_type" ? "referral types" : referredByType + "s"}...`}
                  />
                  <ComboboxContent className="w-full min-w-[280px]">
                    <ComboboxList>
                      <ComboboxItem value="none">
                        <span className="text-muted-foreground italic">Clear Referrer</span>
                      </ComboboxItem>

                      {referredByType === "client" &&
                        clientOptions.map((c) => {
                          const name = `${c.person?.firstName || ""} ${c.person?.lastName || ""}`.trim();
                          return (
                            <ComboboxItem key={c.id} value={c.id} label={name}>
                              {name}
                            </ComboboxItem>
                          );
                        })}

                      {referredByType === "company" &&
                        companyOptions.map((c) => (
                          <ComboboxItem key={c.id} value={c.id} label={c.name}>
                            {c.name}
                          </ComboboxItem>
                        ))}

                      {referredByType === "person" &&
                        personOptions.map((p) => {
                          const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();
                          return (
                            <ComboboxItem key={p.id} value={p.id} label={name}>
                              {name}
                            </ComboboxItem>
                          );
                        })}

                      {referredByType === "referral_type" &&
                        referralTypeOptions.map((rt) => (
                          <ComboboxItem key={rt.id} value={rt.id} label={rt.name}>
                            {rt.name}
                          </ComboboxItem>
                        ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="block font-semibold text-foreground text-sm">Referred Clients</span>
            <div className="rounded-md border bg-muted/5 p-4">
              {referredClients.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {referredClients.map((refClient) => (
                    <div
                      key={refClient.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                    >
                      <span className="font-medium text-sm">
                        {refClient.person?.firstName} {refClient.person?.lastName}
                      </span>
                      <Link href={`/dashboard/crm/clients/${refClient.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                        >
                          <LinkIcon className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-xs italic">
                  This client has not referred anyone yet.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
