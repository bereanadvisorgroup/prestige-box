"use client";

import { useEffect, useState } from "react";

import { Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { getPeople } from "@/actions/people";
import { PersonAvatar } from "@/components/features/crm/person-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPersonName } from "@/lib/utils";
import type { Client, FamilyMember, Person } from "@/types/crm";

function TreeEdgeHorizontal({ isFirst, isLast, isOnly }: { isFirst: boolean; isLast: boolean; isOnly: boolean }) {
  if (isOnly) return null;
  return (
    <>
      {!isFirst && <div className="absolute top-0 left-0 h-px w-1/2 bg-border" />}
      {!isLast && <div className="absolute top-0 right-0 h-px w-1/2 bg-border" />}
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

function getGenderedRelationshipLabel(_person?: Person, member?: FamilyMember, label?: string) {
  if (label) return label;
  if (!member) return "Unknown";

  const gender = member.gender;
  const rel = member.relationship;

  if (!gender) return rel;

  if (rel === "Spouse") return gender === "Female" ? "Wife" : gender === "Male" ? "Husband" : rel;
  if (rel === "Child") return gender === "Female" ? "Daughter" : gender === "Male" ? "Son" : rel;
  if (rel === "Grandchild") return gender === "Female" ? "Granddaughter" : gender === "Male" ? "Grandson" : rel;
  if (rel === "Great Grandchild")
    return gender === "Female" ? "Great Granddaughter" : gender === "Male" ? "Great Grandson" : rel;

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
        <p className="line-clamp-1 font-semibold text-foreground text-sm" title={formatPersonName(person)}>
          {formatPersonName(person)}
        </p>
        <Badge variant="secondary" className="mt-1 bg-muted/50 font-semibold text-[10px] uppercase tracking-wider">
          {displayLabel}
        </Badge>
      </div>

      {member && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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

import { ClientHeaderPortal } from "../client-header-portal";
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
      <ClientHeaderPortal sectionName="Family Tree">
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Family Member
        </Button>
      </ClientHeaderPortal>

      <AddFamilyMemberModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        client={client}
        members={members}
        people={people}
        onSuccess={handleAddSuccess}
      />

      <div className="fade-in animate-in overflow-x-auto pt-4 pb-4 duration-500">
        <div className="min-w-max">
          <div className="flex flex-col items-center">
            {/* Root Level: Client & Spouses */}
            <div className="relative z-10 flex items-center gap-8">
              {spouses.length > 0 && <div className="absolute top-1/2 right-10 left-10 -z-10 h-px bg-border" />}
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
              <div className="mt-16 w-full max-w-3xl rounded-lg border border-muted-foreground/30 border-dashed bg-muted/10 p-6">
                <h4 className="mb-4 font-semibold text-muted-foreground text-sm">
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
      </div>
    </div>
  );
}
