import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, Home, Pencil } from "lucide-react";

import { getHousehold } from "@/actions/households";
import { Button } from "@/components/ui/button";
import type { Household, Person } from "@/types/crm";
import { FamilyTree } from "../../_components/family-tree";

interface HouseholdFamilyPageProps {
  params: {
    id: string;
  };
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
    <div className="fade-in mx-auto w-full max-w-6xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Back Link & Header */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href={`/dashboard/crm/households/${household.id}`}
            className="mb-2 inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Household Overview
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight">{household.name} — Family & Rollups</h1>
              <p className="text-muted-foreground text-xs">
                Generational family structure, membership roles, and anti-double-counting financial rollups.
              </p>
            </div>
          </div>
        </div>

        <Link href={`/dashboard/crm/households/${household.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Household
          </Button>
        </Link>
      </div>

      {/* Family Tree & Rollup Breakdown */}
      <FamilyTree household={household} members={members} />
    </div>
  );
}
