import { PorkPurchase, AdExpense, OtherExpense, IncomeRecord } from '../types';

const STORE_DATA_STORAGE_KEY = 'pork_store_transactions_cache_v2';

export interface StoreAllData {
  porkPurchases: PorkPurchase[];
  adExpenses: AdExpense[];
  otherExpenses: OtherExpense[];
  incomeRecords: IncomeRecord[];
}

/**
 * Initial sample records if the user opens the app fresh
 */
const DEFAULT_INITIAL_DATA: StoreAllData = {
  porkPurchases: [],
  adExpenses: [],
  otherExpenses: [],
  incomeRecords: [],
};

/**
 * Load all transactions from local storage (preserving any previously saved data)
 */
export function getStoredStoreData(): StoreAllData {
  try {
    const raw = localStorage.getItem(STORE_DATA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        porkPurchases: Array.isArray(parsed.porkPurchases) ? parsed.porkPurchases : [],
        adExpenses: Array.isArray(parsed.adExpenses) ? parsed.adExpenses : [],
        otherExpenses: Array.isArray(parsed.otherExpenses) ? parsed.otherExpenses : [],
        incomeRecords: Array.isArray(parsed.incomeRecords) ? parsed.incomeRecords : [],
      };
    }
  } catch (err) {
    console.warn('Error reading store data from localStorage:', err);
  }
  return DEFAULT_INITIAL_DATA;
}

/**
 * Persist all transactions to local storage
 */
export function saveStoredStoreData(data: StoreAllData): void {
  try {
    localStorage.setItem(STORE_DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving store data to localStorage:', err);
  }
}

/**
 * Export data array to a downloadable CSV file (with UTF-8 BOM for Excel support in Thai)
 */
export function downloadCsvFile(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n');

  // Add UTF-8 BOM (\uFEFF) so Excel opens Thai characters without garbled text
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export specific transaction tables to CSV
 */
export function exportPorkPurchasesCsv(purchases: PorkPurchase[]): void {
  const headers = [
    'รหัสรายการ',
    'วันที่-เวลา',
    'จำนวนกิโล (กก.)',
    'ยอดเงินสั่งซื้อ (บาท)',
    'ราคาเฉลี่ยต่อ กก. (บาท)',
    'ลิงก์สลิป/หลักฐาน',
    'หมายเหตุ',
    'ผู้บันทึก',
  ];
  const rows = purchases.map((p) => [
    p.id,
    p.date,
    p.kilos,
    p.amount,
    p.pricePerKg,
    p.slipUrl,
    p.notes || '',
    p.userEmail || '',
  ]);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsvFile(`ร้านหมูยายหน่อย_รายจ่ายสั่งซื้อหมู_${dateStr}`, headers, rows);
}

export function exportAdExpensesCsv(expenses: AdExpense[]): void {
  const headers = [
    'รหัสรายการ',
    'วันที่-เวลา',
    'แพลตฟอร์มโฆษณา',
    'ยอดเงิน (บาท)',
    'ชื่อแคมเปญ',
    'ลิงก์สลิป/หลักฐาน',
    'หมายเหตุ',
    'ผู้บันทึก',
  ];
  const rows = expenses.map((a) => [
    a.id,
    a.date,
    a.platform,
    a.amount,
    a.campaignName,
    a.slipUrl,
    a.notes || '',
    a.userEmail || '',
  ]);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsvFile(`ร้านหมูยายหน่อย_รายจ่ายค่ายิงแอด_${dateStr}`, headers, rows);
}

export function exportOtherExpensesCsv(expenses: OtherExpense[]): void {
  const headers = [
    'รหัสรายการ',
    'วันที่-เวลา',
    'หมวดหมู่ค่าใช้จ่าย',
    'ยอดเงิน (บาท)',
    'รายละเอียด',
    'ลิงก์สลิป/หลักฐาน',
    'หมายเหตุ',
    'ผู้บันทึก',
  ];
  const rows = expenses.map((o) => [
    o.id,
    o.date,
    o.category,
    o.amount,
    o.description,
    o.slipUrl,
    o.notes || '',
    o.userEmail || '',
  ]);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsvFile(`ร้านหมูยายหน่อย_รายจ่ายอื่นๆ_${dateStr}`, headers, rows);
}

export function exportIncomeCsv(records: IncomeRecord[]): void {
  const headers = [
    'รหัสรายการ',
    'วันที่-เวลา',
    'ช่องทางรับเงิน',
    'ยอดเงิน (บาท)',
    'รายละเอียด',
    'ลิงก์สลิป/หลักฐาน',
    'หมายเหตุ',
    'ผู้บันทึก',
  ];
  const rows = records.map((i) => [
    i.id,
    i.date,
    i.channel,
    i.amount,
    i.description,
    i.slipUrl,
    i.notes || '',
    i.userEmail || '',
  ]);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsvFile(`ร้านหมูยายหน่อย_รายรับเงินเข้า_${dateStr}`, headers, rows);
}

export function exportAllSummaryCsv(data: StoreAllData): void {
  const totalPork = data.porkPurchases.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPorkKg = data.porkPurchases.reduce((acc, p) => acc + (p.kilos || 0), 0);
  const totalAds = data.adExpenses.reduce((acc, a) => acc + (a.amount || 0), 0);
  const totalOther = data.otherExpenses.reduce((acc, o) => acc + (o.amount || 0), 0);
  const totalExpense = totalPork + totalAds + totalOther;
  const totalIncome = data.incomeRecords.reduce((acc, i) => acc + (i.amount || 0), 0);
  const netProfit = totalIncome - totalExpense;

  const headers = ['หัวข้อสรุป', 'จำนวนเงิน (บาท)', 'หมายเหตุ'];
  const rows: (string | number)[][] = [
    ['รายรับเงินเข้าร้านทั้งหมด', totalIncome, `${data.incomeRecords.length} รายการ`],
    ['รายจ่ายสั่งซื้อเนื้อหมู', totalPork, `${totalPorkKg.toLocaleString()} กก.`],
    ['รายจ่ายค่ายิงแอดโฆษณา', totalAds, `${data.adExpenses.length} รายการ`],
    ['รายจ่ายอื่นๆ ในร้าน', totalOther, `${data.otherExpenses.length} รายการ`],
    ['รวมรายจ่ายทั้งหมด', totalExpense, ''],
    ['ยอดเงินคงเหลือสุทธิ (กำไร/ขาดทุน)', netProfit, netProfit >= 0 ? 'กำไร' : 'ขาดทุน'],
  ];

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsvFile(`ร้านหมูยายหน่อย_สรุปภาพรวมรายรับรายจ่าย_${dateStr}`, headers, rows);
}
