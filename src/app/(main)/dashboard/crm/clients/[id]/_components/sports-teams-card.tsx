"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { sportsTeams } from "@/data/sports-teams";
import type { Client } from "@/types/crm";

interface SportsTeamsCardProps {
  client: Client;
}

export function SportsTeamsCard({ client }: SportsTeamsCardProps) {
  const router = useRouter();
  const [favoriteTeams, setFavoriteTeams] = useState<string[]>(client.favoriteSportsTeams || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFavoriteTeams(client.favoriteSportsTeams || []);
  }, [client.favoriteSportsTeams]);

  const handleUpdate = async (nextTeams: string[]) => {
    try {
      setIsLoading(true);
      const res = await updateClient(client.id!, { favoriteSportsTeams: nextTeams });
      if (res.success) {
        toast.success("Favorite sports teams updated");
        router.refresh();
      } else {
        throw new Error(res.error || "Failed to update sports teams");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update sports teams");
      setFavoriteTeams(client.favoriteSportsTeams || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSportsTeam = (teamName: string) => {
    const next = favoriteTeams.includes(teamName)
      ? favoriteTeams.filter((t) => t !== teamName)
      : [...favoriteTeams, teamName];
    setFavoriteTeams(next);
    handleUpdate(next);
  };

  return (
    <Card className="border-none shadow-sm transition-shadow hover:shadow-md flex flex-col h-full min-h-[220px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-medium tracking-tight text-neutral-800 dark:text-neutral-200">
          Sports Teams:
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex-1 flex flex-wrap gap-2 overflow-y-auto max-h-[160px] mb-4 pr-1 scrollbar-thin content-start">
          {favoriteTeams.length > 0 ? (
            favoriteTeams.map((teamName, index) => (
              <Badge
                key={index}
                variant="default"
                className="gap-1 bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
              >
                {teamName}
                <button
                  type="button"
                  onClick={() => handleToggleSportsTeam(teamName)}
                  className="ml-1 text-primary-foreground/75 hover:text-primary-foreground focus:outline-none"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic py-2">No sports teams linked.</p>
          )}
        </div>
        <div className="mt-auto">
          <Combobox
            onValueChange={(val: any) => {
              if (typeof val === "string") handleToggleSportsTeam(val);
            }}
            disabled={isLoading}
          >
            <ComboboxInput placeholder="Search teams (NFL, NBA, MLB...)" className="h-8 text-xs border-neutral-300" />
            <ComboboxContent>
              <ComboboxList>
                {sportsTeams
                  .filter((team) => !favoriteTeams.includes(team.name))
                  .map((team) => (
                    <ComboboxItem key={team.id} value={team.name}>
                      <span className="mr-2 font-bold text-muted-foreground text-xs">[{team.league}]</span>
                      {team.name}
                    </ComboboxItem>
                  ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </CardContent>
    </Card>
  );
}
