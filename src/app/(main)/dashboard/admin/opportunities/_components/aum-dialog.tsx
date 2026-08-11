"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { updateDefaultAumPerc } from "@/actions/opportunity-pipelines";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const aumFormSchema = z.object({
  aumPerc: z
    .string()
    .min(1, "Default AUM % is required")
    .refine((val) => {
      const parsed = Number.parseFloat(val);
      return !Number.isNaN(parsed) && parsed >= 0;
    }, "Must be a valid non-negative number"),
});

type AumFormValues = z.infer<typeof aumFormSchema>;

interface AumDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultValue: number;
}

export function AumDialog({ isOpen, onClose, defaultValue }: AumDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AumFormValues>({
    resolver: zodResolver(aumFormSchema),
    defaultValues: {
      aumPerc: defaultValue.toString(),
    },
  });

  // Keep form in sync if defaultValue changes or dialog re-opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        aumPerc: defaultValue.toString(),
      });
    }
  }, [isOpen, defaultValue, form]);

  const onSubmit = async (values: AumFormValues) => {
    setIsLoading(true);
    try {
      const val = Number.parseFloat(values.aumPerc);
      const result = await updateDefaultAumPerc(val);

      if (result.success) {
        toast.success("Default AUM % updated successfully");
        router.refresh();
        onClose();
      } else {
        toast.error(result.error || "Failed to update Default AUM %");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Default AUM %</DialogTitle>
          <DialogDescription>
            This value will be used as the default AUM percentage across opportunities.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="aumPerc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default AUM %</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        placeholder="1.0"
                        disabled={isLoading}
                        className="pr-8"
                        {...field}
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">
                        %
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-semibold shadow-sm">
                {isLoading && <Spinner className="mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
