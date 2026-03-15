"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Search from "@/components/Search";
import { signOut } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseGoogleDriveUrl } from "@/lib/utils";
import { toast } from "react-toastify";

const STORAGE_KEY = "header-collapsed";

const Header = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [openLinkOpen, setOpenLinkOpen] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const router = useRouter();

  const handleOpenLink = () => {
    const parsed = parseGoogleDriveUrl(linkInput);
    if (!parsed) {
      toast.error("Invalid link. Paste a Google Drive or Docs/Sheets/Slides link.");
      return;
    }
    setOpenLinkOpen(false);
    setLinkInput("");
    const q = new URLSearchParams();
    if (parsed.mimeType) q.set("mime", parsed.mimeType);
    router.push(`/file/${parsed.fileId}${q.toString() ? `?${q}` : ""}`);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <header className={collapsed ? "header header--collapsed" : "header"}>
      {!collapsed && <Search />}
      <div className="header-wrapper">
        {!collapsed && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setOpenLinkOpen(true)}
                >
                  Open link
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Paste a Drive/Docs link to open in app</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggle}
                className="shrink-0"
                aria-label={collapsed ? "Expand header" : "Collapse header"}
              >
                <svg
                  className="h-5 w-5 text-light-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Collapse header</TooltipContent>
          </Tooltip>
            </>
        )}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggle}
                className="shrink-0"
                aria-label="Expand header"
              >
                <svg
                  className="h-5 w-5 text-light-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Expand header</TooltipContent>
          </Tooltip>
        )}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setOpenLinkOpen(true)}
                aria-label="Open link"
              >
                <svg className="h-5 w-5 text-light-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Open by link</TooltipContent>
          </Tooltip>
        )}
        <Button
          type="button"
          className="sign-out-button"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
        >
          <Image
            src="/assets/icons/logout.svg"
            alt="Sign out"
            width={24}
            height={24}
            className="w-6"
          />
        </Button>
      </div>

      <Dialog open={openLinkOpen} onOpenChange={setOpenLinkOpen}>
        <DialogContent className="shad-dialog max-w-md">
          <DialogHeader>
            <DialogTitle className="text-light-100">Open file by link</DialogTitle>
          </DialogHeader>
          <p className="body-2 text-light-200">
            Paste a Google Drive, Docs, Sheets or Slides link to open the file in the app.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="https://drive.google.com/... or https://docs.google.com/..."
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenLink()}
              className="flex-1 min-w-0"
            />
            <Button type="button" size="sm" onClick={handleOpenLink}>
              Open
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};
export default Header;
