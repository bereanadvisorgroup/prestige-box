"use client";

import * as React from "react";

import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteNote, getMentionableUsers, updateNote } from "@/actions/notes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { MAX_NOTE_DEPTH, type NoteNode } from "@/types/notes";

import { AttachmentList } from "./attachment-list";
import type { MentionUser } from "./mention-list";
import { NoteComposer } from "./note-composer";
import { NoteEditor } from "./note-editor";
import { ReactionBar } from "./reaction-bar";
import { VoteControl } from "./vote-control";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface NoteItemProps {
  node: NoteNode;
  onChanged: () => void;
}

export function NoteItem({ node, onChanged }: NoteItemProps) {
  const myUid = useAuthStore((s) => s.profile?.uid);
  const isAdmin = useAuthStore((s) => s.profile?.role === "admin");
  const [replying, setReplying] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editBody, setEditBody] = React.useState(node.body);
  const [editTitle, setEditTitle] = React.useState(node.title ?? "");
  const [mentionUsers, setMentionUsers] = React.useState<MentionUser[]>([]);
  const [saving, setSaving] = React.useState(false);

  const isAuthor = !!myUid && node.author.uid === myUid;
  const canReply = node.depth < MAX_NOTE_DEPTH && !node.isDeleted;
  const canEdit = isAuthor && !node.isDeleted;
  const canDelete = (isAuthor || isAdmin) && !node.isDeleted;

  React.useEffect(() => {
    if (!editing || mentionUsers.length) return;
    getMentionableUsers().then((res) => {
      if (res.success) setMentionUsers(res.users || []);
    });
  }, [editing, mentionUsers.length]);

  const saveEdit = async () => {
    setSaving(true);
    const res = await updateNote(node.id, {
      title: node.depth === 0 ? editTitle.trim() : undefined,
      body: editBody,
    });
    setSaving(false);
    if (!res.success) {
      toast.error(res.error || "Failed to save");
      return;
    }
    toast.success("Saved");
    setEditing(false);
    onChanged();
  };

  const handleDelete = async () => {
    const res = await deleteNote(node.id);
    if (!res.success) {
      toast.error(res.error || "Failed to delete");
      return;
    }
    toast.success("Deleted");
    onChanged();
  };

  const created = node.createdAt ? new Date(node.createdAt) : null;
  const edited = node.updatedAt && node.createdAt && node.updatedAt !== node.createdAt;

  return (
    <div className="flex gap-2.5">
      {!node.isDeleted && (
        <div className="pt-0.5">
          <VoteControl noteId={node.id} score={node.score} myVote={node.myVote} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {node.author.photoURL ? <AvatarImage src={node.author.photoURL} alt={node.author.name} /> : null}
            <AvatarFallback className="text-[10px]">{initials(node.author.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{node.isDeleted ? "—" : node.author.name}</span>
          {created && (
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(created, { addSuffix: true })}
              {edited && " · edited"}
            </span>
          )}
          {(canEdit || canDelete) && (
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="mt-1.5">
          {node.isDeleted ? (
            <p className="text-muted-foreground text-sm italic">[deleted]</p>
          ) : editing ? (
            <div className="flex flex-col gap-2">
              {node.depth === 0 && (
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="font-medium" />
              )}
              <NoteEditor
                value={editBody}
                onChange={(html) => setEditBody(html)}
                mentionUsers={mentionUsers}
                minHeight={72}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEdit} disabled={saving}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              {node.depth === 0 && node.title && <h2 className="font-semibold text-lg">{node.title}</h2>}
              <div
                className="prose prose-sm dark:prose-invert max-w-none [&_.mention]:font-medium [&_.mention]:text-primary [&_a]:text-primary [&_a]:underline"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: body is sanitized with DOMPurify
                dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(node.body) }}
              />
            </>
          )}
        </div>

        {/* Attachments */}
        {!node.isDeleted && node.attachments.length > 0 && (
          <AttachmentList attachments={node.attachments} className="mt-2" />
        )}

        {/* Actions */}
        {!node.isDeleted && !editing && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <ReactionBar noteId={node.id} reactions={node.reactions} />
            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-muted-foreground text-xs"
                onClick={() => setReplying((v) => !v)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reply
              </Button>
            )}
          </div>
        )}

        {/* Reply composer */}
        {replying && (
          <div className="mt-2">
            <NoteComposer
              mode="reply"
              parentId={node.id}
              onSubmitted={() => {
                setReplying(false);
                onChanged();
              }}
              onCancel={() => setReplying(false)}
            />
          </div>
        )}

        {/* Nested replies */}
        {node.replies.length > 0 && (
          <div className={cn("mt-3 space-y-3 border-l-2 pl-3 md:pl-4", "border-muted")}>
            {node.replies.map((child) => (
              <NoteItem key={child.id} node={child} onChanged={onChanged} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
