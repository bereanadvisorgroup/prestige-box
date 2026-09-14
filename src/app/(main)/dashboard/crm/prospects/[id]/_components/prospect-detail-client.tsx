"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  History,
  Mail,
  Pencil,
  PhoneCall,
  Plus,
  Share2,
  Sparkles,
  StickyNote,
  Target,
  Trash2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { addCampaignTouch, deleteCampaignTouch } from "@/actions/campaigns";
import { deleteProspect, updateProspect } from "@/actions/prospects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { formatPhoneNumber } from "@/lib/utils";
import type {
  Campaign,
  EnrichedProspect,
  ProspectCampaignAttribution,
  ProspectCustomField,
  ProspectStage,
  TouchType,
} from "@/types/prospects";

import { getScoreBadge } from "../../_components/columns";
import { ConvertToClientDialog } from "../../_components/convert-to-client-dialog";
import { ProspectDialog } from "../../_components/prospect-dialog";
import { QuickCallDialog } from "../../_components/quick-call-dialog";
import { QuickEmailDialog } from "../../_components/quick-email-dialog";

export interface EnrichedAttribution extends ProspectCampaignAttribution {
  campaigns?: { name: string; channel?: string | null } | null;
}

interface NoteItem {
  id: string;
  title?: string | null;
  content: string;
  createdAt: string;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  createdAt: string;
}

interface HistoryItem {
  id: string;
  action: string;
  fieldName?: string | null;
  fieldLabel?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
}

interface ProspectDetailClientProps {
  prospect: EnrichedProspect;
  primaryCampaign: Campaign | null;
  assignedRep: { uid: string; firstName: string; lastName: string; email: string } | null;
  convertedClient: { id: string; personId: string } | null;
  attributions: EnrichedAttribution[];
  notes: NoteItem[];
  tasks: TaskItem[];
  history: HistoryItem[];
  customFields: ProspectCustomField[];
  campaigns: Campaign[];
  advisors: { uid: string; name: string }[];
}

