import { useEditor, EditorContent } from "@tiptap/react";
import { useState, useCallback } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link2,
  Unlink,
} from "lucide-react";
import { getEditorExtensions } from "@/lib/tiptap-extensions";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: getEditorExtensions(placeholder),
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="tiptap min-h-[300px] px-4 py-3 text-sm focus-within:outline-none"
      />
    </div>
  );
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    const url = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().setLink({ href: url }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="size-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered list"
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>

      <div className="mx-1 h-5 w-px bg-border" />

      {showLinkInput ? (
        <div className="flex items-center gap-1">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setLink();
              }
              if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            placeholder="https://..."
            className="h-7 w-48 rounded border border-border bg-background px-2 text-xs"
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- intentional: focus link input on toolbar click
            autoFocus
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={setLink}
            className="rounded px-1.5 py-1 text-xs text-primary hover:bg-primary/10"
          >
            Set
          </button>
        </div>
      ) : (
        <>
          <ToolbarButton
            active={editor.isActive("link")}
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowLinkInput(true);
              }
            }}
            title={editor.isActive("link") ? "Remove link" : "Add link"}
          >
            {editor.isActive("link") ? <Unlink className="size-4" /> : <Link2 className="size-4" />}
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`flex size-7 items-center justify-center rounded transition-colors ${
        active ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
