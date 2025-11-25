// Shared types for music data - mirrors API responses

export type ReleaseType = "Single" | "Album" | "EP" | string;

export interface StreamingLinks {
  spotify: string | null;
  appleMusic: string | null;
  youtube: string | null;
  soundcloud: string | null;
  bandcamp: string | null;
}

export interface ApiTrack {
  id: number | string;
  trackNumber: number;
  title: string;
  artist: string;
  duration: string | null;
  isrc: string | null;
  lyrics?: string | null;
}

export interface ApiRelease {
  id: number | string;
  title: string;
  artist: string;
  type: ReleaseType;
  releaseDate: string;
  upc: string | null;
  catalogNumber: string | null;
  status: string | null;
  artworkFileKey: string | null;
  streamingLinks: StreamingLinks;
  tracks?: ApiTrack[];
}

export interface ApiReleaseDetails extends ApiRelease {
  distributor: string | null;
  distributionDate: string | null;
  releaseLabel: string | null;
  version: string | null;
  countriesOfFirstRelease: string[] | null;
  copyrightOwnerCountryOfNationality: string | null;
  tracks: ApiTrack[];
}

export interface MusicResponse {
  apiReleases: ApiRelease[];
}
