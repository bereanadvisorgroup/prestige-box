"use client";

import * as React from "react";

import { Flame, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProspectScoringRule } from "@/actions/prospect-scoring-rules";
import { recalculateAllScores } from "@/actions/prospects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProspectScoringRule } from "@/types/prospects";

import { ScoringRuleDialog } from "./scoring-rule-dialog";

interface ScoringRulesSectionProps {
  rules: ProspectScoringRule[];
  onRefresh?: () => void;
}

export function ScoringRulesSection({ rules, onRefresh }: ScoringRulesSectionProps) {
  const [selectedRule, setSelectedRule] = React.useState<ProspectScoringRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isRecalculating, setIsRecalculating] = React.useState(false);

  const handleDelete = async (rule: ProspectScoringRule) => {
    const confirm = window.confirm(`Are you sure you want to delete scoring rule "${rule.name}"?`);
    if (!confirm) return;

    try {
      const res = await deleteProspectScoringRule(rule.id!);
      if (res.success) {
        toast.success("Scoring rule deleted.");
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to delete scoring rule.");
      }
    } catch {
      toast.error("An error occurred while deleting scoring rule.");
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const res = await recalculateAllScores();
      if (res.success) {
        toast.success(`Recalculated scores for all prospects (${res.updatedCount} updated).`);
        onRefresh?.();
      } else {
        toast.error(res.error || "Failed to recalculate scores.");
      }
    } catch {
      toast.error("An error occurred while recalculating scores.");
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground text-lg tracking-tight">Rule-Based Prospect Scoring Engine</h3>
            <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 text-xs">
              <Flame className="h-3.5 w-3.5" />
              <span>Lead Quality Automation</span>
            </Badge>
          </div>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Define point allocations for target demographics, contact details, stage advancements, and inactivity
            triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? "animate-spin" : ""}`} />
            <span>{isRecalculating ? "Recalculating..." : "Recalculate All Scores"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSelectedRule(null);
              setIsDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Rule</span>
          </Button>
        </div>
      </div>

      {/* Scoring Thresholds Banner */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-rose-200/50 bg-rose-50/20 dark:border-rose-950/60 dark:bg-rose-950/10">
          <CardContent className="flex items-center justify-between p-3.5">
            <div>
              <span className="font-semibold text-rose-700 text-xs dark:text-rose-400">Hot Lead Priority</span>
              <p className="text-[11px] text-muted-foreground">Score &ge; 70 points</p>
            </div>
            <Badge className="bg-rose-600 text-white text-xs">Immediate Follow-Up</Badge>
          </CardContent>
        </Card>

        <Card className="border-amber-200/50 bg-amber-50/20 dark:border-amber-950/60 dark:bg-amber-950/10">
          <CardContent className="flex items-center justify-between p-3.5">
            <div>
              <span className="font-semibold text-amber-700 text-xs dark:text-amber-400">Warm Prospect</span>
              <p className="text-[11px] text-muted-foreground">Score 30 &ndash; 69 points</p>
            </div>
            <Badge className="bg-amber-600 text-white text-xs">Active Nurture</Badge>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/20">
          <CardContent className="flex items-center justify-between p-3.5">
            <div>
              <span className="font-semibold text-slate-700 text-xs dark:text-slate-300">Cold / Unqualified</span>
              <p className="text-[11px] text-muted-foreground">Score &lt; 30 points</p>
            </div>
            <Badge variant="outline" className="text-xs">
              Drip Campaign
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <div className="rounded-md border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead>Rule Name</TableHead>
              <TableHead>Condition Type</TableHead>
              <TableHead>Matching Criteria / Value</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length ? (
              rules.map((rule) => (
                <TableRow key={rule.id} className="transition-colors hover:bg-muted/40">
                  <TableCell className="font-semibold text-foreground text-sm">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {rule.conditionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                    {rule.conditionValue || "(Any non-empty)"}
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono text-sm">
                    <span className={rule.points >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {rule.points > 0 ? `+${rule.points}` : rule.points}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        rule.isActive
                          ? "bg-emerald-50 text-[10px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-muted text-[10px] text-muted-foreground"
                      }
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedRule(rule);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(rule)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-xs">
                  No scoring rules defined. Click "New Rule" to add a rule.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ScoringRuleDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} rule={selectedRule} onSuccess={onRefresh} />
    </div>
  );
}
