"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { auth, db } from "@/lib/firebase.client";
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

  const handleAuthUser = async (user: User) => {
    setUser(user);

    // Fetch User Profile & Role from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    let profile: UserProfile;

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      profile = {
        uid: user.uid,
        email: user.email,
        role: userData.role as UserRole, // 'admin', 'employee', or 'client'
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone || "",
        photoURL: userData.photoURL || user.photoURL || "",
      };
    } else {
      // Auto-create user profile as a client
      profile = {
        uid: user.uid,
        email: user.email,
        role: "client", // Default role
        firstName: user.displayName?.split(" ")[0] || "",
        lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        phone: user.phoneNumber || "",
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, profile);
    }

    setProfile(profile);
    toast.success("Login successful!");
    router.push("/dashboard/default");
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      await handleAuthUser(userCredential.user);
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error(error.message || "Invalid email or password.");
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
    } catch (error: any) {
      console.error("Google Login Error:", error);
      toast.error(error.message || "Could not authenticate with Google.");
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
              <FormLabel>Password</FormLabel>
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

      <div className="relative my-6 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
        <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-1">
        <GoogleButton type="button" onClick={onGoogleLogin} />
      </div>
    </Form>
  );
}
