import Link from "next/link";

import { Briefcase, Calendar, FileText, Home, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { getClients } from "@/actions/clients";
import { getHouseholds } from "@/actions/households";
import { getPaymentsForMonth } from "@/actions/payments";
import { getPeople } from "@/actions/people";
import { getClientPolicies } from "@/actions/policies";
import { RecentNotesCard } from "@/components/notes/recent-notes-card";
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

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <RecentNotesCard />
        </div>
        <div className="space-y-6">
          <DashboardTasksCard />
        </div>
      </div>
    </div>
  );
}
