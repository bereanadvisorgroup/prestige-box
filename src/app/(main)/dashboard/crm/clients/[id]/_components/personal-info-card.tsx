"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Fingerprint, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SsnInput } from "@/components/ui/ssn-input";
import { type Client, DriversLicenseSchema, PiiSchema } from "@/types/crm";

const EditPersonalSchema = z.object({
  driversLicense: DriversLicenseSchema,
  pii: PiiSchema,
});

type EditPersonalValues = z.infer<typeof EditPersonalSchema>;

export function PersonalInfoCard({ client }: { client: Client }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSSN, setShowSSN] = useState(false);

  const form = useForm<EditPersonalValues>({
    resolver: zodResolver(EditPersonalSchema),
    defaultValues: {
      driversLicense: {
        number: client.driversLicense?.number ?? "",
        issueState: client.driversLicense?.issueState ?? "",
        issueDate: client.driversLicense?.issueDate ?? "",
        expirationDate: client.driversLicense?.expirationDate ?? "",
      },
      pii: {
        ssn: client.pii?.ssn ?? "",
        biologicalGender: client.pii?.biologicalGender ?? undefined,
        birthDate: client.pii?.birthDate ?? "",
      },
    },
  });

  async function onSubmit(values: EditPersonalValues) {
    try {
      setIsLoading(true);
      const submission = { ...values };

      // Clean up empty optional compound objects if not fully filled out
      if (!submission.driversLicense?.number && !submission.driversLicense?.issueState) {
        // @ts-expect-error
        submission.driversLicense = null;
      }
      if (!submission.pii?.ssn && !submission.pii?.biologicalGender && !submission.pii?.birthDate) {
        // @ts-expect-error
        submission.pii = null;
      }

      const result = await updateClient(client.id!, submission);

      if (result.success) {
        toast.success("Personal information updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update personal information");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const hasData = client.pii || client.driversLicense?.number;

  return (
    <Card className="h-full border-none shadow-md">
      <CardHeader className="border-b bg-muted/10 pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-primary" /> Personal Information
          </span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Personal Information</DialogTitle>
                <DialogDescription>
                  Update the client's driver's license and personal identifiable information.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Drivers License */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Driver's License</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="driversLicense.number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DL Number</FormLabel>
                            <FormControl>
                              <Input placeholder="D12345678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="driversLicense.issueState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue State</FormLabel>
                            <FormControl>
                              <Input placeholder="CA" maxLength={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="driversLicense.issueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issue Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="driversLicense.expirationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiration Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* PII */}
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold text-sm">Personal Identifiable Information (PII)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pii.ssn"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>SSN</FormLabel>
                            <div className="relative">
                              <FormControl>
                                <SsnInput type={showSSN ? "text" : "password"} placeholder="XXX-XX-XXXX" {...field} />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowSSN(!showSSN)}
                              >
                                {showSSN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">{showSSN ? "Hide SSN" : "Show SSN"}</span>
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pii.biologicalGender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Biological Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pii.birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birth Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {!hasData ? (
          <p className="text-muted-foreground text-sm">No personal information listed.</p>
        ) : (
          <>
            {client.pii && (
              <div className="grid grid-cols-2 gap-4">
                {client.pii.birthDate && (
                  <div>
                    <p className="font-medium text-muted-foreground text-xs">Date of Birth</p>
                    <p className="mt-0.5 font-semibold text-sm">{client.pii.birthDate}</p>
                  </div>
                )}
                {client.pii.biologicalGender && (
                  <div>
                    <p className="font-medium text-muted-foreground text-xs">Biological Gender</p>
                    <p className="mt-0.5 font-semibold text-sm">{client.pii.biologicalGender}</p>
                  </div>
                )}
                {client.pii.ssn && (
                  <div className="col-span-2">
                    <p className="font-medium text-muted-foreground text-xs">Social Security Number (SSN)</p>
                    <p className="mt-0.5 font-mono font-semibold text-sm">***-**-{client.pii.ssn.slice(-4)}</p>
                  </div>
                )}
              </div>
            )}

            {client.driversLicense?.number && (
              <div className="mt-2 border-t pt-4">
                <p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Driver's License
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">License Number</p>
                    <p className="font-mono font-semibold">{client.driversLicense.number}</p>
                  </div>
                  {client.driversLicense.issueState && (
                    <div>
                      <p className="text-muted-foreground text-xs">State</p>
                      <p className="font-semibold">{client.driversLicense.issueState}</p>
                    </div>
                  )}
                  {client.driversLicense.issueDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">Issue Date</p>
                      <p className="font-semibold">{client.driversLicense.issueDate}</p>
                    </div>
                  )}
                  {client.driversLicense.expirationDate && (
                    <div>
                      <p className="text-muted-foreground text-xs">Expiration Date</p>
                      <p className="font-semibold">{client.driversLicense.expirationDate}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
