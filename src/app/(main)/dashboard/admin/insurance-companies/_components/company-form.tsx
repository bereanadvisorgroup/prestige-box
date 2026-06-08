"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, ListPlus, Shield, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createInsuranceCompany, updateInsuranceCompany } from "@/actions/insurance-companies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type InsuranceCompany, InsuranceCompanySchema } from "@/types/crm";

interface CompanyFormProps {
  company?: InsuranceCompany;
}

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");

  const form = useForm<InsuranceCompany>({
    resolver: zodResolver(InsuranceCompanySchema) as any,
    defaultValues: company || {
      name: "",
      websiteUrl: "",
      policyNames: [],
    },
  });

  async function onSubmit(values: InsuranceCompany) {
    try {
      setIsLoading(true);
      const isEditing = !!company?.id;

      let result;
      if (isEditing) {
        result = await updateInsuranceCompany(company.id!, values);
      } else {
        result = await createInsuranceCompany(values);
      }

      if (result.success) {
        toast.success(isEditing ? "Insurance company updated" : "Insurance company created");
        router.push("/dashboard/admin/insurance-companies");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} company`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddPolicy = () => {
    if (!newPolicyName.trim()) return;
    const current = form.getValues("policyNames");
    if (current.includes(newPolicyName.trim())) {
      toast.error("Policy already exists");
      return;
    }
    form.setValue("policyNames", [...current, newPolicyName.trim()]);
    setNewPolicyName("");
  };

  const handleRemovePolicy = (name: string) => {
    const current = form.getValues("policyNames");
    form.setValue(
      "policyNames",
      current.filter((n) => n !== name),
    );
  };

  return (
    <Card className="mx-auto w-full max-w-2xl shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Shield className="h-5 w-5 text-primary" />
          {company ? "Edit Insurance Company" : "Add Insurance Company"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Progressive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="progressive.com" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="flex items-center gap-2 font-semibold text-sm">
                  <ListPlus className="h-4 w-4" />
                  Supported Policy Names
                </h3>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Homeowners Gold"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPolicy();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddPolicy}>
                  Add
                </Button>
              </div>

              <div className="mt-4 flex min-h-[40px] flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
                {form.watch("policyNames").length === 0 && (
                  <span className="p-1 text-muted-foreground text-xs italic">No policies added yet.</span>
                )}
                {form.watch("policyNames").map((policy, index) => (
                  <Badge key={index} variant="secondary" className="group gap-1 px-3 py-1">
                    {policy}
                    <button
                      type="button"
                      onClick={() => handleRemovePolicy(policy)}
                      className="ml-1 rounded-full transition-colors hover:bg-destructive-foreground/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6 font-semibold">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-bold">
                {isLoading ? "Saving..." : company ? "Update Company" : "Create Company"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
