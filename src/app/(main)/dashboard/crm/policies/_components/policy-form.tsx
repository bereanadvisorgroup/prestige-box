"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, CreditCard, DollarSign, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getClients } from "@/actions/clients";
import { getInsuranceCompanies } from "@/actions/insurance-companies";
import { createClientPolicy, updateClientPolicy } from "@/actions/policies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  type Client,
  type ClientPolicy,
  ClientPolicySchema,
  type InsuranceCompany,
  type PaymentAccount,
} from "@/types/crm";

interface PolicyFormProps {
  policy?: ClientPolicy;
}

export function PolicyForm({ policy }: PolicyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableClients, setAvailableClients] = useState<(Client & { person?: any })[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<InsuranceCompany[]>([]);

  const form = useForm<ClientPolicy>({
    resolver: zodResolver(ClientPolicySchema),
    defaultValues: policy || {
      clientId: "",
      insuranceCompanyId: "",
      policyName: "",
      policyNumber: "",
      premiumAmount: 0,
      effectiveDate: new Date().toISOString().split("T")[0],
      renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      paymentSchedule: "monthly",
      paymentAccountId: "",
    },
  });

  useEffect(() => {
    async function fetchData() {
      const [clientResult, companyResult] = await Promise.all([getClients(), getInsuranceCompanies()]);

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

  const selectedCompany = availableCompanies.find((c) => c.id === form.watch("insuranceCompanyId"));
  const selectedClient = availableClients.find((c) => c.id === form.watch("clientId"));

  return (
    <Card className="mx-auto w-full max-w-3xl shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {policy ? "Edit Client Policy" : "Add New Policy"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        if (typeof val === "string") {
                          field.onChange(val);
                          form.setValue("paymentAccountId", ""); // Reset payment account when client changes
                        }
                      }}
                      disabled={!!policy}
                    >
                      <ComboboxInput
                        placeholder="Search clients..."
                        value={
                          selectedClient ? `${selectedClient.person?.firstName} ${selectedClient.person?.lastName}` : ""
                        }
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          {availableClients.map((c) => (
                            <ComboboxItem
                              key={c.id}
                              value={c.id!}
                              label={`${c.person?.firstName} ${c.person?.lastName}`}
                            >
                              {c.person?.firstName} {c.person?.lastName} ({c.person?.email})
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
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
                        if (typeof val === "string") {
                          field.onChange(val);
                          form.setValue("policyName", ""); // Reset policy name when carrier changes
                        }
                      }}
                    >
                      <ComboboxInput placeholder="Search carriers..." value={selectedCompany?.name || ""} />
                      <ComboboxContent>
                        <ComboboxList>
                          {availableCompanies.map((c) => (
                            <ComboboxItem key={c.id} value={c.id!} label={c.name}>
                              {c.name}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                          <SelectItem key={i} value={name}>
                            {name}
                          </SelectItem>
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Premium Amount */}
              <FormField
                control={form.control}
                name="premiumAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Premium Amount ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
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

            <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
              {/* Payment Account */}
              <FormField
                control={form.control}
                name="paymentAccountId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Payment Account
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClient}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedClient ? "Select an account" : "Select client first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedClient?.paymentAccounts && selectedClient.paymentAccounts.length > 0 ? (
                          selectedClient.paymentAccounts.map((account: PaymentAccount) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="_no_accounts" disabled>
                            No accounts found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
              {/* Dates */}
              <FormField
                control={form.control}
                name="effectiveDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
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
                        <Calendar className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-6 font-semibold">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-bold">
                {isLoading ? "Saving..." : policy ? "Update Policy" : "Save Policy"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
