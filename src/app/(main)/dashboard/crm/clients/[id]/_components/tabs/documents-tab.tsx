"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, File, UploadCloud } from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { toast } from "sonner";
import { storage } from "@/lib/firebase.client";
import { updateClient } from "@/actions/clients";
import { type Client, type ClientDocument } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DocumentsTab({
  client,
  title,
  category,
  types,
}: {
  client: Client;
  title: string;
  category: "pcDocuments" | "lifeDocuments" | "estateDocuments";
  types: string[];
}) {
  const [documents, setDocuments] = useState<ClientDocument[]>(client[category] || []);
  const [isUploading, setIsUploading] = useState(false);
  const [addingDocType, setAddingDocType] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

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
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const handleUpload = async () => {
    if (!file || !addingDocType) {
      toast.error("Please select a file and a document type");
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const randomStr = Math.random().toString(36).substring(7);
      const storageRef = ref(storage, `clients/${client.id}/${category}/${randomStr}_${Date.now()}.${fileExt}`);

      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      const newDoc: ClientDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        url,
        type: addingDocType,
        uploadedAt: new Date().toISOString(),
      };

      const updated = [...documents, newDoc];
      const res = await updateClient(client.id!, { [category]: updated });
      if (res.success) {
        setDocuments(updated);
        toast.success("Document uploaded successfully");
        setFile(null);
        setAddingDocType("");
        // Reset file input
        const fileInput = document.getElementById(`file-upload-${category}`) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        throw new Error("Failed to update database");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-none shadow-md bg-gradient-to-b from-card to-muted/20 animate-in fade-in duration-500">
      <CardHeader className="bg-muted/10 pb-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>Upload and manage documents for this category.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end bg-background p-4 rounded-lg border shadow-sm">
          <div className="w-full sm:w-1/3 space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <Select value={addingDocType} onValueChange={setAddingDocType}>
              <SelectTrigger>
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
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium">File</label>
            <input
              id={`file-upload-${category}`}
              type="file"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={isUploading || !file || !addingDocType}
            className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0"
          >
            {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </div>

        <div className="space-y-3 mt-8">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/5 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded text-primary">
                    <File className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type}</p>
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
            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
              <File className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No documents uploaded yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
