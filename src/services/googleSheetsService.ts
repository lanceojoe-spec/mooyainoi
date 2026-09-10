import { PorkPurchase, AdExpense, OtherExpense, IncomeRecord } from '../types';
import { PRIMARY_OWNER_EMAIL, AUTHORIZED_EMAILS, isPrimaryOwner } from '../utils/authWhitelist';

const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

export const SPREADSHEET_TITLE = 'ระบบบัญชีและจัดการร้านหมู (Pork Store)';
const SPREADSHEET_CACHE_KEY = 'pork_store_spreadsheet_id_v2';
const SPREADSHEET_META_KEY = 'pork_store_spreadsheet_metadata_v2';
const DATA_CACHE_KEY = 'pork_store_transactions_cache_v2';

export interface SheetMetadata {
  id: string;
  name: string;
  url: string;
  sheetIds: Record<string, number>; // title -> sheetId
  ownerEmail?: string;
}

export interface CachedAllData {
  porkPurchases: PorkPurchase[];
  adExpenses: AdExpense[];
  otherExpenses: OtherExpense[];
  incomeRecords: IncomeRecord[];
}

const DEFAULT_HEADERS = {
  PorkPurchases: [
    'รหัสรายการ',
    'วันที่-เวลา',
    'จำนวนกิโล (กก.)',
    'ยอดเงินสั่งซื้อ (บาท)',
    'ราคาเฉลี่ยต่อ กก. (บาท/กก.)',
    'ลิงก์สลิป Google Drive',
    'หมายเหตุ',
    'ผู้บันทึก',
  ],
  AdExpenses: [
    'รหัสรายการ',
    'วันที่-เวลา',
    'แพลตฟอร์มโฆษณา',
    'ยอดเงิน (บาท)',
    'ชื่อแคมเปญ/รายละเอียด',
    'ลิงก์สลิป Google Drive',
    'หมายเหตุ',
    'ผู้บันทึก',
  ],
  OtherExpenses: [
    'รหัสรายการ',
    'วันที่-เวลา',
    'หมวดหมู่ค่าใช้จ่าย',
    'ยอดเงิน (บาท)',
    'รายละเอียด',
    'ลิงก์สลิป Google Drive',
    'หมายเหตุ',
    'ผู้บันทึก',
  ],
  Income: [
    'รหัสรายการ',
    'วันที่-เวลา',
    'ช่องทางรับเงิน',
    'ยอดเงินรับ (บาท)',
    'รายละเอียดสินค้า/บิล',
    'ลิงก์สลิป Google Drive',
    'หมายเหตุ',
    'ผู้บันทึก',
  ],
};

// --- Local Storage Cache Utilities ---

export function getCachedSpreadsheetMetadata(): SheetMetadata | null {
  try {
    const raw = localStorage.getItem(SPREADSHEET_META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.sheetIds) {
      return parsed as SheetMetadata;
    }
  } catch {
    // ignore parse error
  }
  return null;
}

export function setCachedSpreadsheetMetadata(meta: SheetMetadata): void {
  try {
    localStorage.setItem(SPREADSHEET_META_KEY, JSON.stringify(meta));
    localStorage.setItem(SPREADSHEET_CACHE_KEY, meta.id);
  } catch {
    // ignore storage error
  }
}

export function getCachedSheetsData(): CachedAllData {
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        porkPurchases: Array.isArray(parsed.porkPurchases) ? parsed.porkPurchases : [],
        adExpenses: Array.isArray(parsed.adExpenses) ? parsed.adExpenses : [],
        otherExpenses: Array.isArray(parsed.otherExpenses) ? parsed.otherExpenses : [],
        incomeRecords: Array.isArray(parsed.incomeRecords) ? parsed.incomeRecords : [],
      };
    }
  } catch {
    // ignore parse error
  }
  return {
    porkPurchases: [],
    adExpenses: [],
    otherExpenses: [],
    incomeRecords: [],
  };
}

export function setCachedSheetsData(data: CachedAllData): void {
  try {
    localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage quota error
  }
}

// In-memory throttling
let lastFetchTime = 0;
let inFlightFetchPromise: Promise<CachedAllData> | null = null;

