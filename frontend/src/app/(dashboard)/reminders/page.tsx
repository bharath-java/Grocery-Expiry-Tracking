'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '../../../store/uiStore';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore, GroceryItem } from '../../../store/groceryStore';
import api from '../../../lib/api';
import ProductDetailsModal from '../../../components/groceries/ProductDetailsModal';
import { 
  Bell, Settings, Smartphone, Mail, AlertTriangle, 
  CheckCircle2, Trash2, ShieldCheck, Loader2, Sparkles, X, 
  Calendar, Layers, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DBNotification {
  _id: string;
  title: string;
  message: string;
  type: 'expiry' | 'system' | 'info';
  status: 'read' | 'unread';
  sentAt: string;
  groceryId?: GroceryItem;
}

export default function RemindersPage() {
  const { setActiveTab } = useUIStore();
  const { groceries, fetchGroceries } = useGroceryStore();

  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'history'>('upcoming');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<GroceryItem | null>(null);

  // Notifications state (History)
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Settings & Intervals State (Synced with localStorage for absolute reliability)
  const [emailDigest, setEmailDigest] = useState(true);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [intervals, setIntervals] = useState({
    sevenDays: true,
    threeDays: true,
    oneDay: true,
    sameDay: true
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    setActiveTab('reminders');
    fetchGroceries();
    fetchHistory();

    const storedEmail = localStorage.getItem('emailDigest');
    if (storedEmail !== null) setEmailDigest(storedEmail === 'true');

    const storedIntervals = localStorage.getItem('reminderIntervals');
    if (storedIntervals) {
      try {
        setIntervals(JSON.parse(storedIntervals));
      } catch (e) {
        console.error(e);
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushSubscribed(true);
      }
    }
  }, [setActiveTab]);

  // Save intervals configuration helper
  const updateIntervalSetting = (key: keyof typeof intervals, value: boolean) => {
    const updated = { ...intervals, [key]: value };
    setIntervals(updated);
    localStorage.setItem('reminderIntervals', JSON.stringify(updated));
  };

  // Save email settings helper
  const toggleEmailDigest = () => {
    const next = !emailDigest;
    setEmailDigest(next);
    localStorage.setItem('emailDigest', String(next));
  };

  // Fetch past alerts notifications (History)
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Failed to load notification history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Clear alert notification from logs feed
  const handleClearAlert = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n._id !== id));
      // Optionally notify backend if needed
      await api.delete(`/notifications/${id}`).catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  // Request screen push permissions
  const handleEnablePush = async () => {
    if (!('Notification' in window)) return;
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushSubscribed(true);
        // Create mock subscription binding in background
        await api.post('/notifications/subscribe', {
          subscription: {
            endpoint: 'https://fcm.googleapis.com/fcm/send/mock_endpoint_123',
            keys: { auth: 'mock_auth_key_123', p256dh: 'mock_p256dh_key_123' }
          }
        }).catch(() => {});
      } else {
        alert('Push notification permission denied. Please grant permission in site settings.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribing(false);
    }
  };

  // Filters groceries with expiring soon status
  const upcomingItems = groceries.filter(item => item.status === 'Expiring Soon');

  return (
    <div className="select-none flex flex-col h-full overflow-hidden justify-between space-y-3 pb-1">
      
      {/* 1. Dynamic Header with Title & Settings gear */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-50 dark:border-zinc-850/40 pb-2">
        <h2 className="text-[17px] font-black text-slate-850 dark:text-zinc-100 tracking-tight leading-none">
          Reminders
        </h2>
        
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="p-2 text-slate-600 dark:text-zinc-400 hover:text-primary dark:hover:text-green-400 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl cursor-pointer transition-colors active:scale-90"
          title="Notification Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Premium Tab Selector (Upcoming vs History) */}
      <div className="flex-shrink-0 flex bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveSubTab('upcoming')}
          className={`flex-1 text-center py-2 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'upcoming' 
              ? 'bg-white dark:bg-zinc-800 text-brand-green border border-slate-100 dark:border-zinc-700/40 shadow-sm' 
              : 'text-slate-400 dark:text-zinc-500 hover:text-slate-650'
          }`}
        >
          Upcoming ({upcomingItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 text-center py-2 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'history' 
              ? 'bg-white dark:bg-zinc-800 text-brand-green border border-slate-100 dark:border-zinc-700/40 shadow-sm' 
              : 'text-slate-400 dark:text-zinc-500 hover:text-slate-650'
          }`}
        >
          History ({notifications.length})
        </button>
      </div>

      {/* 3. Flexible Dynamic Content Area (Upcoming List / History Log List) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-1">
        <AnimatePresence mode="wait">
          {activeSubTab === 'upcoming' ? (
            <motion.div
              key="upcoming-list"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-2.5"
            >
              {upcomingItems.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 border-dashed rounded-2xl p-7 text-center">
                  <Bell className="w-7 h-7 text-slate-300 dark:text-zinc-650 mx-auto mb-2.5 animate-pulse" />
                  <h4 className="text-[10px] font-black text-slate-850 dark:text-zinc-300 uppercase tracking-widest leading-none">
                    No Upcoming Alarms
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
                    Your stock is in perfect standing!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingItems.map(item => {
                    // Predefined Expiry Alarm trigger formatted string at 9:00 AM (similar to design screenshot example: "20 May 2024, 9:00 AM")
                    const alarmDate = new Date(item.expiryDate);
                    const formattedAlarm = alarmDate.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) + ', 9:00 AM';

                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedProduct(item)}
                        className="flex items-center gap-3.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-3.5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:bg-slate-50 dark:hover:bg-zinc-850/80 transition-colors cursor-pointer"
                      >
                        {/* Rounded Box with elegant green bell */}
                        <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-brand-green flex-shrink-0">
                          <Bell className="w-4.5 h-4.5 fill-current" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-tight truncate leading-none">
                            {item.itemName}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block mt-1.5 leading-none">
                            {formattedAlarm}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history-list"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-2.5"
            >
              {loadingHistory ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 border-dashed rounded-2xl p-7 text-center">
                  <CheckCircle2 className="w-7 h-7 text-slate-300 dark:text-zinc-650 mx-auto mb-2.5" />
                  <h4 className="text-[10px] font-black text-slate-850 dark:text-zinc-300 uppercase tracking-widest leading-none">
                    Log Feed Empty
                  </h4>
                  <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
                    No historical logs captured.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map(n => (
                    <div
                      key={n._id}
                      onClick={() => {
                        if (n.groceryId) {
                          setSelectedProduct(n.groceryId);
                        }
                      }}
                      className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-3.5 flex justify-between items-start gap-3 hover:bg-slate-50 dark:hover:bg-zinc-850/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 flex-shrink-0">
                          {n.type === 'expiry' ? (
                            <div className="w-7 h-7 bg-amber-50 dark:bg-amber-950/20 rounded-xl flex items-center justify-center text-brand-orange border border-amber-100 dark:border-amber-900/50">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 bg-emerald-50 dark:bg-green-950/20 rounded-xl flex items-center justify-center text-primary dark:text-green-400 border border-green-100 dark:border-green-900/50">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-850 dark:text-zinc-200 leading-none">
                            {n.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed mt-1">
                            {n.message}
                          </p>
                          <span className="text-[8px] text-slate-400 dark:text-zinc-500 block mt-2 font-bold uppercase tracking-wider">
                            Received at {new Date(n.sentAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearAlert(n._id);
                        }}
                        className="p-1.5 text-slate-350 dark:text-zinc-650 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Product Details Modal Sheet Overlay */}
      <ProductDetailsModal
        item={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* 5. Reminders Configuration Modal Sheet overlay (⚙️ Settings control panel) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              className="absolute inset-0 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
            />

            <motion.div
              className="relative bg-zinc-950 w-full md:max-w-md rounded-t-custom md:rounded-custom shadow-2xl flex flex-col overflow-hidden z-10 border border-zinc-800"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                    Reminders Control
                  </h3>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block leading-none mt-1">
                    Manage alerts on mobile & laptop
                  </span>
                </div>
                
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors border border-zinc-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Intervals list and switches */}
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">

                {/* Interval selection */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    Reminder Intervals
                  </h4>

                  {/* 7 Days */}
                  <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-zinc-300">
                      7 days before expiry
                    </span>
                    <button
                      onClick={() => updateIntervalSetting('sevenDays', !intervals.sevenDays)}
                      className={`w-9 h-5.5 rounded-full p-0.5 transition-all duration-200 relative cursor-pointer ${
                        intervals.sevenDays ? 'bg-primary' : 'bg-zinc-800'
                      }`}
                    >
                      <div 
                        className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                          intervals.sevenDays ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 3 Days */}
                  <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-zinc-300">
                      3 days before expiry
                    </span>
                    <button
                      onClick={() => updateIntervalSetting('threeDays', !intervals.threeDays)}
                      className={`w-9 h-5.5 rounded-full p-0.5 transition-all duration-200 relative cursor-pointer ${
                        intervals.threeDays ? 'bg-primary' : 'bg-zinc-800'
                      }`}
                    >
                      <div 
                        className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                          intervals.threeDays ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 1 Day */}
                  <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-zinc-300">
                      1 day before expiry
                    </span>
                    <button
                      onClick={() => updateIntervalSetting('oneDay', !intervals.oneDay)}
                      className={`w-9 h-5.5 rounded-full p-0.5 transition-all duration-200 relative cursor-pointer ${
                        intervals.oneDay ? 'bg-primary' : 'bg-zinc-800'
                      }`}
                    >
                      <div 
                        className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                          intervals.oneDay ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Same Day */}
                  <div className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl">
                    <span className="text-[10px] font-extrabold text-zinc-300">
                      On day of expiry
                    </span>
                    <button
                      onClick={() => updateIntervalSetting('sameDay', !intervals.sameDay)}
                      className={`w-9 h-5.5 rounded-full p-0.5 transition-all duration-200 relative cursor-pointer ${
                        intervals.sameDay ? 'bg-primary' : 'bg-zinc-800'
                      }`}
                    >
                      <div 
                        className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                          intervals.sameDay ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

              </div>

              {/* Action save block */}
              <div className="px-5 py-4 border-t border-zinc-800 bg-zinc-900/30">
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 py-3 rounded-xl text-[9px] font-black tracking-widest uppercase transition-colors cursor-pointer border border-zinc-700/60"
                >
                  SAVE & CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
