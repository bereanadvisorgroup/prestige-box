"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

import { createReferralType, updateReferralType } from "@/actions/referral-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type ReferralType, ReferralTypeSchema } from "@/types/crm";

interface ReferralTypeFormProps {
  referralType?: ReferralType;
}

export function ReferralTypeForm({ referralType }: ReferralTypeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof ReferralTypeSchema>>({
    resolver: zodResolver(ReferralTypeSchema),
    defaultValues: referralType
      ? {
          id: referralType.id,
          name: referralType.name,
        }
      : {
          name: "",
        },
  });

  const onSubmit = async (values: z.infer<typeof ReferralTypeSchema>) => {
    setIsLoading(true);
    try {
      if (referralType?.id) {
        // Edit mode
        const result = await updateReferralType(referralType.id, values);
        if (result.success) {
          toast.success("Referral type updated successfully");
          router.push("/dashboard/admin/referral-types");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update referral type");
        }
      } else {
        // Create mode
        const result = await createReferralType(values);
        if (result.success) {
          toast.success("Referral type added successfully");
          router.push("/dashboard/admin/referral-types");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to add referral type");
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
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/admin/referral-types")}
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
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-bold text-xl">
                {referralType ? "Edit Referral Type" : "Add Referral Type"}
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
                          placeholder="e.g., Cold Call"
                          disabled={isLoading}
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>The unique name of the referral type.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => router.push("/dashboard/admin/referral-types")}
                    className="font-medium"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="font-semibold shadow-sm">
                    {isLoading ? "Saving..." : referralType ? "Save Changes" : "Add Referral Type"}
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
