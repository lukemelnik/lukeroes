import { createServerFn } from "@tanstack/react-start";
import type { ReleaseSummary } from "@/generated/songkeeper";
import { musicSeedData } from "@/lib/music-seed-data";

export type { ReleaseSummary } from "@/generated/songkeeper";

const SHOW_SEED = false;

export const getMusic = createServerFn().handler(
	async (): Promise<ReleaseSummary[] | undefined> => {
		// Dynamic import to ensure Node.js modules only load on server
		const { getMusicReleases } = await import("@/lib/music-cache");
		try {
			const data = await getMusicReleases();
			console.log(data);

			if (SHOW_SEED && data.releases) {
				return [...musicSeedData, ...data.releases];
			}

			return data.releases ?? [];
		} catch (e) {
			console.warn("Music API unavailable, returning empty array:", e);
			return [];
		}
	},
);
