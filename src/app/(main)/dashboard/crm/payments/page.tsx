import Link from "next/link";

import { AlertCircle, ArrowLeft, ArrowRight, DollarSign } from "lucide-react";

import { getPaymentsForMonth } from "@/actions/payments";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PaymentsTable } from "./_components/payments-table";

interface PaymentsPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
  }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const resolvedSearchParams = await searchParams;
  const monthParam = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month, 10) : currentMonth;
  const yearParam = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year, 10) : currentYear;

  const result = await getPaymentsForMonth(monthParam, yearParam);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const prevMonth = monthParam === 0 ? 11 : monthParam - 1;
  const prevYear = monthParam === 0 ? yearParam - 1 : yearParam;
  const nextMonth = monthParam === 11 ? 0 : monthParam + 1;
  const nextYear = monthParam === 11 ? yearParam + 1 : yearParam;

  if (!result.success) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.error || "Failed to fetch payments data."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const payments = result.payments || [];
  const totalDue = payments.reduce((acc, p) => acc + p.paymentAmount, 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Payments Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Monthly premium tracking and collection forecast.</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-1 shadow-sm">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={`/dashboard/crm/payments?month=${prevMonth}&year=${prevYear}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-[140px] px-4 text-center font-bold text-sm">
            {monthNames[monthParam]} {yearParam}
          </div>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={`/dashboard/crm/payments?month=${nextMonth}&year=${nextYear}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Total Expected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-3xl text-primary">${totalDue.toLocaleString()}</div>
            <p className="mt-1 font-semibold text-muted-foreground text-xs">
              For {monthNames[monthParam]} {yearParam}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-3xl">{payments.length}</div>
            <p className="mt-1 font-medium text-muted-foreground text-xs italic">
              Individual policy payments scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Avg. Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-3xl">
              $
              {payments.length > 0
                ? (totalDue / payments.length).toLocaleString(undefined, { maximumFractionDigits: 0 })
                : 0}
            </div>
            <p className="mt-1 font-medium text-muted-foreground text-xs">Per scheduled transaction</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-muted/5 p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <DollarSign className="h-4 w-4 text-primary" />
            Payment Schedule
          </h2>
          <Badge variant="outline" className="font-mono text-[10px]">
            {payments.length} RECORDS
          </Badge>
        </div>
        <PaymentsTable data={payments} />
      </div>
    </div>
  );
}
