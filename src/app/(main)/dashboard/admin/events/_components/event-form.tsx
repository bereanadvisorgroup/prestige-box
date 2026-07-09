"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

import { createEvent, updateEvent } from "@/actions/events";
import { AddressSearchSelect } from "@/components/crm/address-search-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type Address, type Event, EventSchema } from "@/types/crm";

interface EventFormProps {
  event?: Event;
  addresses: Address[];
}

const formatForInput = (isoString?: string | null) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export function EventForm({ event, addresses = [] }: EventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [addressList, setAddressList] = useState<Address[]>(addresses);

  const form = useForm<z.infer<typeof EventSchema>>({
    resolver: zodResolver(EventSchema),
    defaultValues: event
      ? {
          id: event.id,
          title: event.title,
          addressId: event.addressId || null,
          startDate: event.startDate || null,
          endDate: event.endDate || null,
        }
      : {
          title: "",
          addressId: null,
          startDate: null,
          endDate: null,
        },
  });

  const onSubmit = async (values: z.infer<typeof EventSchema>) => {
    setIsLoading(true);
    try {
      if (event?.id) {
        // Edit mode
        const result = await updateEvent(event.id, values);
        if (result.success) {
          toast.success("Event updated successfully");
          router.push("/dashboard/admin/events");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update event");
        }
      } else {
        // Create mode
        const result = await createEvent(values);
        if (result.success) {
          toast.success("Event added successfully");
          router.push("/dashboard/admin/events");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to add event");
        }
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressCreated = (newAddr: Address) => {
    setAddressList((prev) => [...prev, newAddr]);
    form.setValue("addressId", newAddr.id || "", { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard/admin/events")}
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
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-bold text-xl">{event ? "Edit Event" : "Add Event"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Event Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., PacLife Annual Gala"
                          disabled={isLoading}
                          className="bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>The title/name of the event.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">Start Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            disabled={isLoading}
                            value={field.value ? formatForInput(field.value) : ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)
                            }
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground">End Date & Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            disabled={isLoading}
                            value={field.value ? formatForInput(field.value) : ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)
                            }
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="addressId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <FormLabel className="font-semibold text-foreground">Location Address</FormLabel>
                      <FormControl>
                        <AddressSearchSelect
                          value={field.value || ""}
                          onValueChange={(val) => form.setValue("addressId", val || null, { shouldValidate: true })}
                          addresses={addressList}
                          onAddressCreated={handleAddressCreated}
                          placeholder="Search or add an address..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => router.push("/dashboard/admin/events")}
                    className="font-medium"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="font-semibold shadow-sm">
                    {isLoading ? "Saving..." : event ? "Save Changes" : "Add Event"}
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