/**
 * Resilient fetch wrapper with exponential backoff and quota rate-limit detection
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  baseDelayMs = 1500
): Promise<Response> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);

      // Handle 429 Too Many Requests (Rate limit / Quota exceeded)
      if (res.status === 429) {
        if (attempt < retries) {
          const waitTime = baseDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        const errJson = await res.json().catch(() => ({}));
        const rawMsg = errJson?.error?.message || '';
        if (rawMsg.includes('Quota exceeded') || rawMsg.includes('quota metric')) {
          throw new Error(
            'โควตาการเรียกใช้งาน Google Sheets เต็มชั่วคราว (Quota exceeded per minute) ระบบกำลังแสดงข้อมูลล่าสุดจากแคช กรุณารอสักครู่ (ประมาณ 30-60 วินาที) แล้วกดซิงค์ใหม่อีกครั้ง'
          );
        }
        throw new Error(
          'คำขอใช้งาน Google Sheets ถี่เกินไป (Rate Limit Exceeded) กรุณารอสักครู่แล้วลองใหม่'
        );
      }

      return res;
    } catch (err: any) {
      lastError = err;
      if (err?.message?.includes('โควตาการเรียกใช้งาน Google Sheets')) {
        throw err;
      }
      if (attempt < retries) {
        const waitTime = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      // If Failed to fetch (e.g. network interruption or Google API dropped connection)
      if (err?.name === 'TypeError' && err?.message === 'Failed to fetch') {
        throw new Error(
          'ไม่สามารถเชื่อมต่อ Google Sheets API ได้ชั่วคราว (Failed to fetch) กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
        );
      }
      throw err;
    }
  }

  throw lastError || new Error('ไม่สามารถเชื่อมต่อบริการ Google ได้');
}

/**
 * Automatically share the master spreadsheet with all authorized team members
 */
export async function shareSpreadsheetWithTeam(
  fileId: string,
  accessToken: string
): Promise<{ success: boolean; sharedEmails: string[]; failedEmails: string[] }> {
  // Only share with team members other than the primary owner
  const teamEmails = AUTHORIZED_EMAILS.filter((e) => e.toLowerCase() !== PRIMARY_OWNER_EMAIL.toLowerCase());
  const sharedEmails: string[] = [];
  const failedEmails: string[] = [];

  for (const email of teamEmails) {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?sendNotificationEmail=false`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'user',
          emailAddress: email,
        }),
      });

      if (res.ok) {
        sharedEmails.push(email);
      } else {
        // If already shared or permission exists, it might return 400/409, which is fine
        const errJson = await res.json().catch(() => ({}));
        if (errJson?.error?.message?.includes('already')) {
          sharedEmails.push(email);
        } else {
          failedEmails.push(email);
        }
      }
    } catch {
      failedEmails.push(email);
    }
  }

  return {
    success: failedEmails.length === 0,
    sharedEmails,
    failedEmails,
  };
}

/**
 * Helper to extract Google Spreadsheet ID from either raw ID or URL
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Connect to an existing master Google Spreadsheet by URL or ID
 */
export async function connectCustomSpreadsheet(
  urlOrId: string,
  accessToken: string
): Promise<SheetMetadata> {
  const spreadsheetId = extractSpreadsheetId(urlOrId);
  if (!spreadsheetId || spreadsheetId.length < 10) {
    throw new Error('รูปแบบรหัสหรือลิงก์ Google Sheets ไม่ถูกต้อง');
  }

  // Fetch spreadsheet structure
  const res = await fetchWithRetry(`${SHEETS_API_URL}/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'ไม่สามารถเปิด Google Sheets ตามรหัสที่ระบุได้ โปรดตรวจสอบสิทธิ์การเข้าถึง');
  }

  const data = await res.json();
  const sheetIds: Record<string, number> = {};
  data.sheets?.forEach((s: any) => {
    if (s.properties?.title) {
      sheetIds[s.properties.title] = s.properties.sheetId;
    }
  });

  // Ensure necessary tabs exist, if missing we create them or default to sheet 0
  const requiredTabs = ['PorkPurchases', 'AdExpenses', 'OtherExpenses', 'Income'];
  const missingTabs = requiredTabs.filter((tab) => sheetIds[tab] === undefined);

  if (missingTabs.length > 0) {
    // Add missing tabs
    const addSheetRequests = missingTabs.map((title) => ({
      addSheet: { properties: { title } },
    }));

    await fetch(`${SHEETS_API_URL}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: addSheetRequests }),
    }).catch((e) => console.warn('Could not add missing tabs:', e));

    // Refetch sheet structure
    const refetch = await fetch(`${SHEETS_API_URL}/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (refetch.ok) {
      const refetchData = await refetch.json();
      refetchData.sheets?.forEach((s: any) => {
        if (s.properties?.title) {
          sheetIds[s.properties.title] = s.properties.sheetId;
        }
      });
    }
  }

  // Ensure headers exist
  const headerData = [
    { range: 'PorkPurchases!A1:H1', values: [DEFAULT_HEADERS.PorkPurchases] },
    { range: 'AdExpenses!A1:H1', values: [DEFAULT_HEADERS.AdExpenses] },
    { range: 'OtherExpenses!A1:H1', values: [DEFAULT_HEADERS.OtherExpenses] },
    { range: 'Income!A1:H1', values: [DEFAULT_HEADERS.Income] },
  ];

  await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerData,
    }),
  }).catch(() => {});

  const meta: SheetMetadata = {
    id: spreadsheetId,
    name: data.properties?.title || SPREADSHEET_TITLE,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetIds,
    ownerEmail: PRIMARY_OWNER_EMAIL,
  };

  setCachedSpreadsheetMetadata(meta);
  return meta;
}

