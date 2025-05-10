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
  // Use flex-row or flex-row-reverse based on align
  const flexDirection = align === "right" ? "flex-row-reverse" : "flex-row";
  return (
    <div
      className={`flex ${flexDirection} items-start gap-12 mb-12 w-full  mx-auto`}
    >
      <Link
        href={`/v/${video.id}`}
        prefetch={prefetch}
        className="flex w-full"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {/* Thumbnail */}
        <div className="w-2/5 min-w-[180px] aspect-video relative overflow-hidden rounded-lg">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill={true}
            className="object-cover"
            sizes="100vw, (max-width: 640px) 640px"
          />
          <span className="bg-black text-white absolute px-2 py-1 font-semibold text-sm bottom-3 right-3 rounded-md">
            {formatDuration(video.duration)}
          </span>
        </div>
        {/* Info */}
        <div className="flex-1">
          <h3
            className={`${spaceGrotesk.className} font-semibold text-2xl mb-2 ${titleClassName}`}
          >
            {video.title}
          </h3>
          {video.teaser && (
            <p className="mb-2 text-base font-[adaptive-mono] text-foreground">
              {video.teaser}
            </p>
          )}
          <p className="text-[adaptive-mono] mt-8 text-sm">
            {formatRelative(new Date(video.published_at), new Date())}
          </p>
        </div>
      </Link>
    </div>
  );
}
