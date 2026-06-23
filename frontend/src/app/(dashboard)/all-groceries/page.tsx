'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGroceryStore, GroceryItem } from '../../../store/groceryStore';
import { useUIStore } from '../../../store/uiStore';
import { useI18nStore } from '../../../store/i18nStore';
import { ChevronLeft, Search, SlidersHorizontal, Loader2, Edit2, Trash2, Plus, Filter } from 'lucide-react';
import EditGroceryModal from '../../../components/groceries/EditGroceryModal';
import { getImageUrl } from '../../../utils/imageHelper';

export default function AllGroceriesPage() {
  const router = useRouter();
  const { groceries, fetchGroceries, loading, deleteGrocery } = useGroceryStore();
  const { setActiveTab, openAddModal } = useUIStore();
  const { t } = useI18nStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEditItem, setSelectedEditItem] = useState<GroceryItem | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  // Desktop specific filter tab
  const [desktopFilter, setDesktopFilter] = useState<'all' | 'expired' | 'expiring' | 'fresh'>('all');

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

  // Filter for desktop view
  const getDesktopFilteredItems = () => {
    switch (desktopFilter) {
      case 'expired': return expired;
      case 'expiring': return expiringSoon;
      case 'fresh': return good;
      case 'all':
      default:
        return filtered;
    }
  };

  return (
    <div className="select-none h-full flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* 1. DESKTOP SAAS VIEW (lg and above)                                       */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-6 flex-grow w-full">
        
        {/* Header Toolbar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-850 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-800 dark:text-zinc-200" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-150 tracking-tight">
                Kitchen Inventory
              </h1>
              <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">
                Total Tracked Items: {groceries.length}
              </p>
            </div>
          </div>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2E7D32] hover:bg-[#25632A] text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 shadow-lg shadow-green-500/10 transition-all uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Add Grocery</span>
          </button>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm">
          {/* Sub-Filters Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All Items', count: filtered.length },
              { id: 'expired', label: 'Expired', count: expired.length, color: 'text-red-500 bg-red-50 dark:bg-red-950/20' },
              { id: 'expiring', label: 'Expiring Soon', count: expiringSoon.length, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
              { id: 'fresh', label: 'Good Standing', count: good.length, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDesktopFilter(tab.id as any)}
                className={`px-4 py-2 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-2 ${
                  desktopFilter === tab.id
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 text-slate-655 dark:text-zinc-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  desktopFilter === tab.id 
                    ? 'bg-white/20 text-white' 
                    : tab.color || 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Inputs */}
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-[#2E7D32] placeholder-slate-400"
            />
          </div>
        </div>

        {/* Large Data Table */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[450px]">
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-[#2E7D32] animate-spin" />
              <span className="text-xs font-black text-slate-400 dark:text-zinc-555 uppercase tracking-wider">
                Loading database...
              </span>
            </div>
          ) : getDesktopFilteredItems().length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
              <span className="text-4xl block mb-2">🍽️</span>
              <span className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                No matching items found
              </span>
              <span className="text-[10px] text-slate-450 dark:text-zinc-550 mt-1 block">
                Try searching for something else or add a new grocery item.
              </span>
            </div>
          ) : (
            <div className="flex-grow overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-zinc-850/50 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800/50">
                    <th className="p-4 pl-6">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Days Left</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {getDesktopFilteredItems().map((item: GroceryItem) => {
                    const daysLeft = getDaysLeft(item.expiryDate);
                    
                    // Render correct status pills
                    let statusPill = (
                      <span className="text-[10px] font-black text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full border border-green-100 dark:border-green-950/50 uppercase tracking-wider">
                        Good
                      </span>
                    );
                    if (item.status === 'Expired') {
                      statusPill = (
                        <span className="text-[10px] font-black text-red-500 bg-red-50 dark:bg-red-950/20 px-2.5 py-0.5 rounded-full border border-red-100 dark:border-red-950/50 uppercase tracking-wider">
                          Expired
                        </span>
                      );
                    } else if (item.status === 'Expiring Soon') {
                      statusPill = (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-0.5 rounded-full border border-amber-100 dark:border-amber-950/50 uppercase tracking-wider">
                          Critical
                        </span>
                      );
                    }

                    return (
                      <tr 
                        key={item._id}
                        onClick={() => setSelectedEditItem(item)}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-850/80 cursor-pointer transition-colors group text-xs text-slate-750 dark:text-zinc-300 font-semibold"
                      >
                        <td className="p-4 pl-6 flex items-center gap-3.5">
                          <div className="text-lg w-9 h-9 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
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
                          <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-sm">
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
                        <td className="p-4">{statusPill}</td>
                        <td className="p-4">
                          {daysLeft < 0 ? (
                            <span className="text-red-500 font-extrabold">Expired</span>
                          ) : daysLeft === 0 ? (
                            <span className="text-red-500 font-extrabold">Expires Today</span>
                          ) : daysLeft === 1 ? (
                            <span className="text-amber-600 font-extrabold">Expires Tomorrow</span>
                          ) : (
                            <span>{daysLeft} days</span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedEditItem(item)}
                              className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg cursor-pointer transition-colors active:scale-90"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingId === item._id}
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this item?')) {
                                  setIsDeletingId(item._id);
                                  await deleteGrocery(item._id);
                                  setIsDeletingId(null);
                                }
                              }}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                              title="Delete"
                            >
                              {isDeletingId === item._id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ORIGINAL MOBILE VIEW (lg hidden)                                       */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col h-full overflow-hidden justify-between space-y-3 pb-1">
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
          <div className="w-9" />
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
            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 uppercase tracking-widest">
              Loading items...
            </span>
          </div>
        ) : (
          <div className="flex-grow min-h-0 overflow-y-auto no-scrollbar space-y-4 pb-1">
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
                      
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedEditItem(item)}
                          className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingId === item._id}
                          onClick={async () => {
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
                        
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[8px] font-black text-brand-orange bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-950/50 uppercase tracking-wider">
                            In {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedEditItem(item)}
                            className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={isDeletingId === item._id}
                            onClick={async () => {
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
                <p className="text-[9px] text-slate-400 dark:text-zinc-555 font-semibold italic pl-1">No items in good standing.</p>
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
                      
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedEditItem(item)}
                          className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg cursor-pointer transition-colors active:scale-90"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingId === item._id}
                          onClick={async () => {
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
      </div>

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
