import { notFound } from "next/navigation";
import { getPerson } from "@/actions/people";
import { PersonForm } from "../../_components/person-form";

interface EditPersonPageProps {
  params: {
    id: string;
  };
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
  const { id } = await params;
  const result = await getPerson(id);

  if (!result.success || !result.person) {
    notFound();
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <PersonForm person={result.person} />
    </div>
  );
}
