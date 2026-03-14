import React from "react";
import Image from "next/image";
import { cn, getFileIcon } from "@/lib/utils";

interface Props {
  type: string;
  extension: string;
  url?: string;
  imageClassName?: string;
  className?: string;
}

export const Thumbnail = ({
  type,
  extension,
  url = "",
  imageClassName,
  className,
}: Props) => {
  // Only use url for next/image when it's a direct image URL (e.g. Drive thumbnailLink from googleusercontent.com).
  // Drive webViewLink (drive.google.com/file/d/.../view) returns HTML, not image bytes.
  const isDirectImageUrl = url && !url.includes("drive.google.com/file");
  const isImage = type === "image" && extension !== "svg" && isDirectImageUrl;

  return (
    <figure className={cn("thumbnail", className)}>
      <Image
        src={isImage ? url! : getFileIcon(extension, type)}
        alt="thumbnail"
        width={100}
        height={100}
        className={cn(
          "size-8 object-contain",
          imageClassName,
          isImage && "thumbnail-image",
        )}
      />
    </figure>
  );
};
export default Thumbnail;
