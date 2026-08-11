"use client";

import * as React from "react";

import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, ReactRenderer, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Strikethrough } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

import { EmojiPicker } from "./emoji-picker";
import { MentionList, type MentionListRef, type MentionUser } from "./mention-list";

interface NoteEditorProps {
  value: string;
  onChange: (html: string, mentionIds: string[]) => void;
  placeholder?: string;
  /** Teammates available to @mention. */
  mentionUsers?: MentionUser[];
  /** Called when a bare URL is pasted, so the parent can build a preview chip. */
  onPasteLink?: (url: string) => void;
  className?: string;
  minHeight?: number;
}

const URL_ONLY = /^https?:\/\/[^\s]+$/i;

/** Collects mention node ids from a Tiptap JSON document. */
function collectMentionIds(doc: unknown): string[] {
  const ids: string[] = [];
  const walk = (node: { type?: string; attrs?: { id?: string }; content?: unknown[] }) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "mention" && node.attrs?.id) ids.push(node.attrs.id);
    if (Array.isArray(node.content)) {
      for (const c of node.content) walk(c as never);
    }
  };
  walk(doc as never);
  return Array.from(new Set(ids));
}

function positionPopup(popup: HTMLElement, clientRect: (() => DOMRect | null) | null | undefined) {
  const rect = clientRect?.();
  if (!rect) return;
  popup.style.left = `${rect.left}px`;
  popup.style.top = `${rect.bottom + 6}px`;
}

export function NoteEditor({
  value,
  onChange,
  placeholder = "Write a note…  type @ to mention, paste a link, or drop a file",
  mentionUsers = [],
  onPasteLink,
  className,
  minHeight = 100,
}: NoteEditorProps) {
  // The suggestion config closes over a ref so the latest user list and paste
  // handler are always used, even though the editor is created only once.
  const usersRef = React.useRef<MentionUser[]>(mentionUsers);
  usersRef.current = mentionUsers;
  const pasteRef = React.useRef<typeof onPasteLink>(onPasteLink);
  pasteRef.current = onPasteLink;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, link: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestion: {
          char: "@",
          items: ({ query }) => {
            const q = query.toLowerCase();
            return usersRef.current.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 8);
          },
          render: () => {
            let component: ReactRenderer<MentionListRef> | null = null;
            let popup: HTMLDivElement | null = null;
            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, { props, editor: props.editor });
                if (!props.clientRect) return;
                popup = document.createElement("div");
                popup.style.position = "fixed";
                popup.style.zIndex = "60";
                document.body.appendChild(popup);
                popup.appendChild(component.element);
                positionPopup(popup, props.clientRect);
              },
              onUpdate: (props) => {
                component?.updateProps(props);
                if (popup) positionPopup(popup, props.clientRect);
              },
              onKeyDown: (props) => {
                if (props.event.key === "Escape") {
                  popup?.remove();
                  popup = null;
                  return true;
                }
                return component?.ref?.onKeyDown(props) ?? false;
              },
              onExit: () => {
                popup?.remove();
                popup = null;
                component?.destroy();
                component = null;
              },
            };
          },
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none px-3 py-2 outline-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline",
          "[&_.mention]:rounded [&_.mention]:bg-primary/10 [&_.mention]:px-1 [&_.mention]:font-medium [&_.mention]:text-primary",
        ),
        style: `min-height:${minHeight}px`,
      },
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData("text/plain")?.trim();
        if (text && URL_ONLY.test(text) && pasteRef.current) {
          pasteRef.current(text);
          return true; // handled — parent turns it into a preview chip
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const ids = collectMentionIds(editor.getJSON());
      onChange(html === "<p></p>" ? "" : html, ids);
    },
  });

  // Keep the editor in sync when the parent resets the value (e.g. after submit).
  // biome-ignore lint/correctness/useExhaustiveDependencies: sync only on external value changes.
  React.useEffect(() => {
    if (editor && value !== editor.getHTML() && (value || editor.getHTML() !== "<p></p>")) {
      editor.commands.setContent(value || "");
    }
  }, [value]);

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className={cn("rounded-md border", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b p-1">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive("link")} onPressedChange={setLink} aria-label="Insert link">
          <LinkIcon className="h-4 w-4" />
        </Toggle>
        <EmojiPicker onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
