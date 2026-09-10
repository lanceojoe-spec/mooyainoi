import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Scale,
  Megaphone,
  Receipt,
  Wallet,
  Calendar,
  FileSpreadsheet,
  ExternalLink,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import {
  PorkPurchase,
  AdExpense,
  OtherExpense,
  IncomeRecord,
  DateFilterType,
  GoogleSheetInfo,
} from '../types';
import {
  formatCurrency,
  formatNumber,
  isDateInFilter,
} from '../utils/formatters';

interface ReportsViewProps {
  porkPurchases: PorkPurchase[];
  adExpenses: AdExpense[];
  otherExpenses: OtherExpense[];
  incomeRecords: IncomeRecord[];
  sheetInfo: GoogleSheetInfo | null;
}

export const ReportsView = ({
  porkPurchases,
  adExpenses,
  otherExpenses,
  incomeRecords,
  sheetInfo,
}: ReportsViewProps) => {
  const [filter, setFilter] = useState<DateFilterType>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Filtered data
  const filteredPork = useMemo(() => {
    return porkPurchases.filter((p) => isDateInFilter(p.date, filter, customStart, customEnd));
  }, [porkPurchases, filter, customStart, customEnd]);

  const filteredAds = useMemo(() => {
    return adExpenses.filter((a) => isDateInFilter(a.date, filter, customStart, customEnd));
  }, [adExpenses, filter, customStart, customEnd]);

  const filteredOther = useMemo(() => {
    return otherExpenses.filter((o) => isDateInFilter(o.date, filter, customStart, customEnd));
  }, [otherExpenses, filter, customStart, customEnd]);

  const filteredIncome = useMemo(() => {
    return incomeRecords.filter((i) => isDateInFilter(i.date, filter, customStart, customEnd));
  }, [incomeRecords, filter, customStart, customEnd]);

  // Aggregate sums
  const totalIncome = useMemo(() => {
    return filteredIncome.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  }, [filteredIncome]);

  const porkTotalAmount = useMemo(() => {
    return filteredPork.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  }, [filteredPork]);

  const porkTotalKilos = useMemo(() => {
    return filteredPork.reduce((acc, cur) => acc + (cur.kilos || 0), 0);
  }, [filteredPork]);

  const adsTotalAmount = useMemo(() => {
    return filteredAds.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  }, [filteredAds]);

  const otherTotalAmount = useMemo(() => {
    return filteredOther.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  }, [filteredOther]);

  const totalExpense = porkTotalAmount + adsTotalAmount + otherTotalAmount;
  const netBalance = totalIncome - totalExpense;

  // Percentage calculations
  const porkPercent = totalExpense > 0 ? (porkTotalAmount / totalExpense) * 100 : 0;
  const adsPercent = totalExpense > 0 ? (adsTotalAmount / totalExpense) * 100 : 0;
  const otherPercent = totalExpense > 0 ? (otherTotalAmount / totalExpense) * 100 : 0;

  const porkAvgPerKg = porkTotalKilos > 0 ? porkTotalAmount / porkTotalKilos : 0;

  return (
    <div id="reports-view" className="space-y-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">📊</span>
            <span>รายงานสรุปรายรับ-รายจ่าย & ยอดคงเหลือ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            สรุปภาพรวมทางการเงินของร้านหมู คำนวณกำไรส่วนต่าง และสัดส่วนค่าใช้จ่าย
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            id="filter-all-btn"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            id="filter-today-btn"
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'today' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            วันนี้
          </button>
          <button
            type="button"
            id="filter-7days-btn"
            onClick={() => setFilter('7days')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === '7days' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 วันล่าสุด
          </button>
          <button
            type="button"
            id="filter-month-btn"
            onClick={() => setFilter('this_month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'this_month' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            เดือนนี้
          </button>
          <button
            type="button"
            id="filter-custom-btn"
            onClick={() => setFilter('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === 'custom' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กำหนดวัน
          </button>
        </div>
      </div>

      {/* Custom Date Range Selector */}
      {filter === 'custom' && (
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-purple-900 flex items-center gap-1">
            <Calendar className="w-4 h-4" /> เลือกช่วงวันที่:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 border border-purple-200 rounded-lg bg-white"
            />
            <span>ถึง</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 border border-purple-200 rounded-lg bg-white"
            />
          </div>
        </div>
      )}

      {/* TOP 3 BIG FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. ยอดเงินเข้า (Total Income) */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              ยอดเงินเข้ารวม (รายรับ)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
              {filteredIncome.length} รายการ
            </span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
            {formatCurrency(totalIncome)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            รายได้จากการขายหน้าร้าน, โอน และราคาส่ง
          </p>
        </div>

        {/* 2. รายจ่ายรวม (Total Expense) */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800">
            <span className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              รายจ่ายรวมทั้งหมด
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px]">
              {filteredPork.length + filteredAds.length + filteredOther.length} รายการ
            </span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
            {formatCurrency(totalExpense)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            รวมค่าสั่งซื้อหมู + ยิงแอด + รายจ่ายอื่นๆ
          </p>
        </div>

        {/* 3. ยอดเงินคงเหลือสุทธิ (Net Balance / กำไรส่วนต่าง) */}
        <div
          className={`rounded-2xl p-5 border shadow-sm relative overflow-hidden ${
            netBalance >= 0
              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-purple-600'
              : 'bg-gradient-to-br from-amber-600 to-red-600 text-white border-red-600'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-purple-100">
            <span className="flex items-center gap-1.5 text-white">
              <Wallet className="w-4 h-4" />
              ยอดเงินคงเหลือสุทธิ (กำไรส่วนต่าง)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
              {netBalance >= 0 ? 'คงเหลือเป็นบวก' : 'รายจ่ายเกินรายรับ'}
            </span>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-white tracking-tight">
            {formatCurrency(netBalance)}
          </div>
          <p className="mt-1 text-xs text-purple-100/90">
            (ยอดเงินเข้า {formatCurrency(totalIncome)}) - (รายจ่าย {formatCurrency(totalExpense)})
          </p>
        </div>
      </div>

      {/* DETAILED BREAKDOWN OF EXPENSES & BALANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Category Breakdown Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span>การแจกแจงรายจ่ายแยกหมวดหมู่</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              รวม {formatCurrency(totalExpense)}
            </span>
          </div>

          {/* Visual Percentage Distribution Bar */}
          {totalExpense > 0 ? (
            <div className="space-y-3">
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{ width: `${porkPercent}%` }}
                  className="bg-rose-500 h-full"
                  title={`ค่าสั่งซื้อหมู ${formatNumber(porkPercent, 1)}%`}
                />
                <div
                  style={{ width: `${adsPercent}%` }}
                  className="bg-blue-500 h-full"
                  title={`ค่ายิงแอด ${formatNumber(adsPercent, 1)}%`}
                />
                <div
                  style={{ width: `${otherPercent}%` }}
                  className="bg-amber-500 h-full"
                  title={`รายจ่ายอื่นๆ ${formatNumber(otherPercent, 1)}%`}
                />
              </div>

              {/* Breakdown List */}
              <div className="space-y-2.5 pt-1">
                {/* 1. สั่งซื้อหมู */}
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm">
                      🥩
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        รายจ่ายสั่งซื้อหมู ({formatNumber(porkPercent, 1)}%)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatNumber(porkTotalKilos, 1)} กก. (เฉลี่ย {formatNumber(porkAvgPerKg, 2)} ฿/กก.)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-rose-600">
                      {formatCurrency(porkTotalAmount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {filteredPork.length} รายการ
                    </div>
                  </div>
                </div>

                {/* 2. ยิงแอด */}
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        รายจ่ายยิงแอดโฆษณา ({formatNumber(adsPercent, 1)}%)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        โปรโมท Facebook, TikTok, LINE, Google
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-blue-600">
                      {formatCurrency(adsTotalAmount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {filteredAds.length} รายการ
                    </div>
                  </div>
                </div>

                {/* 3. รายจ่ายอื่นๆ */}
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        รายจ่ายอื่นๆ ({formatNumber(otherPercent, 1)}%)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ค่าถุง, น้ำแข็ง, น้ำมัน, ค่าเช่า, ค่าแรง
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-600">
                      {formatCurrency(otherTotalAmount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {filteredOther.length} รายการ
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              ยังไม่มีข้อมูลรายจ่ายในช่วงเวลานี้
            </div>
          )}
        </div>

        {/* Profitability & Google Sheets Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>สรุปผลการดำเนินงาน & ความคุ้มค่า</span>
            </h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              กำไรสุทธิ {totalIncome > 0 ? formatNumber((netBalance / totalIncome) * 100, 1) : 0}%
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">ยอดเงินรับเข้า (100%):</span>
              <span className="font-bold text-emerald-600 text-sm">{formatCurrency(totalIncome)}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">- ต้นทุนเนื้อหมู:</span>
              <span className="font-semibold text-rose-600">
                {formatCurrency(porkTotalAmount)} {totalIncome > 0 ? `(${formatNumber((porkTotalAmount / totalIncome) * 100, 1)}%)` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">- ต้นทุนค่ายิงแอด:</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(adsTotalAmount)} {totalIncome > 0 ? `(${formatNumber((adsTotalAmount / totalIncome) * 100, 1)}%)` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600">- ต้นทุนรายจ่ายอื่นๆ:</span>
              <span className="font-semibold text-amber-600">
                {formatCurrency(otherTotalAmount)} {totalIncome > 0 ? `(${formatNumber((otherTotalAmount / totalIncome) * 100, 1)}%)` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 font-bold">
              <span>= ยอดเงินคงเหลือสุทธิ (กำไร):</span>
              <span className="text-base text-purple-700">{formatCurrency(netBalance)}</span>
            </div>
          </div>

          {/* Google Sheets Sync Box */}
          <div className="pt-2 border-t border-slate-100">
            {sheetInfo ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">
                      ข้อมูลทั้งหมดถูกบันทึกลง Google Sheets ของ lanceojoe@gmail.com
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      ไฟล์: {sheetInfo.name} (แยก 4 แท็บชัดเจน)
                    </div>
                  </div>
                </div>

                <a
                  href={sheetInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-xs"
                >
                  <span>เปิด Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 text-slate-500 text-xs flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                <span>กำลังเตรียมการเชื่อมต่อ Google Sheets...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
