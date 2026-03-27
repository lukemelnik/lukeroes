import { Music4 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioWaveformProps {
  peaks: number[] | null;
  className?: string;
}

export function AudioWaveform({ peaks, className }: AudioWaveformProps) {
  if (!peaks || peaks.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/20 text-muted-foreground",
          className,
        )}
      >
        <Music4 className="size-5" />
      </div>
    );
  }

  const step = Math.max(1, Math.floor(peaks.length / 48));
  const sampledPeaks: number[] = [];

  for (let index = 0; index < peaks.length; index += step) {
    sampledPeaks.push(peaks[index] ?? 0);
  }

  return (
    <svg
      viewBox={`0 0 ${sampledPeaks.length * 4} 40`}
      className={cn("h-full w-full text-primary", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {sampledPeaks.map((peak, index) => {
        const height = Math.max(3, Math.round(Math.min(1, Math.max(0, peak)) * 36));
        const y = (40 - height) / 2;

        return (
          <rect
            key={`${index}-${peak}`}
            x={index * 4}
            y={y}
            width="2.5"
            height={height}
            rx="1.25"
            fill="currentColor"
            opacity="0.85"
          />
        );
      })}
    </svg>
  );
}
