import { notFound } from "next/navigation";

import { getTeam } from "@/actions/teams";

import { TeamDetailClient } from "./team-detail-client";

interface TeamDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { id } = await params;

  const teamRes = await getTeam(id);

  if (!teamRes.success || !teamRes.team) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <TeamDetailClient initialTeam={teamRes.team} />
    </div>
  );
}
