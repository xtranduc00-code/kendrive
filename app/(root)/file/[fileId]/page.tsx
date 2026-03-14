import { FileViewerBar } from "@/components/FileViewerBar";
import { getFilePreviewUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SAFE_BACK_PREFIXES = ["/", "/folders", "/folder/", "/starred", "/documents", "/images", "/media"];

function getBackTo(from: string | undefined): string {
  if (!from || typeof from !== "string") return "/folders";
  const path = from.startsWith("/") ? from : `/${from}`;
  const ok = SAFE_BACK_PREFIXES.some((p) => p === path || (p.length > 1 && path.startsWith(p)));
  return ok ? path : "/folders";
}

export default async function FileViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ fileId: string }>;
  searchParams: Promise<{ mime?: string; name?: string; edit?: string; from?: string }>;
}) {
  const { fileId } = await params;
  const { mime, name, edit, from } = await searchParams;
  const editMode = edit === "1";
  const backTo = getBackTo(from);
  const previewUrl = getFilePreviewUrl(fileId, mime || undefined, {
    edit: editMode,
  });

  return (
    <div className="file-viewer-root">
      <FileViewerBar
        fileId={fileId}
        mimeType={mime || undefined}
        name={name}
        editMode={editMode}
        backTo={backTo}
        fromParam={from}
      />
      <div className="file-viewer-frame-wrap">
        <iframe
          title={name ? decodeURIComponent(name) : "File preview"}
          src={previewUrl}
          className="file-viewer-iframe"
          allow="fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
