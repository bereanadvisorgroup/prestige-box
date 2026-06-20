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

function TreeEdgeHorizontal({ isFirst, isLast, isOnly }: { isFirst: boolean; isLast: boolean; isOnly: boolean }) {
  if (isOnly) return null;
  return (
    <>
      {!isFirst && <div className="absolute left-0 top-0 h-px w-1/2 bg-border" />}
      {!isLast && <div className="absolute right-0 top-0 h-px w-1/2 bg-border" />}
    </>
  );
}

function TreeNodeContainer({
  children,
  isFirst,
  isLast,
  isOnly,
}: {
  children: React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
  isOnly: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center px-2 sm:px-4">
      <TreeEdgeHorizontal isFirst={isFirst} isLast={isLast} isOnly={isOnly} />
      <div className="h-6 w-px bg-border" />
      {children}
    </div>
  );
}

function getGenderedRelationshipLabel(person?: Person, member?: FamilyMember, label?: string) {
  if (label) return label;
  if (!member) return "Unknown";

  const gender = person?.pii?.biologicalGender;
  const rel = member.relationship;

  if (!gender) return rel;

  if (rel === "Spouse") return gender === "Female" ? "Wife" : gender === "Male" ? "Husband" : rel;
  if (rel === "Child") return gender === "Female" ? "Daughter" : gender === "Male" ? "Son" : rel;
  if (rel === "Grandchild") return gender === "Female" ? "Granddaughter" : gender === "Male" ? "Grandson" : rel;
  if (rel === "Great Grandchild") return gender === "Female" ? "Great Granddaughter" : gender === "Male" ? "Great Grandson" : rel;

  return rel;
}

function NodeCard({
  person,
  member,
  label,
  onRemove,
}: {
  person?: Person;
  member?: FamilyMember;
  label?: string;
  onRemove?: (id: string) => void;
}) {
  const displayLabel = getGenderedRelationshipLabel(person, member, label);

  return (
    <div className="relative flex w-[160px] flex-col items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      <PersonAvatar photoUrl={person?.photoUrl} firstName={person?.firstName} lastName={person?.lastName} size="lg" />
      <div className="text-center">
        <p
          className="line-clamp-1 text-sm font-semibold text-foreground"
          title={person ? `${person.firstName} ${person.lastName}` : "Unknown Person"}
        >
          {person ? `${person.firstName} ${person.lastName}` : "Unknown Person"}
        </p>
        <Badge variant="secondary" className="mt-1 bg-muted/50 text-[10px] uppercase tracking-wider font-semibold">
          {displayLabel}
        </Badge>
      </div>

      {member && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(member.id!)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

function NodeTree({
  branch,
  members,
  people,
  onRemove,
}: {
  branch: FamilyMember;
  members: FamilyMember[];
  people: Person[];
  onRemove: (id: string) => void;
}) {
  const p = people.find((p) => p.id === branch.personId);
  const myChildren = members.filter((m) => m.parentId === branch.id);

  return (
    <div className="flex flex-col items-center">
      <NodeCard person={p} member={branch} onRemove={onRemove} />
      {myChildren.length > 0 && (
        <>
          <div className="h-6 w-px bg-border" />
          <div className="relative flex justify-center">
            {myChildren.map((child, i) => (
              <TreeNodeContainer
                key={child.id}
                isFirst={i === 0}
                isLast={i === myChildren.length - 1}
                isOnly={myChildren.length === 1}
              >
                <NodeTree branch={child} members={members} people={people} onRemove={onRemove} />
              </TreeNodeContainer>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { AddFamilyMemberModal } from "./add-family-member-modal";

export function FamilyTab({ client }: { client: Client }) {
  const [members, setMembers] = useState<FamilyMember[]>(client.familyMembers || []);
  const [people, setPeople] = useState<Person[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getPeople();
      if (res.success && res.people) {
        setPeople(res.people);
      }
    }
    load();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      // Also remove any descendants that point to this parent
      const updated = members.filter((m) => m.id !== id && m.parentId !== id);
      const res = await updateClient(client.id!, { familyMembers: updated });
      if (res.success) {
        setMembers(updated);
        toast.success("Family member removed");
      }
    } catch {
      toast.error("Failed to remove family member");
    }
  };

  const handleAddSuccess = (newMember: FamilyMember, newPerson?: Person) => {
    setMembers((prev) => [...prev, newMember]);
    if (newPerson) {
      setPeople((prev) => [...prev, newPerson]);
    }
  };

  const clientPerson = people.find((p) => p.id === client.personId);
  const spouses = members.filter((m) => m.relationship === "Spouse");
  const children = members.filter((m) => m.relationship === "Child");
  const unlinkedDescendants = members.filter(
    (m) => (m.relationship === "Grandchild" || m.relationship === "Great Grandchild") && !m.parentId,
  );

  return (
    <div className="space-y-6">
      <AddFamilyMemberModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        client={client}
        members={members}
        people={people}
        onSuccess={handleAddSuccess}
      />

      <Card className="fade-in animate-in border-none bg-gradient-to-b from-card to-muted/20 shadow-md duration-500">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4 pt-4">
          <div>
            <CardTitle>Family Tree</CardTitle>
            <CardDescription className="mt-1">Visual representation of the client's family configuration.</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Family Member
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-10 pb-10">
          <div className="min-w-max">
            <div className="flex flex-col items-center">
              {/* Root Level: Client & Spouses */}
              <div className="relative z-10 flex items-center gap-8">
                {spouses.length > 0 && <div className="absolute left-10 right-10 top-1/2 -z-10 h-px bg-border" />}
                <NodeCard person={clientPerson} label="Client" />
                {spouses.map((spouse) => {
                  const p = people.find((p) => p.id === spouse.personId);
                  return <NodeCard key={spouse.id} person={p} member={spouse} onRemove={handleRemove} />;
                })}
              </div>

              {/* Children Level */}
              {children.length > 0 && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <div className="relative flex justify-center pt-0">
                    {children.map((child, i) => (
                      <TreeNodeContainer
                        key={child.id}
                        isFirst={i === 0}
                        isLast={i === children.length - 1}
                        isOnly={children.length === 1}
                      >
                        <NodeTree branch={child} members={members} people={people} onRemove={handleRemove} />
                      </TreeNodeContainer>
                    ))}
                  </div>
                </>
              )}

              {/* Unlinked Descendants (Fallback) */}
              {unlinkedDescendants.length > 0 && (
                <div className="mt-16 w-full max-w-3xl rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10 p-6">
                  <h4 className="mb-4 text-sm font-semibold text-muted-foreground">
                    Unlinked Descendants (Missing Parent Association)
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {unlinkedDescendants.map((member) => {
                      const p = people.find((p) => p.id === member.personId);
                      return <NodeCard key={member.id} person={p} member={member} onRemove={handleRemove} />;
                    })}
                  </div>
                </div>
              )}

              {members.length === 0 && (
                <div className="mt-8 rounded-lg border-2 border-dashed bg-muted/10 p-8 text-center text-muted-foreground">
                  <User className="mx-auto mb-3 h-8 w-8 opacity-20" />
                  <p className="text-sm">No family members linked yet.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
