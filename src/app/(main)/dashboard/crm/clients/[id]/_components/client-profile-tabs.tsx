"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Client, Person } from "@/types/crm";

import { DocumentsTab } from "./tabs/documents-tab";
import { EmploymentTab } from "./tabs/employment-tab";
import { FamilyTab } from "./tabs/family-tab";
import { GeneralTab } from "./tabs/general-tab";
import { LiabilitiesTab } from "./tabs/liabilities-tab";
import { MortgageTab } from "./tabs/mortgage-tab";
import { PersonalTab } from "./tabs/personal-tab";

interface ClientProfileTabsProps {
  client: Client;
  person: Person | null;
}

export function ClientProfileTabs({ client, person }: ClientProfileTabsProps) {
  return (
    <div className="fade-in col-span-1 w-full animate-in duration-500 lg:col-span-3">
      <Tabs defaultValue="personal" className="w-full">
        <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-12 min-w-max items-center justify-start rounded-lg border bg-muted/50 p-1.5 text-muted-foreground shadow-inner">
            <TabsTrigger
              value="personal"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Personal
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="family"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Family
            </TabsTrigger>
            <TabsTrigger
              value="employment"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Employment
            </TabsTrigger>
            <TabsTrigger
              value="pc"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Property & Casualty
            </TabsTrigger>
            <TabsTrigger
              value="life"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Life / Disability
            </TabsTrigger>
            <TabsTrigger
              value="mortgage"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Mortgage
            </TabsTrigger>
            <TabsTrigger
              value="liabilities"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Liabilities
            </TabsTrigger>
            <TabsTrigger
              value="estate"
              className="rounded-md px-4 py-2 font-medium text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Estate Planning
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-background/50 shadow-sm backdrop-blur-sm">
          <TabsContent value="personal" className="m-0 border-0 p-4 outline-none md:p-6 lg:p-8">
            {person ? (
              <PersonalTab person={person} />
            ) : (
              <p className="p-8 text-center text-muted-foreground italic">No person linked to this client.</p>
            )}
          </TabsContent>
          <TabsContent value="general" className="m-0 border-0 p-4 outline-none md:p-6 lg:p-8">
            <GeneralTab client={client} />
          </TabsContent>
          <TabsContent value="family" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <FamilyTab client={client} />
          </TabsContent>
          <TabsContent value="employment" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <EmploymentTab client={client} />
          </TabsContent>
          <TabsContent value="pc" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <DocumentsTab
              client={client}
              category="pcDocuments"
              title="Property & Casualty Documents"
              types={[
                "Home Declaration Page",
                "Automobile Declaration Page",
                "Umbrella Declaration Page",
                "Flood Declaration Page",
                "Collections Declaration Page",
                "Boat/RV Declaration Page",
                "Elevation Certificate",
                "Wind Mitigation",
                "4 Point Inspection",
                "Other",
              ]}
            />
          </TabsContent>
          <TabsContent value="life" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <DocumentsTab
              client={client}
              category="lifeDocuments"
              title="Life & Disability Documents"
              types={["Life", "STD/LTD", "Other"]}
            />
          </TabsContent>
          <TabsContent value="mortgage" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            {person ? (
              <MortgageTab client={client} person={person} />
            ) : (
              <p className="p-8 text-center text-muted-foreground italic">
                No person linked to this client to load addresses from.
              </p>
            )}
          </TabsContent>
          <TabsContent value="liabilities" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <LiabilitiesTab client={client} />
          </TabsContent>
          <TabsContent value="estate" className="m-0 border-0 bg-muted/5 p-4 outline-none md:p-6 lg:p-8">
            <DocumentsTab
              client={client}
              category="estateDocuments"
              title="Estate Planning Documents"
              types={["Will", "Revocable Trust", "Irrevocable Trust", "Other"]}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
