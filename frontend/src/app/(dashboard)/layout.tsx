'use client';

import { useEffect, useState } from 'react';
import BottomNav from '../../components/layout/BottomNav';
import AddGroceryModal from '../../components/groceries/AddGroceryModal';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';
import AIAssistantModal from '../../components/groceries/AIAssistantModal';
import { useUIStore } from '../../store/uiStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isAIOpen, closeAIModal } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-screen bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-200">
      {/* 1. Desktop View Layout (screens >= lg) */}
      <div className="hidden lg:flex h-screen w-full overflow-hidden">
        {/* Left Side: Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* Right Side: Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-50 dark:bg-zinc-900/40">
          {/* Topbar */}
          <Topbar />
          
          {/* Scrollable Content Viewport */}
          <main className="flex-grow min-h-0 overflow-y-auto px-10 py-8 w-full max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* 2. Mobile / Tablet View Layout (screens < lg) - EXACTLY the original centered smartphone frame */}
      <div className="flex lg:hidden h-[100dvh] w-screen overflow-hidden bg-slate-100 dark:bg-zinc-950 items-center justify-center py-0 font-sans">
        <div className="w-full h-full relative overflow-hidden flex flex-col bg-slate-50 dark:bg-zinc-900">
          {/* Main App Content Viewport */}
          <div className="flex-grow min-h-0 overflow-hidden relative flex flex-col px-4.5 pt-4 pb-[76px]">
            {children}
          </div>

          {/* Custom Mobile-First Bottom Nav Bar */}
          <BottomNav />
        </div>
      </div>

      {/* Global Add Grocery Modal / Form Drawer (active for both layouts) */}
      <AddGroceryModal />

      {/* Global AI Assistant Modal */}
      <AIAssistantModal isOpen={isAIOpen} onClose={closeAIModal} />
    </div>
  );
}
