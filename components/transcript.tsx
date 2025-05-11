"use client";

import { fetcher } from "@/util/fetcher";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Space_Grotesk } from "next/font/google";
// Transcript format types
interface TranscriptWord {
  confidence: number;
  end: number;
  speaker: string;
  start: number;
  word: string;
}

interface TranscriptUtterance {
  confidence: number;
  end: number;
  speaker: string;
  start: number;
  text: string;
  words: TranscriptWord[];
}

interface TranscriptMetadata {
  duration: number;
  language: string;
  source_model: string;
  source_url: string;
  source_vendor: string;
  source_version: string;
  speakers: Record<string, null>;
  transcription_date: string;
  version: string;
}

interface TranscriptData {
  metadata: TranscriptMetadata;
  utterances: TranscriptUtterance[];
}

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500"],
});

export function Transcript({
  url,
  onCueClick,
  playerRef,
}: {
  url: string;
  onCueClick?: (time: number) => void;
  playerRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const { data, error, isLoading } = useSWR<TranscriptData>(url, fetcher);
  const [activeUtteranceIndex, setActiveUtteranceIndex] = useState<number>(-1);

  useEffect(() => {
    if (!data || !playerRef.current) return;

    // Store a reference to the player element
    const player = playerRef.current;

    const onTimeUpdate = () => {
      if (!player) return;

      const currentTime = player.currentTime;

      // Find the current utterance
      const newActiveUtteranceIndex = data.utterances.findIndex(
        (utterance) =>
          currentTime >= utterance.start && currentTime <= utterance.end
      );

      if (newActiveUtteranceIndex !== activeUtteranceIndex) {
        setActiveUtteranceIndex(newActiveUtteranceIndex);
      }
    };

    player.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      player.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [data, playerRef, activeUtteranceIndex]);

  const handleCueClick = (time: number) => {
    if (onCueClick) onCueClick(time);
  };

  if (error) return null;
  if (isLoading) return <p className="text-gray-500">Loading transcript...</p>;
  if (!data || data.utterances.length === 0) return null;

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative">
      <h2 className="font-bold text-2xl mb-8">
        Transcript{" "}
        <span className="text-gray-500 text-base font-normal">
          (auto-generated)
        </span>
      </h2>
      <div className="space-y-6">
        {data.utterances.map((utterance, idx) => (
          <div
            id={`utterance-${idx}`}
            key={`utterance-${idx}`}
            className={`utterance border-l-4 ${
              idx === activeUtteranceIndex
                ? "border-foreground"
                : "border-muted-foreground"
            } pl-5 py-2 cursor-pointer transition-colors duration-200`}
            onClick={() => handleCueClick(utterance.start)}
          >
            <div className="mb-3 ml-2 flex items-center">
              <span
                className={`${spaceGrotesk.className} font-semibold text-base text-foreground`}
              >
                Speaker {utterance.speaker}
              </span>
              <span className="font-[adaptive-mono] text-sm bg-foreground ml-2 px-2 py-1 rounded text-background">
                {formatTimestamp(utterance.start)}
              </span>
            </div>
            <div className="font-[adaptive-mono] p-2 rounded-md text-[17px] max-w-[42rem] leading-7 tracking-wide hover:bg-foreground hover:text-background">
              {utterance.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
