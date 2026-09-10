import { User } from 'firebase/auth';
import { RefreshCw, ExternalLink, LogOut, FileSpreadsheet, HardDrive, CheckCircle2 } from 'lucide-react';
import { GoogleSheetInfo } from '../types';

interface NavbarProps {
  user: User;
  sheetInfo: GoogleSheetInfo | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
}

export const Navbar = ({ user, sheetInfo, onRefresh, isRefreshing, onLogout }: NavbarProps) => {
  return (
    <header id="app-navbar" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xs text-xl">
              🐷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
                  ระบบจัดการร้านขายหมู
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Google Sheets
                </span>
              </div>
              <p className="text-[12px] text-slate-500 leading-none mt-0.5">
                จัดการสั่งซื้อ รายรับ-รายจ่าย & สลิป Drive
              </p>
            </div>
          </div>

          {/* Action Tools & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Google Sheets Link Button */}
            {sheetInfo?.url && (
              <a
                id="open-google-sheet-btn"
                href={sheetInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                title="เปิดดูไฟล์ Google Sheets จริง"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden md:inline">เปิดดู Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </a>
            )}

            {/* Sync Button */}
            <button
              id="sync-data-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="ดึงข้อมูลล่าสุดจาก Google Sheets"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 ${isRefreshing ? 'animate-spin text-rose-600' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'กำลังโหลด...' : 'ซิงค์ข้อมูล'}</span>
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'ผู้ใช้งาน'}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                  {user.displayName || 'ผู้ใช้งาน'}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                  {user.email}
                </div>
              </div>

              <button
                id="logout-btn"
                onClick={onLogout}
                title="ออกจากระบบ"
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ออก</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
