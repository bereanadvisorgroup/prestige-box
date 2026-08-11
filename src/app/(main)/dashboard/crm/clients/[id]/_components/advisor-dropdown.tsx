"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { User } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client } from "@/types/crm";

interface AdvisorDropdownProps {
  client: Client;
  advisors: {
    uid: string;
    firstName: string;
    lastName: string;
    role: string;
  }[];
}

export function AdvisorDropdown({ client, advisors }: AdvisorDropdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentAdvisorId, setCurrentAdvisorId] = useState<string>(client.advisorId || "none");

  const handleAdvisorChange = async (value: string) => {
    const nextValue = value === "none" ? null : value;

    startTransition(async () => {
      try {
        const res = await updateClient(client.id!, { advisorId: nextValue });
        if (res.success) {
          setCurrentAdvisorId(value);
          toast.success("Assigned advisor updated successfully.");
          router.refresh();
        } else {
          toast.error(res.error || "Failed to update advisor assignment.");
        }
      } catch (error) {
        toast.error("An unexpected error occurred.");
        console.error(error);
      }
    });
  };

  return (
    <Select value={currentAdvisorId} onValueChange={handleAdvisorChange} disabled={isPending}>
      <SelectTrigger className="w-[180px] bg-background">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Assign Advisor" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none" className="text-muted-foreground italic">
          Unassigned
        </SelectItem>
        {advisors.map((advisor) => (
          <SelectItem key={advisor.uid} value={advisor.uid}>
            {advisor.firstName} {advisor.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
