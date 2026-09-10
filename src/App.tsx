import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  setAccessToken,
} from './services/firebaseAuth';
import {
  getOrCreateSpreadsheet,
  fetchAllDataFromSheets,
  appendRowToSheet,
  updateRowSlipUrl,
  deleteRowFromSheet,
  SheetMetadata,
  getCachedSpreadsheetMetadata,
  getCachedSheetsData,
  setCachedSheetsData,
} from './services/googleSheetsService';
import {
  ActiveTab,
  PorkPurchase,
  AdExpense,
  OtherExpense,
  IncomeRecord,
  SlipEditTarget,
  GoogleSheetInfo,
} from './types';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { LoginView } from './components/LoginView';
import { PorkPurchasesView } from './components/PorkPurchasesView';
import { AdExpensesView } from './components/AdExpensesView';
import { OtherExpensesView } from './components/OtherExpensesView';
import { IncomeView } from './components/IncomeView';
import { ReportsView } from './components/ReportsView';
import { SlipModal } from './components/SlipModal';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // App data state (preloaded from cache if available for instant display)
  const initialCache = getCachedSheetsData();
  const [sheetMetadata, setSheetMetadata] = useState<SheetMetadata | null>(() => getCachedSpreadsheetMetadata());
  const [porkPurchases, setPorkPurchases] = useState<PorkPurchase[]>(initialCache.porkPurchases);
  const [adExpenses, setAdExpenses] = useState<AdExpense[]>(initialCache.adExpenses);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>(initialCache.otherExpenses);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>(initialCache.incomeRecords);

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('pork');
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [slipModalTarget, setSlipModalTarget] = useState<SlipEditTarget | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Refs to eliminate infinite re-render loops and race conditions
  const isFetchingRef = useRef(false);
  const sheetMetadataRef = useRef<SheetMetadata | null>(sheetMetadata);
  useEffect(() => {
    sheetMetadataRef.current = sheetMetadata;
  }, [sheetMetadata]);

  // Keep localStorage cache in sync with state changes
  useEffect(() => {
    if (
      porkPurchases.length > 0 ||
      adExpenses.length > 0 ||
      otherExpenses.length > 0 ||
      incomeRecords.length > 0
    ) {
      setCachedSheetsData({
        porkPurchases,
        adExpenses,
        otherExpenses,
        incomeRecords,
      });
    }
  }, [porkPurchases, adExpenses, otherExpenses, incomeRecords]);

  // Unified sync data with Google Sheets
  const syncData = useCallback(async (token: string, force = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      setIsDataLoading(true);
      let meta = sheetMetadataRef.current;
      if (!meta || !meta.id) {
        meta = await getOrCreateSpreadsheet(token);
        setSheetMetadata(meta);
        sheetMetadataRef.current = meta;
      }

      const allData = await fetchAllDataFromSheets(meta.id, token, force);
      setPorkPurchases(allData.porkPurchases);
      setAdExpenses(allData.adExpenses);
      setOtherExpenses(allData.otherExpenses);
      setIncomeRecords(allData.incomeRecords);
    } catch (err: any) {
      console.error('Error loading data from Google Sheets:', err);
      // Show descriptive message without clearing existing cached records
      showToast(err?.message || 'ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้', 'error');
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Auth state initialization on mount only - runs once to avoid infinite loops
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authedUser, token) => {
        setUser(authedUser);
        setToken(token);
        setAccessToken(token);
        setIsAuthLoading(false);
        syncData(token, false);
      },
      () => {
        setUser(null);
        setToken(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, [syncData]);

  // Handle Sign In with Google
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setAccessToken(res.accessToken);
        showToast(`ยินดีต้อนรับ ${res.user.displayName || res.user.email}`);
        await syncData(res.accessToken, false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err?.message || 'การเข้าสู่ระบบไม่สำเร็จ โปรดลองใหม่อีกครั้ง');
    }
  };

  // Handle Sign Out
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setAccessToken(null);
      showToast('ออกจากระบบเรียบร้อยแล้ว');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Manual refresh / sync with Google Sheets
  const handleRefresh = async () => {
    if (!accessToken) return;
    setIsRefreshing(true);
    await syncData(accessToken, true);
    showToast('ซิงค์ข้อมูลล่าสุดจาก Google Sheets สำเร็จ');
  };

  // 1. Add Pork Purchase
  const handleAddPorkPurchase = async (data: {
    kilos: number;
    amount: number;
    date: string;
    notes: string;
    slipUrl: string;
  }) => {
    if (!accessToken || !sheetMetadata) throw new Error('กรุณาเข้าสู่ระบบก่อน');

    const id = `PORK-${Date.now().toString().slice(-6)}`;
    const pricePerKg = data.kilos > 0 ? Math.round((data.amount / data.kilos) * 100) / 100 : 0;
    const userEmail = user?.email || '';

    // Append to Google Sheets: [ID, วันที่, กิโล, ยอดเงิน, เฉลี่ย, สลิป, หมายเหตุ, ผู้บันทึก]
    const rowValues = [
      id,
      data.date,
      data.kilos,
      data.amount,
      pricePerKg,
      data.slipUrl,
      data.notes,
      userEmail,
    ];

    const rowIndex = await appendRowToSheet(sheetMetadata.id, 'PorkPurchases', rowValues, accessToken);

    const newRecord: PorkPurchase = {
      id,
      date: data.date,
      kilos: data.kilos,
      amount: data.amount,
      pricePerKg,
      slipUrl: data.slipUrl,
      notes: data.notes,
      userEmail,
      rowIndex,
    };

    setPorkPurchases((prev) => [newRecord, ...prev]);
    showToast('บันทึกรายจ่ายสั่งซื้อหมูลง Google Sheets เรียบร้อย');
  };

  // 2. Add Ad Expense
  const handleAddAdExpense = async (data: {
    platform: string;
    amount: number;
    campaignName: string;
    date: string;
    notes: string;
    slipUrl: string;
  }) => {
    if (!accessToken || !sheetMetadata) throw new Error('กรุณาเข้าสู่ระบบก่อน');

    const id = `AD-${Date.now().toString().slice(-6)}`;
    const userEmail = user?.email || '';

    const rowValues = [
      id,
      data.date,
      data.platform,
      data.amount,
      data.campaignName,
      data.slipUrl,
      data.notes,
      userEmail,
    ];

    const rowIndex = await appendRowToSheet(sheetMetadata.id, 'AdExpenses', rowValues, accessToken);

    const newRecord: AdExpense = {
      id,
      date: data.date,
      platform: data.platform,
      amount: data.amount,
      campaignName: data.campaignName,
      slipUrl: data.slipUrl,
      notes: data.notes,
      userEmail,
      rowIndex,
    };

    setAdExpenses((prev) => [newRecord, ...prev]);
    showToast('บันทึกค่ายิงแอดลง Google Sheets เรียบร้อย');
  };

  // 3. Add Other Expense
  const handleAddOtherExpense = async (data: {
    category: string;
    amount: number;
    description: string;
    date: string;
    notes: string;
    slipUrl: string;
  }) => {
    if (!accessToken || !sheetMetadata) throw new Error('กรุณาเข้าสู่ระบบก่อน');

    const id = `EXP-${Date.now().toString().slice(-6)}`;
    const userEmail = user?.email || '';

    const rowValues = [
      id,
      data.date,
      data.category,
      data.amount,
      data.description,
      data.slipUrl,
      data.notes,
      userEmail,
    ];

    const rowIndex = await appendRowToSheet(sheetMetadata.id, 'OtherExpenses', rowValues, accessToken);

    const newRecord: OtherExpense = {
      id,
      date: data.date,
      category: data.category,
      amount: data.amount,
      description: data.description,
      slipUrl: data.slipUrl,
      notes: data.notes,
      userEmail,
      rowIndex,
    };

    setOtherExpenses((prev) => [newRecord, ...prev]);
    showToast('บันทึกรายจ่ายอื่นๆ ลง Google Sheets เรียบร้อย');
  };

  // 4. Add Income
  const handleAddIncome = async (data: {
    channel: string;
    amount: number;
    description: string;
    date: string;
    notes: string;
    slipUrl: string;
  }) => {
    if (!accessToken || !sheetMetadata) throw new Error('กรุณาเข้าสู่ระบบก่อน');

    const id = `INC-${Date.now().toString().slice(-6)}`;
    const userEmail = user?.email || '';

    const rowValues = [
      id,
      data.date,
      data.channel,
      data.amount,
      data.description,
      data.slipUrl,
      data.notes,
      userEmail,
    ];

    const rowIndex = await appendRowToSheet(sheetMetadata.id, 'Income', rowValues, accessToken);

    const newRecord: IncomeRecord = {
      id,
      date: data.date,
      channel: data.channel,
      amount: data.amount,
      description: data.description,
      slipUrl: data.slipUrl,
      notes: data.notes,
      userEmail,
      rowIndex,
    };

    setIncomeRecords((prev) => [newRecord, ...prev]);
    showToast('บันทึกยอดเงินเข้าร้านลง Google Sheets เรียบร้อย');
  };

  // 5. Update Google Drive Slip URL
  const handleSaveSlip = async (
    type: SlipEditTarget['type'],
    id: string,
    newSlipUrl: string,
    rowIndex?: number
  ) => {
    if (!accessToken || !sheetMetadata) throw new Error('กรุณาเข้าสู่ระบบ');

    const sheetNameMap: Record<SlipEditTarget['type'], string> = {
      pork: 'PorkPurchases',
      ads: 'AdExpenses',
      other: 'OtherExpenses',
      income: 'Income',
    };

    const sheetName = sheetNameMap[type];

    // If rowIndex exists, update in Google Sheets column F
    if (rowIndex && rowIndex > 1) {
      await updateRowSlipUrl(sheetMetadata.id, sheetName, rowIndex, newSlipUrl, accessToken);
    }

    // Update local state
    if (type === 'pork') {
      setPorkPurchases((prev) =>
        prev.map((item) => (item.id === id ? { ...item, slipUrl: newSlipUrl } : item))
      );
    } else if (type === 'ads') {
      setAdExpenses((prev) =>
        prev.map((item) => (item.id === id ? { ...item, slipUrl: newSlipUrl } : item))
      );
    } else if (type === 'other') {
      setOtherExpenses((prev) =>
        prev.map((item) => (item.id === id ? { ...item, slipUrl: newSlipUrl } : item))
      );
    } else if (type === 'income') {
      setIncomeRecords((prev) =>
        prev.map((item) => (item.id === id ? { ...item, slipUrl: newSlipUrl } : item))
      );
    }

    showToast('อัปเดตสลิปหลักฐาน Google Drive สำเร็จ');
  };

  // 6. Delete Record
  const handleDeleteRecord = async (
    type: SlipEditTarget['type'],
    id: string,
    rowIndex?: number
  ) => {
    if (!accessToken || !sheetMetadata) throw new Error('กรุณาเข้าสู่ระบบ');

    const sheetNameMap: Record<SlipEditTarget['type'], string> = {
      pork: 'PorkPurchases',
      ads: 'AdExpenses',
      other: 'OtherExpenses',
      income: 'Income',
    };

    const sheetName = sheetNameMap[type];
    const sheetId = sheetMetadata.sheetIds[sheetName];

    if (sheetId !== undefined && rowIndex && rowIndex > 1) {
      await deleteRowFromSheet(sheetMetadata.id, sheetId, rowIndex, accessToken).catch((err) =>
        console.warn('Google Sheet row delete warning:', err)
      );
    }

    // Update local state
    if (type === 'pork') {
      setPorkPurchases((prev) => prev.filter((item) => item.id !== id));
    } else if (type === 'ads') {
      setAdExpenses((prev) => prev.filter((item) => item.id !== id));
    } else if (type === 'other') {
      setOtherExpenses((prev) => prev.filter((item) => item.id !== id));
    } else if (type === 'income') {
      setIncomeRecords((prev) => prev.filter((item) => item.id !== id));
    }

    showToast('ลบรายการเรียบร้อยแล้ว');
  };

  // If initial auth check is loading
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-3" />
        <p className="text-sm font-medium">กำลังเตรียมระบบร้านขายหมู...</p>
      </div>
    );
  }

  // If user is not authenticated, show strict Login View
  if (!user || !accessToken) {
    return <LoginView onSignIn={handleSignIn} isLoading={isDataLoading} error={authError} />;
  }

  const sheetInfo: GoogleSheetInfo | null = sheetMetadata
    ? {
        id: sheetMetadata.id,
        name: sheetMetadata.name,
        url: sheetMetadata.url,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col pb-20 sm:pb-8">
      {/* Top Application Header */}
      <Navbar
        user={user}
        sheetInfo={sheetInfo}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Navigation Tabs */}
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t)}
          counts={{
            pork: porkPurchases.length,
            ads: adExpenses.length,
            other: otherExpenses.length,
            income: incomeRecords.length,
          }}
        />

        {/* Loading Indicator for Data fetch */}
        {isDataLoading && (
          <div className="mb-4 p-3 bg-rose-50/80 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-rose-600 shrink-0" />
              <span>กำลังดึงข้อมูลจาก Google Sheets และ Google Drive...</span>
            </div>
          </div>
        )}

        {/* View Routing */}
        {activeTab === 'pork' && (
          <PorkPurchasesView
            purchases={porkPurchases}
            onAddPurchase={handleAddPorkPurchase}
            onOpenSlipModal={(target) => setSlipModalTarget(target)}
            onDeletePurchase={(id, rowIndex) => handleDeleteRecord('pork', id, rowIndex)}
            isLoading={isDataLoading}
          />
        )}

        {activeTab === 'ads' && (
          <AdExpensesView
            expenses={adExpenses}
            onAddExpense={handleAddAdExpense}
            onOpenSlipModal={(target) => setSlipModalTarget(target)}
            onDeleteExpense={(id, rowIndex) => handleDeleteRecord('ads', id, rowIndex)}
            isLoading={isDataLoading}
          />
        )}

        {activeTab === 'other' && (
          <OtherExpensesView
            expenses={otherExpenses}
            onAddExpense={handleAddOtherExpense}
            onOpenSlipModal={(target) => setSlipModalTarget(target)}
            onDeleteExpense={(id, rowIndex) => handleDeleteRecord('other', id, rowIndex)}
            isLoading={isDataLoading}
          />
        )}

        {activeTab === 'income' && (
          <IncomeView
            records={incomeRecords}
            onAddIncome={handleAddIncome}
            onOpenSlipModal={(target) => setSlipModalTarget(target)}
            onDeleteIncome={(id, rowIndex) => handleDeleteRecord('income', id, rowIndex)}
            isLoading={isDataLoading}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            porkPurchases={porkPurchases}
            adExpenses={adExpenses}
            otherExpenses={otherExpenses}
            incomeRecords={incomeRecords}
            sheetInfo={sheetInfo}
          />
        )}
      </main>

      {/* Slip Modal for Viewing & Editing Google Drive Slips */}
      <SlipModal
        target={slipModalTarget}
        accessToken={accessToken}
        onClose={() => setSlipModalTarget(null)}
        onSaveSlip={handleSaveSlip}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          id="app-toast"
          className={`fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'bg-red-900 text-white border-red-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
