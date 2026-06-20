"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Calendar,
  Car,
  Coins,
  Gem,
  Home as HomeIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import type * as z from "zod";

import { createAddress } from "@/actions/addresses";
import {
  addAssetHistorySnapshot,
  createAsset,
  deleteAsset,
  deleteAssetHistorySnapshot,
  getAssetHistory,
  getAssets,
  getClientAssetHistory,
  updateAsset,
} from "@/actions/assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
  type Address,
  type Asset,
  type AssetFormInput,
  AssetFormSchema,
  type AssetFormValues,
  type AssetHistory,
  type Client,
} from "@/types/crm";

const REAL_ESTATE_SUBTYPES = ["Primary Residence", "Investment Properties"] as const;
const NEW_ADDRESS_SENTINEL = "__new__";
const NONE_ADDRESS_SENTINEL = "__none__";

interface AssetsTabProps {
  client: Client;
  initialAssets: Asset[];
  initialHistoryData: Record<string, string | number>[];
  initialAddresses: Address[];
}

export function AssetsTab({ client, initialAssets, initialHistoryData, initialAddresses }: AssetsTabProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [historyData, setHistoryData] = useState<Record<string, string | number>[]>(initialHistoryData);
  const [addresses] = useState<Address[]>(initialAddresses);
  const [isLoading, setIsLoading] = useState(false);

  // Modals visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetHistoryRecords, setAssetHistoryRecords] = useState<AssetHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // New historical snapshot form state
  const [newSnapValue, setNewSnapValue] = useState("");
  const [newSnapDate, setNewSnapDate] = useState(new Date().toISOString().split("T")[0]);

  // Address selection state (managed outside RHF for the "new address" inline form)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(NONE_ADDRESS_SENTINEL);
  const [newAddrStreet1, setNewAddrStreet1] = useState("");
  const [newAddrStreet2, setNewAddrStreet2] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("");
  const [newAddrState, setNewAddrState] = useState("");
  const [newAddrZip, setNewAddrZip] = useState("");
  const [newAddrCountry, setNewAddrCountry] = useState("USA");

  // Form hook for Add/Edit Asset
  const form = useForm<AssetFormInput, undefined, AssetFormValues>({
    resolver: zodResolver(AssetFormSchema),
    defaultValues: {
      clientId: client.id,
      name: "",
      category: "Real Estate and Fixed Physical Assets",
      subType: "Primary Residence",
      currentValue: 0,
      currency: "USD",
      isAutomated: false,
      institutionName: "Manual",
      addressId: null,
    },
  });

  const watchIsAutomated = form.watch("isAutomated");
  const watchSubType = form.watch("subType");
  const isRealEstate = REAL_ESTATE_SUBTYPES.includes(watchSubType as (typeof REAL_ESTATE_SUBTYPES)[number]);

  // Reset address picker state
  const resetAddressState = () => {
    setSelectedAddressId(NONE_ADDRESS_SENTINEL);
    setNewAddrStreet1("");
    setNewAddrStreet2("");
    setNewAddrCity("");
    setNewAddrState("");
    setNewAddrZip("");
    setNewAddrCountry("USA");
  };

  // Open form for creating new asset
  const handleOpenCreate = () => {
    setSelectedAsset(null);
    resetAddressState();
    form.reset({
      clientId: client.id,
      name: "",
      category: "Real Estate and Fixed Physical Assets",
      subType: "Primary Residence",
      currentValue: 0,
      currency: "USD",
      isAutomated: false,
      institutionName: "Manual",
      addressId: null,
    });
    setIsFormOpen(true);
  };

  // Open form for editing existing asset
  const handleOpenEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    resetAddressState();
    // Pre-select existing address if any
    if (asset.addressId) {
      setSelectedAddressId(asset.addressId);
    } else {
      setSelectedAddressId(NONE_ADDRESS_SENTINEL);
    }
    form.reset({
      clientId: client.id,
      name: asset.name,
      category: asset.category,
      subType: asset.subType,
      currentValue: Number(asset.currentValue),
      currency: asset.currency,
      isAutomated: asset.isAutomated,
      institutionName: asset.institutionName,
      addressId: asset.addressId ?? null,
    });
    setIsFormOpen(true);
  };

  // Handle Add/Edit Submit
  const onFormSubmit = async (values: z.infer<typeof AssetFormSchema>) => {
    try {
      setIsLoading(true);

      let resolvedAddressId: string | null = null;

      // Handle address logic only for real estate subtypes
      if (REAL_ESTATE_SUBTYPES.includes(values.subType as (typeof REAL_ESTATE_SUBTYPES)[number])) {
        if (selectedAddressId === NONE_ADDRESS_SENTINEL) {
          resolvedAddressId = null;
        } else if (selectedAddressId === NEW_ADDRESS_SENTINEL) {
          // Validate new address fields
          if (!newAddrStreet1 || !newAddrCity || !newAddrState || !newAddrZip) {
            toast.error("Please fill in all required address fields (Street, City, State, Zip).");
            setIsLoading(false);
            return;
          }
          // Create the new address first
          const addrRes = await createAddress({
            street1: newAddrStreet1,
            street2: newAddrStreet2 || undefined,
            city: newAddrCity,
            state: newAddrState,
            zipCode: newAddrZip,
            country: newAddrCountry || "USA",
          });
          if (!addrRes.success || !addrRes.id) {
            throw new Error(addrRes.error ?? "Failed to create address");
          }
          resolvedAddressId = addrRes.id;
        } else {
          resolvedAddressId = selectedAddressId;
        }
      }

      const payload = { ...values, addressId: resolvedAddressId };

      if (selectedAsset) {
        const res = await updateAsset(selectedAsset.id!, payload);
        if (res.success) {
          toast.success("Asset updated successfully");
          await refreshAllData();
          setIsFormOpen(false);
        } else {
          throw new Error(res.error);
        }
      } else {
        const res = await createAsset(payload);
        if (res.success) {
          toast.success("Asset added successfully");
          await refreshAllData();
          setIsFormOpen(false);
        } else {
          throw new Error(res.error);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset? All historical values will be deleted.")) return;
    try {
      setIsLoading(true);
      const res = await deleteAsset(id);
      if (res.success) {
        toast.success("Asset deleted successfully");
        await refreshAllData();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error deleting asset");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh asset and history list from DB
  const refreshAllData = async () => {
    const { success, assets: dbAssets } = await getAssets(client.id!);
    if (success && dbAssets) setAssets(dbAssets);

    const { success: histSuccess, historyData: dbHist } = await getClientAssetHistory(client.id!);
    if (histSuccess && dbHist) setHistoryData(dbHist);
  };

  // Open Value History manager modal
  const handleOpenHistory = async (asset: Asset) => {
    setSelectedAsset(asset);
    setNewSnapValue(Number(asset.currentValue).toString());
    setNewSnapDate(new Date().toISOString().split("T")[0]);
    setIsHistoryOpen(true);
    await refreshHistoryRecords(asset.id!);
  };

  // Fetch snapshots list for a specific asset
  const refreshHistoryRecords = async (assetId: string) => {
    try {
      setHistoryLoading(true);
      const res = await getAssetHistory(assetId);
      if (res.success && res.history) {
        setAssetHistoryRecords(res.history);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load history snapshots");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Add historical snapshot
  const handleAddSnapshot = async () => {
    if (!selectedAsset || !newSnapValue) return;
    try {
      setHistoryLoading(true);
      const val = parseFloat(newSnapValue);
      if (Number.isNaN(val)) {
        toast.error("Please enter a valid numeric value");
        return;
      }
      const res = await addAssetHistorySnapshot(
        selectedAsset.id!,
        val,
        newSnapDate ? new Date(newSnapDate).toISOString() : undefined,
      );
      if (res.success) {
        toast.success("Snapshot recorded");
        setNewSnapValue("");
        await refreshHistoryRecords(selectedAsset.id!);
        await refreshAllData();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add snapshot");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Delete historical snapshot
  const handleDeleteSnapshot = async (snapId: string) => {
    if (!confirm("Are you sure you want to delete this snapshot?")) return;
    try {
      setHistoryLoading(true);
      const res = await deleteAssetHistorySnapshot(snapId);
      if (res.success) {
        toast.success("Snapshot deleted");
        await refreshHistoryRecords(selectedAsset!.id!);
        await refreshAllData();
      } else {
        throw new Error(res.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete snapshot");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (addr: Address): string => {
    const parts = [addr.street1, addr.street2, addr.city, addr.state, addr.zipCode].filter(Boolean);
    return parts.join(", ");
  };

  // Get address by ID from state
  const getAddressById = (id: string | null | undefined): Address | undefined => {
    if (!id) return undefined;
    return addresses.find((a) => a.id === id);
  };

  // Summarize metrics
  const totalValue = assets.reduce((sum, a) => sum + Number(a.currentValue), 0);
  const realEstateValue = assets
    .filter((a) => a.subType === "Primary Residence" || a.subType === "Investment Properties")
    .reduce((sum, a) => sum + Number(a.currentValue), 0);
  const vehiclesValuablesValue = assets
    .filter((a) => a.subType === "Vehicles" || a.subType === "Valuables")
    .reduce((sum, a) => sum + Number(a.currentValue), 0);
  const automatedCount = assets.filter((a) => a.isAutomated).length;
  const automatedPercent = assets.length > 0 ? Math.round((automatedCount / assets.length) * 100) : 0;

  // Chart configuration
  const chartConfig = {
    total: {
      label: "Net Worth Trend",
      color: "var(--chart-1)",
    },
  };

  // Icon mapping for subtypes
  const getSubtypeIcon = (subType: string) => {
    switch (subType) {
      case "Primary Residence":
        return <HomeIcon className="h-4 w-4 text-sky-500" />;
      case "Investment Properties":
        return <Building2 className="h-4 w-4 text-emerald-500" />;
      case "Vehicles":
        return <Car className="h-4 w-4 text-amber-500" />;
      case "Valuables":
        return <Gem className="h-4 w-4 text-purple-500" />;
      default:
        return <Coins className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Actions */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">Real Estate & Fixed Physical Assets</h2>
          <p className="text-muted-foreground text-sm">
            Illiquid physical properties that hold equity, generate income, or depreciate.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="shrink-0 font-semibold shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Asset
        </Button>
      </div>

      {/* 2. Key Performance Indicators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              <Coins className="h-3.5 w-3.5 text-primary" /> Total Asset Value
            </CardDescription>
            <CardTitle className="font-bold text-2xl tracking-tight">
              {formatCurrency(totalValue, { noDecimals: true })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Sum of all tracked physical assets</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5 text-emerald-500" /> Real Estate Properties
            </CardDescription>
            <CardTitle className="font-bold text-2xl tracking-tight">
              {formatCurrency(realEstateValue, { noDecimals: true })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Primary residence & rentals</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              <Car className="h-3.5 w-3.5 text-amber-500" /> Vehicles & Valuables
            </CardDescription>
            <CardTitle className="font-bold text-2xl tracking-tight">
              {formatCurrency(vehiclesValuablesValue, { noDecimals: true })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Automobiles, collectibles & art</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" /> API Auto-Sync Rate
            </CardDescription>
            <CardTitle className="font-bold text-2xl tracking-tight">{automatedPercent}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {automatedCount} of {assets.length} assets synced via API
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Valuation History Graph */}
      {historyData.length > 0 ? (
        <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4 text-primary" /> Net Worth Trend
            </CardTitle>
            <CardDescription>Historical valuation timeline of physical asset equity.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer className="max-h-72 w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => {
                      const d = new Date(value);
                      return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                      return `$${value}`;
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          });
                        }}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Value"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <TrendingUp className="mb-4 h-12 w-12 opacity-25" />
            <p className="text-sm">
              Historical net worth graphing will display here once you add asset value snapshots.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 4. Assets Table */}
      <Card className="border-none bg-linear-to-b from-card to-muted/20 shadow-md">
        <CardHeader className="border-b bg-muted/10">
          <CardTitle>Tracked Assets</CardTitle>
          <CardDescription>View and manage all real estate and fixed physical properties.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {assets.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Sub-Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Tracking Mode</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => {
                    const linkedAddress = getAddressById(asset.addressId);
                    return (
                      <TableRow key={asset.id} className="transition-colors hover:bg-muted/5">
                        <TableCell className="font-semibold text-sm">
                          <div className="flex items-center gap-2">
                            <span className="grid size-7 place-content-center rounded bg-muted/50">
                              {getSubtypeIcon(asset.subType)}
                            </span>
                            {asset.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{asset.subType}</TableCell>
                        <TableCell className="text-sm">
                          {linkedAddress ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                              <span className="max-w-[200px] truncate text-xs">{formatAddress(linkedAddress)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {asset.isAutomated ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/20 bg-emerald-500/5 text-emerald-600"
                            >
                              API Synced
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-amber-600">
                              Manual
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{asset.institutionName}</TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums">
                          {formatCurrency(Number(asset.currentValue))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleOpenHistory(asset)}
                              title="Valuation History"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenEdit(asset)}
                              title="Edit Asset"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(asset.id!)}
                              title="Delete Asset"
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
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Coins className="mb-4 h-12 w-12 opacity-25" />
              <h3 className="mb-1 font-semibold text-base">No Assets Tracked</h3>
              <p className="mb-4 max-w-sm text-sm">
                Add properties, vehicles, or valuables to start calculating the client's physical portfolio equity.
              </p>
              <Button onClick={handleOpenCreate} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add First Asset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Add/Edit Asset Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedAsset ? "Edit Asset" : "Add Asset"}</DialogTitle>
            <DialogDescription>
              {selectedAsset
                ? "Update asset values or sync preferences."
                : "Add a new illiquid property, vehicle, or valuable to track."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name / Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Primary Home, Porsche 911, Family Rings" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Sub-Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Primary Residence">Primary Residence</SelectItem>
                        <SelectItem value="Investment Properties">Investment Property (Rentals)</SelectItem>
                        <SelectItem value="Vehicles">Vehicle (Auto, Boat, Air)</SelectItem>
                        <SelectItem value="Valuables">Valuables (Art, Jewelry, Antiques)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Section — only shown for real estate sub-types */}
              {isRealEstate && (
                <div className="animate-in fade-in slide-in-from-top-1 space-y-3 rounded-lg border bg-muted/20 p-4 duration-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-sky-500" />
                    <Label className="font-semibold text-sm">Property Address</Label>
                  </div>

                  {/* Address dropdown */}
                  <div className="space-y-1">
                    <Label htmlFor="address-select" className="text-muted-foreground text-xs">
                      Select existing address or add new
                    </Label>
                    <Select
                      value={selectedAddressId}
                      onValueChange={(val) => {
                        setSelectedAddressId(val);
                        // Clear new address fields when switching away from "new"
                        // Clear inline fields when navigating away from the "add new" option
                        if (val !== NEW_ADDRESS_SENTINEL) {
                          setNewAddrStreet1("");
                          setNewAddrStreet2("");
                          setNewAddrCity("");
                          setNewAddrState("");
                          setNewAddrZip("");
                          setNewAddrCountry("USA");
                        }
                      }}
                    >
                      <SelectTrigger id="address-select">
                        <SelectValue placeholder="— No address linked —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_ADDRESS_SENTINEL}>— No address linked —</SelectItem>
                        {addresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id!}>
                            {formatAddress(addr)}
                          </SelectItem>
                        ))}
                        <SelectItem value={NEW_ADDRESS_SENTINEL}>
                          <span className="flex items-center gap-1.5 text-primary">
                            <Plus className="h-3.5 w-3.5" /> Add New Address…
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Inline new address fields */}
                  {selectedAddressId === NEW_ADDRESS_SENTINEL && (
                    <div className="animate-in fade-in slide-in-from-top-1 grid grid-cols-1 gap-3 pt-1 duration-200 sm:grid-cols-2">
                      <div className="sm:col-span-2 space-y-1">
                        <Label htmlFor="new-street1" className="text-muted-foreground text-xs">
                          Street Address <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="new-street1"
                          placeholder="123 Main St"
                          value={newAddrStreet1}
                          onChange={(e) => setNewAddrStreet1(e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label htmlFor="new-street2" className="text-muted-foreground text-xs">
                          Suite / Apt (optional)
                        </Label>
                        <Input
                          id="new-street2"
                          placeholder="Suite 100"
                          value={newAddrStreet2}
                          onChange={(e) => setNewAddrStreet2(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-city" className="text-muted-foreground text-xs">
                          City <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="new-city"
                          placeholder="New York"
                          value={newAddrCity}
                          onChange={(e) => setNewAddrCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-state" className="text-muted-foreground text-xs">
                          State <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="new-state"
                          placeholder="NY"
                          value={newAddrState}
                          onChange={(e) => setNewAddrState(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-zip" className="text-muted-foreground text-xs">
                          Zip Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="new-zip"
                          placeholder="10001"
                          value={newAddrZip}
                          onChange={(e) => setNewAddrZip(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-country" className="text-muted-foreground text-xs">
                          Country
                        </Label>
                        <Input
                          id="new-country"
                          placeholder="USA"
                          value={newAddrCountry}
                          onChange={(e) => setNewAddrCountry(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Valuation ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between rounded-lg border p-4 shadow-xs">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Automated Sync</FormLabel>
                  <p className="text-muted-foreground text-xs">Sync valuation automatically via API integrations</p>
                </div>
                <FormField
                  control={form.control}
                  name="isAutomated"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {watchIsAutomated && (
                <FormField
                  control={form.control}
                  name="institutionName"
                  render={({ field }) => (
                    <FormItem className="fade-in animate-in duration-200">
                      <FormLabel>Institution Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Zillow, Plaid, Chase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedAsset ? "Save Changes" : "Save Asset"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 6. History Management Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Valuation History</DialogTitle>
            <DialogDescription>
              Manage chronological snapshots for <span className="font-semibold">{selectedAsset?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          {/* New Snapshot Form */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
            <h4 className="font-semibold text-sm">Add Value Snapshot</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="snapshot-value" className="font-medium text-muted-foreground text-xs">
                  Snapshot Value ($)
                </Label>
                <Input
                  id="snapshot-value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newSnapValue}
                  onChange={(e) => setNewSnapValue(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="recorded-date" className="font-medium text-muted-foreground text-xs">
                  Recorded Date
                </Label>
                <Input
                  id="recorded-date"
                  type="date"
                  value={newSnapDate}
                  onChange={(e) => setNewSnapDate(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleAddSnapshot}
              size="sm"
              className="mt-2 w-fit font-semibold"
              disabled={historyLoading || !newSnapValue}
            >
              {historyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Value
            </Button>
          </div>

          <Separator className="my-2" />

          {/* Snapshots List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Historical Values</h4>
            {historyLoading && assetHistoryRecords.length === 0 ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : assetHistoryRecords.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-md border bg-background">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Valuation</TableHead>
                      <TableHead className="w-[60px] text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...assetHistoryRecords].reverse().map((record) => (
                      <TableRow key={record.id} className="transition-colors hover:bg-muted/5">
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(record.recordedAt!).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-sm tabular-nums">
                          {formatCurrency(Number(record.value))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteSnapshot(record.id!)}
                            disabled={historyLoading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="p-4 text-center text-muted-foreground text-xs">No snapshots recorded yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
