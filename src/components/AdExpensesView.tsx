import { useState, FormEvent } from 'react';
import {
  Megaphone,
  Plus,
  DollarSign,
  Calendar,
  FileText,
  Cloud,
  Trash2,
  AlertCircle,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AdExpense, SlipEditTarget } from '../types';
import { formatCurrency, formatDisplayDate, getCurrentThaiDateTime } from '../utils/formatters';
import { SlipUploadField } from './SlipUploadField';

interface AdExpensesViewProps {
  expenses: AdExpense[];
  onAddExpense: (data: {
    platform: string;
    amount: number;
    campaignName: string;
    date: string;
    notes: string;
    slipUrl: string;
  }) => Promise<void>;
  onOpenSlipModal: (target: SlipEditTarget) => void;
  onDeleteExpense: (id: string, rowIndex?: number) => Promise<void>;
  isLoading: boolean;
}

const POPULAR_PLATFORMS = [
  { name: 'Facebook Ads', color: 'bg-blue-600 text-white', tag: 'FB' },
  { name: 'TikTok Ads', color: 'bg-black text-white', tag: 'TikTok' },
  { name: 'LINE Ads', color: 'bg-emerald-600 text-white', tag: 'LINE' },
  { name: 'Google Ads', color: 'bg-amber-600 text-white', tag: 'Google' },
  { name: 'Instagram', color: 'bg-pink-600 text-white', tag: 'IG' },
  { name: 'อื่นๆ', color: 'bg-slate-600 text-white', tag: 'อื่นๆ' },
];

