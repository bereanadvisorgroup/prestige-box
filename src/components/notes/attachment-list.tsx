"use client";

import { FileText, ImageIcon, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NoteAttachment } from "@/types/notes";

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function FileIcon({ mime }: { mime?: string | null }) {
  if (mime?.startsWith("image/")) return <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
  return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

const DRIVE_BADGE = "Google Drive";

interface AttachmentListProps {
  attachments: NoteAttachment[];
  /** When provided, each attachment shows a remove button (composer mode). */
  onRemove?: (index: number) => void;
  className?: string;
}

export function AttachmentList({ attachments, onRemove, className }: AttachmentListProps) {
  if (!attachments.length) return null;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {attachments.map((a, index) => {
        const key = a.id ?? `${a.kind}-${index}`;
        if (a.kind === "link") {
          return (
            <div key={key} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-sm">
              {a.linkFavicon ? (
                // biome-ignore lint/performance/noImgElement: external favicon URL, not suited to next/image
                <img src={a.linkFavicon} alt="" className="h-4 w-4 shrink-0 rounded-sm" />
              ) : (
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <a
                href={a.linkUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-primary hover:underline"
                title={a.linkUrl ?? undefined}
              >
                {a.linkTitle || a.linkUrl}
              </a>
              {a.linkProvider === "google-drive" && (
                <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 font-medium text-[10px] text-blue-600">
                  {DRIVE_BADGE}
                </span>
              )}
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={() => onRemove(index)}
                  aria-label="Remove link"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        }
        return (
          <div key={key} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-sm">
            <FileIcon mime={a.mimeType} />
            <a
              href={a.fileUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate hover:underline"
              title={a.fileName ?? undefined}
            >
              {a.fileName || "Attachment"}
            </a>
            {a.fileSize ? (
              <span className="shrink-0 text-muted-foreground text-xs">{formatBytes(a.fileSize)}</span>
            ) : null}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={() => onRemove(index)}
                aria-label="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
