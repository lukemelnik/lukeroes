"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioComparisonProps {
	title: string;
	beforeLabel: string;
	afterLabel: string;
	beforeSrc: string;
	afterSrc: string;
}

function formatTime(seconds: number) {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioComparison({
	title,
	beforeLabel,
	afterLabel,
	beforeSrc,
	afterSrc,
}: AudioComparisonProps) {
	const beforeRef = useRef<HTMLAudioElement>(null);
	const afterRef = useRef<HTMLAudioElement>(null);

	const [isPlaying, setIsPlaying] = useState(false);
	const [activeTrack, setActiveTrack] = useState<"before" | "after">("before");
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	// Keep both tracks in sync
	useEffect(() => {
		const beforeAudio = beforeRef.current;
		const afterAudio = afterRef.current;

		if (!beforeAudio || !afterAudio) return;

		const handleTimeUpdate = () => {
			const activeAudio = activeTrack === "before" ? beforeAudio : afterAudio;
			setCurrentTime(activeAudio.currentTime);
		};

		const handleLoadedMetadata = () => {
			// Use the longer duration of the two tracks
			const maxDuration = Math.max(
				beforeAudio.duration || 0,
				afterAudio.duration || 0,
			);
			setDuration(maxDuration);
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
			beforeAudio.currentTime = 0;
			afterAudio.currentTime = 0;
		};

		beforeAudio.addEventListener("timeupdate", handleTimeUpdate);
		afterAudio.addEventListener("timeupdate", handleTimeUpdate);
		beforeAudio.addEventListener("loadedmetadata", handleLoadedMetadata);
		afterAudio.addEventListener("loadedmetadata", handleLoadedMetadata);
		beforeAudio.addEventListener("ended", handleEnded);
		afterAudio.addEventListener("ended", handleEnded);

		return () => {
			beforeAudio.removeEventListener("timeupdate", handleTimeUpdate);
			afterAudio.removeEventListener("timeupdate", handleTimeUpdate);
			beforeAudio.removeEventListener("loadedmetadata", handleLoadedMetadata);
			afterAudio.removeEventListener("loadedmetadata", handleLoadedMetadata);
			beforeAudio.removeEventListener("ended", handleEnded);
			afterAudio.removeEventListener("ended", handleEnded);
		};
	}, [activeTrack]);

	const togglePlayPause = () => {
		const beforeAudio = beforeRef.current;
		const afterAudio = afterRef.current;

		if (!beforeAudio || !afterAudio) return;

		if (isPlaying) {
			beforeAudio.pause();
			afterAudio.pause();
			setIsPlaying(false);
		} else {
			// Sync times before playing
			const syncTime = currentTime;
			beforeAudio.currentTime = syncTime;
			afterAudio.currentTime = syncTime;

			if (activeTrack === "before") {
				void beforeAudio.play();
			} else {
				void afterAudio.play();
			}
			setIsPlaying(true);
		}
	};

	const switchTrack = (track: "before" | "after") => {
		if (track === activeTrack) return;

		const beforeAudio = beforeRef.current;
		const afterAudio = afterRef.current;

		if (!beforeAudio || !afterAudio) return;

		// Get current time from the playing track
		const currentPlayTime =
			activeTrack === "before"
				? beforeAudio.currentTime
				: afterAudio.currentTime;

		// Sync both tracks to the same position
		beforeAudio.currentTime = currentPlayTime;
		afterAudio.currentTime = currentPlayTime;

		if (isPlaying) {
			// Pause the old track and play the new one seamlessly
			if (activeTrack === "before") {
				beforeAudio.pause();
				void afterAudio.play();
			} else {
				afterAudio.pause();
				void beforeAudio.play();
			}
		}

		setActiveTrack(track);
	};

	const handleSeek = (value: number) => {
		const beforeAudio = beforeRef.current;
		const afterAudio = afterRef.current;

		if (!beforeAudio || !afterAudio) return;

		beforeAudio.currentTime = value;
		afterAudio.currentTime = value;
		setCurrentTime(value);
	};

	return (
		<div className="rounded-xl border bg-card p-4 md:p-6">
			<h3 className="mb-4 font-semibold text-lg">{title}</h3>

			<div className="flex items-center gap-4">
				{/* Play/Pause Button */}
				<button
					type="button"
					onClick={togglePlayPause}
					className={cn(
						"flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition",
						"bg-muted text-foreground hover:bg-primary hover:text-primary-foreground",
						isPlaying && "bg-primary text-primary-foreground",
					)}
					aria-label={isPlaying ? "Pause" : "Play"}
				>
					{isPlaying ? (
						<Pause className="h-5 w-5" />
					) : (
						<Play className="ml-0.5 h-5 w-5" />
					)}
				</button>

				{/* Progress and Controls */}
				<div className="flex-1 space-y-3">
					{/* A/B Toggle */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => switchTrack("before")}
							className={cn(
								"rounded-md px-3 py-1.5 font-medium text-sm transition",
								activeTrack === "before"
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:text-foreground",
							)}
						>
							{beforeLabel}
						</button>
						<button
							type="button"
							onClick={() => switchTrack("after")}
							className={cn(
								"rounded-md px-3 py-1.5 font-medium text-sm transition",
								activeTrack === "after"
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground hover:text-foreground",
							)}
						>
							{afterLabel}
						</button>
					</div>

					{/* Progress Bar */}
					<div className="space-y-1">
						<input
							type="range"
							min={0}
							max={duration || 1}
							step={0.01}
							value={currentTime}
							onChange={(e) => handleSeek(Number(e.target.value))}
							className="h-2 w-full cursor-pointer accent-primary"
						/>
						<div className="flex justify-between text-muted-foreground text-xs">
							<span>{formatTime(currentTime)}</span>
							<span>{formatTime(duration)}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Hidden Audio Elements */}
			<audio
				ref={beforeRef}
				src={beforeSrc}
				preload="metadata"
				className="hidden"
			/>
			<audio
				ref={afterRef}
				src={afterSrc}
				preload="metadata"
				className="hidden"
			/>
		</div>
	);
}

interface ComparisonExample {
	title: string;
	beforeLabel: string;
	afterLabel: string;
	beforeSrc: string;
	afterSrc: string;
}

interface AudioComparisonSectionProps {
	heading: string;
	description?: string;
	examples: ComparisonExample[];
}

export function AudioComparisonSection({
	heading,
	description,
	examples,
}: AudioComparisonSectionProps) {
	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="font-bold text-2xl md:text-3xl">{heading}</h2>
				{description && (
					<p className="mt-2 text-muted-foreground">{description}</p>
				)}
			</div>
			<div className="grid gap-4 md:gap-6">
				{examples.map((example) => (
					<AudioComparison key={example.title} {...example} />
				))}
			</div>
		</div>
	);
}
