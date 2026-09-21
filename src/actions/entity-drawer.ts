"use server";

import { getAddress } from "@/actions/addresses";
import { getClient } from "@/actions/clients";
import { getCompany } from "@/actions/companies";
import { getPerson } from "@/actions/people";
import { getUser } from "@/actions/users";
import type { Address, Client, Company, Person } from "@/types/crm";

export interface ClientDrawerData {
  entityType: "client";
  client: Client;
  person: Person | null;
  addresses: Address[];
}

export interface CompanyDrawerData {
  entityType: "company";
  company: Company;
  address: Address | null;
  advisor: {
    uid: string;
    firstName: string | null;
    lastName: string | null;
    photoURL?: string | null;
    role?: string | null;
  } | null;
}

export type EntityDrawerResult =
  | { success: true; data: ClientDrawerData | CompanyDrawerData }
  | { success: false; error: string };

export async function getEntityDrawerData(
  entityType: "client" | "company",
  entityId: string,
): Promise<EntityDrawerResult> {
  try {
    if (entityType === "client") {
      const clientRes = await getClient(entityId);
      if (!clientRes.success || !clientRes.client) {
        return { success: false, error: clientRes.error || "Client not found" };
      }

      const client = clientRes.client;
      let person: Person | null = clientRes.person || null;
      if (!person && client.personId) {
        const personRes = await getPerson(client.personId);
        if (personRes.success && personRes.person) {
          person = personRes.person;
        }
      }

      let addresses: Address[] = [];
      if (person) {
        const addressIds = person.addressIds?.length
          ? person.addressIds
          : (person.addresses || []).map((a) => a.id).filter(Boolean);

        if (addressIds.length > 0) {
          const addressResults = await Promise.all(addressIds.map((id) => getAddress(id)));
          addresses = addressResults
            .map((r) => (r.success && r.address ? r.address : null))
            .filter(Boolean) as Address[];
        }
      }

      return {
        success: true,
        data: {
          entityType: "client",
          client,
          person,
          addresses,
        },
      };
    }

    if (entityType === "company") {
      const companyRes = await getCompany(entityId);
      if (!companyRes.success || !companyRes.company) {
        return { success: false, error: companyRes.error || "Company not found" };
      }

      const company = companyRes.company;

      let address: Address | null = null;
      if (company.addressId) {
        const addrRes = await getAddress(company.addressId);
        if (addrRes.success && addrRes.address) {
          address = addrRes.address;
        }
      }

      let advisor = null;
      if (company.advisorId) {
        const advRes = await getUser(company.advisorId);
        if (advRes.success && advRes.user) {
          advisor = {
            uid: advRes.user.uid,
            firstName: advRes.user.firstName,
            lastName: advRes.user.lastName,
            photoURL: advRes.user.photoURL,
            role: advRes.user.role,
          };
        }
      }

      return {
        success: true,
        data: {
          entityType: "company",
          company,
          address,
          advisor,
        },
      };
    }

    return { success: false, error: "Invalid entity type" };
  } catch (err) {
    console.error("[getEntityDrawerData] Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to load entity data" };
  }
}
