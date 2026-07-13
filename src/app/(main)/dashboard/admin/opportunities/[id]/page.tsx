import { redirect } from "next/navigation";

interface PipelinePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PipelinePage({ params }: PipelinePageProps) {
  const { id } = await params;
  redirect(`/dashboard/admin/opportunities/${id}/edit`);
}
