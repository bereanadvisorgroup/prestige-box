"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, CreditCard, DollarSign, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getClients } from "@/actions/clients";
import { getDisabilityInsuranceCompanies } from "@/actions/disability-insurance-companies";
import { getInsuranceAgencies } from "@/actions/insurance-agencies";
import { getLifeInsuranceCompanies } from "@/actions/life-insurance-companies";
import { getLongTermCareInsurances } from "@/actions/long-term-care-insurance";
import { createClientPolicy, updateClientPolicy } from "@/actions/policies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPersonName } from "@/lib/utils";
import {
  type Client,
  type ClientPolicy,
  type ClientPolicyFormInput,
  ClientPolicyFormSchema,
  type ClientPolicyFormValues,
  type DisabilityInsuranceCompany,
  type InsuranceAgency,
  type LifeInsuranceCompany,
  type LongTermCareInsurance,
  type PaymentAccount,
  type Person,
} from "@/types/crm";

interface MergedCompany {
  id?: string;
  name: string;
  type: "life" | "disability" | "long_term_care";
  paymentAccounts?: PaymentAccount[];
  policyNames: string[];
}

export function PolicyForm({ policy }: { policy?: ClientPolicy }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableClients, setAvailableClients] = useState<(Client & { person: Person | null })[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<MergedCompany[]>([]);
  const [availableAgencies, setAvailableAgencies] = useState<InsuranceAgency[]>([]);

  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [carrierSearchQuery, setCarrierSearchQuery] = useState("");

  const form = useForm<ClientPolicyFormInput, any, ClientPolicyFormValues>({
    resolver: zodResolver(ClientPolicyFormSchema),
    defaultValues: policy
      ? {
          id: policy.id,
          clientId: policy.clientId,
          lifeInsuranceCompanyId: policy.lifeInsuranceCompanyId,
          disabilityInsuranceCompanyId: policy.disabilityInsuranceCompanyId,
          longTermCareInsuranceId: policy.longTermCareInsuranceId,
          policyName: policy.policyName,
          policyNumber: policy.policyNumber,
          premiumAmount: policy.premiumAmount,
          effectiveDate: policy.effectiveDate,
          renewalDate: policy.renewalDate,
          paymentSchedule: policy.paymentSchedule,
          paymentAccountId: policy.paymentAccountId,
          isUnderManagement: policy.isUnderManagement ?? false,
          managingAgencyId: policy.managingAgencyId || null,
        }
      : {
          clientId: "",
          lifeInsuranceCompanyId: "",
          disabilityInsuranceCompanyId: null,
          longTermCareInsuranceId: null,
          policyName: "",
          policyNumber: "",
          premiumAmount: 0,
          effectiveDate: new Date().toISOString().split("T")[0],
          renewalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
          paymentSchedule: "monthly",
          paymentAccountId: "",
          isUnderManagement: false,
          managingAgencyId: null,
        },
  });

  useEffect(() => {
    async function fetchData() {
      const [clientResult, lifeResult, disabilityResult, longTermCareResult, agenciesResult] = await Promise.all([
        getClients(),
        getLifeInsuranceCompanies(),
        getDisabilityInsuranceCompanies(),
        getLongTermCareInsurances(),
        getInsuranceAgencies(),
      ]);

      if (clientResult.success && clientResult.clients) {
        setAvailableClients(clientResult.clients);
      }

      if (agenciesResult.success && agenciesResult.insuranceAgencies) {
        setAvailableAgencies(agenciesResult.insuranceAgencies);
      }

      const companiesList: MergedCompany[] = [];
      if (lifeResult.success && lifeResult.companies) {
        companiesList.push(
          ...(lifeResult.companies as LifeInsuranceCompany[]).map((c) => ({ ...c, type: "life" as const })),
        );
      }
      if (disabilityResult.success && disabilityResult.companies) {
        companiesList.push(
          ...(disabilityResult.companies as DisabilityInsuranceCompany[]).map((c) => ({
            ...c,
            type: "disability" as const,
          })),
        );
      }
      if (longTermCareResult.success && longTermCareResult.companies) {
        companiesList.push(
          ...(longTermCareResult.companies as LongTermCareInsurance[]).map((c) => ({
            ...c,
            type: "long_term_care" as const,
          })),
        );
      }
      setAvailableCompanies(companiesList);
    }
    fetchData();
  }, []);

  const selectedCompany = availableCompanies.find((c) => c.id === form.watch("lifeInsuranceCompanyId"));
  const isLifeInsurance = selectedCompany ? selectedCompany.type === "life" : !!form.watch("lifeInsuranceCompanyId");
  const selectedClient = availableClients.find((c) => c.id === form.watch("clientId"));

  const selectedClientName = selectedClient ? formatPersonName(selectedClient.person) : "";
  const selectedCarrierName = selectedCompany?.name || "";

  useEffect(() => {
    setClientSearchQuery(selectedClientName);
  }, [selectedClientName]);

  useEffect(() => {
    setCarrierSearchQuery(selectedCarrierName);
  }, [selectedCarrierName]);

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery) return availableClients;
    if (selectedClientName && clientSearchQuery === selectedClientName) {
      return availableClients;
    }
    return availableClients.filter((c) => {
      const name = formatPersonName(c.person);
      const email = c.person?.emails?.find((e) => e.isPrimary)?.address || c.person?.emails?.[0]?.address || "";
      return (
        name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
        email.toLowerCase().includes(clientSearchQuery.toLowerCase())
      );
    });
  }, [availableClients, clientSearchQuery, selectedClientName]);

  const filteredCompanies = useMemo(() => {
    if (!carrierSearchQuery) return availableCompanies;
    if (selectedCarrierName && carrierSearchQuery === selectedCarrierName) {
      return availableCompanies;
    }
    return availableCompanies.filter((c) => c.name.toLowerCase().includes(carrierSearchQuery.toLowerCase()));
  }, [availableCompanies, carrierSearchQuery, selectedCarrierName]);

  async function onSubmit(values: ClientPolicyFormValues) {
    try {
      setIsLoading(true);
      const isEditing = !!policy?.id;

      const selectedCarrier = availableCompanies.find((c) => c.id === values.lifeInsuranceCompanyId);
      const isDisability = selectedCarrier?.type === "disability";
      const isLongTermCare = selectedCarrier?.type === "long_term_care";

      const finalValues = {
        ...values,
        lifeInsuranceCompanyId: isDisability || isLongTermCare ? null : values.lifeInsuranceCompanyId,
        disabilityInsuranceCompanyId: isDisability ? values.lifeInsuranceCompanyId : null,
        longTermCareInsuranceId: isLongTermCare ? values.lifeInsuranceCompanyId : null,
        managingAgencyId: values.isUnderManagement ? null : values.managingAgencyId || null,
      };

      const result = isEditing
        ? await updateClientPolicy(policy.id!, finalValues)
        : await createClientPolicy(finalValues);

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
                      onValueChange={(val) => {
                        if (typeof val === "string") {
                          field.onChange(val);
                          form.setValue("paymentAccountId", ""); // Reset payment account when client changes
                        }
                      }}
                      inputValue={clientSearchQuery}
                      onInputValueChange={setClientSearchQuery}
                      disabled={!!policy}
                    >
                      <ComboboxInput placeholder="Search clients..." />
                      <ComboboxContent>
                        <ComboboxList>
                          {filteredClients.map((c) => (
                            <ComboboxItem key={c.id} value={c.id!} label={formatPersonName(c.person)}>
                              {formatPersonName(c.person)} (
                              {c.person?.emails?.find((e) => e.isPrimary)?.address ||
                                c.person?.emails?.[0]?.address ||
                                "No Email"}
                              )
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
                name="lifeInsuranceCompanyId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Insurance Carrier</FormLabel>
                    <Combobox
                      value={field.value}
                      onValueChange={(val) => {
                        if (typeof val === "string") {
                          field.onChange(val);
                          form.setValue("policyName", ""); // Reset policy name when carrier changes
                        }
                      }}
                      inputValue={carrierSearchQuery}
                      onInputValueChange={setCarrierSearchQuery}
                    >
                      <ComboboxInput placeholder="Search carriers..." />
                      <ComboboxContent>
                        <ComboboxList>
                          {filteredCompanies.map((c) => (
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
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedClient}>
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

              {/* Under our Management */}
              <FormField
                control={form.control}
                name="isUnderManagement"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3.5 shadow-xs self-end h-10 bg-background">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue("managingAgencyId", null);
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer font-medium text-sm">Under our Management</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Managing Insurance Agency */}
              {!form.watch("isUnderManagement") && (
                <FormField
                  control={form.control}
                  name="managingAgencyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Managing Insurance Agency</FormLabel>
                      <Select value={field.value || ""} onValueChange={(val) => field.onChange(val || null)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Insurance Agency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableAgencies && availableAgencies.length > 0 ? (
                            availableAgencies.map((agency) => (
                              <SelectItem key={agency.id} value={agency.id || ""}>
                                {agency.firmName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="_none" disabled>
                              No Insurance Agencies found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                    <FormLabel>{isLifeInsurance ? "Anniversary Date" : "Renewal Date"}</FormLabel>
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
