import Link from "next/link";
import { Plus, Users, AlertCircle } from "lucide-react";

import { getClients } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ClientsTable } from "./_components/clients-table";

export default async function ClientsPage() {
  const result = await getClients();

  if (!result.success) {
    return (
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-2">Manage extended client profiles for CRM engagement.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch clients from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const clients = result.clients || [];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-2">
            View and manage interests and engagement details for your client base.
          </p>
        </div>
        <Button asChild className="font-semibold shadow-sm">
          <Link href="/dashboard/crm/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Client Record
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <ClientsTable data={clients} />
      </div>
    </div>
  );
}
