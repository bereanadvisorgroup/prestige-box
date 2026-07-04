import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, Calendar, Edit, ShieldCheck } from "lucide-react";

import { getCustodian } from "@/actions/custodians";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CustodianDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustodianDetailsPage({ params }: CustodianDetailsPageProps) {
  const { id } = await params;
  const result = await getCustodian(id);

  if (!result.success || !result.custodian) {
    notFound();
  }

  const { custodian } = result;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">{custodian.name}</h1>
            <p className="text-muted-foreground text-sm">Custodian Details</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="font-semibold shadow-sm">
            <Link href="/dashboard/admin/custodians">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Link>
          </Button>
          <Button asChild className="font-semibold shadow-sm">
            <Link href={`/dashboard/admin/custodians/${custodian.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Custodian
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="h-fit border shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="font-bold text-lg">Metadata & Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 py-2">
              <span className="font-medium text-muted-foreground text-sm">Record ID</span>
              <span className="col-span-2 break-all font-mono text-foreground text-sm">{custodian.id}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="font-medium text-muted-foreground text-sm">Name</span>
              <span className="col-span-2 font-semibold text-foreground text-sm">{custodian.name}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                Created At
              </span>
              <span className="col-span-2 text-foreground text-sm">
                {custodian.createdAt ? new Date(custodian.createdAt).toLocaleString() : "-"}
              </span>
            </div>
            <Separator />
            <div className="grid grid-cols-3 py-2">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                Last Updated
              </span>
              <span className="col-span-2 text-foreground text-sm">
                {custodian.updatedAt ? new Date(custodian.updatedAt).toLocaleString() : "-"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
