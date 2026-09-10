import React from 'react';
import { RefreshCw, ExternalLink, LogOut, FileSpreadsheet, Settings, ShieldCheck, Link2 } from 'lucide-react';
import { GoogleSheetInfo } from '../types';
import { PRIMARY_OWNER_EMAIL, StoreAuthUser } from '../utils/authWhitelist';

interface NavbarProps {
  user: StoreAuthUser;
  sheetInfo: GoogleSheetInfo | null;
  isSheetsConnected: boolean;
  onConnectGoogleSheets: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  sheetInfo,
  isSheetsConnected,
  onConnectGoogleSheets,
  onRefresh,
  isRefreshing,
  onLogout,
  onOpenSettings,
}) => {
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
                  ร้านหมูยายหน่อย
                </h1>
                {isSheetsConnected ? (
                  <span
                    title={`บันทึกเข้า Google Sheets ของ ${PRIMARY_OWNER_EMAIL}`}
                    className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 gap-1"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                    <span>ซิงค์ Sheets ({PRIMARY_OWNER_EMAIL})</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onConnectGoogleSheets}
                    title="คลิกเพื่อเชื่อมต่อ Google Sheets กับบัญชีของร้าน"
                    className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors gap-1 cursor-pointer"
                  >
                    <Link2 className="w-3 h-3 text-amber-600" />
                    <span>เชื่อมต่อ Google Sheets</span>
                  </button>
                )}
              </div>
              <p className="text-[12px] text-slate-500 leading-none mt-0.5">
                ระบบจัดการสั่งซื้อ รายรับ-รายจ่าย & ซิงค์ Google Sheets
              </p>
            </div>
          </div>

          {/* Action Tools & User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Connect button on small mobile if not connected */}
            {!isSheetsConnected && (
              <button
                type="button"
                onClick={onConnectGoogleSheets}
                className="sm:hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                <span>ต่อ Sheets</span>
              </button>
            )}

            {/* Direct Google Sheets Link Button */}
            {sheetInfo?.url && (
              <a
                id="open-google-sheet-btn"
                href={sheetInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`เปิดดู Google Sheets ของ ${PRIMARY_OWNER_EMAIL}`}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Google Sheets</span>
                <ExternalLink className="w-3 h-3 text-emerald-600" />
              </a>
            )}

            {/* Sheet Settings Button */}
            <button
              id="sheet-settings-btn"
              type="button"
              onClick={onOpenSettings}
              title="ตั้งค่า Google Sheets ของร้าน"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">ตั้งค่าชีต</span>
            </button>

            {/* Sync Button */}
            <button
              id="sync-data-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="ดึงข้อมูลล่าสุดจาก Google Sheets"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-rose-600' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูล'}</span>
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 shadow-2xs">
                🐷
              </div>

              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[130px] font-mono">
                  @{user.username}
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
