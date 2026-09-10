import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseStorageStatus {
  isConfigured: boolean;
  url?: string;
  hasKey: boolean;
  bucket: string;
  hint: string;
}

let cachedSupabaseClient: SupabaseClient | null = null;
let lastClientUrl = '';
let lastClientKey = '';

function getSupabaseStatus(): SupabaseStorageStatus {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  )?.trim();
  const bucket = (process.env.SUPABASE_BUCKET || 'slips')?.trim();

  if (!url && !key) {
    return {
      isConfigured: false,
      url: undefined,
      hasKey: false,
      bucket,
      hint: 'ยังไม่ได้ระบุ SUPABASE_URL และ SUPABASE_ANON_KEY ใน Settings (.env) กำลังใช้โหมดสำรองรูปภาพในเครื่อง',
    };
  }

  if (!url) {
    return {
      isConfigured: false,
      url: undefined,
      hasKey: true,
      bucket,
      hint: 'ยังไม่ได้ระบุ SUPABASE_URL ใน Settings (.env)',
    };
  }

  if (!key) {
    return {
      isConfigured: false,
      url,
      hasKey: false,
      bucket,
      hint: 'ยังไม่ได้ระบุ SUPABASE_ANON_KEY (หรือ SUPABASE_SERVICE_ROLE_KEY) ใน Settings (.env)',
    };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      isConfigured: false,
      url,
      hasKey: true,
      bucket,
      hint: 'SUPABASE_URL รูปแบบไม่ถูกต้อง (ต้องขึ้นต้นด้วย https:// เช่น https://your-project.supabase.co)',
    };
  }

  return {
    isConfigured: true,
    url,
    hasKey: true,
    bucket,
    hint: `เชื่อมต่อ Supabase Storage สำเร็จ (ถังเก็บ: ${bucket})`,
  };
}

function getSupabaseClient(): SupabaseClient | null {
  const status = getSupabaseStatus();
  if (!status.isConfigured || !status.url) {
    return null;
  }

  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  )?.trim();

  if (cachedSupabaseClient && lastClientUrl === status.url && lastClientKey === key) {
    return cachedSupabaseClient;
  }

  try {
    cachedSupabaseClient = createClient(status.url, key, {
      auth: { persistSession: false },
    });
    lastClientUrl = status.url;
    lastClientKey = key;
    return cachedSupabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON payload parser with large limit for image base64 upload (up to 30MB)
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Supabase storage status endpoint
  app.get('/api/storage/status', (req: Request, res: Response) => {
    const supabaseStatus = getSupabaseStatus();
    res.json({
      status: 'ok',
      activeProvider: supabaseStatus.isConfigured ? 'supabase' : 'local-fallback',
      supabaseConfigured: supabaseStatus.isConfigured,
      bucket: supabaseStatus.bucket,
      hasUrl: Boolean(supabaseStatus.url),
      hasKey: supabaseStatus.hasKey,
      message: supabaseStatus.hint,
    });
  });

  // Slip upload endpoint (Supabase Storage)
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
      const cloudPath = `${category}/${timestamp}_${safeFilename}`;

      const supabaseStatus = getSupabaseStatus();
      const supabase = getSupabaseClient();

      // If Supabase is configured, upload directly to Supabase Storage
      if (supabaseStatus.isConfigured && supabase) {
        try {
          const bucket = supabaseStatus.bucket;

          // Attempt upload to Supabase bucket
          let uploadRes = await supabase.storage
            .from(bucket)
            .upload(cloudPath, buffer, {
              contentType: detectedContentType,
              upsert: true,
            });

          // If bucket doesn't exist, try creating it automatically
          if (uploadRes.error && uploadRes.error.message?.toLowerCase().includes('bucket not found')) {
            try {
              await supabase.storage.createBucket(bucket, { public: true });
              uploadRes = await supabase.storage
                .from(bucket)
                .upload(cloudPath, buffer, {
                  contentType: detectedContentType,
                  upsert: true,
                });
            } catch (createErr) {
              console.warn('Could not auto-create bucket:', createErr);
            }
          }

          if (uploadRes.error) {
            throw uploadRes.error;
          }

          // Get public URL from Supabase
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(cloudPath);

          const publicUrl = publicUrlData?.publicUrl || '';

          res.json({
            success: true,
            url: publicUrl,
            provider: 'supabase',
            pathname: cloudPath,
            uploadedAt: new Date().toISOString(),
          });
          return;
        } catch (supabaseErr: any) {
          console.warn('Supabase Storage upload failed:', supabaseErr?.message);
          const errorMsg = supabaseErr?.message || 'ไม่สามารถอัปโหลดไปยัง Supabase ได้';

          // Return graceful fallback with informative warning
          res.json({
            success: true,
            url: base64Data,
            provider: 'local-fallback',
            isFallback: true,
            warning: `Supabase Storage แจ้งเตือน: ${errorMsg} (ระบบได้สำรองรูปภาพในเครื่องไว้ชั่วคราวแล้ว)`,
            message: `Supabase Storage แจ้งเตือน: ${errorMsg} (ระบบได้สำรองรูปภาพในเครื่องไว้ชั่วคราวแล้ว)`,
            uploadedAt: new Date().toISOString(),
          });
          return;
        }
      }

      // If Supabase is not yet configured, use local fallback
      res.json({
        success: true,
        url: base64Data,
        provider: 'local-fallback',
        isFallback: true,
        warning: supabaseStatus.hint,
        message: supabaseStatus.hint,
        uploadedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Server upload error:', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to process slip upload',
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
