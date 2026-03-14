"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Thumbnail from "@/components/Thumbnail";
import { formatFileSizeDisplay, getFileIcon } from "@/lib/utils";
import FormattedDateTime from "@/components/FormattedDateTime";
import ActionDropdown from "@/components/ActionDropdown";
import type { DriveFileDisplay } from "@/lib/google-drive";

const DRAG_TYPE = "application/x-storeit-file";

const Card = ({ file }: { file: DriveFileDisplay }) => {
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({
      fileId: file.$id,
      fileName: file.name,
      parentId: file.parents?.[0] ?? "root",
    }));
    e.dataTransfer.effectAllowed = "move";
    if (dragPreviewRef.current) {
      e.dataTransfer.setDragImage(dragPreviewRef.current, 40, 30);
    }
  };

  const iconSrc = getFileIcon(file.extension, file.type);

  return (
    <>
      <div
        ref={dragPreviewRef}
        aria-hidden
        className="pointer-events-none fixed left-[-9999px] top-0 z-[-1] flex items-center gap-2 rounded-lg border border-light-300 bg-white px-3 py-2 shadow-lg"
      >
        <Image src={iconSrc} alt="" width={24} height={24} />
        <span className="max-w-[180px] truncate text-sm font-medium text-light-100">{file.name}</span>
      </div>
      <Link
        href={file.url}
        target="_blank"
        className="file-card"
        draggable
        onDragStart={handleDragStart}
      >
      <div className="flex justify-between">
        <Thumbnail
          type={file.type}
          extension={file.extension}
          url={file.thumbnailLink || file.url}
          className="!size-20"
          imageClassName="!size-11"
        />

        <div className="flex flex-col items-end justify-between">
          <ActionDropdown file={file} />
          <p className="body-1">{formatFileSizeDisplay(file.size, file.mimeType)}</p>
        </div>
      </div>

      <div className="file-card-details">
        <p className="subtitle-2 line-clamp-1">{file.name}</p>
        <FormattedDateTime
          date={file.$createdAt}
          className="body-2 text-light-100"
        />
        <p className="caption line-clamp-1 text-light-200">
          By: {file.owner.fullName}
        </p>
      </div>
    </Link>
    </>
  );
};
export default Card;
