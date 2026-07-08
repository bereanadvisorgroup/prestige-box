"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client } from "@/types/crm";

interface ReferredByCardProps {
  client: Client;
  allClients: any[];
  allCompanies: any[];
  allPeople: any[];
  allReferralTypes: any[];
  allEvents: any[];
  allAdvisors?: any[];
}

export function ReferredByCard({
  client,
  allClients = [],
  allCompanies = [],
  allPeople = [],
  allReferralTypes = [],
  allEvents = [],
  allAdvisors = [],
}: ReferredByCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Referral states
  const [referredByType, setReferredByType] = useState<string | null>(client.referredByType || null);
  const [referredById, setReferredById] = useState<string | null>(client.referredById || null);
  const [referredByCompanyId, setReferredByCompanyId] = useState<string | null>(client.referredByCompanyId || null);
  const [referredByPersonId, setReferredByPersonId] = useState<string | null>(client.referredByPersonId || null);
  const [referredByReferralTypeId, setReferredByReferralTypeId] = useState<string | null>(
    client.referredByReferralTypeId || null,
  );
  const [referredByEventId, setReferredByEventId] = useState<string | null>(client.referredByEventId || null);
  const [referredByAdvisorId, setReferredByAdvisorId] = useState<string | null>(client.referredByAdvisorId || null);

  // Search query for combobox
  const [searchQuery, setSearchQuery] = useState("");

  // Sync state with client prop changes
  useEffect(() => {
    setReferredByType(client.referredByType || null);
    setReferredById(client.referredById || null);
    setReferredByCompanyId(client.referredByCompanyId || null);
    setReferredByPersonId(client.referredByPersonId || null);
    setReferredByReferralTypeId(client.referredByReferralTypeId || null);
    setReferredByEventId(client.referredByEventId || null);
    setReferredByAdvisorId(client.referredByAdvisorId || null);
  }, [client]);

  // Determine current active entity ID based on type
  const activeEntityId = useMemo(() => {
    if (!referredByType || referredByType === "none") return "";
    if (referredByType === "client") return referredById || "";
    if (referredByType === "company") return referredByCompanyId || "";
    if (referredByType === "person") return referredByPersonId || "";
    if (referredByType === "referral_type") return referredByReferralTypeId || "";
    if (referredByType === "event") return referredByEventId || "";
    if (referredByType === "advisor") return referredByAdvisorId || "";
    return "";
  }, [
    referredByType,
    referredById,
    referredByCompanyId,
    referredByPersonId,
    referredByReferralTypeId,
    referredByEventId,
    referredByAdvisorId,
  ]);

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
    if (referredByType === "event") {
      const match = allEvents.find((e) => e.id === referredByEventId);
      return match ? match.title : "";
    }
    if (referredByType === "advisor") {
      const match = allAdvisors.find((u) => u.uid === referredByAdvisorId);
      return match ? `${match.firstName || ""} ${match.lastName || ""}`.trim() : "";
    }
    return "";
  }, [
    referredByType,
    referredById,
    referredByCompanyId,
    referredByPersonId,
    referredByReferralTypeId,
    referredByEventId,
    referredByAdvisorId,
    allClients,
    allCompanies,
    allPeople,
    allReferralTypes,
    allEvents,
    allAdvisors,
  ]);

  useEffect(() => {
    setSearchQuery(activeLabel);
  }, [activeLabel]);

  // Filter lists based on search queries
  const clientOptions = useMemo(() => {
    const list = allClients.filter((c) => c.id !== client.id);
    if (!searchQuery) return list;
    return list.filter((c) => {
      const name = `${c.person?.firstName || ""} ${c.person?.lastName || ""}`.toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    });
  }, [allClients, client.id, searchQuery]);

  const companyOptions = useMemo(() => {
    if (!searchQuery) return allCompanies;
    return allCompanies.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allCompanies, searchQuery]);

  const personOptions = useMemo(() => {
    if (!searchQuery) return allPeople;
    return allPeople.filter((p) => {
      const name = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    });
  }, [allPeople, searchQuery]);

  const referralTypeOptions = useMemo(() => {
    if (!searchQuery) return allReferralTypes;
    return allReferralTypes.filter((rt) => rt.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allReferralTypes, searchQuery]);

  const eventOptions = useMemo(() => {
    if (!searchQuery) return allEvents;
    return allEvents.filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allEvents, searchQuery]);

  const advisorOptions = useMemo(() => {
    if (!searchQuery) return allAdvisors;
    return allAdvisors.filter((u) => {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    });
  }, [allAdvisors, searchQuery]);

  // Handle source type changes
  const handleTypeChange = async (type: string) => {
    const newType = type === "none" ? null : type;
    setReferredByType(newType);
    setSearchQuery("");

    // Clear all entity IDs
    setReferredById(null);
    setReferredByCompanyId(null);
    setReferredByPersonId(null);
    setReferredByReferralTypeId(null);
    setReferredByEventId(null);
    setReferredByAdvisorId(null);

    // If "none", save immediately
    if (!newType) {
      await saveReferral({
        referredByType: null,
        referredById: null,
        referredByCompanyId: null,
        referredByPersonId: null,
        referredByReferralTypeId: null,
        referredByEventId: null,
        referredByAdvisorId: null,
      });
    }
  };

  // Save changes helper
  const saveReferral = async (payload: {
    referredByType: string | null;
    referredById: string | null;
    referredByCompanyId: string | null;
    referredByPersonId: string | null;
    referredByReferralTypeId: string | null;
    referredByEventId: string | null;
    referredByAdvisorId: string | null;
  }) => {
    try {
      setIsLoading(true);
      const res = await updateClient(client.id!, payload);
      if (res.success) {
        toast.success("Referrer updated");
        router.refresh();
      } else {
        throw new Error(res.error || "Failed to update referrer");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update referrer");
      // Revert states
      setReferredByType(client.referredByType || null);
      setReferredById(client.referredById || null);
      setReferredByCompanyId(client.referredByCompanyId || null);
      setReferredByPersonId(client.referredByPersonId || null);
      setReferredByReferralTypeId(client.referredByReferralTypeId || null);
      setReferredByEventId(client.referredByEventId || null);
      setReferredByAdvisorId(client.referredByAdvisorId || null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a specific entity
  const handleEntitySelect = async (entityId: string) => {
    const isClear = entityId === "none";

    const payload = {
      referredByType: isClear ? null : referredByType,
      referredById: !isClear && referredByType === "client" ? entityId : null,
      referredByCompanyId: !isClear && referredByType === "company" ? entityId : null,
      referredByPersonId: !isClear && referredByType === "person" ? entityId : null,
      referredByReferralTypeId: !isClear && referredByType === "referral_type" ? entityId : null,
      referredByEventId: !isClear && referredByType === "event" ? entityId : null,
      referredByAdvisorId: !isClear && referredByType === "advisor" ? entityId : null,
    };

    setReferredById(payload.referredById);
    setReferredByCompanyId(payload.referredByCompanyId);
    setReferredByPersonId(payload.referredByPersonId);
    setReferredByReferralTypeId(payload.referredByReferralTypeId);
    setReferredByEventId(payload.referredByEventId);
    setReferredByAdvisorId(payload.referredByAdvisorId);

    if (isClear) {
      setReferredByType(null);
    }

    await saveReferral(payload);
  };

  return (
    <Card className="border-none shadow-sm transition-shadow hover:shadow-md flex flex-col h-full min-h-[220px]">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center w-full">
          <span className="text-2xl font-medium tracking-tight text-neutral-800 dark:text-neutral-200">
            Referred By: {activeLabel && <span className="text-primary font-semibold ml-1">{activeLabel}</span>}
          </span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center space-y-4">
        {/* Source Type Select */}
        <div className="space-y-1">
          <label
            htmlFor="referrer-type-select"
            className="text-xs font-semibold text-neutral-500 dark:text-neutral-400"
          >
            Referrer Type
          </label>
          <Select value={referredByType || "none"} onValueChange={handleTypeChange} disabled={isLoading}>
            <SelectTrigger
              id="referrer-type-select"
              className="w-full bg-white dark:bg-zinc-950 border-neutral-300 focus-visible:ring-neutral-400"
            >
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground italic">None / Clear</span>
              </SelectItem>
              <SelectItem value="advisor">Advisor</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="person">Person</SelectItem>
              <SelectItem value="referral_type">Referral Type</SelectItem>
              <SelectItem value="event">Event</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conditional Referrer Entity Select */}
        {referredByType && referredByType !== "none" && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex justify-between items-center">
              <label
                htmlFor="referrer-entity-select"
                className="text-xs font-semibold text-neutral-500 dark:text-neutral-400"
              >
                Select Referrer
              </label>
              {activeLabel && <span className="text-xs font-semibold text-primary">Current: {activeLabel}</span>}
            </div>
            <Combobox
              value={activeEntityId}
              onValueChange={(val: unknown) => {
                if (typeof val === "string") handleEntitySelect(val);
              }}
              inputValue={searchQuery}
              onInputValueChange={setSearchQuery}
              disabled={isLoading}
            >
              <ComboboxInput
                id="referrer-entity-select"
                placeholder={`Search ${referredByType === "referral_type" ? "referral types" : referredByType === "event" ? "events" : referredByType === "advisor" ? "advisors" : referredByType + "s"}...`}
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

                  {referredByType === "event" &&
                    eventOptions.map((e) => (
                      <ComboboxItem key={e.id} value={e.id} label={e.title}>
                        {e.title}
                      </ComboboxItem>
                    ))}

                  {referredByType === "advisor" &&
                    advisorOptions.map((u) => {
                      const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
                      return (
                        <ComboboxItem key={u.uid} value={u.uid} label={name}>
                          {name}
                        </ComboboxItem>
                      );
                    })}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
