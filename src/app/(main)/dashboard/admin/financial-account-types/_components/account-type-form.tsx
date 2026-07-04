"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Database } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

import { createFinancialAccountType, updateFinancialAccountType } from "@/actions/financial-account-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type FinancialAccountType, FinancialAccountTypeSchema } from "@/types/crm";

interface AccountTypeFormProps {
  accountType?: FinancialAccountType;
}

export function AccountTypeForm({ accountType }: AccountTypeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof FinancialAccountTypeSchema>>({
    resolver: zodResolver(FinancialAccountTypeSchema),
    defaultValues: accountType
      ? {
          id: accountType.id,
          name: accountType.name,
        }
      : {
          name: "",
        },
  });

  const onSubmit = async (values: z.infer<typeof FinancialAccountTypeSchema>) => {
    setIsLoading(true);
    try {
      if (accountType?.id) {
        // Edit mode
        const result = await updateFinancialAccountType(accountType.id, values);
        if (result.success) {
          toast.success("Financial Account Type updated successfully");
          router.push("/dashboard/admin/financial-account-types");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update financial account type");
        }
      } else {
        // Create mode
        const result = await createFinancialAccountType(values);
        if (result.success) {
          toast.success("Financial Account Type added successfully");
          router.push("/dashboard/admin/financial-account-types");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to add financial account type");
        }
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/admin/financial-account-types")}
          className="group text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to list
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-bold text-xl">
                {accountType ? "Edit Financial Account Type" : "Add Financial Account Type"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Solo 401K"
                          disabled={isLoading}
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>The unique name of the financial account type.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => router.push("/dashboard/admin/financial-account-types")}
                    className="font-medium"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="font-semibold shadow-sm">
                    {isLoading ? "Saving..." : accountType ? "Save Changes" : "Add Account Type"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
