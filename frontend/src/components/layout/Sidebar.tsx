'use client';

import { useRouter } from 'next/navigation';
import { Home, LayoutGrid, Plus, Bell, User, ShieldAlert, LogOut, Sun, Moon, Globe } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useI18nStore, Language } from '../../store/i18nStore';
import { motion } from 'framer-motion';

export default function Sidebar() {
  const router = useRouter();
  const { activeTab, setActiveTab, openAddModal } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { lang, setLanguage, t } = useI18nStore();

  const handleNavClick = (tabId: string, route?: string) => {
    if (tabId === 'add') {
      openAddModal();
    } else {
      setActiveTab(tabId as any);
      if (route) router.push(route);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/landing');
  };

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'EN' },
    { code: 'es', name: 'ES' },
    { code: 'fr', name: 'FR' },
    { code: 'ar', name: 'AR' }
  ];

  return (
    <div className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-zinc-900 border-r border-slate-100 dark:border-zinc-800 p-6 z-40 select-none">
      {/* Brand Logo Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-bg dark:bg-green-950/40 rounded-xl flex items-center justify-center">
          <span className="text-xl">🍏</span>
        </div>
        <div>
          <h1 className="text-base font-bold text-primary dark:text-green-500 tracking-tight leading-none">
            {t('title')}
          </h1>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
            Let's prevent food waste
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 flex flex-col gap-1.5">
        <button
          onClick={() => handleNavClick('home', '/dashboard')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            activeTab === 'home'
              ? 'bg-primary-bg dark:bg-green-950/40 text-primary dark:text-green-400'
              : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>{t('home')}</span>
        </button>

        <button
          onClick={() => handleNavClick('categories', '/categories')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-primary-bg dark:bg-green-950/40 text-primary dark:text-green-400'
              : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span>{t('categories')}</span>
        </button>

        <button
          onClick={() => handleNavClick('reminders', '/reminders')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            activeTab === 'reminders'
              ? 'bg-primary-bg dark:bg-green-950/40 text-primary dark:text-green-400'
              : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>{t('reminders')}</span>
        </button>

        <button
          onClick={() => handleNavClick('profile', '/profile')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-150 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-primary-bg dark:bg-green-950/40 text-primary dark:text-green-400'
              : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <User className="w-5 h-5" />
          <span>{t('profile')}</span>
        </button>

        <button
          onClick={() => openAddModal()}
          className="flex items-center justify-center gap-2 mt-4 px-4 py-3 rounded-2xl bg-primary hover:bg-primary-light text-white text-sm font-bold shadow-lg shadow-green-500/10 hover:shadow-green-500/20 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>{t('addGrocery')}</span>
        </button>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-zinc-800 pt-4">
        {/* Language picker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500 font-medium">
            <Globe className="w-4 h-4" />
            <span>Lang</span>
          </div>
          <div className="flex gap-1 bg-slate-50 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-100 dark:border-zinc-700">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all duration-150 ${
                  lang === l.code
                    ? 'bg-white dark:bg-zinc-700 shadow-sm text-primary dark:text-green-400'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">
            {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
          </span>
          <button
            onClick={() => toggleTheme()}
            className="w-10 h-6 bg-slate-100 dark:bg-zinc-800 rounded-full p-0.5 transition-all duration-200 relative cursor-pointer"
          >
            <motion.div
              layout
              className="w-5 h-5 bg-white dark:bg-zinc-700 rounded-full flex items-center justify-center shadow-sm"
              animate={{ x: theme === 'light' ? 0 : 16 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {theme === 'light' ? (
                <Sun className="w-3 h-3 text-amber-500" />
              ) : (
                <Moon className="w-3 h-3 text-indigo-400" />
              )}
            </motion.div>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
