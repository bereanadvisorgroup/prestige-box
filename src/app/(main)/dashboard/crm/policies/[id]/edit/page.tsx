import { notFound } from "next/navigation";

import { getClientPolicy } from "@/actions/policies";
import { PolicyForm } from "@/app/(main)/dashboard/crm/policies/_components/policy-form";

interface EditPolicyPageProps {
  params: {
    id: string;
  };
}

export default async function EditPolicyPage({ params }: EditPolicyPageProps) {
  const { id } = await params;
  const result = await getClientPolicy(id);

  if (!result.success || !result.policy) {
    notFound();
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <PolicyForm policy={result.policy} />
    </div>
  );
}
