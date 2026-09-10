import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { APP_CREDENTIALS } from '../utils/authWhitelist';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<boolean> | boolean;
  error?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, error: propError }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim() || !password) {
      setLocalError('กรุณากรอกชื่อผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onLogin(username.trim(), password);
      if (!success) {
        setLocalError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setLocalError(err?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillCredentials = () => {
    setUsername(APP_CREDENTIALS.username);
    setPassword(APP_CREDENTIALS.password);
    setLocalError(null);
  };

  const activeError = localError || propError;

  return (
    <div
      id="login-container"
      className="min-h-screen bg-gradient-to-b from-rose-50 via-slate-50 to-amber-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6"
    >
      <div
        id="login-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
      >
        {/* Card Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-500 p-6 sm:p-7 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner mb-2.5">
            <span className="text-3xl">🐷</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            ร้านหมูยายหน่อย
          </h1>
          <p className="text-rose-100 text-xs sm:text-sm font-normal">
            ระบบจัดการการสั่งซื้อ รายจ่าย & รายรับร้านหมู
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Error Message */}
          {activeError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold">เข้าสู่ระบบไม่สำเร็จ</div>
                <div className="text-slate-600 leading-relaxed">{activeError}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mooyainoi"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Fill Helper */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-slate-400">ชื่อ: mooyainoi</span>
              <button
                type="button"
                onClick={handleFillCredentials}
                className="text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                เติมข้อมูลอัตโนมัติ
              </button>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* System storage note */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-800 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-950">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ความปลอดภัยของระบบร้าน</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              ระบบบันทึกข้อมูลและคำนวณยอดเงินคงเหลือปลอดภัย เข้าใช้งานด้วยชื่อผู้ใช้และรหัสผ่านร้านได้ทันที
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-rose-500 font-semibold">🥩 สั่งซื้อหมู</span>
              <span className="text-[11px] text-slate-500">กิโล / ยอด</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-blue-500 font-semibold">📢 ยิงแอด</span>
              <span className="text-[11px] text-slate-500">FB, TikTok</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-emerald-600 font-semibold">💰 รับเงินเข้า</span>
              <span className="text-[11px] text-slate-500">หน้าร้าน/โอน</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-purple-600 font-semibold">📊 ยอดคงเหลือ</span>
              <span className="text-[11px] text-slate-500">สรุปกำไรชัดเจน</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
