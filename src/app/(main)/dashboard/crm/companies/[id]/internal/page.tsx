import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

// The "internal" section currently surfaces change history.
export default async function CompanyInternalPage({ params }: PageProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      OVERVIEW PAGE
    </div>
  );
}
