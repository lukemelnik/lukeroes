import { Loader2, Pause, Play, X } from "lucide-react";
import { useAudioPlayer } from "@/lib/members/audio-player-context";

const AUDIO_LABEL_DISPLAY: Record<string, string> = {
  "voice-memo": "Voice Memo",
  demo: "Demo",
  "early-listen": "Early Listen",
  "studio-session": "Studio Session",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PersistentPlayer() {
  const { currentTrack, isPlaying, currentTime, duration, status, togglePlayPause, seek, close } =
    useAudioPlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    seek(Math.floor(pct * duration));
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 animate-slide-up border-t border-border/50 bg-background/95 backdrop-blur-xl">
      {/* Progress bar — clickable, sits at the very top edge */}
      <div
        className="group h-1 w-full cursor-pointer bg-border/30 transition-[height] hover:h-1.5"
        onClick={handleProgressClick}
        onKeyDown={() => {}}
        role="slider"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
        tabIndex={0}
      >
        <div
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Player content */}
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={togglePlayPause}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 active:scale-95"
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="size-4" fill="currentColor" />
          ) : (
            <Play className="size-4 translate-x-px" fill="currentColor" />
          )}
        </button>

        {/* Track info */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm leading-tight">{currentTrack.title}</p>
          <p className="truncate text-muted-foreground text-xs">
            {AUDIO_LABEL_DISPLAY[currentTrack.label] || currentTrack.label}
          </p>
        </div>

        {/* Time */}
        <span className="hidden shrink-0 font-mono text-muted-foreground text-xs tabular-nums sm:block">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Close */}
        <button
          type="button"
          onClick={close}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
