"use client";
import dynamic from "next/dynamic";
import { bold } from "@/client";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { Video } from "@boldvideo/bold-js";

// Import MuxPlayer with SSR disabled to prevent hydration errors
const MuxPlayer = dynamic(
  () => import("@mux/mux-player-react").then((mod) => mod.default),
  { ssr: false }
);

// Define a type for the Mux Player Element since it's not exported directly
type MuxPlayerRefElement = {
  currentTime: number;
  readyState: number;
  play: () => Promise<void>;
  addChapters?: (chapters: Array<{ startTime: number; value: string }>) => void;
  addEventListener: HTMLVideoElement["addEventListener"];
  removeEventListener: HTMLVideoElement["removeEventListener"];
};

// Cache for parsed chapters to avoid repeatedly parsing the same file
const chaptersCache = new Map<
  string,
  Array<{ startTime: number; value: string }>
>();

/**
 * Extended Video type with additional properties used in our application
 */
interface ExtendedVideo extends Video {
  chapters_url?: string;
  playback_speed?: number;
}

/**
 * Convert timestamp strings to seconds
 * @param timestamp Timestamp string (e.g., "00:15", "00:00:15", "15")
 * @returns Number of seconds
 */
const timestampToSeconds = (timestamp: string): number => {
  // Handle different format possibilities:
  // 00:15 (mm:ss)
  // 00:00:15 (hh:mm:ss)
  const parts = timestamp
    .trim()
    .split(":")
    .map((part) => parseInt(part, 10));

  if (parts.length === 3) {
    // hh:mm:ss format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // mm:ss format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // seconds only
    return parts[0];
  }

  return 0;
};

/**
 * Interface for MuxPlayer component props
 */
interface MuxPlayerComponentProps {
  /** The video object containing metadata and playback information */
  video: ExtendedVideo;
  /** Whether to autoplay the video when it loads */
  autoPlay?: boolean;
  /** Callback for time update events */
  onTimeUpdate?: (e: Event) => void;
  /** Current time in seconds to set the playback position */
  currentTime?: number;
  /** Start time in seconds to begin playback from */
  startTime?: number;
  /** Additional CSS classes to apply to the player */
  className?: string;
  /** Whether the player is out of view and should be shown as a floating player */
  isOutOfView?: boolean;
}

/**
 * MuxPlayer component for video playback using Mux's player
 */
