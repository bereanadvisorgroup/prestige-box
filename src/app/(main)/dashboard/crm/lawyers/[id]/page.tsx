import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Briefcase, Building2, Edit, GraduationCap, Mail, MapPin, Phone, Users } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getLawyer } from "@/actions/lawyers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPhoneNumber } from "@/lib/utils";
import type { Address, Person } from "@/types/crm";

interface LawyerDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function LawyerDetailsPage({ params }: LawyerDetailsPageProps) {
  const { id } = await params;
  const result = await getLawyer(id);

  if (!result.success || !result.lawyer) {
    notFound();
  }

  const { lawyer, person: personRaw, address: addressRaw } = result;
  const person = personRaw as Person | null;
  const address = addressRaw as Address | null;

  // Fetch associated clients details
  const clientsResult = await getClients();
  const allClients = clientsResult.success && clientsResult.clients ? clientsResult.clients : [];
  const associatedClients = allClients.filter((c) => (lawyer.clientIds || []).includes(c.id!));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              {person ? `${person.firstName} ${person.lastName}` : "Unknown Lawyer"}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {lawyer.firmName}
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/crm/lawyers/${lawyer.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Lawyer
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="h-fit md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium text-sm leading-none">Email</p>
                <p className="text-muted-foreground text-sm">
                  {person?.emails?.find((e) => e.isPrimary)?.address || person?.emails?.[0]?.address || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium text-sm leading-none">Phone</p>
                <p className="text-muted-foreground text-sm">
                  {formatPhoneNumber(person?.phones?.find((p) => p.isPrimary)?.number || person?.phones?.[0]?.number) ||
                    "N/A"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium text-sm leading-none">Firm Address</p>
                {address ? (
                  <div className="text-muted-foreground text-sm">
                    <p>{address.street1}</p>
                    {address.street2 && <p>{address.street2}</p>}
                    <p>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No address provided</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Associated Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {associatedClients.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {associatedClients.map((client) => {
                  const clientPerson = client.person as Person | null;
                  const clientName = clientPerson
                    ? `${clientPerson.firstName} ${clientPerson.lastName}`
                    : "Unknown Client";
                  const clientEmail =
                    clientPerson?.emails?.find((e) => e.isPrimary)?.address || clientPerson?.emails?.[0]?.address || "";
                  const clientPhone =
                    clientPerson?.phones?.find((p) => p.isPrimary)?.number || clientPerson?.phones?.[0]?.number || "";

                  return (
                    <Link
                      key={client.id}
                      href={`/dashboard/crm/clients/${client.id}`}
                      className="group flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-sm transition-colors group-hover:text-primary">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {clientName}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {clientEmail && <span className="mr-3">{clientEmail}</span>}
                          {clientPhone && <span>{formatPhoneNumber(clientPhone)}</span>}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/20 py-10 text-center text-muted-foreground">
                <p>No associated clients found.</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href={`/dashboard/crm/lawyers/${lawyer.id}/edit`}>Link Clients</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
