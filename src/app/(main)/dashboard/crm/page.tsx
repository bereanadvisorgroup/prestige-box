import Link from "next/link";

import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Home,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { getClients } from "@/actions/clients";
import { getHouseholds } from "@/actions/households";
import { getPaymentsForMonth } from "@/actions/payments";
import { getPeople } from "@/actions/people";
import { getClientPolicies } from "@/actions/policies";
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

  const navCards = [
    { title: "Manage People", href: "/dashboard/crm/people", icon: Users, color: "bg-blue-500" },
    { title: "Addresses", href: "/dashboard/crm/addresses", icon: Home, color: "bg-green-500" },
    { title: "Households", href: "/dashboard/crm/households", icon: Home, color: "bg-purple-500" },
    { title: "Client Portfolios", href: "/dashboard/crm/clients", icon: Briefcase, color: "bg-amber-500" },
    { title: "Policy Manager", href: "/dashboard/crm/policies", icon: FileText, color: "bg-indigo-500" },
    { title: "Payments Dashboard", href: "/dashboard/crm/payments", icon: DollarSign, color: "bg-emerald-500" },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-8 px-4 md:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CRM Intelligence Overview</h1>
        <p className="text-muted-foreground mt-2">Real-time insights across your client base and policy portfolio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Total Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.people}</span>
              <div className="bg-blue-50 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Households
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.households}</span>
              <div className="bg-purple-50 p-2 rounded-lg">
                <Home className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Client Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.clients}</span>
              <div className="bg-amber-50 p-2 rounded-lg">
                <Briefcase className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
              Monthly Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-emerald-700">${stats.monthlyRevenue.toLocaleString()}</span>
              <div className="bg-emerald-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-emerald-600 mt-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Forecast for {new Date().toLocaleString("default", { month: "long" })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Quick Navigation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {navCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href}>
                  <Card className="hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`${card.color} p-3 rounded-xl shadow-sm text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="font-bold">{card.title}</span>
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Policy Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-dashed">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-bold uppercase">Total Policies</span>
                  <span className="text-2xl font-black">{stats.policies}</span>
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
                    className="text-green-600 border-green-200 bg-green-50 font-bold uppercase text-[10px]"
                  >
                    HEALTHY
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[85%]" />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
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
