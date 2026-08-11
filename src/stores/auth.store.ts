import type { User as SupabaseUser } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SocialMediaAccount } from "@/types/crm";

export type UserRole = "admin" | "advisor" | "client";

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  photoURL?: string;
  socialMedia?: SocialMediaAccount[];
  googlePhotoURL?: string | null;
  providers?: string[];
  createdAt?: string;
}

interface AuthState {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: SupabaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, profile: null }),
    }),
    {
      name: "auth-storage", // stores auth state in local storage to prevent flash on reload
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ profile: state.profile }), // only persist profile data
    },
  ),
);
