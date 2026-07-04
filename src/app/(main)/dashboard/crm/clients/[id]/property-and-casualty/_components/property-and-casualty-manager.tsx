"use client";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowUpRight,
  Building2,
  Check,
  ChevronsUpDown,
  FileText,
  Globe,
  Loader2,
  Phone,
  Plus,
  Shield,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import {
  linkClientToPropertyAndCasualtyFirm,
  unlinkClientFromPropertyAndCasualtyFirm,
} from "@/actions/property-and-casualty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase.client";
import { cn, formatPhoneNumber } from "@/lib/utils";
import type { Client, ClientDocument } from "@/types/crm";

import { ClientHeaderPortal } from "../../_components/client-header-portal";

interface PropertyAndCasualtyFirm {
  id?: string;
  firmName: string;
  website?: string | null;
  phone?: string | null;
  clientIds?: string[] | null;
}

interface PropertyAndCasualtyManagerProps {
  client: Client;
  allFirms: PropertyAndCasualtyFirm[];
}

const DOCUMENT_TYPES = [
  "Home Declaration Page",
  "Automobile Declaration Page",
  "Umbrella Declaration Page",
  "Flood Declaration Page",
  "Collections Declaration Page",
  "Boat/RV Declaration Page",
  "Elevation Certificate",
  "Wind Mitigation",
  "4 Point Inspection",
  "Other",
];

