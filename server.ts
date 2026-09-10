import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

// Lazy-loaded Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseClient;
}

function detectActiveStorageProvider(): {
  provider: 'vercel-blob' | 'supabase' | 'none';
  vercelBlobAvailable: boolean;
  supabaseAvailable: boolean;
  bucketName: string;
} {
  const vercelToken = process.env.BLOB_READ_WRITE_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  const preferred = (process.env.STORAGE_PROVIDER || 'auto').toLowerCase();
  const bucketName = process.env.SUPABASE_BUCKET || 'slips';

  const vercelBlobAvailable = Boolean(vercelToken && vercelToken.trim().length > 0);
  const supabaseAvailable = Boolean(supabaseUrl && supabaseKey);

  if (preferred === 'vercel-blob' && vercelBlobAvailable) {
    return { provider: 'vercel-blob', vercelBlobAvailable, supabaseAvailable, bucketName };
  }
  if (preferred === 'supabase' && supabaseAvailable) {
    return { provider: 'supabase', vercelBlobAvailable, supabaseAvailable, bucketName };
  }

  // Auto-detection
  if (vercelBlobAvailable) {
    return { provider: 'vercel-blob', vercelBlobAvailable, supabaseAvailable, bucketName };
  }
  if (supabaseAvailable) {
    return { provider: 'supabase', vercelBlobAvailable, supabaseAvailable, bucketName };
  }

  return { provider: 'none', vercelBlobAvailable, supabaseAvailable, bucketName };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON payload parser with large limit for image base64 upload
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Storage status endpoint
  app.get('/api/storage/status', (req: Request, res: Response) => {
    const status = detectActiveStorageProvider();
    res.json({
      status: 'ok',
      activeProvider: status.provider,
      vercelBlobConfigured: status.vercelBlobAvailable,
      supabaseConfigured: status.supabaseAvailable,
      supabaseBucket: status.bucketName,
      message:
        status.provider === 'vercel-blob'
          ? 'เชื่อมต่อ Vercel Blob Storage สำเร็จ (พร้อมอัปโหลด)'
          : status.provider === 'supabase'
          ? `เชื่อมต่อ Supabase Storage สำเร็จ (Bucket: ${status.bucketName})`
          : 'ยังไม่ได้ระบุ BLOB_READ_WRITE_TOKEN หรือ SUPABASE_URL ใน .env (ใช้โหมดสำรอง Data URL)',
    });
  });

  // Slip upload endpoint
  app.post('/api/storage/upload', async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename, contentType = 'image/jpeg', base64Data, category = 'pork' } = req.body;

      if (!base64Data) {
        res.status(400).json({
          success: false,
          error: 'Missing base64Data in request payload',
        });
        return;
      }

      // Clean & extract pure base64
      let cleanBase64 = base64Data;
      let detectedContentType = contentType;

      if (base64Data.includes(';base64,')) {
        const parts = base64Data.split(';base64,');
        const header = parts[0];
        cleanBase64 = parts[1];
        const match = header.match(/data:([a-zA-Z0-9/+-]+)/);
        if (match && match[1]) {
          detectedContentType = match[1];
        }
      }

      const buffer = Buffer.from(cleanBase64, 'base64');
      const timestamp = Date.now();
      const safeFilename = (filename || 'slip.jpg')
        .replace(/[^a-zA-Z0-9_.-]/g, '_')
        .toLowerCase();
      const cloudPath = `slips/${category}/${timestamp}_${safeFilename}`;

      const { provider, bucketName } = detectActiveStorageProvider();

      // Case 1: Vercel Blob Storage
      if (provider === 'vercel-blob') {
        const token = process.env.BLOB_READ_WRITE_TOKEN;
        const blobResult = await put(cloudPath, buffer, {
          access: 'public',
          token,
          contentType: detectedContentType,
        });

        res.json({
          success: true,
          url: blobResult.url,
          provider: 'vercel-blob',
          pathname: blobResult.pathname,
          uploadedAt: new Date().toISOString(),
        });
        return;
      }

      // Case 2: Supabase Storage
      if (provider === 'supabase') {
        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase client failed to initialize');
        }

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(cloudPath, buffer, {
            contentType: detectedContentType,
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(cloudPath);

        res.json({
          success: true,
          url: publicUrlData.publicUrl,
          provider: 'supabase',
          pathname: cloudPath,
          uploadedAt: new Date().toISOString(),
        });
        return;
      }

      // Case 3: Fallback when neither Vercel Blob nor Supabase is configured yet in .env
      // Return the data URL safely so user can test and save slips without friction
      res.json({
        success: true,
        url: base64Data,
        provider: 'local-fallback',
        isFallback: true,
        message: 'ยังไม่ได้ตั้งค่า Vercel Blob หรือ Supabase ใน .env ระบบจึงใช้ภาพจากอุปกรณ์เป็นหลักฐานชั่วคราว',
        uploadedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Storage upload error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to upload slip to storage',
      });
    }
  });

  // --- Vite Frontend Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
