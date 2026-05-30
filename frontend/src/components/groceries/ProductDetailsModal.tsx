'use client';

import { GroceryItem } from '../../store/groceryStore';
import { useI18nStore } from '../../store/i18nStore';
import { X, Calendar, Layers, Hash, Sparkles, Clock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/imageHelper';

interface ProductDetailsModalProps {
  item: GroceryItem | null;
  onClose: () => void;
}

export default function ProductDetailsModal({ item, onClose }: ProductDetailsModalProps) {
  const t = useI18nStore((state) => state.t);

  // Emojis for category fallbacks
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

  if (!item) return null;

  // Calculate days left
  const getDaysLeft = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft(item.expiryDate);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        {/* Backdrop Click Shield */}
        <motion.div 
          className="absolute inset-0 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Sheet container */}
        <motion.div
          className="relative bg-zinc-950 w-full md:max-w-md rounded-t-custom md:rounded-custom shadow-2xl flex flex-col overflow-hidden z-10 border border-zinc-800"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        >
          {/* Top Banner & Photo Area */}
          <div className="relative h-48 md:h-52 w-full bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-800">
            {item.image ? (
              <img 
                src={getImageUrl(item.image)} 
                alt={item.itemName} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallbackEl = document.createElement('div');
                    fallbackEl.className = 'text-5xl flex items-center justify-center w-full h-full bg-zinc-900';
                    fallbackEl.innerText = categoryIcons[item.category] || '📦';
                    parent.appendChild(fallbackEl);
                  }
                }}
              />
            ) : (
              <span className="text-5xl">{categoryIcons[item.category] || '📦'}</span>
            )}
            
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            
            {/* Close Button overlay */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors border border-zinc-800/80 backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title floating overlay */}
            <div className="absolute bottom-4 left-5 right-5">
              <span className="text-[8px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {item.category}
              </span>
              <h2 className="text-base font-black text-zinc-100 mt-1 uppercase tracking-tight truncate">
                {item.itemName}
              </h2>
              {item.brand && (
                <p className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider mt-0.5">
                  by {item.brand}
                </p>
              )}
            </div>
          </div>

          {/* Details fields scrollable section */}
          <div className="px-5 py-5 space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar">
            
            {/* Highlights Box (Remaining Days status) */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-800/85">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block leading-none">
                    Freshness Window
                  </span>
                  <span className="text-[10px] font-black text-amber-400 mt-1.5 block leading-none uppercase tracking-wider">
                    Expiring Soon
                  </span>
                </div>
              </div>
              
              <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">
                In {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
              </span>
            </div>

            {/* Metadata Fields Grid */}
            <div className="grid grid-cols-2 gap-3 select-none">
              {/* Quantity */}
              <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-850 flex flex-col justify-center">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-zinc-400" />
                  QUANTITY
                </span>
                <span className="text-[11px] font-black text-zinc-200 mt-1.5 block uppercase truncate">
                  {item.quantity || '1 unit'}
                </span>
              </div>

              {/* Category Icon */}
              <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-850 flex flex-col justify-center">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-zinc-400" />
                  CATEGORY
                </span>
                <span className="text-[11px] font-black text-zinc-200 mt-1.5 block uppercase truncate">
                  {item.category}
                </span>
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-3 select-none">
              {/* Purchase Date */}
              <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-850">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  PURCHASED
                </span>
                <span className="text-[11px] font-black text-zinc-200 mt-1.5 block uppercase">
                  {item.purchaseDate 
                    ? new Date(item.purchaseDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'N/A'
                  }
                </span>
              </div>

              {/* Expiry Date */}
              <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-850">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  EXPIRY DATE
                </span>
                <span className="text-[11px] font-black text-zinc-200 mt-1.5 block uppercase">
                  {new Date(item.expiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Notes / Description Section */}
            {item.notes && (
              <div className="p-3.5 bg-zinc-900/40 rounded-2xl border border-zinc-850 space-y-1.5">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  NOTES & REMINDERS
                </span>
                <p className="text-[10px] font-semibold text-zinc-300 leading-relaxed bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900 text-left">
                  {item.notes}
                </p>
              </div>
            )}

          </div>

          {/* Close Action Block */}
          <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/30">
            <button
              onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-3 rounded-xl text-[9px] font-black tracking-widest uppercase transition-colors cursor-pointer border border-zinc-700/60"
            >
              CLOSE DETAILS
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
