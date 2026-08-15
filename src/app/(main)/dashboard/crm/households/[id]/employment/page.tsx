import { notFound } from "next/navigation";

import { Briefcase } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getHouseholdActiveRollupClients } from "@/actions/households";
import { EmploymentTab } from "@/app/(main)/dashboard/crm/clients/[id]/_components/tabs/employment-tab";
import { Card, CardContent } from "@/components/ui/card";
import { formatPersonName } from "@/lib/utils";

import { HouseholdHeaderPortal } from "../_components/household-header-portal";

interface HouseholdEmploymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdEmploymentPage({ params }: HouseholdEmploymentPageProps) {
  const { id } = await params;
  const activeRes = await getHouseholdActiveRollupClients(id);

  if (!activeRes.success || !activeRes.household) {
    notFound();
  }

  const { clientIds } = activeRes;
  const allClientsRes = await getClients();
  const allClients = allClientsRes.success ? allClientsRes.clients || [] : [];
  const activeClients = allClients.filter((c) => clientIds.includes(c.id || ""));

  return (
    <div className="space-y-6 py-4">
      <HouseholdHeaderPortal sectionName="Employment" />
      {activeClients.length > 0 ? (
        activeClients.map((client) => (
          <div key={client.id} className="space-y-2">
            <h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              Client: {formatPersonName(client.person, client.id)}
            </h3>
            <EmploymentTab client={client} />
          </div>
        ))
      ) : (
        <Card className="p-8 text-center text-muted-foreground shadow-sm">
          <CardContent className="pt-6">
            <Briefcase className="mx-auto mb-2 h-10 w-10 opacity-20" />
            <p className="text-sm">No active financial rollup clients in this household.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
