import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Briefcase, Building2, Edit, GraduationCap, Mail, MapPin, Phone, Users } from "lucide-react";

import { getLawyer } from "@/actions/lawyers";
import { getClients } from "@/actions/clients";
import { Badge } from "@/components/ui/badge";
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
  const associatedClients = allClients.filter((c) =>
    (lawyer.clientIds || []).includes(c.id!),
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {person ? `${person.firstName} ${person.lastName}` : "Unknown Lawyer"}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Email</p>
                <p className="text-sm text-muted-foreground">
                  {person?.emails?.find((e) => e.isPrimary)?.address || person?.emails?.[0]?.address || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {formatPhoneNumber(person?.phones?.find((p) => p.isPrimary)?.number || person?.phones?.[0]?.number) ||
                    "N/A"}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Firm Address</p>
                {address ? (
                  <div className="text-sm text-muted-foreground">
                    <p>{address.street1}</p>
                    {address.street2 && <p>{address.street2}</p>}
                    <p>
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No address provided</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Associated Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {associatedClients.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {associatedClients.map((client) => {
                  const clientPerson = client.person as Person | null;
                  const clientName = clientPerson
                    ? `${clientPerson.firstName} ${clientPerson.lastName}`
                    : "Unknown Client";
                  const clientEmail =
                    clientPerson?.emails?.find((e) => e.isPrimary)?.address ||
                    clientPerson?.emails?.[0]?.address ||
                    "";
                  const clientPhone =
                    clientPerson?.phones?.find((p) => p.isPrimary)?.number ||
                    clientPerson?.phones?.[0]?.number ||
                    "";

                  return (
                    <Link
                      key={client.id}
                      href={`/dashboard/crm/clients/${client.id}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {clientName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {clientEmail && <span className="mr-3">{clientEmail}</span>}
                          {clientPhone && <span>{formatPhoneNumber(clientPhone)}</span>}
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/20 rounded-lg border border-dashed text-muted-foreground">
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
