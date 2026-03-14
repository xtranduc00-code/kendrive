"use client";

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
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDetails } from "@/components/ActionsModalContent";
import {
  deleteDriveFileAction,
  renameDriveFileAction,
  moveDriveFileAction,
  getDriveFoldersAction,
  shareDriveFileAction,
  shareWithAnyoneAction,
} from "@/lib/actions/drive.actions";
import type { DriveFileDisplay, DriveFolder } from "@/lib/google-drive";
import { isPreviewableInApp } from "@/lib/utils";
import { toast } from "react-toastify";

const driveActions = [
  { label: "Details", icon: "/assets/icons/info.svg", value: "details" },
  { label: "Rename", icon: "/assets/icons/edit.svg", value: "rename" },
  { label: "Move to folder", icon: "/assets/icons/documents.svg", value: "move" },
  { label: "Share", icon: "/assets/icons/share.svg", value: "share" },
  { label: "Download", icon: "/assets/icons/download.svg", value: "download" },
  { label: "Delete", icon: "/assets/icons/delete.svg", value: "delete" },
  { label: "Open", icon: "/assets/icons/share.svg", value: "open" },
];

const ActionDropdown = ({ file }: { file: DriveFileDisplay }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [action, setAction] = useState<ActionType | null>(null);
  const [name, setName] = useState(file.name);
  const [moveFolderId, setMoveFolderId] = useState<string>("");
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"reader" | "writer">("reader");
  const [generalAccess, setGeneralAccess] = useState<"restricted" | "anyone">("restricted");
  const [anyoneRole, setAnyoneRole] = useState<"reader" | "writer">("reader");
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(file.name);
  }, [file.name]);

  const loadFolders = async () => {
    const list = await getDriveFoldersAction();
    setFolders(list || []);
    if (list?.length && !moveFolderId) setMoveFolderId(list[0].id);
  };

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsDropdownOpen(false);
    setAction(null);
  };

  const downloadUrl = file.webContentLink || file.url;
  const currentParent = file.parents?.[0] ?? "root";
  const openInApp = isPreviewableInApp(file.mimeType);
  const openUrl = openInApp
    ? `/file/${file.$id}?mime=${encodeURIComponent(file.mimeType || "")}&name=${encodeURIComponent(file.name)}&from=${encodeURIComponent(pathname || "/folders")}`
    : file.url;

  const handleRename = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const res = await renameDriveFileAction(file.$id, name.trim());
    setLoading(false);
    if (res.ok) {
      toast.success(`Renamed — File is now "${name.trim()}"`);
      closeAllModals();
    } else {
      toast.error(`Rename failed — ${res.error ?? "Something went wrong"}`);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await deleteDriveFileAction(file.$id);
    setLoading(false);
    if (res.ok) {
      toast.success(`Deleted — "${file.name}" moved to trash`);
      closeAllModals();
      router.refresh();
    } else {
      toast.error(`Delete failed — ${res.error ?? "Something went wrong"}`);
    }
  };

  const handleMove = async () => {
    if (!moveFolderId || moveFolderId === currentParent) {
      closeAllModals();
      return;
    }
    setLoading(true);
    const res = await moveDriveFileAction(file.$id, moveFolderId, currentParent);
    setLoading(false);
    if (res.ok) {
      toast.success(`Moved — "${file.name}" moved to selected folder`);
      closeAllModals();
      router.refresh();
    } else {
      toast.error(`Move failed — ${res.error ?? "Something went wrong"}`);
    }
  };

  const handleShareByEmail = async () => {
    if (!shareEmail.trim()) return;
    setLoading(true);
    const res = await shareDriveFileAction(file.$id, shareEmail.trim(), shareRole);
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
      await shareWithAnyoneAction(file.$id, anyoneRole);
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (generalAccess === "restricted") {
      setLoading(true);
      const res = await shareWithAnyoneAction(file.$id, anyoneRole);
      setLoading(false);
      if (!res.ok) return;
      setGeneralAccess("anyone");
    }
    await navigator.clipboard.writeText(file.url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger className="shad-no-focus">
          <Image src="/assets/icons/dots.svg" alt="dots" width={34} height={34} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-[200px] truncate">
            {file.name}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {driveActions.map((actionItem) => (
            <DropdownMenuItem
              key={actionItem.value}
              className="shad-dropdown-item"
              onClick={() => {
                setAction(actionItem);
                if (actionItem.value === "details") setIsModalOpen(true);
                if (actionItem.value === "rename") setIsModalOpen(true);
                if (actionItem.value === "delete") setIsModalOpen(true);
                if (actionItem.value === "move") {
                  loadFolders();
                  setMoveFolderId("root");
                  setIsModalOpen(true);
                }
                if (actionItem.value === "share") setIsModalOpen(true);
              }}
            >
              {actionItem.value === "download" ? (
                <Link
                  href={downloadUrl}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Image src={actionItem.icon} alt={actionItem.label} width={30} height={30} />
                  {actionItem.label}
                </Link>
              ) : actionItem.value === "open" ? (
                <Link
                  href={openUrl}
                  target={openInApp ? undefined : "_blank"}
                  rel={openInApp ? undefined : "noopener noreferrer"}
                  className="flex items-center gap-2"
                >
                  <Image src={actionItem.icon} alt={actionItem.label} width={30} height={30} />
                  {actionItem.label}
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Image src={actionItem.icon} alt={actionItem.label} width={30} height={30} />
                  {actionItem.label}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {action?.value === "details" && (
        <DialogContent className="shad-dialog button">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">{action.label}</DialogTitle>
            <FileDetails file={file} />
          </DialogHeader>
        </DialogContent>
      )}

      {action?.value === "rename" && (
        <DialogContent className="shad-dialog button">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">Rename</DialogTitle>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              placeholder="File name"
            />
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeAllModals} variant="outline">Cancel</Button>
            <Button onClick={handleRename} disabled={loading || !name.trim()}>
              {loading ? "..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}

      {action?.value === "move" && (
        <DialogContent className="shad-dialog button">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">Move to folder</DialogTitle>
            <p className="body-2 text-light-200">Choose destination folder:</p>
            <select
              className="mt-2 w-full rounded-lg border border-light-300 px-3 py-2"
              value={moveFolderId}
              onChange={(e) => setMoveFolderId(e.target.value)}
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeAllModals} variant="outline">Cancel</Button>
            <Button onClick={handleMove} disabled={loading || moveFolderId === currentParent}>
              {loading ? "..." : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}

      {action?.value === "share" && (
        <DialogContent className="shad-dialog button max-w-md">
          <DialogHeader>
            <DialogTitle className="text-light-100">Share &quot;{file.name}&quot;</DialogTitle>

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
            <Button onClick={closeAllModals}>Done</Button>
          </DialogFooter>
        </DialogContent>
      )}

      {action?.value === "delete" && (
        <DialogContent className="shad-dialog button">
          <DialogHeader>
            <DialogTitle className="text-center text-light-100">Delete file</DialogTitle>
            <p className="body-2 text-light-200 text-center mt-2">
              Delete &quot;{file.name}&quot;? The file will be moved to Drive trash.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeAllModals} variant="outline">Cancel</Button>
            <Button onClick={handleDelete} disabled={loading} className="bg-red hover:bg-red/90">
              {loading ? "..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};
export default ActionDropdown;
