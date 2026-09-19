export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Contact, Globe, MapPin, Phone, User } from "lucide-react";

import { getAddress } from "@/actions/addresses";
import { getClients } from "@/actions/clients";
import { getNotes } from "@/actions/notes";
import { getPerson } from "@/actions/people";
import { getTasks } from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhoneNumber } from "@/lib/utils";
import type { Address, TaskWithRelations } from "@/types/crm";

import { PersonHeaderPortal } from "./_components/person-header-portal";
import { PersonNotesCard } from "./_components/person-notes-card";
import { PersonTasksCard } from "./_components/person-tasks-card";

interface PersonPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const result = await getPerson(id);

  if (!result.success || !result.person) {
    notFound();
  }

  const person = result.person;

  const [notesRes, tasksRes, clientsRes] = await Promise.all([
    getNotes({ personId: id }),
    getTasks({ personId: id }),
    getClients(),
  ]);

  const associatedClient =
    ((clientsRes.success && clientsRes.clients) || []).find((c) => c.personId === person.id) || null;

  // Fetch addresses
  const addressPromises = (person.addressIds || []).map((addrId) => getAddress(addrId));
  const addressResults = await Promise.all(addressPromises);
  const addresses = addressResults
    .map((res) => (res.success && res.address ? res.address : null))
    .filter(Boolean) as Address[];

  const notes = notesRes.success && notesRes.notes ? notesRes.notes : [];

  let clientTasks: TaskWithRelations[] = [];
  if (associatedClient?.id) {
    const clientTasksRes = await getTasks({ clientId: associatedClient.id });
    if (clientTasksRes.success && clientTasksRes.tasks) {
      clientTasks = clientTasksRes.tasks;
    }
  }

  const personTasks = tasksRes.success && tasksRes.tasks ? tasksRes.tasks : [];
  const taskMap = new Map<string, TaskWithRelations>();
  for (const t of [...personTasks, ...clientTasks]) {
    if (t.id) taskMap.set(t.id, t);
  }
  const tasks = Array.from(taskMap.values());

  return (
    <div className="space-y-8">
      <PersonHeaderPortal sectionName="General" />

      {/* Top Row: Contact Details & Associated Locations */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Contact Details */}
        <Card className="border-none shadow-md flex flex-col h-full">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Contact className="h-5 w-5 text-primary" /> Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Email Addresses
              </p>
              {person.emails && person.emails.length > 0 ? (
                <div className="space-y-2">
                  {person.emails.map((email, idx) => (
                    <div key={email.id || email.address || idx} className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{email.address}</span>
                      <Badge variant={email.isPrimary ? "default" : "outline"} className="px-1.5 py-0 text-[10px]">
                        {email.type} {email.isPrimary && "(Primary)"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No email addresses listed.</p>
              )}
            </div>

            <div>
              <p className="mt-4 mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Phone Numbers
              </p>
              {person.phones && person.phones.length > 0 ? (
                <div className="space-y-2">
                  {person.phones.map((phone, idx) => (
                    <div key={phone.id || phone.number || idx} className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{formatPhoneNumber(phone.number)}</span>
                      <Badge variant={phone.isPrimary ? "default" : "outline"} className="px-1.5 py-0 text-[10px]">
                        {phone.type} {phone.isPrimary && "(Primary)"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No phone numbers listed.</p>
              )}
            </div>

            <div>
              <p className="mt-4 mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Social Media Accounts
              </p>
              {person.socialMedia && person.socialMedia.length > 0 ? (
                <div className="space-y-2">
                  {person.socialMedia.map((sm, idx) => {
                    const Icon = Globe;

                    return (
                      <div key={sm.id || sm.url || idx} className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={sm.url.startsWith("http") ? sm.url : `https://${sm.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {sm.type}
                        </a>
                        <Badge variant={sm.isPrimary ? "default" : "outline"} className="px-1.5 py-0 text-[10px]">
                          {sm.isPrimary ? "Primary" : "Secondary"}
                          {sm.useProfilePhoto && " (Using Photo)"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No social media accounts listed.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Associated Locations */}
        <Card className="border-none shadow-md flex flex-col h-full">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" /> Associated Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {addresses.length > 0 ? (
              <div className="space-y-4">
                {addresses.map((address, idx) => {
                  const personAddrInfo = person.addresses?.find((a) => a.id === address.id);
                  return (
                    <div
                      key={address.id || idx}
                      className="group flex items-start justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/5"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">{address.street1}</p>
                        {address.street2 && <p className="text-sm">{address.street2}</p>}
                        <p className="text-muted-foreground text-xs">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        {personAddrInfo && (
                          <Badge
                            variant={personAddrInfo.isPrimary ? "default" : "secondary"}
                            className="mt-1 py-0 text-[10px]"
                          >
                            {personAddrInfo.type} {personAddrInfo.isPrimary && "(Primary)"}
                          </Badge>
                        )}
                      </div>
                      <Link href={`/dashboard/crm/addresses/${address.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <MapPin className="mx-auto mb-2 h-10 w-10 opacity-20" />
                <p className="text-sm">No addresses associated with this person.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Tasks & Notes Cards */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <PersonTasksCard personId={person.id!} initialTasks={tasks} />
        <PersonNotesCard personId={person.id!} initialNotes={notes} />
      </div>
    </div>
  );
}
