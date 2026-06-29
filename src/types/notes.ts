import { z } from "zod";

// A note can be associated with clients and/or companies, or stand alone.
export const NoteAssociationEntitySchema = z.enum(["client", "company"]);
export type NoteAssociationEntity = z.infer<typeof NoteAssociationEntitySchema>;

export const NoteAssociationSchema = z.object({
  entityType: NoteAssociationEntitySchema,
  entityId: z.string(),
});
export type NoteAssociation = z.infer<typeof NoteAssociationSchema>;

// Attachments: an uploaded file or a pasted link preview.
export const NoteAttachmentSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(["file", "link"]).default("file"),
  // file
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  // link
  linkUrl: z.string().optional().nullable(),
  linkTitle: z.string().optional().nullable(),
  linkFavicon: z.string().optional().nullable(),
  linkProvider: z.enum(["google-drive", "web"]).optional().nullable(),
});
export type NoteAttachment = z.infer<typeof NoteAttachmentSchema>;

// Payload to create a top-level note.
export const NoteFormSchema = z.object({
  title: z.string().min(1, "A topic is required").max(200, "Keep the topic under 200 characters"),
  body: z.string().default(""),
  associations: z.array(NoteAssociationSchema).default([]),
  attachments: z.array(NoteAttachmentSchema).default([]),
  mentionIds: z.array(z.string()).default([]),
});
export type NoteFormValues = z.infer<typeof NoteFormSchema>;
export type NoteFormInput = z.input<typeof NoteFormSchema>;

// Payload to create a reply / sub-reply.
export const ReplyFormSchema = z.object({
  parentId: z.string(),
  body: z.string().min(1, "Reply can't be empty"),
  attachments: z.array(NoteAttachmentSchema).default([]),
  mentionIds: z.array(z.string()).default([]),
});
export type ReplyFormValues = z.infer<typeof ReplyFormSchema>;

export interface NoteAuthorRef {
  uid: string | null;
  name: string;
  photoURL?: string | null;
  role?: string | null;
}

export interface NoteAssociationRef {
  entityType: NoteAssociationEntity;
  entityId: string;
  name: string;
}

export interface NoteReactionGroup {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

// A single node in a thread (note, reply, or sub-reply).
export interface NoteNode {
  id: string;
  parentId: string | null;
  rootId: string | null;
  depth: number;
  title: string | null;
  body: string;
  isDeleted: boolean;
  score: number;
  myVote: number; // -1 | 0 | 1
  createdAt: string;
  updatedAt: string | null;
  author: NoteAuthorRef;
  attachments: NoteAttachment[];
  reactions: NoteReactionGroup[];
  associations: NoteAssociationRef[];
  replies: NoteNode[];
}

// Summary row for list views (overview card, notes landing, entity tabs).
export interface NoteSummary {
  id: string;
  title: string;
  excerpt: string;
  author: NoteAuthorRef;
  associations: NoteAssociationRef[];
  replyCount: number;
  score: number;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string | null;
  lastActivityAt: string;
}

export interface NoteNotification {
  id: string;
  noteId: string;
  rootId: string | null;
  actorName: string | null;
  type: "mention" | "reply";
  preview: string | null;
  isRead: boolean;
  createdAt: string;
}

export const MAX_NOTE_DEPTH = 2;
