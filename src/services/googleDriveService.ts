// Google Drive API Service
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3';

const FOLDER_NAME = 'ร้านหมู_สลิปและหลักฐาน';

/**
 * Find or create a dedicated folder in Google Drive to organize slips
 */
export async function getOrCreateFolder(accessToken: string): Promise<string> {
  try {
    const query = encodeURIComponent(
      `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchRes = await fetch(`${DRIVE_API_URL}/files?q=${query}&fields=files(id,name)`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create folder if not found
    const createRes = await fetch(`${DRIVE_API_URL}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      return created.id;
    }
  } catch (err) {
    console.warn('Could not create or find folder, uploading to root Drive instead', err);
  }
  return '';
}

/**
 * Upload an image or document slip directly to Google Drive
 */
export async function uploadSlipToDrive(
  file: File,
  accessToken: string,
  onProgress?: (percent: number) => void
): Promise<{ fileId: string; webViewLink: string; name: string }> {
  const folderId = await getOrCreateFolder(accessToken);

  const metadata: Record<string, any> = {
    name: `สลิป_${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
    mimeType: file.type || 'image/jpeg',
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const fileContent = reader.result as ArrayBuffer;

        const metadataString = JSON.stringify(metadata);
        const requestHeader = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${metadataString}${delimiter}Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

        const encoder = new TextEncoder();
        const headerBytes = encoder.encode(requestHeader);
        const footerBytes = encoder.encode(closeDelimiter);

        // Combine header + binary file + footer
        const combinedLength = headerBytes.byteLength + fileContent.byteLength + footerBytes.byteLength;
        const combined = new Uint8Array(combinedLength);
        combined.set(headerBytes, 0);
        combined.set(new Uint8Array(fileContent), headerBytes.byteLength);
        combined.set(footerBytes, headerBytes.byteLength + fileContent.byteLength);

        if (onProgress) onProgress(30);

        const uploadRes = await fetch(
          `${UPLOAD_API_URL}/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: combined,
          }
        );

        if (onProgress) onProgress(80);

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || 'ไม่สามารถอัปโหลดไฟล์ไปยัง Google Drive ได้');
        }

        const uploadedFile = await uploadRes.json();

        // Make file accessible by link
        try {
          await fetch(`${DRIVE_API_URL}/files/${uploadedFile.id}/permissions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              role: 'reader',
              type: 'anyone',
            }),
          });
        } catch {
          // Permissions can be optional if private to account
        }

        if (onProgress) onProgress(100);

        const link =
          uploadedFile.webViewLink ||
          `https://drive.google.com/file/d/${uploadedFile.id}/view?usp=sharing`;

        resolve({
          fileId: uploadedFile.id,
          webViewLink: link,
          name: uploadedFile.name,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract Google Drive file ID from various link formats
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  // Match standard file/d/ID, or ?id=ID
  const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  // Maybe raw file ID provided
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) {
    return url.trim();
  }

  return null;
}

/**
 * Generate a direct previewable image URL from a Google Drive link or ID
 */
export function getDriveDirectImageUrl(urlOrId: string): string {
  if (!urlOrId) return '';
  const fileId = extractDriveFileId(urlOrId);
  if (fileId) {
    // Google Drive direct thumbnail preview endpoint
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }
  // If it's already an HTTP/HTTPS image URL (e.g. imgur, direct link), return it
  if (urlOrId.startsWith('http://') || urlOrId.startsWith('https://')) {
    return urlOrId;
  }
  return '';
}
