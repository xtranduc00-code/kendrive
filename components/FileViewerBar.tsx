"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { isGoogleEditableType, getFileEditUrl } from "@/lib/utils";
import {
  shareDriveFileAction,
  shareWithAnyoneAction,
  getFilePermissionsAction,
} from "@/lib/actions/drive.actions";
import { toast } from "react-toastify";

type Props = {
  fileId: string;
  mimeType?: string;
  name?: string;
  editMode: boolean;
  backTo: string;
  fromParam?: string;
};

const driveFileUrl = (fileId: string) =>
  `https://drive.google.com/file/d/${fileId}/view`;

export function FileViewerBar({
  fileId,
  mimeType,
  name,
  editMode,
  backTo,
  fromParam,
}: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"reader" | "writer">("reader");
  const [generalAccess, setGeneralAccess] = useState<"restricted" | "anyone">(
    "restricted",
  );
  const [anyoneRole, setAnyoneRole] = useState<"reader" | "writer">("reader");
  const [linkCopied, setLinkCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const canEdit = isGoogleEditableType(mimeType);

  useEffect(() => {
    if (!shareOpen || !fileId) return;
    setPermissionsLoading(true);
    getFilePermissionsAction(fileId).then((data) => {
      setPermissionsLoading(false);
      if (data) {
        setGeneralAccess(data.generalAccess);
        setAnyoneRole(data.anyoneRole);
      }
    });
  }, [shareOpen, fileId]);
  const baseQuery = new URLSearchParams();
  if (mimeType) baseQuery.set("mime", mimeType);
  if (name) baseQuery.set("name", name);
  if (fromParam) baseQuery.set("from", fromParam);
  const viewUrl = `/file/${fileId}${baseQuery.toString() ? `?${baseQuery}` : ""}`;
  baseQuery.set("edit", "1");
  const editUrl = `/file/${fileId}?${baseQuery}`;

  const handleGeneralAccessChange = async (value: "restricted" | "anyone") => {
    setGeneralAccess(value);
    if (value === "anyone") {
      setLoading(true);
      const res = await shareWithAnyoneAction(fileId, anyoneRole);
      setLoading(false);
      if (res.ok) {
        toast.success(
          anyoneRole === "writer"
            ? "Anyone with the link can now edit"
            : "Anyone with the link can now view",
        );
      } else {
        toast.error(res.error ?? "Failed to update permission");
      }
    }
  };

  const handleAnyoneRoleChange = async (newRole: "reader" | "writer") => {
    setAnyoneRole(newRole);
    if (generalAccess !== "anyone") return;
    setLoading(true);
    const res = await shareWithAnyoneAction(fileId, newRole);
    setLoading(false);
    if (res.ok) {
      toast.success(
        newRole === "writer"
          ? "Permission updated to Editor"
          : "Permission updated to Viewer",
      );
    } else {
      toast.error(res.error ?? "Failed to update permission");
      setAnyoneRole(newRole === "writer" ? "reader" : "writer");
    }
  };

  const handleCopyLink = async () => {
    if (generalAccess === "restricted") {
      setLoading(true);
      const res = await shareWithAnyoneAction(fileId, anyoneRole);
      setLoading(false);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to set permission");
        return;
      }
      setGeneralAccess("anyone");
    }
    const link =
      anyoneRole === "writer" && isGoogleEditableType(mimeType)
        ? getFileEditUrl(fileId, mimeType)
        : driveFileUrl(fileId);
    await navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  const handleShareByEmail = async () => {
    if (!shareEmail.trim()) return;
    setLoading(true);
    const res = await shareDriveFileAction(
      fileId,
      shareEmail.trim(),
      shareRole,
    );
    setLoading(false);
    if (res.ok) {
      toast.success(`Shared — Invitation sent to ${shareEmail.trim()}`);
      setShareEmail("");
    } else {
      toast.error(`Share failed — ${res.error ?? "Something went wrong"}`);
    }
  };

  const displayName = name ? decodeURIComponent(name) : "File";

  return (
    <>
      <section className="file-viewer-bar flex w-full items-center gap-3">
        <Link
          href={backTo}
          title="Back to files"
          aria-label="Back to files"
          className="body-2 text-light-200 hover:text-brand shrink-0"
        >
          ← Back to files
        </Link>
        <span className="body-2 text-light-400 shrink-0">·</span>
        {name && (
          <span
            className="body-2 text-light-100 truncate min-w-0 flex-1"
            title={displayName}
          >
            {displayName}
          </span>
        )}
        <div className="ml-auto flex flex-shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="body-2"
          >
            Share
          </Button>
          {canEdit && (
            <>
              {editMode ? (
                <Link
                  href={viewUrl}
                  className="body-2 rounded-md border border-light-300 bg-white px-2.5 py-1 text-light-200 hover:bg-light-400/50 hover:text-light-100"
                >
                  View only
                </Link>
              ) : (
                <Link
                  href={editUrl}
                  className="body-2 rounded-md border border-brand bg-brand/10 px-2.5 py-1 text-brand hover:bg-brand/20"
                >
                  Edit
                </Link>
              )}
              <a
                href={getFileEditUrl(fileId, mimeType)}
                target="_blank"
                rel="noopener noreferrer"
                className="body-2 rounded-md border border-light-300 bg-white px-2.5 py-1 text-light-200 hover:bg-light-400/50 hover:text-light-100"
              >
                Open in new tab
              </a>
            </>
          )}
        </div>
      </section>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="shad-dialog button max-w-md">
          <DialogHeader>
            <DialogTitle className="text-light-100">
              Share &quot;{displayName}&quot;
            </DialogTitle>
            <div className="space-y-4 pt-2">
              <div>
                <p className="body-2 font-medium text-light-100 mb-1">
                  General access
                </p>
                {permissionsLoading ? (
                  <p className="body-2 text-light-200">Loading…</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        className="rounded-lg border border-light-300 px-3 py-2 body-2 flex-1 min-w-[180px]"
                        value={generalAccess}
                        onChange={(e) =>
                          handleGeneralAccessChange(
                            e.target.value as "restricted" | "anyone",
                          )
                        }
                        disabled={loading}
                      >
                        <option value="restricted">Restricted</option>
                        <option value="anyone">Anyone with the link</option>
                      </select>
                      {generalAccess === "anyone" && (
                        <select
                          className="rounded-lg border border-light-300 px-3 py-2 body-2"
                          value={anyoneRole}
                          onChange={(e) =>
                            handleAnyoneRoleChange(
                              e.target.value as "reader" | "writer",
                            )
                          }
                          disabled={loading}
                        >
                          <option value="reader">Viewer</option>
                          <option value="writer">Editor</option>
                        </select>
                      )}
                    </div>
                    {generalAccess === "anyone" && (
                      <p className="body-2 text-light-200 mt-1">
                        Anyone with the link can{" "}
                        {anyoneRole === "reader" ? "view" : "edit"}.
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
                  </>
                )}
              </div>
              <div className="border-t border-light-300 pt-4">
                <p className="body-2 font-medium text-light-100 mb-1">
                  Add people and groups
                </p>
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
                    onChange={(e) =>
                      setShareRole(e.target.value as "reader" | "writer")
                    }
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
            <Button onClick={() => setShareOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
