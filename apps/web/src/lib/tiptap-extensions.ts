import { Bold } from "@tiptap/extension-bold";
import { Document } from "@tiptap/extension-document";
import { Heading } from "@tiptap/extension-heading";
import { Italic } from "@tiptap/extension-italic";
import { Link } from "@tiptap/extension-link";
import { ListKit } from "@tiptap/extension-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Text } from "@tiptap/extension-text";
import { Typography } from "@tiptap/extension-typography";
import { UndoRedo } from "@tiptap/extensions";

export function getEditorExtensions(placeholder = "Start writing...") {
  return [
    Document,
    Paragraph,
    Text,
    Heading.configure({
      levels: [1, 2, 3],
    }),
    Bold,
    Italic,
    Typography,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline hover:text-primary/80",
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
    ListKit.configure({
      bulletList: { HTMLAttributes: {} },
      orderedList: { HTMLAttributes: {} },
      listItem: { HTMLAttributes: {} },
    }),
    Placeholder.configure({
      placeholder,
      emptyEditorClass: "text-muted-foreground",
    }),
    UndoRedo,
  ];
}
