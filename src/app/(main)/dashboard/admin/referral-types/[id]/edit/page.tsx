import { notFound } from "next/navigation";

import { getReferralType } from "@/actions/referral-types";

import { ReferralTypeForm } from "../../_components/referral-type-form";

interface EditReferralTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditReferralTypePage({ params }: EditReferralTypePageProps) {
  const { id } = await params;
  const result = await getReferralType(id);

  if (!result.success || !result.referralType) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Edit Referral Type</h1>
        <p className="mt-2 text-muted-foreground">Update the name of the referral type.</p>
      </div>

      <ReferralTypeForm referralType={result.referralType} />
    </div>
  );
}
