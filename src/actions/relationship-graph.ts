"use server";

import { supabaseServer } from "@/lib/supabase.server";

export interface GraphNode {
  id: string;
  name: string;
  group: string;
  entityType: string;
  url: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export async function getRelationshipGraphData() {
  try {
    const [
      { data: people },
      { data: addresses },
      { data: households },
      { data: clients },
      { data: companies },
      { data: clientPolicies },
      { data: lifeInsurance },
      { data: disabilityInsurance },
      { data: longTermCare },
      { data: lawFirms },
      { data: accountingFirms },
      { data: actuarialFirms },
      { data: banks },
      { data: propertyAndCasualty },
      { data: moneyManagers },
      { data: recordKeepers },
    ] = await Promise.all([
      supabaseServer.from("people").select("id, firstName, lastName, addressIds"),
      supabaseServer.from("addresses").select("id, street1, city, state"),
      supabaseServer.from("households").select("id, name, addressId, memberIds"),
      supabaseServer.from("clients").select("id, personId"),
      supabaseServer.from("companies").select("id, name, dba, addressId, clientIds"),
      supabaseServer
        .from("client_policies")
        .select("id, clientId, lifeInsuranceCompanyId, disabilityInsuranceCompanyId, longTermCareInsuranceId"),
      supabaseServer.from("life_insurance_companies").select("id, name, personIds"),
      supabaseServer.from("disability_insurance_companies").select("id, name, personIds"),
      supabaseServer.from("long_term_care_insurance").select("id, name, personIds"),
      supabaseServer.from("law_firms").select("id, firmName, firmAddressId, personIds, clientIds"),
      supabaseServer.from("accounting_firms").select("id, firmName, firmAddressId, personIds, clientIds"),
      supabaseServer.from("actuarial_firms").select("id, firmName, firmAddressId, personIds, clientIds"),
      supabaseServer.from("banks").select("id, firmName, firmAddressId, personIds, clientIds"),
      supabaseServer.from("property_and_casualty_firms").select("id, firmName, firmAddressId, personIds, clientIds"),
      supabaseServer.from("money_managers").select("id, firmName, firmAddressId, personIds, clientIds"),
      supabaseServer.from("record_keepers").select("id, firmName, firmAddressId, personIds, clientIds"),
    ]);

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Helper to format names
    const formatPersonName = (p: { firstName: string | null; lastName: string | null }) =>
      `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown Person";

    // Build lookup maps for fast access
    const peopleMap = new Map((people || []).map((p) => [p.id, p]));
    const addressesMap = new Map((addresses || []).map((a) => [a.id, a]));
    const clientsMap = new Map((clients || []).map((c) => [c.id, c]));

    // --- Add Nodes ---

    // People
    (people || []).forEach((p) => {
      nodes.push({
        id: p.id,
        name: formatPersonName(p),
        group: "Person",
        entityType: "Person",
        url: `/dashboard/crm/people/${p.id}`,
      });
      // Links: Person -> Address
      (p.addressIds || []).forEach((addrId: string) => {
        if (addressesMap.has(addrId)) {
          links.push({ source: p.id, target: addrId, label: "Resides At" });
        }
      });
    });

    // Addresses
    (addresses || []).forEach((a) => {
      nodes.push({
        id: a.id,
        name: `${a.street1 || ""} ${a.city || ""}`.trim() || "Address",
        group: "Address",
        entityType: "Address",
        url: `/dashboard/crm/addresses/${a.id}`,
      });
    });

    // Households
    (households || []).forEach((h) => {
      nodes.push({
        id: h.id,
        name: h.name || "Household",
        group: "Household",
        entityType: "Household",
        url: `/dashboard/crm/households/${h.id}`,
      });
      if (h.addressId && addressesMap.has(h.addressId)) {
        links.push({ source: h.id, target: h.addressId, label: "Located At" });
      }
      (h.memberIds || []).forEach((m: { personId: string }) => {
        if (m.personId && peopleMap.has(m.personId)) {
          links.push({ source: h.id, target: m.personId, label: "Member" });
        }
      });
    });

    // Clients
    (clients || []).forEach((c) => {
      const person = peopleMap.get(c.personId);
      const name = person ? formatPersonName(person) : "Unknown Client";
      nodes.push({
        id: c.id,
        name,
        group: "Client",
        entityType: "Client",
        url: `/dashboard/crm/clients/${c.id}`,
      });
      if (person) {
        links.push({ source: c.id, target: person.id, label: "Primary Contact" });
      }
    });

    // Companies
    (companies || []).forEach((c) => {
      nodes.push({
        id: c.id,
        name: c.dba ? `${c.name} (${c.dba})` : c.name || "Company",
        group: "Company",
        entityType: "Company",
        url: `/dashboard/crm/companies/${c.id}`,
      });
      if (c.addressId && addressesMap.has(c.addressId)) {
        links.push({ source: c.id, target: c.addressId, label: "Located At" });
      }
      (c.clientIds || []).forEach((clientId: string) => {
        if (clientsMap.has(clientId)) {
          links.push({ source: c.id, target: clientId, label: "Employs" });
        }
      });
    });

    // Client Policies (We don't add nodes for policies themselves to keep the graph from getting too noisy,
    // but we link clients directly to the vendors via the policy relationship)
    (clientPolicies || []).forEach((cp) => {
      if (cp.clientId && clientsMap.has(cp.clientId)) {
        if (cp.lifeInsuranceCompanyId) {
          links.push({ source: cp.clientId, target: cp.lifeInsuranceCompanyId, label: "Has Policy With" });
        }
        if (cp.disabilityInsuranceCompanyId) {
          links.push({ source: cp.clientId, target: cp.disabilityInsuranceCompanyId, label: "Has Policy With" });
        }
        if (cp.longTermCareInsuranceId) {
          links.push({ source: cp.clientId, target: cp.longTermCareInsuranceId, label: "Has Policy With" });
        }
      }
    });

    // Vendors & Professional Services Helper
    const addFirmNodesAndLinks = (
      firms: any[],
      group: string,
      entityType: string,
      urlPrefix: string,
      nameField = "firmName",
    ) => {
      (firms || []).forEach((f) => {
        nodes.push({
          id: f.id,
          name: f[nameField] || entityType,
          group,
          entityType,
          url: `${urlPrefix}/${f.id}`,
        });
        if (f.firmAddressId && addressesMap.has(f.firmAddressId)) {
          links.push({ source: f.id, target: f.firmAddressId, label: "Located At" });
        }
        (f.personIds || []).forEach((personId: string) => {
          if (peopleMap.has(personId)) {
            links.push({ source: f.id, target: personId, label: "Contact" });
          }
        });
        (f.clientIds || []).forEach((clientId: string) => {
          if (clientsMap.has(clientId)) {
            links.push({ source: f.id, target: clientId, label: "Serves" });
          }
        });
      });
    };

    // Vendors
    addFirmNodesAndLinks(
      lifeInsurance || [],
      "Vendor",
      "Life Insurance",
      "/dashboard/admin/life-insurance-companies",
      "name",
    );
    addFirmNodesAndLinks(
      disabilityInsurance || [],
      "Vendor",
      "Disability Insurance",
      "/dashboard/admin/disability-insurance-companies",
      "name",
    );
    addFirmNodesAndLinks(
      longTermCare || [],
      "Vendor",
      "Long Term Care",
      "/dashboard/admin/long-term-care-insurance",
      "name",
    );
    addFirmNodesAndLinks(moneyManagers || [], "Vendor", "Money Manager", "/dashboard/admin/money-managers");
    addFirmNodesAndLinks(recordKeepers || [], "Vendor", "Record Keeper", "/dashboard/admin/record-keepers");

    // Professional Services
    addFirmNodesAndLinks(lawFirms || [], "Professional Service", "Law Firm", "/dashboard/crm/law-firms");
    addFirmNodesAndLinks(
      accountingFirms || [],
      "Professional Service",
      "Accounting Firm",
      "/dashboard/crm/accounting-firms",
    );
    addFirmNodesAndLinks(
      actuarialFirms || [],
      "Professional Service",
      "Actuarial Firm",
      "/dashboard/crm/actuarial-firms",
    );
    addFirmNodesAndLinks(banks || [], "Professional Service", "Bank", "/dashboard/crm/banks");
    addFirmNodesAndLinks(
      propertyAndCasualty || [],
      "Professional Service",
      "Property And Casualty",
      "/dashboard/crm/property-and-casualty",
    );

    return { success: true, nodes, links };
  } catch (error) {
    console.error(`[getRelationshipGraphData] Error:`, error);
    return { success: false, error: (error as { message: string }).message, nodes: [], links: [] };
  }
}
