import Link from "next/link";
import { notFound } from "next/navigation";

import { Globe, MapPin, Pencil } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getAddress } from "@/actions/addresses";
import { getBanks } from "@/actions/banks";
import { getClients } from "@/actions/clients";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { getInsuranceAgencies } from "@/actions/insurance-agencies";
import { getLawFirms } from "@/actions/law-firms";
import { getLifeInsuranceCompanies } from "@/actions/life-insurance-companies";
import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";
import { getMoneyManagers } from "@/actions/money-managers";
import { getPeople } from "@/actions/people";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { getRecordKeepers } from "@/actions/record-keepers";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatPersonName } from "@/lib/utils";

import { AddressProfileTabs } from "./_components/address-profile-tabs";

interface AddressPageProps {
  params: {
    id: string;
  };
}

export default async function AddressPage({ params }: AddressPageProps) {
  const { id } = await params;
  const result = await getAddress(id);

  if (!result.success || !result.address) {
    notFound();
  }

  const address = result.address;

  // Fetch associated people and all entity associations
  const [
    peopleRes,
    clientsRes,
    lawFirmsRes,
    accountingFirmsRes,
    insuranceAgenciesRes,
    actuarialFirmsRes,
    banksRes,
    propertyAndCasualtyFirmsRes,
    lifeRes,
    disabilityRes,
    ltcRes,
    moneyRes,
    recordRes,
  ] = await Promise.all([
    getPeople(),
    getClients(),
    getLawFirms(),
    getAccountingFirms(),
    getInsuranceAgencies(),
    getActuarialFirms(),
    getBanks(),
    getPropertyAndCasualtyFirms(),
    getLifeInsuranceCompanies(),
    getDisabilityInsuranceCompanies(),
    getLongTermCareInsurances(),
    getMoneyManagers(),
    getRecordKeepers(),
  ]);

  const people = peopleRes.success && peopleRes.people ? peopleRes.people : [];

  // Filter people linked to this address
  const associatedPeople = people.flatMap((p) => {
    const addrLink = p.addresses?.find((a) => a.id === address.id);
    if (addrLink) {
      return [
        {
          id: p.id!,
          firstName: p.firstName,
          lastName: p.lastName,
          suffix: p.suffix,
          photoUrl: p.photoUrl,
          email: p.emails?.find((e) => e.isPrimary)?.address || p.emails?.[0]?.address || "N/A",
          phone: p.phones?.find((ph) => ph.isPrimary)?.number || p.phones?.[0]?.number || "N/A",
          type: addrLink.type,
          isPrimary: addrLink.isPrimary,
        },
      ];
    }
    if (p.addressIds?.includes(address.id!)) {
      return [
        {
          id: p.id!,
          firstName: p.firstName,
          lastName: p.lastName,
          suffix: p.suffix,
          photoUrl: p.photoUrl,
          email: p.emails?.find((e) => e.isPrimary)?.address || p.emails?.[0]?.address || "N/A",
          phone: p.phones?.find((ph) => ph.isPrimary)?.number || p.phones?.[0]?.number || "N/A",
          type: "Home",
          isPrimary: false,
        },
      ];
    }
    return [];
  });

  const associatedPeopleIds = associatedPeople.map((ap) => ap.id);

  // Filter associations for all people linked to this address
  const associatedClients = ((clientsRes.success && clientsRes.clients) || [])
    .filter((c) => !!c.personId && associatedPeopleIds.includes(c.personId))
    .map((c) => {
      const person = associatedPeople.find((ap) => ap.id === c.personId);
      return {
        personName: formatPersonName(person, "Unknown"),
        client: c,
      };
    });

  const associatedLawFirms = ((lawFirmsRes.success && lawFirmsRes.lawFirms) || []).filter((l) =>
    associatedPeopleIds.some((pId) => l.personIds?.includes(pId)),
  );

  const associatedAccountingFirms = ((accountingFirmsRes.success && accountingFirmsRes.accountingFirms) || []).filter(
    (a) => associatedPeopleIds.some((pId) => a.personIds?.includes(pId)),
  );

  const associatedInsuranceAgencies = (
    (insuranceAgenciesRes.success && insuranceAgenciesRes.insuranceAgencies) ||
    []
  ).filter((ia) => associatedPeopleIds.some((pId) => ia.personIds?.includes(pId)));

  const associatedActuarialFirms = ((actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms) || []).filter(
    (act) => associatedPeopleIds.some((pId) => act.personIds?.includes(pId)),
  );

  const associatedBanks = ((banksRes.success && banksRes.banks) || []).filter((b) =>
    associatedPeopleIds.some((pId) => b.personIds?.includes(pId)),
  );

  const associatedPropertyAndCasualties = (
    (propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms) ||
    []
  ).filter((pc) => associatedPeopleIds.some((pId) => pc.personIds?.includes(pId)));

  const associatedLife = ((lifeRes.success && lifeRes.companies) || []).filter((c) =>
    associatedPeopleIds.some((pId) => c.personIds?.includes(pId)),
  );

  const associatedDisability = ((disabilityRes.success && disabilityRes.companies) || []).filter((c) =>
    associatedPeopleIds.some((pId) => c.personIds?.includes(pId)),
  );

  const associatedLtc = ((ltcRes.success && ltcRes.companies) || []).filter((c) =>
    associatedPeopleIds.some((pId) => c.personIds?.includes(pId)),
  );

  const associatedMoneyManagers = ((moneyRes.success && moneyRes.moneyManagers) || []).filter((c) =>
    associatedPeopleIds.some((pId) => c.personIds?.includes(pId)),
  );

  const associatedRecordKeepers = ((recordRes.success && recordRes.recordKeepers) || []).filter((c) =>
    associatedPeopleIds.some((pId) => c.personIds?.includes(pId)),
  );

  return (
    <div className="fade-in mx-auto w-full max-w-6xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-md border-2 border-primary/10">
            <AvatarFallback className="rounded-md bg-primary/5 text-2xl text-primary">
              <MapPin className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{address.street1}</h1>
            {address.street2 && <p className="mt-0.5 text-lg text-muted-foreground">{address.street2}</p>}
            <p className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" /> {address.city}, {address.state} {address.zipCode} • {address.country}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/crm/addresses/${address.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Address
          </Button>
        </Link>
      </div>

      <AddressProfileTabs
        address={address}
        associatedPeople={associatedPeople}
        associatedClients={associatedClients}
        associatedLawFirms={associatedLawFirms}
        associatedAccountingFirms={associatedAccountingFirms}
        associatedInsuranceAgencies={associatedInsuranceAgencies}
        associatedActuarialFirms={associatedActuarialFirms}
        associatedBanks={associatedBanks}
        associatedPropertyAndCasualties={associatedPropertyAndCasualties}
        associatedLife={associatedLife}
        associatedDisability={associatedDisability}
        associatedLtc={associatedLtc}
        associatedMoneyManagers={associatedMoneyManagers}
        associatedRecordKeepers={associatedRecordKeepers}
      />
    </div>
  );
}
