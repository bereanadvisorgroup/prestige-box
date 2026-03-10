import type { User as FirebaseUser } from "firebase/auth";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type UserRole = "admin" | "employee" | "client";

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  photoURL?: string;
  createdAt?: string;
}

interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: FirebaseUser | null) => void;
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
