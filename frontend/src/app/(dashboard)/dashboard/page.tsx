'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGroceryStore, GroceryItem } from '../../../store/groceryStore';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import { useI18nStore } from '../../../store/i18nStore';
import { Bell, AlertTriangle, Clock, ShieldCheck, Plus, Loader2, Sparkles, Brain, Utensils, RefreshCw, BarChart } from 'lucide-react';
import ProductDetailsModal from '../../../components/groceries/ProductDetailsModal';
import { getImageUrl } from '../../../utils/imageHelper';
import AIAssistantModal from '../../../components/groceries/AIAssistantModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    groceries, loading, expiredCount, expiringSoonCount, goodCount, 
    fetchGroceries 
  } = useGroceryStore();
  const { openAddModal, setActiveTab } = useUIStore();
  const { t } = useI18nStore();

  const [selectedDetailItem, setSelectedDetailItem] = useState<GroceryItem | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);

  useEffect(() => {
    setActiveTab('home');
    fetchGroceries();
  }, [setActiveTab]);

  // Emojis for categories
  const categoryIcons: Record<string, string> = {
    'Dairy & Eggs': '🥛',
    'Fruits & Vegetables': '🍎',
    'Bakery': '🍞',
    'Meat & Fish': '🥩',
    'Pantry': '🥫',
    'Beverages': '🥤',
    'Snacks': '🍪',
    'Others': '📦'
  };

  // Expiry Calculations
  const getDaysLeft = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Expiring soon items only
  const expiringSoonItems = groceries
    .filter((item: GroceryItem) => item.status === 'Expiring Soon');

  return (
    <div className="select-none h-full flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* 1. DESKTOP SAAS VIEW (lg and above)                                       */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-6 flex-1 w-full">
        
        {/* Page Title & Slogan */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-150 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">
              {t('slogan') || "Let's keep your groceries fresh"}
            </p>
          </div>
          
          {/* Quick Action Add Button */}
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2E7D32] hover:bg-[#25632A] text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 shadow-lg shadow-green-500/10 transition-all uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Add Grocery</span>
          </button>
        </div>

        {/* 3 Overview Stats Cards Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Card 1: Expired */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {t('expired') || 'Expired'}
              </span>
              <h3 className="text-3xl font-black text-slate-800 dark:text-zinc-150 leading-none">
                {expiredCount}
              </h3>
            </div>
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/30 rounded-xl flex items-center justify-center text-red-500 shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Expiring Soon */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {t('expiringSoon') || 'Expiring Soon'}
              </span>
              <h3 className="text-3xl font-black text-slate-800 dark:text-zinc-150 leading-none">
                {expiringSoonCount}
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950/30 rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Good */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                {t('good') || 'Good'}
              </span>
              <h3 className="text-3xl font-black text-slate-800 dark:text-zinc-150 leading-none">
                {goodCount}
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 border border-green-100 dark:border-green-950/30 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2-Column Split: Expiring Soon Table & AI Helper Card */}
        <div className="grid grid-cols-12 gap-6 flex-1 items-start">
          
          {/* Left Pane (Table) */}
          <div className="col-span-9 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[400px]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-zinc-800/60 flex-shrink-0">
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                  Critical Warnings (Expiring Soon)
                </h3>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold block mt-0.5">
                  Consume these items immediately to reduce food waste.
                </span>
              </div>
              <button 
                onClick={() => router.push('/all-groceries')}
                className="text-xs font-black text-[#2E7D32] hover:underline cursor-pointer"
              >
                {t('viewAll') || 'View all inventory'}
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-[#2E7D32] animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  {t('loading') || 'Loading list...'}
                </span>
              </div>
            ) : expiringSoonItems.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                <span className="text-4xl block mb-2">🎉</span>
                <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  {t('activeList') || 'All Items in Good Standing!'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-550 block mt-1">
                  Nice work! Your kitchen is perfectly optimized.
                </span>
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-zinc-850/50 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800/50">
                      <th className="p-4 pl-5">Product Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Expiry Date</th>
                      <th className="p-4 pr-5 text-right">Remaining Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {expiringSoonItems.map((item: GroceryItem) => {
                      const daysLeft = getDaysLeft(item.expiryDate);
                      return (
                        <tr 
                          key={item._id}
                          onClick={() => setSelectedDetailItem(item)}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/80 cursor-pointer transition-colors group text-xs text-slate-700 dark:text-zinc-300 font-semibold"
                        >
                          <td className="p-4 pl-5 flex items-center gap-3">
                            <div className="text-lg w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                              {item.image ? (
                                <img 
                                  src={getImageUrl(item.image)} 
                                  alt={item.itemName} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      const fallbackSpan = document.createElement('span');
                                      fallbackSpan.className = 'text-lg';
                                      fallbackSpan.innerText = categoryIcons[item.category] || '📦';
                                      parent.appendChild(fallbackSpan);
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-lg">{categoryIcons[item.category] || '📦'}</span>
                              )}
                            </div>
                            <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                              {item.itemName}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-slate-150 dark:border-zinc-700/50">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-zinc-400">
                            {new Date(item.expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-4 pr-5 text-right">
                            <span className="text-[10px] font-bold text-brand-orange bg-amber-50 dark:bg-amber-950/20 px-2.5 py-0.5 rounded-full border border-amber-100 dark:border-amber-950/50">
                              {daysLeft === 1 
                                ? (t('daysLeft1') || 'Tomorrow')
                                : daysLeft === 0
                                ? (t('daysLeft0') || 'Expires Today')
                                : (t('daysLeft') || 'In {days} days').replace('{days}', String(daysLeft))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Pane (Quick Tips) */}
          <div className="col-span-3 space-y-6">
            {/* Quick tips widget */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Quick Kitchen Tips
              </h4>
              <ul className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold space-y-2 list-disc pl-4 leading-relaxed">
                <li>Store bananas separate from apples to prevent quick ripening.</li>
                <li>Keep milk on the middle shelf, not on the door, for more consistent cold temperatures.</li>
                <li>Write a consumption priority plan using buddy AI to reduce wastage.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ORIGINAL MOBILE VIEW (lg hidden)                                       */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col h-full overflow-hidden justify-between space-y-3 pb-1">
        
        {/* Header Bar */}
        <div className="flex-shrink-0 flex items-center justify-between">
          <div className="space-y-0.5 min-w-0 flex-1 mr-2">
            <h2 className="text-[18px] font-black text-slate-850 dark:text-zinc-100 tracking-tight leading-none truncate whitespace-nowrap">
              {t('hiUser') ? t('hiUser').replace('User', user?.name || 'User').replace('యూజర్', user?.name || 'User').replace('యుజర్', user?.name || 'User').replace('యూజర్స్', user?.name || 'User').replace('యుజర్స్', user?.name || 'User').replace('यूज़र', user?.name || 'User') : `Hi, ${user?.name || 'User'}`} 👋
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 block leading-none truncate">
              {t('slogan') || "Let's keep your groceries fresh"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* SMART AI button */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-650/10 to-indigo-650/15 border border-purple-500/30 flex flex-col items-center justify-center text-purple-400 hover:text-purple-300 hover:from-purple-600/20 hover:to-indigo-600/20 cursor-pointer active:scale-95 shadow-md shadow-purple-500/5 select-none transition-all"
            >
              <span className="text-[8.5px] font-black tracking-wider leading-[0.95] block uppercase">SMART</span>
              <span className="text-[8.5px] font-black tracking-wider leading-[0.95] block uppercase mt-[1px]">AI</span>
            </button>

            {/* Circular Bell Button */}
            <button 
              onClick={() => router.push('/reminders')}
              className="w-9 h-9 rounded-full border border-green-150 dark:border-green-950 flex items-center justify-center relative cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-95 transition-all"
            >
              <Bell className="w-4 h-4 text-[#2E7D32]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
            </button>
          </div>
        </div>

        {/* Expiry Overview Section */}
        <div className="flex-shrink-0">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            {t('overview') || 'Expiry Overview'}
          </h3>
          
          <div className="grid grid-cols-3 gap-2.5">
            {/* Card 1: Expired */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-8 h-8 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/30 rounded-xl flex items-center justify-center text-red-500 mb-1.5">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-base font-black text-slate-800 dark:text-zinc-150 leading-none">
                {expiredCount}
              </span>
              <span className="text-[9px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mt-1.5 block leading-none">
                {t('expired') || 'Expired'}
              </span>
            </div>

            {/* Card 2: Expiring Soon */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950/30 rounded-xl flex items-center justify-center text-amber-555 mb-1.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-base font-black text-slate-800 dark:text-zinc-150 leading-none">
                {expiringSoonCount}
              </span>
              <span className="text-[9px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mt-1.5 block leading-none">
                {t('expiringSoon') || 'Expiring Soon'}
              </span>
            </div>

            {/* Card 3: Good */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950/20 border border-green-100 dark:border-green-950/30 rounded-xl flex items-center justify-center text-emerald-600 mb-1.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-base font-black text-slate-800 dark:text-zinc-150 leading-none">
                {goodCount}
              </span>
              <span className="text-[9px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mt-1.5 block leading-none">
                {t('good') || 'Good'}
              </span>
            </div>
          </div>
        </div>

        {/* Flexible Expiring Soon List Section */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              {t('expiringSoon') || 'Expiring Soon'}
            </h3>
            <button 
              onClick={() => router.push('/all-groceries')}
              className="text-[10px] font-black text-[#2E7D32] hover:underline cursor-pointer"
            >
              {t('viewAll') || 'View all'}
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="w-5 h-5 text-[#2E7D32] animate-spin" />
                <span className="text-[9px] font-bold text-slate-455 dark:text-zinc-550 uppercase tracking-wider">
                  {t('loading') || 'Loading list...'}
                </span>
              </div>
            ) : expiringSoonItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-100 dark:border-zinc-850 rounded-2xl">
                <span className="text-2xl block mb-1">🎉</span>
                <span className="text-[9px] font-bold text-slate-450 dark:text-zinc-500 uppercase block tracking-wider">
                  {t('activeList') || 'All Items in Good Standing!'}
                </span>
              </div>
            ) : (
               <div className="flex-grow overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-zinc-800/60">
                {expiringSoonItems.map((item: GroceryItem) => {
                  const daysLeft = getDaysLeft(item.expiryDate);
                  return (
                    <div 
                      key={item._id}
                      onClick={() => setSelectedDetailItem(item)}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="text-lg w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0">
                          {item.image ? (
                            <img 
                              src={getImageUrl(item.image)} 
                              alt={item.itemName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                  const fallbackSpan = document.createElement('span');
                                  fallbackSpan.className = 'text-lg';
                                  fallbackSpan.innerText = categoryIcons[item.category] || '📦';
                                  parent.appendChild(fallbackSpan);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-lg">{categoryIcons[item.category] || '📦'}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">
                            {item.itemName}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block mt-0.5">
                            {new Date(item.expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      
                      <span className="text-[9px] font-bold text-brand-orange bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-950/50">
                        {daysLeft === 1 
                          ? (t('daysLeft1') || 'Tomorrow')
                          : daysLeft === 0
                          ? (t('daysLeft0') || 'Expires Today')
                          : (t('daysLeft') || 'In {days} days').replace('{days}', String(daysLeft))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SHARED MODALS                                                         */}
      {/* ========================================================================= */}
      <ProductDetailsModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />

    </div>
  );
}
