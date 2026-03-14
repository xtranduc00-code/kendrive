"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Thumbnail } from "@/components/Thumbnail";
import { FormattedDateTime } from "@/components/FormattedDateTime";
import ActionDropdown from "@/components/ActionDropdown";
import type { DriveFileDisplay } from "@/lib/google-drive";
import { isPreviewableInApp } from "@/lib/utils";

export function DashboardRecentFileRow({ file }: { file: DriveFileDisplay }) {
  const pathname = usePathname();
  const openInApp = isPreviewableInApp(file.mimeType);
  const fileHref = openInApp
    ? `/file/${file.$id}?mime=${encodeURIComponent(file.mimeType || "")}&name=${encodeURIComponent(file.name)}&from=${encodeURIComponent(pathname || "/")}`
    : file.url;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={fileHref}
          target={openInApp ? undefined : "_blank"}
          className="flex items-center gap-3"
        >
          <Thumbnail
            type={file.type}
            extension={file.extension}
            url={file.url}
          />
          <div className="recent-file-details">
            <div className="flex flex-col gap-1">
              <p className="recent-file-name">{file.name}</p>
              <FormattedDateTime
                date={file.$createdAt}
                className="caption"
              />
            </div>
            <ActionDropdown file={file} />
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[320px] break-words font-medium">
        {file.name}
      </TooltipContent>
    </Tooltip>
  );
}
