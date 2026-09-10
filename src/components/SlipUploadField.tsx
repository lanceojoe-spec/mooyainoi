import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Upload,
  Cloud,
  Link2,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import {
  uploadSlipImage,
  checkStorageStatus,
  CloudStorageStatus,
} from '../services/storageUploadService';
import { getDriveDirectImageUrl } from '../services/googleDriveService';

interface SlipUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  category: 'pork' | 'ads' | 'other' | 'income';
  idPrefix: string;
  label?: string;
}

export const SlipUploadField = ({
  value,
  onChange,
  category,
  idPrefix,
  label = 'แนบรูปภาพสลิปหลักฐาน (Supabase Storage)',
}: SlipUploadFieldProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccessNote, setUploadSuccessNote] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<CloudStorageStatus | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkStorageStatus().then((status) => {
      setStorageStatus(status);
    });
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('ขนาดรูปภาพต้องไม่เกิน 20 MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccessNote(null);

    try {
      const result = await uploadSlipImage(file, category);
      if (result.success && result.url) {
        onChange(result.url);
        if (result.provider === 'supabase') {
          setUploadSuccessNote('อัปโหลดขึ้น Supabase Storage สำเร็จเรียบร้อยแล้ว');
        } else if (result.warning) {
          setUploadSuccessNote(`แนบรูปภาพสำเร็จ (สำรองในเครื่อง): ${result.warning}`);
        } else {
          setUploadSuccessNote('แนบรูปภาพสำเร็จ (โหมดสำรองรูปภาพในเครื่อง)');
        }
      } else {
        throw new Error(result.error || 'อัปโหลดไม่สำเร็จ');
      }
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์ไปยัง Supabase Storage');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    setUploadSuccessNote(null);
    setError(null);
  };

  const directImageUrl = getDriveDirectImageUrl(value);

  return (
    <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          <span>{label}</span>
        </label>

        {/* Storage Provider Indicator */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {storageStatus?.supabaseConfigured ? (
            <span
              title={`เชื่อมต่อ Supabase Storage สำเร็จ (ถังเก็บ: ${storageStatus.bucket || 'slips'})`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Storage
            </span>
          ) : (
            <span
              title="ระบุ SUPABASE_URL และ SUPABASE_ANON_KEY ใน Settings (.env) เพื่อจัดเก็บบน Supabase อัตโนมัติ"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium cursor-help"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              โหมดสำรองในเครื่อง
            </span>
          )}

          {/* Toggle between upload file and URL */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg ml-1">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'upload' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              อัปโหลดไฟล์
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'url' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              วางลิงก์
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        id={`${idPrefix}-file-input`}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Mode 1: File Upload */}
      {mode === 'upload' && (
        <div>
          {!value ? (
            <button
              type="button"
              id={`${idPrefix}-upload-btn`}
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/30 text-slate-600 text-xs font-medium flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isUploading ? (
                <div className="flex items-center gap-2 text-emerald-600 py-1">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="font-semibold">กำลังอัปโหลดสลิปขึ้น Supabase Storage...</span>
                </div>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span>คลิกเพื่อเลือกรูปภาพสลิปจากอุปกรณ์ (อัปโหลดขึ้น Supabase)</span>
                  <span className="text-[10px] text-slate-400">รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 20MB</span>
                </>
              )}
            </button>
          ) : (
            <div className="relative border border-slate-200 rounded-xl p-2 bg-white flex items-center gap-3">
              {directImageUrl ? (
                <img
                  src={directImageUrl}
                  alt="สลิป"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-100 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {uploadSuccessNote || 'แนบรูปภาพสลิปแล้ว'}
                </div>
                <div className="text-[10px] text-slate-500 truncate font-mono">
                  {value.startsWith('data:') ? 'แนบจากเครื่อง (Data URL)' : value}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {value.startsWith('http') && (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                    title="เปิดดูรูปภาพสลิป"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs"
                  title="เปลี่ยนรูปภาพ"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  title="ลบสลิปออก"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Paste URL */}
      {mode === 'url' && (
        <div className="space-y-1.5">
          <div className="relative">
            <input
              id={`${idPrefix}-url-input`}
              type="url"
              placeholder="https://... หรือลิงก์สลิป"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-1.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="text-[11px] text-red-600 flex items-center gap-1 pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {uploadSuccessNote && !error && (
        <div className="text-[11px] text-emerald-600 flex items-center gap-1 pt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadSuccessNote}</span>
        </div>
      )}
    </div>
  );
};
