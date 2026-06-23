'use client';

import { useState, useEffect } from 'react';
import { useGroceryStore, GroceryItem } from '../../../store/groceryStore';
import { useI18nStore } from '../../../store/i18nStore';
import { useUIStore } from '../../../store/uiStore';
import { BACKEND_URL } from '../../../lib/api';
import { ChevronRight, Calendar, Archive, Trash2, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CategoriesPage() {
  const { groceries, loading, fetchGroceries, archiveGrocery, deleteGrocery } = useGroceryStore();
  const { t } = useI18nStore();
  const { setActiveTab } = useUIStore();

  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Desktop active category default (first one if selectedCat is null)
  const [desktopActiveCat, setDesktopActiveCat] = useState<string>('Dairy & Eggs');

  useEffect(() => {
    setActiveTab('categories');
    fetchGroceries();
  }, [setActiveTab]);

  const categoriesList = [
    { name: 'Dairy & Eggs', emoji: '🥛', color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50' },
    { name: 'Fruits & Vegetables', emoji: '🍎', color: 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50' },
    { name: 'Bakery', emoji: '🍞', color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' },
    { name: 'Meat & Fish', emoji: '🥩', color: 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50' },
    { name: 'Pantry', emoji: '🥫', color: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50' },
    { name: 'Beverages', emoji: '🥤', color: 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/50' },
    { name: 'Snacks', emoji: '🍪', color: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50' },
    { name: 'Others', emoji: '📦', color: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700/50' }
  ];

  // Helper to count items per category
  const getCategoryCount = (catName: string) => {
    return groceries.filter((item: GroceryItem) => item.category === catName).length;
  };

  const getFilteredItems = (catName: string) => {
    return groceries.filter((item: GroceryItem) => item.category === catName);
  };

  return (
    <div className="select-none h-full flex flex-col justify-between">

      {/* ========================================================================= */}
      {/* 1. DESKTOP SAAS VIEW (lg and above)                                       */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-6 flex-grow w-full h-full">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-150 tracking-tight">
            {t('categories') || 'Categories'}
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">
            Organize and manage your kitchen inventory items by groups
          </p>
        </div>

        {/* 2-Column Split: Sidebar Categories & Active Category Items List */}
        <div className="grid grid-cols-12 gap-6 flex-1 items-start min-h-0">
          
          {/* Left Category Selector Panel */}
          <div className="col-span-4 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800/60">
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                Select Category
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-zinc-800/60">
              {categoriesList.map((cat) => {
                const count = getCategoryCount(cat.name);
                const isActive = desktopActiveCat === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setDesktopActiveCat(cat.name)}
                    className={`flex items-center justify-between text-left p-4 group cursor-pointer transition-colors w-full select-none ${
                      isActive 
                        ? 'bg-slate-50 dark:bg-zinc-850/80 border-r-4 border-[#2E7D32]' 
                        : 'hover:bg-slate-50/50 dark:hover:bg-zinc-850/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 group-hover:scale-105 transition-transform">
                        {cat.emoji}
                      </div>
                      <span className={`text-xs font-black ${
                        isActive ? 'text-[#2E7D32] dark:text-green-400' : 'text-slate-850 dark:text-zinc-200'
                      }`}>
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive 
                          ? 'text-[#2E7D32] bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-950/30' 
                          : 'text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 border-slate-150 dark:border-zinc-700/50'
                      }`}>
                        {count}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        isActive ? 'text-[#2E7D32] translate-x-0.5' : 'text-slate-300 dark:text-zinc-650'
                      }`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Items Grid Panel */}
          <div className="col-span-8 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800/60 flex items-center gap-2">
              <span className="text-2xl">{categoriesList.find(c => c.name === desktopActiveCat)?.emoji}</span>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                  {desktopActiveCat} Inventory Items
                </h3>
                <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-semibold block mt-0.5">
                  Showing active tracked groceries under this section
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#2E7D32] animate-spin" />
              </div>
            ) : getFilteredItems(desktopActiveCat).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <span className="text-4xl block mb-2">🧺</span>
                <h4 className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wide">
                  No active items here
                </h4>
                <p className="text-[10px] text-slate-450 dark:text-zinc-550 max-w-xs mx-auto mt-2 leading-relaxed font-semibold">
                  Add items to the category "{desktopActiveCat}" to see them listed in this panel.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-zinc-800/60">
                {getFilteredItems(desktopActiveCat).map((item: GroceryItem) => {
                  const days = Math.ceil(
                    (new Date(item.expiryDate).getTime() - new Date().getTime()) / 
                    (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={item._id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img 
                            src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`} 
                            alt="Grocery" 
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-50 dark:bg-zinc-850 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-slate-150 dark:border-zinc-700/50">
                            {categoriesList.find(c => c.name === desktopActiveCat)?.emoji}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-150 truncate">
                            {item.itemName}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase mt-0.5 block tracking-wider">
                            Expires in {days} days — Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={async () => {
                            await archiveGrocery(item._id);
                          }}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-brand-green rounded-xl transition-all cursor-pointer"
                          title="Consume Item"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this item?')) {
                              await deleteGrocery(item._id);
                            }
                          }}
                          className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-brand-red rounded-xl transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ORIGINAL MOBILE VIEW (lg hidden)                                       */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col h-full overflow-hidden justify-between space-y-3 pb-1">
        
        <AnimatePresence mode="wait">
          {!selectedCat ? (
            /* Grid of Categories Card Explorer */
            <motion.div
              key="grid"
              className="flex-grow min-h-0 flex flex-col space-y-3 overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <div className="flex-shrink-0">
                <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  {t('categories')}
                </h2>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-widest mt-0.5">
                  Organize inventory items cleanly
                </p>
              </div>

              <div className="flex-grow min-h-0 overflow-y-auto no-scrollbar bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl divide-y divide-slate-100 dark:divide-zinc-800/60 shadow-sm">
                {categoriesList.map((cat) => {
                  const count = getCategoryCount(cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCat(cat.name)}
                      className="flex items-center justify-between text-left p-4 hover:bg-slate-50 dark:hover:bg-zinc-850 group cursor-pointer transition-colors w-full select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xl flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 group-hover:scale-105 transition-transform">
                          {cat.emoji}
                        </div>
                        <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-slate-150 dark:border-zinc-700/50">
                          {count}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-650 group-hover:text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* Drilldown details list inside category */
            <motion.div
              key="list"
              className="flex-grow min-h-0 flex flex-col space-y-3 overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <div className="flex-shrink-0 space-y-2">
                <button
                  onClick={() => setSelectedCat(null)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>RETURN TO CATEGORIES</span>
                </button>

                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2 leading-none">
                    <span>{categoriesList.find(c => c.name === selectedCat)?.emoji}</span>
                    <span>{selectedCat} Items</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-widest mt-0.5">
                    Active food inventory records
                  </p>
                </div>
              </div>

              {getFilteredItems(selectedCat).length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-6 text-center select-none border-dashed">
                  <span className="text-3xl block mb-2">🧺</span>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                    No active items here
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-relaxed mt-2 font-medium max-w-[220px] mx-auto">
                    Add items to the category "{selectedCat}" to see them listed!
                  </p>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto no-scrollbar bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl divide-y divide-slate-100 dark:divide-zinc-800/60 shadow-sm">
                  {getFilteredItems(selectedCat).map((item: GroceryItem) => {
                    const days = Math.ceil(
                      (new Date(item.expiryDate).getTime() - new Date().getTime()) / 
                      (1000 * 60 * 60 * 24)
                    );
                    return (
                      <div key={item._id} className="p-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.image ? (
                            <img 
                              src={item.image.startsWith('http') ? item.image : `${BACKEND_URL}${item.image}`} 
                              alt="Grocery" 
                              className="w-9 h-9 rounded-xl object-cover flex-shrink-0" 
                            />
                          ) : (
                            <div className="w-9 h-9 bg-slate-50 dark:bg-zinc-850 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-slate-150 dark:border-zinc-700/50">
                              {categoriesList.find(c => c.name === selectedCat)?.emoji}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate">
                              {item.itemName}
                            </h4>
                            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase mt-0.5 block tracking-wider">
                              Expires in {days} days — Qty: {item.quantity}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => archiveGrocery(item._id)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-brand-green rounded-xl transition-all cursor-pointer"
                            title="Consume Item"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteGrocery(item._id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-brand-red rounded-xl transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
