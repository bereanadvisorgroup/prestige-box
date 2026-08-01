import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, Calendar, Edit } from "lucide-react";

import { getEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface EventDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { id } = await params;
  const result = await getEvent(id);

  if (!result.success || !result.event) {
    notFound();
  }

  const { event } = result;
  const address = event.address as
    | { street1?: string; street2?: string; city?: string; state?: string; zipCode?: string; country?: string }
    | undefined;

  const mapAddressString = address
    ? `${address.street1 ?? ""}${address.street2 ? `, ${address.street2}` : ""}, ${address.city ?? ""}, ${address.state ?? ""} ${address.zipCode ?? ""}`
    : "";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{event.title}</h1>
            <p className="text-muted-foreground text-sm">Event Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="font-semibold shadow-sm">
            <Link href="/dashboard/admin/events">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <Button asChild className="font-semibold shadow-sm">
            <Link href={`/dashboard/admin/events/${event.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="h-fit border shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="font-bold text-lg">Event Schedule & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 py-2">
              <span className="font-medium text-muted-foreground text-sm">Start Date</span>
              <span className="col-span-2 text-foreground text-sm">
                {event.startDate ? new Date(event.startDate).toLocaleString() : "-"}
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="font-medium text-muted-foreground text-sm">End Date</span>
              <span className="col-span-2 text-foreground text-sm">
                {event.endDate ? new Date(event.endDate).toLocaleString() : "-"}
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="font-medium text-muted-foreground text-sm">Location Address</span>
              <span className="col-span-2 text-foreground text-sm">
                {address ? (
                  <div className="space-y-1">
                    <p className="font-medium">{address.street1}</p>
                    {address.street2 && <p>{address.street2}</p>}
                    <p>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/80">
                      {address.country || "USA"}
                    </p>
                  </div>
                ) : (
                  <span className="italic text-muted-foreground">No address set</span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {address && (
          <Card className="h-80 border shadow-sm md:col-span-1 md:h-auto overflow-hidden">
            <iframe
              title={`Google Map showing ${address.street1}`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "260px" }}
              className="w-full h-full"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapAddressString)}&output=embed`}
            />
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="h-fit border shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="font-bold text-lg">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 py-2">
              <span className="font-medium text-muted-foreground text-sm">Record ID</span>
              <span className="col-span-2 break-all font-mono text-foreground text-sm">{event.id}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                Created At
              </span>
              <span className="col-span-2 text-foreground text-sm">
                {event.createdAt ? new Date(event.createdAt).toLocaleString() : "-"}
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                Last Updated
              </span>
              <span className="col-span-2 text-foreground text-sm">
                {event.updatedAt ? new Date(event.updatedAt).toLocaleString() : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
