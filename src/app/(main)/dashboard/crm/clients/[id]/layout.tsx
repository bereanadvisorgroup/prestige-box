import Link from "next/link";
import { notFound } from "next/navigation";

import { Pencil } from "lucide-react";

import { getClient } from "@/actions/clients";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Person } from "@/types/crm";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const clientResult = await getClient(id);

  if (!clientResult.success || !clientResult.client) {
    notFound();
  }

  const person = clientResult.person as Person | null;
  const initials = `${person?.firstName?.[0] || ""}${person?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="fade-in mx-auto w-full max-w-7xl animate-in space-y-8 px-4 py-8 duration-500 md:px-6">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            {person?.photoUrl && (
              <AvatarImage
                src={person.photoUrl}
                alt={`${person.firstName} ${person.lastName}`}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-primary/5 text-2xl text-primary">{initials || "CL"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              {person ? `${person.firstName} ${person.lastName}` : "Client Profile"}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/crm/clients/${id}/personal`}>
            <Button>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border bg-background/50 shadow-sm backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
