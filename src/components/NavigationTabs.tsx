import { ActiveTab } from '../types';
import { ShoppingBag, Megaphone, Receipt, Wallet, BarChart3 } from 'lucide-react';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  counts: {
    pork: number;
    ads: number;
    other: number;
    income: number;
  };
}

export const NavigationTabs = ({ activeTab, onTabChange, counts }: NavigationTabsProps) => {
  const tabs = [
    {
      id: 'pork' as ActiveTab,
      label: 'สั่งซื้อหมู',
      subtitle: 'มีเพียงกิโลและยอดเงิน',
      icon: ShoppingBag,
      color: 'text-rose-600',
      activeBg: 'bg-rose-600 text-white',
      badge: counts.pork,
    },
    {
      id: 'ads' as ActiveTab,
      label: 'ยิงแอดโฆษณา',
      subtitle: 'Facebook, TikTok ฯลฯ',
      icon: Megaphone,
      color: 'text-blue-600',
      activeBg: 'bg-blue-600 text-white',
      badge: counts.ads,
    },
    {
      id: 'other' as ActiveTab,
      label: 'รายจ่ายอื่นๆ',
      subtitle: 'ถุง, ขนส่ง, น้ำแข็ง, จ้าง',
      icon: Receipt,
      color: 'text-amber-600',
      activeBg: 'bg-amber-600 text-white',
      badge: counts.other,
    },
    {
      id: 'income' as ActiveTab,
      label: 'รับเงินเข้า',
      subtitle: 'หน้าร้าน, โอน, สแกน',
      icon: Wallet,
      color: 'text-emerald-600',
      activeBg: 'bg-emerald-600 text-white',
      badge: counts.income,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'รายงานสรุป',
      subtitle: 'ยอดเข้า, รายจ่าย & คงเหลือ',
      icon: BarChart3,
      color: 'text-purple-600',
      activeBg: 'bg-purple-600 text-white',
      badge: 0,
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Top Navigation Bar */}
      <nav id="desktop-navigation" className="hidden sm:block mb-6">
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-desktop-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? `${tab.activeBg} shadow-xs font-semibold`
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Sticky Thumb-friendly) */}
      <nav
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg pb-safe"
      >
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-mobile-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer relative ${
                  isActive ? `${tab.color} font-semibold` : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] text-[9px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center px-0.5">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
                {isActive && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 bg-current`} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
