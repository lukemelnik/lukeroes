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
  id: number;
  trackNumber: number;
  title: string;
  artist: string | null;
  duration: number | null;
  isrc: string | null;
  lyrics?: string | null;
}

export interface ApiRelease {
  id: number;
  title: string;
  artist: string;
  type: ReleaseType;
  releaseDate: string;
  upc: string | null;
  catalogNumber: string | null;
  status: string | null;
  artworkFileKey: string | null;
  artworkPublicUrl: string | null;
  streamingLinks: StreamingLinks;
  tracks?: ApiTrack[];
}

export type ApiContribution =
  | string
  | {
      name?: string | null;
      role?: string | null;
      contribution?: string | null;
      share?: number | null;
      [key: string]: unknown;
    };

export interface ApiTrackSong {
  id: number;
  title: string | null;
  lyrics: string | null;
  songwriters: ApiContribution[] | null;
  iswc: string | null;
  genre: string | null;
  workType: string | null;
  language: string | null;
  copyrightYear: number | string | null;
  isInstrumental: boolean | null;
}

export interface ApiRecordingDetails {
  versionId: number | null;
  versionTitle: string | null;
  bpm: number | null;
  keySignature: string | null;
  timeSignature: string | null;
  studio: string | null;
  recordingDate: string | null;
  dateOfFirstRelease: string | null;
  countryOfMastering: string | null;
  countryOfRecording: string | null;
  primaryGenre: string | null;
  secondaryGenre: string | null;
  hasExplicitLyrics: boolean | null;
  labelName: string | null;
  credits: ApiContribution[] | null;
  masterOwners: ApiContribution[] | null;
  nonFeaturedPerformers: ApiContribution[] | null;
}

export interface ApiDetailedTrack extends ApiTrack {
  song: ApiTrackSong;
  recording: ApiRecordingDetails;
}

export interface ApiReleaseDetails extends ApiRelease {
  distributor: string | null;
  distributionDate: string | null;
  releaseLabel: string | null;
  version: string | null;
  countriesOfFirstRelease: string[] | null;
  copyrightOwnerCountryOfNationality: string | null;
  tracks: ApiDetailedTrack[];
}

export interface MusicResponse {
  apiReleases: ApiRelease[];
}
