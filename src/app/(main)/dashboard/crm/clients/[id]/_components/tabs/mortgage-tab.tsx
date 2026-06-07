"use client";

import { useEffect, useState } from "react";

import { Calculator, FileText, Home, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getAddresses } from "@/actions/addresses";
import { updateClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase.client";
import type { Address, Client, MortgageInfo, Person } from "@/types/crm";

export function MortgageTab({ client, person }: { client: Client; person: Person }) {
  const [mortgages, setMortgages] = useState<MortgageInfo[]>(client.mortgages || []);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchPersonAddresses() {
      const res = await getAddresses();
      if (res.success && res.addresses) {
        const personAddrs = res.addresses.filter((a) => person.addressIds?.includes(a.id!));
        setAddresses(personAddrs);
      }
    }
    fetchPersonAddresses();
  }, [person]);

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [marketValue, setMarketValue] = useState("");
  const [statementFile, setStatementFile] = useState<File | null>(null);

  const handleFetchZillow = () => {
    // Mock Zillow API call delay
    const randomValue = (Math.random() * 500000 + 300000).toFixed(2);
    setMarketValue(randomValue);
    toast.success("Zillow Market Value estimated (Mocked)");
  };

  const handleAdd = async () => {
    if (!selectedAddressId) {
      toast.error("Please select an address");
      return;
    }
    try {
      setIsLoading(true);
      let statementPath;

      if (statementFile) {
        const fileExt = statementFile.name.split(".").pop();
        const randomStr = Math.random().toString(36).substring(7);
        const filePath = `clients/${client.id}/mortgages/${randomStr}_${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from("documents").upload(filePath, statementFile);
        if (error) throw error;
        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(filePath);
        statementPath = publicUrl;
      }

      const newMortgage: MortgageInfo = {
        id: crypto.randomUUID(),
        addressId: selectedAddressId,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        currentMarketValue: marketValue ? parseFloat(marketValue) : undefined,
        statementPath,
      };

      const updated = [...mortgages, newMortgage];
      const res = await updateClient(client.id!, { mortgages: updated });
      if (res.success) {
        setMortgages(updated);
        setSelectedAddressId("");
        setPurchasePrice("");
        setMarketValue("");
        setStatementFile(null);
        const fileInput = document.getElementById("mortgage-file-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        toast.success("Mortgage added successfully");
      } else {
        throw new Error("Failed to update client with new mortgage details.");
      }
    } catch (error: any) {
      console.error("Mortgage upload error:", error);
      toast.error(error.message || "Error adding mortgage details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const updated = mortgages.filter((m) => m.id !== id);
      const res = await updateClient(client.id!, { mortgages: updated });
      if (res.success) {
        setMortgages(updated);
        toast.success("Mortgage removed");
      }
    } catch {
      toast.error("Error removing mortgage");
    }
  };

  const getFullAddress = (addressId: string) => {
    const addr = addresses.find((a) => a.id === addressId);
    if (!addr) return "Unknown Address";
    return `${addr.street1}${addr.street2 ? `, ${addr.street2}` : ""}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
  };

  return (
    <Card className="fade-in animate-in border-none bg-gradient-to-b from-card to-muted/20 shadow-md duration-500">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle>Mortgages & Properties</CardTitle>
        <CardDescription>Link properties and upload mortgage statements for this client.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Home Address</Label>
              <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select home address" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.length === 0 && (
                    <SelectItem value="none" disabled>
                      No addresses found for user
                    </SelectItem>
                  )}
                  {addresses.map((a) => (
                    <SelectItem key={a.id} value={a.id!}>
                      {a.street1}, {a.city} {a.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Purchase Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <div className="mb-2 flex items-center justify-between">
                <Label className="mb-0">Est. Market Value ($)</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-muted"
                  onClick={handleFetchZillow}
                  title="Estimate with Zillow"
                >
                  <Calculator className="h-4 w-4 text-primary" />
                </Button>
              </div>
              <Input
                type="number"
                step="0.01"
                value={marketValue}
                onChange={(e) => setMarketValue(e.target.value)}
                placeholder="0.00"
                className={marketValue ? "border-green-500 bg-green-50/10" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Mortgage Statement</Label>
              <input
                id="mortgage-file-upload"
                type="file"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleAdd} disabled={isLoading || !selectedAddressId}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Property details
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {mortgages.length > 0 ? (
            mortgages.map((mort) => {
              const addrStr = getFullAddress(mort.addressId);

              return (
                <div
                  key={mort.id}
                  className="flex flex-col items-stretch justify-between gap-0 overflow-hidden rounded-xl border bg-background p-0 shadow-sm transition-all hover:shadow-md xl:flex-row xl:items-center"
                >
                  <div className="relative h-48 w-full shrink-0 border-border/50 border-b bg-muted/30 xl:h-auto xl:w-48 xl:border-r xl:border-b-0">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0, minHeight: "100%" }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(addrStr)}&output=embed`}
                    />
                  </div>
                  <div className="flex flex-1 flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center">
                    <div className="w-full flex-1 space-y-3">
                      <p className="flex items-start gap-3 font-semibold text-foreground text-lg sm:items-center">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary sm:mt-0" />
                        <span className="line-clamp-2">{addrStr}</span>
                      </p>
                      <div className="mt-4 grid w-full grid-cols-2 gap-4 rounded-lg border bg-muted/5 p-4 text-sm lg:grid-cols-4">
                        <div className="space-y-1">
                          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                            Purchase Price
                          </p>
                          <p className="font-semibold">
                            {mort.purchasePrice
                              ? `$${mort.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                            Market Value <Calculator className="h-3 w-3 text-green-600" />
                          </p>
                          <p className="font-semibold text-green-700 dark:text-green-500">
                            {mort.currentMarketValue
                              ? `$${mort.currentMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex w-full shrink-0 flex-col items-center gap-3 self-end sm:mt-0 sm:w-auto sm:flex-row sm:self-center xl:flex-col">
                      {mort.statementPath && (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-primary/20 hover:bg-primary/5 xl:w-auto"
                          asChild
                        >
                          <a href={mort.statementPath} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 text-primary" /> View Statement
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-full text-destructive hover:bg-destructive/10 sm:w-10"
                        onClick={() => handleRemove(mort.id!)}
                      >
                        <Trash2 className="mx-auto h-5 w-5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border-2 border-dashed bg-muted/10 p-12 text-center text-muted-foreground">
              <Home className="mx-auto mb-4 h-10 w-10 opacity-20" />
              <p className="mx-auto max-w-sm text-balance text-base">
                No properties or mortgages linked. Select a home address and add property details to get started.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
