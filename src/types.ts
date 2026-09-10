export type TransactionType = 'pork' | 'ads' | 'other' | 'income';

export type ActiveTab = 'pork' | 'ads' | 'other' | 'income' | 'reports';

export type DateFilterType = 'all' | 'today' | '7days' | 'this_month' | 'custom';

export interface PorkPurchase {
  id: string;
  date: string; // ISO or YYYY-MM-DD HH:mm
  kilos: number; // จำนวนกิโล
  amount: number; // ยอดเงินสั่งซื้อ (บาท)
  pricePerKg: number; // ราคาเฉลี่ยต่อ กก.
  slipUrl: string; // ลิงก์รูปภาพสลิปบน Google Drive
  notes: string;
  userEmail: string;
  rowIndex?: number; // Row index in Google Sheets
}

export interface AdExpense {
  id: string;
  date: string;
  platform: string; // Facebook, TikTok, LINE, Google, อื่นๆ
  amount: number;
  campaignName: string;
  slipUrl: string;
  notes: string;
  userEmail: string;
  rowIndex?: number;
}

export interface OtherExpense {
  id: string;
  date: string;
  category: string; // ถุง/แพ็คเกจจิ้ง, ค่าขนส่ง/น้ำมัน, ค่าเช่า/น้ำไฟ, น้ำแข็ง/ตู้แช่, ค่าจ้าง, เบ็ดเตล็ด
  amount: number;
  description: string;
  slipUrl: string;
  notes: string;
  userEmail: string;
  rowIndex?: number;
}

export interface IncomeRecord {
  id: string;
  date: string;
  channel: string; // หน้าร้าน (เงินสด), โอนธนาคาร, สแกน QR, เดลิเวอรี่, ส่งร้านอาหาร/ราคาส่ง
  amount: number;
  description: string;
  slipUrl: string;
  notes: string;
  userEmail: string;
  rowIndex?: number;
}

export interface SlipEditTarget {
  type: TransactionType;
  id: string;
  currentSlipUrl: string;
  title: string;
  amount: number;
  rowIndex?: number;
}

export interface StoreSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  porkTotalKilos: number;
  porkTotalAmount: number;
  porkAvgPricePerKg: number;
  adsTotalAmount: number;
  otherTotalAmount: number;
  incomeCount: number;
  expenseCount: number;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

export interface GoogleSheetInfo {
  id: string;
  name: string;
  url: string;
}
