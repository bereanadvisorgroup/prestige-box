import { AlertCircle, GitBranch, TrendingUp, Users } from "lucide-react";

import { getReferralsReportData } from "@/actions/referrals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

import { ReferralTree } from "./_components/referral-tree";
import { ReferralTypePie } from "./_components/referral-type-pie";
import { ReferralsOverTime } from "./_components/referrals-over-time";

export const metadata = {
  title: "Referrals | Prestige Box",
};

export default async function ReferralsReportPage() {
  const result = await getReferralsReportData();

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Referrals</h1>
          <p className="mt-2 text-muted-foreground">Explore who refers your clients and how referrals trend.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to load referral data from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { treeNodes, treeLinks, referralTypePie, timeSeries, totalReferred, totalInTree, referredLastYear } = result;

  const stats = [
    {
      label: "Total Referred Clients",
      value: totalReferred,
      description: "Clients with any referral source",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "In Referral Tree",
      value: totalInTree,
      description: "Referred by a client, company, or person",
      icon: GitBranch,
      color: "bg-violet-500",
    },
    {
      label: "Referred (Last 12 Months)",
      value: referredLastYear,
      description: "New referred clients this year",
      icon: TrendingUp,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Referrals</h1>
        <p className="mt-2 text-muted-foreground">
          Explore the referral tree of clients referred by other clients, companies, and people — plus referral-type mix
          and referral trends over the past year.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border shadow-sm">
              <CardContent className="flex items-center gap-4 py-2">
                <div className={`${stat.color} rounded-xl p-3 text-white shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="font-bold text-2xl tabular-nums">{stat.value.toLocaleString()}</CardTitle>
                  <CardDescription className="font-medium text-foreground text-sm">{stat.label}</CardDescription>
                  <CardDescription className="text-xs">{stat.description}</CardDescription>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Referral tree */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-xl tracking-tight">Referral Tree</h2>
          <p className="text-muted-foreground text-sm">
            Each arrow points from a referrer to the client they referred. Drag nodes to rearrange, scroll to zoom, and
            click a node to open its record.
          </p>
        </div>
        <ReferralTree nodes={treeNodes} links={treeLinks} />
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReferralTypePie data={referralTypePie} />
        <ReferralsOverTime data={timeSeries} />
      </div>
    </div>
  );
}
