"use client";
import Image from "next/image";
import clsx from "clsx";
import { formatRelative } from "date-fns";
import { Player } from "@/components/players";
import { Transcript } from "@/components/transcript";
import { useRef, useState, useEffect, useCallback } from "react";
import type { Video, Settings } from "@boldvideo/bold-js";
import { VideoDescription } from "./video-description";
import { ChapterList } from "./chapter-list";
import type React from "react";
import { AIAssistantProvider } from "./ui/ai-assistant/context";
import { MobileContentTabs } from "./mobile-content-tabs";
import { AIAssistant } from "./ui/ai-assistant";
import { Space_Grotesk } from "next/font/google";

// Define tab type for mobile navigation
type TabId = "info" | "chapters" | "transcript" | "assistant";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500"],
});

/**
 * Extended Video type with additional properties used in our application
 */
interface ExtendedVideo extends Video {
  chapters?: string;
  chapters_url?: string;
  transcript?: {
    json?: {
      url: string;
    };
  };
  ai_avatar?: string;
  ai_name?: string;
}

/**
 * Props for the VideoDetail component
 */
interface VideoDetailProps {
  video: ExtendedVideo;
  startTime?: number;
  className?: string;
  settings: Settings;
}

/**
 * Video detail page component showing a video player and metadata
 */
export function VideoDetail({
  video,
  startTime,
  className = "max-w-7xl",
  settings,
}: VideoDetailProps): React.JSX.Element {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);
  const [hasTranscript, setHasTranscript] = useState(false);
  const [isOutOfView, setIsOutOfView] = useState<boolean>(false);
  const prevScrollY = useRef(0);

  // Add state for mobile tab navigation
  const [activeTab, setActiveTab] = useState<TabId>("info");

  // Check if the video has chapters
  const hasChapters = Boolean(video.chapters);

  // Handle scroll behavior for floating player
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > window.innerHeight * 0.7 && !isOutOfView) {
      setIsOutOfView(false);
    }
    if (currentScrollY < window.innerHeight * 0.7 && isOutOfView) {
      setIsOutOfView(false);
    }
    prevScrollY.current = currentScrollY;
  }, [isOutOfView]);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // Set initial time when component mounts
  useEffect(() => {
    if (startTime && playerRef.current) {
      playerRef.current.currentTime = startTime;
    }
  }, [startTime]);

  /**
   * Handle clicking on a cue or chapter to seek to that position
   */
  const handleTimeSelect = useCallback((time: number) => {
    const toTime = isNaN(time) ? 0.1 : parseFloat(time.toString());
    if (playerRef?.current) {
      playerRef.current.currentTime = toTime;
      playerRef.current.play();
    }
  }, []);

  // Check if transcript is available
  useEffect(() => {
    setHasTranscript(
      !!video.transcript &&
        !!video.transcript.json &&
        !!video.transcript.json.url
    );
  }, [video]);

  return (
    <AIAssistantProvider onTimeClick={handleTimeSelect}>
      <div className="flex flex-col flex-1 min-h-0 lg:pb-60 lg:gap-y-8">
        {/* Player container - Always visible */}
        <div
          ref={playerContainerRef}
          className="bg-black w-full flex justify-center"
        >
          <div
            className={clsx(
              "w-full max-w-[1600px]",
              // Only apply grid on desktop screens
              video.chapters && "lg:grid lg:grid-cols-12 lg:space-y-0",
              "overflow-hidden"
            )}
          >
            <div className="aspect-video lg:max-h-[50vh] 2xl:max-h-[50vh] lg:aspect-auto w-full lg:h-full bg-black flex-grow lg:col-span-9">
              <Player
                video={video}
                autoPlay={true}
                ref={playerRef}
                startTime={startTime}
                className={className}
                isOutOfView={isOutOfView}
              />
            </div>

            {/* Chapters only visible on desktop */}
            {hasChapters && (
              <div className="hidden lg:block lg:col-span-3 bg-sidebar">
                <ChapterList
                  chaptersWebVTT={video.chapters}
                  playbackId={video.playback_id}
                  onChapterClick={handleTimeSelect}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <MobileContentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasChapters={hasChapters}
          hasTranscript={hasTranscript}
          className="mb-2 lg:hidden"
        />

        {/* Mobile Content - conditionally rendered based on active tab */}
        <div className="lg:hidden px-4 flex flex-col flex-1 min-h-0">
          {/* Info tab - show title, date, description */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{video.title}</h1>
              <p className="text-muted-foreground">
                {formatRelative(new Date(video.published_at), new Date())}
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-4 prose-a:text-primary prose-a:hover:underline">
                <VideoDescription text={video.description || ""} />
              </div>
            </div>
          )}

          {/* Chapters tab */}
          {activeTab === "chapters" && hasChapters && (
            <ChapterList
              chaptersWebVTT={video.chapters}
              playbackId={video.playback_id}
              onChapterClick={handleTimeSelect}
            />
          )}

          {/* Transcript tab */}
          {activeTab === "transcript" &&
            hasTranscript &&
            video.transcript?.json?.url && (
              <Transcript
                url={video.transcript.json.url}
                onCueClick={handleTimeSelect}
                playerRef={playerRef}
              />
            )}

          {/* AI Assistant tab */}
          {activeTab === "assistant" && (
            <div className="flex flex-col flex-1 min-h-0 bg-background">
              <AIAssistant
                videoId={video.id}
                name={settings.ai_name || "AI Assistant"}
                avatar={settings.ai_avatar || "/placeholder-avatar.png"}
                subdomain=""
                isEmbedded={true}
                className="flex-1"
              />
            </div>
          )}
        </div>

        {/* Desktop Content - only shown on larger screens */}
        <div className="hidden lg:flex lg:flex-row lg:gap-x-8 container mx-auto lg:max-w-[1600px] px-5 lg:px-10">
          {/* Left Column: Metadata and Transcript */}
          <div className="lg:w-2/3 flex-shrink-0">
            <h1
              className={`${spaceGrotesk.className} uppercase text-3xl lg:text-4xl max-w-2xl font-extrabold mb-4 leading-tight`}
            >
              {video.title}
            </h1>
            <p className="text-muted-foreground text-xl mb-4">
              {formatRelative(new Date(video.published_at), new Date())}
            </p>
            <div className="mb-12  max-w-2xl font-[adaptive-mono]">
              <VideoDescription text={video.description || ""} />
            </div>

            {hasTranscript && video.transcript?.json?.url ? (
              <div className="mb-12">
                <Transcript
                  url={video.transcript.json.url}
                  onCueClick={handleTimeSelect}
                  playerRef={playerRef}
                />
              </div>
            ) : video.transcript ? (
              <div className="mb-12">
                <h2 className="font-bold text-2xl mb-6">Transcript</h2>
                <p className="text-muted-foreground">
                  No transcript available for this video.
                </p>
              </div>
            ) : null}
          </div>

          {/* Right Column: AI Assistant (Desktop) */}
          <div className="lg:w-1/3 flex-shrink-0">
            {/* Render AIAssistant here for desktop, it will use the shared context */}
            {settings && (
              <AIAssistant
                videoId={video.id}
                name={settings.ai_name || "AI Assistant"}
                avatar={settings.ai_avatar || "/default-avatar.png"}
                subdomain={""}
                // isEmbedded is false by default, so it will render in floating mode
                // Adjust className as needed for desktop layout
                className="h-[calc(100vh-200px)]" // Example height, adjust as necessary
              />
            )}
          </div>
        </div>
      </div>
    </AIAssistantProvider>
  );
}
