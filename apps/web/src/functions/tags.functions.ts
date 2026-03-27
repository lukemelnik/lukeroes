import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "@/middleware/admin";
import { listTags, upsertTags, setPostTags } from "@/server/tags.server";

export const listTagsFn = createServerFn({ method: "GET" }).handler(async () => {
  return listTags();
});

const syncPostTagsSchema = z.object({
  postId: z.number(),
  tagNames: z.array(z.string()),
});

export const syncPostTagsFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(syncPostTagsSchema)
  .handler(async ({ data }) => {
    const tags = data.tagNames.length > 0 ? await upsertTags(data.tagNames) : [];
    await setPostTags(
      data.postId,
      tags.map((t) => t.id),
    );
    return tags;
  });
