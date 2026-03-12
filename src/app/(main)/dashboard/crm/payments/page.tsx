import { getPaymentsForMonth } from "@/actions/payments";
import { PaymentsTable } from "./_components/payments-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, DollarSign, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PaymentsPageProps {
  searchParams: {
    month?: string;
    year?: string;
  };
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthParam = searchParams.month ? parseInt(searchParams.month) : currentMonth;
  const yearParam = searchParams.year ? parseInt(searchParams.year) : currentYear;

  const result = await getPaymentsForMonth(monthParam, yearParam);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = monthParam === 0 ? 11 : monthParam - 1;
  const prevYear = monthParam === 0 ? yearParam - 1 : yearParam;
  const nextMonth = monthParam === 11 ? 0 : monthParam + 1;
  const nextYear = monthParam === 11 ? yearParam + 1 : yearParam;

  if (!result.success) {
    return (
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {result.error || "Failed to fetch payments data."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const payments = result.payments || [];
  const totalDue = payments.reduce((acc, p) => acc + p.paymentAmount, 0);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monthly premium tracking and collection forecast.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border shadow-sm">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={`/dashboard/crm/payments?month=${prevMonth}&year=${prevYear}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="px-4 font-bold text-sm min-w-[140px] text-center">
            {monthNames[monthParam]} {yearParam}
          </div>
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href={`/dashboard/crm/payments?month=${nextMonth}&year=${nextYear}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${totalDue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1 font-semibold">
              For {monthNames[monthParam]} {yearParam}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium italic">
              Individual policy payments scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${payments.length > 0 ? (totalDue / payments.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Per scheduled transaction
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/5 flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
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
