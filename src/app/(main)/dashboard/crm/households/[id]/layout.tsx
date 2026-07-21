import { notFound } from "next/navigation";

import { Home } from "lucide-react";

import { getHousehold } from "@/actions/households";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default async function HouseholdDetailLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const householdResult = await getHousehold(id);

  if (!householdResult.success || !householdResult.household) {
    notFound();
  }

  const household = householdResult.household;
  const memberCount = householdResult.members?.length || 0;

  return (
    <div className="fade-in mx-auto w-full max-w-7xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-md border-2 border-primary/10">
            <AvatarFallback className="rounded-md bg-primary/5 text-2xl text-primary">
              <Home className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="flex items-center gap-2 font-bold text-3xl tracking-tight">
              <span>{household.name}</span>
              <span id="household-header-separator" className="hidden font-normal text-muted-foreground/40">
                {" "}
                :{" "}
              </span>
              <span id="household-header-section-name" className="font-normal text-muted-foreground/80" />
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Household ({memberCount} {memberCount === 1 ? "member" : "members"})
            </p>
          </div>
        </div>
        <div id="household-header-actions" className="flex items-center gap-2" />
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
