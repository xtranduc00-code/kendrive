"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Thumbnail from "@/components/Thumbnail";
import { formatFileSizeDisplay, getFileIcon, getDriveThumbnailUrl, isPreviewableInApp } from "@/lib/utils";
import FormattedDateTime from "@/components/FormattedDateTime";
import ActionDropdown from "@/components/ActionDropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { starDriveFileAction } from "@/lib/actions/drive.actions";
import { toast } from "react-toastify";
import type { DriveFileDisplay } from "@/lib/google-drive";

const DRAG_TYPE = "application/x-storeit-file";

type CardProps = { file: DriveFileDisplay; layout?: "grid" | "list" };

const Card = ({ file, layout = "grid" }: CardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  const [starred, setStarred] = useState(!!file.starred);

  const handleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !starred;
    setStarred(next);
    const res = await starDriveFileAction(file.$id, next);
    if (res.ok) {
      toast.success(next ? "Starred" : "Unstarred");
      router.refresh();
    } else {
      setStarred(!!file.starred);
      toast.error(res.error ?? "Failed");
    }
  };

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
  const isList = layout === "list";
  const openInApp = isPreviewableInApp(file.mimeType);
  const thumbnailUrl =
    file.thumbnailLink ||
    (file.type === "document" || file.type === "video" ? getDriveThumbnailUrl(file.$id) : undefined) ||
    file.url;
  const fileHref = openInApp
    ? `/file/${file.$id}?mime=${encodeURIComponent(file.mimeType || "")}&name=${encodeURIComponent(file.name)}&from=${encodeURIComponent(pathname || "/folders")}`
    : file.url;

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
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={fileHref}
            target={openInApp ? undefined : "_blank"}
            className={`relative ${isList ? "file-card file-card--list" : "file-card"}`}
            draggable
            onDragStart={handleDragStart}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleStar}
                  className="absolute right-12 top-3 z-10 flex size-8 items-center justify-center rounded-full text-light-300 transition-colors hover:bg-brand/10 hover:text-brand"
                  aria-label={starred ? "Remove star" : "Star"}
                >
                  {starred ? (
                    <svg className="h-5 w-5 fill-brand text-brand" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">{starred ? "Remove star" : "Star"}</TooltipContent>
            </Tooltip>
            {isList ? (
              <>
                <Thumbnail
                  type={file.type}
                  extension={file.extension}
                  url={thumbnailUrl}
                  className="!size-14 shrink-0"
                  imageClassName="!size-8"
                />
                <div className="file-card-details file-card-details--list min-w-0 flex-1">
                  <p className="subtitle-2 line-clamp-1">{file.name}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0 body-2 text-light-200">
                    <span>{formatFileSizeDisplay(file.size, file.mimeType)}</span>
                    <FormattedDateTime date={file.$createdAt} />
                    <span>By: {file.owner.fullName}</span>
                  </div>
                </div>
                <ActionDropdown file={file} />
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <Thumbnail
                    type={file.type}
                    extension={file.extension}
                    url={thumbnailUrl}
                    className="!size-24"
                    imageClassName="!size-14"
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
              </>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px] break-words font-medium">
          {file.name}
        </TooltipContent>
      </Tooltip>
    </>
  );
};
export default Card;
