// Shared types for music data - safe to import on client and server

export interface Track {
  number: number;
  title: string;
  duration: string;
}

export interface MusicRelease {
  id: string;
  title: string;
  type: "Single" | "Album" | "EP";
  artwork: string;
  releaseDate: string;
  streamUrl: string;
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  tracks: Track[];
}
