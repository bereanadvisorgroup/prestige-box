"use server";

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  webViewLink: string;
  size?: number;
  modifiedTime?: string;
  iconLink?: string;
}

export interface GetDriveContentsResponse {
  success: boolean;
  items?: DriveItem[];
  folderId?: string;
  folderName?: string;
  error?: string;
}

/** Extracts a Google Drive folder or file ID from a URL or raw ID string. */
export async function extractGoogleDriveId(urlOrId: string): Promise<string | null> {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{15,70}$/.test(trimmed)) {
    return trimmed;
  }

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch?.[1]) return idParamMatch[1];

  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch?.[1]) return fileMatch[1];

  return null;
}

/** Exchanges GOOGLE_REFRESH_TOKEN for a fresh Google API access token. */
async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Drive OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN) are missing in environment variables.",
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errorPayload = await res.text();
    console.error("[getGoogleAccessToken] Token refresh failed:", errorPayload);
    throw new Error(`Failed to refresh Google access token: ${res.statusText}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/**
 * Fetches files and subfolders inside a specific Google Drive folder.
 * @param documentUrl The Google Drive folder URL or ID.
 * @param targetFolderId Optional subfolder ID to navigate into.
 */
export async function getGoogleDriveFolderContents(
  documentUrl: string,
  targetFolderId?: string,
): Promise<GetDriveContentsResponse> {
  try {
    const rootFolderId = await extractGoogleDriveId(documentUrl);
    const folderId = targetFolderId || rootFolderId;

    if (!folderId) {
      return {
        success: false,
        error: "Invalid or missing Google Drive folder URL.",
      };
    }

    const accessToken = await getGoogleAccessToken();

    // 1. Get folder details (to display folder name)
    let folderName: string | undefined;
    try {
      const folderRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,webViewLink&supportsAllDrives=true`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (folderRes.ok) {
        const folderData = await folderRes.json();
        folderName = folderData.name;
      }
    } catch (_e) {
      // Ignore folder metadata fetch failure and proceed with files list
    }

    // 2. Fetch children items inside target folder (supporting Shared Drives and shared folders)
    const query = `'${folderId}' in parents and trashed = false`;
    const fields = "files(id, name, mimeType, webViewLink, iconLink, thumbnailLink, size, modifiedTime)";
    const orderBy = "folder,name";

    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query,
    )}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=${encodeURIComponent(
      fields,
    )}&orderBy=${encodeURIComponent(orderBy)}&pageSize=100`;

    const listRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      console.error("[getGoogleDriveFolderContents] List API error:", errText);
      return {
        success: false,
        error: `Google Drive API error (${listRes.status}): ${listRes.statusText}`,
      };
    }

    const listData = await listRes.json();
    const rawFiles: Array<{
      id: string;
      name: string;
      mimeType: string;
      webViewLink?: string;
      size?: string;
      modifiedTime?: string;
      iconLink?: string;
    }> = listData.files || [];

    const items: DriveItem[] = rawFiles.map((file) => {
      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
      const defaultUrl = isFolder
        ? `https://drive.google.com/drive/folders/${file.id}`
        : `https://drive.google.com/file/d/${file.id}/view`;

      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        isFolder,
        webViewLink: file.webViewLink || defaultUrl,
        size: file.size ? Number.parseInt(file.size, 10) : undefined,
        modifiedTime: file.modifiedTime,
        iconLink: file.iconLink,
      };
    });

    return {
      success: true,
      items,
      folderId,
      folderName,
    };
  } catch (error: unknown) {
    console.error("[getGoogleDriveFolderContents] Exception:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch Google Drive folder contents.";
    return {
      success: false,
      error: message,
    };
  }
}
