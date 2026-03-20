"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Home, UploadCloud, MapPin, Calculator, FileText } from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { toast } from "sonner";
import { storage } from "@/lib/firebase.client";
import { updateClient } from "@/actions/clients";
import { getAddresses } from "@/actions/addresses";
import { type Client, type MortgageInfo, type Person, type Address } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      let statementPath = undefined;

      if (statementFile) {
        const fileExt = statementFile.name.split(".").pop();
        const randomStr = Math.random().toString(36).substring(7);
        const storageRef = ref(storage, `clients/${client.id}/mortgages/${randomStr}_${Date.now()}.${fileExt}`);
        const snapshot = await uploadBytes(storageRef, statementFile);
        statementPath = await getDownloadURL(snapshot.ref);
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
    <Card className="border-none shadow-md animate-in fade-in duration-500 bg-gradient-to-b from-card to-muted/20">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle>Mortgages & Properties</CardTitle>
        <CardDescription>Link properties and upload mortgage statements for this client.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-background p-4 rounded-lg border shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="flex items-center justify-between mb-2">
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleAdd} disabled={isLoading || !selectedAddressId}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Property details
            </Button>
          </div>
        </div>

        <div className="space-y-5 mt-6">
          {mortgages.length > 0 ? (
            mortgages.map((mort) => {
              const addrStr = getFullAddress(mort.addressId);

              return (
                <div
                  key={mort.id}
                  className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between p-0 border rounded-xl bg-background shadow-sm hover:shadow-md transition-all overflow-hidden gap-0"
                >
                  <div className="w-full xl:w-48 h-48 xl:h-auto shrink-0 bg-muted/30 border-b xl:border-b-0 xl:border-r border-border/50 relative">
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
                  <div className="flex-1 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1 w-full">
                      <p className="font-semibold text-foreground text-lg flex items-start sm:items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                        <span className="line-clamp-2">{addrStr}</span>
                      </p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 w-full text-sm border p-4 rounded-lg bg-muted/5">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs uppercase font-medium tracking-wide">
                            Purchase Price
                          </p>
                          <p className="font-semibold">
                            {mort.purchasePrice
                              ? `$${mort.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "N/A"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-xs uppercase font-medium tracking-wide flex items-center gap-1">
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

                    <div className="flex xl:flex-col sm:flex-row flex-col items-center gap-3 shrink-0 self-end sm:self-center w-full sm:w-auto mt-4 sm:mt-0">
                      {mort.statementPath && (
                        <Button
                          variant="outline"
                          className="w-full xl:w-auto gap-2 border-primary/20 hover:bg-primary/5"
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
                        className="text-destructive hover:bg-destructive/10 w-full sm:w-10 h-10"
                        onClick={() => handleRemove(mort.id!)}
                      >
                        <Trash2 className="h-5 w-5 sm:h-4 sm:w-4 mx-auto" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
              <Home className="h-10 w-10 mx-auto mb-4 opacity-20" />
              <p className="text-base text-balance max-w-sm mx-auto">
                No properties or mortgages linked. Select a home address and add property details to get started.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
