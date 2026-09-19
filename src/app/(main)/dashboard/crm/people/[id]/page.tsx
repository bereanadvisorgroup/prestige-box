export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowUpRight, Contact, Globe, MapPin, Phone, User, Users } from "lucide-react";

import { getAddress } from "@/actions/addresses";
import { getClients } from "@/actions/clients";
import { getNotes } from "@/actions/notes";
import { getPeopleByIds, getPerson } from "@/actions/people";
import { getTasks } from "@/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPersonName, formatPhoneNumber } from "@/lib/utils";
import type { Address, FamilyMember, Person, TaskWithRelations } from "@/types/crm";

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

  const clients = (clientsRes.success && clientsRes.clients) || [];
  const associatedClient = clients.find((c) => c.personId === person.id) || null;

  // Collect associated family members defined across clients
  interface FamilyMemberEntry {
    personId: string;
    relationship: string;
    gender?: string;
  }

  const familyMap = new Map<string, FamilyMemberEntry>();

  for (const c of clients) {
    const isDirectClient = c.personId === person.id;
    const members = (c.familyMembers || []) as FamilyMember[];
    const myEntryInClient = members.find((m) => m.personId === person.id);

    if (isDirectClient) {
      // Current person is the client: all members are family members of this person
      for (const m of members) {
        if (m.personId && m.personId !== person.id && !familyMap.has(m.personId)) {
          familyMap.set(m.personId, {
            personId: m.personId,
            relationship: m.relationship || "Family Member",
            gender: m.gender,
          });
        }
      }
    } else if (myEntryInClient) {
      // Current person is listed as a family member of client c
      // The client c themselves is a family member of current person
      if (c.personId && c.personId !== person.id && !familyMap.has(c.personId)) {
        let reciprocalRel = "Family Member";
        if (myEntryInClient.relationship === "Spouse") reciprocalRel = "Spouse";
        else if (myEntryInClient.relationship === "Child") reciprocalRel = "Parent";
        else if (myEntryInClient.relationship === "Grandchild") reciprocalRel = "Grandparent";
        else if (myEntryInClient.relationship === "Great Grandchild") reciprocalRel = "Great Grandparent";

        familyMap.set(c.personId, {
          personId: c.personId,
          relationship: reciprocalRel,
          gender: c.pii?.biologicalGender,
        });
      }

      // Other family members in the same client
      for (const m of members) {
        if (m.personId && m.personId !== person.id && !familyMap.has(m.personId)) {
          let rel: string = m.relationship || "Family Member";
          if (myEntryInClient.relationship === "Spouse") {
            rel = m.relationship;
          } else if (myEntryInClient.relationship === "Child") {
            if (m.relationship === "Child") rel = "Sibling";
            else if (m.relationship === "Spouse") rel = "Parent";
          }
          familyMap.set(m.personId, {
            personId: m.personId,
            relationship: rel,
            gender: m.gender,
          });
        }
      }
    }
  }

  // Fetch person details for family members
  const familyPersonIds = Array.from(familyMap.keys());
  const familyPeopleRes =
    familyPersonIds.length > 0 ? await getPeopleByIds(familyPersonIds) : { success: true, people: [] };

  const familyPeopleMap = new Map<string, Person>();
  if (familyPeopleRes.success && familyPeopleRes.people) {
    for (const p of familyPeopleRes.people) {
      if (p.id) familyPeopleMap.set(p.id, p);
    }
  }
  for (const c of clients) {
    if (c.personId && c.person && !familyPeopleMap.has(c.personId)) {
      familyPeopleMap.set(c.personId, c.person as Person);
    }
  }

  function getDisplayRelationship(rel: string, gender?: string) {
    if (!gender) return rel;
    if (rel === "Spouse") return gender === "Female" ? "Wife" : gender === "Male" ? "Husband" : rel;
    if (rel === "Child") return gender === "Female" ? "Daughter" : gender === "Male" ? "Son" : rel;
    if (rel === "Parent") return gender === "Female" ? "Mother" : gender === "Male" ? "Father" : rel;
    if (rel === "Sibling") return gender === "Female" ? "Sister" : gender === "Male" ? "Brother" : rel;
    if (rel === "Grandchild") return gender === "Female" ? "Granddaughter" : gender === "Male" ? "Grandson" : rel;
    if (rel === "Grandparent") return gender === "Female" ? "Grandmother" : gender === "Male" ? "Grandfather" : rel;
    if (rel === "Great Grandchild")
      return gender === "Female" ? "Great Granddaughter" : gender === "Male" ? "Great Grandson" : rel;
    return rel;
  }

  const associatedFamilyMembers = familyPersonIds.map((memberPersonId) => {
    const entry = familyMap.get(memberPersonId)!;
    const memberPerson = familyPeopleMap.get(memberPersonId) || null;
    const name = memberPerson ? formatPersonName(memberPerson) : "Unknown Person";
    const relationship = getDisplayRelationship(entry.relationship, entry.gender);
    return {
      personId: memberPersonId,
      name,
      relationship,
    };
  });

  const RELATION_PRIORITY: Record<string, number> = {
    Spouse: 1,
    Wife: 1,
    Husband: 1,
    Parent: 2,
    Father: 2,
    Mother: 2,
    Child: 3,
    Son: 3,
    Daughter: 3,
    Sibling: 4,
    Brother: 4,
    Sister: 4,
    Grandchild: 5,
    Grandson: 5,
    Granddaughter: 5,
    Grandparent: 6,
    "Great Grandchild": 7,
  };

  associatedFamilyMembers.sort((a, b) => {
    const priorityA = RELATION_PRIORITY[a.relationship] ?? 50;
    const priorityB = RELATION_PRIORITY[b.relationship] ?? 50;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.name.localeCompare(b.name);
  });

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
        <Card className="flex h-full flex-col border-none shadow-md">
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

            <div>
              <p className="mt-4 mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                Family Members
              </p>
              {associatedFamilyMembers.length > 0 ? (
                <div className="space-y-2">
                  {associatedFamilyMembers.map((member) => (
                    <div key={member.personId} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Link
                          href={`/dashboard/crm/people/${member.personId}`}
                          className="flex items-center gap-1 truncate font-semibold hover:text-primary hover:underline"
                        >
                          <span className="truncate">{member.name}</span>
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </Link>
                      </div>
                      <Badge variant="secondary" className="shrink-0 px-1.5 py-0 font-medium text-[10px]">
                        {member.relationship}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No family members listed.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Associated Locations */}
        <Card className="flex h-full flex-col border-none shadow-md">
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
