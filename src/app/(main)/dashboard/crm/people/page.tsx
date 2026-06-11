import Link from "next/link";

import { AlertCircle, Plus } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getBanks } from "@/actions/banks";
import { getClients } from "@/actions/clients";
import { getHouseholds } from "@/actions/households";
import { getLawFirms } from "@/actions/law-firms";
import { getPeople } from "@/actions/people";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type {
  AccountingFirm,
  ActuarialFirm,
  Bank,
  Client,
  Household,
  LawFirm,
  PropertyAndCasualtyFirm,
} from "@/types/crm";

import { PeopleTable } from "./_components/people-table";

export default async function PeoplePage() {
  const [
    peopleRes,
    clientsRes,
    lawFirmsRes,
    accountingFirmsRes,
    actuarialFirmsRes,
    banksRes,
    propertyAndCasualtyFirmsRes,
    householdsRes,
  ] = await Promise.all([
    getPeople(),
    getClients(),
    getLawFirms(),
    getAccountingFirms(),
    getActuarialFirms(),
    getBanks(),
    getPropertyAndCasualtyFirms(),
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
  const lawFirms = (lawFirmsRes.success && lawFirmsRes.lawFirms ? lawFirmsRes.lawFirms : []) as LawFirm[];
  const accountingFirms = (
    accountingFirmsRes.success && accountingFirmsRes.accountingFirms ? accountingFirmsRes.accountingFirms : []
  ) as AccountingFirm[];
  const actuarialFirms = (
    actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms ? actuarialFirmsRes.actuarialFirms : []
  ) as ActuarialFirm[];
  const banks = (banksRes.success && banksRes.banks ? banksRes.banks : []) as Bank[];
  const propertyAndCasualtyFirms = (
    propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms
      ? propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms
      : []
  ) as PropertyAndCasualtyFirm[];
  const households = (householdsRes.success && householdsRes.households ? householdsRes.households : []) as Household[];

  const people = rawPeople.map((person) => {
    const isLinked =
      clients.some((c) => c.personId === person.id) ||
      lawFirms.some((l) => !!person.id && l.personIds?.includes(person.id)) ||
      accountingFirms.some((a) => !!person.id && a.personIds?.includes(person.id)) ||
      actuarialFirms.some((act) => !!person.id && act.personIds?.includes(person.id)) ||
      banks.some((b) => !!person.id && b.personIds?.includes(person.id)) ||
      propertyAndCasualtyFirms.some((pc) => !!person.id && pc.personIds?.includes(person.id)) ||
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
