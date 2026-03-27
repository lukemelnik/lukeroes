import { relations } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth";

export const posts = sqliteTable(
  "posts",
  {
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
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content"),
    readingTime: text("reading_time"),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("posts_published_at_idx").on(table.publishedAt),
    index("posts_published_at_id_idx").on(table.publishedAt, table.id),
    index("posts_author_id_idx").on(table.authorId),
    index("posts_type_visibility_idx").on(table.type, table.visibility),
  ],
);

export const media = sqliteTable(
  "media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    assetKey: text("asset_key").notNull().unique(),
    type: text("type", { enum: ["image", "audio"] }).notNull(),
    access: text("access", { enum: ["public", "members"] })
      .notNull()
      .default("public"),
    status: text("status", {
      enum: ["uploading", "processing", "ready", "failed"],
    })
      .notNull()
      .default("uploading"),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size"),
    checksum: text("checksum"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id),
    defaultAlt: text("default_alt"),
    durationSeconds: integer("duration_seconds"),
    waveformPeaks: text("waveform_peaks"),
    processingError: text("processing_error"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("media_type_access_status_idx").on(table.type, table.access, table.status),
    index("media_created_by_user_id_idx").on(table.createdByUserId),
    index("media_original_filename_idx").on(table.originalFilename),
    index("media_default_alt_idx").on(table.defaultAlt),
    index("media_created_at_idx").on(table.createdAt),
  ],
);

export const mediaVariants = sqliteTable(
  "media_variants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["original", "display", "thumb"] }).notNull(),
    fileKey: text("file_key").notNull().unique(),
    format: text("format"),
    width: integer("width"),
    height: integer("height"),
    byteSize: integer("byte_size"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("media_variants_media_id_kind_idx").on(table.mediaId, table.kind),
    index("media_variants_media_id_idx").on(table.mediaId),
    index("media_variants_kind_idx").on(table.kind),
  ],
);

export const postMedia = sqliteTable(
  "post_media",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["artwork", "audio", "photo", "inline"] }).notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    altOverride: text("alt_override"),
    caption: text("caption"),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.mediaId, table.role] }),
    index("post_media_media_id_idx").on(table.mediaId),
    index("post_media_post_id_display_order_idx").on(table.postId, table.displayOrder),
  ],
);

export const postLikes = sqliteTable(
  "post_likes",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.userId] }),
    index("post_likes_post_id_idx").on(table.postId),
    index("post_likes_user_id_idx").on(table.userId),
    index("post_likes_created_at_idx").on(table.createdAt),
  ],
);

export const comments = sqliteTable(
  "comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    parentCommentId: integer("parent_comment_id").references((): AnySQLiteColumn => comments.id),
    text: text("text").notNull(),
    seen: integer("seen", { mode: "boolean" }).notNull().default(false),
    isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
    deletedAt: text("deleted_at"),
    deletedByUserId: text("deleted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("comments_post_id_parent_comment_id_created_at_idx").on(
      table.postId,
      table.parentCommentId,
      table.createdAt,
    ),
    index("comments_seen_created_at_idx").on(table.seen, table.createdAt),
    index("comments_user_id_created_at_idx").on(table.userId, table.createdAt),
  ],
);

export const commentVotes = sqliteTable(
  "comment_votes",
  {
    commentId: integer("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.commentId, table.userId] }),
    index("comment_votes_comment_id_idx").on(table.commentId),
    index("comment_votes_user_id_idx").on(table.userId),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["comment_reply", "comment_vote"] }).notNull(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    commentId: integer("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    readAt: text("read_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("notifications_user_id_read_at_created_at_idx").on(
      table.userId,
      table.readAt,
      table.createdAt,
    ),
    index("notifications_comment_id_idx").on(table.commentId),
    index("notifications_post_id_idx").on(table.postId),
  ],
);

export const membershipEvents = sqliteTable(
  "membership_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    source: text("source", { enum: ["stripe", "admin"] }).notNull(),
    type: text("type", {
      enum: [
        "subscription_started",
        "subscription_updated",
        "subscription_canceled",
        "gift_applied",
        "gift_removed",
      ],
    }).notNull(),
    stripeSubscriptionId: text("stripe_subscription_id"),
    effectiveAt: text("effective_at").notNull(),
    metadata: text("metadata"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("membership_events_user_id_effective_at_idx").on(table.userId, table.effectiveAt),
    index("membership_events_stripe_subscription_id_idx").on(table.stripeSubscriptionId),
    index("membership_events_type_effective_at_idx").on(table.type, table.effectiveAt),
  ],
);

export const adminAuditLog = sqliteTable(
  "admin_audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: text("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("admin_audit_log_actor_user_id_created_at_idx").on(table.actorUserId, table.createdAt),
    index("admin_audit_log_target_type_target_id_created_at_idx").on(
      table.targetType,
      table.targetId,
      table.createdAt,
    ),
    index("admin_audit_log_action_created_at_idx").on(table.action, table.createdAt),
  ],
);

export const rateLimitEvents = sqliteTable(
  "rate_limit_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bucket: text("bucket").notNull(),
    key: text("key").notNull(),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [
    index("rate_limit_events_bucket_key_created_at_idx").on(
      table.bucket,
      table.key,
      table.createdAt,
    ),
    index("rate_limit_events_expires_at_idx").on(table.expiresAt),
  ],
);

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

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
  (table) => [primaryKey({ columns: [table.postId, table.tagId] })],
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(user, {
    fields: [posts.authorId],
    references: [user.id],
  }),
  postMedia: many(postMedia),
  postTags: many(postTags),
  likes: many(postLikes),
  comments: many(comments),
  notifications: many(notifications),
}));

