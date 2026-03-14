import { getFileType } from "@/lib/utils";

const DRIVE_API = "https://www.googleapis.com/drive/v3";

export type DriveFileType = "document" | "image" | "video" | "audio" | "other";

/** Map Google Drive MIME type to our FileType */
export function mimeToFileType(mimeType: string): DriveFileType {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  const docMimes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument",
    "application/msword",
    "text/",
    "application/vnd.ms-",
    "application/vnd.oasis",
    "application/vnd.google-apps",
  ];
  if (docMimes.some((m) => mimeType.startsWith(m))) return "document";
  return "other";
}

/** Shape compatible with existing UI (Card, Thumbnail, etc.) */
export interface DriveFileDisplay {
  $id: string;
  name: string;
  type: DriveFileType;
  extension: string;
  size: number;
  mimeType?: string;
  url: string;
  $createdAt: string;
  $updatedAt?: string;
  owner: { fullName: string };
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  parents?: string[];
}

interface DriveFileResource {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  owners?: { displayName?: string }[];
  parents?: string[];
}

export function mapDriveFileToDisplay(f: DriveFileResource): DriveFileDisplay {
  const type = mimeToFileType(f.mimeType || "");
  const ext = f.name.includes(".") ? f.name.split(".").pop()!.toLowerCase() : "";
  return {
    $id: f.id,
    name: f.name,
    type,
    extension: ext,
    size: parseInt(f.size || "0", 10),
    mimeType: f.mimeType,
    url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    $createdAt: f.createdTime || f.modifiedTime || new Date().toISOString(),
    $updatedAt: f.modifiedTime,
    owner: { fullName: f.owners?.[0]?.displayName || "Me" },
    webContentLink: f.webContentLink,
    iconLink: f.iconLink,
    thumbnailLink: f.thumbnailLink,
    parents: f.parents,
  };
}

/** Build Drive API q (query) for list: not trashed, optional mime filters and name contains */
export function buildDriveQuery(options: {
  types?: DriveFileType[];
  searchText?: string;
}): string {
  const parts: string[] = ["trashed = false"];
  if (options.types && options.types.length > 0) {
    const mimeConditions = options.types.map((t) => {
      switch (t) {
        case "image":
          return "mimeType contains 'image/'";
        case "video":
          return "mimeType contains 'video/'";
        case "audio":
          return "mimeType contains 'audio/'";
        case "document":
          return "(mimeType = 'application/pdf' or mimeType contains 'application/vnd.' or mimeType contains 'text/' or mimeType contains 'application/msword')";
        default:
          return "mimeType not in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation') and mimeType not contains 'image/' and mimeType not contains 'video/' and mimeType not contains 'audio/'";
      }
    });
    parts.push(`(${mimeConditions.join(" or ")})`);
  }
  if (options.searchText?.trim()) {
    parts.push(`name contains '${options.searchText.trim().replace(/'/g, "\\'")}'`);
  }
  return parts.join(" and ");
}

/** OrderBy for Drive API */
export function driveOrderBy(sort: string): string {
  const [sortBy, order] = (sort || "$createdAt-desc").split("-");
  const dir = order === "asc" ? "asc" : "desc";
  if (sortBy === "name") return `name ${dir}`;
  if (sortBy === "size") return `quotaBytesUsed ${dir}`;
  return `createdTime ${dir}`;
}

export async function fetchDriveFiles(
  accessToken: string,
  options: {
    types?: DriveFileType[];
    searchText?: string;
    sort?: string;
    limit?: number;
    pageToken?: string;
    parentId?: string;
  }
): Promise<{ files: DriveFileDisplay[]; nextPageToken?: string }> {
  const q = buildDriveQuery({ types: options.types, searchText: options.searchText });
  const orderBy = driveOrderBy(options.sort || "");
  const pageSize = Math.min(options.limit || 50, 100);
  const partsQuery = options.parentId
    ? [q, `'${options.parentId}' in parents`]
    : [q];
  const qFinal = partsQuery.join(" and ");
  const params = new URLSearchParams({
    q: qFinal,
    orderBy,
    pageSize: String(pageSize),
    fields: "nextPageToken,files(id,name,mimeType,size,webViewLink,webContentLink,iconLink,thumbnailLink,createdTime,modifiedTime,owners,parents)",
  });
  if (options.pageToken) params.set("pageToken", options.pageToken);

  const res = await fetch(`${DRIVE_API}/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive API error: ${res.status} ${err}`);
  }
  const data = await res.json();
  const files = (data.files || []).map(mapDriveFileToDisplay);
  return { files, nextPageToken: data.nextPageToken };
}

export interface DriveStorageQuota {
  limit: number;
  usage: number;
  usageInDrive: number;
}

