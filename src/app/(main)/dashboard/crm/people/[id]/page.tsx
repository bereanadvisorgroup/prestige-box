import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowUpRight,
  Calculator,
  Database,
  HeartHandshake,
  HeartPulse,
  Landmark,
  Pencil,
  ReceiptText,
  Scale,
  Shield,
  ShieldAlert,
  TrendingUp,
  User,
} from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getInsuranceAgencies } from "@/actions/insurance-agencies";
import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getAddress } from "@/actions/addresses";
import { getBanks } from "@/actions/banks";
import { getClients } from "@/actions/clients";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { getLawFirms } from "@/actions/law-firms";
import { getLifeInsuranceCompanies } from "@/actions/life-insurance-companies";
import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";
import { getMoneyManagers } from "@/actions/money-managers";
import { getNotes } from "@/actions/notes";
import { getPerson } from "@/actions/people";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { getRecordKeepers } from "@/actions/record-keepers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPersonPhotoUrl } from "@/lib/social";

import { PersonProfileTabs } from "./_components/person-profile-tabs";

interface PersonPageProps {
  params: {
    id: string;
  };
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const result = await getPerson(id);

  if (!result.success || !result.person) {
    notFound();
  }

  const person = result.person;

  // Fetch roles/associations and notes
  const [
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
    notesRes,
  ] = await Promise.all([
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
    getNotes({ personId: id }),
  ]);

  const associatedClient =
    ((clientsRes.success && clientsRes.clients) || []).find((c) => c.personId === person.id) || null;

  const associatedLawFirms = ((lawFirmsRes.success && lawFirmsRes.lawFirms) || []).filter(
    (l) => !!person.id && l.personIds?.includes(person.id),
  );
  const associatedAccountingFirms = ((accountingFirmsRes.success && accountingFirmsRes.accountingFirms) || []).filter(
    (a) => !!person.id && a.personIds?.includes(person.id),
  );
  const associatedInsuranceAgencies = ((insuranceAgenciesRes.success && insuranceAgenciesRes.insuranceAgencies) || []).filter(
    (ia) => !!person.id && ia.personIds?.includes(person.id),
  );
  const associatedActuarialFirms = ((actuarialFirmsRes.success && actuarialFirmsRes.actuarialFirms) || []).filter(
    (act) => !!person.id && act.personIds?.includes(person.id),
  );
  const associatedBanks = ((banksRes.success && banksRes.banks) || []).filter(
    (b) => !!person.id && b.personIds?.includes(person.id),
  );
  const associatedPropertyAndCasualties = (
    (propertyAndCasualtyFirmsRes.success && propertyAndCasualtyFirmsRes.propertyAndCasualtyFirms) ||
    []
  ).filter((pc) => !!person.id && pc.personIds?.includes(person.id));

  const associatedLife = ((lifeRes.success && lifeRes.companies) || []).filter(
    (c) => !!person.id && c.personIds?.includes(person.id),
  );
  const associatedDisability = ((disabilityRes.success && disabilityRes.companies) || []).filter(
    (c) => !!person.id && c.personIds?.includes(person.id),
  );
  const associatedLtc = ((ltcRes.success && ltcRes.companies) || []).filter(
    (c) => !!person.id && c.personIds?.includes(person.id),
  );
  const associatedMoneyManagers = ((moneyRes.success && moneyRes.moneyManagers) || []).filter(
    (c) => !!person.id && c.personIds?.includes(person.id),
  );
  const associatedRecordKeepers = ((recordRes.success && recordRes.recordKeepers) || []).filter(
    (c) => !!person.id && c.personIds?.includes(person.id),
  );

  // Fetch addresses
  const addressPromises = (person.addressIds || []).map((addrId) => getAddress(addrId));
  const addressResults = await Promise.all(addressPromises);
  const addresses = addressResults
    .map((res) => (res.success && res.address ? res.address : null))
    .filter(Boolean) as any[];

  const initials = `${person.firstName[0] || ""}${person.lastName[0] || ""}`.toUpperCase();

