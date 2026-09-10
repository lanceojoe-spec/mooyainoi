import { useState } from 'react';
import { ShieldCheck, FileSpreadsheet, HardDrive, CircleDollarSign, PiggyBank, ArrowRight, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const LoginView = ({ onSignIn, isLoading, error }: LoginViewProps) => {
  const [attempting, setAttempting] = useState(false);

  const handleLoginClick = async () => {
    setAttempting(true);
    try {
      await onSignIn();
    } finally {
      setAttempting(false);
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-gradient-to-b from-rose-50 via-slate-50 to-amber-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <div id="login-card" className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-500 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner mb-3">
            <span className="text-3xl">🐷</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            ระบบจัดการร้านขายหมู
          </h1>
          <p className="text-rose-100 text-sm font-normal">
            บัญชีรายรับ-รายจ่าย สั่งซื้อหมู & โฆษณา ซิงค์ Google Sheets
          </p>
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs sm:text-sm text-amber-900 space-y-2">
            <div className="font-semibold flex items-center gap-1.5 text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>ความปลอดภัยและการเข้าถึงข้อมูล</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              กรุณาเข้าสู่ระบบด้วย Google Account ของคุณเพื่อเปิดดูและจัดการข้อมูลบัญชี ข้อมูลจะถูกจัดเก็บใน <strong>Google Sheets</strong> และสลิปหลักฐานจะเก็บใน <strong>Google Drive</strong> ส่วนตัวของคุณอย่างปลอดภัย
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-rose-500 font-semibold">🥩 สั่งซื้อหมู</span>
              <span className="text-[11px] text-slate-500">ใส่แค่กิโล/ยอด</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-blue-500 font-semibold">📢 ยิงแอด</span>
              <span className="text-[11px] text-slate-500">FB, TikTok, etc.</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-emerald-600 font-semibold">💰 รับเงินเข้า</span>
              <span className="text-[11px] text-slate-500">หน้าร้าน/โอน</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-purple-600 font-semibold">📊 ยอดคงเหลือ</span>
              <span className="text-[11px] text-slate-500">สรุปกำไรชัดเจน</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex items-start gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <div className="pt-2">
            <button
              id="google-signin-btn"
              type="button"
              disabled={isLoading || attempting}
              onClick={handleLoginClick}
              className="w-full relative flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3.5 px-4 rounded-xl border border-slate-300 shadow-sm hover:shadow transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              {isLoading || attempting ? (
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเชื่อมต่อกับ Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-sm sm:text-base font-semibold text-slate-800">
                    เข้าสู่ระบบด้วยบัญชี Google
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-[12px] text-slate-400">
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Google Sheets
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" /> Google Drive
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
