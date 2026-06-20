"use client";

import { useState } from "react";

import { File, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { updateClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase.client";
import type { Client, ClientDocument } from "@/types/crm";

export function DocumentsTab({
  client,
  title,
  category,
  types,
  firms,
  firmLabel,
  uploadViaDialog = false,
}: {
  client: Client;
  title: string;
  category: "pcDocuments" | "lifeDocuments" | "estateDocuments";
  types: string[];
  firms?: { id: string; name: string }[];
  firmLabel?: string;
  uploadViaDialog?: boolean;
}) {
  const [documents, setDocuments] = useState<ClientDocument[]>(client[category] || []);
  const [isUploading, setIsUploading] = useState(false);
  const [addingDocType, setAddingDocType] = useState<string>("");
  const [addingFirmId, setAddingFirmId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      const updated = documents.filter((d) => d.id !== id);
      const res = await updateClient(client.id!, { [category]: updated });
      if (res.success) {
        setDocuments(updated);
        toast.success("Document removed");
      } else {
        toast.error("Failed to remove document");
      }
    } catch (_e) {
      toast.error("An error occurred");
    }
  };

  const handleUpload = async () => {
    if (!file || !addingDocType) {
      toast.error("Please select a file and a document type");
      return;
    }

    if (firms && !addingFirmId) {
      toast.error(`Please select a ${firmLabel || "firm"}`);
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const randomStr = Math.random().toString(36).substring(7);
      const filePath = `clients/${client.id}/${category}/${randomStr}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage.from("documents").upload(filePath, file);

      if (error) throw error;

      const {
        data: { publicUrl: url },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      const newDoc: ClientDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        type: addingDocType,
        uploadedAt: new Date().toISOString(),
        firmId: firms ? addingFirmId : undefined,
      };

      const updated = [...documents, newDoc];
      const res = await updateClient(client.id!, { [category]: updated });
      if (res.success) {
        setDocuments(updated);
        toast.success("Document uploaded successfully");
        setFile(null);
        setAddingDocType("");
        setAddingFirmId("");
        // Reset file input
        const fileInput = document.getElementById(`file-upload-${category}`) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        const dialogFileInput = document.getElementById(`dialog-file-upload-${category}`) as HTMLInputElement;
        if (dialogFileInput) dialogFileInput.value = "";
        setIsDialogOpen(false);
      } else {
        throw new Error("Failed to update database");
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="fade-in animate-in border-none bg-gradient-to-b from-card to-muted/20 shadow-md duration-500">
      <CardHeader className="bg-muted/10 pb-4 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>Upload and manage documents for this category.</CardDescription>
        </div>
        {uploadViaDialog && (
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="ml-4 shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add Document
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {!uploadViaDialog ? (
          <div className="flex flex-col items-end gap-4 rounded-lg border bg-background p-4 shadow-sm sm:flex-row">
            <div className="w-full space-y-2 sm:w-1/3">
              <label htmlFor={`doc-type-${category}`} className="font-medium text-sm">
                Document Type
              </label>
              <Select value={addingDocType} onValueChange={setAddingDocType}>
                <SelectTrigger id={`doc-type-${category}`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {firms && (
              <div className="w-full space-y-2 sm:w-1/3">
                <label htmlFor={`doc-firm-${category}`} className="font-medium text-sm">
                  {firmLabel || "Firm"}
                </label>
                <Select value={addingFirmId} onValueChange={setAddingFirmId}>
                  <SelectTrigger id={`doc-firm-${category}`}>
                    <SelectValue placeholder="Select firm" />
                  </SelectTrigger>
                  <SelectContent>
                    {firms.length > 0 ? (
                      firms.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No associated firms
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="w-full flex-1 space-y-2">
              <label htmlFor={`file-upload-${category}`} className="font-medium text-sm">
                File
              </label>
              <input
                id={`file-upload-${category}`}
                type="file"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !file || !addingDocType}
              className="mt-4 w-full shrink-0 sm:mt-0 sm:w-auto"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              Upload
            </Button>
          </div>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add {title.endsWith(" Documents") ? title.slice(0, -10) : title} Document</DialogTitle>
                <DialogDescription>Select the document type and file to upload.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor={`dialog-doc-type-${category}`} className="font-medium text-sm">
                    Document Type
                  </label>
                  <Select value={addingDocType} onValueChange={setAddingDocType}>
                    <SelectTrigger id={`dialog-doc-type-${category}`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {firms && (
                  <div className="space-y-2">
                    <label htmlFor={`dialog-doc-firm-${category}`} className="font-medium text-sm">
                      {firmLabel || "Firm"}
                    </label>
                    <Select value={addingFirmId} onValueChange={setAddingFirmId}>
                      <SelectTrigger id={`dialog-doc-firm-${category}`}>
                        <SelectValue placeholder="Select firm" />
                      </SelectTrigger>
                      <SelectContent>
                        {firms.length > 0 ? (
                          firms.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No associated firms
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor={`dialog-file-upload-${category}`} className="font-medium text-sm">
                    File
                  </label>
                  <input
                    id={`dialog-file-upload-${category}`}
                    type="file"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <DialogFooter>
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
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <div className="mt-8 space-y-3">
          {documents.length > 0 ? (
            documents.map((doc, index) => (
              <div
                key={doc.id || `doc-${index}`}
                className="flex items-center justify-between rounded-md border bg-background p-3 shadow-sm transition-colors hover:bg-muted/5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded bg-primary/10 p-2 text-primary">
                    <File className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{doc.name}</p>
                    <div className="flex gap-2">
                      <p className="text-muted-foreground text-xs">{doc.type}</p>
                      {doc.firmId && firms && (
                        <>
                          <span className="text-muted-foreground text-xs">•</span>
                          <p className="text-muted-foreground text-xs">
                            {firms.find((f) => f.id === doc.firmId)?.name || "Unknown Firm"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(doc.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border-2 border-dashed bg-muted/10 p-8 text-center text-muted-foreground">
              <File className="mx-auto mb-3 h-8 w-8 opacity-20" />
              <p className="text-sm">No documents uploaded yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
