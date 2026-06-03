import Link from "next/link";
import { notFound } from "next/navigation";

import { AlertCircle, ArrowLeft, Calendar, FileText, User } from "lucide-react";

import { getClient } from "@/actions/clients";
import { getClientPolicy } from "@/actions/policies";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDb } from "@/lib/firebase.server";
import { formatPhoneNumber } from "@/lib/utils";
import type { PaymentSchedule } from "@/types/crm";

// Helper function to calculate payment schedule dates and amounts
function generatePayments(
  effectiveDateStr: string,
  renewalDateStr: string,
  schedule: PaymentSchedule,
  premiumAmount: number,
) {
  const effectiveDate = new Date(effectiveDateStr);
  const renewalDate = new Date(renewalDateStr);
  const payments = [];

  let intervalMonths = 12;
  let paymentAmount = premiumAmount;

  switch (schedule) {
    case "monthly":
      intervalMonths = 1;
      paymentAmount = premiumAmount / 12;
      break;
    case "quarterly":
      intervalMonths = 3;
      paymentAmount = premiumAmount / 4;
      break;
    case "semi-annually":
      intervalMonths = 6;
      paymentAmount = premiumAmount / 2;
      break;
    case "annually":
      intervalMonths = 12;
      paymentAmount = premiumAmount;
      break;
  }

  const currentDate = new Date(effectiveDate);
  // Ensure we don't end up in an infinite loop due to bad data
  let safetyCounter = 0;

  // Generate payments while strictly before the renewal date
  while (currentDate < renewalDate && safetyCounter < 600) {
    payments.push({
      date: currentDate.toISOString().split("T")[0],
      amount: Math.round(paymentAmount * 100) / 100,
      status: "Scheduled",
    });

    // Move to next payment date
    currentDate.setMonth(currentDate.getMonth() + intervalMonths);
    safetyCounter++;
  }

  return payments;
}

export default async function PolicyLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch the policy
  const policyResult = await getClientPolicy(id);

  if (!policyResult.success || !policyResult.policy) {
    if (policyResult.error === "Policy not found") {
      notFound();
    }
    return (
      <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Policy</AlertTitle>
          <AlertDescription>{policyResult.error || "Failed to load the policy details."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const policy = policyResult.policy;

  // Fetch the client to get the person details
  const clientResult = await getClient(policy.clientId);
  const clientData = clientResult.success ? clientResult.client : null;
  const personData = clientResult.success ? (clientResult.person as import("@/types/crm").Person) : null;

  // Fetch the carrier info
  let carrierName = "Unknown Carrier";
  if (adminDb && policy.insuranceCompanyId) {
    try {
      const carrierDoc = await adminDb.collection("insurance-companies").doc(policy.insuranceCompanyId).get();
      if (carrierDoc.exists) {
        carrierName = carrierDoc.data()?.name || "Unknown Carrier";
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Find payment account name if present
  let paymentAccountName = "No Account Selected";
  if (clientData && policy.paymentAccountId) {
    const acc = clientData.paymentAccounts.find((a: any) => a.id === policy.paymentAccountId);
    if (acc) {
      paymentAccountName = acc.name;
    }
  }

  const payments = generatePayments(
    policy.effectiveDate,
    policy.renewalDate,
    policy.paymentSchedule,
    policy.premiumAmount,
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 px-4 md:px-6 fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/crm/policies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{policy.policyName}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Badge variant="outline" className="font-normal text-xs uppercase tracking-wider">
              {policy.paymentSchedule}
            </Badge>
            Policy #{policy.policyNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Cards */}
        <div className="lg:col-span-1 space-y-8">
          {/* Client Info Card */}
          <Card className="shadow-sm border-border/50 hover:border-border/80 transition-colors">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Client Details
              </CardTitle>
              <CardDescription>Primary policyholder information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {personData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                    <p className="font-medium text-foreground">
                      {personData.firstName} {personData.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <a
                      href={`mailto:${personData.emails?.find((e) => e.isPrimary)?.address || personData.emails?.[0]?.address}`}
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      {personData.emails?.find((e) => e.isPrimary)?.address || personData.emails?.[0]?.address || "N/A"}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                    <a
                      href={`tel:${personData.phones?.find((p) => p.isPrimary)?.number || personData.phones?.[0]?.number}`}
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      {formatPhoneNumber(
                        personData.phones?.find((p) => p.isPrimary)?.number || personData.phones?.[0]?.number,
                      ) || "N/A"}
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Client details unavailable.</p>
              )}
            </CardContent>
          </Card>

          {/* Policy Info Card */}
          <Card className="shadow-sm border-border/50 hover:border-border/80 transition-colors">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Policy Details
              </CardTitle>
              <CardDescription>Coverage and premium information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Carrier</p>
                    <p className="font-medium text-foreground truncate" title={carrierName}>
                      {carrierName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Plan</p>
                    <p className="font-medium text-foreground truncate" title={policy.policyName}>
                      {policy.policyName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Effective Date</p>
                    <p className="font-medium text-foreground">{new Date(policy.effectiveDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Renewal Date</p>
                    <p className="font-medium text-foreground">{new Date(policy.renewalDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="h-px w-full bg-border" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Premium</p>
                    <p className="font-bold text-lg text-foreground">
                      ${policy.premiumAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Payment Method</p>
                    <p className="font-medium text-foreground truncate" title={paymentAccountName}>
                      {paymentAccountName}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Payments Table */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-sm border-border/50 col-span-1 h-full flex flex-col">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Estimated Payment Schedule
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Scheduled premiums between effective and renewal dates ({policy.paymentSchedule}).
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="font-medium text-sm px-3 py-1">
                  {payments.length} Payments remaining
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-md z-10">
                    <TableRow className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <TableHead className="w-[80px] text-center font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Date Due</TableHead>
                      <TableHead className="text-right font-semibold">Amount</TableHead>
                      <TableHead className="text-right font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length > 0 ? (
                      payments.map((payment, index) => (
                        <TableRow key={index} className="hover:bg-muted/30 transition-colors group">
                          <TableCell className="font-medium text-muted-foreground text-center">{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {new Date(payment.date).toLocaleDateString(undefined, {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-foreground">
                            $
                            {payment.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className="text-muted-foreground group-hover:border-primary/50 transition-colors"
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No anticipated payments found for this term.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
