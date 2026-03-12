"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FileText, Plus, Shield, User, Calendar, DollarSign, Search } from "lucide-react";

import { ClientPolicy, ClientPolicySchema, Client, InsuranceCompany } from "@/types/crm";
import { createClientPolicy, updateClientPolicy } from "@/actions/policies";
import { getClients } from "@/actions/clients";
import { getInsuranceCompanies } from "@/actions/insurance-companies";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

interface PolicyFormProps {
  policy?: ClientPolicy;
}

export function PolicyForm({ policy }: PolicyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<InsuranceCompany[]>([]);

  const form = useForm<ClientPolicy>({
    resolver: zodResolver(ClientPolicySchema),
    defaultValues: policy || {
      clientId: "",
      insuranceCompanyId: "",
      policyName: "",
      policyNumber: "",
      premiumAmount: 0,
      effectiveDate: new Date().toISOString().split('T')[0],
      renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      paymentSchedule: "monthly",
    },
  });

  useEffect(() => {
    async function fetchData() {
      const [clientResult, companyResult] = await Promise.all([
        getClients(),
        getInsuranceCompanies(),
      ]);
      
      if (clientResult.success && clientResult.clients) {
        setAvailableClients(clientResult.clients);
      }
      if (companyResult.success && companyResult.companies) {
        setAvailableCompanies(companyResult.companies);
      }
    }
    fetchData();
  }, []);

  async function onSubmit(values: ClientPolicy) {
    try {
      setIsLoading(true);
      const isEditing = !!policy?.id;
      
      let result;
      if (isEditing) {
        result = await updateClientPolicy(policy.id!, values);
      } else {
        result = await createClientPolicy(values);
      }

      if (result.success) {
        toast.success(isEditing ? "Policy updated" : "Policy created");
        router.push("/dashboard/crm/policies");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} policy`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedCompany = availableCompanies.find(c => c.id === form.watch("insuranceCompanyId"));
  const selectedClient = availableClients.find(c => c.id === form.watch("clientId"));

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {policy ? "Edit Client Policy" : "Add New Policy"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Client</FormLabel>
                    <Combobox 
                      value={field.value} 
                      onValueChange={(val: any) => {
                        if (typeof val === 'string') field.onChange(val);
                      }}
                      disabled={!!policy}
                    >
                      <ComboboxInput placeholder="Search clients..." />
                      <ComboboxContent>
                        <ComboboxList>
                          {availableClients.map((c) => (
                            <ComboboxItem key={c.id} value={c.id!}>
                              {c.person?.firstName} {c.person?.lastName} ({c.person?.email})
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {selectedClient && (
                      <div className="mt-1 text-[10px] text-primary font-bold px-1 uppercase tracking-tight">
                        Selected: {selectedClient.person?.firstName} {selectedClient.person?.lastName}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Selection */}
              <FormField
                control={form.control}
                name="insuranceCompanyId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Insurance Carrier</FormLabel>
                    <Combobox 
                      value={field.value} 
                      onValueChange={(val: any) => {
                        if (typeof val === 'string') {
                          field.onChange(val);
                          form.setValue("policyName", ""); // Reset policy name when carrier changes
                        }
                      }}
                    >
                      <ComboboxInput placeholder="Search carriers..." />
                      <ComboboxContent>
                        <ComboboxList>
                          {availableCompanies.map((c) => (
                            <ComboboxItem key={c.id} value={c.id!}>
                              {c.name}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {selectedCompany && (
                      <div className="mt-1 text-[10px] text-primary font-bold px-1 uppercase tracking-tight">
                        Selected: {selectedCompany.name}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Policy Name (Filtered) */}
              <FormField
                control={form.control}
                name="policyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Name</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCompany}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedCompany ? "Select a policy" : "Select carrier first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedCompany?.policyNames.map((name, i) => (
                          <SelectItem key={i} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Policy Number */}
              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input placeholder="POL-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Premium Amount */}
              <FormField
                control={form.control}
                name="premiumAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Amount ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-9" 
                          type="number" 
                          placeholder="1200" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Schedule */}
              <FormField
                control={form.control}
                name="paymentSchedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Schedule</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Dates */}
              <FormField
                control={form.control}
                name="effectiveDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="renewalDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renewal Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-bold">
                {isLoading ? "Saving..." : (policy ? "Update Policy" : "Save Policy")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
