import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getAccountants } from "@/actions/accountants";
import { getClients } from "@/actions/clients";
import { getHouseholds } from "@/actions/households";
import { getLawyers } from "@/actions/lawyers";
import { getPeople } from "@/actions/people";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Accountant, Client, Household, Lawyer } from "@/types/crm";

import { PeopleTable } from "./_components/people-table";

export default async function PeoplePage() {
  const [peopleRes, clientsRes, lawyersRes, accountantsRes, householdsRes] = await Promise.all([
    getPeople(),
    getClients(),
    getLawyers(),
    getAccountants(),
    getHouseholds(),
  ]);

  if (!peopleRes.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">People</h1>
          <p className="mt-2 text-muted-foreground">Manage people in the system.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {peopleRes.error || "Failed to fetch people from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rawPeople = peopleRes.people || [];
  const clients = (clientsRes.success && clientsRes.clients ? clientsRes.clients : []) as Client[];
  const lawyers = (lawyersRes.success && lawyersRes.lawyers ? lawyersRes.lawyers : []) as Lawyer[];
  const accountants = (
    accountantsRes.success && accountantsRes.accountants ? accountantsRes.accountants : []
  ) as Accountant[];
  const households = (householdsRes.success && householdsRes.households ? householdsRes.households : []) as Household[];

  const people = rawPeople.map((person) => {
    const isLinked =
      clients.some((c) => c.personId === person.id) ||
      lawyers.some((l) => !!person.id && l.personIds?.includes(person.id)) ||
      accountants.some((a) => a.personId === person.id) ||
      households.some((h) => h.memberIds?.some((m) => m.personId === person.id)) ||
      clients.some((c) => c.familyMembers?.some((m) => m.personId === person.id));

    return {
      ...person,
      isLinked,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">People</h1>
          <p className="mt-2 text-muted-foreground">View, add, and manage individuals in your CRM.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/people/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Person
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <PeopleTable data={people} />
      </div>
    </div>
  );
}
