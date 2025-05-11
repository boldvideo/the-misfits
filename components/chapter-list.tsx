import Image from "next/image";
import { timestampToSeconds, secondsToReadableTime } from "@/lib/utils/time"; // Import helpers
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500"],
});

/**
 * Chapter data structure
 */
interface Chapter {
  startTime: string; // Readable format (MM:SS)
  startTimeSeconds: number; // Time in seconds
  title: string;
}

/**
 * Props for the ChapterList component
 */
interface ChapterListProps {
  chapters: Chapter[];
  playbackId: string;
  onChapterClick: (timeInSeconds: number) => void;
}

/**
 * Renders a list of video chapters from WEBVTT data.
 */
export function ChapterList({
  chapters,
  playbackId,
  onChapterClick,
}: ChapterListProps): React.JSX.Element | null {
  if (!chapters || chapters.length === 0) {
    return null; // Don't render anything if no chapters
  }

  return (
    <div className="relative bg-sidebar flex flex-col col-span-3">
      <div className="lg:absolute top-0 left-0 w-full h-full flex flex-col">
        <h3 className="p-3 font-bold text-lg">Chapters</h3>
        <ol>
          {chapters.map((chapter, idx) => (
            <li
              key={chapter.startTimeSeconds} // Use seconds for a more unique key
              onClick={() => onChapterClick(chapter.startTimeSeconds)}
              className="group cursor-pointer flex space-x-3 p-3 font-semibold hover:bg-primary hover:text-primary-foreground"
              role="button"
              tabIndex={0} // Make it focusable
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onChapterClick(chapter.startTimeSeconds);
                }
              }}
            >
              <div className="flex items-start">
                <div className="w-6 leading-5 pt-px text-xs font-normal tracking-tight">
                  {idx + 1}
                </div>
              </div>
              <div className="relative w-20 h-12 aspect-video flex-shrink-0 overflow-hidden border border-ring group-hover:border-primary">
                <Image
                  // Consider adding a placeholder/fallback image
                  src={`https://image.mux.com/${playbackId}/thumbnail.png?width=200&height=100&fit_mode=smartcrop&time=${chapter.startTimeSeconds}`}
                  alt={`Thumbnail for chapter: ${chapter.title}`}
                  fill={true}
                  sizes="80px" // Provide sizes attribute for optimization
                  style={{ objectFit: "cover" }}
                  className=""
                  // Optional: Add error handling for images
                  onError={(e) => {
                    // Handle image loading errors, e.g., show a default thumbnail
                    (e.target as HTMLImageElement).style.display = "none"; // Hide broken image
                  }}
                />
              </div>
              <div className="flex flex-col">
                <div
                  className={`${spaceGrotesk.className} uppercase w-full leading-tight`}
                >
                  {chapter.title}
                </div>
                <div>
                  <span className="font-[adaptive-mono] text-muted-foreground group-hover:text-primary-foreground text-xs">
                    {chapter.startTime}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
