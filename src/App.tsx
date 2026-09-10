import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initAuth,
  googleSignIn,
  logout,
  setAccessToken,
  getStoredGoogleToken,
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
  connectCustomSpreadsheet,
  shareSpreadsheetWithTeam,
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
import {
  verifyCredentials,
  getSavedSession,
  saveSession,
  clearSession,
  StoreAuthUser,
  APP_CREDENTIALS,
  PRIMARY_OWNER_EMAIL,
} from './utils/authWhitelist';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { LoginView } from './components/LoginView';
import { PorkPurchasesView } from './components/PorkPurchasesView';
import { AdExpensesView } from './components/AdExpensesView';
import { OtherExpensesView } from './components/OtherExpensesView';
import { IncomeView } from './components/IncomeView';
import { ReportsView } from './components/ReportsView';
import { SlipModal } from './components/SlipModal';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  // Primary Store Authentication state (Username & Password)
  const [appUser, setAppUser] = useState<StoreAuthUser | null>(() => getSavedSession());
  const [accessToken, setToken] = useState<string | null>(() => getStoredGoogleToken());

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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
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

  // Unified sync data with Google Sheets of lanceojoe@gmail.com
  const syncData = useCallback(async (token: string, force = false, overrideEmail?: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      setIsDataLoading(true);
      let meta = sheetMetadataRef.current;
      if (!meta || !meta.id) {
        const email = overrideEmail || PRIMARY_OWNER_EMAIL;
        meta = await getOrCreateSpreadsheet(token, email);
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
      showToast(err?.message || 'ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้', 'error');
    } finally {
      setIsDataLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Background Google Auth sync initialization on mount
  useEffect(() => {
    const savedToken = getStoredGoogleToken();
    if (savedToken) {
      setToken(savedToken);
      syncData(savedToken, false, PRIMARY_OWNER_EMAIL);
    }

    const unsubscribe = initAuth(
      async (_authedUser, token) => {
        setToken(token);
        setAccessToken(token);
        syncData(token, false, PRIMARY_OWNER_EMAIL);
      },
      () => {
        // Offline or token expired; user can connect anytime via Navbar
      }
    );

    return () => unsubscribe();
  }, [syncData]);

  // Handle Login with Username & Password
  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const isValid = verifyCredentials(username, password);
    if (!isValid) {
      return false;
    }

    const sessionUser: StoreAuthUser = {
      username: APP_CREDENTIALS.username,
      displayName: 'ร้านหมูยายหน่อย',
      role: 'ผู้ดูแลระบบร้าน',
      loggedInAt: Date.now(),
    };

    saveSession(sessionUser);
    setAppUser(sessionUser);
    showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ร้านหมูยายหน่อย');

    // If Google token already cached, trigger data sync
    const savedToken = getStoredGoogleToken();
    if (savedToken) {
      setToken(savedToken);
      syncData(savedToken, false, PRIMARY_OWNER_EMAIL);
    }
    return true;
  };

  // Handle Logout
  const handleLogout = async () => {
    clearSession();
    setAppUser(null);
    try {
      await logout();
    } catch {
      // ignore
    }
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  // Handle Connect with Google Sheets (lanceojoe@gmail.com)
  const handleConnectGoogleSheets = async () => {
    try {
      setIsDataLoading(true);
      const res = await googleSignIn();
      if (res?.accessToken) {
        setToken(res.accessToken);
        setAccessToken(res.accessToken);
        showToast('เชื่อมต่อ Google Sheets (lanceojoe@gmail.com) สำเร็จ');
        await syncData(res.accessToken, true, PRIMARY_OWNER_EMAIL);
      }
    } catch (err: any) {
      console.error('Google Sheets connection error:', err);
      showToast(err?.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้', 'error');
    } finally {
      setIsDataLoading(false);
    }
  };

  // Manual refresh / sync with Google Sheets
  const handleRefresh = async () => {
    if (!accessToken) {
      showToast('กรุณากดเชื่อมต่อ Google Sheets ก่อนทำการซิงค์', 'error');
      return;
    }
    setIsRefreshing(true);
    await syncData(accessToken, true, PRIMARY_OWNER_EMAIL);
    showToast('ซิงค์ข้อมูลล่าสุดจาก Google Sheets สำเร็จ');
  };

  // Connect custom spreadsheet URL or ID
  const handleConnectCustomSheet = async (urlOrId: string) => {
    if (!accessToken) {
      throw new Error('กรุณากดเชื่อมต่อ Google Sheets ก่อนเปลี่ยนการตั้งค่า');
    }
    const newMeta = await connectCustomSpreadsheet(urlOrId, accessToken);
    setSheetMetadata(newMeta);
    sheetMetadataRef.current = newMeta;
    await syncData(accessToken, true, PRIMARY_OWNER_EMAIL);
    showToast('เชื่อมต่อ Google Sheets หลักสำเร็จเรียบร้อย');
  };

  // Share spreadsheet with team
  const handleShareWithTeam = async () => {
    if (!accessToken || !sheetMetadata?.id) {
      throw new Error('ไม่พบข้อมูล Google Sheets เพื่อแชร์สิทธิ์');
    }
    return await shareSpreadsheetWithTeam(sheetMetadata.id, accessToken);
  };

  // 1. Add Pork Purchase
  const handleAddPorkPurchase = async (data: {
    kilos: number;
    amount: number;
    date: string;
    notes: string;
    slipUrl: string;
  }) => {
    const id = `PORK-${Date.now().toString().slice(-6)}`;
    const pricePerKg = data.kilos > 0 ? Math.round((data.amount / data.kilos) * 100) / 100 : 0;
    const userEmail = appUser?.username || 'mooyainoi';

    let rowIndex: number | undefined;

    // Append to Google Sheets if connected
    if (accessToken && sheetMetadata?.id) {
      try {
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
        rowIndex = await appendRowToSheet(sheetMetadata.id, 'PorkPurchases', rowValues, accessToken);
      } catch (err) {
        console.warn('Could not append row to Google Sheets:', err);
      }
    }

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
    showToast(
      accessToken && sheetMetadata?.id
        ? 'บันทึกรายจ่ายสั่งซื้อหมูลง Google Sheets เรียบร้อย'
        : 'บันทึกในระบบเรียบร้อย (เชื่อมต่อ Google Sheets เพื่อซิงค์ขึ้นคลาวด์)'
    );
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
    const id = `AD-${Date.now().toString().slice(-6)}`;
    const userEmail = appUser?.username || 'mooyainoi';

    let rowIndex: number | undefined;

    if (accessToken && sheetMetadata?.id) {
      try {
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
        rowIndex = await appendRowToSheet(sheetMetadata.id, 'AdExpenses', rowValues, accessToken);
      } catch (err) {
        console.warn('Could not append row to Google Sheets:', err);
      }
    }

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
    showToast(
      accessToken && sheetMetadata?.id
        ? 'บันทึกค่ายิงแอดลง Google Sheets เรียบร้อย'
        : 'บันทึกในระบบเรียบร้อย (เชื่อมต่อ Google Sheets เพื่อซิงค์ขึ้นคลาวด์)'
    );
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
    const id = `EXP-${Date.now().toString().slice(-6)}`;
    const userEmail = appUser?.username || 'mooyainoi';

    let rowIndex: number | undefined;

    if (accessToken && sheetMetadata?.id) {
      try {
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
        rowIndex = await appendRowToSheet(sheetMetadata.id, 'OtherExpenses', rowValues, accessToken);
      } catch (err) {
        console.warn('Could not append row to Google Sheets:', err);
      }
    }

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
    showToast(
      accessToken && sheetMetadata?.id
        ? 'บันทึกรายจ่ายอื่นๆ ลง Google Sheets เรียบร้อย'
        : 'บันทึกในระบบเรียบร้อย (เชื่อมต่อ Google Sheets เพื่อซิงค์ขึ้นคลาวด์)'
    );
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
    const id = `INC-${Date.now().toString().slice(-6)}`;
    const userEmail = appUser?.username || 'mooyainoi';

    let rowIndex: number | undefined;

    if (accessToken && sheetMetadata?.id) {
      try {
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
        rowIndex = await appendRowToSheet(sheetMetadata.id, 'Income', rowValues, accessToken);
      } catch (err) {
        console.warn('Could not append row to Google Sheets:', err);
      }
    }

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
    showToast(
      accessToken && sheetMetadata?.id
        ? 'บันทึกยอดเงินเข้าร้านลง Google Sheets เรียบร้อย'
        : 'บันทึกในระบบเรียบร้อย (เชื่อมต่อ Google Sheets เพื่อซิงค์ขึ้นคลาวด์)'
    );
  };

  // 5. Update Google Drive Slip URL
  const handleSaveSlip = async (
    type: SlipEditTarget['type'],
    id: string,
    newSlipUrl: string,
    rowIndex?: number
  ) => {
    const sheetNameMap: Record<SlipEditTarget['type'], string> = {
      pork: 'PorkPurchases',
      ads: 'AdExpenses',
      other: 'OtherExpenses',
      income: 'Income',
    };

    const sheetName = sheetNameMap[type];

    // If Google Sheets is connected and rowIndex exists, update in Google Sheets column F
    if (accessToken && sheetMetadata && rowIndex && rowIndex > 1) {
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

    showToast('อัปเดตสลิปหลักฐานสำเร็จ');
  };

  // 6. Delete Record
  const handleDeleteRecord = async (
    type: SlipEditTarget['type'],
    id: string,
    rowIndex?: number
  ) => {
    const sheetNameMap: Record<SlipEditTarget['type'], string> = {
      pork: 'PorkPurchases',
      ads: 'AdExpenses',
      other: 'OtherExpenses',
      income: 'Income',
    };

    const sheetName = sheetNameMap[type];

    if (accessToken && sheetMetadata) {
      const sheetId = sheetMetadata.sheetIds[sheetName];
      if (sheetId !== undefined && rowIndex && rowIndex > 1) {
        await deleteRowFromSheet(sheetMetadata.id, sheetId, rowIndex, accessToken).catch((err) =>
          console.warn('Google Sheet row delete warning:', err)
        );
      }
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

  // If user is not authenticated with username & password, show Login View
  if (!appUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  const sheetInfo: GoogleSheetInfo | null = sheetMetadata
    ? {
        id: sheetMetadata.id,
        name: sheetMetadata.name,
        url: sheetMetadata.url,
      }
    : null;

  const isSheetsConnected = Boolean(accessToken && sheetMetadata?.id);

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col pb-20 sm:pb-8">
      {/* Top Application Header */}
      <Navbar
        user={appUser}
        sheetInfo={sheetInfo}
        isSheetsConnected={isSheetsConnected}
        onConnectGoogleSheets={handleConnectGoogleSheets}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
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

        {/* Sync notification banner if not connected to Google Sheets */}
        {!isSheetsConnected && (
          <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <div>
                <span className="font-semibold">ยังไม่ได้เชื่อมต่อ Google Sheets:</span>{' '}
                <span className="text-slate-600">
                  ระบบจัดเก็บข้อมูลลงเครื่องชั่วคราว คลิกปุ่มเพื่อซิงค์ข้อมูลกับบัญชี {PRIMARY_OWNER_EMAIL}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleConnectGoogleSheets}
              className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              เชื่อมต่อ Google Sheets
            </button>
          </div>
        )}

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

      {/* Sheet & Team Settings Modal */}
      <SheetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        metadata={sheetMetadata}
        currentUserEmail={PRIMARY_OWNER_EMAIL}
        onConnectCustomSheet={handleConnectCustomSheet}
        onShareWithTeam={handleShareWithTeam}
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