  const hasAnyAssociation =
    associatedClient ||
    associatedLawFirms.length > 0 ||
    associatedAccountingFirms.length > 0 ||
    associatedInsuranceAgencies.length > 0 ||
    associatedActuarialFirms.length > 0 ||
    associatedBanks.length > 0 ||
    associatedPropertyAndCasualties.length > 0 ||
    associatedLife.length > 0 ||
    associatedDisability.length > 0 ||
    associatedLtc.length > 0 ||
    associatedMoneyManagers.length > 0 ||
    associatedRecordKeepers.length > 0;

  const notes = notesRes.success && notesRes.notes ? notesRes.notes : [];

  return (
    <div className="fade-in mx-auto w-full max-w-6xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-md border-2 border-primary/10">
            {getPersonPhotoUrl(person) && (
              <AvatarImage
                src={getPersonPhotoUrl(person)!}
                alt={`${person.firstName} ${person.lastName}`}
                className="object-cover"
              />
            )}
            <AvatarFallback className="rounded-md bg-primary/5 font-bold text-2xl text-primary">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-bold text-3xl tracking-tight">
                {person.prefix && `${person.prefix} `}
                {person.firstName} {person.middleName && `${person.middleName} `}
                {person.lastName}
                {person.suffix && `, ${person.suffix}`}
              </h1>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {associatedClient && (
                <Link href={`/dashboard/crm/clients/${associatedClient.id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-blue-100 text-blue-800 hover:bg-blue-200">
                    <User className="h-3 w-3" /> Client <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedLawFirms.length > 0 && (
                <Link href={`/dashboard/crm/law-firms/${associatedLawFirms[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-purple-100 text-purple-800 hover:bg-purple-200">
                    <Scale className="h-3 w-3" /> Law Firm <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedAccountingFirms.length > 0 && (
                <Link href={`/dashboard/crm/accounting-firms/${associatedAccountingFirms[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-amber-100 text-amber-800 hover:bg-amber-200">
                    <ReceiptText className="h-3 w-3" /> Accounting Firm <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedActuarialFirms.length > 0 && (
                <Link href={`/dashboard/crm/actuarial-firms/${associatedActuarialFirms[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                    <Calculator className="h-3 w-3" /> Actuarial Firm <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedBanks.length > 0 && (
                <Link href={`/dashboard/crm/banks/${associatedBanks[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                    <Landmark className="h-3 w-3" /> Bank <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedPropertyAndCasualties.length > 0 && (
                <Link href={`/dashboard/crm/property-and-casualty/${associatedPropertyAndCasualties[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-teal-100 text-teal-800 hover:bg-teal-200">
                    <Shield className="h-3 w-3" /> Property And Casualty <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedLife.length > 0 && (
                <Link href={`/dashboard/admin/life-insurance-companies/${associatedLife[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-red-100 text-red-800 hover:bg-red-200">
                    <HeartHandshake className="h-3 w-3" /> Life Insurance <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedDisability.length > 0 && (
                <Link href={`/dashboard/admin/disability-insurance-companies/${associatedDisability[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-orange-100 text-orange-800 hover:bg-orange-200">
                    <ShieldAlert className="h-3 w-3" /> Disability Insurance <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedLtc.length > 0 && (
                <Link href={`/dashboard/admin/long-term-care-insurance/${associatedLtc[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-pink-100 text-pink-800 hover:bg-pink-200">
                    <HeartPulse className="h-3 w-3" /> Long Term Care <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedMoneyManagers.length > 0 && (
                <Link href={`/dashboard/admin/money-managers/${associatedMoneyManagers[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-cyan-100 text-cyan-800 hover:bg-cyan-200">
                    <TrendingUp className="h-3 w-3" /> Money Manager <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {associatedRecordKeepers.length > 0 && (
                <Link href={`/dashboard/admin/record-keepers/${associatedRecordKeepers[0].id}`}>
                  <Badge className="flex cursor-pointer items-center gap-1 border-none bg-slate-100 text-slate-800 hover:bg-slate-200">
                    <Database className="h-3 w-3" /> Record Keeper <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </Link>
              )}
              {!hasAnyAssociation && <Badge variant="outline">Contact</Badge>}
            </div>
          </div>
        </div>
        <Link href={`/dashboard/crm/people/${person.id}/edit`}>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Person
          </Button>
        </Link>
      </div>

      <PersonProfileTabs
        person={person}
        addresses={addresses}
        associatedClient={associatedClient}
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
        notes={notes}
      />
    </div>
  );
}
