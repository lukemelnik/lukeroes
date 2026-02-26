import { siteConfig } from "./site-config";

type SeoOptions = {
	title?: string;
	description?: string;
	path?: string;
	image?: string;
	type?: "website" | "article" | "music.album" | "profile";
	article?: {
		publishedTime?: string;
		tags?: string[];
	};
};

export function seoHead({
	title,
	description,
	path = "",
	image,
	type = "website",
	article,
}: SeoOptions) {
	const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
	const desc = description ?? siteConfig.description;
	const url = `${siteConfig.url}${path}`;
	const ogImage = image ?? `${siteConfig.url}${siteConfig.SEO.ogImage}`;

	const meta: Array<Record<string, string>> = [
		{ title: fullTitle },
		{ name: "description", content: desc },
		{ property: "og:title", content: fullTitle },
		{ property: "og:description", content: desc },
		{ property: "og:url", content: url },
		{ property: "og:image", content: ogImage },
		{ property: "og:type", content: type },
		{ property: "og:site_name", content: siteConfig.name },
		{ name: "twitter:card", content: "summary_large_image" },
		{ name: "twitter:title", content: fullTitle },
		{ name: "twitter:description", content: desc },
		{ name: "twitter:image", content: ogImage },
	];

	if (article?.publishedTime) {
		meta.push({
			property: "article:published_time",
			content: article.publishedTime,
		});
	}

	if (article?.tags) {
		for (const tag of article.tags) {
			meta.push({ property: "article:tag", content: tag });
		}
	}

	return {
		meta,
		links: [{ rel: "canonical" as const, href: url }],
	};
}