/**
 * Find or create the master pork store spreadsheet in Google Sheets.
 * Strictly enforces that data is stored in lanceojoe@gmail.com's spreadsheet only.
 */
export async function getOrCreateSpreadsheet(
  accessToken: string,
  currentUserEmail?: string
): Promise<SheetMetadata> {
  const isOwner = isPrimaryOwner(currentUserEmail);

  // 1. Check local cached metadata first
  const cachedMeta = getCachedSpreadsheetMetadata();
  if (cachedMeta && cachedMeta.id && cachedMeta.sheetIds && Object.keys(cachedMeta.sheetIds).length >= 4) {
    // If owner is logged in, silently ensure sharing with team in background
    if (isOwner) {
      shareSpreadsheetWithTeam(cachedMeta.id, accessToken).catch(() => {});
    }
    return cachedMeta;
  }

  const cachedId = localStorage.getItem(SPREADSHEET_CACHE_KEY);

  // If cached ID exists, check if valid
  if (cachedId) {
    try {
      const res = await fetchWithRetry(`${SHEETS_API_URL}/${cachedId}?fields=spreadsheetId,properties.title,sheets.properties`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const sheetIds: Record<string, number> = {};
        data.sheets?.forEach((s: any) => {
          if (s.properties?.title) {
            sheetIds[s.properties.title] = s.properties.sheetId;
          }
        });
        const meta: SheetMetadata = {
          id: data.spreadsheetId,
          name: data.properties?.title || SPREADSHEET_TITLE,
          url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
          sheetIds,
          ownerEmail: PRIMARY_OWNER_EMAIL,
        };
        setCachedSpreadsheetMetadata(meta);
        if (isOwner) {
          shareSpreadsheetWithTeam(data.spreadsheetId, accessToken).catch(() => {});
        }
        return meta;
      }
    } catch {
      // If invalid, clear cache
      localStorage.removeItem(SPREADSHEET_CACHE_KEY);
      localStorage.removeItem(SPREADSHEET_META_KEY);
    }
  }

  // 2. Search existing file in Google Drive (searches for files owned by lanceojoe or shared with the user)
  try {
    const query = encodeURIComponent(
      `name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const driveRes = await fetchWithRetry(`${DRIVE_API_URL}/files?q=${query}&fields=files(id,name,owners)`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (driveRes.ok) {
      const driveData = await driveRes.json();
      if (driveData.files && driveData.files.length > 0) {
        const fileId = driveData.files[0].id;

        // Fetch sheet tabs
        const sheetRes = await fetchWithRetry(`${SHEETS_API_URL}/${fileId}?fields=spreadsheetId,properties.title,sheets.properties`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (sheetRes.ok) {
          const sheetData = await sheetRes.json();
          const sheetIds: Record<string, number> = {};
          sheetData.sheets?.forEach((s: any) => {
            if (s.properties?.title) {
              sheetIds[s.properties.title] = s.properties.sheetId;
            }
          });
          const meta: SheetMetadata = {
            id: fileId,
            name: driveData.files[0].name,
            url: `https://docs.google.com/spreadsheets/d/${fileId}/edit`,
            sheetIds,
            ownerEmail: PRIMARY_OWNER_EMAIL,
          };
          setCachedSpreadsheetMetadata(meta);
          if (isOwner) {
            shareSpreadsheetWithTeam(fileId, accessToken).catch(() => {});
          }
          return meta;
        }
      }
    }
  } catch (err) {
    console.warn('Error querying Drive for spreadsheet:', err);
  }

  // 3. If file not found in Drive:
  // ONLY lanceojoe@gmail.com can create the master spreadsheet!
  if (!isOwner && currentUserEmail) {
    throw new Error(
      `ยังไม่พบ Google Sheets หลักของ ${PRIMARY_OWNER_EMAIL} ใน Google Drive ของคุณ ระบบกำหนดให้เก็บข้อมูลเข้าบัญชี ${PRIMARY_OWNER_EMAIL} เท่านั้น กรุณาให้ ${PRIMARY_OWNER_EMAIL} เข้าสู่ระบบเป็นคนแรกเพื่อสร้างและแชร์ชีต หรือนำลิงก์/รหัส Google Sheets ที่แชร์ไว้มากรอกเพื่อเชื่อมต่อ`
    );
  }

  // Create new spreadsheet under lanceojoe@gmail.com
  const newSpreadsheetBody = {
    properties: {
      title: SPREADSHEET_TITLE,
    },
    sheets: [
      { properties: { title: 'PorkPurchases' } },
      { properties: { title: 'AdExpenses' } },
      { properties: { title: 'OtherExpenses' } },
      { properties: { title: 'Income' } },
    ],
  };

  const createRes = await fetchWithRetry(SHEETS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newSpreadsheetBody),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'ไม่สามารถสร้าง Google Sheets ได้');
  }

  const newSheet = await createRes.json();
  const spreadsheetId = newSheet.spreadsheetId;

  const sheetIds: Record<string, number> = {};
  newSheet.sheets?.forEach((s: any) => {
    if (s.properties?.title) {
      sheetIds[s.properties.title] = s.properties.sheetId;
    }
  });

  // 4. Write header rows to each tab
  const headerData = [
    { range: 'PorkPurchases!A1:H1', values: [DEFAULT_HEADERS.PorkPurchases] },
    { range: 'AdExpenses!A1:H1', values: [DEFAULT_HEADERS.AdExpenses] },
    { range: 'OtherExpenses!A1:H1', values: [DEFAULT_HEADERS.OtherExpenses] },
    { range: 'Income!A1:H1', values: [DEFAULT_HEADERS.Income] },
  ];

  await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerData,
    }),
  }).catch((e) => console.warn('Could not set headers:', e));

  // 5. Automatically share the newly created spreadsheet with the team members
  await shareSpreadsheetWithTeam(spreadsheetId, accessToken).catch((e) =>
    console.warn('Initial share failed:', e)
  );

  const finalMeta: SheetMetadata = {
    id: spreadsheetId,
    name: SPREADSHEET_TITLE,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetIds,
    ownerEmail: PRIMARY_OWNER_EMAIL,
  };
  setCachedSpreadsheetMetadata(finalMeta);
  return finalMeta;
}

