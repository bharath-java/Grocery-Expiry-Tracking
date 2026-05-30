'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle2, AlertTriangle, Info, Globe, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useI18nStore, Language } from '../../store/i18nStore';
import { useThemeStore } from '../../store/themeStore';
import api, { BACKEND_URL } from '../../lib/api';
import { io } from 'socket.io-client';

interface DBNotification {
  _id: string;
  title: string;
  message: string;
  type: 'expiry' | 'system' | 'info';
  status: 'read' | 'unread';
  sentAt: string;
}

export default function Topbar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setActiveTab } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();
  const { lang, setLanguage, t } = useI18nStore();

  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const list = res.data.data || [];
      setNotifications(list);
      setUnreadCount(list.filter((n: DBNotification) => n.status === 'unread').length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Connect Socket.io client for real-time updates!
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || BACKEND_URL;
      const socket = io(socketUrl);

      socket.on('connect', () => {
        socket.emit('joinRoom', user.id);
      });

      socket.on('groceryUpdate', () => {
        // Trigger a notifications re-fetch when items change
        fetchNotifications();
      });

      // Cleanup
      return () => {
        socket.disconnect();
      };
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'EN' },
    { code: 'es', name: 'ES' },
    { code: 'fr', name: 'FR' },
    { code: 'ar', name: 'AR' }
  ];

  return (
    <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-100 dark:border-zinc-800/80 px-4 md:px-8 py-3.5 flex justify-between items-center z-30 select-none">
      {/* Mobile-Only Header Brand */}
      <div className="md:hidden flex items-center gap-2">
        <span className="text-xl">🍏</span>
        <h1 className="text-sm font-extrabold text-primary dark:text-green-500">
          {t('title')}
        </h1>
      </div>

      {/* Desktop Greeting Header */}
      <div className="hidden md:block">
        <h2 className="text-base font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-1">
          {t('hiUser')} <span className="animate-wiggle">👋</span>
        </h2>
        <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
          {t('slogan')}
        </p>
      </div>

      {/* Action Controllers */}
      <div className="flex items-center gap-3">
        {/* Mobile controls for Theme & Lang */}
        <div className="md:hidden flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800/80 px-2 py-1 rounded-xl">
          <button 
            onClick={() => toggleTheme()}
            className="text-slate-500 dark:text-zinc-400 p-0.5"
          >
            {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
          <span className="w-[1px] h-3 bg-slate-200 dark:bg-zinc-700 mx-1"></span>
          <button
            onClick={() => {
              const idx = languages.findIndex(l => l.code === lang);
              const nextLang = languages[(idx + 1) % languages.length].code;
              setLanguage(nextLang);
            }}
            className="text-[10px] font-extrabold text-primary dark:text-green-400 px-0.5"
          >
            {lang.toUpperCase()}
          </button>
        </div>

        {/* Real-time Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-300 flex items-center justify-center border border-slate-100 dark:border-zinc-700/50 transition-all duration-150 cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse border border-white dark:border-zinc-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className={`absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-xl rounded-2xl p-4 z-50 text-left ${lang === 'ar' ? 'left-0 right-auto' : 'right-0'}`}>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-2.5 mb-2.5">
                <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-primary hover:text-primary-light dark:text-green-400 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                    No new alerts
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = n.status === 'unread';
                    return (
                      <div
                        key={n._id}
                        className={`p-2.5 rounded-xl border flex gap-2.5 transition-all duration-150 ${
                          isUnread
                            ? 'bg-primary-bg/40 dark:bg-green-950/20 border-green-100 dark:border-green-950/50'
                            : 'bg-white dark:bg-zinc-900 border-slate-50 dark:border-zinc-800'
                        }`}
                      >
                        <div className="mt-0.5">
                          {n.type === 'expiry' ? (
                            <AlertTriangle className="w-4 h-4 text-brand-orange" />
                          ) : n.type === 'system' ? (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          ) : (
                            <Info className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                            {n.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-snug mt-0.5">
                            {n.message}
                          </p>
                          <span className="text-[8px] text-slate-400 dark:text-zinc-500 block mt-1.5 font-medium">
                            {new Date(n.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile avatar circular shortcut */}
        <button
          onClick={() => {
            setActiveTab('profile');
            router.push('/profile');
          }}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition-all duration-150"
        >
          {user?.avatar ? (
            <img 
              src={user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-xs font-bold text-primary dark:text-green-400 uppercase">
              {user?.name?.substring(0, 2) || 'US'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
