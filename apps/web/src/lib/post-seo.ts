import { siteConfig } from "@/lib/site-config";
import type { FeedMedia, FeedPost } from "@/lib/members/types";

function stripHtmlForDescription(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function getOgImageUrl(post: FeedPost): string {
  const defaultOg = `${siteConfig.url}${siteConfig.SEO.ogImage}`;

  if (post.visibility === "members") {
    const artworkMedia = post.media.find(
      (m) => m.role === "artwork" && m.access === "public" && m.url,
    );

    if (artworkMedia?.url) {
      return artworkMedia.url;
    }

    const firstPhoto = post.media
      .filter(
        (m): m is FeedMedia & { url: string } =>
          m.role === "photo" && m.access === "public" && !!m.url,
      )
      .sort((a, b) => a.displayOrder - b.displayOrder)[0];

    if (firstPhoto) {
      return firstPhoto.url;
    }

    return defaultOg;
  }

  const artwork = post.media.find((m) => m.role === "artwork" && m.url);

  if (artwork?.url) {
    return artwork.url;
  }

  const firstPhoto = post.media
    .filter((m): m is FeedMedia & { url: string } => m.role === "photo" && !!m.url)
    .sort((a, b) => a.displayOrder - b.displayOrder)[0];

  if (firstPhoto) {
    return firstPhoto.url;
  }

  return defaultOg;
}

export function buildPostSeoHead(post: FeedPost | null, slug: string) {
  const path = `/members/post/${slug}`;

  if (!post) {
    return {
      meta: [
        { title: `Post | ${siteConfig.name}` },
        { name: "description", content: siteConfig.description },
        { property: "og:title", content: `Post | ${siteConfig.name}` },
        { property: "og:description", content: siteConfig.description },
        { property: "og:url", content: `${siteConfig.url}${path}` },
        { property: "og:image", content: `${siteConfig.url}${siteConfig.SEO.ogImage}` },
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: siteConfig.name },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `Post | ${siteConfig.name}` },
        { name: "twitter:description", content: siteConfig.description },
        { name: "twitter:image", content: `${siteConfig.url}${siteConfig.SEO.ogImage}` },
      ],
      links: [{ rel: "canonical" as const, href: `${siteConfig.url}${path}` }],
    };
  }

  const fullTitle = `${post.title} | ${siteConfig.name}`;
  const description =
    post.excerpt ?? (post.content ? stripHtmlForDescription(post.content) : siteConfig.description);
  const ogImage = getOgImageUrl(post);
  const url = `${siteConfig.url}${path}`;

  const meta: Array<Record<string, string>> = [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: siteConfig.name },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];

  if (post.publishedAt) {
    meta.push({
      property: "article:published_time",
      content: post.publishedAt,
    });
  }

  for (const tag of post.tags) {
    meta.push({ property: "article:tag", content: tag.name });
  }

  return {
    meta,
    links: [{ rel: "canonical" as const, href: url }],
  };
}
