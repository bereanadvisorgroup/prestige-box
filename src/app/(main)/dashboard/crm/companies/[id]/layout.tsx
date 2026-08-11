import Link from "next/link";
import { notFound } from "next/navigation";

import { Building2, Clock, Pencil } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { FirmLogo } from "@/components/features/crm/firm-logo";
import { Button } from "@/components/ui/button";
import { getCompanyLogoUrl } from "@/lib/social";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default async function CompanyDetailLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;

  return (
    <div className="fade-in mx-auto w-full max-w-7xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <FirmLogo
            logoUrl={getCompanyLogoUrl(company)}
            name={company.name}
            className="h-20 w-20 rounded-md border-2 border-primary/10"
            size="lg"
            fallbackIcon={<Building2 className="h-8 w-8" />}
          />
          <div>
            <h1 className="font-bold text-3xl tracking-tight flex items-center gap-2">
              <span>{company.name}</span>
              <span id="company-header-separator" className="text-muted-foreground/40 font-normal hidden">
                {" "}
                :{" "}
              </span>
              <span id="company-header-section-name" className="text-muted-foreground/80 font-normal" />
            </h1>
          </div>
        </div>
        <div id="company-header-actions" className="flex gap-2 items-center" />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border bg-background/50 shadow-sm backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
