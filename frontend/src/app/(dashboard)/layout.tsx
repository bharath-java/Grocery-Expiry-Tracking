'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import BottomNav from '../../components/layout/BottomNav';
import AddGroceryModal from '../../components/groceries/AddGroceryModal';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-slate-100 dark:bg-zinc-950 flex items-center justify-center py-0 lg:py-3 font-sans">
      {/* High-Fidelity Smartphone Device Frame (Screens 1-10) */}
      <div className="w-full h-full lg:h-[780px] lg:max-h-[84vh] lg:aspect-[360/780] lg:w-auto lg:rounded-[36px] lg:border-[10px] lg:border-slate-900 lg:dark:border-zinc-800 lg:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] relative overflow-hidden flex flex-col bg-slate-50 dark:bg-zinc-900">
        
        {/* Main App Content Viewport */}
        <div className="flex-grow min-h-0 overflow-hidden relative flex flex-col px-4.5 pt-4 pb-[76px]">
          {children}
        </div>

        {/* Global Add Grocery Modal / Form Drawer */}
        <AddGroceryModal />

        {/* Custom Mobile-First Bottom Nav Bar */}
        <BottomNav />

        {/* Mock Home Indicator for smartphone shell */}
        <div className="absolute bottom-1 left-0 right-0 h-4 flex items-center justify-center pointer-events-none select-none z-50 hidden lg:flex">
          <div className="w-32 h-1 bg-slate-900/60 dark:bg-zinc-100/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}
