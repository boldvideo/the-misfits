"use client";

import React, { useState } from "react";
import { Info, ListOrdered, Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Space_Grotesk } from "next/font/google";

// Define the available tab types
type TabId = "info" | "chapters" | "transcript" | "assistant";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500"],
});

interface MobileContentTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hasChapters: boolean;
  hasTranscript: boolean;
  className?: string;
}

/**
 * Mobile navigation tabs for video detail page
 * Displays tabs for Info, Chapters, Transcript, and AI Assistant
 */
export function MobileContentTabs({
  activeTab,
  onTabChange,
  hasChapters,
  hasTranscript,
  className,
}: MobileContentTabsProps) {
  return (
    <div className={cn("lg:hidden", className)}>
      {/* Tab Pills */}
      <div
        className={` ${spaceGrotesk.className} uppercase flex justify-around py-2 border-t border-b border-border bg-background sticky top-0 z-10`}
      >
        <button
          onClick={() => onTabChange("info")}
          className={cn(
            "uppercase flex items-center gap-1 px-3 py-2 transition-colors",
            activeTab === "info"
              ? "text-background bg-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={activeTab === "info"}
        >
          <span className="text-xs">Info</span>
        </button>

        {hasChapters && (
          <button
            onClick={() => onTabChange("chapters")}
            className={cn(
              "uppercase flex items-center gap-1 px-3 py-2 transition-colors",
              activeTab === "chapters"
                ? "text-background bg-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={activeTab === "chapters"}
          >
            <span className="text-xs">Chapters</span>
          </button>
        )}

        {hasTranscript && (
          <button
            onClick={() => onTabChange("transcript")}
            className={cn(
              "uppercase flex items-center gap-1 px-3 py-2 transition-colors",
              activeTab === "transcript"
                ? "text-background bg-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={activeTab === "transcript"}
          >
            <span className="text-xs">Transcript</span>
          </button>
        )}

        <button
          onClick={() => onTabChange("assistant")}
          className={cn(
            "uppercase flex items-center gap-1 px-3 py-2 transition-colors",
            activeTab === "assistant"
              ? "text-background bg-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={activeTab === "assistant"}
        >
          <span className="text-xs">Ask AI</span>
        </button>
      </div>
    </div>
  );
}
