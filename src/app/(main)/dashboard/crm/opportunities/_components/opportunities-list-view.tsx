"use client";

import * as React from "react";

import { differenceInCalendarDays, startOfDay } from "date-fns";
import { AlertCircle, Calendar, DollarSign, Edit, Percent, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteOpportunity } from "@/actions/opportunities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { OpportunityDialog } from "./opportunity-dialog";
import { PipelineSummarySection } from "./pipeline-summary-section";

interface OpportunitiesListViewProps {
  opportunities: any[];
  pipelines: any[];
  clients: any[];
  companies: any[];
  clientId?: string;
  companyId?: string;
  targetDateHistory?: any[];
}

export function OpportunitiesListView({
  opportunities,
  pipelines,
  clients,
  companies,
  clientId,
  companyId,
  targetDateHistory = [],
}: OpportunitiesListViewProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedOpp, setSelectedOpp] = React.useState<any | null>(null);

  // Filter opportunities to find active ones for sum calculations
  const activeOpps = React.useMemo(() => {
    return opportunities.filter((o) => !o.resultStatus);
  }, [opportunities]);

  // Calculations
  const totalActiveAmount = React.useMemo(() => {
    return activeOpps.reduce((sum, o) => sum + Number.parseFloat(o.amount || "0"), 0);
  }, [activeOpps]);

  const totalProbWinAmount = React.useMemo(() => {
    return activeOpps.reduce((sum, o) => sum + Number.parseFloat(o.amount || "0") * ((o.probabilityWin || 0) / 100), 0);
  }, [activeOpps]);

  const formattedTotalActive = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalActiveAmount);

  const formattedTotalProb = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalProbWinAmount);

  function handleAdd() {
    setSelectedOpp(null);
    setDialogOpen(true);
  }

  function handleEdit(opp: any) {
    setSelectedOpp(opp);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    try {
      const result = await deleteOpportunity(id);
      if (result.success) {
        toast.success("Opportunity deleted successfully");
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to delete opportunity");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    }
  }

  const handleSaved = () => {
    toast.success("Saved successfully");
    window.location.reload();
  };

  const getTargetCloseDateBadge = (targetCloseDate?: string | Date | null, isClosed?: boolean) => {
    if (!targetCloseDate) return <span className="text-muted-foreground">-</span>;
    const formatted = new Date(targetCloseDate).toLocaleDateString();
    if (isClosed) return <span className="text-muted-foreground">{formatted}</span>;

    const today = startOfDay(new Date());
    const targetDate = startOfDay(new Date(targetCloseDate));
    const diffDays = differenceInCalendarDays(targetDate, today);

    if (diffDays <= 0) {
      return (
        <Badge
          variant="outline"
          className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-semibold"
        >
          {formatted}
        </Badge>
      );
    }
    if (diffDays <= 7) {
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold"
        >
          {formatted}
        </Badge>
      );
    }
    return <span className="text-muted-foreground">{formatted}</span>;
  };

  const getResultStatusBadge = (status?: string | null) => {
    if (!status) {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          Active
        </Badge>
      );
    }
    switch (status) {
      case "WON":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300"
          >
            WON
          </Badge>
        );
      case "LOST":
        return <Badge variant="destructive">LOST</Badge>;
      case "TRASH":
        return (
          <Badge variant="secondary" className="bg-amber-600 text-white">
            TRASH
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Opportunities</h2>
        <Button onClick={handleAdd} size="sm" className="font-semibold shadow-sm gap-1.5">
          <Plus className="h-4 w-4" /> Add Opportunity
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <Card className="border border-dashed p-10 flex flex-col items-center justify-center gap-3">
          <AlertCircle className="h-10 w-10 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground text-center">
            No opportunities found for this entity. Click "Add Opportunity" to create one.
          </p>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">PWin</TableHead>
                <TableHead>Target Close</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opp) => {
                const updatedByStr = opp.updatedBy
                  ? `${opp.updatedBy.firstName || ""} ${opp.updatedBy.lastName || ""}`.trim()
                  : "System";

                const formattedAmt = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(Number.parseFloat(opp.amount || "0"));

                let rowBgClass = "";
                if (opp.targetCloseDate && !opp.resultStatus) {
                  const today = startOfDay(new Date());
                  const targetDate = startOfDay(new Date(opp.targetCloseDate));
                  const diffDays = differenceInCalendarDays(targetDate, today);

                  if (diffDays <= 0) {
                    rowBgClass = "bg-rose-50/80 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-950/50";
                  } else if (diffDays <= 7) {
                    rowBgClass = "bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-950/50";
                  }
                }

                return (
                  <TableRow key={opp.id} className={rowBgClass}>
                    <TableCell className="font-semibold">{opp.pipeline?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {opp.stage?.name || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formattedAmt}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium text-muted-foreground">{opp.probabilityWin}%</span>
                    </TableCell>
                    <TableCell>{getTargetCloseDateBadge(opp.targetCloseDate, !!opp.resultStatus)}</TableCell>
                    <TableCell>{getResultStatusBadge(opp.resultStatus)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{updatedByStr}</div>
                      <div>{opp.updatedAt ? new Date(opp.updatedAt).toLocaleDateString() : ""}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(opp)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                          onClick={() => handleDelete(opp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary Pipeline Section & Target Date Analytics */}
      <PipelineSummarySection
        opportunities={opportunities}
        pipelines={pipelines}
        targetDateHistory={targetDateHistory}
      />

      <OpportunityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        opportunity={selectedOpp}
        pipelines={pipelines}
        clients={clients}
        companies={companies}
        defaultClientId={clientId}
        defaultCompanyId={companyId}
        onSaved={handleSaved}
      />
    </div>
  );
}
