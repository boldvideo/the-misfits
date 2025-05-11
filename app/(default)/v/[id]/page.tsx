import { notFound } from "next/navigation";
import { bold } from "@/client";
import { VideoDetail } from "@/components/video-detail";
import type { Video, Settings } from "@boldvideo/bold-js";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  // `params` is a Promise in Next.js 15+
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await bold.videos.get(id);
  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      images: [
        {
          url: `https://demo.bold.video/og?t=${encodeURIComponent(
            data.title
          )}&img=${encodeURIComponent(data.thumbnail)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

/**
 * Fetches initial data for the video page in parallel.
 * @returns An object containing settings and the video, or nulls if fetches fail.
 */
async function getVideoPageData(videoId: string): Promise<{
  settings: Settings | null;
  video: Video | null;
}> {
  try {
    // Fetch settings and video in parallel
    const [settingsResponse, videoResponse] = await Promise.all([
      bold.settings(), // Fetch general settings
      bold.videos.get(videoId),
    ]);

    const settings = settingsResponse?.data ?? null;
    const video = videoResponse?.data ?? null;

    // Handle 404 / logical "missing" case for video
    if (!video) {
      notFound();
    }

    return { settings, video };
  } catch (error) {
    console.error("Failed to fetch video page data:", error);
    // Let the Next.js error boundary handle the UI
    throw error; // Re-throw to trigger the error boundary
  }
}

export default async function VideoPage({
  params,
  searchParams,
}: {
  // `params` and `searchParams` are Promises starting from Next.js 15.
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;

  const { settings, video } = await getVideoPageData(id);

  // This check might be redundant if getVideoPageData throws notFound(), but kept for safety
  if (!video || !settings) {
    // If settings are critical and failed, maybe show an error or different notFound logic
    notFound();
  }

  const startTime = t ? Number(t) : undefined;

  return (
    <>
      <VideoDetail
        video={video}
        startTime={startTime}
        settings={settings}
        className=""
      />
    </>
  );
}
