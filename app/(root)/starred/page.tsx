import { getDriveStarredAction } from "@/lib/actions/drive.actions";
import StarredFileList from "@/components/StarredFileList";

export const dynamic = "force-dynamic";

export default async function StarredPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const res = await getDriveStarredAction({
    sort: sort || "$createdAt-desc",
    limit: 24,
  });
  const data = (res ?? {}) as {
    folders?: { id: string; name: string; parents?: string[] }[];
    files?: { $id: string; name: string; [key: string]: unknown }[];
    nextPageToken?: string;
  };
  const folders = data.folders ?? [];
  const files = data.files ?? [];
  const nextPageToken = data.nextPageToken;

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1">Starred</h1>
        <p className="body-1 text-light-200 mt-1">
          Items you marked with a star
        </p>
      </section>

      {folders.length > 0 || files.length > 0 ? (
        <StarredFileList
          key={`starred-${sort ?? ""}`}
          initialFolders={folders}
          initialFiles={files}
          initialNextPageToken={nextPageToken}
          sort={sort || "$createdAt-desc"}
        />
      ) : (
        <p className="empty-list mt-6">
          No starred items. Use the star on files and folders to see them here.
        </p>
      )}
    </div>
  );
}
