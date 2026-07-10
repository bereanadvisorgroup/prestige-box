import Link from "next/link";

import { AlertCircle, ArrowUpRight, Calendar, Clock, Database, ShieldCheck, Tag, Users } from "lucide-react";

import { getBusinessContact } from "@/actions/settings";
import { getUsers } from "@/actions/users";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PortalSettingsCard } from "./_components/portal-settings-card";

export default async function AdminDashboardPage() {
  const [usersResult, contactResult] = await Promise.all([getUsers(), getBusinessContact()]);

  if (!usersResult.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Admin Panel</h1>
          <p className="mt-2 text-muted-foreground">Error loading admin dashboard.</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {usersResult.error || "Failed to fetch users from the server. Check server logs for details."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const users = usersResult.users || [];
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const advisorCount = users.filter((u) => u.role === "advisor").length;
  const clientCount = users.filter((u) => u.role === "client").length;

  const initialEmail = contactResult.success ? contactResult.email : "info@prestigeadvisors360.com";
  const initialPhone = contactResult.success ? contactResult.phone : "941-799-3300";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Admin Panel</h1>
        <p className="mt-2 text-muted-foreground">
          Centralized controls for system settings, user roles, and security policies.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/admin/users" className="group block h-full">
          <Card className="h-full border transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="space-y-1.5 pr-4">
                <CardTitle className="flex items-center gap-1.5 font-bold text-xl transition-colors group-hover:text-primary">
                  Manage Users
                  <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </CardTitle>
              </div>
              <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Users className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="mb-5 flex items-baseline justify-between border-muted/40 border-t pt-4">
                <div>
                  <span className="font-extrabold text-4xl tracking-tight">{totalUsers}</span>
                  <span className="ml-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Total Users
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500/80 ring-2 ring-blue-500/20" />
                    Admins
                  </span>
                  <span className="font-semibold text-foreground">{adminCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500/80 ring-2 ring-purple-500/20" />
                    Advisors
                  </span>
                  <span className="font-semibold text-foreground">{advisorCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 ring-2 ring-amber-500/20" />
                    Clients
                  </span>
                  <span className="font-semibold text-foreground">{clientCount}</span>
                </div>
              </div>

              <div className="mt-5 flex h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${totalUsers ? (adminCount / totalUsers) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${totalUsers ? (advisorCount / totalUsers) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${totalUsers ? (clientCount / totalUsers) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </Link>

        <PortalSettingsCard initialEmail={initialEmail} initialPhone={initialPhone} />

        <Link href="/dashboard/admin/financial-account-types" className="group block h-full">
          <Card className="h-full border transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="space-y-1.5 pr-4">
                <CardTitle className="flex items-center gap-1.5 font-bold text-xl transition-colors group-hover:text-primary">
                  Account Types
                  <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </CardTitle>
              </div>
              <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Database className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground">
                Manage lookup values for financial account types used across client and policy forms.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/custodians" className="group block h-full">
          <Card className="h-full border transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="space-y-1.5 pr-4">
                <CardTitle className="flex items-center gap-1.5 font-bold text-xl transition-colors group-hover:text-primary">
                  Custodians
                  <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </CardTitle>
              </div>
              <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground">
                Manage custodian options used across financial and investment accounts.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/referral-types" className="group block h-full">
          <Card className="h-full border transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="space-y-1.5 pr-4">
                <CardTitle className="flex items-center gap-1.5 font-bold text-xl transition-colors group-hover:text-primary">
                  Referral Types
                  <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </CardTitle>
              </div>
              <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Tag className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground">
                Manage referral types list used as select options on other forms.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/events" className="group block h-full">
          <Card className="h-full border transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="space-y-1.5 pr-4">
                <CardTitle className="flex items-center gap-1.5 font-bold text-xl transition-colors group-hover:text-primary">
                  Events
                  <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </CardTitle>
              </div>
              <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Calendar className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground">
                Manage lookup events list used as select options on client referrals and other forms.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/workflows" className="group block h-full">
          <Card className="h-full border transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="space-y-1.5 pr-4">
                <CardTitle className="flex items-center gap-1.5 font-bold text-xl transition-colors group-hover:text-primary">
                  Workflows
                  <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                </CardTitle>
              </div>
              <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <Clock className="h-6 w-6" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-muted-foreground">
                Create, edit, and manage automated workflows.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
