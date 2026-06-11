import Link from "next/link";
export const dynamic = "force-dynamic";

import { AlertCircle, Plus } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getAddresses } from "@/actions/addresses";
import { getBanks } from "@/actions/banks";
import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
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
  Company,
  Household,
  LawFirm,
  Person,
  PropertyAndCasualtyFirm,
} from "@/types/crm";

import { AddressesTable } from "./_components/addresses-table";

export default async function AddressesPage() {
  const [
    result,
    peopleResult,
    householdsResult,
    companiesResult,
    lawFirmsResult,
    accountingFirmsResult,
    actuarialFirmsResult,
    banksResult,
    propertyAndCasualtyFirmsResult,
    clientsResult,
  ] = await Promise.all([
    getAddresses(),
    getPeople(),
    getHouseholds(),
    getCompanies(),
    getLawFirms(),
    getAccountingFirms(),
    getActuarialFirms(),
    getBanks(),
    getPropertyAndCasualtyFirms(),
    getClients(),
  ]);

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Addresses</h1>
          <p className="mt-2 text-muted-foreground">Manage addresses in the system.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch addresses from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const addresses = result.addresses || [];
  const people = (peopleResult.success && peopleResult.people ? peopleResult.people : []) as Person[];
  const households = (
    householdsResult.success && householdsResult.households ? householdsResult.households : []
  ) as Household[];
  const companies = (
    companiesResult.success && companiesResult.companies ? companiesResult.companies : []
  ) as Company[];
  const lawFirms = (lawFirmsResult.success && lawFirmsResult.lawFirms ? lawFirmsResult.lawFirms : []) as LawFirm[];
  const accountingFirms = (
    accountingFirmsResult.success && accountingFirmsResult.accountingFirms ? accountingFirmsResult.accountingFirms : []
  ) as AccountingFirm[];
  const actuarialFirms = (
    actuarialFirmsResult.success && actuarialFirmsResult.actuarialFirms ? actuarialFirmsResult.actuarialFirms : []
  ) as ActuarialFirm[];
  const banks = (banksResult.success && banksResult.banks ? banksResult.banks : []) as Bank[];
  const propertyAndCasualtyFirms = (
    propertyAndCasualtyFirmsResult.success && propertyAndCasualtyFirmsResult.propertyAndCasualtyFirms
      ? propertyAndCasualtyFirmsResult.propertyAndCasualtyFirms
      : []
  ) as PropertyAndCasualtyFirm[];
  const clients = (clientsResult.success && clientsResult.clients ? clientsResult.clients : []) as Client[];

  const enrichedAddresses = addresses.map((addr) => {
    const linkedPeople = people.flatMap((p) => {
      const addrLink = p.addresses?.find((a) => a.id === addr.id);
      if (addrLink) {
        return [
          {
            id: p.id!,
            name: `${p.firstName} ${p.lastName}`,
            type: addrLink.type,
          },
        ];
      }
      if (p.addressIds?.includes(addr.id!)) {
        return [
          {
            id: p.id!,
            name: `${p.firstName} ${p.lastName}`,
            type: "Home",
          },
        ];
      }
      return [];
    });

    const isLinked =
      linkedPeople.length > 0 ||
      households.some((h) => h.addressId === addr.id) ||
      companies.some((c) => c.addressId === addr.id) ||
      lawFirms.some((l) => l.firmAddressId === addr.id) ||
      accountingFirms.some((a) => a.firmAddressId === addr.id) ||
      actuarialFirms.some((act) => act.firmAddressId === addr.id) ||
      banks.some((b) => b.firmAddressId === addr.id) ||
      propertyAndCasualtyFirms.some((pc) => pc.firmAddressId === addr.id) ||
      clients.some((c) => c.mortgages?.some((m) => m.addressId === addr.id)) ||
      clients.some((c) => c.employments?.some((e) => e.employerAddressId === addr.id));

    return { ...addr, linkedPeople, isLinked };
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Addresses</h1>
          <p className="mt-2 text-muted-foreground">View, add, and manage location records in your CRM.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/addresses/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Address
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <AddressesTable data={enrichedAddresses} />
      </div>
    </div>
  );
}
