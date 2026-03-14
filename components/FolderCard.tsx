"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteDriveFileAction,
  renameDriveFileAction,
  shareDriveFileAction,
  shareWithAnyoneAction,
} from "@/lib/actions/drive.actions";
import type { DriveFolder } from "@/lib/google-drive";
import { FOLDER_ICON_OPTIONS } from "@/constants";
import { toast } from "react-toastify";

const FOLDER_ICON = "/assets/icons/documents.svg";
const STORAGE_KEY = (id: string) => `folder-icon-${id}`;
const DRIVE_FOLDER_URL = (id: string) => `https://drive.google.com/drive/folders/${id}`;
const APP_FOLDER_URL = (id: string) => `/folder/${id}`;

const actions = [
  { label: "Rename", icon: "/assets/icons/edit.svg", value: "rename" },
  { label: "Share", icon: "/assets/icons/share.svg", value: "share" },
  { label: "Delete", icon: "/assets/icons/delete.svg", value: "delete" },
  { label: "Open in Drive", icon: "/assets/icons/share.svg", value: "open" },
];

export default function FolderCard({ folder }: { folder: DriveFolder }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(folder.name);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"reader" | "writer">("reader");
  const [generalAccess, setGeneralAccess] = useState<"restricted" | "anyone">("restricted");
  const [anyoneRole, setAnyoneRole] = useState<"reader" | "writer">("reader");
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>(FOLDER_ICON);
  useEffect(() => {
    setName(folder.name);
  }, [folder.name]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY(folder.id)) : null;
    if (saved && FOLDER_ICON_OPTIONS.some((o) => o.path === saved)) setSelectedIcon(saved);
  }, [folder.id]);

  const closeAll = () => {
    setIsModalOpen(false);
    setAction(null);
  };

  const handleRename = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const res = await renameDriveFileAction(folder.id, name.trim());
    setLoading(false);
    if (res.ok) {
      toast.success(`Renamed — Folder is now "${name.trim()}"`);
      closeAll();
    } else {
      toast.error(`Rename failed — ${res.error ?? "Something went wrong"}`);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteDriveFileAction(folder.id);
    setLoading(false);
    if (res.ok) {
      toast.error(`Deleted — "${folder.name}" moved to trash`);
      closeAll();
    } else {
      toast.error(`Delete failed — ${res.error ?? "Something went wrong"}`);
    }
  };

  const handleShareByEmail = async () => {
    if (!shareEmail.trim()) return;
    setLoading(true);
    const res = await shareDriveFileAction(folder.id, shareEmail.trim(), shareRole);
    setLoading(false);
    if (res.ok) {
      toast.success(`Shared — Invitation sent to ${shareEmail.trim()}`);
      setShareEmail("");
    } else {
      toast.error(`Share failed — ${res.error ?? "Something went wrong"}`);
    }
  };

  const handleGeneralAccessChange = async (value: "restricted" | "anyone") => {
    setGeneralAccess(value);
    if (value === "anyone") {
      setLoading(true);
      await shareWithAnyoneAction(folder.id, anyoneRole);
      setLoading(false);
    }
  };

  const folderLink = DRIVE_FOLDER_URL(folder.id);
  const handleCopyLink = async () => {
    if (generalAccess === "restricted") {
      setLoading(true);
      const res = await shareWithAnyoneAction(folder.id, anyoneRole);
      setLoading(false);
      if (!res.ok) return;
      setGeneralAccess("anyone");
    }
    await navigator.clipboard.writeText(folderLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      <div className="file-card flex flex-col gap-6 rounded-[18px] bg-white p-5 shadow-sm transition-all hover:shadow-drop-3">
        <div className="flex justify-between items-start">
          <Link
            href={APP_FOLDER_URL(folder.id)}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIconPickerOpen(true);
              }}
              className="thumbnail folder-card-icon flex-center size-[50px] min-w-[50px] overflow-hidden rounded-full bg-brand/10 hover:bg-brand/20 transition-colors cursor-pointer"
              title="Change icon"
            >
              <Image
                src={selectedIcon}
                alt="Folder"
                width={28}
                height={28}
              />
            </button>
            <p className="subtitle-2 line-clamp-1 text-light-100">{folder.name}</p>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="shad-no-focus">
              <Image src="/assets/icons/dots.svg" alt="Menu" width={34} height={34} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel className="max-w-[200px] truncate">
                {folder.name}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {actions.map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  className="shad-dropdown-item"
                  onClick={() => {
                    setAction(item);
                    if (item.value === "open") {
                      window.open(DRIVE_FOLDER_URL(folder.id), "_blank");
                      return;
                    }
                    setIsModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Image src={item.icon} alt={item.label} width={30} height={30} />
                    {item.label}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {action?.value === "rename" && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="shad-dialog button">
            <DialogHeader>
              <DialogTitle className="text-center text-light-100">Rename folder</DialogTitle>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                placeholder="Folder name"
              />
            </DialogHeader>
            <DialogFooter>
              <Button onClick={closeAll} variant="outline">Cancel</Button>
              <Button onClick={handleRename} disabled={loading || !name.trim()}>
                {loading ? "..." : "Rename"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {action?.value === "share" && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="shad-dialog button max-w-md">
            <DialogHeader>
              <DialogTitle className="text-light-100">Share &quot;{folder.name}&quot;</DialogTitle>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="body-2 font-medium text-light-100 mb-1">General access</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      className="rounded-lg border border-light-300 px-3 py-2 body-2 flex-1 min-w-[180px]"
                      value={generalAccess}
                      onChange={(e) => handleGeneralAccessChange(e.target.value as "restricted" | "anyone")}
                      disabled={loading}
                    >
                      <option value="restricted">Restricted</option>
                      <option value="anyone">Anyone with the link</option>
                    </select>
                    {generalAccess === "anyone" && (
                      <select
                        className="rounded-lg border border-light-300 px-3 py-2 body-2"
                        value={anyoneRole}
                        onChange={(e) => setAnyoneRole(e.target.value as "reader" | "writer")}
                        disabled={loading}
                      >
                        <option value="reader">Viewer</option>
                        <option value="writer">Editor</option>
                      </select>
                    )}
                  </div>
                  {generalAccess === "anyone" && (
                    <p className="body-2 text-light-200 mt-1">
                      Anyone on the internet with the link can {anyoneRole === "reader" ? "view" : "edit"}.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleCopyLink}
                    disabled={loading}
                  >
                    {linkCopied ? "Link copied!" : "Copy link"}
                  </Button>
                </div>
                <div className="border-t border-light-300 pt-4">
                  <p className="body-2 font-medium text-light-100 mb-1">Add people and groups</p>
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="Add people by email"
                      className="flex-1 min-w-[160px]"
                    />
                    <select
                      className="rounded-lg border border-light-300 px-3 py-2 body-2 w-[100px]"
                      value={shareRole}
                      onChange={(e) => setShareRole(e.target.value as "reader" | "writer")}
                    >
                      <option value="reader">Viewer</option>
                      <option value="writer">Editor</option>
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleShareByEmail}
                      disabled={loading || !shareEmail.trim()}
                    >
                      {loading ? "..." : "Send"}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={closeAll}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {action?.value === "delete" && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="shad-dialog button">
            <DialogHeader>
              <DialogTitle className="text-center text-light-100">Delete folder</DialogTitle>
              <p className="body-2 text-light-200 text-center mt-2">
                Delete &quot;{folder.name}&quot;? The folder will be moved to Drive trash. Files inside remain in Drive.
              </p>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={closeAll} variant="outline">Cancel</Button>
              <Button onClick={handleDelete} disabled={loading} className="bg-red hover:bg-red/90">
                {loading ? "..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
        <DialogContent className="shad-dialog button max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">Choose icon</DialogTitle>
            <p className="body-2 text-light-200 text-center">Click an icon to use for this folder</p>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-2">
            {FOLDER_ICON_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  localStorage.setItem(STORAGE_KEY(folder.id), opt.path);
                  setSelectedIcon(opt.path);
                  setIconPickerOpen(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 transition-all hover:bg-light-400 ${
                  selectedIcon === opt.path ? "border-brand bg-brand/10" : "border-light-300"
                }`}
                title={opt.label}
              >
                <div className="folder-card-icon flex-center size-10">
                  <Image src={opt.path} alt={opt.label} width={24} height={24} />
                </div>
                <span className="caption text-light-200">{opt.label}</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIconPickerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
