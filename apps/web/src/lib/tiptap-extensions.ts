import { Bold } from "@tiptap/extension-bold";
import { Document } from "@tiptap/extension-document";
import { Heading } from "@tiptap/extension-heading";
import TiptapImage from "@tiptap/extension-image";
import { Italic } from "@tiptap/extension-italic";
import { Link } from "@tiptap/extension-link";
import { ListKit } from "@tiptap/extension-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Text } from "@tiptap/extension-text";
import { Typography } from "@tiptap/extension-typography";
import { Dropcursor, UndoRedo } from "@tiptap/extensions";

export const MediaImage = TiptapImage.extend({
  name: "mediaImage",

  addAttributes() {
    return {
      ...this.parent?.(),
      "data-media-id": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-media-id"),
        renderHTML: (attributes) => {
          const mediaId = attributes["data-media-id"];

          if (!mediaId) {
            return {};
          }

          return { "data-media-id": mediaId };
        },
      },
    };
  },
});

export function getEditorExtensions(placeholder = "Start writing...", enableImages = false) {
  const extensions = [
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
    Dropcursor.configure({
      color: "hsl(var(--primary))",
      width: 2,
    }),
  ];

  if (enableImages) {
    extensions.push(
      MediaImage.configure({
        HTMLAttributes: {
          class: "rounded-md my-4 max-w-full",
        },
        allowBase64: false,
      }),
    );
  }

  return extensions;
}
