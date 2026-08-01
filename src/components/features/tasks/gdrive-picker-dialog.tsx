"use client";

import * as React from "react";

import {
  Check,
  ChevronRight,
  ExternalLink,
  File,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  HardDrive,
  Link2,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { type DriveItem, getGoogleDriveFolderContents } from "@/actions/google-drive";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GoogleDrivePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  documentUrl: string;
  onSelect: (item: { name: string; url: string; isFolder: boolean }) => void;
}

interface BreadcrumbItem {
  folderId?: string;
  name: string;
}

function getFileIcon(mimeType: string, isFolder: boolean) {
  if (isFolder) return <Folder className="h-5 w-5 fill-amber-500/20 text-amber-500" />;
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
  }
  if (mimeType.includes("image") || mimeType.includes("png") || mimeType.includes("jpeg")) {
    return <FileImage className="h-5 w-5 text-purple-500" />;
  }
  if (mimeType.includes("json") || mimeType.includes("javascript") || mimeType.includes("code")) {
    return <FileCode className="h-5 w-5 text-orange-500" />;
  }
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function GoogleDrivePickerDialog({
  open,
  onOpenChange,
  entityName,
  documentUrl,
  onSelect,
}: GoogleDrivePickerDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<DriveItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedItem, setSelectedItem] = React.useState<DriveItem | null>(null);

  // Breadcrumb stack
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([]);

  // Manual Tab state
  const [activeTab, setActiveTab] = React.useState<"browse" | "manual">("browse");
  const [manualUrl, setManualUrl] = React.useState("");
  const [manualName, setManualName] = React.useState("");

  const currentFolderId = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 1].folderId : undefined;

  const loadContents = React.useCallback(
    async (folderIdToFetch?: string) => {
      setLoading(true);
      setError(null);
      setSelectedItem(null);
      try {
        const res = await getGoogleDriveFolderContents(documentUrl, folderIdToFetch);
        if (res.success && res.items) {
          setItems(res.items);

          // Update root breadcrumb label if server returned a folder name
          setBreadcrumbs((prev) => {
            if (prev.length === 0) {
              return [{ name: res.folderName || `${entityName}'s Documents`, folderId: res.folderId }];
            }
            return prev;
          });
        } else {
          setError(res.error || "Failed to load Google Drive folder contents.");
          setItems([]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [documentUrl, entityName],
  );

  // Reset when dialog opens
  React.useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    setSelectedItem(null);
    setError(null);
    setActiveTab("browse");
    setManualUrl("");
    setManualName("");
    setBreadcrumbs([{ name: `${entityName}'s Folder` }]);
    loadContents();
  }, [open, entityName, loadContents]);

  const handleNavigateToFolder = (folder: DriveItem) => {
    setBreadcrumbs((prev) => [...prev, { name: folder.name, folderId: folder.id }]);
    loadContents(folder.id);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === breadcrumbs.length - 1) return;
    const nextStack = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(nextStack);
    const targetId = nextStack[nextStack.length - 1].folderId;
    loadContents(targetId);
  };

  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, searchQuery]);

  const handleConfirmSelect = () => {
    if (activeTab === "manual") {
      if (!manualUrl.trim()) {
        toast.error("Please enter a Google Drive URL");
        return;
      }
      onSelect({
        name: manualName.trim() || "Google Drive Link",
        url: manualUrl.trim(),
        isFolder: manualUrl.includes("/folders/"),
      });
      onOpenChange(false);
      return;
    }

    if (!selectedItem) {
      toast.error("Please select a file or folder to link");
      return;
    }

    onSelect({
      name: selectedItem.name,
      url: selectedItem.webViewLink,
      isFolder: selectedItem.isFolder,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-2xl">
        <DialogHeader className="border-b pb-2">
          <DialogTitle className="flex items-center gap-2 font-semibold text-xl">
            <HardDrive className="h-5 w-5 text-emerald-600" />
            Link Google Drive File
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Browse documents and folders for <span className="font-medium text-foreground">{entityName}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "browse" | "manual")} className="w-full">
          <div className="flex items-center justify-between px-1 pt-2">
            <TabsList className="grid w-48 grid-cols-2">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="manual">Paste Link</TabsTrigger>
            </TabsList>
            <a
              href={documentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground hover:underline"
            >
              Open in Google Drive
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <TabsContent value="browse" className="mt-3 space-y-3 focus-visible:outline-none">
            {/* Breadcrumb Navigation */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-muted/50 px-3 py-2 font-medium text-xs">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.folderId || crumb.name}>
                    {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleBreadcrumbClick(idx)}
                      className={`max-w-[150px] truncate transition-colors ${
                        isLast
                          ? "cursor-default font-semibold text-foreground"
                          : "text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files and folders in current view…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Folder & File List Container */}
            <div className="h-72 divide-y divide-border overflow-y-auto rounded-md border bg-background p-1">
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  <span className="text-xs">Fetching Google Drive contents…</span>
                </div>
              ) : error ? (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                  <p className="mb-1 font-medium text-destructive text-sm">{error}</p>
                  <p className="mb-3 text-muted-foreground text-xs">
                    Ensure the document URL is valid and Google OAuth permissions are configured.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => loadContents(currentFolderId)}>
                    Try Again
                  </Button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
                  <Folder className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="font-medium text-sm">No items found</p>
                  <p className="text-muted-foreground text-xs">
                    {searchQuery ? "No files match your search criteria." : "This folder is empty."}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
                        isSelected
                          ? "bg-emerald-500/10 font-medium text-emerald-950 dark:text-emerald-100"
                          : "hover:bg-accent"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        onDoubleClick={() => {
                          if (item.isFolder) handleNavigateToFolder(item);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                      >
                        <div className="shrink-0">{getFileIcon(item.mimeType, item.isFolder)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 truncate font-medium text-sm leading-none">{item.name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{item.isFolder ? "Folder" : formatBytes(item.size) || "File"}</span>
                            {item.modifiedTime && (
                              <>
                                <span>•</span>
                                <span>{new Date(item.modifiedTime).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center gap-2">
                        {item.isFolder && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
                            onClick={() => handleNavigateToFolder(item)}
                          >
                            Open
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <a
                          href={item.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {isSelected && <Check className="h-4 w-4 font-bold text-emerald-600" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selection info preview */}
            {selectedItem && (
              <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs dark:border-emerald-800/50 dark:bg-emerald-950/30">
                <div className="flex min-w-0 items-center gap-2 truncate">
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-100 text-emerald-800">
                    Selected
                  </Badge>
                  <span className="truncate font-medium">{selectedItem.name}</span>
                </div>
                <span className="shrink-0 text-muted-foreground">{selectedItem.isFolder ? "Folder" : "Document"}</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-3 space-y-4 py-2 focus-visible:outline-none">
            <div className="space-y-3">
              <div>
                <label htmlFor="manual-gdrive-url" className="mb-1 block font-medium text-foreground text-xs">
                  Google Drive Link / URL
                </label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="manual-gdrive-url"
                    placeholder="https://drive.google.com/file/d/... or /folders/..."
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="manual-gdrive-name" className="mb-1 block font-medium text-foreground text-xs">
                  Display Title (Optional)
                </label>
                <Input
                  id="manual-gdrive-name"
                  placeholder="e.g. 2025 Tax Return Document"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmSelect}
            disabled={activeTab === "browse" ? !selectedItem : !manualUrl.trim()}
            className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Link2 className="h-4 w-4" />
            Link {selectedItem?.isFolder ? "Folder" : "File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
