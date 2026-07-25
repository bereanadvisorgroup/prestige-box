"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase.server";
import { type Household, HouseholdSchema, type Person } from "@/types/crm";

const TABLE = "households";

export async function getHouseholds() {
  try {
    const { data: households, error } = await supabaseServer.from(TABLE).select("*").order("name", { ascending: true });

    if (error) throw new Error((error as { message: string }).message);

    // Collect all member client/person IDs to resolve names
    const allMemberIds: string[] = [];
    for (const h of households || []) {
      const memberList = h.members || h.memberIds || [];
      for (const m of memberList) {
        const id = m.clientId || m.personId;
        if (id) allMemberIds.push(id);
      }
    }

    const uniqueIds = Array.from(new Set(allMemberIds));
    const personNameMap: Record<string, string> = {};

    if (uniqueIds.length > 0) {
      const { data: clientsData } = await supabaseServer.from("clients").select("id, personId").in("id", uniqueIds);

      const clientToPersonMap: Record<string, string> = {};
      const personIdsToFetch = new Set<string>();

      for (const c of clientsData || []) {
        clientToPersonMap[c.id] = c.personId;
        personIdsToFetch.add(c.personId);
      }

      for (const id of uniqueIds) {
        if (!clientToPersonMap[id]) {
          personIdsToFetch.add(id);
        }
      }

      const { data: peopleData } = await supabaseServer
        .from("people")
        .select("id, firstName, lastName")
        .in("id", Array.from(personIdsToFetch));

      for (const p of peopleData || []) {
        personNameMap[p.id] = `${p.firstName} ${p.lastName}`;
      }

      for (const [cId, pId] of Object.entries(clientToPersonMap)) {
        if (personNameMap[pId]) {
          personNameMap[cId] = personNameMap[pId];
        }
      }
    }

    const enrichedHouseholds = (households || []).map((h) => {
      const memberList = (h.members || h.memberIds || []) as any[];
      const head = memberList.find((m) => m.role === "HEAD" || m.role === "home_owner");
      const spouse = memberList.find((m) => m.role === "SPOUSE" || m.role === "PARTNER");
      const dependents = memberList.filter((m) => m.role === "DEPENDENT" || m.role === "dependent");

      const headName = head ? personNameMap[head.clientId || head.personId] : undefined;
      const spouseName = spouse ? personNameMap[spouse.clientId || spouse.personId] : undefined;

      let headAndSpouse = "—";
      if (headName && spouseName) {
        headAndSpouse = `${headName} & ${spouseName}`;
      } else if (headName) {
        headAndSpouse = headName;
      } else if (spouseName) {
        headAndSpouse = spouseName;
      }

      return {
        ...h,
        members: memberList,
        headName,
        spouseName,
        headAndSpouse,
        dependentCount: dependents.length,
        totalMembersCount: memberList.length,
      };
    });

    return { success: true, households: enrichedHouseholds as Household[] };
  } catch (error) {
    console.error(`[getHouseholds] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getHousehold(id: string) {
  try {
    const { data: household, error: hError } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (hError) throw new Error((hError as { message: string }).message);
    if (!household) return { success: false, error: "Household not found" };

    // Fetch details for address
    let address = null;
    if (household.addressId) {
      const { data: addrData, error: addrError } = await supabaseServer
        .from("addresses")
        .select("*")
        .eq("id", household.addressId)
        .single();
      if (!addrError) {
        address = addrData;
      }
    }

    // Fetch details for members
    let members: {
      person: Person | null;
      clientId: string;
      role: string;
      isPrimaryHousehold: boolean;
      includeInFinancialRollup: boolean;
      familyRelationship?: string;
    }[] = [];
    const memberList = household.members || household.memberIds || [];
    if (memberList.length > 0) {
      const clientIds = memberList.map((m: { clientId?: string; personId?: string }) => m.clientId || m.personId);
      const { data: clientsData } = await supabaseServer.from("clients").select("id, personId").in("id", clientIds);

      const personIdsFromClients = (clientsData || []).map((c) => c.personId).filter(Boolean);
      const { data: peopleData } = await supabaseServer
        .from("people")
        .select("*")
        .in("id", [...personIdsFromClients, ...clientIds]);

      if (peopleData) {
        const peopleMap = peopleData.reduce(
          (acc, person) => {
            acc[person.id] = person;
            return acc;
          },
          {} as Record<string, Person>,
        );

        const clientToPersonMap = (clientsData || []).reduce(
          (acc, client) => {
            acc[client.id] = peopleMap[client.personId] || null;
            return acc;
          },
          {} as Record<string, Person | null>,
        );

        members = memberList.map((m: any) => {
          const cId = m.clientId || m.personId;
          const person = clientToPersonMap[cId] || peopleMap[cId] || null;
          return {
            person,
            clientId: cId,
            role: m.role || "MEMBER",
            isPrimaryHousehold: m.isPrimaryHousehold ?? false,
            includeInFinancialRollup: m.includeInFinancialRollup ?? true,
            familyRelationship: m.familyRelationship,
          };
        });
      }
    }

    return { success: true, household: household as Household, address, members };
  } catch (error) {
    console.error(`[getHousehold] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createHousehold(data: Partial<Household>) {
  try {
    const validated = HouseholdSchema.parse({
      ...data,
      createdAt: new Date().toISOString(),
    });

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(validated).select().single();

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/households");

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createHousehold] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateHousehold(id: string, data: Partial<Household>) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/households");
    revalidatePath(`/dashboard/crm/households/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`[updateHousehold] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteHousehold(id: string) {
  try {
    const { error } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    revalidatePath("/dashboard/crm/households");

    return { success: true };
  } catch (error) {
    console.error(`[deleteHousehold] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getHouseholdActiveRollupClients(householdId: string) {
  try {
    const res = await getHousehold(householdId);
    if (!res.success || !res.household) {
      return { success: false, error: "Household not found", clientIds: [], activeMembers: [] };
    }

    const members = res.members || [];
    const activeMembers = members.filter((m) => m.includeInFinancialRollup !== false);
    const clientIds = Array.from(new Set(activeMembers.map((m) => m.clientId).filter(Boolean) as string[]));

    return {
      success: true,
      household: res.household,
      address: res.address,
      members,
      activeMembers,
      clientIds,
    };
  } catch (error) {
    console.error(`[getHouseholdActiveRollupClients] Error:`, error);
    return { success: false, error: (error as { message: string }).message, clientIds: [], activeMembers: [] };
  }
}

export async function getHouseholdAssociationCounts(householdId: string) {
  try {
    const activeRes = await getHouseholdActiveRollupClients(householdId);
    if (!activeRes.success || activeRes.clientIds.length === 0) {
      return {
        success: true,
        counts: {
          accountingFirms: 0,
          actuarialFirms: 0,
          banks: 0,
          lawFirms: 0,
          propertyAndCasualty: 0,
          moneyManagers: 0,
          recordKeepers: 0,
          lifeInsurance: 0,
          disabilityInsurance: 0,
          longTermCare: 0,
        },
      };
    }

    const clientIds: string[] = activeRes.clientIds;

    const [
      lawFirmsRes,
      accountingFirmsRes,
      actuarialFirmsRes,
      banksRes,
      propertyAndCasualtyRes,
      moneyManagersRes,
      recordKeepersRes,
      lifeRes,
      disabilityRes,
      ltcRes,
    ] = await Promise.all([
      supabaseServer.from("law_firms").select("id, clientIds"),
      supabaseServer.from("accounting_firms").select("id, clientIds"),
      supabaseServer.from("actuarial_firms").select("id, clientIds"),
      supabaseServer.from("banks").select("id, clientIds"),
      supabaseServer.from("property_and_casualty_firms").select("id, clientIds"),
      supabaseServer.from("money_managers").select("id, clientIds"),
      supabaseServer.from("record_keepers").select("id, clientIds"),
      supabaseServer.from("life_insurance_companies").select("id, clientIds"),
      supabaseServer.from("disability_insurance_companies").select("id, clientIds"),
      supabaseServer.from("long_term_care_insurance").select("id, clientIds"),
    ]);

    const filterByClientIds = (list: { clientIds?: string[] | null }[]) =>
      list.filter((item) => item.clientIds?.some((id: string) => clientIds.includes(id))).length;

    return {
      success: true,
      counts: {
        accountingFirms: filterByClientIds(accountingFirmsRes.data || []),
        actuarialFirms: filterByClientIds(actuarialFirmsRes.data || []),
        banks: filterByClientIds(banksRes.data || []),
        lawFirms: filterByClientIds(lawFirmsRes.data || []),
        propertyAndCasualty: filterByClientIds(propertyAndCasualtyRes.data || []),
        moneyManagers: filterByClientIds(moneyManagersRes.data || []),
        recordKeepers: filterByClientIds(recordKeepersRes.data || []),
        lifeInsurance: filterByClientIds(lifeRes.data || []),
        disabilityInsurance: filterByClientIds(disabilityRes.data || []),
        longTermCare: filterByClientIds(ltcRes.data || []),
      },
    };
  } catch (error) {
    console.error("Error fetching household association counts", error);
    return { success: false, error: (error as Error).message };
  }
}
