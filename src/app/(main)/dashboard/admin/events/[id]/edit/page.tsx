import { notFound } from "next/navigation";

import { getAddresses } from "@/actions/addresses";
import { getEvent } from "@/actions/events";

import { EventForm } from "../../_components/event-form";

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const [eventResult, addressesResult] = await Promise.all([getEvent(id), getAddresses()]);

  if (!eventResult.success || !eventResult.event) {
    notFound();
  }

  const addresses = addressesResult.success ? addressesResult.addresses || [] : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Event</h1>
        <p className="mt-2 text-muted-foreground">Update the title, dates, or location of the event.</p>
      </div>

      <EventForm event={eventResult.event} addresses={addresses} />
    </div>
  );
}