export function ProspectDetailClient({
  prospect: initialProspect,
  primaryCampaign,
  assignedRep,
  convertedClient,
  attributions: initialAttributions,
  notes,
  tasks,
  history,
  customFields,
  campaigns,
  advisors,
}: ProspectDetailClientProps) {
  const router = useRouter();
  const [prospect, setProspect] = React.useState<EnrichedProspect>(initialProspect);
  const [attributions, _setAttributions] = React.useState<EnrichedAttribution[]>(initialAttributions);

  // Modal dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = React.useState(false);
  const [isCallDialogOpen, setIsCallDialogOpen] = React.useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);

  // New attribution touch state
  const [newTouchCampaignId, setNewTouchCampaignId] = React.useState("");
  const [newTouchType, setNewTouchType] = React.useState<TouchType>("Mid Touch");
  const [newTouchNotes, setNewTouchNotes] = React.useState("");
  const [isAddingTouch, setIsAddingTouch] = React.useState(false);

  const fullName =
    [prospect.prefix, prospect.firstName, prospect.middleName, prospect.lastName, prospect.suffix]
      .filter(Boolean)
      .join(" ") || "Prospect";
  const isConverted = !!prospect.convertedClientId || !!convertedClient;
  const convertedClientId = prospect.convertedClientId || convertedClient?.id;

  const handleStageChange = async (newStage: ProspectStage) => {
    if (newStage === prospect.stage) return;
    const oldStage = prospect.stage;
    setProspect({ ...prospect, stage: newStage });

    try {
      const res = await updateProspect(prospect.id!, { stage: newStage });
      if (res.success) {
        toast.success(`Updated stage to "${newStage}"`);
        router.refresh();
      } else {
        setProspect({ ...prospect, stage: oldStage });
        toast.error(res.error || "Failed to update stage");
      }
    } catch {
      setProspect({ ...prospect, stage: oldStage });
      toast.error("Failed to update stage");
    }
  };

  const handleDelete = async () => {
    if (isConverted) {
      toast.error("Cannot delete a prospect that has been converted to an active client.");
      return;
    }

    const confirm = window.confirm(`Are you sure you want to delete prospect "${fullName}"?`);
    if (!confirm) return;

    try {
      const res = await deleteProspect(prospect.id!);
      if (res.success) {
        toast.success("Prospect deleted.");
        router.push("/dashboard/crm/prospects");
      } else {
        toast.error(res.error || "Failed to delete prospect.");
      }
    } catch {
      toast.error("Failed to delete prospect.");
    }
  };

  const handleAddAttribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTouchCampaignId) {
      toast.error("Please select a campaign for this touchpoint.");
      return;
    }

    setIsAddingTouch(true);
    try {
      const res = await addCampaignTouch({
        prospectId: prospect.id!,
        campaignId: newTouchCampaignId,
        touchType: newTouchType,
        notes: newTouchNotes.trim() || null,
        touchDate: new Date().toISOString(),
      });

      if (res.success) {
        toast.success("Campaign touch logged.");
        setNewTouchCampaignId("");
        setNewTouchNotes("");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to log touch.");
      }
    } catch {
      toast.error("Failed to log touch.");
    } finally {
      setIsAddingTouch(false);
    }
  };

  const handleDeleteAttribution = async (touchId: string) => {
    try {
      const res = await deleteCampaignTouch(touchId);
      if (res.success) {
        toast.success("Touchpoint removed.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to remove touchpoint.");
      }
    } catch {
      toast.error("Failed to remove touchpoint.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="gap-1 px-0 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/crm/prospects">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Prospects</span>
          </Link>
        </Button>

        {isConverted && (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            <span>Active Client Profile</span>
          </Badge>
        )}
      </div>

      {/* Main Header Banner */}
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-base text-primary">
              {prospect.firstName[0] || ""}
              {prospect.lastName[0] || ""}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-bold text-foreground text-xl sm:text-2xl">{fullName}</h1>
                {getScoreBadge(prospect.score ?? 0, prospect.scoreTemperature)}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
                {prospect.jobTitle && <span>{prospect.jobTitle}</span>}
                {prospect.jobTitle && prospect.company && <span>&bull;</span>}
                {prospect.company && <span className="font-medium text-foreground/80">{prospect.company}</span>}
                <span>&bull;</span>
                <span>Created {new Date(prospect.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Key Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stage Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-muted-foreground text-xs">Stage:</span>
              <Select value={prospect.stage} onValueChange={(val) => handleStageChange(val as ProspectStage)}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
                  <SelectItem value="Closed Won">Closed Won</SelectItem>
                  <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact quick actions */}
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => setIsCallDialogOpen(true)}>
              <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
              <span>Log Call</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setIsEmailDialogOpen(true)}
            >
              <Mail className="h-3.5 w-3.5 text-purple-600" />
              <span>Send Email</span>
            </Button>

            {/* Convert to Client Button */}
            {!isConverted ? (
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-emerald-600 font-semibold text-white text-xs hover:bg-emerald-700"
                onClick={() => setIsConvertDialogOpen(true)}
              >
                <UserCheck className="h-4 w-4" />
                <span>Convert to Client</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 gap-1.5 border-emerald-300 text-emerald-700 text-xs hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
              >
                <Link href={`/dashboard/crm/clients/${convertedClientId}`}>
                  <span>View Client Profile</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}

            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditDialogOpen(true)}
              title="Edit Prospect"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={isConverted}
              title={isConverted ? "Cannot delete a converted prospect" : "Delete Prospect"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Header Badges & Quick Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stage Selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-muted-foreground text-xs">Stage:</span>
            <Select value={prospect.stage} onValueChange={handleStageChange}>
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
                <SelectItem value="Closed Won">Closed Won</SelectItem>
                <SelectItem value="Closed Lost">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-muted-foreground text-xs">Score:</span>
            {getScoreBadge(prospect.score, prospect.scoreTemperature)}
          </div>

          {/* Primary Campaign Attribution */}
          {primaryCampaign && (
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-xs">
              <Target className="h-3 w-3" />
              <span>{primaryCampaign.name}</span>
            </Badge>
          )}

          {/* Converted Indicator */}
          {isConverted && (
            <Badge className="bg-emerald-600 text-[11px] text-white">
              <UserCheck className="mr-1 h-3 w-3" />
              Converted Client
            </Badge>
          )}
        </div>
      </div>

      {/* Main Grid: Left side metadata, Right side tabbed timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: Prospect Details & Custom Fields */}
        <div className="space-y-6 lg:col-span-1">
          {/* Standard Fields Card */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="font-semibold text-sm">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0 text-xs">
              {prospect.goesBy && (
                <div className="flex items-center justify-between border-b py-1">
                  <span className="text-muted-foreground">Goes By</span>
                  <span className="font-medium text-foreground">&ldquo;{prospect.goesBy}&rdquo;</span>
                </div>
              )}
              <div className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{prospect.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium text-foreground">{formatPhoneNumber(prospect.phone) || "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium text-foreground">{prospect.company || "—"}</span>
              </div>
              <div className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">Job Title</span>
                <span className="font-medium text-foreground">
                  {prospect.jobTitle || <span className="text-muted-foreground/50 italic">None</span>}
                </span>
              </div>
              <div className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">Lead Source</span>
                <Badge variant="secondary" className="text-[10px]">
                  {prospect.source || "Direct"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Assigned Rep</span>
                <span className="font-medium text-foreground">
                  {assignedRep
                    ? `${assignedRep.firstName} ${assignedRep.lastName}`
                    : prospect.assignedRepName || <span className="text-muted-foreground/50 italic">Unassigned</span>}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Podio Dynamic Custom Fields Card */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-1.5 font-semibold text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Custom Attributes (Podio)</span>
              </CardTitle>
              <CardDescription className="text-xs">Dynamic user-defined fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4 pt-2 text-xs">
              {customFields.length > 0 ? (
                customFields.map((cf) => {
                  const val = prospect.customFields?.[cf.name];
                  return (
                    <div key={cf.id} className="flex items-center justify-between border-b py-1 last:border-b-0">
                      <span className="text-muted-foreground">{cf.label}</span>
                      <span className="font-medium text-foreground">
                        {val !== undefined && val !== null && String(val) !== "" ? (
                          String(val)
                        ) : (
                          <span className="text-muted-foreground/40 italic">—</span>
                        )}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-3 text-center text-muted-foreground text-xs">No custom fields configured.</div>
              )}
            </CardContent>
          </Card>

          {/* Acquisition & UTM Attribution Card */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-1.5 font-semibold text-sm">
                <Target className="h-4 w-4 text-primary" />
                <span>Campaign & Digital Attribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4 pt-2 text-xs">
              <div className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">Primary Campaign</span>
                <span className="font-medium text-foreground">
                  {primaryCampaign ? (
                    primaryCampaign.name
                  ) : (
                    <span className="text-muted-foreground/40 italic">Direct / None</span>
                  )}
                </span>
              </div>
              {primaryCampaign && (
                <div className="flex items-center justify-between border-b py-1">
                  <span className="text-muted-foreground">Campaign Channel</span>
                  <Badge variant="outline" className="text-[10px]">
                    {primaryCampaign.channel}
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">UTM Source</span>
                <span className="font-mono text-xs">
                  {prospect.utmSource || <span className="text-muted-foreground/40 italic">—</span>}
                </span>
              </div>
              <div className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">UTM Medium</span>
                <span className="font-mono text-xs">
                  {prospect.utmMedium || <span className="text-muted-foreground/40 italic">—</span>}
                </span>
              </div>
              <div className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">UTM Campaign</span>
                <span className="font-mono text-xs">
                  {prospect.utmCampaign || <span className="text-muted-foreground/40 italic">—</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">UTM Term / Content</span>
                <span className="font-mono text-xs">
                  {prospect.utmTerm || prospect.utmContent || (
                    <span className="text-muted-foreground/40 italic">—</span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Activity Timeline & Multi-Touch Attribution */}
        <div className="space-y-6 lg:col-span-2">
          {/* Multi-Touch Campaign Attribution Feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <div>
                <CardTitle className="flex items-center gap-1.5 font-semibold text-sm">
                  <Share2 className="h-4 w-4 text-primary" />
                  <span>Multi-Touch Campaign Attribution</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Historical touchpoint log documenting marketing influence on this prospect
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-2">
              {/* Attribution list */}
              <div className="space-y-2">
                {attributions.length ? (
                  attributions.map((touch) => (
                    <div
                      key={touch.id}
                      className="flex items-start justify-between rounded-lg border bg-muted/20 p-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-semibold text-[10px]">
                            {touch.touchType}
                          </Badge>
                          <span className="font-semibold text-foreground">
                            {touch.campaigns?.name ||
                              campaigns.find((c) => c.id === touch.campaignId)?.name ||
                              "Campaign Touchpoint"}
                          </span>
                          {(touch.campaigns?.channel || campaigns.find((c) => c.id === touch.campaignId)?.channel) && (
                            <Badge variant="secondary" className="text-[10px]">
                              {touch.campaigns?.channel || campaigns.find((c) => c.id === touch.campaignId)?.channel}
                            </Badge>
                          )}
                        </div>
                        {touch.notes && <p className="text-[11px] text-muted-foreground">{touch.notes}</p>}
                        <span className="block text-[10px] text-muted-foreground/60">
                          {new Date(touch.touchDate || touch.createdAt || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => touch.id && handleDeleteAttribution(touch.id)}
                        title="Remove touch"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-muted-foreground text-xs">
                    No multi-touch points logged yet.
                  </div>
                )}
              </div>

              {/* Log new touchpoint */}
              <form onSubmit={handleAddAttribution} className="space-y-2.5 rounded-lg border bg-card p-3">
                <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>Log Additional Campaign Touchpoint</span>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[11px]">Campaign</Label>
                    <Select value={newTouchCampaignId} onValueChange={setNewTouchCampaignId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map((c) => (
                          <SelectItem key={c.id} value={c.id!}>
                            {c.name} ({c.channel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Touch Stage</Label>
                    <Select value={newTouchType} onValueChange={(val) => setNewTouchType(val as TouchType)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First Touch">First Touch</SelectItem>
                        <SelectItem value="Lead Creation">Lead Creation</SelectItem>
                        <SelectItem value="Mid Touch">Mid Touch</SelectItem>
                        <SelectItem value="Last Touch">Last Touch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTouchNotes}
                    onChange={(e) => setNewTouchNotes(e.target.value)}
                    placeholder="Touch notes (e.g. Attended breakout session, clicked re-targeting ad)..."
                    className="flex-1 rounded-md border bg-background px-2.5 py-1 text-xs"
                  />
                  <Button type="submit" size="sm" disabled={isAddingTouch} className="h-8 text-xs">
                    {isAddingTouch ? "Logging..." : "Log Touch"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Activity Timeline (Notes, Tasks, History) */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-1.5 font-semibold text-sm">
                <History className="h-4 w-4 text-primary" />
                <span>Unified Activity Timeline</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Chronological record of outreach notes, assigned tasks, and field audit changes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <Tabs defaultValue="all" className="space-y-3">
                <TabsList className="h-8 bg-muted/40 p-0.5">
                  <TabsTrigger value="all" className="h-7 px-2.5 text-xs">
                    All Activity
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="h-7 px-2.5 text-xs">
                    Notes ({notes.length})
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="h-7 px-2.5 text-xs">
                    Tasks ({tasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="h-7 px-2.5 text-xs">
                    Field Changes ({history.length})
                  </TabsTrigger>
                </TabsList>

                {/* Combined Feed */}
                <TabsContent value="all" className="m-0 space-y-2.5">
                  {notes.length === 0 && tasks.length === 0 && history.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      No activity recorded yet for this prospect.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((n) => (
                        <div key={n.id} className="flex items-start gap-3 rounded-lg border bg-muted/15 p-3 text-xs">
                          <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">{n.title || "Note"}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(n.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div
                              className="prose prose-sm max-w-none text-muted-foreground text-xs"
                              // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized with DOMPurify
                              dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(n.content) }}
                            />
                          </div>
                        </div>
                      ))}

                      {tasks.map((t) => (
                        <div key={t.id} className="flex items-start gap-3 rounded-lg border bg-muted/15 p-3 text-xs">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">{t.title}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {t.status}
                              </Badge>
                            </div>
                            {t.description && <p className="text-muted-foreground">{t.description}</p>}
                          </div>
                        </div>
                      ))}

                      {history.map((h) => (
                        <div key={h.id} className="flex items-start gap-3 rounded-lg border bg-muted/10 p-2.5 text-xs">
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <div className="flex-1 text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {h.fieldLabel || h.fieldName || h.action}:
                            </span>{" "}
                            {Boolean(h.oldValue) && (
                              <span className="mr-1 text-muted-foreground/60 line-through">{String(h.oldValue)}</span>
                            )}
                            <span className="text-foreground">{String(h.newValue || "")}</span>
                            <span className="ml-2 text-[10px] text-muted-foreground/50">
                              {new Date(h.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Notes Only */}
                <TabsContent value="notes" className="m-0 space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="space-y-1 rounded-lg border bg-card p-3 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>{n.title || "Note"}</span>
                        <span className="font-normal text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized with DOMPurify
                        dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(n.content) }}
                        className="text-muted-foreground"
                      />
                    </div>
                  ))}
                  {notes.length === 0 && <p className="py-4 text-center text-muted-foreground text-xs">No notes.</p>}
                </TabsContent>

                {/* Tasks Only */}
                <TabsContent value="tasks" className="m-0 space-y-2">
                  {tasks.map((t) => (
                    <div key={t.id} className="flex justify-between rounded-lg border bg-card p-3 text-xs">
                      <div>
                        <div className="font-semibold">{t.title}</div>
                        <div className="text-muted-foreground">{t.description}</div>
                      </div>
                      <Badge variant="outline">{t.status}</Badge>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="py-4 text-center text-muted-foreground text-xs">No tasks.</p>}
                </TabsContent>

                {/* History Only */}
                <TabsContent value="history" className="m-0 space-y-1.5">
                  {history.map((h) => (
                    <div key={h.id} className="rounded border bg-card p-2 text-muted-foreground text-xs">
                      <span className="font-medium text-foreground">{h.fieldLabel || h.fieldName || h.action}: </span>
                      <span>{String(h.newValue || "")}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground/50">
                        {new Date(h.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="py-4 text-center text-muted-foreground text-xs">No changes.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Prospect Dialog */}
      <ProspectDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        prospect={prospect}
        customFields={customFields}
        campaigns={campaigns}
        advisors={advisors}
        onSuccess={() => router.refresh()}
      />

      {/* Convert to Client Dialog */}
      <ConvertToClientDialog
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
        prospect={prospect}
        advisors={advisors}
        onSuccess={() => router.refresh()}
      />

      {/* Quick Call Dialog */}
      <QuickCallDialog
        open={isCallDialogOpen}
        onOpenChange={setIsCallDialogOpen}
        prospect={prospect}
        onSuccess={() => router.refresh()}
      />

      {/* Quick Email Dialog */}
      <QuickEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        prospect={prospect}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
