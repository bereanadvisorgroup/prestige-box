import { AlertCircle } from "lucide-react";

import { getAccountingFirms } from "@/actions/accounting-firms";
import { getActuarialFirms } from "@/actions/actuarial-firms";
import { getBanks } from "@/actions/banks";
import { getClients } from "@/actions/clients";
import { getCompanies } from "@/actions/companies";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { getHouseholds } from "@/actions/households";
import { getInsuranceAgencies } from "@/actions/insurance-agencies";
import { getLawFirms } from "@/actions/law-firms";
import { getLifeInsuranceCompanies } from "@/actions/life-insurance-companies";
import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";
import { getMoneyManagers } from "@/actions/money-managers";
import { getPeople } from "@/actions/people";
import { getPropertyAndCasualtyFirms } from "@/actions/property-and-casualty";
import { getRecordKeepers } from "@/actions/record-keepers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatPersonName } from "@/lib/utils";
import type {
  AccountingFirm,
  ActuarialFirm,
  Bank,
  Client,
  Company,
  DisabilityInsuranceCompany,
  Household,
  InsuranceAgency,
  LawFirm,
  LifeInsuranceCompany,
  LongTermCareInsurance,
  MoneyManager,
  Person,
  PropertyAndCasualtyFirm,
  RecordKeeper,
} from "@/types/crm";

import type { RelationLink } from "./_components/columns";
import { PeopleTable } from "./_components/people-table";

