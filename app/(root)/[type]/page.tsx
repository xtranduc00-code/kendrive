import React from "react";
import Sort from "@/components/Sort";
import { getDriveFiles } from "@/lib/actions/drive.actions";
import Card from "@/components/Card";
import { getFileTypesParams } from "@/lib/utils";
import type { DriveFileDisplay } from "@/lib/google-drive";

const Page = async ({ searchParams, params }: SearchParamProps) => {
  const type = ((await params)?.type as string) || "";
  const searchText = ((await searchParams)?.query as string) || "";
  const sort = ((await searchParams)?.sort as string) || "";

  const types = getFileTypesParams(type) as FileType[];

  const filesRes = await getDriveFiles({ types, searchText, sort });
  const files = filesRes ?? { documents: [], total: 0 };

  return (
    <div className="page-container">
      <section className="w-full">
        <h1 className="h1 capitalize">{type}</h1>

        <div className="total-size-section">
          <p className="body-1">
            Total: <span className="h5">{files.total} files</span>
          </p>

          <div className="sort-container">
            <p className="body-1 hidden text-light-200 sm:block">Sort by:</p>

            <Sort />
          </div>
        </div>
      </section>

      {files.documents.length > 0 ? (
        <section className="file-list">
          {files.documents.map((file: DriveFileDisplay) => (
            <Card key={file.$id} file={file} />
          ))}
        </section>
      ) : (
        <p className="empty-list">No files in Drive</p>
      )}
    </div>
  );
};

export default Page;
