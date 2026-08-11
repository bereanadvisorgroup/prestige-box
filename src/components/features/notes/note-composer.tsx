"use client";

import * as React from "react";

import { Loader2, Paperclip, Send, Upload } from "lucide-react";
import { toast } from "sonner";

import { createNote, createReply, fetchLinkPreview, getMentionableUsers } from "@/actions/notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase.client";
import { cn } from "@/lib/utils";
import type { NoteAssociation, NoteAttachment } from "@/types/notes";

import { AssociationPicker } from "./association-picker";
import { AttachmentList } from "./attachment-list";
import type { MentionUser } from "./mention-list";
import { NoteEditor } from "./note-editor";

interface NoteComposerProps {
  mode: "note" | "reply";
  parentId?: string;
  /** Pre-selected associations (used on a client/company page). */
  defaultAssociations?: NoteAssociation[];
  /** Hide the association picker when the context fixes the association. */
  lockAssociations?: boolean;
  onSubmitted?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  autoFocus?: boolean;
  className?: string;
}

const BUCKET = "documents";

function sanitize(name: string): string {
  return name.replace(/[^\w.-]+/g, "_");
}

export function NoteComposer({
  mode,
  parentId,
  defaultAssociations = [],
  lockAssociations = false,
  onSubmitted,
  onCancel,
  submitLabel,
  className,
}: NoteComposerProps) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [mentionIds, setMentionIds] = React.useState<string[]>([]);
  const [associations, setAssociations] = React.useState<NoteAssociation[]>(defaultAssociations);
  const [attachments, setAttachments] = React.useState<NoteAttachment[]>([]);
  const [mentionUsers, setMentionUsers] = React.useState<MentionUser[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getMentionableUsers();
      if (!cancelled && res.success) setMentionUsers(res.users || []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const uploadFiles = React.useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    try {
      for (const file of list) {
        const path = `notes/${crypto.randomUUID()}-${sanitize(file.name)}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file);
        if (error) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        setAttachments((prev) => [
          ...prev,
          { kind: "file", fileUrl: data.publicUrl, fileName: file.name, fileSize: file.size, mimeType: file.type },
        ]);
      }
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const handlePasteLink = React.useCallback(async (url: string) => {
    // Optimistically add a chip, then enrich it with a fetched preview.
    const placeholder: NoteAttachment = { kind: "link", linkUrl: url, linkTitle: url, linkProvider: "web" };
    setAttachments((prev) => [...prev, placeholder]);
    const res = await fetchLinkPreview(url);
    if (res.success && res.preview) {
      setAttachments((prev) =>
        prev.map((a) => (a.kind === "link" && a.linkUrl === url && a.linkTitle === url ? { ...res.preview } : a)),
      );
    }
  }, []);

  const removeAttachment = (index: number) => setAttachments((prev) => prev.filter((_, i) => i !== index));

  const reset = () => {
    setTitle("");
    setBody("");
    setMentionIds([]);
    setAttachments([]);
    if (!lockAssociations) setAssociations(defaultAssociations);
  };

  const canSubmit =
    !submitting &&
    !uploading &&
    (mode === "note" ? title.trim().length > 0 : body.trim().length > 0 || attachments.length > 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      if (mode === "note") {
        const res = await createNote({ title: title.trim(), body, associations, attachments, mentionIds }, origin);
        if (!res.success) {
          toast.error(res.error || "Failed to create note");
          return;
        }
        toast.success("Note posted");
      } else {
        if (!parentId) return;
        const res = await createReply({ parentId, body, attachments, mentionIds }, origin);
        if (!res.success) {
          toast.error(res.error || "Failed to reply");
          return;
        }
        toast.success("Reply posted");
      }
      reset();
      onSubmitted?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a file drop zone is a non-semantic surface
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-lg border bg-card p-3",
        dragging && "ring-2 ring-primary ring-offset-2",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={handleDrop}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-primary/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 font-medium text-primary text-sm">
            <Upload className="h-5 w-5" />
            Drop files to attach
          </div>
        </div>
      )}

      {mode === "note" && (
        <Input
          placeholder="Topic — what's this note about?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-medium"
        />
      )}

      <NoteEditor
        value={body}
        onChange={(html, ids) => {
          setBody(html);
          setMentionIds(ids);
        }}
        mentionUsers={mentionUsers}
        onPasteLink={handlePasteLink}
        placeholder={mode === "reply" ? "Write a reply…  @ to mention, paste a link, or drop a file" : undefined}
        minHeight={mode === "reply" ? 72 : 100}
      />

      {attachments.length > 0 && <AttachmentList attachments={attachments} onRemove={removeAttachment} />}

      {mode === "note" && !lockAssociations && <AssociationPicker value={associations} onChange={setAssociations} />}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            Attach
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="button" size="sm" className="gap-1.5" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitLabel ?? (mode === "note" ? "Post note" : "Reply")}
          </Button>
        </div>
      </div>
    </div>
  );
}
