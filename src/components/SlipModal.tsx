import { useState, useRef, ChangeEvent } from 'react';
import {
  X,
  HardDrive,
  Upload,
  Link2,
  ExternalLink,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import { SlipEditTarget } from '../types';
import { getDriveDirectImageUrl, uploadSlipToDrive } from '../services/googleDriveService';
import { formatCurrency } from '../utils/formatters';

interface SlipModalProps {
  target: SlipEditTarget | null;
  accessToken: string;
  onClose: () => void;
  onSaveSlip: (type: SlipEditTarget['type'], id: string, newSlipUrl: string, rowIndex?: number) => Promise<void>;
  onDeleteRecord?: (type: SlipEditTarget['type'], id: string, rowIndex?: number) => Promise<void>;
}

export const SlipModal = ({
  target,
  accessToken,
  onClose,
  onSaveSlip,
  onDeleteRecord,
}: SlipModalProps) => {
  if (!target) return null;

  const [inputUrl, setInputUrl] = useState(target.currentSlipUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const directImageUrl = getDriveDirectImageUrl(inputUrl || target.currentSlipUrl);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 15 MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);
    setSuccessMsg(null);

    try {
      const uploaded = await uploadSlipToDrive(file, accessToken, (p) => setUploadProgress(p));
      setInputUrl(uploaded.webViewLink);
      setSuccessMsg('อัปโหลดไฟล์ไปยัง Google Drive สำเร็จแล้ว! อย่าลืมกดบันทึกลงชีต');
    } catch (err: any) {
      console.error('Upload to Drive failed:', err);
      setError(err?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไปยัง Google Drive');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTriggerSave = () => {
    // Show confirmation modal before modifying workspace data (MANDATORY per Workspace guidelines)
    setConfirmUpdate(true);
  };

  const executeSave = async () => {
    setConfirmUpdate(false);
    setIsSaving(true);
    setError(null);
    try {
      await onSaveSlip(target.type, target.id, inputUrl.trim(), target.rowIndex);
      setSuccessMsg('บันทึกข้อมูลสลิปเรียบร้อยแล้ว');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!onDeleteRecord) return;
    setConfirmDelete(false);
    setIsDeleting(true);
    setError(null);
    try {
      await onDeleteRecord(target.type, target.id, target.rowIndex);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถลบรายการได้');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="slip-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving && !isUploading) onClose();
      }}
    >
      <div
        id="slip-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight">
                หลักฐานและสลิปการจ่ายเงิน (Google Drive)
              </h2>
              <p className="text-xs text-slate-500">
                {target.title} • {formatCurrency(target.amount)}
              </p>
            </div>
          </div>
          <button
            id="close-slip-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status Messages */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Slip Preview */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              รูปภาพสลิปหลักฐาน
            </label>

            {directImageUrl ? (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col items-center justify-center min-h-[220px] max-h-[340px]">
                <img
                  src={directImageUrl}
                  alt="หลักฐานการชำระเงิน"
                  className="max-h-[320px] w-auto max-w-full object-contain p-2 rounded-lg"
                  onError={(e) => {
                    // Hide broken image placeholder if Drive requires webView
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <a
                    href={inputUrl || target.currentSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-medium backdrop-blur-xs transition-colors shadow-sm"
                  >
                    <span>เปิดดูใน Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50 flex flex-col items-center justify-center">
                <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500">ยังไม่มีสลิปหรือหลักฐานแนบ</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  สามารถอัปโหลดไฟล์รูปภาพ หรือวางลิงก์ Google Drive ได้ด้านล่าง
                </p>
              </div>
            )}
          </div>

          {/* Upload directly to Google Drive */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  อัปโหลดสลิปขึ้น Google Drive ทันที
                </span>
                <p className="text-[11px] text-blue-800/80 mt-0.5">
                  ระบบจะบันทึกไฟล์ลงโฟลเดอร์ &quot;ร้านหมู_สลิปและหลักฐาน&quot; ในไดรฟ์ของคุณ
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              id="upload-slip-file-btn"
              disabled={isUploading || isSaving}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-lg border border-blue-200 bg-white hover:bg-blue-50/80 text-blue-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังอัปโหลดไปยัง Google Drive ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>เลือกไฟล์รูปภาพสลิปจากอุปกรณ์</span>
                </>
              )}
            </button>
          </div>

          {/* Or Paste / Edit Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-slate-500" />
              <span>หรือระบุลิงก์ Google Drive โดยตรง</span>
            </label>
            <input
              id="slip-url-input"
              type="url"
              placeholder="https://drive.google.com/file/d/..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white"
            />
          </div>

          {/* Confirmation Modals (Mandatory for Workspace mutations) */}
          {confirmUpdate && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <div className="font-bold">ยืนยันการอัปเดตข้อมูลสลิปลง Google Sheets?</div>
                  <p className="mt-0.5 text-slate-600">
                    ข้อมูลลิงก์สลิปหลักฐานจะถูกบันทึกลงในสเปรดชีต Google Sheets ที่แถวรายการนี้
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmUpdate(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  id="confirm-update-slip-btn"
                  onClick={executeSave}
                  className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer font-semibold"
                >
                  ยืนยันบันทึก
                </button>
              </div>
            </div>
          )}

          {confirmDelete && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-900">
                  <div className="font-bold">ยืนยันการลบรายการนี้ออกจาก Google Sheets?</div>
                  <p className="mt-0.5 text-slate-600">
                    รายการ {target.title} ยอดเงิน {formatCurrency(target.amount)} จะถูกลบถาวร
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  id="confirm-delete-record-btn"
                  onClick={executeDelete}
                  className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer font-semibold"
                >
                  ยืนยันลบรายการ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            {onDeleteRecord && (
              <button
                type="button"
                id="delete-record-trigger-btn"
                disabled={isDeleting || isSaving || isUploading}
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรายการนี้</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploading || isDeleting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              ปิด
            </button>
            <button
              type="button"
              id="save-slip-btn"
              disabled={isSaving || isUploading || isDeleting}
              onClick={handleTriggerSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขสลิป'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
