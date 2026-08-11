"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Client } from "@/types/crm";

interface InterestsCardProps {
  client: Client;
}

export function InterestsCard({ client }: InterestsCardProps) {
  const router = useRouter();
  const [hobbies, setHobbies] = useState<string[]>(client.hobbies || []);
  const [hobbyInput, setHobbyInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setHobbies(client.hobbies || []);
  }, [client.hobbies]);

  const handleUpdate = async (nextHobbies: string[]) => {
    try {
      setIsLoading(true);
      const res = await updateClient(client.id!, { hobbies: nextHobbies });
      if (res.success) {
        toast.success("Interests updated");
        router.refresh();
      } else {
        throw new Error(res.error || "Failed to update interests");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update interests");
      setHobbies(client.hobbies || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHobby = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = hobbyInput.trim();
    if (!clean) return;
    if (hobbies.includes(clean)) {
      toast.error("Hobby already listed");
      return;
    }
    const next = [...hobbies, clean];
    setHobbies(next);
    handleUpdate(next);
    setHobbyInput("");
  };

  const handleRemoveHobby = (hobby: string) => {
    const next = hobbies.filter((h) => h !== hobby);
    setHobbies(next);
    handleUpdate(next);
  };

  return (
    <Card className="border-none shadow-sm transition-shadow hover:shadow-md flex flex-col h-full min-h-[220px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-medium tracking-tight text-neutral-800 dark:text-neutral-200">
          Interests:
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex-1 flex flex-wrap gap-2 overflow-y-auto max-h-[160px] mb-4 pr-1 scrollbar-thin content-start">
          {hobbies.length > 0 ? (
            hobbies.map((hobby, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="gap-1 px-2.5 py-1 text-xs border border-neutral-200 dark:border-zinc-800 font-medium"
              >
                {hobby}
                <button
                  type="button"
                  onClick={() => handleRemoveHobby(hobby)}
                  className="ml-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 focus:outline-none"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic py-2">No interests listed.</p>
          )}
        </div>
        <form onSubmit={handleAddHobby} className="flex gap-2 mt-auto">
          <Input
            placeholder="e.g. Golfing, Cooking..."
            value={hobbyInput}
            onChange={(e) => setHobbyInput(e.target.value)}
            disabled={isLoading}
            className="h-8 text-xs bg-neutral-50 dark:bg-zinc-950 border-neutral-300 focus-visible:ring-neutral-400"
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            disabled={isLoading || !hobbyInput.trim()}
            className="h-8 w-8 border-neutral-300 hover:bg-neutral-100"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
