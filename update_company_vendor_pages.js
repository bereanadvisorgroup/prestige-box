const fs = require("fs");
const path = require("path");

const configurations = [
  {
    folder: "money-managers",
    singular: "MoneyManager",
    plural: "MoneyManagers",
    icon: "TrendingUp",
    linkPrefix: "/dashboard/admin/money-managers",
    firmTypeLabel: "Money Manager",
    title: "Associated Money Managers",
    description: "Money managers this company is associated with",
  },
  {
    folder: "record-keepers",
    singular: "RecordKeeper",
    plural: "RecordKeepers",
    icon: "Database",
    linkPrefix: "/dashboard/admin/record-keepers",
    firmTypeLabel: "Record Keeper",
    title: "Associated Record Keepers",
    description: "Record keepers this company is associated with",
  },
  {
    folder: "life-insurance",
    singular: "LifeInsuranceCompany",
    plural: "LifeInsuranceCompanies",
    icon: "HeartHandshake",
    linkPrefix: "/dashboard/admin/life-insurance-companies",
    firmTypeLabel: "Life Insurance Company",
    title: "Associated Life Insurance Companies",
    description: "Life insurance companies this company is associated with",
  },
  {
    folder: "disability-insurance",
    singular: "DisabilityInsuranceCompany",
    plural: "DisabilityInsuranceCompanies",
    icon: "ShieldAlert",
    linkPrefix: "/dashboard/admin/disability-insurance-companies",
    firmTypeLabel: "Disability Insurance Company",
    title: "Associated Disability Insurance Companies",
    description: "Disability insurance companies this company is associated with",
  },
  {
    folder: "long-term-care",
    singular: "LongTermCareInsurance",
    plural: "LongTermCareInsurance",
    icon: "HeartPulse",
    linkPrefix: "/dashboard/admin/long-term-care-insurance",
    firmTypeLabel: "Long Term Care Insurance",
    title: "Associated Long Term Care Insurance",
    description: "Long term care insurance companies this company is associated with",
  },
];

configurations.forEach((config) => {
  const filePath = path.join(process.cwd(), `src/app/(main)/dashboard/crm/companies/[id]/${config.folder}/page.tsx`);

  // The action file name is exactly config.folder except for life, disability, long-term-care which need -companies / -insurance
  let actionFile = config.folder;
  if (config.folder === "life-insurance") actionFile = "life-insurance-companies";
  if (config.folder === "disability-insurance") actionFile = "disability-insurance-companies";
  if (config.folder === "long-term-care") actionFile = "long-term-care-insurance";

  const newContent = `import { notFound } from "next/navigation";

import { ${config.icon} } from "lucide-react";

import { getCompany } from "@/actions/companies";
import { get${config.plural}, linkCompanyTo${config.singular}, unlinkCompanyFrom${config.singular} } from "@/actions/${actionFile}";
import { AssociationCardList } from "@/components/crm/association-card-list";
import { LinkFirmDialog } from "@/components/crm/link-firm-dialog";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ${config.singular}Page({ params }: Props) {
  const { id } = await params;
  const companyResult = await getCompany(id);

  if (!companyResult.success || !companyResult.company) {
    notFound();
  }

  const company = companyResult.company;
  const res = await get${config.plural}();
  const allFirms = (res.success && res.${actionFile === "life-insurance-companies" || actionFile === "disability-insurance-companies" ? "companies" : actionFile === "long-term-care-insurance" ? "insurances" : actionFile === "record-keepers" ? "recordKeepers" : "moneyManagers"}) || [];

  const associatedFirms = allFirms.filter((f: any) => f.companyIds?.includes(company.id || ""));

  const availableFirms = allFirms
    .filter((f: any) => !f.companyIds?.includes(company.id || ""))
    .map((f: any) => ({ id: f.id || "", name: f.name || f.firmName }));

  return (
    <div className="bg-muted/5 p-4 md:p-6 lg:p-8">
      <AssociationCardList
        entityId={company.id || ""}
        title="${config.title}"
        description="${config.description}"
        items={associatedFirms.map((f: any) => ({
          id: f.id || "",
          name: f.name || f.firmName,
          website: f.website || f.websiteUrl,
          phone: f.phone,
          isLinked: false,
        }))}
        linkPrefix="${config.linkPrefix}"
        icon={${config.icon}}
        onUnlinkAction={unlinkCompanyFrom${config.singular}}
        actionNode={
          <LinkFirmDialog
            entityId={company.id || ""}
            firmTypeLabel="${config.firmTypeLabel}"
            availableFirms={availableFirms}
            newFirmLink={\`${config.linkPrefix}/new?companyId=\${company.id}\`}
            onLinkAction={linkCompanyTo${config.singular}}
          />
        }
      />
    </div>
  );
}
`;

  fs.writeFileSync(filePath, newContent);
  console.log(`Updated ${filePath}`);
});
