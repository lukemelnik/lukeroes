import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";

const posts = defineCollection({
	name: "posts",
	directory: "content/writing",
	include: "**/*.mdx",
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		date: z.string(),
		slug: z.string(),
		draft: z.boolean().default(false),
		tags: z.array(z.string()).optional(),
	}),
	transform: async (document, context) => {
		const mdx = await compileMDX(context, document);

		// Calculate reading time (assumes ~200 words per minute)
		const content = document.content || "";
		const wordCount = content.trim().split(/\s+/).length;
		const readingTime = Math.ceil(wordCount / 200);

		return {
			...document,
			mdx,
			readingTime,
		};
	},
});

export default defineConfig({
	collections: [posts],
});
