"use client";

import React, { useEffect, useState } from "react";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getDriveFiles } from "@/lib/actions/drive.actions";
import Thumbnail from "@/components/Thumbnail";
import FormattedDateTime from "@/components/FormattedDateTime";
import { useDebounce } from "use-debounce";
import type { DriveFileDisplay } from "@/lib/google-drive";

const Search = () => {
  const [query, setQuery] = useState("");
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const [results, setResults] = useState<DriveFileDisplay[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const [debouncedQuery] = useDebounce(query, 300);

  useEffect(() => {
    const fetchFiles = async () => {
      if (debouncedQuery.length === 0) {
        setResults([]);
        setOpen(false);
        return router.push(path.replace(searchParams.toString(), ""));
      }

      const res = await getDriveFiles({ types: [], searchText: debouncedQuery });
      setResults(res?.documents ?? []);
      setOpen(true);
    };

    fetchFiles();
  }, [debouncedQuery]);

  useEffect(() => {
    if (!searchQuery) {
      setQuery("");
    }
  }, [searchQuery]);

  const handleOpenFile = (e: React.MouseEvent, file: DriveFileDisplay) => {
    e.stopPropagation();
    setOpen(false);
    setResults([]);
    window.open(file.url, "_blank");
  };

  const handleGoToFolder = (e: React.MouseEvent, file: DriveFileDisplay) => {
    e.stopPropagation();
    setOpen(false);
    setResults([]);
    const parentId = file.parents?.[0] ?? "root";
    if (parentId === "root") router.push("/folders");
    else router.push(`/folder/${parentId}`);
  };

  return (
    <div className="search">
      <div className="search-input-wrapper">
        <Image
          src="/assets/icons/search.svg"
          alt="Search"
          width={24}
          height={24}
        />
        <Input
          value={query}
          placeholder="Search..."
          className="search-input"
          onChange={(e) => setQuery(e.target.value)}
        />

        {open && (
          <ul className="search-result">
            {results.length > 0 ? (
              results.map((file) => (
                <li
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-light-400/60"
                  key={file.$id}
                  onClick={() => window.open(file.url, "_blank")}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <Thumbnail
                      type={file.type}
                      extension={file.extension}
                      url={file.url}
                      className="size-9 min-w-9"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="subtitle-2 line-clamp-1 text-light-100">
                        {file.name}
                      </p>
                      <FormattedDateTime
                        date={file.$createdAt}
                        className="caption text-light-200"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleGoToFolder(e, file)}
                    className="shrink-0 rounded p-1.5 text-light-200 hover:bg-brand/10 hover:text-brand"
                    title="Go to folder"
                  >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </button>
                </li>
              ))
            ) : (
              <p className="empty-result">No files found</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Search;
