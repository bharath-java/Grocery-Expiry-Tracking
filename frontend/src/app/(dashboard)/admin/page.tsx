'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import api from '../../../lib/api';
import { 
  ShieldAlert, Users, Bell, AlertTriangle, Play, Loader2, 
  CheckCircle2, RefreshCw, Eye, ArrowRight, UserPlus, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminStats {
  kpis: {
    totalUsers: number;
    activeUsers: number;
    totalNotifications: number;
    expiredCount: number;
    expiringSoonCount: number;
    goodCount: number;
  };
  activityLogs: {
    timestamp: string;
    type: 'user_register' | 'grocery_added';
    message: string;
  }[];
}

interface DBUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  verified: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setActiveTab } = useUIStore();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [cronTriggering, setCronTriggering] = useState(false);
  const [cronResult, setCronResult] = useState<any>(null);

  useEffect(() => {
    // Role-based auth guard check
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setActiveTab('admin');
    fetchAdminData();
  }, [user, router, setActiveTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data.data);

      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, currentRole: 'user' | 'admin') => {
    const nextRole = currentRole === 'user' ? 'admin' : 'user';
    try {
      await api.put(`/admin/users/${userId}/role`, { role: nextRole });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: nextRole } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerCron = async () => {
    setCronTriggering(true);
    setCronResult(null);
    try {
      const res = await api.post('/admin/trigger-cron');
      setCronResult(res.data.data);
      // Refresh statistics after scan
      await fetchAdminData();
      
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 80, spread: 60 });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cron execution failed');
    } finally {
      setCronTriggering(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-base font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            <span>Admin Console</span>
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-widest mt-0.5">
            System performance dashboard controls
          </p>
        </div>

        <button
          onClick={handleTriggerCron}
          disabled={cronTriggering}
          className="bg-red-600 hover:bg-red-500 disabled:bg-red-400 text-white text-[10px] font-bold px-4.5 py-3 rounded-2xl flex items-center gap-1.5 shadow-lg shadow-red-500/10 cursor-pointer active:scale-95 transition-all"
        >
          {cronTriggering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>RUNNING DAILY EXPIRY CRON SCAN...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>TRIGGER DAILY CRON REMINDERS</span>
            </>
          )}
        </button>
      </div>

      {/* Cron Scan Completion Modal Dialog */}
      <AnimatePresence>
        {cronResult && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setCronResult(null)} />
            <motion.div
              className="relative bg-white dark:bg-zinc-900 max-w-sm w-full border border-slate-100 dark:border-zinc-800 rounded-custom p-6 shadow-2xl flex flex-col items-center text-center z-10 select-none"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="w-12 h-12 bg-emerald-50 dark:bg-green-950/20 border border-green-150 dark:border-green-900 rounded-2xl flex items-center justify-center text-primary dark:text-green-400 mb-4 animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                Reminders Scan Completed!
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed max-w-xs mt-2">
                The daily scan finished successfully. Pushed out multi-channel reminders to subscribers.
              </p>
              
              <div className="w-full bg-slate-50 dark:bg-zinc-800/50 p-4.5 rounded-2xl grid grid-cols-2 gap-4.5 my-4.5 text-left border border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="text-[9px] text-slate-450 dark:text-zinc-500 font-extrabold uppercase block tracking-wider leading-none">
                    Users Processed
                  </span>
                  <span className="text-lg font-black text-slate-800 dark:text-zinc-150 block mt-1">
                    {cronResult.processedCount}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-450 dark:text-zinc-500 font-extrabold uppercase block tracking-wider leading-none">
                    Alerts Sent
                  </span>
                  <span className="text-lg font-black text-primary dark:text-green-400 block mt-1">
                    {cronResult.alertsSent}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCronResult(null)}
                className="w-full bg-primary hover:bg-primary-light text-white text-xs font-bold py-3.5 rounded-2xl cursor-pointer"
              >
                CLOSE OVERLAY
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KPI stats section */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-5 rounded-2xl text-left">
            <Users className="w-4 h-4 text-slate-400 mb-2" />
            <h4 className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              Total Users
            </h4>
            <span className="text-xl font-black text-slate-800 dark:text-zinc-150 block mt-1">
              {stats.kpis.totalUsers}
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-5 rounded-2xl text-left">
            <CheckCircle2 className="w-4 h-4 text-primary mb-2" />
            <h4 className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              Active Users
            </h4>
            <span className="text-xl font-black text-slate-800 dark:text-zinc-150 block mt-1">
              {stats.kpis.activeUsers}
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-5 rounded-2xl text-left">
            <Bell className="w-4 h-4 text-blue-500 mb-2" />
            <h4 className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              Total Alerts Sent
            </h4>
            <span className="text-xl font-black text-slate-800 dark:text-zinc-150 block mt-1">
              {stats.kpis.totalNotifications}
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-5 rounded-2xl text-left">
            <AlertTriangle className="w-4 h-4 text-brand-orange mb-2" />
            <h4 className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
              Expired items
            </h4>
            <span className="text-xl font-black text-slate-800 dark:text-zinc-150 block mt-1">
              {stats.kpis.expiredCount}
            </span>
          </div>
        </section>
      )}

      {/* Main grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Accounts Management list */}
        <section className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-custom p-6 shadow-[0_2px_12px_rgba(0,0,0,0.01)] text-left select-none space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            System User Directory
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-50 dark:border-zinc-800 text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">
                  <th className="py-2.5">User name</th>
                  <th className="py-2.5">Email address</th>
                  <th className="py-2.5">Active Role</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/60 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-850/40">
                    <td className="py-3 font-bold text-slate-800 dark:text-zinc-200">{u.name}</td>
                    <td className="py-3">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                        u.role === 'admin' 
                          ? 'bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-100 dark:border-red-900/50' 
                          : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 border border-slate-100 dark:border-zinc-700/50'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {u._id !== user?.id && (
                        <button
                          onClick={() => handleUpdateRole(u._id, u.role)}
                          className="text-[10px] font-bold text-primary dark:text-green-400 cursor-pointer"
                        >
                          Toggle Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Real-time activity logs */}
        {stats && (
          <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-custom p-6 shadow-[0_2px_12px_rgba(0,0,0,0.01)] text-left select-none space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Real-time Log Feed</span>
            </h3>

            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {stats.activityLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <div className="mt-1 flex-shrink-0">
                    {log.type === 'user_register' ? (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-normal font-semibold">
                      {log.message}
                    </p>
                    <span className="text-[8px] text-slate-400 dark:text-zinc-550 block mt-1 font-bold">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
