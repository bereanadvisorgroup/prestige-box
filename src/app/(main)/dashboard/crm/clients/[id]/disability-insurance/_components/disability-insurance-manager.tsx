"use client";

import {
  linkClientToDisabilityInsuranceCompany,
  unlinkClientFromDisabilityInsuranceCompany,
} from "@/actions/disability-insurance-companies";
import type { Client, DisabilityInsuranceCompany } from "@/types/crm";

import { type BeneficiaryParty, InsurancePolicyManager } from "../../_components/insurance-policy-manager";

interface DisabilityInsuranceManagerProps {
  client: Client;
  allCompanies: DisabilityInsuranceCompany[];
  parties: BeneficiaryParty[];
}

export function DisabilityInsuranceManager({ client, allCompanies, parties }: DisabilityInsuranceManagerProps) {
  return (
    <InsurancePolicyManager
      client={client}
      companies={allCompanies}
      parties={parties}
      policyField="disabilityPolicies"
      sectionName="Disability Insurance"
      adminBasePath="/dashboard/admin/disability-insurance-companies"
      linkCompany={linkClientToDisabilityInsuranceCompany}
      unlinkCompany={unlinkClientFromDisabilityInsuranceCompany}
    />
  );
}
