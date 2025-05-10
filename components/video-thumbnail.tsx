import Link from "next/link";
import Image from "next/image";
import { formatRelative } from "date-fns/formatRelative";
import { formatDuration } from "util/format-duration";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500"],
});

interface VideoThumbnailProps {
  video: any;
  prefetch?: boolean;
  align?: "left" | "right";
  titleClassName?: string;
}

export function VideoThumbnail({
  video,
  prefetch = false,
  align = "left",
  titleClassName = "",
}: VideoThumbnailProps) {
  // Use responsive flex direction
  const flexDirection =
    align === "right" ? "sm:flex-row-reverse" : "sm:flex-row";
  return (
    <div className={"mb-8 sm:mb-12 w-full mx-auto"}>
      <Link
        href={`/v/${video.id}`}
        prefetch={prefetch}
        className={`flex flex-col ${flexDirection} items-start sm:gap-12 gap-4 w-full`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {/* Thumbnail */}
        <div className="w-full sm:w-2/5 min-w-0 aspect-video relative overflow-hidden rounded-lg">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill={true}
            className="object-cover"
            sizes="100vw, (max-width: 640px) 640px"
          />
          <span className="bg-black text-white absolute px-2 py-1 font-semibold text-xs sm:text-sm bottom-2 sm:bottom-3 right-2 sm:right-3 rounded-md">
            {formatDuration(video.duration)}
          </span>
        </div>
        {/* Info */}
        <div className="flex-1 w-full">
          <h3
            className={`${spaceGrotesk.className} font-semibold text-lg sm:text-2xl mb-1 sm:mb-2 ${titleClassName}`}
          >
            {video.title}
          </h3>
          {video.teaser && (
            <p className="mb-1 sm:mb-2 text-sm sm:text-base font-[adaptive-mono] text-foreground">
              {video.teaser}
            </p>
          )}
          <p className="text-[adaptive-mono] mt-4 sm:mt-8 text-xs sm:text-sm">
            {formatRelative(new Date(video.published_at), new Date())}
          </p>
        </div>
      </Link>
    </div>
  );
}
