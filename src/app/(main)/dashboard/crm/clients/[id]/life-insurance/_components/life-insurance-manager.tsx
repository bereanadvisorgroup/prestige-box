"use client";

import {
  linkClientToLifeInsuranceCompany,
  unlinkClientFromLifeInsuranceCompany,
} from "@/actions/life-insurance-companies";
import type { Client, InsuranceAgency, LifeInsuranceCompany } from "@/types/crm";

import { type BeneficiaryParty, InsurancePolicyManager } from "../../_components/insurance-policy-manager";

interface LifeInsuranceManagerProps {
  client: Client;
  allCompanies: LifeInsuranceCompany[];
  parties: BeneficiaryParty[];
  insuranceAgencies?: InsuranceAgency[];
}

export function LifeInsuranceManager({ client, allCompanies, parties, insuranceAgencies }: LifeInsuranceManagerProps) {
  return (
    <InsurancePolicyManager
      client={client}
      companies={allCompanies}
      parties={parties}
      policyField="lifePolicies"
      sectionName="Life Insurance"
      adminBasePath="/dashboard/admin/life-insurance-companies"
      insuranceAgencies={insuranceAgencies}
      linkCompany={linkClientToLifeInsuranceCompany}
      unlinkCompany={unlinkClientFromLifeInsuranceCompany}
    />
  );
}
