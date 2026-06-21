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
  HeartHandshake,
  Loader2,
  Phone,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import {
  linkClientToLifeInsuranceCompany,
  unlinkClientFromLifeInsuranceCompany,
} from "@/actions/life-insurance-companies";
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
import type { Client, ClientDocument, LifeInsuranceCompany } from "@/types/crm";

interface LifeInsuranceManagerProps {
  client: Client;
  allCompanies: LifeInsuranceCompany[];
}

const DOCUMENT_TYPES = ["Life Insurance Policy", "Beneficiary Designation", "Policy Statement", "Other"];

export function LifeInsuranceManager({ client, allCompanies }: LifeInsuranceManagerProps) {
  const router = useRouter();
  const [_isPending, startTransition] = useTransition();

  // Local document state
  const [documents, setDocuments] = useState<ClientDocument[]>(client.lifeDocuments || []);

  // Upload dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [addingDocType, setAddingDocType] = useState<string>("");
  const [addingCompanyId, setAddingCompanyId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // Link company dialog states
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkCompanyId, setLinkCompanyId] = useState<string>("");
  const [linkComboboxOpen, setLinkComboboxOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Grouping computation
  const associatedCompanies = useMemo(() => {
    return allCompanies.filter((c) => c.clientIds?.includes(client.id || ""));
  }, [allCompanies, client.id]);

  const availableCompaniesToLink = useMemo(() => {
    return allCompanies.filter((c) => !c.clientIds?.includes(client.id || ""));
  }, [allCompanies, client.id]);

  const companyNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allCompanies) {
      if (c.id) map.set(c.id, c.name);
    }
    return map;
  }, [allCompanies]);

  // Documents grouped by companyId (firmId field is used inside ClientDocument)
  const documentsByCompany = useMemo(() => {
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

  // Documents with no associated company, or associated with a company that is not linked
  const generalDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (!doc.firmId) return true;
      return !associatedCompanies.some((c) => c.id === doc.firmId);
    });
  }, [documents, associatedCompanies]);

  const handleUpload = async () => {
    if (!file || !addingDocType) {
      toast.error("Please select a file and a document type");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const randomStr = Math.random().toString(36).substring(7);
      const filePath = `clients/${client.id}/lifeDocuments/${randomStr}_${Date.now()}.${fileExt}`;

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
        firmId: addingCompanyId || undefined,
      };

      const updatedDocs = [...documents, newDoc];

      // Update client documents
      const res = await updateClient(client.id!, { lifeDocuments: updatedDocs });
      if (!res.success) throw new Error(res.error || "Failed to save client documents");

      // Auto-associate the company if a company was selected and is not already associated
      if (addingCompanyId && !associatedCompanies.some((c) => c.id === addingCompanyId)) {
        const linkRes = await linkClientToLifeInsuranceCompany(addingCompanyId, client.id!);
        if (linkRes.success) {
          window.dispatchEvent(new CustomEvent("association-change"));
        } else {
          toast.warning("Document uploaded, but failed to link the company automatically.");
        }
      }

      setDocuments(updatedDocs);
      toast.success("Document uploaded successfully");

      // Reset states
      setFile(null);
      setAddingDocType("");
      setAddingCompanyId("");
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

  const handleLinkCompany = async () => {
    if (!linkCompanyId) return;
    setIsLinking(true);
    try {
      const result = await linkClientToLifeInsuranceCompany(linkCompanyId, client.id!);
      if (result.success) {
        toast.success("Life Insurance Company linked successfully");
        window.dispatchEvent(new CustomEvent("association-change"));
        setIsLinkOpen(false);
        setLinkCompanyId("");
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error || "Failed to link company");
      }
    } catch (_error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkCompany = async (companyId: string) => {
    const confirmUnlink = window.confirm(
      "Are you sure you want to remove association with this life insurance company?",
    );
    if (!confirmUnlink) return;

    try {
      const result = await unlinkClientFromLifeInsuranceCompany(companyId, client.id!);
      if (result.success) {
        toast.success("Company association removed");
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
      const res = await updateClient(client.id!, { lifeDocuments: updated });
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

  const selectedCompanyName = addingCompanyId ? companyNameMap.get(addingCompanyId) : "";
  const selectedLinkCompanyName = linkCompanyId ? allCompanies.find((c) => c.id === linkCompanyId)?.name : "";

  return (
    <div className="space-y-8">
      {/* Premium Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="flex items-center gap-2 font-bold text-foreground text-xl tracking-tight">
              <HeartHandshake className="h-5 w-5 text-primary" /> Life Insurance
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage client's life insurance company connections and documents in one consolidated place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLinkOpen(true)}
              className="bg-background/50 backdrop-blur-sm"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Link Company
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setAddingCompanyId("");
                setIsUploadOpen(true);
              }}
              className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Document
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Associated Companies and Their Documents */}
        <div className="space-y-6 lg:col-span-2">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
            Associated Life Insurance Companies
          </h2>

          {associatedCompanies.length > 0 ? (
            associatedCompanies.map((company) => {
              const companyDocs = documentsByCompany.get(company.id!) || [];

              return (
                <Card
                  key={company.id ?? company.name}
                  className="overflow-hidden border border-muted/20 bg-gradient-to-b from-card to-muted/5 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <CardHeader className="border-muted/10 border-b bg-muted/10 px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground">{company.name}</h3>
                          <Link
                            href={`/dashboard/admin/life-insurance-companies/${company.id}`}
                            className="text-muted-foreground transition-colors hover:text-primary"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                          {company.websiteUrl && (
                            <a
                              href={
                                company.websiteUrl.startsWith("http")
                                  ? company.websiteUrl
                                  : `https://${company.websiteUrl}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary hover:underline"
                            >
                              <Globe className="h-3 w-3" />
                              {company.websiteUrl.replace(/^https?:\/\//, "")}
                            </a>
                          )}
                          {company.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {formatPhoneNumber(company.phone)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnlinkCompany(company.id!)}
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
                            setAddingCompanyId(company.id!);
                            setIsUploadOpen(true);
                          }}
                          className="h-7 text-primary text-xs hover:bg-primary/5 hover:text-primary/80"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Upload for this company
                        </Button>
                      </div>

                      {companyDocs.length > 0 ? (
                        <div className="divide-y divide-muted/10 overflow-hidden rounded-lg border border-muted/20 bg-background">
                          {companyDocs.map((doc, idx) => (
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
                          <p className="text-xs">No documents uploaded for this company.</p>
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
              <h3 className="font-bold text-foreground text-sm">No Companies Linked</h3>
              <p className="mt-1 max-w-sm text-xs">
                Connect this client to a life insurance company to manage documents and associations.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsLinkOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Link a Company
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAddingCompanyId("");
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
                <CardDescription className="text-xs">Documents not associated with linked companies.</CardDescription>
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
                              {doc.type} {doc.firmId && `(${companyNameMap.get(doc.firmId) || "Unknown Company"})`}
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
          {availableCompaniesToLink.length > 0 && (
            <div>
              <h2 className="mb-6 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Quick Links</h2>
              <Card className="border border-muted/20 bg-gradient-to-b from-card to-muted/5 shadow-sm">
                <CardHeader className="py-4">
                  <CardTitle className="font-bold text-sm">Available Companies</CardTitle>
                  <CardDescription className="text-xs">Companies you can associate with this client.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-60 divide-y divide-muted/10 overflow-y-auto">
                    {availableCompaniesToLink.map((company) => (
                      <div key={company.id ?? company.name} className="flex items-center justify-between p-3.5 text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="truncate font-semibold text-foreground">{company.name}</p>
                          {company.websiteUrl && (
                            <p className="truncate text-[10px] text-muted-foreground">{company.websiteUrl}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setIsLinking(true);
                            try {
                              const res = await linkClientToLifeInsuranceCompany(company.id!, client.id!);
                              if (res.success) {
                                toast.success("Company associated successfully");
                                window.dispatchEvent(new CustomEvent("association-change"));
                                startTransition(() => {
                                  router.refresh();
                                });
                              } else {
                                toast.error(res.error || "Failed to associate company");
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
              <UploadCloud className="h-5 w-5 text-primary" /> Add Life Insurance Document
            </DialogTitle>
            <DialogDescription>
              Select the document type, the company it belongs to, and upload the file.
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

            {/* Company Select */}
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="upload-doc-company"
                className="font-semibold text-foreground text-xs uppercase tracking-wider"
              >
                Insurance Company
              </label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="upload-doc-company"
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between text-left font-normal text-sm"
                  >
                    {selectedCompanyName || "Select company (optional)"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search companies..." />
                    <CommandList>
                      <CommandEmpty>No companies found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setAddingCompanyId("");
                            setComboboxOpen(false);
                          }}
                          className="text-muted-foreground italic"
                        >
                          <Check className={cn("mr-2 h-4 w-4 opacity-0", !addingCompanyId && "opacity-100")} />
                          No Company / General Document
                        </CommandItem>
                        {allCompanies.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              setAddingCompanyId(company.id || "");
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4 opacity-0", addingCompanyId === company.id && "opacity-100")}
                            />
                            {company.name}
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

      {/* Link Company Dialog */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="border border-muted/20 bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Link Life Insurance Company
            </DialogTitle>
            <DialogDescription>Link an existing life insurance company to this client.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <label
                htmlFor="link-company-select"
                className="font-semibold text-foreground text-xs uppercase tracking-wider"
              >
                Insurance Company
              </label>
              <Popover open={linkComboboxOpen} onOpenChange={setLinkComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="link-company-select"
                    variant="outline"
                    role="combobox"
                    aria-expanded={linkComboboxOpen}
                    className="w-full justify-between text-left font-normal text-sm"
                  >
                    {selectedLinkCompanyName || "Select company..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[380px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search companies..." />
                    <CommandList>
                      <CommandEmpty>No companies found.</CommandEmpty>
                      <CommandGroup>
                        {availableCompaniesToLink.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              setLinkCompanyId(company.id || "");
                              setLinkComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4 opacity-0", linkCompanyId === company.id && "opacity-100")}
                            />
                            {company.name}
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
              <Link href={`/dashboard/admin/life-insurance-companies/new?clientId=${client.id}`}>
                Create New Company
              </Link>
            </Button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleLinkCompany} disabled={isLinking || !linkCompanyId}>
              {isLinking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Link Company
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
