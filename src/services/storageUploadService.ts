export interface CloudStorageStatus {
  status: string;
  activeProvider: 'supabase' | 'vercel-blob' | 'local-fallback' | 'none';
  supabaseConfigured: boolean;
  bucket?: string;
  hasUrl?: boolean;
  hasKey?: boolean;
  message: string;
}

// Backward-compatible alias
export type VercelBlobStorageStatus = CloudStorageStatus;

export interface UploadResult {
  success: boolean;
  url: string;
  provider: 'supabase' | 'vercel-blob' | 'local-fallback';
  isFallback?: boolean;
  pathname?: string;
  message?: string;
  warning?: string;
  error?: string;
}

/**
 * Check if Cloud Storage (Supabase) is configured via environment variables
 */
export async function checkStorageStatus(): Promise<CloudStorageStatus> {
  try {
    const res = await fetch('/api/storage/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not check cloud storage status:', err);
  }
  return {
    status: 'unknown',
    activeProvider: 'none',
    supabaseConfigured: false,
    message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ตรวจสอบพื้นที่จัดเก็บ Supabase Storage ได้',
  };
}

/**
 * Upload an image file (e.g. payment slip) to Supabase Storage via backend API
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

  // 2. Post to /api/storage/upload (handled by server with @supabase/supabase-js)
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
    console.warn('Upload to Supabase Storage failed, using fallback data URL:', err);
    // Fallback: If network or credentials not ready, return base64 Data URL so user is never blocked
    return {
      success: true,
      url: base64Data,
      provider: 'local-fallback',
      isFallback: true,
      message: 'การอัปโหลดขึ้น Supabase ขัดข้อง ระบบได้บันทึกรูปภาพจากอุปกรณ์ให้โดยอัตโนมัติ',
    };
  }
}

