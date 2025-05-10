import { bold } from "@/client";
// import { Player } from "components/embed-player";
import { Player } from "@/components/players";
import type { Video } from "@boldvideo/bold-js";

/**
 * Extended Video type with additional properties used in our application
 */
interface ExtendedVideo extends Video {
  chapters_url?: string;
}

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { data: video } = await bold.videos.get(params.id);
  return {
    title: video.title,
    description: video.description,
    openGraph: {
      title: video.title,
      images: [
        {
          url: `https://demo.bold.video/og?t=${encodeURIComponent(
            video.title
          )}&img=${encodeURIComponent(video.thumbnail)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function EmbedPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;

  try {
    const { data } = await bold.videos.get(params.id);
    // Cast to ExtendedVideo to access chapters_url property
    const video = data as ExtendedVideo;

    if (!video) {
      return (
        <div className="bg-black m-0 p-0 w-screen h-screen overflow-hidden flex items-center justify-center">
          <p className="text-white">Loading video...</p>
        </div>
      );
    }

    // Parse start time from query params
    const startTime = searchParams.t ? parseInt(searchParams.t, 10) : undefined;

    return (
      <div className="bg-black m-0 p-0 w-screen h-screen overflow-hidden">
        <Player
          key={`video-${video.id}`}
          video={video}
          autoPlay={false}
          startTime={startTime}
          className="max-w-none" // Removes any max-width constraint in the embed view
        />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch video:", error);
    return (
      <div className="bg-black m-0 p-0 w-screen h-screen overflow-hidden flex items-center justify-center">
        <p className="text-white">
          Failed to load video. Please try again later.
        </p>
      </div>
    );
  }
}
