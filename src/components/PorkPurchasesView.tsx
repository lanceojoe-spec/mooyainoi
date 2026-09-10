import { useState, FormEvent } from 'react';
import {
  ShoppingBag,
  Plus,
  Scale,
  DollarSign,
  Calendar,
  FileText,
  Cloud,
  Eye,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PorkPurchase, SlipEditTarget } from '../types';
import { formatCurrency, formatDisplayDate, getCurrentThaiDateTime, formatNumber } from '../utils/formatters';
import { SlipUploadField } from './SlipUploadField';

interface PorkPurchasesViewProps {
  purchases: PorkPurchase[];
  onAddPurchase: (data: {
    kilos: number;
    amount: number;
    date: string;
    notes: string;
    slipUrl: string;
  }) => Promise<void>;
  onOpenSlipModal: (target: SlipEditTarget) => void;
  onDeletePurchase: (id: string, rowIndex?: number) => Promise<void>;
  isLoading: boolean;
}

export const PorkPurchasesView = ({
  purchases,
  onAddPurchase,
  onOpenSlipModal,
  onDeletePurchase,
  isLoading,
}: PorkPurchasesViewProps) => {
  // Ultra-focused form: primarily kilos & amount as requested
  const [kilos, setKilos] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getCurrentThaiDateTime());
  const [notes, setNotes] = useState<string>('');
  const [slipUrl, setSlipUrl] = useState<string>('');
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live calculation of average price per kg
  const numKilos = parseFloat(kilos) || 0;
  const numAmount = parseFloat(amount) || 0;
  const avgPricePerKg = numKilos > 0 ? Math.round((numAmount / numKilos) * 100) / 100 : 0;

  // Summary statistics
  const totalKilos = purchases.reduce((sum, p) => sum + (p.kilos || 0), 0);
  const totalAmount = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const overallAvg = totalKilos > 0 ? Math.round((totalAmount / totalKilos) * 100) / 100 : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (numKilos <= 0) {
      setError('กรุณากรอกจำนวนกิโล (โล) ให้ถูกต้อง');
      return;
    }
    if (numAmount <= 0) {
      setError('กรุณากรอกยอดเงินสั่งซื้อ (บาท) ให้ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddPurchase({
        kilos: numKilos,
        amount: numAmount,
        date: date || getCurrentThaiDateTime(),
        notes: notes.trim(),
        slipUrl: slipUrl.trim(),
      });

      // Reset form
      setKilos('');
      setAmount('');
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
    <div id="pork-purchases-view" className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">🥩</span>
            <span>รายจ่ายสั่งซื้อหมู</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            บันทึกค่าใช้จ่ายสั่งซื้อเนื้อหมูเข้าสต็อกร้าน (คำนวณราคาเฉลี่ยต่อ กก. อัตโนมัติ)
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>ยอดเงินสั่งซื้อรวม</span>
            <span className="p-1 rounded-md bg-rose-50 text-rose-600 font-bold">฿</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-rose-600">
            {formatCurrency(totalAmount)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            จากทั้งหมด {purchases.length} รายการสั่งซื้อ
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>น้ำหนักหมูรวม</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
            {formatNumber(totalKilos, 1)} <span className="text-sm font-medium text-slate-500">กก.</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            ยอดรวมน้ำหนักเนื้อหมูที่รับเข้า
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>ราคาเฉลี่ยรวม</span>
            <span className="text-xs text-slate-400 font-medium">กก. ละ</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-amber-600">
            {formatNumber(overallAvg, 2)} <span className="text-sm font-medium text-slate-500">บาท/กก.</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            คำนวณจากยอดเงินรวม ÷ กิโลรวม
          </div>
        </div>
      </div>

      {/* Main Form: Focused strictly on Kilos & Amount as explicitly requested */}
      <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs p-5 sm:p-6 relative overflow-hidden">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              ฟอร์มบันทึกสั่งซื้อหมูใหม่
            </h3>
          </div>
          <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            กรอกแค่จำนวนโล และยอดเงิน
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input 1: จำนวนโล (กก.) */}
            <div className="space-y-1.5">
              <label htmlFor="pork-kilos-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-rose-600" />
                <span>จำนวนโล (กิโลกรัม) <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  id="pork-kilos-input"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="เช่น 50 หรือ 120.5"
                  value={kilos}
                  onChange={(e) => setKilos(e.target.value)}
                  className="w-full text-base sm:text-lg font-semibold px-4 py-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-slate-50/50 hover:bg-white transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  กก.
                </span>
              </div>
            </div>

            {/* Input 2: ยอดเงินสั่งซื้อ (บาท) */}
            <div className="space-y-1.5">
              <label htmlFor="pork-amount-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-rose-600" />
                <span>ยอดเงินสั่งซื้อ (บาท) <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  id="pork-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="เช่น 4250 หรือ 9800"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-base sm:text-lg font-semibold px-4 py-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-slate-50/50 hover:bg-white transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  บาท
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Calculation Card */}
          {numKilos > 0 && numAmount > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-amber-900">
                <span className="font-semibold">💡 ราคาเฉลี่ยตกกิโลกรัมละ:</span>
                <span className="text-base font-bold text-amber-700">
                  {formatNumber(avgPricePerKg, 2)} บาท / กก.
                </span>
              </div>
              <span className="text-[11px] text-amber-700/80">
                ({formatNumber(numAmount, 2)} ÷ {numKilos})
              </span>
            </div>
          )}

          {/* Toggle for optional fields: date, slip, notes */}
          <div>
            <button
              type="button"
              id="toggle-pork-details-btn"
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
                <label htmlFor="pork-date-input" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>วันที่และเวลาสั่งซื้อ</span>
                </label>
                <input
                  id="pork-date-input"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <SlipUploadField
                value={slipUrl}
                onChange={setSlipUrl}
                category="pork"
                idPrefix="pork-form"
                label="รูปภาพสลิปหลักฐานการซื้อหมู (Supabase Storage)"
              />

              <div className="space-y-1">
                <label htmlFor="pork-notes-input" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>หมายเหตุ (เช่น ชื่อฟาร์ม, เบอร์หมู, ชิ้นส่วน)</span>
                </label>
                <input
                  id="pork-notes-input"
                  type="text"
                  placeholder="เช่น ฟาร์มลุงสมชาย, หมูขุนเกรด A"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="submit-pork-purchase-btn"
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึกลง Google Sheets...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>บันทึกรายจ่ายสั่งซื้อหมู</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Transaction History List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <span>ประวัติการสั่งซื้อหมู ({purchases.length} รายการ)</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            บันทึกในแท็บ PorkPurchases
          </span>
        </div>

        {purchases.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">ยังไม่มีรายการสั่งซื้อหมู</p>
            <p className="text-xs text-slate-400 mt-1">
              กรอกจำนวนกิโลและยอดเงินสั่งซื้อด้านบนเพื่อเริ่มบันทึกรายการแรก
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {purchases.map((item) => (
              <div
                key={item.id}
                id={`pork-row-${item.id}`}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 font-bold">
                    🥩
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {formatNumber(item.kilos, 1)} กิโลกรัม
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        เฉลี่ย {formatNumber(item.pricePerKg, 2)} ฿/กก.
                      </span>
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
                    <div className="text-sm sm:text-base font-bold text-rose-600">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.id}
                    </div>
                  </div>

                  {/* Actions: Slip modal / delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`pork-slip-btn-${item.id}`}
                      onClick={() =>
                        onOpenSlipModal({
                          type: 'pork',
                          id: item.id,
                          currentSlipUrl: item.slipUrl,
                          title: `สั่งซื้อหมู ${item.kilos} กก.`,
                          amount: item.amount,
                          rowIndex: item.rowIndex,
                        })
                      }
                      title={item.slipUrl ? 'ดูหรือแก้ไขรูปภาพสลิป' : 'อัปโหลดสลิป'}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        item.slipUrl
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{item.slipUrl ? 'ดูสลิป' : '+ แนบสลิป'}</span>
                    </button>

                    <button
                      id={`pork-delete-btn-${item.id}`}
                      onClick={() =>
                        onOpenSlipModal({
                          type: 'pork',
                          id: item.id,
                          currentSlipUrl: item.slipUrl,
                          title: `สั่งซื้อหมู ${item.kilos} กก.`,
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
