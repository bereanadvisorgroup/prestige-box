import { getAddresses } from "@/actions/addresses";

import { EventForm } from "../_components/event-form";

export default async function NewEventPage() {
  const result = await getAddresses();
  const addresses = result.success ? result.addresses || [] : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Add Event</h1>
      </div>
      <EventForm addresses={addresses} />
    </div>
  );
}
