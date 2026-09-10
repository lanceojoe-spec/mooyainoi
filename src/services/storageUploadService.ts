export interface StorageStatus {
  status: string;
  activeProvider: 'vercel-blob' | 'supabase' | 'none';
  vercelBlobConfigured: boolean;
  supabaseConfigured: boolean;
  supabaseBucket?: string;
  message: string;
}

export interface UploadResult {
  success: boolean;
  url: string;
  provider: 'vercel-blob' | 'supabase' | 'local-fallback';
  isFallback?: boolean;
  pathname?: string;
  message?: string;
  error?: string;
}

/**
 * Check the active cloud storage provider configured via .env on the server
 */
export async function checkStorageStatus(): Promise<StorageStatus> {
  try {
    const res = await fetch('/api/storage/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not check storage status:', err);
  }
  return {
    status: 'unknown',
    activeProvider: 'none',
    vercelBlobConfigured: false,
    supabaseConfigured: false,
    message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ตรวจสอบพื้นที่จัดเก็บได้',
  };
}

/**
 * Upload an image file (e.g. payment slip) to Vercel Blob or Supabase Storage via backend API
 */
export async function uploadSlipImage(
  file: File,
  category: 'pork' | 'ads' | 'other' | 'income' = 'pork'
): Promise<UploadResult> {
  // 1. Read file to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  // 2. Post to /api/storage/upload
  try {
    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'image/jpeg',
        base64Data,
        category,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${res.status}`);
    }

    const data: UploadResult = await res.json();
    return data;
  } catch (err: any) {
    console.warn('Cloud upload failed, using fallback data URL:', err);
    // Fallback: If network or server fails, return base64 Data URL so user is never blocked
    return {
      success: true,
      url: base64Data,
      provider: 'local-fallback',
      isFallback: true,
      message: 'การอัปโหลดขึ้นคลาวด์ขัดข้อง ระบบได้บันทึกรูปภาพจากอุปกรณ์ให้โดยอัตโนมัติ',
    };
  }
}
