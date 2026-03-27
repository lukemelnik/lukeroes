export interface FeedMedia {
  role: "artwork" | "audio" | "photo";
  displayOrder: number;
  url: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  // These fields come from different query shapes
  postId?: number;
  mediaId?: number;
  mediaType?: string;
  id?: number;
  type?: string;
  fileKey?: string;
}

export interface FeedTag {
  id: number;
  name: string;
  slug: string;
}

export interface FeedPost {
  id: number;
  authorId: string;
  type: "writing" | "audio" | "note" | "photo";
  visibility: "public" | "members";
  format: string | null;
  label: string | null;
  slug: string;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  readingTime: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: FeedTag[];
  media: FeedMedia[];
}

export const AUDIO_LABEL_DISPLAY: Record<string, string> = {
  "voice-memo": "Voice Memo",
  demo: "Demo",
  "early-listen": "Early Listen",
  "studio-session": "Studio Session",
};

export const MEMBERSHIP_TIER = {
  name: "Member",
  price: 7,
  interval: "month" as const,
  features: [
    "All writing, audio, and notes",
    "Early demos and voice memos",
    "Behind-the-scenes studio sessions",
    "Direct access — no algorithm",
  ],
};

export function getAudioDuration(post: FeedPost): number {
  const audioMedia = post.media.find((m) => m.role === "audio");
  return audioMedia?.duration ?? 0;
}

export function getAudioUrl(post: FeedPost): string {
  const audioMedia = post.media.find((m) => m.role === "audio");
  return audioMedia?.url ?? "";
}

export function getPostImages(post: FeedPost) {
  return post.media
    .filter((m) => m.role === "photo")
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((m) => ({
      url: m.url ?? "",
      alt: m.alt ?? "",
    }));
}
