"use server";

import { revalidatePath } from "next/cache";

import { Resend } from "resend";

import { getCurrentActor, recordEvent } from "@/lib/history/record";
import { sanitizeNoteHtml } from "@/lib/sanitize";
import { supabaseServer } from "@/lib/supabase.server";
import {
  MAX_NOTE_DEPTH,
  type NoteAssociationRef,
  type NoteAttachment,
  type NoteAuthorRef,
  NoteFormSchema,
  type NoteFormValues,
  type NoteNode,
  type NoteNotification,
  type NoteReactionGroup,
  type NoteSummary,
  ReplyFormSchema,
  type ReplyFormValues,
} from "@/types/notes";

const NOTES = "notes";
const ASSOCIATIONS = "note_associations";
const ATTACHMENTS = "note_attachments";
const REACTIONS = "note_reactions";
const VOTES = "note_votes";
const NOTIFICATIONS = "note_notifications";

export interface NoteFilter {
  clientId?: string;
  companyId?: string;
}

// --- internal helpers -------------------------------------------------------

/** Strips HTML tags and decodes a few common entities into plain text. */
function toPlainText(html: string): string {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(html: string, max = 160): string {
  const text = toPlainText(html);
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Resolves display names for note associations (clients via person, companies directly). */
async function resolveAssociationNames(rows: { entityType: string; entityId: string }[]): Promise<Map<string, string>> {
  const names = new Map<string, string>(); // key: `${entityType}:${entityId}`
  const clientIds = Array.from(new Set(rows.filter((r) => r.entityType === "client").map((r) => r.entityId)));
  const companyIds = Array.from(new Set(rows.filter((r) => r.entityType === "company").map((r) => r.entityId)));

  if (clientIds.length > 0) {
    const { data: clients } = await supabaseServer.from("clients").select("id, personId").in("id", clientIds);
    const personIds = Array.from(new Set((clients || []).map((c) => c.personId)));
    const { data: people } = personIds.length
      ? await supabaseServer.from("people").select("id, firstName, lastName").in("id", personIds)
      : { data: [] };
    const peopleMap = new Map((people || []).map((p) => [p.id, `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim()]));
    for (const c of clients || []) {
      names.set(`client:${c.id}`, peopleMap.get(c.personId) || "Unknown client");
    }
  }

  if (companyIds.length > 0) {
    const { data: companies } = await supabaseServer.from("companies").select("id, name").in("id", companyIds);
    for (const c of companies || []) names.set(`company:${c.id}`, c.name || "Unknown company");
  }

  return names;
}

/** Resolves author display info for a set of user ids. */
async function resolveAuthors(userIds: (string | null)[]): Promise<Map<string, NoteAuthorRef>> {
  const ids = Array.from(new Set(userIds.filter((u): u is string => !!u)));
  const map = new Map<string, NoteAuthorRef>();
  if (ids.length === 0) return map;
  const { data: users } = await supabaseServer
    .from("users")
    .select("uid, firstName, lastName, photoURL, role")
    .in("uid", ids);
  for (const u of users || []) {
    map.set(u.uid, {
      uid: u.uid,
      name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown",
      photoURL: u.photoURL,
      role: u.role,
    });
  }
  return map;
}

const SYSTEM_AUTHOR: NoteAuthorRef = { uid: null, name: "System" };

function authorFor(map: Map<string, NoteAuthorRef>, id: string | null): NoteAuthorRef {
  return (id && map.get(id)) || SYSTEM_AUTHOR;
}

// --- reads ------------------------------------------------------------------

/**
 * Top-level note summaries for list views. Filtered to a client or company
 * when provided, otherwise returns all notes. Ordered by most recent activity.
 */
export async function getNotes(filter: NoteFilter = {}) {
  try {
    let rootIds: string[] | null = null;

    if (filter.clientId || filter.companyId) {
      const entityType = filter.clientId ? "client" : "company";
      const entityId = (filter.clientId ?? filter.companyId) as string;
      const { data, error } = await supabaseServer
        .from(ASSOCIATIONS)
        .select("noteId")
        .eq("entityType", entityType)
        .eq("entityId", entityId);
      if (error) throw new Error(error.message);
      rootIds = Array.from(new Set((data || []).map((r) => r.noteId)));
      if (rootIds.length === 0) return { success: true, notes: [] as NoteSummary[] };
    }

    let query = supabaseServer
      .from(NOTES)
      .select("*")
      .eq("depth", 0)
      .eq("isDeleted", false)
      .order("updatedAt", { ascending: false });
    if (rootIds !== null) query = query.in("id", rootIds);

    const { data: roots, error } = await query;
    if (error) throw new Error(error.message);
    if (!roots || roots.length === 0) return { success: true, notes: [] as NoteSummary[] };

    const ids = roots.map((n) => n.id as string);

    const [{ data: children }, { data: assocRows }, { data: attachRows }] = await Promise.all([
      supabaseServer.from(NOTES).select("rootId, createdAt").in("rootId", ids).gt("depth", 0).eq("isDeleted", false),
      supabaseServer.from(ASSOCIATIONS).select("noteId, entityType, entityId").in("noteId", ids),
      supabaseServer.from(ATTACHMENTS).select("noteId").in("noteId", ids),
    ]);

    const replyCount = new Map<string, number>();
    const lastChildAt = new Map<string, string>();
    for (const c of children || []) {
      replyCount.set(c.rootId, (replyCount.get(c.rootId) || 0) + 1);
      const prev = lastChildAt.get(c.rootId);
      if (!prev || c.createdAt > prev) lastChildAt.set(c.rootId, c.createdAt);
    }

    const attachCount = new Map<string, number>();
    for (const a of attachRows || []) attachCount.set(a.noteId, (attachCount.get(a.noteId) || 0) + 1);

    const assocByNote = new Map<string, { entityType: string; entityId: string }[]>();
    for (const a of assocRows || []) {
      const list = assocByNote.get(a.noteId) ?? [];
      list.push({ entityType: a.entityType, entityId: a.entityId });
      assocByNote.set(a.noteId, list);
    }
    const nameMap = await resolveAssociationNames(assocRows || []);
    const authorMap = await resolveAuthors(roots.map((n) => n.authorId));

    const notes: NoteSummary[] = roots.map((n) => {
      const updatedAt = (n.updatedAt as string) ?? (n.createdAt as string);
      const childAt = lastChildAt.get(n.id);
      const lastActivityAt = childAt && childAt > updatedAt ? childAt : updatedAt;
      const assocs = (assocByNote.get(n.id) || []).map((a) => ({
        entityType: a.entityType as NoteAssociationRef["entityType"],
        entityId: a.entityId,
        name: nameMap.get(`${a.entityType}:${a.entityId}`) || "Unknown",
      }));
      return {
        id: n.id,
        title: n.title || "Untitled note",
        excerpt: excerpt(n.body || ""),
        author: authorFor(authorMap, n.authorId),
        associations: assocs,
        replyCount: replyCount.get(n.id) || 0,
        score: n.score ?? 0,
        attachmentCount: attachCount.get(n.id) || 0,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt ?? null,
        lastActivityAt,
      };
    });

    notes.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
    return { success: true, notes };
  } catch (error) {
    console.error("[getNotes] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/** The N most recently active notes — powers the dashboard overview card. */
export async function getRecentNotes(limit = 5) {
  const res = await getNotes();
  if (!res.success) return res;
  return { success: true, notes: (res.notes || []).slice(0, limit) };
}

/** A full thread (note + nested replies) addressed by the root note id. */
export async function getNoteThread(rootId: string) {
  try {
    const actor = await getCurrentActor();
    const me = actor.actorId;

    const { data: rows, error } = await supabaseServer
      .from(NOTES)
      .select("*")
      .or(`id.eq.${rootId},rootId.eq.${rootId}`)
      .order("createdAt", { ascending: true });
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return { success: false, error: "Note not found" };

    const ids = rows.map((r) => r.id as string);

    const [{ data: attachRows }, { data: reactionRows }, { data: voteRows }, { data: assocRows }] = await Promise.all([
      supabaseServer.from(ATTACHMENTS).select("*").in("noteId", ids),
      supabaseServer.from(REACTIONS).select("noteId, userId, emoji").in("noteId", ids),
      supabaseServer.from(VOTES).select("noteId, userId, value").in("noteId", ids),
      supabaseServer.from(ASSOCIATIONS).select("noteId, entityType, entityId").in("noteId", ids),
    ]);

    const authorMap = await resolveAuthors(rows.map((r) => r.authorId));
    const nameMap = await resolveAssociationNames(assocRows || []);

    const attachByNote = new Map<string, NoteAttachment[]>();
    for (const a of attachRows || []) {
      const list = attachByNote.get(a.noteId) ?? [];
      list.push({
        id: a.id,
        kind: a.kind,
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        fileSize: a.fileSize,
        mimeType: a.mimeType,
        linkUrl: a.linkUrl,
        linkTitle: a.linkTitle,
        linkFavicon: a.linkFavicon,
        linkProvider: a.linkProvider,
      });
      attachByNote.set(a.noteId, list);
    }

    const reactionAgg = new Map<string, Map<string, { count: number; mine: boolean }>>();
    for (const r of reactionRows || []) {
      const perNote = reactionAgg.get(r.noteId) ?? new Map();
      const cur = perNote.get(r.emoji) ?? { count: 0, mine: false };
      cur.count += 1;
      if (me && r.userId === me) cur.mine = true;
      perNote.set(r.emoji, cur);
      reactionAgg.set(r.noteId, perNote);
    }

    const myVoteByNote = new Map<string, number>();
    for (const v of voteRows || []) {
      if (me && v.userId === me) myVoteByNote.set(v.noteId, v.value);
    }

    const assocByNote = new Map<string, NoteAssociationRef[]>();
    for (const a of assocRows || []) {
      const list = assocByNote.get(a.noteId) ?? [];
      list.push({
        entityType: a.entityType,
        entityId: a.entityId,
        name: nameMap.get(`${a.entityType}:${a.entityId}`) || "Unknown",
      });
      assocByNote.set(a.noteId, list);
    }

    const nodeById = new Map<string, NoteNode>();
    for (const r of rows) {
      const reactions: NoteReactionGroup[] = Array.from((reactionAgg.get(r.id) ?? new Map()).entries()).map(
        ([emoji, v]) => ({ emoji, count: v.count, reactedByMe: v.mine }),
      );
      reactions.sort((a, b) => b.count - a.count);
      nodeById.set(r.id, {
        id: r.id,
        parentId: r.parentId ?? null,
        rootId: r.rootId ?? null,
        depth: r.depth ?? 0,
        title: r.title ?? null,
        body: sanitizeNoteHtml(r.body),
        isDeleted: r.isDeleted ?? false,
        score: r.score ?? 0,
        myVote: myVoteByNote.get(r.id) ?? 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt ?? null,
        author: authorFor(authorMap, r.authorId),
        attachments: attachByNote.get(r.id) ?? [],
        reactions,
        associations: assocByNote.get(r.id) ?? [],
        replies: [],
      });
    }

    // Build the tree (ordered by createdAt asc within each level).
    let root: NoteNode | null = null;
    for (const node of nodeById.values()) {
      if (node.id === rootId) {
        root = node;
      } else if (node.parentId && nodeById.has(node.parentId)) {
        nodeById.get(node.parentId)?.replies.push(node);
      }
    }
    if (!root) return { success: false, error: "Note not found" };

    return { success: true, thread: root };
  } catch (error) {
    console.error("[getNoteThread] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

// --- mutations --------------------------------------------------------------

async function insertAttachments(noteId: string, attachments: NoteAttachment[]) {
  if (!attachments.length) return;
  const rows = attachments.map((a) => ({
    noteId,
    kind: a.kind ?? "file",
    fileUrl: a.fileUrl ?? null,
    fileName: a.fileName ?? null,
    fileSize: a.fileSize ?? null,
    mimeType: a.mimeType ?? null,
    linkUrl: a.linkUrl ?? null,
    linkTitle: a.linkTitle ?? null,
    linkFavicon: a.linkFavicon ?? null,
    linkProvider: a.linkProvider ?? null,
  }));
  await supabaseServer.from(ATTACHMENTS).insert(rows);
}

function mentionEmailHtml(args: { recipientName: string; actorName: string; noteTitle: string; link: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0e3e58;">You were mentioned in a note</h2>
      <p>Hello ${args.recipientName || "there"},</p>
      <p><strong>${args.actorName}</strong> mentioned you in the note
        <strong>"${args.noteTitle}"</strong>.</p>
      <div style="margin: 30px 0;">
        <a href="${args.link}" style="background-color: #0e3e58; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View note</a>
      </div>
      <p style="color: #666; font-size: 14px;">Or paste this link into your browser:</p>
      <p style="color: #666; font-size: 14px; word-break: break-all;">${args.link}</p>
    </div>
  `;
}

/**
 * Records in-app notifications for mentioned users (and the parent author on a
 * reply), and emails mentioned users via Resend. Best-effort: email failures
 * are logged and never break note creation.
 */
async function notifyUsers(args: {
  noteId: string;
  rootId: string;
  actorId: string | null;
  actorName: string;
  mentionIds: string[];
  replyToAuthorId?: string | null;
  noteTitle: string;
  origin?: string;
}) {
  const recipients = new Map<string, "mention" | "reply">();
  for (const uid of args.mentionIds) {
    if (uid && uid !== args.actorId) recipients.set(uid, "mention");
  }
  if (args.replyToAuthorId && args.replyToAuthorId !== args.actorId && !recipients.has(args.replyToAuthorId)) {
    recipients.set(args.replyToAuthorId, "reply");
  }
  if (recipients.size === 0) return;

  const previewFor = (type: "mention" | "reply") =>
    type === "mention"
      ? `${args.actorName} mentioned you in "${args.noteTitle}"`
      : `${args.actorName} replied to "${args.noteTitle}"`;

  const rows = Array.from(recipients.entries()).map(([recipientId, type]) => ({
    noteId: args.noteId,
    rootId: args.rootId,
    recipientId,
    actorId: args.actorId,
    actorName: args.actorName,
    type,
    preview: previewFor(type),
    isRead: false,
  }));
  await supabaseServer.from(NOTIFICATIONS).insert(rows);

  // Email mentioned users only.
  const mentionIds = Array.from(recipients.entries())
    .filter(([, type]) => type === "mention")
    .map(([uid]) => uid);
  if (mentionIds.length === 0 || !process.env.RESEND_API_KEY) return;

  try {
    const { data: users } = await supabaseServer.from("users").select("uid, email, firstName").in("uid", mentionIds);
    const link = `${args.origin ?? ""}/dashboard/crm/notes/${args.rootId}`;
    const resend = new Resend(process.env.RESEND_API_KEY);

    await Promise.all(
      (users || [])
        .filter((u) => u.email)
        .map((u) =>
          resend.emails.send({
            from: "Prestige Advisors <noreply@contact.bereanadvisorgroup.com>",
            to: u.email,
            subject: `${args.actorName} mentioned you in "${args.noteTitle}"`,
            html: mentionEmailHtml({
              recipientName: u.firstName ?? "",
              actorName: args.actorName,
              noteTitle: args.noteTitle,
              link,
            }),
          }),
        ),
    );
  } catch (err) {
    console.error("[notifyUsers] Failed to send mention emails:", err);
  }
}

export async function createNote(values: NoteFormValues, origin?: string) {
  try {
    const parsed = NoteFormSchema.parse(values);
    const actor = await getCurrentActor();
    const now = new Date().toISOString();

    const { data: inserted, error } = await supabaseServer
      .from(NOTES)
      .insert({
        parentId: null,
        rootId: null,
        depth: 0,
        title: parsed.title,
        body: parsed.body ?? "",
        authorId: actor.actorId,
        score: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // A top-level note's rootId points at itself for uniform thread queries.
    await supabaseServer.from(NOTES).update({ rootId: inserted.id }).eq("id", inserted.id);

    if (parsed.associations.length) {
      await supabaseServer
        .from(ASSOCIATIONS)
        .insert(
          parsed.associations.map((a) => ({ noteId: inserted.id, entityType: a.entityType, entityId: a.entityId })),
        );
    }
    await insertAttachments(inserted.id, parsed.attachments);

    await notifyUsers({
      noteId: inserted.id,
      rootId: inserted.id,
      actorId: actor.actorId,
      actorName: actor.actorName,
      mentionIds: parsed.mentionIds,
      noteTitle: parsed.title,
      origin,
    });

    // Mirror association events into the existing change-history audit log.
    for (const a of parsed.associations) {
      await recordEvent(
        {
          entityType: a.entityType,
          entityId: a.entityId,
          subType: "Note",
          action: "added",
          summary: `Note "${parsed.title}" added`,
        },
        actor,
      );
    }

    revalidatePath("/dashboard/crm/notes");
    revalidatePath("/dashboard/crm");
    return { success: true, id: inserted.id as string };
  } catch (error) {
    console.error("[createNote] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function createReply(values: ReplyFormValues, origin?: string) {
  try {
    const parsed = ReplyFormSchema.parse(values);
    const actor = await getCurrentActor();
    const now = new Date().toISOString();

    const { data: parent, error: parentErr } = await supabaseServer
      .from(NOTES)
      .select("id, rootId, depth, authorId, title")
      .eq("id", parsed.parentId)
      .single();
    if (parentErr || !parent) return { success: false, error: "Parent note not found" };

    const depth = (parent.depth ?? 0) + 1;
    if (depth > MAX_NOTE_DEPTH) {
      return { success: false, error: "Replies can only be nested two levels deep." };
    }
    const rootId = parent.rootId ?? parent.id;

    const { data: inserted, error } = await supabaseServer
      .from(NOTES)
      .insert({
        parentId: parent.id,
        rootId,
        depth,
        title: null,
        body: parsed.body,
        authorId: actor.actorId,
        score: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await insertAttachments(inserted.id, parsed.attachments);

    // Bump the root note's updatedAt so it surfaces as recently active.
    await supabaseServer.from(NOTES).update({ updatedAt: now }).eq("id", rootId);

    // Resolve the thread's topic for notification copy.
    const { data: rootNote } = await supabaseServer.from(NOTES).select("title").eq("id", rootId).single();
    const noteTitle = rootNote?.title || "a note";

    await notifyUsers({
      noteId: inserted.id,
      rootId,
      actorId: actor.actorId,
      actorName: actor.actorName,
      mentionIds: parsed.mentionIds,
      replyToAuthorId: parent.authorId,
      noteTitle,
      origin,
    });

    revalidatePath("/dashboard/crm/notes");
    revalidatePath("/dashboard/crm");
    return { success: true, id: inserted.id as string };
  } catch (error) {
    console.error("[createReply] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function updateNote(id: string, values: { title?: string; body: string }) {
  try {
    const actor = await getCurrentActor();
    const { data: current } = await supabaseServer.from(NOTES).select("depth, authorId").eq("id", id).single();
    if (!current) return { success: false, error: "Note not found" };
    if (current.authorId && actor.actorId && current.authorId !== actor.actorId) {
      return { success: false, error: "You can only edit your own notes." };
    }

    const update: Record<string, unknown> = { body: values.body, updatedAt: new Date().toISOString() };
    if (current.depth === 0 && typeof values.title === "string") update.title = values.title;

    const { error } = await supabaseServer.from(NOTES).update(update).eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/notes");
    return { success: true };
  } catch (error) {
    console.error("[updateNote] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/** Soft-deletes a note/reply (author or admin only). Children are preserved. */
export async function deleteNote(id: string) {
  try {
    const actor = await getCurrentActor();
    const { data: current } = await supabaseServer.from(NOTES).select("authorId, title").eq("id", id).single();
    if (!current) return { success: false, error: "Note not found" };

    let isAdmin = false;
    if (actor.actorId) {
      const { data: me } = await supabaseServer.from("users").select("role").eq("uid", actor.actorId).single();
      isAdmin = me?.role === "admin";
    }
    if (current.authorId && actor.actorId && current.authorId !== actor.actorId && !isAdmin) {
      return { success: false, error: "You can only delete your own notes." };
    }

    const { error } = await supabaseServer
      .from(NOTES)
      .update({ isDeleted: true, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/crm/notes");
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("[deleteNote] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/** Adds or removes the current user's reaction with a given emoji. */
export async function toggleReaction(noteId: string, emoji: string) {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: false, error: "Not signed in" };

    const { data: existing } = await supabaseServer
      .from(REACTIONS)
      .select("id")
      .eq("noteId", noteId)
      .eq("userId", actor.actorId)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing) {
      await supabaseServer.from(REACTIONS).delete().eq("id", existing.id);
    } else {
      await supabaseServer.from(REACTIONS).insert({ noteId, userId: actor.actorId, emoji });
    }
    return { success: true, reacted: !existing };
  } catch (error) {
    console.error("[toggleReaction] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

/** Casts a vote (1 or -1). Re-casting the same value clears it (toggle). */
export async function castVote(noteId: string, value: 1 | -1) {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: false, error: "Not signed in" };

    const { data: existing } = await supabaseServer
      .from(VOTES)
      .select("id, value")
      .eq("noteId", noteId)
      .eq("userId", actor.actorId)
      .maybeSingle();

    let myVote: number = value;
    if (existing) {
      if (existing.value === value) {
        await supabaseServer.from(VOTES).delete().eq("id", existing.id);
        myVote = 0;
      } else {
        await supabaseServer.from(VOTES).update({ value }).eq("id", existing.id);
      }
    } else {
      await supabaseServer.from(VOTES).insert({ noteId, userId: actor.actorId, value });
    }

    // Recompute the denormalized score from the source of truth.
    const { data: votes } = await supabaseServer.from(VOTES).select("value").eq("noteId", noteId);
    const score = (votes || []).reduce((acc, v) => acc + (v.value ?? 0), 0);
    await supabaseServer.from(NOTES).update({ score }).eq("id", noteId);

    return { success: true, score, myVote };
  } catch (error) {
    console.error("[castVote] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

// --- link previews ----------------------------------------------------------

function pick(re: RegExp, html: string): string | undefined {
  const m = html.match(re);
  return m?.[1]?.trim();
}

/**
 * Fetches a lightweight preview for a pasted URL. Google Drive/Docs links are
 * tagged with a provider so the UI can show a Drive icon; other sites fall back
 * to OpenGraph/title metadata. Always resolves (never throws) so paste UX is smooth.
 */
export async function fetchLinkPreview(rawUrl: string) {
  try {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      url = new URL(`https://${rawUrl}`);
    }
    const host = url.hostname.replace(/^www\./, "");
    const isDrive = /(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(url.hostname);
    const favicon = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;

    let title = host;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; PrestigeBox/1.0)" },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (res.ok) {
        const html = (await res.text()).slice(0, 100_000);
        title =
          pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i, html) ||
          pick(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i, html) ||
          pick(/<title[^>]*>([^<]+)<\/title>/i, html) ||
          host;
      }
    } catch {
      // network/timeouts fall through to the host-based title
    }

    return {
      success: true,
      preview: {
        kind: "link" as const,
        linkUrl: url.toString(),
        linkTitle: isDrive ? title.replace(/ - Google\s+(Drive|Docs|Sheets|Slides)$/i, "") : title,
        linkFavicon: favicon,
        linkProvider: (isDrive ? "google-drive" : "web") as "google-drive" | "web",
      },
    };
  } catch (error) {
    console.error("[fetchLinkPreview] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

// --- mention picker + notifications ----------------------------------------

/** Admins and advisors available to @mention. */
export async function getMentionableUsers() {
  try {
    const { data, error } = await supabaseServer
      .from("users")
      .select("uid, firstName, lastName, photoURL, role")
      .in("role", ["admin", "advisor"]);
    if (error) throw new Error(error.message);
    const users = (data || []).map((u) => ({
      uid: u.uid,
      name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown",
      photoURL: u.photoURL as string | null,
      role: u.role as string,
    }));
    users.sort((a, b) => a.name.localeCompare(b.name));
    return { success: true, users };
  } catch (error) {
    console.error("[getMentionableUsers] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function getNotifications(limit = 20) {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: true, notifications: [] as NoteNotification[], unread: 0 };

    const { data, error } = await supabaseServer
      .from(NOTIFICATIONS)
      .select("*")
      .eq("recipientId", actor.actorId)
      .order("createdAt", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);

    const notifications: NoteNotification[] = (data || []).map((n) => ({
      id: n.id,
      noteId: n.noteId,
      rootId: n.rootId ?? null,
      actorName: n.actorName ?? null,
      type: n.type,
      preview: n.preview ?? null,
      isRead: n.isRead ?? false,
      createdAt: n.createdAt,
    }));
    const unread = notifications.filter((n) => !n.isRead).length;
    return { success: true, notifications, unread };
  } catch (error) {
    console.error("[getNotifications] Error:", error);
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function markNotificationRead(id: string) {
  try {
    const { error } = await supabaseServer.from(NOTIFICATIONS).update({ isRead: true }).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as { message: string }).message };
  }
}

export async function markAllNotificationsRead() {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: true };
    const { error } = await supabaseServer
      .from(NOTIFICATIONS)
      .update({ isRead: true })
      .eq("recipientId", actor.actorId)
      .eq("isRead", false);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as { message: string }).message };
  }
}

/** Clears a single notification (scoped to the current user). */
export async function deleteNotification(id: string) {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: false, error: "Not signed in" };
    const { error } = await supabaseServer.from(NOTIFICATIONS).delete().eq("id", id).eq("recipientId", actor.actorId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as { message: string }).message };
  }
}

/** Clears every notification for the current user. */
export async function clearAllNotifications() {
  try {
    const actor = await getCurrentActor();
    if (!actor.actorId) return { success: true };
    const { error } = await supabaseServer.from(NOTIFICATIONS).delete().eq("recipientId", actor.actorId);
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as { message: string }).message };
  }
}