export const MuxPlayerComponent = forwardRef(function MuxPlayerComponent(
  {
    video,
    autoPlay,
    onTimeUpdate,
    currentTime,
    startTime,
    className = "",
    isOutOfView = false,
  }: MuxPlayerComponentProps,
  ref
) {
  const playerRef = useRef<MuxPlayerRefElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Array<{
    startTime: number;
    value: string;
  }> | null>(null);
  const chaptersLoadedRef = useRef(false);

  // Get the primary color from CSS variables
  useEffect(() => {
    // Get the primary color from CSS variable if document is available (client-side)
    if (typeof window !== "undefined") {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      setPrimaryColor(color);
    }
  }, []);

  // Fetch and parse chapters
  useEffect(() => {
    if (!video.chapters_url) return;

    // Check the cache first
    if (chaptersCache.has(video.chapters_url)) {
      setChapters(chaptersCache.get(video.chapters_url) || null);
      return;
    }

    const fetchChapters = async () => {
      try {
        const chaptersUrl = video.chapters_url;
        // Video.chapters_url is guaranteed to be defined here because of the check above
        if (!chaptersUrl) return;

        const response = await fetch(chaptersUrl);
        const chaptersText = await response.text();

        if (!chaptersText.includes("WEBVTT")) {
          return;
        }

        // Parse the WEBVTT file for chapters
        const lines = chaptersText.split("\n\n").slice(1); // Skip the WEBVTT header
        if (lines.length === 0) {
          return;
        }

        const parsedChapters = lines
          .map((block) => {
            // Split the block into lines
            const blockLines = block.split("\n");
            if (blockLines.length < 2) return null;

            // Some WEBVTT files might have an identifier first, so we need to find the time range line
            let timeRangeLine = "";
            let titleLine = "";

            for (const line of blockLines) {
              if (line.includes("-->")) {
                timeRangeLine = line;
              } else if (line.trim() && !timeRangeLine) {
                // This is likely an identifier, skip it
                continue;
              } else if (line.trim() && timeRangeLine) {
                // Found a title after the time range
                titleLine = line;
                break;
              }
            }

            if (!timeRangeLine || !titleLine) return null;

            // Extract start time from the time range
            const [startTimeStr] = timeRangeLine
              .split("-->")
              .map((t) => t.trim());

            return {
              startTime: timestampToSeconds(startTimeStr),
              value: titleLine.trim(),
            };
          })
          .filter(
            (chapter): chapter is { startTime: number; value: string } =>
              chapter !== null
          );

        if (parsedChapters.length === 0) {
          return;
        }

        // Store in cache
        if (video.chapters_url) {
          chaptersCache.set(video.chapters_url, parsedChapters);
        }

        // Set state
        setChapters(parsedChapters);
      } catch (error) {
        console.error("Error loading chapters:", error);
      }
    };

    fetchChapters();
  }, [video.chapters_url]);

  // Apply chapters to player whenever chapters or player ref changes
  useEffect(() => {
    if (!chapters || !playerRef.current || chaptersLoadedRef.current) return;

    const addChaptersToPlayer = () => {
      const player = playerRef.current;
      if (player && typeof player.addChapters === "function" && chapters) {
        player.addChapters(chapters);
        chaptersLoadedRef.current = true;
      } else {
        // Player doesn't support chapter addition
      }
    };

    const player = playerRef.current;
    if (player && player.readyState >= 1) {
      addChaptersToPlayer();
    } else if (player) {
      const handleReady = () => {
        addChaptersToPlayer();
      };

      player.addEventListener("loadedmetadata", handleReady, { once: true });
      player.addEventListener("canplay", handleReady, { once: true });

      // Safety timeout
      setTimeout(handleReady, 2000);
    }
  }, [chapters]);

  // Reset chapters loaded flag when video changes
  useEffect(() => {
    chaptersLoadedRef.current = false;
  }, [video.id]);

  // Handle initial time when the player loads
  useEffect(() => {
    if (startTime && playerRef.current) {
      const setInitialTime = () => {
        const player = playerRef.current;
        if (player) {
          player.currentTime = startTime;
        }
      };

      const player = playerRef.current;
      if (player && player.readyState >= 1) {
        setInitialTime();
      } else if (player) {
        player.addEventListener("loadedmetadata", setInitialTime, {
          once: true,
        });
      }
    }
  }, [startTime]);

  const handleTimeUpdate = (e: Event) => {
    const target = e.target as HTMLVideoElement;
    bold.trackEvent(video, {
      target: { currentTime: target.currentTime },
      type: "timeupdate",
    } as unknown as Event);
    if (onTimeUpdate) onTimeUpdate(e);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`
          ${
            isOutOfView
              ? "fixed sm:bottom-4 sm:right-4 sm:top-auto top-0 w-full sm:w-1/3 lg:w-1/4 bg-black z-50 rounded-lg shadow-lg"
              : "relative w-full h-full flex items-center justify-center"
          }
        `}
        style={{
          // Make sure mini player has proper interactions
          pointerEvents: isOutOfView ? "auto" : "inherit",
        }}
      >
        <MuxPlayer
          ref={(el) => {
            // Store the reference
            playerRef.current = el;

            // Handle forwarded ref
            if (typeof ref === "function") {
              ref(el);
            } else if (ref) {
              (ref as React.MutableRefObject<any>).current = el;
            }

            // If we already have chapters parsed, try to add them immediately
            if (el && chapters && !chaptersLoadedRef.current) {
              setTimeout(() => {
                if (el && typeof el.addChapters === "function" && chapters) {
                  el.addChapters(chapters);
                  chaptersLoadedRef.current = true;
                }
              }, 100);
            }
          }}
          playbackId={video.playback_id}
          metadata={{
            video_id: video.id,
            video_title: video.title,
          }}
          streamType="on-demand"
          title={video.title}
          poster={video.thumbnail}
          autoPlay={autoPlay}
          thumbnailTime={startTime || 0}
          className={`w-full h-full relative z-10 ${className}`}
          onTimeUpdate={handleTimeUpdate}
          onPlay={(e) => bold.trackEvent(video, e)}
          onPause={(e) => bold.trackEvent(video, e)}
          onLoadedMetadata={(e) => {
            bold.trackEvent(video, e);
            console.log("MuxPlayer loadedmetadata event");

            // One more attempt to add chapters on metadata loaded
            if (!chaptersLoadedRef.current && playerRef.current && chapters) {
              const player = playerRef.current;
              if (typeof player.addChapters === "function") {
                console.log("Adding chapters on metadata loaded");
                player.addChapters(chapters);
                chaptersLoadedRef.current = true;
              }
            }
          }}
          playsInline
          currentTime={startTime || currentTime}
          playbackRate={video.playback_speed || 1}
          storyboardSrc={
            video.playback_id
              ? `https://image.mux.com/${video.playback_id}/storyboard.vtt`
              : undefined
          }
          defaultHiddenCaptions={false}
          accentColor={primaryColor || undefined}
        />

        {isOutOfView && (
          <button
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 z-20 hover:bg-opacity-80"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Close floating player"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </>
  );
});
