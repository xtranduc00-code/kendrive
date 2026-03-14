"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { uploadDriveFileAction } from "@/lib/actions/drive.actions";
import { toast } from "react-toastify";
import { MAX_FILE_SIZE } from "@/constants";

/** Get current folder id from pathname when on /folder/[folderId] */
function getParentIdFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/^\/folder\/([^/]+)$/);
  return match ? match[1] : undefined;
}

export default function DropZoneArea({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const pathname = usePathname();
  const parentId = getParentIdFromPathname(pathname ?? "");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      setUploading(true);
      let anySuccess = false;
      for (const file of acceptedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File too large — ${file.name} is over 50MB limit`);
          continue;
        }
        const formData = new FormData();
        formData.set("file", file);
        if (parentId) formData.set("parentId", parentId);
        const res = await uploadDriveFileAction(formData);
        if (res.ok) {
          anySuccess = true;
          toast.success(`Uploaded — ${file.name}`);
        } else {
          toast.error(`Upload failed — ${res.error ?? "Something went wrong"}`);
        }
      }
      setUploading(false);
      if (anySuccess) router.refresh();
    },
    [parentId, router]
  );

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    disabled: uploading,
  });

  return (
    <div {...getRootProps()} className="relative h-full">
      {children}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[30px] bg-brand/20 border-4 border-dashed border-brand pointer-events-none">
          <div className="bg-white/95 rounded-2xl px-8 py-6 shadow-lg text-center">
            <p className="h4 text-light-100">Drop files to upload to Google Drive</p>
            <p className="body-2 text-light-200 mt-1">Drag and drop one or more files here</p>
          </div>
        </div>
      )}
    </div>
  );
}
