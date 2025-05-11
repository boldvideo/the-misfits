import { timestampToSeconds, secondsToReadableTime } from "@/lib/utils/time";

interface Chapter {
  startTime: string; // Readable format (MM:SS)
  startTimeSeconds: number; // Time in seconds
  title: string;
}

export const parseChapters = (
  webvttString: string | null | undefined
): Chapter[] => {
  if (!webvttString || !webvttString.includes("WEBVTT")) return [];

  const chapterRegex =
    /(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3}) --> .*\n(.+)/g;
  const chapters: Chapter[] = [];
  let match;

  while ((match = chapterRegex.exec(webvttString)) !== null) {
    const startTimeString = match[1];
    const title = match[2].trim();
    const startTimeSeconds = timestampToSeconds(startTimeString);
    const readableStartTime = secondsToReadableTime(startTimeSeconds);

    chapters.push({
      startTime: readableStartTime,
      startTimeSeconds: startTimeSeconds,
      title: title,
    });
  }

  return chapters;
};
