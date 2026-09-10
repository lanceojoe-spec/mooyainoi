import { useState, FormEvent } from 'react';
import {
  Wallet,
  Plus,
  DollarSign,
  Calendar,
  FileText,
  HardDrive,
  Trash2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { IncomeRecord, SlipEditTarget } from '../types';
import { formatCurrency, formatDisplayDate, getCurrentThaiDateTime } from '../utils/formatters';

interface IncomeViewProps {
  records: IncomeRecord[];
  onAddIncome: (data: {
    channel: string;
    amount: number;
    description: string;
    date: string;
    notes: string;
    slipUrl: string;
  }) => Promise<void>;
  onOpenSlipModal: (target: SlipEditTarget) => void;
  onDeleteIncome: (id: string, rowIndex?: number) => Promise<void>;
  isLoading: boolean;
}

const COMMON_CHANNELS = [
  'หน้าร้าน (เงินสด)',
  'โอนธนาคาร',
  'สแกน QR Code',
  'ส่งร้านอาหาร (ราคาส่ง)',
  'เดลิเวอรี่/ออนไลน์',
  'อื่นๆ',
];

export const IncomeView = ({
  records,
  onAddIncome,
  onOpenSlipModal,
  onDeleteIncome,
  isLoading,
}: IncomeViewProps) => {
  const [channel, setChannel] = useState<string>('หน้าร้าน (เงินสด)');
  const [customChannel, setCustomChannel] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(getCurrentThaiDateTime());
  const [notes, setNotes] = useState<string>('');
  const [slipUrl, setSlipUrl] = useState<string>('');
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('กรุณากรอกยอดเงินรับเข้า (บาท) ให้ถูกต้อง');
      return;
    }

    const finalChannel = channel === 'อื่นๆ' && customChannel.trim() ? customChannel.trim() : channel;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAddIncome({
        channel: finalChannel,
        amount: numAmount,
        description: description.trim(),
        date: date || getCurrentThaiDateTime(),
        notes: notes.trim(),
        slipUrl: slipUrl.trim(),
      });

      // Reset form
      setAmount('');
      setDescription('');
      setCustomChannel('');
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
    <div id="income-view" className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">💰</span>
            <span>หน้ารับเงินเข้า (รายได้)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            บันทึกยอดขายหน้าร้าน ยอดโอน และรายรับจากการขายส่งเนื้อหมู
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>ยอดเงินเข้ารวมทั้งหมด</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-emerald-600">
            {formatCurrency(totalAmount)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            จากทั้งหมด {records.length} รายการรับเงิน
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>เฉลี่ยต่อบิลขาย</span>
            <CreditCard className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">
            {records.length > 0 ? formatCurrency(totalAmount / records.length) : '0.00 บาท'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            คำนวณจากยอดรับรวม ÷ จำนวนบิล
          </div>
        </div>
      </div>

      {/* Main Income Form */}
      <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-xs p-5 sm:p-6">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <h3 className="font-bold text-slate-800 text-base">
              บันทึกยอดเงินเข้าใหม่
            </h3>
          </div>
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            บันทึกลงชีต Income
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              เลือกช่องทางรับเงิน <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    channel === ch
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            {channel === 'อื่นๆ' && (
              <input
                type="text"
                placeholder="ระบุช่องทางรับเงินอื่นๆ เช่น เครดิตร้านอาหาร, เช็ค"
                value={customChannel}
                onChange={(e) => setCustomChannel(e.target.value)}
                className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label htmlFor="income-amount-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>ยอดเงินรับเข้า (บาท) <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  id="income-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="เช่น 1500 หรือ 12800"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-base sm:text-lg font-semibold px-4 py-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50 hover:bg-white transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  บาท
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="income-desc-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>รายละเอียดรายการขาย</span>
              </label>
              <input
                id="income-desc-input"
                type="text"
                placeholder="เช่น หมูเนื้อแดง 10 กก., ซี่โครง 5 กก., ยอดรอบเช้า"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50 hover:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Toggle for optional fields */}
          <div>
            <button
              type="button"
              id="toggle-income-details-btn"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 py-1 cursor-pointer"
            >
              {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showOptionalFields ? 'ซ่อนตัวเลือกเพิ่มเติม (วันที่/สลิป/หมายเหตุ)' : '+ เพิ่มเติม (วันที่, แนบสลิป Google Drive, หมายเหตุ)'}</span>
            </button>
          </div>

          {showOptionalFields && (
            <div className="space-y-3 pt-2 border-t border-slate-100 bg-slate-50/60 p-3.5 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="income-date-input" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>วันที่และเวลารับเงิน</span>
                  </label>
                  <input
                    id="income-date-input"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="income-slip-input" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>ลิงก์สลิปโอนเงิน Google Drive</span>
                  </label>
                  <input
                    id="income-slip-input"
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={slipUrl}
                    onChange={(e) => setSlipUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="income-notes-input" className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>หมายเหตุ</span>
                </label>
                <input
                  id="income-notes-input"
                  type="text"
                  placeholder="เช่น ลูกค้าประจำร้านก๋วยเตี๋ยวป้าเพ็ญ"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="submit-income-btn"
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึกลง Google Sheets...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>บันทึกยอดเงินเข้า</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <span>ประวัติเงินเข้า ({records.length} รายการ)</span>
          </h3>
          <span className="text-[11px] text-slate-500">
            บันทึกในแท็บ Income
          </span>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Wallet className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">ยังไม่มีรายการรับเงิน</p>
            <p className="text-xs text-slate-400 mt-1">
              บันทึกยอดขายหน้าร้านหรือยอดเงินโอนจากฟอร์มด้านบน
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((item) => (
              <div
                key={item.id}
                id={`income-row-${item.id}`}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {item.channel}
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
                    <div className="text-sm sm:text-base font-bold text-emerald-600">
                      +{formatCurrency(item.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.id}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`income-slip-btn-${item.id}`}
                      onClick={() =>
                        onOpenSlipModal({
                          type: 'income',
                          id: item.id,
                          currentSlipUrl: item.slipUrl,
                          title: `รับเงิน ${item.channel}`,
                          amount: item.amount,
                          rowIndex: item.rowIndex,
                        })
                      }
                      title={item.slipUrl ? 'ดูหรือแก้ไขสลิป Google Drive' : 'แนบสลิป Google Drive'}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                        item.slipUrl
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>{item.slipUrl ? 'ดูสลิป Drive' : '+ แนบสลิป'}</span>
                    </button>

                    <button
                      id={`income-delete-btn-${item.id}`}
                      onClick={() =>
                        onOpenSlipModal({
                          type: 'income',
                          id: item.id,
                          currentSlipUrl: item.slipUrl,
                          title: `รับเงิน ${item.channel}`,
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
