import { notFound } from "next/navigation";

import { getTag } from "@/actions/tags";

import { TagForm } from "../../_components/tag-form";

interface EditPeopleTagPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPeopleTagPage({ params }: EditPeopleTagPageProps) {
  const { id } = await params;
  const result = await getTag(id);

  if (!result.success || !result.tag) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
      <TagForm tag={result.tag} />
    </div>
  );
}
