"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { createUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formSchema = z
  .object({
    firstName: z.string().optional().or(z.literal("")),
    lastName: z.string().optional().or(z.literal("")),
    email: z.string().optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(/[\W_]/, "Password must contain at least one special character.")
      .optional()
      .or(z.literal("")),
    role: z.string().min(1, "Please select a role."),
  })
  .superRefine((data, ctx) => {
    if (data.role !== "client") {
      if (!data.firstName || data.firstName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "First name must be at least 2 characters.",
          path: ["firstName"],
        });
      }
      if (!data.lastName || data.lastName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Last name must be at least 2 characters.",
          path: ["lastName"],
        });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email || !emailRegex.test(data.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid email address.",
          path: ["email"],
        });
      }
    }
  });

export function AddUserForm({ unlinkedClients = [] }: { unlinkedClients?: any[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Record<string, string>>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "client",
    },
  });

  const watchRole = form.watch("role");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (watchRole === "client") return;

    try {
      setIsLoading(true);
      const result = await createUser({
        email: values.email!,
        password: values.password || undefined,
        firstName: values.firstName!,
        lastName: values.lastName!,
        role: values.role,
        origin: window.location.origin,
      });

      if (result.success) {
        toast.success("User created successfully");
        router.push("/dashboard/admin/users");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create user");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateClientUser(client: any) {
    const person = client.person;
    if (!person || !person.emails || person.emails.length === 0) {
      toast.error("This client has no email address.");
      return;
    }

    const primaryEmail = person.emails.find((e: any) => e.isPrimary)?.address || person.emails[0].address;
    const selectedEmail = selectedEmails[client.id] || primaryEmail;

    try {
      setIsLoading(true);
      const result = await createUser({
        email: selectedEmail,
        firstName: person.firstName,
        lastName: person.lastName,
        role: "client",
        origin: window.location.origin,
      });

      if (result.success) {
        toast.success("Client account created and setup email sent!");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create client user");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="advisor">Advisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchRole !== "client" && (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </>
          )}
        </form>
      </Form>

      {watchRole === "client" && (
        <div className="mt-8 space-y-4">
          <div>
            <h3 className="font-medium text-lg">Clients Without Accounts</h3>
            <p className="text-muted-foreground text-sm">
              Select a client to create a user account and send a setup email.
            </p>
          </div>

          {unlinkedClients.length === 0 ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
              All clients have user accounts or no clients exist with email addresses.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Select Email</TableHead>
                    <TableHead className="w-[150px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unlinkedClients.map((client) => {
                    const person = client.person;
                    if (!person || !person.emails || person.emails.length === 0) return null;

                    const primaryEmail =
                      person.emails.find((e: any) => e.isPrimary)?.address || person.emails[0].address;
                    const currentValue = selectedEmails[client.id] || primaryEmail;

                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {person.firstName} {person.lastName}
                        </TableCell>
                        <TableCell>
                          {person.emails.length > 1 ? (
                            <Select
                              value={currentValue}
                              onValueChange={(val) => setSelectedEmails((prev) => ({ ...prev, [client.id]: val }))}
                            >
                              <SelectTrigger className="w-[250px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {person.emails.map((e: any) => (
                                  <SelectItem key={e.id} value={e.address}>
                                    {e.address} {e.isPrimary && "(Primary)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground text-sm">{primaryEmail}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleCreateClientUser(client)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create Account
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
