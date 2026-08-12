"use client";

import React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleAuthProvider, OAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useLogger } from "next-axiom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase.client";
import { type UserProfile, type UserRole, useAuthStore } from "@/stores/auth.store";

import { GoogleButton } from "./social-auth/google-button";
import { MicrosoftButton } from "./social-auth/microsoft-button";

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

  const { setUser, setProfile, setLoading, isLoading } = useAuthStore();
  const router = useRouter();
  const log = useLogger();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const handleAuthUser = async (user: FirebaseUser) => {
    setUser(user);

    // Fetch User Profile & Role from Firestore users collection
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.data();

    let profile: UserProfile;

    if (userData) {
      profile = {
        uid: user.uid,
        email: user.email ?? null,
        role: (userData.role as UserRole) || "client",
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || "",
        photoURL: userData.photoURL || user.photoURL || "",
      };
      setProfile(profile);
      log.info("User logged in", { userId: user.uid, email: user.email, role: profile.role });
      toast.success("Login successful!");
      const defaultRoute =
        profile.role === "admin" || profile.role === "advisor" ? "/dashboard/crm" : "/dashboard/default";
      router.push(defaultRoute);
    } else {
      // User is not in users collection - deny access
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      log.warn("Unauthorized login attempt", { userId: user.uid, email: user.email });
      toast.error("Access Denied. Your account has not been created by an administrator.");
      router.push("/login/no-account");
    }
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      await handleAuthUser(userCredential.user);
    } catch (error) {
      console.error("Login Error:", error);
      log.error("Login failed", { error: (error as Error).message });
      toast.error((error as { message: string }).message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await handleAuthUser(userCredential.user);
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error((error as { message: string }).message || "Could not authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  const onMicrosoftLogin = async () => {
    try {
      setLoading(true);
      const provider = new OAuthProvider("microsoft.com");
      const userCredential = await signInWithPopup(auth, provider);
      await handleAuthUser(userCredential.user);
    } catch (error) {
      console.error("Microsoft Login Error:", error);
      toast.error((error as { message: string }).message || "Could not authenticate with Microsoft.");
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
                <Link href="/auth/v1/forgot-password" className="text-primary text-xs hover:underline">
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
        <Button className="w-full" type="submit" disabled={!mounted || isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="relative my-6 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-1">
        <GoogleButton type="button" onClick={onGoogleLogin} />
        <MicrosoftButton type="button" onClick={onMicrosoftLogin} />
      </div>
    </Form>
  );
}
