/**
 * Thai Currency & Date Formatting Utilities
 */

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0.00 บาท';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ฿';
}

export function formatNumber(num: number, decimals: number = 2): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function getCurrentThaiDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    // Thai month abbreviations
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const thaiYear = d.getFullYear() + 543;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${thaiYear} (${hours}:${minutes} น.)`;
  } catch {
    return dateStr;
  }
}

export function isDateInFilter(dateStr: string, filter: 'all' | 'today' | '7days' | 'this_month' | 'custom', customStart?: string, customEnd?: string): boolean {
  if (filter === 'all') return true;
  if (!dateStr) return true;

  try {
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return true;

    const now = new Date();
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (filter === 'today') {
      return itemDateOnly === nowDateOnly;
    }

    if (filter === '7days') {
      const sevenDaysAgo = nowDateOnly - 7 * 24 * 60 * 60 * 1000;
      return itemDateOnly >= sevenDaysAgo && itemDateOnly <= nowDateOnly;
    }

    if (filter === 'this_month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }

    if (filter === 'custom' && customStart) {
      const start = new Date(customStart).getTime();
      const end = customEnd ? new Date(customEnd + 'T23:59:59').getTime() : Number.MAX_SAFE_INTEGER;
      const itemTime = itemDate.getTime();
      return itemTime >= start && itemTime <= end;
    }

    return true;
  } catch {
    return true;
  }
}
