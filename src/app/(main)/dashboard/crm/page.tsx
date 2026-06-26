import Link from "next/link";

import { Briefcase, Calendar, FileText, Home, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getHouseholds } from "@/actions/households";
import { getPaymentsForMonth } from "@/actions/payments";
import { getPeople } from "@/actions/people";
import { getClientPolicies } from "@/actions/policies";
import { DashboardTasksCard } from "@/components/tasks/dashboard-tasks-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CRMOverviewPage() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const [peopleResult, householdsResult, clientsResult, policiesResult, paymentsResult] = await Promise.all([
    getPeople(),
    getHouseholds(),
    getClients(),
    getClientPolicies(),
    getPaymentsForMonth(currentMonth, currentYear),
  ]);

  const stats = {
    people: peopleResult.success ? peopleResult.people?.length || 0 : 0,
    households: householdsResult.success ? householdsResult.households?.length || 0 : 0,
    clients: clientsResult.success ? clientsResult.clients?.length || 0 : 0,
    policies: policiesResult.success ? policiesResult.policies?.length || 0 : 0,
    monthlyRevenue: paymentsResult.success
      ? (paymentsResult.payments || []).reduce((acc, p) => acc + p.paymentAmount, 0)
      : 0,
    totalPolicies: policiesResult.success ? policiesResult.policies?.length || 0 : 0,
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
              Total Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-bold text-3xl">{stats.people}</span>
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
              Households
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-bold text-3xl">{stats.households}</span>
              <div className="rounded-lg bg-purple-50 p-2">
                <Home className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
              Client Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-bold text-3xl">{stats.clients}</span>
              <div className="rounded-lg bg-amber-50 p-2">
                <Briefcase className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/10">
          <CardHeader className="pb-2">
            <CardTitle className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
              Monthly Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-bold text-3xl text-emerald-700">${stats.monthlyRevenue.toLocaleString()}</span>
              <div className="rounded-lg bg-emerald-100 p-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1 font-medium text-[10px] text-emerald-600">
              <Calendar className="h-3 w-3" />
              Forecast for {new Date().toLocaleString("default", { month: "long" })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <h2 className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Quick Navigation
          </h2>
          <DashboardTasksCard />
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-bold text-lg">Policy Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border border-dashed bg-muted/20 p-4">
                <div className="flex flex-col">
                  <span className="font-bold text-muted-foreground text-xs uppercase">Total Policies</span>
                  <span className="font-black text-2xl">{stats.policies}</span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Active Coverage</span>
                  <Badge
                    variant="outline"
                    className="border-green-200 bg-green-50 font-bold text-[10px] text-green-600 uppercase"
                  >
                    HEALTHY
                  </Badge>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[85%] bg-emerald-500" />
                </div>
                <div className="flex justify-between font-medium text-[10px] text-muted-foreground uppercase tracking-tight">
                  <span>85% Utilized</span>
                  <span>15% Gaps</span>
                </div>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full font-bold text-xs" asChild>
                  <Link href="/dashboard/crm/policies">View All Policies</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
