"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { moveDriveFileAction, deleteDriveFileAction, getDriveFoldersAction, getDriveStarredAction } from "@/lib/actions/drive.actions";
import { toast } from "react-toastify";
import Card from "@/components/Card";
import FolderCard from "@/components/FolderCard";
import StarredSortSelect from "@/components/StarredSortSelect";
import type { DriveFileDisplay } from "@/lib/google-drive";
import type { DriveFolder } from "@/lib/google-drive";

type Props = {
  initialFolders: DriveFolder[];
  initialFiles: DriveFileDisplay[];
  initialNextPageToken?: string;
  sort: string;
};

type SelectedItem = { id: string; name: string; type: "file" | "folder" };

export default function StarredFileList({
  initialFolders,
  initialFiles,
  initialNextPageToken,
  sort,
}: Props) {
  const router = useRouter();
  const [folders, setFolders] = useState<DriveFolder[]>(initialFolders);
  const [files, setFiles] = useState<DriveFileDisplay[]>(initialFiles);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(initialNextPageToken);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("file-view-mode");
      if (saved === "list" || saved === "grid") setViewMode(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setFolders(initialFolders);
    setFiles(initialFiles);
    setNextPageToken(initialNextPageToken ?? undefined);
  }, [initialFolders, initialFiles, initialNextPageToken]);

  const setViewModeAndSave = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem("file-view-mode", mode);
    } catch {
      /* ignore */
    }
  };

  const loadMore = async () => {
    if (!nextPageToken || loadingMore) return;
    setLoadingMore(true);
    const res = await getDriveStarredAction({ sort, limit: 24, pageToken: nextPageToken });
    const data = res as { folders?: DriveFolder[]; files?: DriveFileDisplay[]; nextPageToken?: string };
    setFolders((prev) => [...prev, ...(data.folders ?? [])]);
    setFiles((prev) => [...prev, ...(data.files ?? [])]);
    setNextPageToken(data.nextPageToken);
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
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const allIds = [...folders.map((f) => f.id), ...files.map((f) => f.$id)];
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const selectAll = () => setSelected(new Set(allIds));
  const toggleSelectAll = () => (allSelected ? clearSelection() : selectAll());

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
    if (!moveTargetId) {
      setMoveOpen(false);
      return;
    }
    setLoading(true);
    let ok = 0;
    let fail = 0;
    for (const item of selectedList) {
      const parentId =
        item.type === "file"
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
    if (ok || fail) router.refresh();
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
    if (ok || fail) router.refresh();
  };

  return (
    <>
      {(folders.length > 0 || files.length > 0) && !selectMode && (
        <div className="mb-4">
          <Button type="button" size="sm" variant="outline" onClick={() => setSelectMode(true)}>
            Select
          </Button>
        </div>
      )}

      {selectMode && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl bg-brand/10 px-4 py-3 mb-4">
          <label className="flex cursor-pointer items-center gap-2 body-2 font-medium text-light-100">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="size-5 rounded border-light-300"
            />
            Select all
          </label>
          <span className="body-2 text-light-200">
            {selected.size > 0 ? `${selected.size} selected` : "Select items"}
          </span>
          {selected.size > 0 && (
            <>
              <Button type="button" size="sm" onClick={openMove} disabled={loading}>
                Move
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-red/10 text-red hover:bg-red/20"
                onClick={() => setDeleteOpen(true)}
                disabled={loading}
              >
                Delete
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={clearSelection}>
                Clear
              </Button>
            </>
          )}
          <Button type="button" size="sm" variant="outline" onClick={exitSelectMode}>
            Done
          </Button>
        </div>
      )}

      {folders.length > 0 && (
        <section>
          <h2 className="h3 text-light-100 mb-3">Folders</h2>
          <div className="file-list">
            {folders.map((folder) => (
              <div key={folder.id} className="relative">
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selected.has(folder.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggle(folder.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-3 top-3 z-10 size-5 rounded border-light-300 cursor-pointer"
                  />
                )}
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-lg border border-light-300 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewModeAndSave("grid")}
                  className={`rounded-md px-3 py-1.5 body-2 transition-colors ${viewMode === "grid" ? "bg-brand text-white" : "text-light-200 hover:bg-light-400/50"}`}
                  title="Grid view"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewModeAndSave("list")}
                  className={`rounded-md px-3 py-1.5 body-2 transition-colors ${viewMode === "list" ? "bg-brand text-white" : "text-light-200 hover:bg-light-400/50"}`}
                  title="List view"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
              <StarredSortSelect />
            </div>
          </div>
          <div className={viewMode === "list" ? "file-list file-list--list mt-3" : "file-list mt-3"}>
            {files.map((file) => (
              <div key={file.$id} className="relative">
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selected.has(file.$id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggle(file.$id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-3 top-3 z-10 size-5 rounded border-light-300 cursor-pointer"
                  />
                )}
                <div className={selected.has(file.$id) ? "ring-2 ring-brand rounded-[18px]" : ""}>
                  <Card file={file} layout={viewMode} />
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
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkMove} disabled={loading}>
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
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red hover:bg-red/90" onClick={handleBulkDelete} disabled={loading}>
              {loading ? "..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
