import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface AudioTrack {
  id: string;
  title: string;
  label: string;
  audioUrl: string;
  duration: number;
}

type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

interface AudioPlayerState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  status: PlayerStatus;
  error: string | null;
}

interface AudioPlayerActions {
  play: (track: AudioTrack) => void;
  pause: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  close: () => void;
}

type AudioPlayerContextValue = AudioPlayerState & AudioPlayerActions;

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    status: "idle",
    error: null,
  });

  // Wire audio element events to state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadStart = () => setState((prev) => ({ ...prev, status: "loading", error: null }));

    const onCanPlay = () =>
      setState((prev) => ({
        ...prev,
        status: prev.isPlaying ? "playing" : "paused",
        duration: audio.duration || prev.duration,
      }));

    const onTimeUpdate = () => setState((prev) => ({ ...prev, currentTime: audio.currentTime }));

    const onDurationChange = () => setState((prev) => ({ ...prev, duration: audio.duration }));

    const onEnded = () =>
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        status: "paused",
      }));

    const onError = () =>
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        status: "error",
        error: "Failed to load audio",
      }));

    const onPlay = () => setState((prev) => ({ ...prev, isPlaying: true, status: "playing" }));

    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false, status: "paused" }));

    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const play = useCallback(
    (track: AudioTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      const isSameTrack = state.currentTrack?.id === track.id;
      if (!isSameTrack) {
        audio.src = track.audioUrl;
        audio.load();
        setState((prev) => ({
          ...prev,
          currentTrack: track,
          currentTime: 0,
          duration: track.duration,
          status: "loading",
          error: null,
        }));
      }
      audio.play().catch(() => {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Playback failed",
        }));
      });
    },
    [state.currentTrack?.id],
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else if (state.currentTrack) {
      audioRef.current?.play().catch(() => {});
    }
  }, [state.isPlaying, state.currentTrack, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
    }
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setState({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      status: "idle",
      error: null,
    });
  }, []);

  const contextValue = useMemo(
    () => ({ ...state, play, pause, togglePlayPause, seek, close }),
    [state, play, pause, togglePlayPause, seek, close],
  );

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" className="hidden" />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}
