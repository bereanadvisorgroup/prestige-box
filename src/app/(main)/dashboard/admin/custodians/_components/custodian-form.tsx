"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

import { createCustodian, updateCustodian } from "@/actions/custodians";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type Custodian, CustodianSchema } from "@/types/crm";

interface CustodianFormProps {
  custodian?: Custodian;
}

export function CustodianForm({ custodian }: CustodianFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof CustodianSchema>>({
    resolver: zodResolver(CustodianSchema),
    defaultValues: custodian
      ? {
          id: custodian.id,
          name: custodian.name,
        }
      : {
          name: "",
        },
  });

  const onSubmit = async (values: z.infer<typeof CustodianSchema>) => {
    setIsLoading(true);
    try {
      if (custodian?.id) {
        // Edit mode
        const result = await updateCustodian(custodian.id, values);
        if (result.success) {
          toast.success("Custodian updated successfully");
          router.push("/dashboard/admin/custodians");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update custodian");
        }
      } else {
        // Create mode
        const result = await createCustodian(values);
        if (result.success) {
          toast.success("Custodian added successfully");
          router.push("/dashboard/admin/custodians");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to add custodian");
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
          onClick={() => router.push("/dashboard/admin/custodians")}
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
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-bold text-xl">{custodian ? "Edit Custodian" : "Add Custodian"}</CardTitle>
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
                        <Input placeholder="e.g., Axos" disabled={isLoading} className="bg-background" {...field} />
                      </FormControl>
                      <FormDescription>The unique name of the custodian.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => router.push("/dashboard/admin/custodians")}
                    className="font-medium"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="font-semibold shadow-sm">
                    {isLoading ? "Saving..." : custodian ? "Save Changes" : "Add Custodian"}
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
