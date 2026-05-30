'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGroceryStore, GroceryItem } from '../../../store/groceryStore';
import { useUIStore } from '../../../store/uiStore';
import { useI18nStore } from '../../../store/i18nStore';
import { ChevronLeft, Search, SlidersHorizontal, ChevronRight, Loader2, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import EditGroceryModal from '../../../components/groceries/EditGroceryModal';
import { getImageUrl } from '../../../utils/imageHelper';

export default function AllGroceriesPage() {
  const router = useRouter();
  const { groceries, fetchGroceries, loading, deleteGrocery } = useGroceryStore();
  const { setActiveTab } = useUIStore();
  const { t } = useI18nStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedEditItem, setSelectedEditItem] = useState<GroceryItem | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab('home');
    fetchGroceries();
  }, [setActiveTab]);

  // Expiry Calculations
  const getDaysLeft = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Emojis dictionary
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

  // Filter & Search Logic
  const filtered = groceries.filter(item => 
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const expired = filtered.filter(item => item.status === 'Expired');
  const expiringSoon = filtered.filter(item => item.status === 'Expiring Soon');
  const good = filtered.filter(item => item.status === 'Fresh');

  return (
    <div className="select-none flex flex-col h-full overflow-hidden justify-between space-y-3 pb-1">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-9 h-9 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-slate-800 dark:text-zinc-200" />
        </button>
        <h2 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
          All Groceries
        </h2>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Search Input & Filter */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search groceries"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-primary placeholder-slate-400"
          />
        </div>
        <button className="w-10 h-10 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center cursor-pointer text-slate-600 dark:text-zinc-300 hover:bg-slate-50 active:scale-95 transition-all">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
            Loading items...
          </span>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4 pb-1">
          {/* Expired Group */}
          <div>
            <h3 className="text-[10px] font-black text-brand-red uppercase tracking-wider mb-2">
              Expired ({expired.length})
            </h3>
            {expired.length === 0 ? (
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold italic pl-1">No expired items.</p>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60 shadow-sm">
                {expired.map(item => (
                  <div 
                    key={item._id}
                    onClick={() => setSelectedEditItem(item)}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-xl w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0">
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
                          {new Date(item.expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEditItem(item);
                        }}
                        className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={isDeletingId === item._id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this item?')) {
                            setIsDeletingId(item._id);
                            await deleteGrocery(item._id);
                            setIsDeletingId(null);
                          }
                        }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                        title="Delete"
                      >
                        {isDeletingId === item._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiring Soon Group */}
          <div>
            <h3 className="text-[10px] font-black text-brand-orange uppercase tracking-wider mb-2">
              Expiring Soon ({expiringSoon.length})
            </h3>
            {expiringSoon.length === 0 ? (
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold italic pl-1">No expiring soon items.</p>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60 shadow-sm">
                {expiringSoon.map(item => {
                  const daysLeft = getDaysLeft(item.expiryDate);
                  return (
                    <div 
                      key={item._id}
                      onClick={() => setSelectedEditItem(item)}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="text-xl w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0">
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
                            {new Date(item.expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-brand-orange bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-950/50 uppercase tracking-wider">
                          In {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEditItem(item);
                          }}
                          className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingId === item._id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this item?')) {
                              setIsDeletingId(item._id);
                              await deleteGrocery(item._id);
                              setIsDeletingId(null);
                            }
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                          title="Delete"
                        >
                          {isDeletingId === item._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Good Group */}
          <div>
            <h3 className="text-[10px] font-black text-brand-green uppercase tracking-wider mb-2">
              Good ({good.length})
            </h3>
            {good.length === 0 ? (
              <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold italic pl-1">No items in good standing.</p>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60 shadow-sm">
                {good.map(item => (
                  <div 
                    key={item._id}
                    onClick={() => setSelectedEditItem(item)}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-xl w-8 h-8 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0">
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
                          {new Date(item.expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEditItem(item);
                        }}
                        className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={isDeletingId === item._id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this item?')) {
                            setIsDeletingId(item._id);
                            await deleteGrocery(item._id);
                            setIsDeletingId(null);
                          }
                        }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                        title="Delete"
                      >
                        {isDeletingId === item._id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <EditGroceryModal 
        item={selectedEditItem}
        onClose={() => {
          setSelectedEditItem(null);
          fetchGroceries();
        }}
      />
    </div>
  );
}
