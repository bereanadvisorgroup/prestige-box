"use client";

import {
  linkClientToLongTermCareInsurance,
  unlinkClientFromLongTermCareInsurance,
} from "@/actions/long-term-care-insurance";
import type { Client, LongTermCareInsurance } from "@/types/crm";

import { type BeneficiaryParty, InsurancePolicyManager } from "../../_components/insurance-policy-manager";

interface LongTermCareManagerProps {
  client: Client;
  allCompanies: LongTermCareInsurance[];
  parties: BeneficiaryParty[];
}

export function LongTermCareManager({ client, allCompanies, parties }: LongTermCareManagerProps) {
  return (
    <InsurancePolicyManager
      client={client}
      companies={allCompanies}
      parties={parties}
      policyField="ltcPolicies"
      sectionName="Long-Term Care Insurance"
      adminBasePath="/dashboard/admin/long-term-care-insurance"
      linkCompany={linkClientToLongTermCareInsurance}
      unlinkCompany={unlinkClientFromLongTermCareInsurance}
    />
  );
}
