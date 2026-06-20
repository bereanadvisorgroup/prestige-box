"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { createPerson } from "@/actions/people";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Client, FamilyMember, Person } from "@/types/crm";

interface AddFamilyMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  members: FamilyMember[];
  people: Person[];
  onSuccess: (newMember: FamilyMember, newPerson?: Person) => void;
}

export function AddFamilyMemberModal({
  open,
  onOpenChange,
  client,
  members,
  people,
  onSuccess,
}: AddFamilyMemberModalProps) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState<FamilyMember["relationship"] | "">("");
  const [selectedParentId, setSelectedParentId] = useState("");

  // New Person State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");

  const isDescendant = selectedRelationship === "Grandchild" || selectedRelationship === "Great Grandchild";

  const parentOptions = members
    .filter((m) => {
      if (selectedRelationship === "Grandchild") return m.relationship === "Child";
      if (selectedRelationship === "Great Grandchild") return m.relationship === "Grandchild";
      return false;
    })
    .map((m) => {
      const p = people.find((p) => p.id === m.personId);
      return { ...m, person: p };
    });

  const handleSave = async () => {
    if (!selectedRelationship) return;
    if (isDescendant && !selectedParentId) {
      toast.error("Please select a parent for this descendant");
      return;
    }

    try {
      setIsLoading(true);
      let personId = selectedPersonId;
      let newPersonObj: Person | undefined;

      // Handle New Person Creation
      if (mode === "new") {
        if (!firstName || !lastName) {
          toast.error("First and last name are required");
          setIsLoading(false);
          return;
        }

        const newPersonData: Partial<Person> = {
          firstName,
          lastName,
          pii: {
            biologicalGender: gender ? (gender as "Male" | "Female") : undefined,
            birthDate: dob || undefined,
          },
        };

        const res = await createPerson(newPersonData);
        if (!res.success || !res.id) {
          throw new Error(res.error || "Failed to create person");
        }
        personId = res.id;
        newPersonObj = { ...newPersonData, id: personId } as Person;
      }

      if (!personId) {
        toast.error("Please select a person");
        setIsLoading(false);
        return;
      }

      // Handle Family Member Linking
      const newMember: FamilyMember = {
        id: crypto.randomUUID(),
        personId: personId,
        relationship: selectedRelationship as FamilyMember["relationship"],
        parentId: isDescendant ? selectedParentId : undefined,
      };

      const updated = [...members, newMember];
      const linkRes = await updateClient(client.id!, { familyMembers: updated });

      if (linkRes.success) {
        toast.success("Family member added successfully");
        onSuccess(newMember, newPersonObj);
        onOpenChange(false);
        // Reset state
        setFirstName("");
        setLastName("");
        setGender("");
        setDob("");
        setSelectedPersonId("");
        setSelectedRelationship("");
        setSelectedParentId("");
      } else {
        throw new Error("Failed to link family member");
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Link an existing person or create a new profile to add to the family tree.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <Tabs value={mode} onValueChange={(val) => setMode(val as "existing" | "new")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Select Existing</TabsTrigger>
              <TabsTrigger value="new">Create New</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Person</label>
                <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search or select person" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {people.map((p) => (
                      <SelectItem key={p.id} value={p.id!}>
                        {p.firstName} {p.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="new" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender (Optional)</label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date of Birth (Optional)</label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 rounded-md bg-muted/30 p-4 border">
            <div className="space-y-2">
              <label className="text-sm font-medium">Relationship to Client</label>
              <Select
                value={selectedRelationship}
                onValueChange={(val) => {
                  setSelectedRelationship(val as FamilyMember["relationship"]);
                  setSelectedParentId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spouse">Spouse</SelectItem>
                  <SelectItem value="Child">Child</SelectItem>
                  <SelectItem value="Grandchild">Grandchild</SelectItem>
                  <SelectItem value="Great Grandchild">Great Grandchild</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isDescendant && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <label className="text-sm font-medium">Select Parent</label>
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id!}>
                        {opt.person ? `${opt.person.firstName} ${opt.person.lastName}` : "Unknown"} ({opt.relationship})
                      </SelectItem>
                    ))}
                    {parentOptions.length === 0 && (
                      <SelectItem value="none" disabled>
                        No eligible parents found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
