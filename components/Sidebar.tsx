"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { navItems } from "@/constants";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

interface Props {
  fullName: string;
  avatar: string;
  email: string;
}

const Sidebar = ({ fullName, avatar, email }: Props) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <aside className={cn("sidebar", collapsed && "sidebar--collapsed")}>
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo">
          <Image
            src="/assets/icons/logo-full-brand.svg"
            alt="StoreIt"
            width={160}
            height={50}
            className="sidebar-logo-full"
          />
          <Image
            src="/assets/icons/logo-brand.svg"
            alt="StoreIt"
            width={52}
            height={52}
            className="sidebar-logo-icon"
          />
        </Link>
        <button
          type="button"
          onClick={toggle}
          className="sidebar-toggle"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="sidebar-toggle-icon" aria-hidden>
            {collapsed ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            )}
          </span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul className="flex flex-1 flex-col gap-6">
          {navItems.map(({ url, name, icon }) => (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <Link href={url} className="lg:w-full">
                  <li
                    className={cn(
                      "sidebar-nav-item",
                      pathname === url && "shad-active",
                    )}
                  >
                    <span className={cn("sidebar-nav-icon-wrap", pathname === url && "sidebar-nav-icon-wrap--active")}>
                      <Image
                        src={icon}
                        alt=""
                        width={28}
                        height={28}
                        className="sidebar-nav-icon"
                      />
                    </span>
                    <p className="sidebar-nav-label">{name}</p>
                  </li>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {name}
              </TooltipContent>
            </Tooltip>
          ))}
        </ul>
      </nav>

      <div className="sidebar-illustration">
        <Image
          src="/assets/images/files-2.png"
          alt=""
          width={506}
          height={418}
          className="w-full"
        />
      </div>

      <div className="sidebar-user-info">
        <Image
          src={avatar}
          alt="Avatar"
          width={44}
          height={44}
          className="sidebar-user-avatar"
        />
        <div className="sidebar-user-text">
          <p className="subtitle-2 capitalize">{fullName}</p>
          <p className="caption">{email}</p>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
