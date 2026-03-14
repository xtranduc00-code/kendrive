"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Search from "@/components/Search";
import { signOut } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const STORAGE_KEY = "header-collapsed";

const Header = () => {
  const [collapsed, setCollapsed] = useState(false);

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
    </header>
  );
};
export default Header;
