import DOMPurify from "isomorphic-dompurify";

// Notes render staff-authored Tiptap HTML via dangerouslySetInnerHTML. Even
// though authors are MFA-gated internal users, sanitize on output as
// defense-in-depth against stored XSS between staff members.

// Tags produced by the note editor (StarterKit + Link + Mention).
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "strike",
  "u",
  "ul",
  "ol",
  "li",
  "a",
  "span",
  "blockquote",
  "code",
  "pre",
  "h2",
  "h3",
];

// `data-*` attributes carry the Tiptap mention node's id/label.
const ALLOWED_ATTR = ["href", "target", "rel", "class", "data-id", "data-label", "data-type", "data-mention-id"];

let hookInstalled = false;
function ensureHook() {
  if (hookInstalled) return;
  // Force external links to open safely.
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
  });
  hookInstalled = true;
}

/** Sanitizes note/reply HTML for safe rendering. */
export function sanitizeNoteHtml(html: string | null | undefined): string {
  if (!html) return "";
  ensureHook();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Drop javascript:/data: URIs; allow http(s), mailto, tel and relative.
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[#/]|[\w.+-]+(?:[^\w+.:-]|$))/i,
  });
}
