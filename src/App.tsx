import { useState, useEffect } from 'react';
import {
  ActiveTab,
  PorkPurchase,
  AdExpense,
  OtherExpense,
  IncomeRecord,
  SlipEditTarget,
} from './types';
import {
  verifyCredentials,
  getSavedSession,
  saveSession,
  clearSession,
  StoreAuthUser,
  APP_CREDENTIALS,
} from './utils/authWhitelist';
import {
  getStoredStoreData,
  saveStoredStoreData,
  exportAllSummaryCsv,
} from './services/storeDataService';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { LoginView } from './components/LoginView';
import { PorkPurchasesView } from './components/PorkPurchasesView';
import { AdExpensesView } from './components/AdExpensesView';
import { OtherExpensesView } from './components/OtherExpensesView';
import { IncomeView } from './components/IncomeView';
import { ReportsView } from './components/ReportsView';
import { SlipModal } from './components/SlipModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Store User Session (Username & Password)
  const [appUser, setAppUser] = useState<StoreAuthUser | null>(() => getSavedSession());

  // Store data state (preloaded from persistent local storage)
  const initialData = getStoredStoreData();
  const [porkPurchases, setPorkPurchases] = useState<PorkPurchase[]>(initialData.porkPurchases);
  const [adExpenses, setAdExpenses] = useState<AdExpense[]>(initialData.adExpenses);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>(initialData.otherExpenses);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>(initialData.incomeRecords);

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('pork');
  const [slipModalTarget, setSlipModalTarget] = useState<SlipEditTarget | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Keep persistent storage in sync with state changes
  useEffect(() => {
    saveStoredStoreData({
      porkPurchases,
      adExpenses,
      otherExpenses,
      incomeRecords,
    });
  }, [porkPurchases, adExpenses, otherExpenses, incomeRecords]);

  // Handle Login
  const handleLogin = (username: string, password: string): boolean => {
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
    return true;
  };

  // Handle Logout
  const handleLogout = () => {
    clearSession();
    setAppUser(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  };

  // 1. Add Pork Purchase
  const handleAddPorkPurchase = async (data: {
    kilos: number;
    amount: number;
    date: string;
    notes: string;
    slipUrl: string;
  }): Promise<void> => {
    const id = `PORK-${Date.now().toString().slice(-6)}`;
    const pricePerKg = data.kilos > 0 ? Math.round((data.amount / data.kilos) * 100) / 100 : 0;
    const userEmail = appUser?.username || 'mooyainoi';

    const newRecord: PorkPurchase = {
      id,
      date: data.date,
      kilos: data.kilos,
      amount: data.amount,
      pricePerKg,
      slipUrl: data.slipUrl,
      notes: data.notes,
      userEmail,
    };

    setPorkPurchases((prev) => [newRecord, ...prev]);
    showToast('บันทึกรายการสั่งซื้อหมูเรียบร้อยแล้ว');
  };

  // 2. Add Ad Expense
  const handleAddAdExpense = async (data: {
    platform: string;
    amount: number;
    campaignName: string;
    date: string;
    notes: string;
    slipUrl: string;
  }): Promise<void> => {
    const id = `AD-${Date.now().toString().slice(-6)}`;
    const userEmail = appUser?.username || 'mooyainoi';

    const newRecord: AdExpense = {
      id,
      date: data.date,
      platform: data.platform,
      amount: data.amount,
      campaignName: data.campaignName,
      slipUrl: data.slipUrl,
      notes: data.notes,
      userEmail,
    };

    setAdExpenses((prev) => [newRecord, ...prev]);
    showToast('บันทึกรายการค่ายิงแอดโฆษณาเรียบร้อยแล้ว');
  };

  // 3. Add Other Expense
  const handleAddOtherExpense = async (data: {
    category: string;
    amount: number;
    description: string;
    date: string;
    notes: string;
    slipUrl: string;
  }): Promise<void> => {
    const id = `EXP-${Date.now().toString().slice(-6)}`;
    const userEmail = appUser?.username || 'mooyainoi';

    const newRecord: OtherExpense = {
      id,
      date: data.date,
      category: data.category,
      amount: data.amount,
      description: data.description,
      slipUrl: data.slipUrl,
      notes: data.notes,
      userEmail,
    };

    setOtherExpenses((prev) => [newRecord, ...prev]);
    showToast('บันทึกรายการรายจ่ายอื่นๆ เรียบร้อยแล้ว');
  };

  // 4. Add Income
  const handleAddIncome = async (data: {
    channel: string;
    amount: number;
    description: string;
    date: string;
    notes: string;
    slipUrl: string;
  }): Promise<void> => {
    const id = `INC-${Date.now().toString().slice(-6)}`;
    const userEmail = appUser?.username || 'mooyainoi';

    const newRecord: IncomeRecord = {
      id,
      date: data.date,
      channel: data.channel,
      amount: data.amount,
      description: data.description,
      slipUrl: data.slipUrl,
      notes: data.notes,
      userEmail,
    };

    setIncomeRecords((prev) => [newRecord, ...prev]);
    showToast('บันทึกรายการยอดเงินเข้าร้านเรียบร้อยแล้ว');
  };

  // 5. Update Slip URL
  const handleSaveSlip = async (
    type: SlipEditTarget['type'],
    id: string,
    newSlipUrl: string
  ): Promise<void> => {
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
    id: string
  ): Promise<void> => {
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

  // Export summary report as CSV
  const handleExportSummary = () => {
    exportAllSummaryCsv({
      porkPurchases,
      adExpenses,
      otherExpenses,
      incomeRecords,
    });
    showToast('ส่งออกไฟล์สรุปภาพรวม Excel (CSV) สำเร็จ');
  };

  // If user is not authenticated with username & password, show Login View
  if (!appUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col pb-20 sm:pb-8">
      {/* Top Application Header */}
      <Navbar
        user={appUser}
        onLogout={handleLogout}
        onExportSummary={handleExportSummary}
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

        {/* View Routing */}
        {activeTab === 'pork' && (
          <PorkPurchasesView
            purchases={porkPurchases}
            isLoading={false}
            onAddPurchase={handleAddPorkPurchase}
            onOpenSlipModal={(target) => setSlipModalTarget(target)}
            onDeletePurchase={(id) => handleDeleteRecord('pork', id)}
          />
        )}

        {activeTab === 'ads' && (
          <AdExpensesView
            expenses={adExpenses}
            isLoading={false}
            onAddExpense={handleAddAdExpense}
            onOpenSlipModal={(target) => setSlipModalTarget(target)}
            onDeleteExpense={(id) => handleDeleteRecord('ads', id)}
          />
        )}

        {activeTab === 'other' && (
          <OtherExpensesView
            expenses={otherExpenses}
            isLoading={false}
            onAddExpense={handleAddOtherExpense}
            onOpenSlipModal={(target) => setSlipModalTarget(target)}
            onDeleteExpense={(id) => handleDeleteRecord('other', id)}
          />
        )}

        {activeTab === 'income' && (
          <IncomeView
            records={incomeRecords}
            isLoading={false}
            onAddIncome={handleAddIncome}
            onOpenSlipModal={(target) => setSlipModalTarget(target)}
            onDeleteIncome={(id) => handleDeleteRecord('income', id)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            porkPurchases={porkPurchases}
            adExpenses={adExpenses}
            otherExpenses={otherExpenses}
            incomeRecords={incomeRecords}
          />
        )}
      </main>

      {/* Slip Modal for Viewing & Editing Slips */}
      <SlipModal
        target={slipModalTarget}
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
