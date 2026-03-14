import { listDriveFoldersAction } from "@/lib/actions/drive.actions";
import FolderCard from "@/components/FolderCard";
import CreateFolderButton from "@/components/CreateFolderButton";

export const dynamic = "force-dynamic";

export default async function FoldersPage() {
  const folders = await listDriveFoldersAction("root");

  return (
    <div className="page-container">
      <section className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="h1">Folders</h1>
          <CreateFolderButton />
        </div>
      </section>

      {folders && folders.length > 0 ? (
        <section className="file-list">
          {folders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
        </section>
      ) : (
        <p className="empty-list">No folders yet. Click &quot;New folder&quot; to create one.</p>
      )}
    </div>
  );
}
