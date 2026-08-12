"use client";

import {
  linkClientToDisabilityInsuranceCompany,
  unlinkClientFromDisabilityInsuranceCompany,
} from "@/actions/disability-insurance-companies";
import type { Client, DisabilityInsuranceCompany, InsuranceAgency } from "@/types/crm";

import { type BeneficiaryParty, InsurancePolicyManager } from "../../_components/insurance-policy-manager";

interface DisabilityInsuranceManagerProps {
  client: Client;
  allCompanies: DisabilityInsuranceCompany[];
  parties: BeneficiaryParty[];
  insuranceAgencies?: InsuranceAgency[];
}

export function DisabilityInsuranceManager({
  client,
  allCompanies,
  parties,
  insuranceAgencies,
}: DisabilityInsuranceManagerProps) {
  return (
    <InsurancePolicyManager
      client={client}
      companies={allCompanies}
      parties={parties}
      policyField="disabilityPolicies"
      sectionName="Disability Insurance"
      adminBasePath="/dashboard/admin/disability-insurance-companies"
      insuranceAgencies={insuranceAgencies}
      linkCompany={linkClientToDisabilityInsuranceCompany}
      unlinkCompany={unlinkClientFromDisabilityInsuranceCompany}
    />
  );
}
