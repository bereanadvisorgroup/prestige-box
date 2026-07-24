"use server";

import { revalidatePath } from "next/cache";

import { COMPANY_PROFILE_FIELDS } from "@/lib/history/fields";
import { resolvePersonNames } from "@/lib/history/person-names";
import { formatValue, getCurrentActor, recordEvent, recordFieldDiffs } from "@/lib/history/record";
import { supabaseServer } from "@/lib/supabase.server";
import { type Company, CompanyFormSchema, type CompanyValuationHistory } from "@/types/crm";

const TABLE = "companies";

export async function getCompanies() {
  try {
    const { data: companies, error } = await supabaseServer
      .from(TABLE)
      .select("*, owners:company_owners(id, personId)");

    if (error) throw new Error((error as { message: string }).message);

    return { success: true, companies: companies as any[] };
  } catch (error) {
    console.error(`[getCompanies] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getCompanyOwners(companyId: string) {
  try {
    const { data: owners, error } = await supabaseServer
      .from("company_owners")
      .select(`
        id,
        companyId,
        personId,
        ownershipPercentage,
        person:people (
          id,
          firstName,
          lastName,
          photoUrl
        )
      `)
      .eq("companyId", companyId);

    if (error) throw new Error(error.message);

    // Fetch all clients to check if owners are clients
    const { data: clients, error: clientsError } = await supabaseServer.from("clients").select("id, personId");

    if (clientsError) throw new Error(clientsError.message);

    const clientPersonMap = new Map((clients || []).map((c) => [c.personId, c.id]));

    const ownersWithClientTag = (owners || []).map((owner: any) => ({
      ...owner,
      isClient: clientPersonMap.has(owner.personId),
      clientId: clientPersonMap.get(owner.personId) || null,
    }));

    return { success: true, owners: ownersWithClientTag };
  } catch (error) {
    console.error("[getCompanyOwners] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getCompaniesByClient(clientId: string) {
  try {
    // Get the client's personId
    const { data: client, error: clientError } = await supabaseServer
      .from("clients")
      .select("personId")
      .eq("id", clientId)
      .single();

    if (clientError) throw new Error(clientError.message);
    if (!client) return { success: true, companies: [] };

    // Get company IDs where this person is an owner
    const { data: owners, error: ownersError } = await supabaseServer
      .from("company_owners")
      .select("companyId")
      .eq("personId", client.personId);

    if (ownersError) throw new Error(ownersError.message);
    if (!owners || owners.length === 0) return { success: true, companies: [] };

    const companyIds = owners.map((o) => o.companyId);

    // Fetch those companies
    const { data: companies, error: companiesError } = await supabaseServer
      .from(TABLE)
      .select("*, owners:company_owners(id)")
      .in("id", companyIds);

    if (companiesError) throw new Error(companiesError.message);

    return { success: true, companies: companies as Company[] };
  } catch (error) {
    console.error(`[getCompaniesByClient] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getCompany(id: string) {
  try {
    const { data: company, error } = await supabaseServer.from(TABLE).select("*").eq("id", id).single();

    if (error) throw new Error((error as { message: string }).message);
    if (!company) return { success: false, error: "Company not found" };

    // Fetch owners
    const ownersResult = await getCompanyOwners(id);
    const owners = ownersResult.success ? ownersResult.owners || [] : [];

    return { success: true, company: { ...company, owners } as any };
  } catch (error) {
    console.error(`[getCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createCompany(data: any) {
  try {
    const validated = CompanyFormSchema.parse({
      ...data,
    });

    const { owners, ...companyData } = validated;

    const insertData = {
      ...companyData,
      addressId: companyData.addressId || null,
      advisorId: companyData.advisorId || null,
      dba: companyData.dba || null,
      ein: companyData.ein || null,
      website: companyData.website || null,
      phone: companyData.phone || null,
      logoUrl: companyData.logoUrl || null,
      documentUrl: companyData.documentUrl || null,
      notebookUrl: companyData.notebookUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabaseServer.from(TABLE).insert(insertData).select().single();

    if (error) throw new Error((error as { message: string }).message);

    // Insert owners if provided
    if (owners && owners.length > 0) {
      const ownersToInsert = owners.map((owner) => ({
        companyId: inserted.id,
        personId: owner.personId,
        ownershipPercentage: owner.ownershipPercentage.toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const { error: ownersError } = await supabaseServer.from("company_owners").insert(ownersToInsert);
      if (ownersError) throw new Error(ownersError.message);
    }

    // Insert initial snapshot into company_valuation_history
    const initialSnapshot = {
      companyId: inserted.id,
      value: validated.estimatedValue || 0,
      valuationDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error: historyError } = await supabaseServer.from("company_valuation_history").insert(initialSnapshot);
    if (historyError) {
      console.error("[createCompany] Warning: Failed to insert initial valuation history:", historyError.message);
    }

    await recordEvent({
      entityType: "company",
      entityId: inserted.id,
      subType: "Profile",
      action: "created",
      summary: `Company "${inserted.name}" created`,
    });

    revalidatePath("/dashboard/crm/companies");

    // Revalidate paths for owners who are clients
    if (owners && owners.length > 0) {
      const personIds = owners.map((o) => o.personId);
      const { data: clients } = await supabaseServer.from("clients").select("id").in("personId", personIds);

      if (clients && clients.length > 0) {
        clients.forEach((c) => {
          revalidatePath(`/dashboard/crm/clients/${c.id}`);
          revalidatePath(`/dashboard/crm/clients/${c.id}/assets`);
          revalidatePath(`/dashboard/crm/clients/${c.id}/liabilities`);
        });
      }
    }

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error(`[createCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateCompany(id: string, data: any) {
  try {
    const { data: currentCompany, error: fetchError } = await supabaseServer
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    if (!currentCompany) throw new Error("Company not found");

    const validated = CompanyFormSchema.parse({
      ...currentCompany,
      ...data,
      id,
    });

    const { owners, ...companyData } = validated;

    const updateData = {
      ...companyData,
      addressId: companyData.addressId || null,
      advisorId: companyData.advisorId || null,
      dba: companyData.dba || null,
      ein: companyData.ein || null,
      website: companyData.website || null,
      phone: companyData.phone || null,
      logoUrl: companyData.logoUrl || null,
      documentUrl: companyData.documentUrl || null,
      notebookUrl: companyData.notebookUrl || null,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseServer.from(TABLE).update(updateData).eq("id", id);

    if (error) throw new Error((error as { message: string }).message);

    // Record change history (best-effort). Resolve the actor once for all entries.
    const actor = await getCurrentActor();
    await recordFieldDiffs({
      entityType: "company",
      entityId: id,
      subType: "Profile",
      before: currentCompany,
      after: companyData,
      fields: COMPANY_PROFILE_FIELDS,
      actor,
    });

    // If the value changed, append to history!
    if (data.estimatedValue !== undefined && data.estimatedValue !== Number(currentCompany.estimatedValue)) {
      const snapshot = {
        companyId: id,
        value: data.estimatedValue,
        valuationDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await supabaseServer.from("company_valuation_history").insert(snapshot);

      await recordEvent(
        {
          entityType: "company",
          entityId: id,
          subType: "Valuation",
          action: "updated",
          fieldName: "estimatedValue",
          fieldLabel: "Estimated Value",
          oldValue: formatValue(currentCompany.estimatedValue),
          newValue: formatValue(data.estimatedValue),
          summary: "Estimated Value updated",
        },
        actor,
      );
    }

    // Update owners if provided
    if (owners !== undefined) {
      // Fetch current owners to revalidate client pages later
      const { data: oldOwners } = await supabaseServer.from("company_owners").select("personId").eq("companyId", id);

      // Delete existing owners
      const { error: deleteOwnersError } = await supabaseServer.from("company_owners").delete().eq("companyId", id);

      if (deleteOwnersError) throw new Error(deleteOwnersError.message);

      // Insert new owners
      if (owners.length > 0) {
        const ownersToInsert = owners.map((owner) => ({
          companyId: id,
          personId: owner.personId,
          ownershipPercentage: owner.ownershipPercentage.toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        const { error: insertOwnersError } = await supabaseServer.from("company_owners").insert(ownersToInsert);
        if (insertOwnersError) throw new Error(insertOwnersError.message);
      }

      // Record owner additions/removals in change history (resolve person names).
      const oldOwnerIds = new Set((oldOwners || []).map((o) => o.personId));
      const newOwnerIds = new Set(owners.map((o) => o.personId));
      const ownerNames = await resolvePersonNames([...oldOwnerIds, ...newOwnerIds]);
      for (const owner of owners) {
        if (!oldOwnerIds.has(owner.personId)) {
          await recordEvent(
            {
              entityType: "company",
              entityId: id,
              subType: "Owner",
              action: "added",
              fieldName: "owner",
              fieldLabel: "Owner",
              newValue: ownerNames.get(owner.personId) ?? owner.personId,
              summary: "Owner added",
            },
            actor,
          );
        }
      }
      for (const old of oldOwners || []) {
        if (!newOwnerIds.has(old.personId)) {
          await recordEvent(
            {
              entityType: "company",
              entityId: id,
              subType: "Owner",
              action: "removed",
              fieldName: "owner",
              fieldLabel: "Owner",
              oldValue: ownerNames.get(old.personId) ?? old.personId,
              summary: "Owner removed",
            },
            actor,
          );
        }
      }

      // Revalidate client pages for both old owners and new owners
      const allPersonIds = Array.from(
        new Set([...(oldOwners || []).map((o) => o.personId), ...owners.map((o) => o.personId)]),
      );

      if (allPersonIds.length > 0) {
        const { data: clients } = await supabaseServer.from("clients").select("id").in("personId", allPersonIds);

        if (clients && clients.length > 0) {
          clients.forEach((c) => {
            revalidatePath(`/dashboard/crm/clients/${c.id}`);
            revalidatePath(`/dashboard/crm/clients/${c.id}/assets`);
            revalidatePath(`/dashboard/crm/clients/${c.id}/liabilities`);
          });
        }
      }
    }

    revalidatePath("/dashboard/crm/companies");
    revalidatePath(`/dashboard/crm/companies/${id}`);

    return { success: true };
  } catch (error) {
    console.error(`[updateCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function deleteCompany(id: string) {
  try {
    // Fetch owners before deleting to revalidate paths
    const { data: owners } = await supabaseServer.from("company_owners").select("personId").eq("companyId", id);

    // Capture the company name before deletion for the history summary.
    const { data: doomed } = await supabaseServer.from(TABLE).select("name").eq("id", id).single();

    const { error: deleteError } = await supabaseServer.from(TABLE).delete().eq("id", id);

    if (deleteError) throw new Error((deleteError as { message: string }).message);

    await recordEvent({
      entityType: "company",
      entityId: id,
      subType: "Profile",
      action: "deleted",
      summary: `Company "${doomed?.name ?? id}" deleted`,
    });

    revalidatePath("/dashboard/crm/companies");

    if (owners && owners.length > 0) {
      const personIds = owners.map((o) => o.personId);
      const { data: clients } = await supabaseServer.from("clients").select("id").in("personId", personIds);

      if (clients && clients.length > 0) {
        clients.forEach((c) => {
          revalidatePath(`/dashboard/crm/clients/${c.id}`);
          revalidatePath(`/dashboard/crm/clients/${c.id}/assets`);
          revalidatePath(`/dashboard/crm/clients/${c.id}/liabilities`);
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error(`[deleteCompany] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getCompaniesLinkStatus() {
  try {
    const [
      ownersRes,
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
      supabaseServer.from("company_owners").select("companyId"),
      supabaseServer.from("law_firms").select("companyIds"),
      supabaseServer.from("accounting_firms").select("companyIds"),
      supabaseServer.from("actuarial_firms").select("companyIds"),
      supabaseServer.from("banks").select("companyIds"),
      supabaseServer.from("property_and_casualty_firms").select("companyIds"),
      supabaseServer.from("money_managers").select("companyIds"),
      supabaseServer.from("record_keepers").select("companyIds"),
      supabaseServer.from("life_insurance_companies").select("companyIds"),
      supabaseServer.from("disability_insurance_companies").select("companyIds"),
      supabaseServer.from("long_term_care_insurance").select("companyIds"),
    ]);

    const linkedCompanyIds = new Set<string>();

    // Add owners
    if (ownersRes.data) {
      for (const o of ownersRes.data) {
        linkedCompanyIds.add(o.companyId);
      }
    }

    // Add firms
    const addFirmCompanyIds = (data: { companyIds?: string[] | null }[] | null) => {
      if (!data) return;
      for (const item of data) {
        if (item.companyIds) {
          for (const cid of item.companyIds) {
            linkedCompanyIds.add(cid);
          }
        }
      }
    };

    addFirmCompanyIds(lawFirmsRes.data);
    addFirmCompanyIds(accountingFirmsRes.data);
    addFirmCompanyIds(actuarialFirmsRes.data);
    addFirmCompanyIds(banksRes.data);
    addFirmCompanyIds(propertyAndCasualtyRes.data);
    addFirmCompanyIds(moneyManagersRes.data);
    addFirmCompanyIds(recordKeepersRes.data);
    addFirmCompanyIds(lifeRes.data);
    addFirmCompanyIds(disabilityRes.data);
    addFirmCompanyIds(ltcRes.data);

    return { success: true, linkedCompanyIds };
  } catch (error) {
    console.error("Error checking companies link status:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getCompanyAssociationCounts(companyId: string) {
  try {
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
      supabaseServer.from("law_firms").select("id, companyIds"),
      supabaseServer.from("accounting_firms").select("id, companyIds"),
      supabaseServer.from("actuarial_firms").select("id, companyIds"),
      supabaseServer.from("banks").select("id, companyIds"),
      supabaseServer.from("property_and_casualty_firms").select("id, companyIds"),
      supabaseServer.from("money_managers").select("id, companyIds"),
      supabaseServer.from("record_keepers").select("id, companyIds"),
      supabaseServer.from("life_insurance_companies").select("id, companyIds"),
      supabaseServer.from("disability_insurance_companies").select("id, companyIds"),
      supabaseServer.from("long_term_care_insurance").select("id, companyIds"),
    ]);

    const filterByIds = (list: { companyIds?: string[] | null }[]) =>
      list.filter((item) => item.companyIds?.includes(companyId)).length;

    return {
      success: true,
      counts: {
        accountingFirms: filterByIds(accountingFirmsRes.data || []),
        actuarialFirms: filterByIds(actuarialFirmsRes.data || []),
        banks: filterByIds(banksRes.data || []),
        lawFirms: filterByIds(lawFirmsRes.data || []),
        propertyAndCasualty: filterByIds(propertyAndCasualtyRes.data || []),
        moneyManagers: filterByIds(moneyManagersRes.data || []),
        recordKeepers: filterByIds(recordKeepersRes.data || []),
        lifeInsurance: filterByIds(lifeRes.data || []),
        disabilityInsurance: filterByIds(disabilityRes.data || []),
        longTermCare: filterByIds(ltcRes.data || []),
      },
    };
  } catch (error) {
    console.error("Error fetching company association counts", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getCompanyValuationHistory(companyId: string) {
  try {
    const { data: history, error } = await supabaseServer
      .from("company_valuation_history")
      .select("*")
      .eq("companyId", companyId)
      .order("valuationDate", { ascending: true });

    if (error) throw new Error(error.message);
    return { success: true, history: (history || []) as CompanyValuationHistory[] };
  } catch (error) {
    console.error("[getCompanyValuationHistory] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function addCompanyValuationSnapshot(companyId: string, value: number, valuationDate?: string) {
  try {
    const snapshot = {
      companyId,
      value,
      valuationDate: valuationDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseServer.from("company_valuation_history").insert(snapshot);

    if (insertError) throw new Error(insertError.message);

    // Update estimated value of the company to reflect the latest snapshot
    const { data: latestHistory, error: latestError } = await supabaseServer
      .from("company_valuation_history")
      .select("value")
      .eq("companyId", companyId)
      .order("valuationDate", { ascending: false })
      .limit(1);

    if (!latestError && latestHistory && latestHistory.length > 0) {
      await supabaseServer
        .from(TABLE)
        .update({ estimatedValue: latestHistory[0].value, updatedAt: new Date().toISOString() })
        .eq("id", companyId);
    }

    revalidatePath("/dashboard/crm/companies");
    revalidatePath(`/dashboard/crm/companies/${companyId}`);
    revalidatePath(`/dashboard/crm/companies/${companyId}/valuation`);
    await revalidateClientOwners(companyId);
    return { success: true };
  } catch (error) {
    console.error("[addCompanyValuationSnapshot] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteCompanyValuationSnapshot(id: string) {
  try {
    // Get companyId to revalidate
    const { data: snapshot, error: fetchError } = await supabaseServer
      .from("company_valuation_history")
      .select("companyId")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const { error: deleteError } = await supabaseServer.from("company_valuation_history").delete().eq("id", id);

    if (deleteError) throw new Error(deleteError.message);

    // Get the new latest snapshot to update estimatedValue in companies table
    const { data: latestHistory, error: latestError } = await supabaseServer
      .from("company_valuation_history")
      .select("value")
      .eq("companyId", snapshot.companyId)
      .order("valuationDate", { ascending: false })
      .limit(1);

    if (!latestError && latestHistory && latestHistory.length > 0) {
      await supabaseServer
        .from(TABLE)
        .update({ estimatedValue: latestHistory[0].value, updatedAt: new Date().toISOString() })
        .eq("id", snapshot.companyId);
    } else {
      // Reset estimatedValue to 0 if no snapshots remain
      await supabaseServer
        .from(TABLE)
        .update({ estimatedValue: 0.0, updatedAt: new Date().toISOString() })
        .eq("id", snapshot.companyId);
    }

    revalidatePath("/dashboard/crm/companies");
    revalidatePath(`/dashboard/crm/companies/${snapshot.companyId}`);
    revalidatePath(`/dashboard/crm/companies/${snapshot.companyId}/valuation`);
    await revalidateClientOwners(snapshot.companyId);
    return { success: true };
  } catch (error) {
    console.error("[deleteCompanyValuationSnapshot] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

async function revalidateClientOwners(companyId: string) {
  try {
    const { data: owners } = await supabaseServer.from("company_owners").select("personId").eq("companyId", companyId);

    if (owners && owners.length > 0) {
      const personIds = owners.map((o) => o.personId);
      const { data: clients } = await supabaseServer.from("clients").select("id").in("personId", personIds);

      if (clients && clients.length > 0) {
        clients.forEach((c) => {
          revalidatePath(`/dashboard/crm/clients/${c.id}`);
          revalidatePath(`/dashboard/crm/clients/${c.id}/assets`);
          revalidatePath(`/dashboard/crm/clients/${c.id}/liabilities`);
        });
      }
    }
  } catch (err) {
    console.error("Failed to revalidate client owners:", err);
  }
}