export default async function PeoplePage() {
  const [
    peopleRes,
    clientsRes,
    lawFirmsRes,
    accountingFirmsRes,
    insuranceAgenciesRes,
    actuarialFirmsRes,
    banksRes,
    propertyAndCasualtyFirmsRes,
    householdsRes,
    companiesRes,
    moneyManagersRes,
    recordKeepersRes,
    lifeInsuranceRes,
    disabilityInsuranceRes,
    ltcInsuranceRes,
  ] = await Promise.all([
    getPeople(),
    getClients(),
    getLawFirms(),
    getAccountingFirms(),
    getInsuranceAgencies(),
    getActuarialFirms(),
    getBanks(),
    getPropertyAndCasualtyFirms(),
    getHouseholds(),
    getCompanies(),
    getMoneyManagers(),
    getRecordKeepers(),
    getLifeInsuranceCompanies(),
    getDisabilityInsuranceCompanies(),
    getLongTermCareInsurances(),
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
  const clients = (clientsRes.success && clientsRes.clients ? clientsRes.clients : []) as (Client & {
    person: Person | null;
  })[];
  const lawFirms = (lawFirmsRes.success && lawFirmsRes.lawFirms ? lawFirmsRes.lawFirms : []) as LawFirm[];
  const accountingFirms = (
    accountingFirmsRes.success && accountingFirmsRes.accountingFirms ? accountingFirmsRes.accountingFirms : []
  ) as AccountingFirm[];
  const insuranceAgencies = (
    insuranceAgenciesRes.success && insuranceAgenciesRes.insuranceAgencies ? insuranceAgenciesRes.insuranceAgencies : []
  ) as InsuranceAgency[];
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
  const companies = (companiesRes.success && companiesRes.companies ? companiesRes.companies : []) as (Company & {
    owners?: { personId: string }[];
  })[];
  const moneyManagers = (
    moneyManagersRes.success && moneyManagersRes.moneyManagers ? moneyManagersRes.moneyManagers : []
  ) as MoneyManager[];
  const recordKeepers = (
    recordKeepersRes.success && recordKeepersRes.recordKeepers ? recordKeepersRes.recordKeepers : []
  ) as RecordKeeper[];
  const lifeInsuranceCompanies = (
    lifeInsuranceRes.success && lifeInsuranceRes.companies ? lifeInsuranceRes.companies : []
  ) as LifeInsuranceCompany[];
  const disabilityInsuranceCompanies = (
    disabilityInsuranceRes.success && disabilityInsuranceRes.companies ? disabilityInsuranceRes.companies : []
  ) as DisabilityInsuranceCompany[];
  const longTermCareInsurances = (
    ltcInsuranceRes.success && ltcInsuranceRes.companies ? ltcInsuranceRes.companies : []
  ) as LongTermCareInsurance[];

  const people = rawPeople.map((person) => {
    const isLinked =
      clients.some((c) => c.personId === person.id) ||
      lawFirms.some((l) => !!person.id && l.personIds?.includes(person.id)) ||
      accountingFirms.some((a) => !!person.id && a.personIds?.includes(person.id)) ||
      insuranceAgencies.some((ia) => !!person.id && ia.personIds?.includes(person.id)) ||
      actuarialFirms.some((act) => !!person.id && act.personIds?.includes(person.id)) ||
      banks.some((b) => !!person.id && b.personIds?.includes(person.id)) ||
      propertyAndCasualtyFirms.some((pc) => !!person.id && pc.personIds?.includes(person.id)) ||
      households.some((h) => h.members?.some((m) => m.clientId === person.id)) ||
      clients.some((c) => c.familyMembers?.some((m) => m.personId === person.id)) ||
      companies.some((comp) => comp.owners?.some((o) => o.personId === person.id)) ||
      moneyManagers.some((m) => !!person.id && m.personIds?.includes(person.id)) ||
      recordKeepers.some((r) => !!person.id && r.personIds?.includes(person.id)) ||
      lifeInsuranceCompanies.some((lic) => !!person.id && lic.personIds?.includes(person.id)) ||
      disabilityInsuranceCompanies.some((dic) => !!person.id && dic.personIds?.includes(person.id)) ||
      longTermCareInsurances.some((ltc) => !!person.id && ltc.personIds?.includes(person.id));

    const relations: RelationLink[] = [];

    // Client
    const clientRecord = clients.find((c) => c.personId === person.id);
    if (clientRecord) {
      relations.push({
        type: "Client",
        name: formatPersonName(person),
        href: `/dashboard/crm/clients/${clientRecord.id}`,
      });
    }

    // Client Family
    for (const c of clients) {
      const familyMember = c.familyMembers?.find((m) => m.personId === person.id);
      if (familyMember) {
        const clientName = c.person ? formatPersonName(c.person, "Client") : "Client";
        relations.push({
          type: `Family: ${familyMember.relationship}`,
          name: clientName,
          href: `/dashboard/crm/clients/${c.id}`,
        });
      }
    }

    // Companies / Owners
    for (const comp of companies) {
      const isOwner = comp.owners?.some((o) => o.personId === person.id);
      if (isOwner) {
        relations.push({
          type: "Company Owner",
          name: comp.name,
          href: `/dashboard/crm/companies/${comp.id}`,
        });
      }
    }

    // Law Firms
    for (const firm of lawFirms) {
      if (person.id && firm.personIds?.includes(person.id)) {
        relations.push({
          type: "Law Firm",
          name: firm.firmName,
          href: `/dashboard/crm/law-firms/${firm.id}`,
        });
      }
    }

    // Accounting Firms
    for (const firm of accountingFirms) {
      if (person.id && firm.personIds?.includes(person.id)) {
        relations.push({
          type: "Accounting Firm",
          name: firm.firmName,
          href: `/dashboard/crm/accounting-firms/${firm.id}`,
        });
      }
    }

    // Insurance Agencies
    for (const firm of insuranceAgencies) {
      if (person.id && firm.personIds?.includes(person.id)) {
        relations.push({
          type: "Insurance Agency",
          name: firm.firmName,
          href: `/dashboard/crm/insurance-agencies/${firm.id}`,
        });
      }
    }

    // Actuarial Firms
    for (const firm of actuarialFirms) {
      if (person.id && firm.personIds?.includes(person.id)) {
        relations.push({
          type: "Actuarial Firm",
          name: firm.firmName,
          href: `/dashboard/crm/actuarial-firms/${firm.id}`,
        });
      }
    }

    // Banks
    for (const firm of banks) {
      if (person.id && firm.personIds?.includes(person.id)) {
        relations.push({
          type: "Bank",
          name: firm.firmName,
          href: `/dashboard/crm/banks/${firm.id}`,
        });
      }
    }

    // Property & Casualty Firms
    for (const firm of propertyAndCasualtyFirms) {
      if (person.id && firm.personIds?.includes(person.id)) {
        relations.push({
          type: "P&C Firm",
          name: firm.firmName,
          href: `/dashboard/crm/property-and-casualty/${firm.id}`,
        });
      }
    }

    // Households
    for (const h of households) {
      if (h.members?.some((m) => m.clientId === person.id)) {
        relations.push({
          type: "Household",
          name: h.name,
          href: `/dashboard/crm/households/${h.id}`,
        });
      }
    }

    // Money Managers
    for (const mm of moneyManagers) {
      if (person.id && mm.personIds?.includes(person.id)) {
        relations.push({
          type: "Money Manager",
          name: mm.firmName,
          href: `/dashboard/admin/money-managers/${mm.id}`,
        });
      }
    }

    // Record Keepers
    for (const rk of recordKeepers) {
      if (person.id && rk.personIds?.includes(person.id)) {
        relations.push({
          type: "Record Keeper",
          name: rk.firmName,
          href: `/dashboard/admin/record-keepers/${rk.id}`,
        });
      }
    }

    // Life Insurance
    for (const lic of lifeInsuranceCompanies) {
      if (person.id && lic.personIds?.includes(person.id)) {
        relations.push({
          type: "Life Insurance Co",
          name: lic.name,
          href: `/dashboard/admin/life-insurance-companies/${lic.id}`,
        });
      }
    }

    // Disability Insurance
    for (const dic of disabilityInsuranceCompanies) {
      if (person.id && dic.personIds?.includes(person.id)) {
        relations.push({
          type: "Disability Insurance Co",
          name: dic.name,
          href: `/dashboard/admin/disability-insurance-companies/${dic.id}`,
        });
      }
    }

    // Long Term Care Insurance
    for (const ltc of longTermCareInsurances) {
      if (person.id && ltc.personIds?.includes(person.id)) {
        relations.push({
          type: "LTC Insurance Co",
          name: ltc.name,
          href: `/dashboard/admin/long-term-care-insurance/${ltc.id}`,
        });
      }
    }

    return {
      ...person,
      isLinked,
      relations,
    };
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <PeopleTable data={people} />
    </div>
  );
}
