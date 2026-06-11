"use client";

import { useEffect, useState } from "react";

import { Loader2, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { getPeople } from "@/actions/people";
import { PersonAvatar } from "@/components/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Client, FamilyMember, Person } from "@/types/crm";

export function FamilyTab({ client }: { client: Client }) {
  const [members, setMembers] = useState<FamilyMember[]>(client.familyMembers || []);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState<string>("");

  useEffect(() => {
    async function load() {
      const res = await getPeople();
      if (res.success && res.people) {
        setPeople(res.people);
      }
    }
    load();
  }, []);

  const handleAdd = async () => {
    if (!selectedPersonId || !selectedRelationship) return;
    try {
      setIsLoading(true);
      const newMember: FamilyMember = {
        id: crypto.randomUUID(),
        personId: selectedPersonId,
        relationship: selectedRelationship as any,
      };

      const updated = [...members, newMember];
      const res = await updateClient(client.id!, { familyMembers: updated });

      if (res.success) {
        setMembers(updated);
        setSelectedPersonId("");
        setSelectedRelationship("");
        toast.success("Family member added");
      } else {
        throw new Error();
      }
    } catch (_e) {
      toast.error("Failed to add family member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const updated = members.filter((m) => m.id !== id);
      const res = await updateClient(client.id!, { familyMembers: updated });
      if (res.success) {
        setMembers(updated);
        toast.success("Family member removed");
      }
    } catch {
      toast.error("Failed to remove family member");
    }
  };

  return (
    <Card className="fade-in animate-in border-none bg-gradient-to-b from-card to-muted/20 shadow-md duration-500">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle>Family Configuration</CardTitle>
        <CardDescription>
          Link family members from the people collection and specify their relationship.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex flex-col items-end gap-4 rounded-lg border bg-background p-4 shadow-sm md:flex-row">
          <div className="w-full flex-1 space-y-2">
            <label className="font-medium text-sm">Select Person</label>
            <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="Search or select person" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id!}>
                    {p.firstName} {p.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full flex-1 space-y-2">
            <label className="font-medium text-sm">Relationship</label>
            <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Child">Child</SelectItem>
                <SelectItem value="Grandchild">Grandchild</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAdd}
            disabled={isLoading || !selectedPersonId || !selectedRelationship}
            className="mt-4 w-full shrink-0 md:mt-0 md:w-auto"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Member
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {members.length > 0 ? (
            members.map((member) => {
              const person = people.find((p) => p.id === member.personId);
              return (
                <div
                  key={member.id}
                  className="flex flex-col justify-between gap-4 rounded-md border bg-background p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-4">
                    <PersonAvatar
                      photoUrl={person?.photoUrl}
                      firstName={person?.firstName}
                      lastName={person?.lastName}
                      size="default"
                    />
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 font-semibold text-foreground text-sm">
                        {person ? `${person.firstName} ${person.lastName}` : "Unknown Person"}
                        <Badge
                          variant="outline"
                          className="bg-muted/50 font-semibold text-[10px] uppercase tracking-wider"
                        >
                          {member.relationship}
                        </Badge>
                      </p>
                      {person && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                          {person.pii?.biologicalGender && (
                            <span>
                              <span className="mr-1 font-medium opacity-70">Gender:</span>
                              {person.pii.biologicalGender}
                            </span>
                          )}
                          {person.pii?.birthDate && (
                            <span>
                              <span className="mr-1 font-medium opacity-70">DOB:</span>
                              {person.pii.birthDate}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 self-end text-destructive hover:bg-destructive/10 sm:self-auto"
                    onClick={() => handleRemove(member.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border-2 border-dashed bg-muted/10 p-8 text-center text-muted-foreground">
              <User className="mx-auto mb-3 h-8 w-8 opacity-20" />
              <p className="text-sm">No family members linked yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
