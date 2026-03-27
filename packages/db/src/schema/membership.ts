import { relations, sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth";

// ─── Posts ───────────────────────────────────────────────────────────────────

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id),
  type: text("type", { enum: ["writing", "audio", "note", "photo"] }).notNull(),
  visibility: text("visibility", {
    enum: ["public", "members"],
  })
    .notNull()
    .default("members"),
  format: text("format", { enum: ["essay", "poetry"] }),
  label: text("label", {
    enum: ["voice-memo", "demo", "early-listen", "studio-session"],
  }),
  slug: text("slug").notNull().unique(),
  title: text("title"),
  excerpt: text("excerpt"),
  content: text("content"),
  readingTime: text("reading_time"),
  publishedAt: text("published_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(user, {
    fields: [posts.authorId],
    references: [user.id],
  }),
  postMedia: many(postMedia),
  postTags: many(postTags),
}));

// ─── Media ──────────────────────────────────────────────────────────────────

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["audio", "image"] }).notNull(),
  fileKey: text("file_key").notNull(),
  url: text("url"),
  duration: integer("duration"),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Post Media (junction) ─────────────────────────────────────────────────

export const postMedia = sqliteTable(
  "post_media",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["artwork", "audio", "photo"] }).notNull(),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.postId, t.mediaId] })],
);

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(posts, {
    fields: [postMedia.postId],
    references: [posts.id],
  }),
  media: one(media, {
    fields: [postMedia.mediaId],
    references: [media.id],
  }),
}));

// ─── Tags ───────────────────────────────────────────────────────────────────

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

// ─── Post Tags (junction) ──────────────────────────────────────────────────

export const postTags = sqliteTable(
  "post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

// ─── Zod Schemas ────────────────────────────────────────────────────────────

export const insertPostSchema = createInsertSchema(posts, {
  slug: z.string().min(1).max(200),
  title: z.string().max(500).optional().nullable(),
  excerpt: z.string().max(2000).optional().nullable(),
  content: z.string().optional().nullable(),
  type: z.enum(["writing", "audio", "note", "photo"]),
  visibility: z.enum(["public", "members"]).default("members"),
  format: z.enum(["essay", "poetry"]).optional().nullable(),
  label: z.enum(["voice-memo", "demo", "early-listen", "studio-session"]).optional().nullable(),
});

export const selectPostSchema = createSelectSchema(posts);

export const createPostSchema = insertPostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  readingTime: true,
});

export const updatePostSchema = insertPostSchema
  .omit({
    createdAt: true,
    updatedAt: true,
    readingTime: true,
    authorId: true,
  })
  .partial()
  .required({ id: true });

export const insertMediaSchema = createInsertSchema(media, {
  type: z.enum(["audio", "image"]),
  fileKey: z.string().min(1),
  duration: z.number().nonnegative().optional().nullable(),
  width: z.number().positive().optional().nullable(),
  height: z.number().positive().optional().nullable(),
  alt: z.string().max(500).optional().nullable(),
});

export const selectMediaSchema = createSelectSchema(media);

export const createMediaSchema = insertMediaSchema.omit({
  id: true,
  createdAt: true,
});

export const insertTagSchema = createInsertSchema(tags, {
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
});

export const selectTagSchema = createSelectSchema(tags);

export const createTagSchema = insertTagSchema.omit({ id: true });

// ─── Types ──────────────────────────────────────────────────────────────────

export type Post = z.infer<typeof selectPostSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type Media = z.infer<typeof selectMediaSchema>;
export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type Tag = z.infer<typeof selectTagSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
