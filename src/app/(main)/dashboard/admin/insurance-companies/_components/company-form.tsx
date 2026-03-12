"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Globe, ListPlus } from "lucide-react";

import { InsuranceCompany, InsuranceCompanySchema } from "@/types/crm";
import { createInsuranceCompany, updateInsuranceCompany } from "@/actions/insurance-companies";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompanyFormProps {
  company?: InsuranceCompany;
}

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");

  const form = useForm<InsuranceCompany>({
    resolver: zodResolver(InsuranceCompanySchema),
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
    form.setValue("policyNames", current.filter(n => n !== name));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {company ? "Edit Insurance Company" : "Add Insurance Company"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="progressive.com" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
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
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPolicy();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddPolicy}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 min-h-[40px] p-2 bg-muted/20 rounded-md border">
                {form.watch("policyNames").length === 0 && (
                  <span className="text-xs text-muted-foreground p-1 italic">No policies added yet.</span>
                )}
                {form.watch("policyNames").map((policy, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="gap-1 px-3 py-1 group"
                  >
                    {policy}
                    <button 
                      type="button" 
                      onClick={() => handleRemovePolicy(policy)}
                      className="ml-1 rounded-full hover:bg-destructive-foreground/20 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
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
                {isLoading ? "Saving..." : (company ? "Update Company" : "Create Company")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
