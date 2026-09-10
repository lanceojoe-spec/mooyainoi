import { useState, FormEvent } from 'react';
import {
  Receipt,
  Plus,
  DollarSign,
  Calendar,
  FileText,
  Cloud,
  Trash2,
  AlertCircle,
  Package,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OtherExpense, SlipEditTarget } from '../types';
import { formatCurrency, formatDisplayDate, getCurrentThaiDateTime } from '../utils/formatters';
import { SlipUploadField } from './SlipUploadField';

interface OtherExpensesViewProps {
  expenses: OtherExpense[];
  onAddExpense: (data: {
    category: string;
    amount: number;
    description: string;
    date: string;
    notes: string;
    slipUrl: string;
  }) => Promise<void>;
  onOpenSlipModal: (target: SlipEditTarget) => void;
  onDeleteExpense: (id: string, rowIndex?: number) => Promise<void>;
  isLoading: boolean;
}

const COMMON_CATEGORIES = [
  'ค่าถุง/แพ็คเกจจิ้ง',
  'ค่าน้ำแข็ง/ตู้แช่',
  'ค่าขนส่ง/น้ำมัน',
  'ค่าเช่าร้าน/แผง',
  'ค่าจ้าง/แรงงาน',
  'อุปกรณ์/มีด/เขียง',
  'ค่าไฟ/ค่าน้ำ',
  'เบ็ดเตล็ดอื่นๆ',
];

export const OtherExpensesView = ({
  expenses,
  onAddExpense,
  onOpenSlipModal,
  onDeleteExpense,
  isLoading,
}: OtherExpensesViewProps) => {
  const [category, setCategory] = useState<string>('ค่าถุง/แพ็คเกจจิ้ง');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
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
      setError('กรุณากรอกยอดเงินค่าใช้จ่าย (บาท) ให้ถูกต้อง');
      return;
    }

    const finalCategory = category === 'เบ็ดเตล็ดอื่นๆ' && customCategory.trim() ? customCategory.trim() : category;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddExpense({
        category: finalCategory,
        amount: numAmount,
        description: description.trim(),
        date: date || getCurrentThaiDateTime(),
        notes: notes.trim(),
        slipUrl: slipUrl.trim(),
      });

      // Reset form
      setAmount('');
      setDescription('');
      setCustomCategory('');
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
    <div id="other-expenses-view" className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">📦</span>
            <span>หน้ารายจ่ายอื่นๆ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            บันทึกค่าใช้จ่ายทั่วไปในร้านหมู (ค่าถุง, น้ำแข็ง, ค่าขนส่ง, ค่าจ้าง, ค่าเช่า)
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>ยอดรายจ่ายอื่นๆ รวม</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-amber-600">
            {formatCurrency(totalAmount)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            จากทั้งหมด {expenses.length} รายการ
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>จำนวนรายการค่าใช้จ่าย</span>
            <Package className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
            {expenses.length} <span className="text-sm font-medium text-slate-500">บิล</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            บันทึกแยกหมวดหมู่เป็นระเบียบ
          </div>
        </div>
      </div>

      {/* Main Expense Form */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-xs p-5 sm:p-6">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              บันทึกรายจ่ายอื่นๆ
            </h3>
          </div>
          <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            บันทึกลงชีต OtherExpenses
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              เลือกหมวดหมู่รายจ่าย <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    category === cat
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {category === 'เบ็ดเตล็ดอื่นๆ' && (
              <input
                type="text"
                placeholder="ระบุชื่อหมวดหมู่เฉพาะ เช่น ค่าซ่อมเครื่องสไลด์หมู"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label htmlFor="other-amount-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>ยอดเงินจ่าย (บาท) <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  id="other-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="เช่น 150 หรือ 800"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-base sm:text-lg font-semibold px-4 py-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/50 hover:bg-white transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  บาท
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="other-desc-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>รายละเอียดรายการ</span>
              </label>
              <input
                id="other-desc-input"
                type="text"
                placeholder="เช่น ถุงหูหิ้ว 6x14 จำนวน 5 แพ็ค, น้ำแข็งหลอด 3 กระสอบ"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50/50 hover:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Toggle for optional fields */}
          <div>
            <button
              type="button"
              id="toggle-other-details-btn"
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
                <label htmlFor="other-date-input" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>วันที่และเวลาจ่าย</span>
                </label>
                <input
                  id="other-date-input"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <SlipUploadField
                value={slipUrl}
                onChange={setSlipUrl}
                category="other"
                idPrefix="other-form"
                label="รูปภาพสลิป/ใบเสร็จรายจ่าย (Vercel Blob / Supabase)"
              />

              <div className="space-y-1">
                <label htmlFor="other-notes-input" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>หมายเหตุ</span>
                </label>
                <input
                  id="other-notes-input"
                  type="text"
                  placeholder="เช่น ซื้อที่ร้านบรรจุภัณฑ์ตลาดสด"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="submit-other-expense-btn"
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>บันทึกรายจ่ายอื่นๆ</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <span>ประวัติรายจ่ายอื่นๆ ({expenses.length} รายการ)</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            บันทึกในแท็บ OtherExpenses
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">ยังไม่มีรายการรายจ่ายอื่นๆ</p>
            <p className="text-xs text-slate-400 mt-1">
              บันทึกค่าถุง ค่าน้ำแข็ง ค่าขนส่ง หรือค่าใช้จ่ายทั่วไปได้จากฟอร์มด้านบน
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map((item) => (
              <div
                key={item.id}
                id={`other-row-${item.id}`}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {item.category}
                      </span>
                      {item.description && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {item.description}
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
                    <div className="text-sm sm:text-base font-bold text-amber-600">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.id}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`other-slip-btn-${item.id}`}
                      onClick={() =>
                        onOpenSlipModal({
                          type: 'other',
                          id: item.id,
                          currentSlipUrl: item.slipUrl,
                          title: `รายจ่าย ${item.category}`,
                          amount: item.amount,
                          rowIndex: item.rowIndex,
                        })
                      }
                      title={item.slipUrl ? 'ดูหรือแก้ไขรูปภาพสลิป' : 'อัปโหลดสลิป'}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        item.slipUrl
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{item.slipUrl ? 'ดูสลิป' : '+ แนบสลิป'}</span>
                    </button>

                    <button
                      id={`other-delete-btn-${item.id}`}
                      onClick={() =>
                        onOpenSlipModal({
                          type: 'other',
                          id: item.id,
                          currentSlipUrl: item.slipUrl,
                          title: `รายจ่าย ${item.category}`,
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
