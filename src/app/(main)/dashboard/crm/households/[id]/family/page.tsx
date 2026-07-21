import Link from "next/link";
import { notFound } from "next/navigation";

import { Pencil } from "lucide-react";

import { getHousehold } from "@/actions/households";
import { Button } from "@/components/ui/button";
import type { Household, Person } from "@/types/crm";

import { FamilyTree } from "../../_components/family-tree";
import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface HouseholdFamilyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HouseholdFamilyPage({ params }: HouseholdFamilyPageProps) {
  const { id } = await params;
  const result = await getHousehold(id);

  if (!result.success || !result.household) {
    notFound();
  }

  const household = result.household as Household;
  const members = (result.members || []) as Array<{
    person: Person | null;
    clientId: string;
    role: string;
    isPrimaryHousehold: boolean;
    includeInFinancialRollup: boolean;
    familyRelationship?: string;
  }>;

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Family & Rollups">
        <Link href={`/dashboard/crm/households/${household.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Household
          </Button>
        </Link>
      </HouseholdHeaderPortal>

      {/* Family Tree & Rollup Breakdown */}
      <FamilyTree household={household} members={members} />
    </div>
  );
}
