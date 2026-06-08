"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase.client";
import { type UserProfile, type UserRole, useAuthStore } from "@/stores/auth.store";

import { GoogleButton } from "./social-auth/google-button";

const FormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

export function LoginForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const { setUser, setProfile, setLoading } = useAuthStore();
  const router = useRouter();

  const handleAuthUser = async (user: import("@supabase/supabase-js").User) => {
    setUser(user);

    // Fetch User Profile & Role from Supabase
    const { data: userData, error: fetchError } = await supabase.from("users").select("*").eq("uid", user.id).single();

    let profile: UserProfile;

    if (userData && !fetchError) {
      profile = {
        uid: user.id,
        email: user.email ?? null,
        role: userData.role as UserRole,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || "",
        photoURL: userData.photoURL || user.user_metadata?.avatar_url || "",
      };
    } else {
      // Auto-create user profile as a client
      const fullName = user.user_metadata?.full_name || "";
      profile = {
        uid: user.id,
        email: user.email ?? null,
        role: "client",
        firstName: user.user_metadata?.firstName || fullName.split(" ")[0] || "",
        lastName: user.user_metadata?.lastName || fullName.split(" ").slice(1).join(" ") || "",
        phone: user.phone || "",
        photoURL: user.user_metadata?.avatar_url || "",
        createdAt: new Date().toISOString(),
      };
      await supabase.from("users").insert(profile);
    }

    setProfile(profile);
    toast.success("Login successful!");
    router.push("/dashboard/default");
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setLoading(true);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      await handleAuthUser(authData.user);
    } catch (error) {
      console.error("Login Error:", error);
      toast.error((error as { message: string }).message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard/default`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error((error as { message: string }).message || "Could not authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link href="/auth/v1/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <FormControl>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center">
              <FormControl>
                <Checkbox
                  id="login-remember"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="size-4"
                />
              </FormControl>
              <FormLabel htmlFor="login-remember" className="ml-1 font-medium text-muted-foreground text-sm">
                Remember me for 30 days
              </FormLabel>
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit">
          Login
        </Button>
      </form>

      <div className="relative my-6 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-1">
        <GoogleButton type="button" onClick={onGoogleLogin} />
      </div>
    </Form>
  );
}
