import React from 'react';
import { LogOut, Download, Store } from 'lucide-react';
import { StoreAuthUser } from '../utils/authWhitelist';

interface NavbarProps {
  user: StoreAuthUser;
  onLogout: () => void;
  onExportSummary?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onExportSummary,
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
                  ร้าน หมูยายน้อย
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 gap-1">
                  <Store className="w-3 h-3 text-rose-600" />
                  <span>ระบบร้าน</span>
                </span>
              </div>
              <p className="text-[12px] text-slate-500 leading-none mt-0.5">
                ระบบจัดการสั่งซื้อ รายจ่าย & รายรับร้าน หมูยายน้อย
              </p>
            </div>
          </div>

          {/* Action Tools & User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Export CSV Button */}
            {onExportSummary && (
              <button
                id="export-csv-btn"
                type="button"
                onClick={onExportSummary}
                title="ส่งออกรายงานสรุปเป็นไฟล์ Excel (CSV)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">ส่งออก CSV</span>
              </button>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 shadow-2xs">
                🐷
              </div>

              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                  {user.displayName || 'ร้าน หมูยายน้อย'}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[140px] font-mono">
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
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
