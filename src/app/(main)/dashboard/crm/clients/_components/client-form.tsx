"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { User, Plus, Trash2, Heart, Trophy, Search } from "lucide-react";

import { Client, ClientSchema, Person } from "@/types/crm";
import { createClient, updateClient } from "@/actions/clients";
import { getPeople } from "@/actions/people";
import { sportsTeams } from "@/data/sports-teams";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";

interface ClientFormProps {
  client?: Client;
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");

  const form = useForm<Client>({
    resolver: zodResolver(ClientSchema),
    defaultValues: client || {
      personId: "",
      hobbies: [],
      favoriteSportsTeams: [],
    },
  });

  useEffect(() => {
    async function fetchPeople() {
      const result = await getPeople();
      if (result.success && result.people) {
        setAvailablePeople(result.people);
      }
    }
    fetchPeople();
  }, []);

  const handleAddHobby = () => {
    if (!hobbyInput.trim()) return;
    const current = form.getValues("hobbies");
    if (current.includes(hobbyInput.trim())) return;
    form.setValue("hobbies", [...current, hobbyInput.trim()]);
    setHobbyInput("");
  };

  const handleRemoveHobby = (hobby: string) => {
    const current = form.getValues("hobbies");
    form.setValue("hobbies", current.filter(h => h !== hobby));
  };

  const handleToggleSportsTeam = (teamId: string) => {
    const current = form.getValues("favoriteSportsTeams");
    if (current.includes(teamId)) {
      form.setValue("favoriteSportsTeams", current.filter(id => id !== teamId));
    } else {
      form.setValue("favoriteSportsTeams", [...current, teamId]);
    }
  };

  async function onSubmit(values: Client) {
    try {
      setIsLoading(true);
      const isEditing = !!client?.id;
      
      let result;
      if (isEditing) {
        result = await updateClient(client.id!, values);
      } else {
        result = await createClient(values);
      }

      if (result.success) {
        toast.success(isEditing ? "Client record updated" : "Client record created");
        router.push("/dashboard/crm/clients");
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isEditing ? "update" : "create"} client record`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedPerson = availablePeople.find(p => p.id === form.watch("personId"));

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>{client ? "Edit Client Profile" : "Create Client Profile"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-medium border-b pb-2">Person Association</h3>
              <FormField
                control={form.control}
                name="personId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Select Person</FormLabel>
                    <Combobox 
                      value={field.value} 
                      onValueChange={(val: any) => {
                        if (typeof val === 'string') field.onChange(val);
                      }}
                      disabled={!!client}
                    >
                      <ComboboxInput placeholder="Search people..." />
                      <ComboboxContent>
                        <ComboboxList>
                          {availablePeople.map((p) => (
                            <ComboboxItem key={p.id} value={p.id!}>
                              {p.firstName} {p.lastName} ({p.email})
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FormDescription>
                      {client ? "The person associated with this client profile cannot be changed." : "Select the person you want to create a CRM client record for."}
                    </FormDescription>
                    {selectedPerson && (
                      <div className="mt-2 p-3 bg-muted/30 rounded-md border flex items-center gap-3 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{selectedPerson.firstName} {selectedPerson.lastName}</p>
                          <p className="text-muted-foreground">{selectedPerson.email}</p>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium border-b pb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Interests & Hobbies
              </h3>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Golfing" 
                  value={hobbyInput}
                  onChange={(e) => setHobbyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHobby();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={handleAddHobby}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 min-h-[40px] p-2 bg-muted/20 rounded-md border">
                {form.watch("hobbies").length === 0 && (
                  <p className="text-xs text-muted-foreground p-1 italic">No hobbies listed yet.</p>
                )}
                {form.watch("hobbies").map((hobby, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 px-3 py-1">
                    {hobby}
                    <button type="button" onClick={() => handleRemoveHobby(hobby)} className="ml-1 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium border-b pb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Favorite Sports Teams
              </h3>
              
              <div className="space-y-2">
                <FormLabel>Search and Link Teams</FormLabel>
                <Combobox 
                  onValueChange={(val: any) => {
                    if (typeof val === 'string') handleToggleSportsTeam(val);
                  }}
                >
                  <ComboboxInput placeholder="Search NFL, MLB, NBA, NHL..." />
                  <ComboboxContent>
                    <ComboboxList>
                      {sportsTeams
                        .filter(team => !form.getValues("favoriteSportsTeams").includes(team.name))
                        .map((team) => (
                        <ComboboxItem key={team.id} value={team.name}>
                          <span className="text-xs font-bold mr-2 text-muted-foreground">[{team.league}]</span>
                          {team.name}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 min-h-[40px] p-2 bg-muted/20 rounded-md border">
                {form.watch("favoriteSportsTeams").length === 0 && (
                  <p className="text-xs text-muted-foreground p-1 italic">No sports teams linked yet.</p>
                )}
                {form.watch("favoriteSportsTeams").map((teamName, index) => (
                  <Badge key={index} variant="default" className="gap-1 px-3 py-1 shadow-sm font-bold bg-primary text-primary-foreground">
                    {teamName}
                    <button type="button" onClick={() => handleToggleSportsTeam(teamName)} className="ml-1 hover:text-destructive-foreground">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="font-bold">
                {isLoading ? "Saving..." : (client ? "Update Client Profile" : "Create Client Profile")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
