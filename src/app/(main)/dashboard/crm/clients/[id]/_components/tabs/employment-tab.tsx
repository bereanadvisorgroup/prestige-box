"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { updateClient } from "@/actions/clients";
import { createAddress } from "@/actions/addresses";
import { type Client, type Employment, type Address } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete } from "@/components/crm/address-autocomplete";

export function EmploymentTab({ client }: { client: Client }) {
  const [employments, setEmployments] = useState<Employment[]>(client.employments || []);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [occupation, setOccupation] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [employerPhone, setEmployerPhone] = useState("");
  const [employerAddressId, setEmployerAddressId] = useState("");
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleAddressSelect = async (addressData: Omit<Address, "id" | "createdAt">) => {
    try {
      const res = await createAddress(addressData);
      if (res.success && res.id) {
        setEmployerAddressId(res.id);
        toast.success("Employer address connected");
        setAddressSearchQuery(addressData.street1);
      }
    } catch {
      toast.error("Failed to set address");
    }
  };

  const handleAdd = async () => {
    if (!occupation || !employerName) {
      toast.error("Occupation and Employer Name are required");
      return;
    }
    try {
      setIsLoading(true);
      const newEmp: Employment = {
        id: crypto.randomUUID(),
        occupation,
        employerName,
        employerAddressId,
        employerPhone,
        startDate,
        endDate,
      };

      const updated = [...employments, newEmp];
      const res = await updateClient(client.id!, { employments: updated });
      if (res.success) {
        setEmployments(updated);
        setOccupation("");
        setEmployerName("");
        setEmployerPhone("");
        setStartDate("");
        setEndDate("");
        setEmployerAddressId("");
        setAddressSearchQuery("");
        toast.success("Employment added");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Error adding employment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const updated = employments.filter((e) => e.id !== id);
      const res = await updateClient(client.id!, { employments: updated });
      if (res.success) {
        setEmployments(updated);
        toast.success("Employment removed");
      }
    } catch {
      toast.error("Error removing employment");
    }
  };

  return (
    <Card className="border-none shadow-md animate-in fade-in duration-500 bg-gradient-to-b from-card to-muted/20">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle>Employment History</CardTitle>
        <CardDescription>Add employment records for this client.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="bg-background p-4 rounded-lg border shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Occupation</Label>
              <Input
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>Employer Name</Label>
              <Input
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label>Employer Phone</Label>
              <PhoneInput
                value={employerPhone}
                onChange={(val: any) => setEmployerPhone(val?.target?.value ?? val ?? "")}
                placeholder="555-555-5555"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>Employer Address</Label>
              <AddressAutocomplete
                value={addressSearchQuery}
                onValueChange={setAddressSearchQuery}
                onAddressSelect={handleAddressSelect}
                placeholder="Search for employer address..."
              />
              {employerAddressId && <p className="text-xs text-green-600 font-medium">✓ Address linked</p>}
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleAdd} disabled={isLoading || !occupation || !employerName}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Employment
            </Button>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {employments.length > 0 ? (
            employments.map((emp) => {
              const calculateYears = (start?: string, end?: string) => {
                if (!start) return null;
                const startDate = new Date(start);
                const endDate = end ? new Date(end) : new Date();
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                return (diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
              };
              const years = calculateYears(emp.startDate, emp.endDate);

              return (
                <div
                  key={emp.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-md bg-background shadow-sm hover:shadow-md transition-all gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded border border-primary/20 text-primary shrink-0">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground flex items-center gap-2">{emp.occupation}</p>
                      <p className="text-sm text-foreground/80">{emp.employerName}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/50 mt-2">
                        {emp.employerPhone && (
                          <span>
                            <span className="font-medium mr-1 opacity-70">Phone:</span>
                            {emp.employerPhone}
                          </span>
                        )}
                        {emp.startDate && (
                          <span>
                            <span className="font-medium mr-1 opacity-70">Started:</span>
                            {emp.startDate}
                          </span>
                        )}
                        {emp.endDate && (
                          <span>
                            <span className="font-medium mr-1 opacity-70">Ended:</span>
                            {emp.endDate}
                          </span>
                        )}
                        {!emp.endDate && emp.startDate && (
                          <span>
                            <span className="font-medium mr-1 opacity-70">Status:</span>Current
                          </span>
                        )}
                        {years && (
                          <span>
                            <span className="font-medium mr-1 opacity-70">Tenure:</span>
                            {years} years
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 shrink-0 self-end md:self-center"
                    onClick={() => handleRemove(emp.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
              <Briefcase className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No employment records found.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
