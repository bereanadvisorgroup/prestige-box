import type { Metadata } from "next";

import { ProfileForm } from "./_components/profile-form";

export const metadata: Metadata = {
  title: "My Profile | Prestige Box",
  description: "Manage your personal profile, contact details, and account photo.",
};

export default function ProfilePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight" id="profile-heading">
          My Profile
        </h1>
      </header>
      <section
        className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm"
        aria-labelledby="profile-heading"
      >
        <ProfileForm />
      </section>
    </main>
  );
}
