"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { moveDriveFileAction, deleteDriveFileAction, getDriveFoldersAction, getDriveFiles } from "@/lib/actions/drive.actions";
import { toast } from "react-toastify";
import Card from "@/components/Card";
import FolderCard from "@/components/FolderCard";
import FolderSortSelect from "@/components/FolderSortSelect";
import type { DriveFileDisplay } from "@/lib/google-drive";
import type { DriveFolder } from "@/lib/google-drive";

type Props = {
  initialFiles: DriveFileDisplay[];
  initialNextPageToken?: string;
  folders: DriveFolder[];
  currentFolderId: string;
  sort: string;
};

function parseFilesRes(res: unknown): { documents: DriveFileDisplay[]; nextPageToken?: string } {
  const r = res as { documents?: DriveFileDisplay[]; nextPageToken?: string };
  return { documents: r?.documents ?? [], nextPageToken: r?.nextPageToken };
}

type SelectedItem = { id: string; name: string; type: "file" | "folder" };

export default function FolderFileListWithSelect({ initialFiles, initialNextPageToken, folders, currentFolderId, sort }: Props) {
  const [files, setFiles] = useState<DriveFileDisplay[]>(initialFiles);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    setLoadingMore(true);
    const res = await getDriveFiles({
      parentId: currentFolderId,
      limit: 24,
      sort,
      pageToken: nextPageToken,
    });
    const { documents, nextPageToken: next } = parseFilesRes(res);
    setFiles((prev) => [...prev, ...documents]);
    setNextPageToken(next);
    setLoadingMore(false);
  };
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState<string>("root");
  const [foldersForMove, setFoldersForMove] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);

  const selectedList: SelectedItem[] = [];
  selected.forEach((id) => {
    const f = files.find((x) => x.$id === id);
    if (f) selectedList.push({ id: f.$id, name: f.name, type: "file" });
    else {
      const folder = folders.find((x) => x.id === id);
      if (folder) selectedList.push({ id: folder.id, name: folder.name, type: "folder" });
    }
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const openMove = () => {
    setMoveOpen(true);
    setLoadingFolders(true);
    getDriveFoldersAction().then((list) => {
      setFoldersForMove(list || []);
      setMoveTargetId(list?.[0]?.id ?? "root");
      setLoadingFolders(false);
    });
  };

  const handleBulkMove = async () => {
    if (!moveTargetId || moveTargetId === currentFolderId) {
      setMoveOpen(false);
      return;
    }
    setLoading(true);
    let ok = 0;
    let fail = 0;
    for (const item of selectedList) {
      const parentId = item.type === "file"
        ? files.find((f) => f.$id === item.id)?.parents?.[0] ?? "root"
        : folders.find((f) => f.id === item.id)?.parents?.[0] ?? "root";
      if (parentId === moveTargetId) continue;
      const res = await moveDriveFileAction(item.id, moveTargetId, parentId);
      if (res.ok) ok++;
      else fail++;
    }
    setLoading(false);
    setMoveOpen(false);
    clearSelection();
    if (ok) toast.success(`Moved ${ok} item(s)`);
    if (fail) toast.error(`Failed to move ${fail} item(s)`);
    if (ok || fail) window.location.reload();
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    let ok = 0;
    let fail = 0;
    for (const item of selectedList) {
      const res = await deleteDriveFileAction(item.id);
      if (res.ok) ok++;
      else fail++;
    }
    setLoading(false);
    setDeleteOpen(false);
    clearSelection();
    if (ok) toast.success(`Deleted ${ok} item(s)`);
    if (fail) toast.error(`Failed to delete ${fail} item(s)`);
    if (ok || fail) window.location.reload();
  };

  return (
    <>
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl bg-brand/10 px-4 py-3 mb-4">
          <span className="body-2 font-medium text-light-100">{selected.size} selected</span>
          <Button type="button" size="sm" onClick={openMove} disabled={loading}>
            Move
          </Button>
          <Button type="button" size="sm" variant="outline" className="bg-red/10 text-red hover:bg-red/20" onClick={() => setDeleteOpen(true)} disabled={loading}>
            Delete
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {folders.length > 0 && (
        <section>
          <h2 className="h3 text-light-100 mb-3">Folders</h2>
          <div className="file-list">
            {folders.map((folder) => (
              <div key={folder.id} className="relative">
                <input
                  type="checkbox"
                  checked={selected.has(folder.id)}
                  onChange={(e) => { e.stopPropagation(); toggle(folder.id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-3 top-3 z-10 size-5 rounded border-light-300"
                />
                <div className={selected.has(folder.id) ? "ring-2 ring-brand rounded-[18px]" : ""}>
                  <FolderCard folder={folder} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6">
            <h2 className="h3 text-light-100">Files</h2>
            <FolderSortSelect folderId={currentFolderId} />
          </div>
          <div className="file-list mt-3">
            {files.map((file) => (
              <div key={file.$id} className="relative">
                <input
                  type="checkbox"
                  checked={selected.has(file.$id)}
                  onChange={(e) => { e.stopPropagation(); toggle(file.$id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-3 top-3 z-10 size-5 rounded border-light-300"
                />
                <div className={selected.has(file.$id) ? "ring-2 ring-brand rounded-[18px]" : ""}>
                  <Card file={file} />
                </div>
              </div>
            ))}
          </div>
          {nextPageToken && (
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </section>
      )}

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="shad-dialog button">
          <DialogHeader>
            <DialogTitle>Move {selected.size} item(s) to</DialogTitle>
          </DialogHeader>
          {loadingFolders ? (
            <p className="body-2 text-light-200">Loading folders…</p>
          ) : (
            <select
              className="w-full rounded-lg border border-light-300 px-3 py-2 body-2"
              value={moveTargetId}
              onChange={(e) => setMoveTargetId(e.target.value)}
            >
              <option value="root">My Drive (root)</option>
              {foldersForMove.filter((f) => f.id !== "root").map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkMove} disabled={loading || moveTargetId === currentFolderId}>
              {loading ? "..." : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="shad-dialog button">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} item(s)?</DialogTitle>
            <p className="body-2 text-light-200">They will be moved to trash.</p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button className="bg-red hover:bg-red/90" onClick={handleBulkDelete} disabled={loading}>
              {loading ? "..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