export function PropertyAndCasualtyManager({ client, allFirms }: PropertyAndCasualtyManagerProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();

  // Local document state
  const [documents, setDocuments] = useState<ClientDocument[]>(client.pcDocuments || []);

  // Upload dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [addingDocType, setAddingDocType] = useState<string>("");
  const [addingFirmId, setAddingFirmId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Link firm dialog states
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkFirmId, setLinkFirmId] = useState<string>("");
  const [linkComboboxOpen, setLinkComboboxOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Grouping computation
  const associatedFirms = useMemo(() => {
    return allFirms.filter((f) => f.clientIds?.includes(client.id || ""));
  }, [allFirms, client.id]);

  const availableFirmsToLink = useMemo(() => {
    return allFirms.filter((f) => !f.clientIds?.includes(client.id || ""));
  }, [allFirms, client.id]);

  const firmNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of allFirms) {
      if (f.id) map.set(f.id, f.firmName);
    }
    return map;
  }, [allFirms]);

  // Documents grouped by firmId
  const documentsByFirm = useMemo(() => {
    const map = new Map<string, ClientDocument[]>();
    for (const doc of documents) {
      if (doc.firmId) {
        const list = map.get(doc.firmId) || [];
        list.push(doc);
        map.set(doc.firmId, list);
      }
    }
    return map;
  }, [documents]);

  // Documents with no associated firm, or associated with a firm that is not linked
  const generalDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (!doc.firmId) return true;
      return !associatedFirms.some((f) => f.id === doc.firmId);
    });
  }, [documents, associatedFirms]);

  const handleUpload = async () => {
    if (!file || !addingDocType) {
      toast.error("Please select a file and a document type");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const randomStr = Math.random().toString(36).substring(7);
      const filePath = `clients/${client.id}/pcDocuments/${randomStr}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl: url },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      const newDoc: ClientDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        type: addingDocType,
        uploadedAt: new Date().toISOString(),
        firmId: addingFirmId || undefined,
      };

      const updatedDocs = [...documents, newDoc];

      // Update client documents
      const res = await updateClient(client.id!, { pcDocuments: updatedDocs });
      if (!res.success) throw new Error(res.error || "Failed to save client documents");

      // Auto-associate the firm if a firm was selected and is not already associated
      if (addingFirmId && !associatedFirms.some((f) => f.id === addingFirmId)) {
        const linkRes = await linkClientToPropertyAndCasualtyFirm(addingFirmId, client.id!);
        if (linkRes.success) {
          window.dispatchEvent(new CustomEvent("association-change"));
        } else {
          toast.warning("Document uploaded, but failed to link the firm automatically.");
        }
      }

      setDocuments(updatedDocs);
      toast.success("Document uploaded successfully");

      // Reset states
      setFile(null);
      setAddingDocType("");
      setAddingFirmId("");
      setIsUploadOpen(false);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkFirm = async () => {
    if (!linkFirmId) return;
    setIsLinking(true);
    try {
      const result = await linkClientToPropertyAndCasualtyFirm(linkFirmId, client.id!);
      if (result.success) {
        toast.success("P&C Firm linked successfully");
        window.dispatchEvent(new CustomEvent("association-change"));
        setIsLinkOpen(false);
        setLinkFirmId("");
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error || "Failed to link P&C Firm");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkFirm = async (firmId: string) => {
    const confirmUnlink = window.confirm("Are you sure you want to remove association with this P&C firm?");
    if (!confirmUnlink) return;

    try {
      const result = await unlinkClientFromPropertyAndCasualtyFirm(firmId, client.id!);
      if (result.success) {
        toast.success("Firm association removed");
        window.dispatchEvent(new CustomEvent("association-change"));
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error || "Failed to remove association");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this document?");
    if (!confirmDelete) return;

    try {
      const updated = documents.filter((d) => d.id !== docId);
      const res = await updateClient(client.id!, { pcDocuments: updated });
      if (res.success) {
        setDocuments(updated);
        toast.success("Document deleted");
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(res.error || "Failed to delete document");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    }
  };

  const selectedFirmName = addingFirmId ? firmNameMap.get(addingFirmId) : "";
  const selectedLinkFirmName = linkFirmId ? allFirms.find((f) => f.id === linkFirmId)?.firmName : "";

  return (
    <div className="space-y-8">
      <ClientHeaderPortal sectionName="Property & Casualty">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLinkOpen(true)}
          className="bg-background/50 backdrop-blur-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Link Firm
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setAddingFirmId("");
            setIsUploadOpen(true);
          }}
          className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Document
        </Button>
      </ClientHeaderPortal>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Associated Firms and Their Documents */}
        <div className="space-y-6 lg:col-span-2">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">Associated P&C Firms</h2>

          {associatedFirms.length > 0 ? (
            associatedFirms.map((firm) => {
              const firmDocs = documentsByFirm.get(firm.id!) || [];

              return (
                <Card
                  key={firm.id ?? firm.firmName}
                  className="overflow-hidden border border-muted/20 bg-gradient-to-b from-card to-muted/5 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <CardHeader className="border-muted/10 border-b bg-muted/10 px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground">{firm.firmName}</h3>
                          <Link
                            href={`/dashboard/crm/property-and-casualty/${firm.id}`}
                            className="text-muted-foreground transition-colors hover:text-primary"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                          {firm.website && (
                            <a
                              href={firm.website.startsWith("http") ? firm.website : `https://${firm.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary hover:underline"
                            >
                              <Globe className="h-3 w-3" />
                              {firm.website.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                          {firm.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {formatPhoneNumber(firm.phone)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnlinkFirm(firm.id!)}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Remove Association"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
                          Policy Documents
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAddingFirmId(firm.id!);
                            setIsUploadOpen(true);
                          }}
                          className="h-7 text-primary text-xs hover:bg-primary/5 hover:text-primary/80"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Upload for this firm
                        </Button>
                      </div>

                      {firmDocs.length > 0 ? (
                        <div className="divide-y divide-muted/10 overflow-hidden rounded-lg border border-muted/20 bg-background">
                          {firmDocs.map((doc, idx) => (
                            <div
                              key={doc.id ?? idx}
                              className="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/5"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-foreground text-sm leading-none">{doc.name}</p>
                                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                    <span className="font-medium text-primary/80">{doc.type}</span>
                                    {doc.uploadedAt && (
                                      <>
                                        <span>•</span>
                                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-8" asChild>
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                    View
                                  </a>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteDocument(doc.id!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-muted/30 border-dashed bg-muted/5 p-6 text-center text-muted-foreground">
                          <FileText className="mb-2 h-6 w-6 opacity-30" />
                          <p className="text-xs">No documents uploaded for this firm.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="flex flex-col items-center justify-center border-2 border-muted/30 border-dashed bg-muted/5 px-6 py-12 text-center text-muted-foreground">
              <Building2 className="mb-4 h-12 w-12 opacity-20" />
              <h3 className="font-bold text-foreground text-sm">No P&C Firms Linked</h3>
              <p className="mt-1 max-w-sm text-xs">
                Connect this client to a property and casualty firm to manage documents and associations.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsLinkOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Link a Firm
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAddingFirmId("");
                    setIsUploadOpen(true);
                  }}
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Add Document
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Side Cards */}
        <div className="space-y-6">
          {/* General / Unassociated Documents */}
          <div>
            <h2 className="mb-6 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              General Documents
            </h2>
            <Card className="border border-muted/20 bg-gradient-to-b from-card to-muted/5 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="font-bold text-sm">General Files</CardTitle>
                <CardDescription className="text-xs">Documents not associated with linked firms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {generalDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {generalDocuments.map((doc, idx) => (
                      <div
                        key={doc.id ?? idx}
                        className="flex items-center justify-between rounded-lg border border-muted/20 bg-background p-3 transition-colors hover:bg-muted/5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground text-xs" title={doc.name}>
                              {doc.name}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                              {doc.type} {doc.firmId && `(${firmNameMap.get(doc.firmId) || "Unknown Firm"})`}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteDocument(doc.id!)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-muted/30 border-dashed bg-muted/5 p-6 text-center text-muted-foreground">
                    <FileText className="mb-2 h-6 w-6 opacity-30" />
                    <p className="text-xs">No general documents.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Associations Panel */}
          {availableFirmsToLink.length > 0 && (
            <div>
              <h2 className="mb-6 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Quick Links</h2>
              <Card className="border border-muted/20 bg-gradient-to-b from-card to-muted/5 shadow-sm">
                <CardHeader className="py-4">
                  <CardTitle className="font-bold text-sm">Available P&C Firms</CardTitle>
                  <CardDescription className="text-xs">Firms you can associate with this client.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-60 divide-y divide-muted/10 overflow-y-auto">
                    {availableFirmsToLink.map((firm) => (
                      <div key={firm.id ?? firm.firmName} className="flex items-center justify-between p-3.5 text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-semibold text-foreground">{firm.firmName}</p>
                          {firm.website && <p className="truncate text-[10px] text-muted-foreground">{firm.website}</p>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setIsLinking(true);
                            try {
                              const res = await linkClientToPropertyAndCasualtyFirm(firm.id!, client.id!);
                              if (res.success) {
                                toast.success("Firm associated successfully");
                                window.dispatchEvent(new CustomEvent("association-change"));
                                startTransition(() => {
                                  router.refresh();
                                });
                              } else {
                                toast.error(res.error || "Failed to associate firm");
                              }
                            } catch (_e) {
                              toast.error("Error occurred");
                            } finally {
                              setIsLinking(false);
                            }
                          }}
                          disabled={isLinking}
                          className="h-7 px-2 text-[10px]"
                        >
                          Link
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Add Document Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="border border-muted/20 bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" /> Add P&C Document
            </DialogTitle>
            <DialogDescription>
              Select the document type, the firm it belongs to, and upload the file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Document Type Select */}
            <div className="space-y-2">
              <label
                htmlFor="upload-doc-type"
                className="font-semibold text-foreground text-xs uppercase tracking-wider"
              >
                Document Type
              </label>
              <Select value={addingDocType} onValueChange={setAddingDocType}>
                <SelectTrigger id="upload-doc-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* P&C Firm Select (from all existing firms) */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="upload-doc-firm"
                className="font-semibold text-foreground text-xs uppercase tracking-wider"
              >
                P&C Firm
              </label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="upload-doc-firm"
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between text-left font-normal text-sm"
                  >
                    {selectedFirmName || "Select P&C firm (optional)"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search P&C firms..." />
                    <CommandList>
                      <CommandEmpty>No P&C firms found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setAddingFirmId("");
                            setComboboxOpen(false);
                          }}
                          className="text-muted-foreground italic"
                        >
                          <Check className={cn("mr-2 h-4 w-4 opacity-0", !addingFirmId && "opacity-100")} />
                          No Firm / General Document
                        </CommandItem>
                        {allFirms.map((firm) => (
                          <CommandItem
                            key={firm.id}
                            value={firm.firmName}
                            onSelect={() => {
                              setAddingFirmId(firm.id || "");
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4 opacity-0", addingFirmId === firm.id && "opacity-100")}
                            />
                            {firm.firmName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* File Input */}
            <div className="space-y-2">
              <label htmlFor="upload-file" className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Select File
              </label>
              <input
                id="upload-file"
                type="file"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-semibold file:text-primary file:text-xs file:uppercase file:tracking-wider placeholder:text-muted-foreground hover:file:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleUpload} disabled={isUploading || !file || !addingDocType}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Firm Dialog */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="border border-muted/20 bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Link P&C Firm
            </DialogTitle>
            <DialogDescription>Link an existing P&C firm to this client.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="link-firm-select"
                className="font-semibold text-foreground text-xs uppercase tracking-wider"
              >
                P&C Firm
              </label>
              <Popover open={linkComboboxOpen} onOpenChange={setLinkComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="link-firm-select"
                    variant="outline"
                    role="combobox"
                    aria-expanded={linkComboboxOpen}
                    className="w-full justify-between text-left font-normal text-sm"
                  >
                    {selectedLinkFirmName || "Select P&C firm..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search P&C firms..." />
                    <CommandList>
                      <CommandEmpty>No P&C firms found.</CommandEmpty>
                      <CommandGroup>
                        {availableFirmsToLink.map((firm) => (
                          <CommandItem
                            key={firm.id}
                            value={firm.firmName}
                            onSelect={() => {
                              setLinkFirmId(firm.id || "");
                              setLinkComboboxOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4 opacity-0", linkFirmId === firm.id && "opacity-100")} />
                            {firm.firmName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-muted/20 border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button variant="outline" asChild className="w-full">
              <Link href={`/dashboard/crm/property-and-casualty/new?clientId=${client.id}`}>Create New P&C Firm</Link>
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleLinkFirm} disabled={isLinking || !linkFirmId}>
              {isLinking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Link Firm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
