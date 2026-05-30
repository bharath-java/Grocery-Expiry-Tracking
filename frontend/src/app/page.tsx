'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function RootPage() {
  const router = useRouter();
  const { initAuth } = useAuthStore();

  useEffect(() => {
    router.push('/landing');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-stone-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
          Routing Session...
        </span>
      </div>
    </div>
  );
}
