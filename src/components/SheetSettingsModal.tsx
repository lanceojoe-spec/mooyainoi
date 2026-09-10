import React, { useState } from 'react';
import { X, FileSpreadsheet, ExternalLink, ShieldCheck, Users, Share2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { SheetMetadata } from '../services/googleSheetsService';
import { AUTHORIZED_EMAILS, PRIMARY_OWNER_EMAIL, isPrimaryOwner } from '../utils/authWhitelist';

interface SheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: SheetMetadata | null;
  currentUserEmail: string;
  onConnectCustomSheet: (urlOrId: string) => Promise<void>;
  onShareWithTeam: () => Promise<{ success: boolean; sharedEmails: string[]; failedEmails: string[] }>;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  isOpen,
  onClose,
  metadata,
  currentUserEmail,
  onConnectCustomSheet,
  onShareWithTeam,
}) => {
  const [sheetInput, setSheetInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isOwner = isPrimaryOwner(currentUserEmail);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetInput.trim()) return;
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      await onConnectCustomSheet(sheetInput.trim());
      setStatusMessage({ text: 'เชื่อมต่อ Google Sheets สำเร็จเรียบร้อย', type: 'success' });
      setSheetInput('');
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้', type: 'error' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleShareClick = async () => {
    setIsSharing(true);
    setStatusMessage(null);
    try {
      const res = await onShareWithTeam();
      if (res.sharedEmails.length > 0) {
        setStatusMessage({
          text: `ส่งคำขอแชร์สิทธิ์ชีตให้ทีมงานเรียบร้อยแล้ว (${res.sharedEmails.join(', ')})`,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: 'แชร์สิทธิ์ชีตให้ทีมงานแล้ว',
          type: 'success',
        });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'เกิดข้อผิดพลาดในการแชร์สิทธิ์', type: 'error' });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    if (metadata?.url) {
      navigator.clipboard.writeText(metadata.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">การตั้งค่า Google Sheets ของร้าน</h3>
              <p className="text-xs text-slate-500">ข้อมูลจะถูกจัดเก็บเข้าบัญชี {PRIMARY_OWNER_EMAIL} เท่านั้น</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Current Connected Sheet Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">ชีตที่เชื่อมต่ออยู่ปัจจุบัน</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> เชื่อมต่อแล้ว
              </span>
            </div>

            {metadata ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-800 break-words flex items-center gap-2">
                  <span>{metadata.name}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono break-all bg-white p-2.5 rounded-lg border border-slate-200 select-all">
                  ID: {metadata.id}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-200 rounded-lg shadow-2xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    เปิด Google Sheets ในแท็บใหม่
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์ชีต'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                ยังไม่พบข้อมูล Google Sheets หรือกำลังโหลดข้อมูล
              </div>
            )}
          </div>

          {/* Owner & Team Members List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                อีเมลทีมงานที่ได้รับอนุญาตเข้าใช้งาน (4 บัญชี)
              </span>
              {isOwner && metadata?.id && (
                <button
                  type="button"
                  onClick={handleShareClick}
                  disabled={isSharing}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {isSharing ? 'กำลังแชร์...' : 'แชร์สิทธิ์ชีตให้ทีมอีกครั้ง'}
                </button>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
              {AUTHORIZED_EMAILS.map((email) => {
                const isPrimary = email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
                const isCurrent = email.toLowerCase() === currentUserEmail.toLowerCase();
                return (
                  <div key={email} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isPrimary ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                      <span className={`font-mono ${isCurrent ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                        {email}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-sans">
                          (คุณ)
                        </span>
                      )}
                    </div>
                    <div>
                      {isPrimary ? (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          👑 เจ้าของ Google Sheets
                        </span>
                      ) : (
                        <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          สิทธิ์แก้ไข (Editor)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connect / Change Custom Sheet ID */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <label className="block text-xs font-semibold text-slate-700">
              เปลี่ยนหรือเชื่อมต่อลิงก์ Google Sheets อื่นของร้าน
            </label>
            <p className="text-[11px] text-slate-500">
              หากต้องการชี้ไปยัง Google Sheets ที่สร้างไว้แล้ว สามารถวางลิงก์ชีตเต็มหรือรหัส Spreadsheet ID ได้ที่นี่
            </p>
            <form onSubmit={handleConnect} className="flex gap-2">
              <input
                type="text"
                value={sheetInput}
                onChange={(e) => setSheetInput(e.target.value)}
                placeholder="วางลิงก์ https://docs.google.com/spreadsheets/d/... หรือ ID"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={isConnecting || !sheetInput.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isConnecting ? 'กำลังตรวจ...' : 'เชื่อมต่อ'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