/**
 * Fetch all transaction records from the 4 tabs of the spreadsheet.
 * Includes throttling and local caching to prevent rate-limit exhaustion.
 */
export async function fetchAllDataFromSheets(
  spreadsheetId: string,
  accessToken: string,
  forceRefresh = false
): Promise<CachedAllData> {
  const now = Date.now();

  // If a fetch is currently in flight, reuse the promise
  if (inFlightFetchPromise) {
    return inFlightFetchPromise;
  }

  // If fetched recently (within 4 seconds) and not forced, return cached data to protect quota
  if (!forceRefresh && now - lastFetchTime < 4000) {
    const cached = getCachedSheetsData();
    if (cached.porkPurchases.length > 0 || cached.incomeRecords.length > 0) {
      return cached;
    }
  }

  const doFetch = async (): Promise<CachedAllData> => {
    const ranges = [
      'PorkPurchases!A2:H',
      'AdExpenses!A2:H',
      'OtherExpenses!A2:H',
      'Income!A2:H',
    ];

    const url = `${SHEETS_API_URL}/${spreadsheetId}/values:batchGet?${ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&')}`;

    const res = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้');
    }

    const data = await res.json();
    const valueRanges = data.valueRanges || [];

    // 1. Pork Purchases
    const porkRows = valueRanges[0]?.values || [];
    const porkPurchases: PorkPurchase[] = porkRows
      .map((row: string[], idx: number) => {
        const kilos = parseFloat(row[2]) || 0;
        const amount = parseFloat(row[3]) || 0;
        const pricePerKg = parseFloat(row[4]) || (kilos > 0 ? Math.round((amount / kilos) * 100) / 100 : 0);
        return {
          id: row[0] || `PORK-${idx + 1}`,
          date: row[1] || '',
          kilos,
          amount,
          pricePerKg,
          slipUrl: row[5] || '',
          notes: row[6] || '',
          userEmail: row[7] || '',
          rowIndex: idx + 2, // 1-based, skipping header row 1
        };
      })
      .filter((p: PorkPurchase) => p.amount > 0 || p.kilos > 0 || p.date);

    // 2. Ad Expenses
    const adRows = valueRanges[1]?.values || [];
    const adExpenses: AdExpense[] = adRows
      .map((row: string[], idx: number) => {
        return {
          id: row[0] || `AD-${idx + 1}`,
          date: row[1] || '',
          platform: row[2] || 'Facebook Ads',
          amount: parseFloat(row[3]) || 0,
          campaignName: row[4] || '',
          slipUrl: row[5] || '',
          notes: row[6] || '',
          userEmail: row[7] || '',
          rowIndex: idx + 2,
        };
      })
      .filter((a: AdExpense) => a.amount > 0 || a.date);

    // 3. Other Expenses
    const otherRows = valueRanges[2]?.values || [];
    const otherExpenses: OtherExpense[] = otherRows
      .map((row: string[], idx: number) => {
        return {
          id: row[0] || `EXP-${idx + 1}`,
          date: row[1] || '',
          category: row[2] || 'เบ็ดเตล็ด',
          amount: parseFloat(row[3]) || 0,
          description: row[4] || '',
          slipUrl: row[5] || '',
          notes: row[6] || '',
          userEmail: row[7] || '',
          rowIndex: idx + 2,
        };
      })
      .filter((o: OtherExpense) => o.amount > 0 || o.date);

    // 4. Income
    const incomeRows = valueRanges[3]?.values || [];
    const incomeRecords: IncomeRecord[] = incomeRows
      .map((row: string[], idx: number) => {
        return {
          id: row[0] || `INC-${idx + 1}`,
          date: row[1] || '',
          channel: row[2] || 'หน้าร้าน',
          amount: parseFloat(row[3]) || 0,
          description: row[4] || '',
          slipUrl: row[5] || '',
          notes: row[6] || '',
          userEmail: row[7] || '',
          rowIndex: idx + 2,
        };
      })
      .filter((i: IncomeRecord) => i.amount > 0 || i.date);

    const result: CachedAllData = {
      porkPurchases,
      adExpenses,
      otherExpenses,
      incomeRecords,
    };

    lastFetchTime = Date.now();
    setCachedSheetsData(result);
    return result;
  };

  inFlightFetchPromise = doFetch().finally(() => {
    inFlightFetchPromise = null;
  });

  return inFlightFetchPromise;
}

