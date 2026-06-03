"use client";

import { PersonForm } from "@/app/(main)/dashboard/crm/people/_components/person-form";
import type { Person } from "@/types/crm";

export function PersonalTab({ person }: { person: Person }) {
  return (
    <div className="animate-in fade-in duration-500">
      <PersonForm
        person={person}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