export async function fetchDriveQuota(accessToken: string): Promise<DriveStorageQuota> {
  const res = await fetch(`${DRIVE_API}/about?fields=storageQuota`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Drive about error: ${res.status}`);
  const data = await res.json();
  const q = data.storageQuota || {};
  return {
    limit: parseInt(q.limit || "0", 10),
    usage: parseInt(q.usage || "0", 10),
    usageInDrive: parseInt(q.usageInDrive || "0", 10),
  };
}

const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

/** List folders (for move picker). parentId = folder id or "root" for My Drive root. */
export async function fetchDriveFolders(
  accessToken: string,
  parentId: string = "root"
): Promise<DriveFolder[]> {
  const q = "mimeType = 'application/vnd.google-apps.folder' and trashed = false and '" + parentId + "' in parents";
  const params = new URLSearchParams({
    q,
    pageSize: "100",
    fields: "files(id,name,parents)",
  });
  const res = await fetch(`${DRIVE_API}/files?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive folders: ${res.status} ${err}`);
  }
  const data = await res.json();
  return (data.files || []).map((f: { id: string; name: string; parents?: string[] }) => ({
    id: f.id,
    name: f.name,
    parents: f.parents,
  }));
}

/** Upload file to Drive. parentId = folder id or omit for root. */
export async function uploadDriveFile(
  accessToken: string,
  file: File | Blob & { name?: string },
  parentId?: string
): Promise<DriveFileDisplay> {
  const fileName = "name" in file ? file.name : "upload";
  const metadata: { name: string; parents?: string[] } = { name: fileName };
  if (parentId) metadata.parents = [parentId];
  const boundary = "-------" + Math.random().toString(36).slice(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;
  const metaPart = delimiter + "Content-Type: application/json; charset=UTF-8\r\n\r\n" + JSON.stringify(metadata);
  const mime = "type" in file && file.type ? file.type : "application/octet-stream";
  const filePart = delimiter + "Content-Type: " + mime + "\r\n\r\n";
  const buf = await ("arrayBuffer" in file ? file.arrayBuffer() : (file as Blob).arrayBuffer());
  const body = new Blob([metaPart, filePart, new Uint8Array(buf), closeDelim]);
  const res = await fetch(`${DRIVE_UPLOAD_API}/files?uploadType=multipart`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload: ${res.status} ${err}`);
  }
  const data = await res.json();
  return mapDriveFileToDisplay(data);
}

/** Delete file (or trash). */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Drive delete: ${res.status} ${err}`);
  }
}

/** Rename file. */
export async function renameDriveFile(accessToken: string, fileId: string, name: string): Promise<void> {
  const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive rename: ${res.status} ${err}`);
  }
}

/** Move file to folder. removeParents = current parent id(s), addParents = target folder id. */
export async function moveDriveFile(
  accessToken: string,
  fileId: string,
  addParents: string,
  removeParents: string
): Promise<void> {
  const params = new URLSearchParams({ addParents, removeParents });
  const res = await fetch(`${DRIVE_API}/files/${fileId}?${params}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive move: ${res.status} ${err}`);
  }
}

/** Get file/folder metadata (name, parents for breadcrumb). */
export async function fetchDriveFileMetadata(
  accessToken: string,
  fileId: string
): Promise<{ id: string; name: string; parents?: string[] }> {
  const res = await fetch(
    `${DRIVE_API}/files/${fileId}?fields=id,name,parents`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive get file: ${res.status} ${err}`);
  }
  const data = await res.json();
  return { id: data.id, name: data.name, parents: data.parents };
}

/** Create new folder. parentId defaults to "root". */
export async function createDriveFolder(
  accessToken: string,
  name: string,
  parentId: string = "root"
): Promise<DriveFolder> {
  const res = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive create folder: ${res.status} ${err}`);
  }
  const data = await res.json();
  return { id: data.id, name: data.name, parents: data.parents };
}

/** Share file/folder: add permission (user by email or anyone with the link). */
export async function createDrivePermission(
  accessToken: string,
  fileId: string,
  options: (
    | {
        role: "reader" | "writer";
        type: "user";
        emailAddress: string;
        sendNotificationEmail?: boolean;
      }
    | {
        role: "reader" | "writer";
        type: "anyone";
      }
  )
): Promise<void> {
  const body: Record<string, unknown> = {
    role: options.role,
    type: options.type,
  };
  if (options.type === "user") {
    body.emailAddress = options.emailAddress;
    body.sendNotificationEmail = options.sendNotificationEmail ?? true;
  }
  const res = await fetch(`${DRIVE_API}/files/${fileId}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive share: ${res.status} ${err}`);
  }
}