/**
 * Append a new record row to a designated sheet
 */
export async function appendRowToSheet(
  spreadsheetId: string,
  sheetName: string,
  values: (string | number)[],
  accessToken: string
): Promise<number> {
  const url = `${SHEETS_API_URL}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:H:append?valueInputOption=USER_ENTERED`;

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'ไม่สามารถบันทึกข้อมูลลง Google Sheets ได้');
  }

  const data = await res.json();
  const updatedRange = data.updates?.updatedRange || '';
  const match = updatedRange.match(/!A(\d+):/);
  return match ? parseInt(match[1], 10) : 2;
}

/**
 * Update the Google Drive slip URL for a specific row in column F
 */
export async function updateRowSlipUrl(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  slipUrl: string,
  accessToken: string
): Promise<void> {
  const cellRange = `${sheetName}!F${rowIndex}`;
  const url = `${SHEETS_API_URL}/${spreadsheetId}/values/${encodeURIComponent(cellRange)}?valueInputOption=USER_ENTERED`;

  const res = await fetchWithRetry(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[slipUrl]],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'ไม่สามารถอัปเดตสลิปใน Google Sheets ได้');
  }
}

/**
 * Delete or clear a row in Google Sheets
 */
export async function deleteRowFromSheet(
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number,
  accessToken: string
): Promise<void> {
  const url = `${SHEETS_API_URL}/${spreadsheetId}:batchUpdate`;
  const body = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-based inclusive
            endIndex: rowIndex, // 0-based exclusive
          },
        },
      },
    ],
  };

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'ไม่สามารถลบรายการใน Google Sheets ได้');
  }
}
