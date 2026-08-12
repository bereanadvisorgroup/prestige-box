"use client";

import {
  linkClientToLongTermCareInsurance,
  unlinkClientFromLongTermCareInsurance,
} from "@/actions/long-term-care-insurance";
import type { Client, InsuranceAgency, LongTermCareInsurance } from "@/types/crm";

import { type BeneficiaryParty, InsurancePolicyManager } from "../../_components/insurance-policy-manager";

interface LongTermCareManagerProps {
  client: Client;
  allCompanies: LongTermCareInsurance[];
  parties: BeneficiaryParty[];
  insuranceAgencies?: InsuranceAgency[];
}

export function LongTermCareManager({ client, allCompanies, parties, insuranceAgencies }: LongTermCareManagerProps) {
  return (
    <InsurancePolicyManager
      client={client}
      companies={allCompanies}
      parties={parties}
      policyField="ltcPolicies"
      sectionName="Long-Term Care Insurance"
      adminBasePath="/dashboard/admin/long-term-care-insurance"
      insuranceAgencies={insuranceAgencies}
      linkCompany={linkClientToLongTermCareInsurance}
      unlinkCompany={unlinkClientFromLongTermCareInsurance}
    />
  );
}
