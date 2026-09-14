"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import {
  FileSpreadsheet,
  Flame,
  Kanban,
  LayoutGrid,
  Plus,
  RefreshCw,
  Sparkles,
  Table as TableIcon,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { deleteProspect, recalculateAllScores } from "@/actions/prospects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  EnrichedCampaign,
  EnrichedProspect,
  ProspectCustomField,
  ProspectScoringRule,
  ProspectStage,
} from "@/types/prospects";

import { CampaignsSection } from "./campaigns-section";
import { ConvertToClientDialog } from "./convert-to-client-dialog";
import { CsvImporterModal } from "./csv-importer-modal";
import { CustomFieldsSection } from "./custom-fields-section";
import { KanbanBoard } from "./kanban-board";
import { ProspectDialog } from "./prospect-dialog";
import { ProspectsTable } from "./prospects-table";
import { ScoringRulesSection } from "./scoring-rules-section";

interface ProspectsClientProps {
  initialProspects: EnrichedProspect[];
  initialCampaigns: EnrichedCampaign[];
  customFields: ProspectCustomField[];
  scoringRules: ProspectScoringRule[];
  advisors: { uid: string; name: string }[];
}

export function ProspectsClient({
  initialProspects,
  initialCampaigns,
  customFields,
  scoringRules,
  advisors,
}: ProspectsClientProps) {
  const router = useRouter();

  // State
  const [prospects, setProspects] = React.useState<EnrichedProspect[]>(initialProspects);
  const [campaigns, setCampaigns] = React.useState<EnrichedCampaign[]>(initialCampaigns);
  const [viewMode, setViewMode] = React.useState<"kanban" | "table">("kanban");
  const [activeTab, setActiveTab] = React.useState("pipeline");

  // Dialogs state
  const [isProspectDialogOpen, setIsProspectDialogOpen] = React.useState(false);
  const [editingProspect, setEditingProspect] = React.useState<EnrichedProspect | null>(null);
  const [defaultStageForNew, setDefaultStageForNew] = React.useState<ProspectStage>("New");

  const [isConvertDialogOpen, setIsConvertDialogOpen] = React.useState(false);
  const [convertingProspect, setConvertingProspect] = React.useState<EnrichedProspect | null>(null);

  const [isCsvModalOpen, setIsCsvModalOpen] = React.useState(false);
  const [isRecalculating, setIsRecalculating] = React.useState(false);

  React.useEffect(() => {
    setProspects(initialProspects);
  }, [initialProspects]);

  React.useEffect(() => {
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);

  // Refresh data handler
  const handleRefresh = () => {
    router.refresh();
  };

  // KPI Calculations
  const totalProspects = prospects.length;
  const inPipeline = prospects.filter((p) => p.stage !== "Closed Won" && p.stage !== "Closed Lost").length;
  const hotLeads = prospects.filter((p) => (p.score ?? 0) >= 70).length;
  const convertedClients = prospects.filter((p) => !!p.convertedClientId).length;
  const conversionRate = totalProspects > 0 ? ((convertedClients / totalProspects) * 100).toFixed(1) : "0.0";

  // Actions
  const handleCreateProspect = (stage: ProspectStage = "New") => {
    setEditingProspect(null);
    setDefaultStageForNew(stage);
    setIsProspectDialogOpen(true);
  };

  const handleEditProspect = (prospect: EnrichedProspect) => {
    setEditingProspect(prospect);
    setIsProspectDialogOpen(true);
  };

  const handleConvertProspect = (prospect: EnrichedProspect) => {
    setConvertingProspect(prospect);
    setIsConvertDialogOpen(true);
  };

  const handleDeleteProspect = async (prospect: EnrichedProspect) => {
    const fullName = `${prospect.firstName} ${prospect.lastName}`.trim();
    const confirm = window.confirm(`Are you sure you want to delete prospect "${fullName}"?`);
    if (!confirm) return;

    try {
      const res = await deleteProspect(prospect.id!);
      if (res.success) {
        toast.success(`Prospect ${fullName} deleted.`);
        handleRefresh();
      } else {
        toast.error(res.error || "Failed to delete prospect.");
      }
    } catch {
      toast.error("Failed to delete prospect.");
    }
  };

  const handleRecalculateScores = async () => {
    setIsRecalculating(true);
    try {
      const res = await recalculateAllScores();
      if (res.success) {
        toast.success(`Lead scores recalculated (${res.updatedCount} prospects updated).`);
        handleRefresh();
      } else {
        toast.error(res.error || "Failed to recalculate scores.");
      }
    } catch {
      toast.error("Failed to recalculate scores.");
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl text-foreground tracking-tight sm:text-3xl">Prospects & Campaigns</h1>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs">
              CRM Engine
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground text-xs sm:text-sm">
            End-to-end prospect acquisition, multi-touch campaign attribution, and Podio-style flexible lead management.
          </p>
        </div>

        {/* Global action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculateScores}
            disabled={isRecalculating}
            className="h-8 gap-1.5 text-xs"
            title="Recalculate scores for all prospects"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Recalculate Scores</span>
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsCsvModalOpen(true)} className="h-8 gap-1.5 text-xs">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Import CSV</span>
          </Button>

          <Button size="sm" onClick={() => handleCreateProspect("New")} className="h-8 gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            <span>New Prospect</span>
          </Button>
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card className="shadow-xs">
          <CardContent className="flex items-center gap-2.5 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                Total Prospects
              </div>
              <div className="font-bold text-foreground text-lg leading-tight">{totalProspects}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="flex items-center gap-2.5 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                In Active Pipeline
              </div>
              <div className="font-bold text-foreground text-lg leading-tight">{inPipeline}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="flex items-center gap-2.5 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                Hot Leads (&ge;70)
              </div>
              <div className="font-bold text-foreground text-lg leading-tight">{hotLeads}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="flex items-center gap-2.5 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                Clients Converted
              </div>
              <div className="font-bold text-foreground text-lg leading-tight">{convertedClients}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 shadow-xs sm:col-span-1">
          <CardContent className="flex items-center gap-2.5 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                Conversion Rate
              </div>
              <div className="font-bold text-foreground text-lg leading-tight">{conversionRate}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Module Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col gap-3 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="pipeline" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span>Prospects Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Campaigns & Attribution</span>
            </TabsTrigger>
            <TabsTrigger value="custom-fields" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Custom Fields</span>
            </TabsTrigger>
            <TabsTrigger value="scoring-rules" className="gap-1.5 text-xs">
              <Flame className="h-3.5 w-3.5" />
              <span>Scoring Rules</span>
            </TabsTrigger>
          </TabsList>

          {/* Dual Viewing Mode Toggle (Visible only in pipeline tab) */}
          {activeTab === "pipeline" && (
            <div className="flex items-center gap-1 self-start rounded-lg border bg-muted/40 p-1 sm:self-auto">
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1 px-2.5 text-xs"
                onClick={() => setViewMode("kanban")}
              >
                <Kanban className="h-3.5 w-3.5" />
                <span>Kanban</span>
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 gap-1 px-2.5 text-xs"
                onClick={() => setViewMode("table")}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Data Table</span>
              </Button>
            </div>
          )}
        </div>

        {/* TAB 1: PROSPECTS PIPELINE */}
        <TabsContent value="pipeline" className="m-0 space-y-4">
          {viewMode === "kanban" ? (
            <KanbanBoard
              initialProspects={prospects}
              campaigns={campaigns}
              onEdit={handleEditProspect}
              onConvert={handleConvertProspect}
              onAddWithStage={handleCreateProspect}
            />
          ) : (
            <ProspectsTable
              data={prospects}
              campaigns={campaigns}
              onEdit={handleEditProspect}
              onConvert={handleConvertProspect}
              onDelete={handleDeleteProspect}
            />
          )}
        </TabsContent>

        {/* TAB 2: CAMPAIGNS & ATTRIBUTION */}
        <TabsContent value="campaigns" className="m-0">
          <CampaignsSection campaigns={campaigns} customFields={customFields} onRefresh={handleRefresh} />
        </TabsContent>

        {/* TAB 3: PODIO CUSTOM FIELDS */}
        <TabsContent value="custom-fields" className="m-0">
          <CustomFieldsSection customFields={customFields} onRefresh={handleRefresh} />
        </TabsContent>

        {/* TAB 4: SCORING RULES */}
        <TabsContent value="scoring-rules" className="m-0">
          <ScoringRulesSection rules={scoringRules} onRefresh={handleRefresh} />
        </TabsContent>
      </Tabs>

      {/* Prospect Create / Edit Dialog */}
      <ProspectDialog
        open={isProspectDialogOpen}
        onOpenChange={setIsProspectDialogOpen}
        prospect={editingProspect}
        customFields={customFields}
        campaigns={campaigns}
        advisors={advisors}
        defaultStage={defaultStageForNew}
        onSuccess={handleRefresh}
      />

      {/* Convert to Client Dialog */}
      <ConvertToClientDialog
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
        prospect={convertingProspect}
        advisors={advisors}
        onSuccess={handleRefresh}
      />

      {/* CSV Importer Wizard Modal */}
      <CsvImporterModal
        open={isCsvModalOpen}
        onOpenChange={setIsCsvModalOpen}
        customFields={customFields}
        campaigns={campaigns}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
