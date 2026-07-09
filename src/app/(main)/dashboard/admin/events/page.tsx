import { AlertCircle } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getEvents } from "@/actions/events";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { EventsTable } from "./_components/events-table";

export default async function EventsPage() {
  const [eventsResult, clientsResult] = await Promise.all([getEvents(), getClients()]);

  if (!eventsResult.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Events</h1>
          <p className="mt-2 text-muted-foreground">Manage events.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {eventsResult.error || "Failed to fetch events from the server. Check server logs."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawList = eventsResult.events || [];
  const clientsList = clientsResult.success ? clientsResult.clients || [] : [];
  const linkedEventIds = new Set(clientsList.map((c) => c.referredByEventId).filter(Boolean));

  // Determine if each event is associated with a client referral.
  const events = rawList.map((event) => ({
    ...event,
    isLinked: linkedEventIds.has(event.id),
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <EventsTable data={events} />
    </div>
  );
}
