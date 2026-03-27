import { db } from "@lukeroes/db";
import { tags, postTags } from "@lukeroes/db/schema/membership";
import { eq, sql } from "drizzle-orm";
import slugify from "slugify";

export async function listTags() {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      postCount: sql<number>`count(${postTags.postId})`.as("postCount"),
    })
    .from(tags)
    .leftJoin(postTags, eq(tags.id, postTags.tagId))
    .groupBy(tags.id)
    .orderBy(tags.name);
}

export async function upsertTags(tagNames: string[]) {
  const result: { id: number; name: string; slug: string }[] = [];
  for (const name of tagNames) {
    const slug = slugify(name, { lower: true, strict: true });
    const [existing] = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
    if (existing) {
      result.push(existing);
    } else {
      const [created] = await db.insert(tags).values({ name, slug }).returning();
      result.push(created);
    }
  }
  return result;
}

export async function setPostTags(postId: number, tagIds: number[]) {
  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (tagIds.length > 0) {
    await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
  }
}