export const mediaRelations = relations(media, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [media.createdByUserId],
    references: [user.id],
  }),
  variants: many(mediaVariants),
  postMedia: many(postMedia),
}));

export const mediaVariantsRelations = relations(mediaVariants, ({ one }) => ({
  media: one(media, {
    fields: [mediaVariants.mediaId],
    references: [media.id],
  }),
}));

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

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(user, {
    fields: [postLikes.userId],
    references: [user.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(user, {
    fields: [comments.userId],
    references: [user.id],
    relationName: "comment_author",
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "comment_replies",
  }),
  replies: many(comments, {
    relationName: "comment_replies",
  }),
  deletedByUser: one(user, {
    fields: [comments.deletedByUserId],
    references: [user.id],
    relationName: "comment_deleted_by",
  }),
  votes: many(commentVotes),
  notifications: many(notifications),
}));

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentVotes.commentId],
    references: [comments.id],
  }),
  user: one(user, {
    fields: [commentVotes.userId],
    references: [user.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
    relationName: "notification_recipient",
  }),
  post: one(posts, {
    fields: [notifications.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id],
  }),
  actor: one(user, {
    fields: [notifications.actorId],
    references: [user.id],
    relationName: "notification_actor",
  }),
}));

export const membershipEventsRelations = relations(membershipEvents, ({ one }) => ({
  user: one(user, {
    fields: [membershipEvents.userId],
    references: [user.id],
  }),
}));

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  actor: one(user, {
    fields: [adminAuditLog.actorUserId],
    references: [user.id],
  }),
}));

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

export const insertPostSchema = createInsertSchema(posts, {
  slug: z.string().trim().min(1).max(200).optional(),
  title: z.string().trim().min(1).max(500),
  excerpt: z.string().trim().max(2000).optional().nullable(),
  content: z.string().trim().optional().nullable(),
  type: z.enum(["writing", "audio", "note", "photo"]),
  visibility: z.enum(["public", "members"]).default("members"),
  format: z.enum(["essay", "poetry"]).optional().nullable(),
  label: z.enum(["voice-memo", "demo", "early-listen", "studio-session"]).optional().nullable(),
});

export const selectPostSchema = createSelectSchema(posts);

export const createPostSchema = insertPostSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  readingTime: true,
});

export const updatePostSchema = insertPostSchema
  .omit({
    authorId: true,
    createdAt: true,
    updatedAt: true,
    readingTime: true,
  })
  .partial()
  .extend({
    id: z.number().int().positive(),
  });

export const insertMediaSchema = createInsertSchema(media, {
  assetKey: z.string().trim().min(1),
  type: z.enum(["image", "audio"]),
  access: z.enum(["public", "members"]),
  status: z.enum(["uploading", "processing", "ready", "failed"]),
  originalFilename: z.string().trim().min(1).max(500),
  mimeType: z.string().trim().min(1).max(255),
  byteSize: z.number().int().nonnegative().optional().nullable(),
  checksum: z.string().trim().optional().nullable(),
  defaultAlt: z.string().trim().max(500).optional().nullable(),
  durationSeconds: z.number().int().nonnegative().optional().nullable(),
  waveformPeaks: z.string().trim().optional().nullable(),
  processingError: z.string().trim().max(2000).optional().nullable(),
});

export const selectMediaSchema = createSelectSchema(media);

export const createMediaSchema = insertMediaSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMediaVariantSchema = createInsertSchema(mediaVariants, {
  kind: z.enum(["original", "display", "thumb"]),
  fileKey: z.string().trim().min(1),
  format: z.string().trim().optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  byteSize: z.number().int().nonnegative().optional().nullable(),
});

export const selectMediaVariantSchema = createSelectSchema(mediaVariants);

export const createMediaVariantSchema = insertMediaVariantSchema.omit({
  id: true,
  createdAt: true,
});

export const insertTagSchema = createInsertSchema(tags, {
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100),
});

export const selectTagSchema = createSelectSchema(tags);

export const createTagSchema = insertTagSchema.omit({ id: true });

export const insertCommentSchema = createInsertSchema(comments, {
  text: z.string().trim().min(1).max(5000),
});

export const selectCommentSchema = createSelectSchema(comments);

export const createCommentSchema = insertCommentSchema.omit({
  id: true,
  userId: true,
  seen: true,
  isDeleted: true,
  deletedAt: true,
  deletedByUserId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);
export const insertMembershipEventSchema = createInsertSchema(membershipEvents);
export const selectMembershipEventSchema = createSelectSchema(membershipEvents);
export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog);
export const selectAdminAuditLogSchema = createSelectSchema(adminAuditLog);
export const insertRateLimitEventSchema = createInsertSchema(rateLimitEvents);
export const selectRateLimitEventSchema = createSelectSchema(rateLimitEvents);

export type Post = typeof posts.$inferSelect;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type Media = typeof media.$inferSelect;
export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type MediaVariant = typeof mediaVariants.$inferSelect;
export type CreateMediaVariantInput = z.infer<typeof createMediaVariantSchema>;
export type Tag = typeof tags.$inferSelect;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type Comment = typeof comments.$inferSelect;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type MembershipEvent = typeof membershipEvents.$inferSelect;
export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;
export type RateLimitEvent = typeof rateLimitEvents.$inferSelect;
