import React from "react";
import { Space_Grotesk } from "next/font/google";
import { bold } from "@/client";
import { VideoThumbnail } from "@/components/video-thumbnail";
import { FeaturedPlaylist } from "@/components/featured-playlist";
import type { Settings, Video, Playlist } from "@boldvideo/bold-js";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500"],
});

// How often this page should revalidate (in seconds)
export const revalidate = 60;

// Number of videos to display on the homepage
const LATEST_VIDEO_LIMIT = 8;

/**
 * Fetches initial data for the home page in parallel.
 * @returns An object containing settings and videos, or nulls if fetches fail.
 */
async function getHomeData(): Promise<{
  settings: Settings | null;
  videos: Video[] | null;
}> {
  try {
    const [settingsResponse, videosResponse] = await Promise.all([
      bold.settings(8), // Assuming 8 is a relevant ID or parameter
      bold.videos.list(LATEST_VIDEO_LIMIT),
    ]);

    // Basic check if responses are okay; adjust based on actual SDK response structure
    const settings = settingsResponse?.data ?? null;
    const videos = videosResponse?.data ?? null;

    return { settings, videos };
  } catch (error) {
    console.error("Failed to fetch home page data:", error);
    // Let the Next.js error boundary handle the UI
    throw error; // Re-throw to trigger the error boundary
  }
}

/**
 * Home page component that displays latest videos and featured playlists
 * @returns The rendered homepage
 */
export default async function Home(): Promise<React.JSX.Element> {
  const { settings, videos } = await getHomeData();

  const hasVideos = videos && videos.length > 0;
  const hasPlaylists =
    settings?.featured_playlists && settings.featured_playlists.length > 0;

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto">
      {/* Videos Section */}
      {hasVideos && (
        <section>
          <div className="mx-auto my-16 max-w-lg text-center">
            <h2
              className={`${spaceGrotesk.className} uppercase text-4xl mb-5`}
              id="latest-videos"
            >
              THE MISFITS ON TAPE
            </h2>
            <p className="text-lg font-[adaptive-mono] text-foreground mb-5">
              Raw cuts, loud takes, and zero apologies. Watch the movement in
              motion.
            </p>
          </div>
          <ul
            className="mb-16 flex flex-col gap-10"
            aria-labelledby="latest-videos"
          >
            {(videos as Video[]).map((video, idx) => (
              <li key={video.id}>
                <VideoThumbnail
                  video={video}
                  prefetch={true}
                  align={idx % 2 === 0 ? "left" : "right"}
                  titleClassName={
                    spaceGrotesk.className + " uppercase text-2xl"
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Featured Playlists Section */}
      {hasPlaylists && (
        <section>
          {/* Type assertion needed if settings could be null, but hasPlaylists guards it */}
          {(settings as Settings).featured_playlists.map(
            (playlist: Playlist) => (
              <FeaturedPlaylist key={playlist.id} playlist={playlist} />
            )
          )}
        </section>
      )}

      {/* Optional: Add a message if neither section has content */}
      {!hasVideos && !hasPlaylists && (
        <p className="text-center text-gray-500">No content available yet.</p>
      )}
    </div>
  );
}