export const AdExpensesView = ({
  expenses,
  onAddExpense,
  onOpenSlipModal,
  onDeleteExpense,
  isLoading,
}: AdExpensesViewProps) => {
  const [platform, setPlatform] = useState<string>('Facebook Ads');
  const [customPlatform, setCustomPlatform] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('');
  const [date, setDate] = useState<string>(getCurrentThaiDateTime());
  const [notes, setNotes] = useState<string>('');
  const [slipUrl, setSlipUrl] = useState<string>('');
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('กรุณากรอกยอดเงินค่ายิงแอด (บาท) ให้ถูกต้อง');
      return;
    }

    const finalPlatform = platform === 'อื่นๆ' && customPlatform.trim() ? customPlatform.trim() : platform;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddExpense({
        platform: finalPlatform,
        amount: numAmount,
        campaignName: campaignName.trim(),
        date: date || getCurrentThaiDateTime(),
        notes: notes.trim(),
        slipUrl: slipUrl.trim(),
      });

      // Reset form
      setAmount('');
      setCampaignName('');
      setCustomPlatform('');
      setNotes('');
      setSlipUrl('');
      setShowOptionalFields(false);
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="ad-expenses-view" className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">📢</span>
            <span>รายจ่ายยิงแอดโฆษณา</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            บันทึกค่ายิงแอดโปรโมทร้านหมู (Facebook, TikTok, LINE, Google) พร้อมหลักฐานการตัดเงิน
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>ค่ายิงแอดสะสมรวม</span>
            <Megaphone className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-blue-600">
            {formatCurrency(totalAmount)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            จากทั้งหมด {expenses.length} รายการแคมเปญ
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>เฉลี่ยต่อแคมเปญ</span>
            <span className="text-xs text-slate-400 font-medium">บาท/ครั้ง</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
            {expenses.length > 0 ? formatCurrency(totalAmount / expenses.length) : '0.00 บาท'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            คำนวณจากยอดรวม ÷ จำนวนครั้ง
          </div>
        </div>
      </div>

      {/* Main Ad Expense Form */}
      <div className="bg-white rounded-2xl border border-blue-200/80 shadow-xs p-5 sm:p-6">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              บันทึกค่ายิงแอดใหม่
            </h3>
          </div>
          <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            บันทึกลงชีต AdExpenses
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Platform chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              เลือกแพลตฟอร์มยิงแอด <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_PLATFORMS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setPlatform(p.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    platform === p.name
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {platform === 'อื่นๆ' && (
              <input
                type="text"
                placeholder="ระบุชื่อแพลตฟอร์มอื่นๆ เช่น Shopee Ads, Banner ฯลฯ"
                value={customPlatform}
                onChange={(e) => setCustomPlatform(e.target.value)}
                className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount input */}
            <div className="space-y-1.5">
              <label htmlFor="ad-amount-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>ยอดเงินค่ายิงแอด (บาท) <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  id="ad-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="เช่น 500 หรือ 2000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-base sm:text-lg font-semibold px-4 py-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  บาท
                </span>
              </div>
            </div>

            {/* Campaign Name */}
            <div className="space-y-1.5">
              <label htmlFor="ad-campaign-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>ชื่อแคมเปญ / วัตถุประสงค์โฆษณา</span>
              </label>
              <input
                id="ad-campaign-input"
                type="text"
                placeholder="เช่น โปรสามชั้นสไลด์ลด 20%, แอดหาลูกค้าประจำ"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Toggle for optional fields */}
          <div>
            <button
              type="button"
              id="toggle-ad-details-btn"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 py-1 cursor-pointer"
            >
              {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showOptionalFields ? 'ซ่อนตัวเลือกเพิ่มเติม (วันที่/สลิป/หมายเหตุ)' : '+ เพิ่มเติม (วันที่, แนบสลิป Google Drive, หมายเหตุ)'}</span>
            </button>
          </div>

          {showOptionalFields && (
            <div className="space-y-3 pt-2 border-t border-slate-100 bg-slate-50/60 p-3.5 rounded-xl">
              <div className="space-y-1">
                <label htmlFor="ad-date-input" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>วันที่และเวลายิงแอด</span>
                </label>
                <input
                  id="ad-date-input"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <SlipUploadField
                value={slipUrl}
                onChange={setSlipUrl}
                category="ads"
                idPrefix="ad-form"
                label="รูปภาพใบเสร็จ/สลิปค่ายิงแอด (Supabase Storage)"
              />

              <div className="space-y-1">
                <label htmlFor="ad-notes-input" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>หมายเหตุเพิ่มเติม</span>
                </label>
                <input
                  id="ad-notes-input"
                  type="text"
                  placeholder="เช่น ยิงกลุ่มเป้าหมายในรัศมี 10 กม., แอดสตอรี่"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="submit-ad-expense-btn"
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>บันทึกค่ายิงแอดโฆษณา</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Ad Expenses History List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <span>ประวัติค่ายิงแอด ({expenses.length} รายการ)</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            บันทึกในแท็บ AdExpenses
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Megaphone className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">ยังไม่มีรายการยิงแอดโฆษณา</p>
            <p className="text-xs text-slate-400 mt-1">
              เลือกแพลตฟอร์มและกรอกยอดเงินด้านบนเพื่อบันทึกรายการ
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map((item) => (
              <div
                key={item.id}
                id={`ad-row-${item.id}`}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {item.platform}
                      </span>
                      {item.campaignName && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {item.campaignName}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{formatDisplayDate(item.date)}</span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-sm sm:text-base font-bold text-blue-600">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.id}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`ad-slip-btn-${item.id}`}
                      onClick={() =>
                        onOpenSlipModal({
                          type: 'ads',
                          id: item.id,
                          currentSlipUrl: item.slipUrl,
                          title: `ค่ายิงแอด ${item.platform}`,
                          amount: item.amount,
                          rowIndex: item.rowIndex,
                        })
                      }
                      title={item.slipUrl ? 'ดูหรือแก้ไขรูปภาพสลิป' : 'อัปโหลดสลิป'}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        item.slipUrl
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{item.slipUrl ? 'ดูสลิป' : '+ แนบสลิป'}</span>
                    </button>

                    <button
                      id={`ad-delete-btn-${item.id}`}
                      onClick={() =>
                        onOpenSlipModal({
                          type: 'ads',
                          id: item.id,
                          currentSlipUrl: item.slipUrl,
                          title: `ค่ายิงแอด ${item.platform}`,
                          amount: item.amount,
                          rowIndex: item.rowIndex,
                        })
                      }
                      title="จัดการหรือลบรายการ"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
