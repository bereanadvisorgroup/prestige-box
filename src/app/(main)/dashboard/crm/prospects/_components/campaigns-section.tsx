"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { DollarSign, FileSpreadsheet, Pencil, Plus, Target, Trash2, TrendingUp, Upload, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { deleteCampaign } from "@/actions/campaigns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EnrichedCampaign, ProspectCustomField } from "@/types/prospects";

import { CampaignDialog } from "./campaign-dialog";
import { CsvImporterModal } from "./csv-importer-modal";

interface CampaignsSectionProps {
  campaigns: EnrichedCampaign[];
  customFields?: ProspectCustomField[];
  onRefresh?: () => void;
}

const COLORS = ["#0284c7", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1"];

export function CampaignsSection({ campaigns, customFields = [], onRefresh }: CampaignsSectionProps) {
  const router = useRouter();
  const handleRefresh = () => {
    onRefresh?.();
    router.refresh();
  };
  const [selectedCampaign, setSelectedCampaign] = React.useState<EnrichedCampaign | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = React.useState(false);
  const [csvTargetCampaignId, setCsvTargetCampaignId] = React.useState<string | null>(null);

  // Aggregate metrics
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
  const totalProspects = campaigns.reduce((acc, c) => acc + (c.prospectsCount || 0), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.conversionsCount || 0), 0);
  const avgCpl = totalProspects > 0 ? (totalBudget / totalProspects).toFixed(2) : "0.00";
  const overallConversionRate = totalProspects > 0 ? ((totalConversions / totalProspects) * 100).toFixed(1) : "0.0";

  // Chart data: by campaign
  const campaignChartData = campaigns.map((c) => ({
    name: c.name.length > 18 ? `${c.name.slice(0, 16)}…` : c.name,
    prospects: c.prospectsCount,
    conversions: c.conversionsCount,
    cpl: c.costPerProspect,
    budget: c.budget,
  }));

  // Chart data: channel breakdown
  const channelBreakdown = React.useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    for (const c of campaigns) {
      const current = map.get(c.channel) || { name: c.channel, value: 0 };
      current.value += c.prospectsCount;
      map.set(c.channel, current);
    }
    return Array.from(map.values()).filter((item) => item.value > 0);
  }, [campaigns]);

  const handleDelete = async (campaign: EnrichedCampaign) => {
    if (campaign.prospectsCount > 0) {
      toast.error(`Cannot delete campaign with ${campaign.prospectsCount} linked prospects.`);
      return;
    }

    const confirm = window.confirm(`Are you sure you want to delete campaign "${campaign.name}"?`);
    if (!confirm) return;

    try {
      const res = await deleteCampaign(campaign.id!);
      if (res.success) {
        toast.success("Campaign deleted.");
        handleRefresh();
      } else {
        toast.error(res.error || "Failed to delete campaign.");
      }
    } catch {
      toast.error("An error occurred while deleting the campaign.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-lg tracking-tight">Campaign Performance & Attribution</h3>
          <p className="text-muted-foreground text-xs">
            Track multi-touch prospect acquisition, cost per lead (CPL), and campaign conversion yields.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCsvTargetCampaignId(null);
              setIsCsvModalOpen(true);
            }}
            className="gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Import CSV</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedCampaign(null);
              setIsDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">Total Budget</div>
              <div className="font-bold text-foreground text-lg">
                ${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                Prospects Sourced
              </div>
              <div className="font-bold text-foreground text-lg">{totalProspects}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                Cost Per Prospect (CPL)
              </div>
              <div className="font-bold text-foreground text-lg">${avgCpl}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                Conversion Yield
              </div>
              <div className="font-bold text-foreground text-lg">{overallConversionRate}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Bar Chart: Prospects & Conversions */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="font-semibold text-sm">Prospect Generation by Campaign</CardTitle>
              <CardDescription className="text-xs">
                Total prospects acquired vs clients converted per campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      formatter={(val: unknown, name: unknown) => [
                        String(val ?? ""),
                        name === "prospects" ? "Prospects" : "Clients Converted",
                      ]}
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="prospects" fill="#0284c7" radius={[4, 4, 0, 0]} name="Prospects" />
                    <Bar dataKey="conversions" fill="#10b981" radius={[4, 4, 0, 0]} name="Converted Clients" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart: Channel Share */}
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="font-semibold text-sm">Prospect Volume by Channel</CardTitle>
              <CardDescription className="text-xs">Distribution across acquisition sources</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-4 pt-0">
              <div className="h-52 w-full">
                {channelBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {channelBreakdown.map((item, index) => (
                          <Cell key={`cell-${item.name}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val: unknown) => [`${val ?? 0} prospects`, "Volume"]}
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.9)",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                    No channel data available
                  </div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2 text-[10px]">
                {channelBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="rounded-md border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead>Campaign Name</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Prospects</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
              <TableHead className="text-right">CPL</TableHead>
              <TableHead className="text-right">Conversion Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length ? (
              campaigns.map((camp) => (
                <TableRow key={camp.id} className="transition-colors hover:bg-muted/40">
                  <TableCell className="font-semibold text-foreground text-sm">
                    {camp.name}
                    {camp.targetAudience && (
                      <span className="block max-w-[200px] truncate font-normal text-[11px] text-muted-foreground">
                        {camp.targetAudience}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {camp.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        camp.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : camp.status === "Completed"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-muted text-muted-foreground"
                      }
                    >
                      {camp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    ${camp.budget.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground text-xs">{camp.prospectsCount}</TableCell>
                  <TableCell className="text-right font-medium text-emerald-600 text-xs">
                    {camp.conversionsCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">${camp.costPerProspect}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{camp.conversionRate}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setCsvTargetCampaignId(camp.id || null);
                          setIsCsvModalOpen(true);
                        }}
                        title={`Import CSV to ${camp.name}`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedCampaign(camp);
                          setIsDialogOpen(true);
                        }}
                        title="Edit campaign"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={
                          camp.prospectsCount > 0
                            ? "h-7 w-7 cursor-not-allowed text-muted-foreground/30"
                            : "h-7 w-7 text-destructive hover:bg-destructive/10"
                        }
                        disabled={camp.prospectsCount > 0}
                        onClick={() => handleDelete(camp)}
                        title={camp.prospectsCount > 0 ? "Cannot delete: has linked prospects" : "Delete campaign"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground text-xs">
                  No campaigns defined yet. Click "New Campaign" to create your first campaign.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CampaignDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        campaign={selectedCampaign}
        onSuccess={handleRefresh}
      />

      {/* CSV Import Modal for Campaigns */}
      <CsvImporterModal
        open={isCsvModalOpen}
        onOpenChange={setIsCsvModalOpen}
        campaigns={campaigns}
        customFields={customFields}
        initialCampaignId={csvTargetCampaignId}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
