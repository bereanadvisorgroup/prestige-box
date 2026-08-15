"use server";

import { supabaseServer } from "@/lib/supabase.server";
import { formatFullName } from "@/lib/utils";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  type: string;
}

export async function globalSearch(
  query: string,
): Promise<{ success: boolean; results?: SearchResult[]; error?: string }> {
  if (!query || query.trim().length < 2) {
    return { success: true, results: [] };
  }

  const trimmedQuery = query.trim();
  const ilikeQuery = `%${trimmedQuery}%`;

  try {
    // 1. Search People
    const peoplePromise = supabaseServer
      .from("people")
      .select("id, firstName, lastName, suffix")
      .or(`firstName.ilike.${ilikeQuery},lastName.ilike.${ilikeQuery},suffix.ilike.${ilikeQuery}`)
      .limit(10);

    // 2. Search Addresses
    const addressesPromise = supabaseServer
      .from("addresses")
      .select("id, street1, street2, city, state, zipCode")
      .or(
        `street1.ilike.${ilikeQuery},street2.ilike.${ilikeQuery},city.ilike.${ilikeQuery},state.ilike.${ilikeQuery},zipCode.ilike.${ilikeQuery}`,
      )
      .limit(10);

    // 3. Search Households
    const householdsPromise = supabaseServer.from("households").select("id, name").ilike("name", ilikeQuery).limit(10);

    // 4. Search Companies
    const companiesPromise = supabaseServer
      .from("companies")
      .select("id, name, dba")
      .or(`name.ilike.${ilikeQuery},dba.ilike.${ilikeQuery}`)
      .limit(10);

    // 5. Search Policies
    const policiesPromise = supabaseServer
      .from("client_policies")
      .select("id, policyName, policyNumber")
      .or(`policyName.ilike.${ilikeQuery},policyNumber.ilike.${ilikeQuery}`)
      .limit(10);

    // 6. Search Accounting Firms
    const accountingFirmsPromise = supabaseServer
      .from("accounting_firms")
      .select("id, firmName")
      .ilike("firmName", ilikeQuery)
      .limit(10);

    // 6b. Search Insurance Agencies
    const insuranceAgenciesPromise = supabaseServer
      .from("insurance_agencies")
      .select("id, firmName")
      .ilike("firmName", ilikeQuery)
      .limit(10);

    // 7. Search Actuarial Firms
    const actuarialFirmsPromise = supabaseServer
      .from("actuarial_firms")
      .select("id, firmName")
      .ilike("firmName", ilikeQuery)
      .limit(10);

    // 8. Search Banks
    const banksPromise = supabaseServer.from("banks").select("id, firmName").ilike("firmName", ilikeQuery).limit(10);

    // 9. Search Law Firms
    const lawFirmsPromise = supabaseServer
      .from("law_firms")
      .select("id, firmName")
      .ilike("firmName", ilikeQuery)
      .limit(10);

    // 10. Search Property and Casualty
    const propertyAndCasualtyPromise = supabaseServer
      .from("property_and_casualty_firms")
      .select("id, firmName")
      .ilike("firmName", ilikeQuery)
      .limit(10);

    // 11. Search Life Insurance
    const lifeInsurancePromise = supabaseServer
      .from("life_insurance_companies")
      .select("id, name")
      .ilike("name", ilikeQuery)
      .limit(10);

    // 12. Search Disability Insurance
    const disabilityInsurancePromise = supabaseServer
      .from("disability_insurance_companies")
      .select("id, name")
      .ilike("name", ilikeQuery)
      .limit(10);

    // 13. Search Long Term Care
    const longTermCarePromise = supabaseServer
      .from("long_term_care_insurance")
      .select("id, name")
      .ilike("name", ilikeQuery)
      .limit(10);

    // 14. Search Money Managers
    const moneyManagersPromise = supabaseServer
      .from("money_managers")
      .select("id, firmName")
      .ilike("firmName", ilikeQuery)
      .limit(10);

    // 15. Search Record Keepers
    const recordKeepersPromise = supabaseServer
      .from("record_keepers")
      .select("id, firmName")
      .ilike("firmName", ilikeQuery)
      .limit(10);

    // 16. Search Users
    const usersPromise = supabaseServer
      .from("users")
      .select("uid, firstName, lastName, email")
      .or(`firstName.ilike.${ilikeQuery},lastName.ilike.${ilikeQuery},email.ilike.${ilikeQuery}`)
      .limit(10);

    // Run parallel queries
    const [
      peopleRes,
      addressesRes,
      householdsRes,
      companiesRes,
      policiesRes,
      accountingRes,
      insuranceAgenciesRes,
      actuarialRes,
      banksRes,
      lawRes,
      pcRes,
      lifeRes,
      disabilityRes,
      ltcRes,
      moneyRes,
      recordRes,
      usersRes,
    ] = await Promise.all([
      peoplePromise,
      addressesPromise,
      householdsPromise,
      companiesPromise,
      policiesPromise,
      accountingFirmsPromise,
      insuranceAgenciesPromise,
      actuarialFirmsPromise,
      banksPromise,
      lawFirmsPromise,
      propertyAndCasualtyPromise,
      lifeInsurancePromise,
      disabilityInsurancePromise,
      longTermCarePromise,
      moneyManagersPromise,
      recordKeepersPromise,
      usersPromise,
    ]);

    const results: SearchResult[] = [];

    // Process People
    if (peopleRes.data) {
      for (const p of peopleRes.data) {
        results.push({
          id: p.id,
          title: formatFullName(p.firstName, p.lastName, p.suffix),
          subtitle: "Person",
          url: `/dashboard/crm/people/${p.id}`,
          type: "People",
        });
      }
    }

    // Process Addresses
    if (addressesRes.data) {
      for (const a of addressesRes.data) {
        const fullAddress = [a.street1, a.street2, a.city, a.state, a.zipCode].filter(Boolean).join(", ");
        results.push({
          id: a.id,
          title: fullAddress,
          subtitle: "Address",
          url: `/dashboard/crm/addresses/${a.id}`,
          type: "Addresses",
        });
      }
    }

    // Process Households
    if (householdsRes.data) {
      for (const h of householdsRes.data) {
        results.push({
          id: h.id,
          title: h.name,
          subtitle: "Household",
          url: `/dashboard/crm/households/${h.id}`,
          type: "Households",
        });
      }
    }

    // Process Clients (derived from matching people)
    if (peopleRes.data && peopleRes.data.length > 0) {
      const personIds = peopleRes.data.map((p) => p.id);
      const { data: clientsData } = await supabaseServer
        .from("clients")
        .select("id, personId")
        .in("personId", personIds);

      if (clientsData) {
        const peopleMap = new Map(peopleRes.data.map((p) => [p.id, p]));
        for (const c of clientsData) {
          const person = peopleMap.get(c.personId);
          if (person) {
            results.push({
              id: c.id,
              title: formatFullName(person.firstName, person.lastName, person.suffix),
              subtitle: "Client",
              url: `/dashboard/crm/clients/${c.id}`,
              type: "Clients",
            });
          }
        }
      }
    }

    // Process Companies
    if (companiesRes.data) {
      for (const c of companiesRes.data) {
        results.push({
          id: c.id,
          title: c.name + (c.dba ? ` (${c.dba})` : ""),
          subtitle: "Company",
          url: `/dashboard/crm/companies/${c.id}`,
          type: "Companies",
        });
      }
    }

    // Process Policies
    if (policiesRes.data) {
      for (const p of policiesRes.data) {
        results.push({
          id: p.id,
          title: `${p.policyName} - ${p.policyNumber}`,
          subtitle: "Policy",
          url: `/dashboard/crm/policies/${p.id}`,
          type: "Policies",
        });
      }
    }

    // Process Accounting Firms
    if (accountingRes.data) {
      for (const f of accountingRes.data) {
        results.push({
          id: f.id,
          title: f.firmName,
          subtitle: "Accounting Firm",
          url: `/dashboard/crm/accounting-firms/${f.id}`,
          type: "Accounting Firms",
        });
      }
    }

    // Process Insurance Agencies
    if (insuranceAgenciesRes.data) {
      for (const f of insuranceAgenciesRes.data) {
        results.push({
          id: f.id,
          title: f.firmName,
          subtitle: "Insurance Agency",
          url: `/dashboard/crm/insurance-agencies/${f.id}`,
          type: "Insurance Agencies",
        });
      }
    }

    // Process Actuarial Firms
    if (actuarialRes.data) {
      for (const f of actuarialRes.data) {
        results.push({
          id: f.id,
          title: f.firmName,
          subtitle: "Actuarial Firm",
          url: `/dashboard/crm/actuarial-firms/${f.id}`,
          type: "Actuarial Firms",
        });
      }
    }

    // Process Banks
    if (banksRes.data) {
      for (const f of banksRes.data) {
        results.push({
          id: f.id,
          title: f.firmName,
          subtitle: "Bank",
          url: `/dashboard/crm/banks/${f.id}`,
          type: "Banks",
        });
      }
    }

    // Process Law Firms
    if (lawRes.data) {
      for (const f of lawRes.data) {
        results.push({
          id: f.id,
          title: f.firmName,
          subtitle: "Law Firm",
          url: `/dashboard/crm/law-firms/${f.id}`,
          type: "Law Firms",
        });
      }
    }

    // Process Property and Casualty
    if (pcRes.data) {
      for (const f of pcRes.data) {
        results.push({
          id: f.id,
          title: f.firmName,
          subtitle: "Property And Casualty",
          url: `/dashboard/crm/property-and-casualty/${f.id}`,
          type: "Property And Casualty",
        });
      }
    }

    // Process Life Insurance
    if (lifeRes.data) {
      for (const c of lifeRes.data) {
        results.push({
          id: c.id,
          title: c.name,
          subtitle: "Life Insurance Company",
          url: `/dashboard/admin/life-insurance-companies/${c.id}`,
          type: "Life Insurance",
        });
      }
    }

    // Process Disability Insurance
    if (disabilityRes.data) {
      for (const c of disabilityRes.data) {
        results.push({
          id: c.id,
          title: c.name,
          subtitle: "Disability Insurance Company",
          url: `/dashboard/admin/disability-insurance-companies/${c.id}`,
          type: "Disability Insurance",
        });
      }
    }

    // Process Long Term Care
    if (ltcRes.data) {
      for (const c of ltcRes.data) {
        results.push({
          id: c.id,
          title: c.name,
          subtitle: "Long Term Care Company",
          url: `/dashboard/admin/long-term-care-insurance/${c.id}`,
          type: "Long Term Care",
        });
      }
    }

    // Process Money Managers
    if (moneyRes.data) {
      for (const f of moneyRes.data) {
        results.push({
          id: f.id,
          title: f.firmName,
          subtitle: "Money Manager",
          url: `/dashboard/admin/money-managers/${f.id}`,
          type: "Money Managers",
        });
      }
    }

    // Process Record Keepers
    if (recordRes.data) {
      for (const f of recordRes.data) {
        results.push({
          id: f.id,
          title: f.firmName,
          subtitle: "Record Keeper",
          url: `/dashboard/admin/record-keepers/${f.id}`,
          type: "Record Keepers",
        });
      }
    }

    // Process Users
    if (usersRes.data) {
      for (const u of usersRes.data) {
        results.push({
          id: u.uid,
          title: `${u.firstName || ""} ${u.lastName || ""} (${u.email})`.trim(),
          subtitle: "User",
          url: `/dashboard/admin/users/${u.uid}`,
          type: "Users",
        });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error(`[globalSearch] Error:`, error);
    return { success: false, error: (error as { message: string }).message };
  }
}
