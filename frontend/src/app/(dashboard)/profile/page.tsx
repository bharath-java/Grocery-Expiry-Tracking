'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useGroceryStore, GroceryItem } from '../../../store/groceryStore';
import { useUIStore } from '../../../store/uiStore';
import { useThemeStore } from '../../../store/themeStore';
import { useI18nStore } from '../../../store/i18nStore';
import api, { BACKEND_URL } from '../../../lib/api';
import { 
  User, Mail, Shield, Download, Upload, Lock, 
  Camera, Loader2, FileDown, CheckCircle2, History, 
  AlertTriangle, ChevronRight, Globe, Moon, Sun, 
  HelpCircle, LogOut, Search, Filter, Trash2, ArrowLeft,
  Check, RefreshCw, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setAuth, clearAuth } = useAuthStore();
  const { groceries, fetchGroceries } = useGroceryStore();
  const { setActiveTab } = useUIStore();
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const { lang, setLanguage, t } = useI18nStore();

  // Active view: 'main' | 'security' | 'backup' | 'archives' | 'language' | 'theme' | 'help'
  const [currentView, setCurrentView] = useState<'main' | 'security' | 'backup' | 'archives' | 'language' | 'theme' | 'help'>('main');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Passwords
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'bg-red-500' });
  const [securityOtpSent, setSecurityOtpSent] = useState(false);
  const [securityOtp, setSecurityOtp] = useState('');
  const [security2FA, setSecurity2FA] = useState(false);

  // Email verification/OTP change flow states
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  
  // Archival lists & search/filter
  const [archivedItems, setArchivedItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // UI Utils
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Help Center form
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveTab('profile');
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarPreview(user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}${user.avatar}`) : null);
      if (user.language) setLanguage(user.language as any);
      if (user.theme) setTheme(user.theme as any);
    }
    fetchGroceries();
    fetchArchivedList();
  }, [user, setActiveTab]);

  // Handle password strength calculation
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength({ score: 0, label: 'None', color: 'bg-slate-700' });
      return;
    }
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    let label = 'Weak';
    let color = 'bg-red-500';
    if (score >= 4) {
      label = 'Strong';
      color = 'bg-green-500';
    } else if (score >= 2) {
      label = 'Medium';
      color = 'bg-yellow-500';
    }
    setPasswordStrength({ score, label, color });
  }, [newPassword]);

  const fetchArchivedList = async () => {
    try {
      const res = await api.get('/profile/archives');
      setArchivedItems(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Profile Save Flow
  const handleProfileSaveAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }

    await saveProfileDetails(email);
  };

  const saveProfileDetails = async (verifiedEmail: string) => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', verifiedEmail);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    try {
      const res = await api.put('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updatedUser = res.data.data;
      
      const token = localStorage.getItem('accessToken') || '';
      const rToken = localStorage.getItem('refreshToken') || '';
      setAuth(updatedUser, token, rToken);
      setSuccessMsg('Profile details saved successfully!');
      setAvatarFile(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save profile details.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP for Email Change
  const handleVerifyEmailOtp = async () => {
    setEmailOtpLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/profile/verify-otp', { email, otp: emailOtp });
      setShowEmailOtpModal(false);
      setEmailOtp('');
      await saveProfileDetails(email);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setEmailOtpLoading(false);
    }
  };

  // Change Password
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/profile/change-password', { currentPassword, newPassword });
      setSuccessMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentView('main');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  // CSV Data Exporter
  const handleExportCSV = () => {
    if (groceries.length === 0) {
      setErrorMsg('No grocery records available to export.');
      return;
    }

    const headers = ['Item Name', 'Category', 'Quantity', 'Purchase Date', 'Expiry Date', 'Status', 'Notes'];
    const rows = groceries.map((item: GroceryItem) => [
      `"${item.itemName.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.quantity}"`,
      item.purchaseDate.split('T')[0],
      item.expiryDate.split('T')[0],
      item.status,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map((e: string[]) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `grocery_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg('CSV backup downloaded successfully!');
  };

  // PDF Report Exporter
  const handleExportPDF = async () => {
    if (groceries.length === 0) {
      setErrorMsg('No grocery records available to export.');
      return;
    }

    setLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(46, 125, 50); 
      doc.text("GROCERY INVENTORY REPORT", 20, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(117, 117, 117);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 26);
      doc.line(20, 29, 190, 29);

      let y = 38;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 26, 26);
      doc.text("Item Name", 20, y);
      doc.text("Category", 75, y);
      doc.text("Quantity", 120, y);
      doc.text("Expiry Date", 155, y);
      
      doc.line(20, y+2, 190, y+2);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);

      groceries.forEach((item: GroceryItem) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }

        const dateStr = new Date(item.expiryDate).toISOString().split('T')[0];
        doc.text(item.itemName, 20, y);
        doc.text(item.category, 75, y);
        doc.text(item.quantity, 120, y);
        
        if (item.status === 'Expired') {
          doc.setTextColor(239, 83, 80);
        } else if (item.status === 'Expiring Soon') {
          doc.setTextColor(255, 152, 0);
        } else {
          doc.setTextColor(46, 125, 50);
        }
        
        doc.text(`${dateStr} (${item.status})`, 155, y);
        doc.setTextColor(80, 80, 80);
        y += 7.5;
      });

      doc.save(`grocery_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setSuccessMsg('PDF inventory report generated successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setErrorMsg('Failed to generate PDF backup.');
    } finally {
      setLoading(false);
    }
  };

  // JSON Exporter
  const handleJSONBackup = () => {
    if (groceries.length === 0) {
      setErrorMsg('No grocery records available to backup.');
      return;
    }

    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: user?.email,
      groceries
    };

    const str = JSON.stringify(backupData, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `grocery_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMsg('JSON backup assets exported successfully!');
  };

  // JSON Backup File Import
  const handleJSONRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = async (evt) => {
        try {
          const json = JSON.parse(evt.target?.result as string);
          if (!json.groceries || !Array.isArray(json.groceries)) {
            setErrorMsg('Invalid backup file format structure.');
            return;
          }

          setLoading(true);
          await api.post('/profile/restore', { groceries: json.groceries });
          await fetchGroceries();
          setSuccessMsg('Backup database inventory fully restored!');
        } catch (err) {
          setErrorMsg('Failed to restore backup file contents.');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  // Restore Archived Grocery
  const handleRestoreArchived = async (id: string) => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post(`/profile/archives/${id}/restore`);
      setArchivedItems(prev => prev.filter(i => i._id !== id));
      setSuccessMsg('Archived item restored to active list!');
      await fetchGroceries();
    } catch (err) {
      setErrorMsg('Failed to restore archived grocery.');
    } finally {
      setLoading(false);
    }
  };

  // Permanently Delete Archived Grocery
  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this archived grocery item?')) return;
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.delete(`/profile/archives/${id}`);
      setArchivedItems(prev => prev.filter(i => i._id !== id));
      setSuccessMsg('Grocery item deleted permanently.');
    } catch (err) {
      setErrorMsg('Failed to delete archived item.');
    } finally {
      setLoading(false);
    }
  };

  // Language Change Flow
  const handleLanguageChange = async (code: 'en' | 'te' | 'hi') => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.put('/profile/language', { language: code });
      setLanguage(code);
      const updatedUser = res.data.data;
      const token = localStorage.getItem('accessToken') || '';
      const rToken = localStorage.getItem('refreshToken') || '';
      setAuth(updatedUser, token, rToken);
      setSuccessMsg(t('languageUpdated') || 'Language updated successfully');
    } catch (err) {
      setErrorMsg('Failed to update language.');
    } finally {
      setLoading(false);
    }
  };

  // Theme Change Flow
  const handleThemeChange = async (mode: 'dark' | 'light' | 'system') => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.put('/profile/theme', { theme: mode });
      const targetTheme = mode === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode;
      setTheme(targetTheme);
      const updatedUser = res.data.data;
      const token = localStorage.getItem('accessToken') || '';
      const rToken = localStorage.getItem('refreshToken') || '';
      setAuth(updatedUser, token, rToken);
      setSuccessMsg(t('themeUpdated') || 'Theme updated successfully');
    } catch (err) {
      setErrorMsg('Failed to update theme.');
    } finally {
      setLoading(false);
    }
  };

  // Support Form Submission
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName || !supportEmail || !supportMessage) {
      setErrorMsg('Please fill in all support request fields.');
      return;
    }
    setSupportLoading(true);
    setTimeout(() => {
      setSupportLoading(false);
      setSuccessMsg('Support request sent successfully! We will contact you soon.');
      setSupportName('');
      setSupportEmail('');
      setSupportMessage('');
    }, 1200);
  };

  // Logout Flow
  const handleLogoutConfirm = () => {
    clearAuth();
    setShowLogoutModal(false);
    router.push('/landing');
  };

  // Filter & Search Archived List
  const filteredArchives = archivedItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Reusable Content Form Panels
  const renderProfileDetailsForm = () => {
    return (
      <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-5">
        <form onSubmit={handleProfileSaveAttempt} className="space-y-4">
          <div className="flex flex-col items-center relative mt-1">
            <input 
              type="file" 
              ref={avatarInputRef} 
              onChange={handleAvatarChange} 
              className="hidden" 
              accept="image/*"
            />
            <div className="relative group">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden cursor-pointer"
                style={{ borderRadius: '50%' }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-slate-400 dark:text-zinc-300">
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#2E7D32] hover:bg-[#25632A] rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center text-white shadow-md cursor-pointer"
                style={{ borderRadius: '50%' }}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] mt-2 font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider">
              Change Profile Photo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                {t('name') || 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-[#2E7D32] text-slate-800 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                {t('email') || 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-[#2E7D32] text-slate-800 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#2E7D32] hover:bg-[#25632A] text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 shadow-md shadow-green-500/10 transition-all uppercase tracking-wider"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
              <span>{t('saveDetails') || 'Save Profile Details'}</span>
            </button>
          </div>
        </form>
      </section>
    );
  };

  const renderSecurityForm = () => {
    return (
      <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-5 text-left">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/60">
          <Shield className="w-5 h-5 text-[#2E7D32]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Change Credentials
          </h3>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-[#2E7D32] text-slate-800 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-[#2E7D32] text-slate-800 dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-[#2E7D32] text-slate-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {newPassword && (
            <div className="space-y-1.5 max-w-sm">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>Password Strength</span>
                <span className={`${
                  passwordStrength.label === 'Strong' ? 'text-green-500' :
                  passwordStrength.label === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                }`}>{passwordStrength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${passwordStrength.color} transition-all duration-300`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#2E7D32] hover:bg-[#25632A] text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 shadow-md shadow-green-500/10 transition-all uppercase tracking-wider"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </section>
    );
  };

  const renderBackupForm = () => {
    return (
      <div className="space-y-6 text-left">
        <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
            <Download className="w-5 h-5 text-[#2E7D32]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              Export Database Inventory
            </h3>
          </div>

          <p className="text-xs text-slate-455 dark:text-zinc-400 font-semibold leading-relaxed">
            Download your active tracked groceries archive data. You can export in spreadsheet CSV format, structured JSON layouts, or formatted PDF documents.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-1">
            <button
              onClick={handleJSONBackup}
              className="bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-150 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 py-3.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all uppercase tracking-wider shadow-sm"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>JSON BACKUP</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-150 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 py-3.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all uppercase tracking-wider shadow-sm"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>CSV SPREADSHEET</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-150 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 py-3.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all uppercase tracking-wider shadow-sm"
            >
              <FileDown className="w-4 h-4 text-red-400" />
              <span>PDF REPORT</span>
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
            <Upload className="w-5 h-5 text-[#2E7D32]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              Restore Database
            </h3>
          </div>

          <p className="text-xs text-slate-455 dark:text-zinc-400 font-semibold leading-relaxed">
            Upload a previously exported JSON backup file to restore your entire grocery inventory records. This action replaces current logs.
          </p>

          <input
            type="file"
            ref={jsonInputRef}
            onChange={handleJSONRestore}
            className="hidden"
            accept=".json"
          />

          <div className="pt-1">
            <button
              onClick={() => jsonInputRef.current?.click()}
              disabled={loading}
              className="w-full bg-[#2E7D32] hover:bg-[#25632A] disabled:opacity-40 text-white py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-green-500/10 cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>RESTORE & IMPORT BACKUP FILE</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    );
  };

  const renderArchivesForm = () => {
    return (
      <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 text-left">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
          <History className="w-5 h-5 text-[#2E7D32]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Consumption Archives
          </h3>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search archives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs focus:outline-none focus:border-[#2E7D32] text-slate-800 dark:text-zinc-100 placeholder-slate-405"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-8 pr-6 py-2 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 focus:outline-none focus:border-[#2E7D32] appearance-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Dairy & Eggs">Dairy & Eggs</option>
              <option value="Fruits & Vegetables">Fruits & Vegetables</option>
              <option value="Bakery">Bakery</option>
              <option value="Meat & Fish">Meat & Fish</option>
              <option value="Pantry">Pantry</option>
              <option value="Beverages">Beverages</option>
              <option value="Snacks">Snacks</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </div>

        {/* List Body */}
        {filteredArchives.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-zinc-555 flex flex-col items-center justify-center gap-2">
            <History className="w-8 h-8 text-slate-300 dark:text-zinc-700 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">No matching archives found</span>
          </div>
        ) : (
          <div className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60 max-h-[300px] overflow-y-auto no-scrollbar">
            {filteredArchives.map((item) => (
              <div key={item._id} className="p-3.5 flex items-center justify-between gap-3 bg-slate-50/20 dark:bg-zinc-900/40 hover:bg-slate-50/80 dark:hover:bg-zinc-850/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate">
                    {item.itemName}
                  </h4>
                  <span className="text-[9px] text-brand-green font-bold block mt-0.5 uppercase tracking-wide">
                    {item.category} — Qty: {item.quantity}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleRestoreArchived(item._id)}
                    disabled={loading}
                    className="bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-950/80 border border-green-100 dark:border-green-900/50 text-[#2E7D32] dark:text-green-400 text-[9px] font-black px-2.5 py-1.5 rounded-lg cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
                  >
                    RESTORE
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(item._id)}
                    disabled={loading}
                    className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/80 border border-red-150 dark:border-red-900/50 text-red-550 dark:text-red-400 text-[9px] font-black p-1.5 rounded-lg cursor-pointer active:scale-95 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderLanguageForm = () => {
    return (
      <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 text-left">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
          <Globe className="w-5 h-5 text-[#2E7D32]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            {t('language') || 'Select Language'}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { code: 'en', name: 'English', desc: 'System Standard English' },
            { code: 'te', name: 'Telugu (తెలుగు)', desc: 'Regional Telugu Localization' },
            { code: 'hi', name: 'Hindi (हिन्दी)', desc: 'Standard Hindi Localization' }
          ].map((item) => {
            const isSelected = lang === item.code;
            return (
              <button
                key={item.code}
                onClick={() => handleLanguageChange(item.code as any)}
                disabled={loading}
                className={`p-4 rounded-xl flex flex-col text-left justify-between border transition-all cursor-pointer min-h-[100px] ${
                  isSelected 
                    ? 'bg-green-50/50 dark:bg-green-950/30 border-[#2E7D32] text-slate-800 dark:text-white'
                    : 'bg-slate-50 dark:bg-zinc-850 border-slate-150 dark:border-zinc-800 text-slate-655 dark:text-zinc-350 hover:bg-slate-100/50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <h4 className="text-xs font-black">{item.name}</h4>
                  {isSelected && (
                    <div className="w-4.5 h-4.5 rounded-full bg-[#2E7D32] flex items-center justify-center text-white" style={{ borderRadius: '50%' }}>
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block mt-2 uppercase tracking-wide">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  const renderThemeForm = () => {
    return (
      <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 text-left">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
          <Moon className="w-5 h-5 text-[#2E7D32]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            {t('themeSettings') || 'Theme Settings'}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { code: 'dark', name: 'Dark Mode', desc: 'Luxury deep dark visual contrast', icon: Moon },
            { code: 'light', name: 'Light Mode', desc: 'Bright standard high visibility', icon: Sun },
            { code: 'system', name: 'System Theme', desc: 'Synchronize color theme', icon: RefreshCw }
          ].map((item) => {
            const isSelected = theme === item.code;
            const TIcon = item.icon;
            return (
              <button
                key={item.code}
                onClick={() => handleThemeChange(item.code as any)}
                disabled={loading}
                className={`p-4 rounded-xl flex flex-col text-left justify-between border transition-all cursor-pointer min-h-[110px] ${
                  isSelected 
                    ? 'bg-green-50/50 dark:bg-green-950/30 border-[#2E7D32] text-slate-800 dark:text-white'
                    : 'bg-slate-50 dark:bg-zinc-850 border-slate-150 dark:border-zinc-800 text-slate-655 dark:text-zinc-350 hover:bg-slate-100/50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-[#2E7D32] text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                  }`}>
                    <TIcon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <div className="w-4.5 h-4.5 rounded-full bg-[#2E7D32] flex items-center justify-center text-white" style={{ borderRadius: '50%' }}>
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-black">{item.name}</h4>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block mt-0.5 uppercase tracking-wide">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  const renderHelpForm = () => {
    return (
      <div className="space-y-6 text-left">
        <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
            <HelpCircle className="w-5 h-5 text-[#2E7D32]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { q: 'How do I add a new grocery item?', a: 'Tap the circular "+" button in the dashboard or click "Add Grocery" on top. Fill in the name, category, quantity, and expiry details.' },
              { q: 'How do notification alerts work?', a: 'The app schedules daily automated reminder scans at 9:00 AM. It automatically flags items that are "Expired" or "Expiring Soon".' },
              { q: 'Can I restore consumed groceries?', a: 'Absolutely! Click the "Archives" settings option inside your profile. You can instantly restore any consumed item back to active logs.' },
              { q: 'How do I export inventory databases?', a: 'Navigate to "Backup" in settings. You can instantly download JSON archives, CSV spreadsheets, or formatted PDF reports.' }
            ].map((item, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <div key={idx} className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                    className="w-full p-3.5 text-left bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100/50 flex items-center justify-between text-xs font-extrabold text-slate-850 dark:text-zinc-200 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90 text-[#2E7D32]' : 'text-slate-350'}`} />
                  </button>
                  {isOpen && (
                    <div className="p-3.5 bg-slate-50/20 dark:bg-zinc-900/30 text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800/40">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
            <MessageSquare className="w-5 h-5 text-[#2E7D32]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              Contact Support Form
            </h3>
          </div>

          <form onSubmit={handleSupportSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Your Name"
                value={supportName}
                onChange={(e) => setSupportName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs focus:outline-none focus:border-[#2E7D32] text-slate-800 dark:text-zinc-100 placeholder-slate-400"
              />
              <input
                type="email"
                required
                placeholder="Your Email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs focus:outline-none focus:border-[#2E7D32] text-slate-800 dark:text-zinc-100 placeholder-slate-400"
              />
            </div>

            <textarea
              required
              rows={3}
              placeholder="Describe your issue or feedback..."
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs focus:outline-none focus:border-[#2E7D32] text-slate-800 dark:text-zinc-100 placeholder-slate-400 resize-none"
            />

            <div className="text-right">
              <button
                type="submit"
                disabled={supportLoading}
                className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#25632A] disabled:opacity-40 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
              >
                {supportLoading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                <span>SUBMIT REQUEST</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    );
  };

  const getDesktopViewTitle = () => {
    switch (currentView) {
      case 'security': return 'Security Settings';
      case 'backup': return 'Backup & Export';
      case 'archives': return 'Archives Database';
      case 'language': return 'Language Settings';
      case 'theme': return 'Visual Theme';
      case 'help': return 'Help & Support';
      case 'main':
      default:
        return 'Profile details';
    }
  };

  const renderActiveDesktopPane = () => {
    switch (currentView) {
      case 'security': return renderSecurityForm();
      case 'backup': return renderBackupForm();
      case 'archives': return renderArchivesForm();
      case 'language': return renderLanguageForm();
      case 'theme': return renderThemeForm();
      case 'help': return renderHelpForm();
      case 'main':
      default:
        return renderProfileDetailsForm();
    }
  };

  return (
    <div className="select-none h-full flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* 1. DESKTOP SAAS VIEW (lg and above)                                       */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-6 flex-grow w-full h-full">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-150 tracking-tight">
            Account Preferences
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">
            Manage account authentication, backup tools, archives database, and UI themes
          </p>
        </div>

        {/* Global Notifications inside Desktop Panel */}
        <AnimatePresence>
          {(successMsg || errorMsg) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-shrink-0"
            >
              {successMsg && (
                <div className="bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900/30 text-[#2E7D32] dark:text-green-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#2E7D32] dark:text-green-400 animate-bounce" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30 text-red-550 dark:text-red-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500 dark:text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-12 gap-6 flex-1 items-start min-h-0">
          
          {/* Left Navigation Sidebar */}
          <div className="col-span-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800/60">
              <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                Settings Menu
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
              {[
                { id: 'main', label: 'Profile details', icon: User },
                { id: 'security', label: 'Security Credentials', icon: Shield },
                { id: 'backup', label: 'Backup & Restore', icon: Download },
                { id: 'archives', label: 'Archives Log', icon: History },
                { id: 'language', label: 'Language Settings', icon: Globe },
                { id: 'theme', label: 'Visual Theme', icon: Moon },
                { id: 'help', label: 'Help Center', icon: HelpCircle },
              ].map(item => {
                const NavIcon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as any);
                      setSuccessMsg('');
                      setErrorMsg('');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-left cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-green-50/50 dark:bg-green-950/20 text-[#2E7D32] dark:text-green-400' 
                        : 'hover:bg-slate-50 dark:hover:bg-zinc-850/40 text-slate-700 dark:text-zinc-350'
                    }`}
                  >
                    <NavIcon className={`w-4 h-4 ${isActive ? 'text-[#2E7D32] dark:text-green-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Right Active Content Panel */}
          <div className="col-span-9 space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 px-6 py-4 rounded-2xl shadow-sm">
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                {getDesktopViewTitle()}
              </h3>
            </div>
            {renderActiveDesktopPane()}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ORIGINAL MOBILE VIEW (lg hidden)                                       */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col h-full overflow-hidden justify-between space-y-3 pb-1">
        
        {/* Dynamic Header */}
        <div className="flex-shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-850 dark:text-zinc-100 uppercase tracking-wider">
              {t('settings') || 'PROFILE SETTINGS'}
            </h2>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-0.5">
              MANAGE CREDENTIALS & BACKUP ASSETS
            </p>
          </div>
          {currentView !== 'main' && (
            <button
              onClick={() => {
                setCurrentView('main');
                setSuccessMsg('');
                setErrorMsg('');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 text-xs font-bold text-slate-655 cursor-pointer active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('back') || 'Back'}</span>
            </button>
          )}
        </div>

        {/* Global Notifications for Mobile */}
        <AnimatePresence>
          {(successMsg || errorMsg) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-shrink-0"
            >
              {successMsg && (
                <div className="bg-green-50 border border-green-150 dark:bg-green-950/20 dark:border-green-950/40 text-brand-green p-2.5 rounded-2xl text-[11px] font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-brand-green animate-bounce" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="bg-red-50 border border-red-150 dark:bg-red-950/20 dark:border-red-950/40 text-brand-red p-2.5 rounded-2xl text-[11px] font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-brand-red" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content list or single drilldown details */}
        <div className="flex-grow min-h-0 overflow-y-auto no-scrollbar pb-1 space-y-4">
          <AnimatePresence mode="wait">
            {currentView === 'main' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Profile Card Section */}
                <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <form onSubmit={handleProfileSaveAttempt} className="space-y-4">
                    <div className="flex flex-col items-center relative mt-1">
                      <input 
                        type="file" 
                        ref={avatarInputRef} 
                        onChange={handleAvatarChange} 
                        className="hidden" 
                        accept="image/*"
                      />
                      <div className="relative group">
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="relative w-22 h-22 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700/50 flex items-center justify-center overflow-hidden cursor-pointer"
                          style={{ borderRadius: '50%' }}
                        >
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold text-slate-400">
                              {name ? name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute bottom-0 right-0 w-8 h-8 bg-brand-green hover:bg-green-600 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center text-white shadow-md active:scale-90 transition-all cursor-pointer"
                          style={{ borderRadius: '50%' }}
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] mt-2 font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                        TAP TO MODIFY AVATAR
                      </span>
                    </div>

                    <div className="space-y-3.5 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {t('name') || 'FULL NAME'}
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {t('email') || 'EMAIL ADDRESS'}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email address"
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-green hover:bg-green-600 disabled:opacity-40 text-white py-3.5 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>{t('saveDetails') || 'SAVE PROFILE DETAILS'}</span>
                        )}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Settings menu list links */}
                <section className="space-y-2">
                  {[
                    { id: 'security', title: t('security') || 'Security', icon: Shield },
                    { id: 'backup', title: t('backup') || 'Backup', icon: Download },
                    { id: 'archives', title: t('archives') || 'Archives', icon: History },
                    { id: 'language', title: t('language') || 'Language', icon: Globe },
                    { id: 'theme', title: t('themeSettings') || 'Theme Settings', icon: Moon },
                    { id: 'help', title: t('helpCenter') || 'Help Center', icon: HelpCircle },
                    { id: 'logout', title: t('logout') || 'Logout', icon: LogOut, isDanger: true }
                  ].map((item) => {
                    const LinkIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'logout') {
                            setShowLogoutModal(true);
                          } else {
                            setCurrentView(item.id as any);
                            setSuccessMsg('');
                            setErrorMsg('');
                          }
                        }}
                        className="w-full bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            item.isDanger 
                              ? 'bg-red-50 border border-red-100 text-red-500' 
                              : 'bg-green-50 border border-green-100 text-brand-green'
                          }`}>
                            <LinkIcon className="w-5 h-5" />
                          </div>
                          <span className={`text-[13px] font-bold ${
                            item.isDanger ? 'text-red-550' : 'text-slate-800 dark:text-zinc-200'
                          }`}>
                            {item.title}
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                          item.isDanger ? 'text-red-500/60' : 'text-slate-350 dark:text-zinc-650'
                        }`} />
                      </button>
                    );
                  })}
                </section>
              </motion.div>
            )}

            {currentView === 'security' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-left"
              >
                <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                    <Shield className="w-5 h-5 text-brand-green" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-250">
                      Change Password
                    </h3>
                  </div>

                  <form onSubmit={handlePasswordUpdate} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Current Password
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 dark:text-zinc-100"
                      />
                      
                      {newPassword && (
                        <div className="space-y-1 pt-1.5">
                          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            <span>Password Strength</span>
                            <span className={`${
                              passwordStrength.label === 'Strong' ? 'text-green-500' :
                              passwordStrength.label === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                            }`}>{passwordStrength.label}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${passwordStrength.color} transition-all duration-300`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:border-brand-green text-slate-800 dark:text-zinc-100"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-green hover:bg-green-600 disabled:opacity-40 text-white py-3.5 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>CHANGE PASSWORD</span>}
                      </button>
                    </div>
                  </form>
                </section>
              </motion.div>
            )}

            {currentView === 'backup' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-left"
              >
                <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                    <Download className="w-5 h-5 text-brand-green" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      Export User Data
                    </h3>
                  </div>

                  <p className="text-[10px] text-slate-455 dark:text-zinc-400 leading-relaxed">
                    Safely download your active groceries inventory database.
                  </p>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={handleJSONBackup}
                      className="w-full bg-slate-55 dark:bg-zinc-850 hover:bg-slate-100 border border-slate-150 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all uppercase tracking-wider shadow-sm"
                    >
                      <Download className="w-4 h-4 text-indigo-400" />
                      <span>DOWNLOAD JSON BACKUP</span>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="w-full bg-slate-55 dark:bg-zinc-850 hover:bg-slate-100 border border-slate-150 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all uppercase tracking-wider shadow-sm"
                    >
                      <FileDown className="w-4 h-4 text-emerald-400" />
                      <span>DOWNLOAD CSV BACKUP</span>
                    </button>

                    <button
                      onClick={handleExportPDF}
                      className="w-full bg-slate-55 dark:bg-zinc-850 hover:bg-slate-100 border border-slate-150 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all uppercase tracking-wider shadow-sm"
                    >
                      <FileDown className="w-4 h-4 text-red-400" />
                      <span>DOWNLOAD PDF REPORT</span>
                    </button>
                  </div>
                </section>

                <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                    <Upload className="w-5 h-5 text-brand-green" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      Restore Backup
                    </h3>
                  </div>

                  <p className="text-[10px] text-slate-455 dark:text-zinc-400 leading-relaxed">
                    Import JSON backup file to restore inventory.
                  </p>

                  <input
                    type="file"
                    ref={jsonInputRef}
                    onChange={handleJSONRestore}
                    className="hidden"
                    accept=".json"
                  />

                  <div className="pt-1">
                    <button
                      onClick={() => jsonInputRef.current?.click()}
                      disabled={loading}
                      className="w-full bg-brand-green hover:bg-green-600 disabled:opacity-40 text-white py-3.5 rounded-2xl text-[11px] font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>RESTORE & IMPORT BACKUP FILE</span>
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </motion.div>
            )}

            {currentView === 'archives' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-left"
              >
                <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                    <History className="w-5 h-5 text-brand-green" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      Consumption Archives
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search archives..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs focus:outline-none focus:border-brand-green text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-350 focus:outline-none focus:border-brand-green appearance-none cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        <option value="Dairy & Eggs">Dairy & Eggs</option>
                        <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Meat & Fish">Meat & Fish</option>
                        <option value="Pantry">Pantry</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>

                  {filteredArchives.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-2">
                      <History className="w-8 h-8 text-slate-300 dark:text-zinc-700 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">No matching archives</span>
                    </div>
                  ) : (
                    <div className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/60 max-h-[360px] overflow-y-auto no-scrollbar">
                      {filteredArchives.map((item) => (
                        <div key={item._id} className="p-3.5 flex items-center justify-between gap-3 bg-slate-50/20 dark:bg-zinc-900/40 hover:bg-slate-50/80 dark:hover:bg-zinc-850/80 transition-colors">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate">
                              {item.itemName}
                            </h4>
                            <span className="text-[9px] text-brand-green font-bold block mt-0.5 uppercase tracking-wide">
                              {item.category} — Qty: {item.quantity}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleRestoreArchived(item._id)}
                              disabled={loading}
                              className="bg-green-50 hover:bg-green-100 dark:bg-green-950/40 text-brand-green text-[9px] font-black px-2.5 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
                            >
                              RESTORE
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(item._id)}
                              disabled={loading}
                              className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-brand-red text-[9px] font-black p-1.5 rounded-xl cursor-pointer active:scale-95 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {currentView === 'language' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-left"
              >
                <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                    <Globe className="w-5 h-5 text-brand-green" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      {t('language') || 'Select Language'}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {[
                      { code: 'en', name: 'English', desc: 'System Standard English' },
                      { code: 'te', name: 'Telugu (తెలుగు)', desc: 'Regional Telugu Localization' },
                      { code: 'hi', name: 'Hindi (हिन्दी)', desc: 'Standard Hindi Localization' }
                    ].map((item) => {
                      const isSelected = lang === item.code;
                      return (
                        <button
                          key={item.code}
                          onClick={() => handleLanguageChange(item.code as any)}
                          disabled={loading}
                          className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-green-55 dark:bg-green-950/30 border-brand-green text-slate-800 dark:text-white'
                              : 'bg-slate-50 dark:bg-zinc-850 border-slate-150 dark:border-zinc-800 text-slate-655 dark:text-zinc-350 hover:bg-slate-100/50 dark:hover:bg-zinc-800/60'
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-bold">{item.name}</h4>
                            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium block mt-0.5">{item.desc}</span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center text-white" style={{ borderRadius: '50%' }}>
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </motion.div>
            )}

            {currentView === 'theme' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-left"
              >
                <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                    <Moon className="w-5 h-5 text-brand-green" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      {t('themeSettings') || 'Theme Settings'}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {[
                      { code: 'dark', name: 'Dark Mode', desc: 'Luxury deep dark slate visual contrast', icon: Moon },
                      { code: 'light', name: 'Light Mode', desc: 'Bright standard high visibility', icon: Sun },
                      { code: 'system', name: 'System Theme', desc: 'Synchronize layout colors dynamically', icon: RefreshCw }
                    ].map((item) => {
                      const isSelected = theme === item.code;
                      const TIcon = item.icon;
                      return (
                        <button
                          key={item.code}
                          onClick={() => handleThemeChange(item.code as any)}
                          disabled={loading}
                          className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-green-55 dark:bg-green-950/30 border-brand-green text-slate-800 dark:text-white'
                              : 'bg-slate-50 dark:bg-zinc-850 border-slate-150 dark:border-zinc-800 text-slate-655 dark:text-zinc-350 hover:bg-slate-100/50 dark:hover:bg-zinc-805/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-brand-green text-white' : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                            }`}>
                              <TIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold">{item.name}</h4>
                              <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium block mt-0.5">{item.desc}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center text-white" style={{ borderRadius: '50%' }}>
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </motion.div>
            )}

            {currentView === 'help' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-left"
              >
                <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                    <HelpCircle className="w-5 h-5 text-brand-green" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      Frequently Asked Questions
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {[
                      { q: 'How do I add a new grocery item?', a: 'Tap the circular "+" button in the bottom navigation menu. Fill in the details, then click "Add Item"!' },
                      { q: 'How do notification alerts work?', a: 'The app schedules daily automated reminder scans at 9:00 AM. It automatically flags items that are "Expired" or "Expiring Soon".' },
                      { q: 'Can I restore consumed groceries?', a: 'Absolutely! Click the "Archives" settings option inside your profile. You can instantly restore any consumed item back to active logs.' },
                      { q: 'How do I export inventory databases?', a: 'Navigate to "Backup" in settings. You can instantly download full JSON archives, CSV spreadsheets, or PDF reports.' }
                    ].map((item, idx) => {
                      const isOpen = faqOpenIndex === idx;
                      return (
                        <div key={idx} className="border border-slate-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                            className="w-full p-3.5 text-left bg-slate-50 dark:bg-zinc-850 hover:bg-slate-100/50 flex items-center justify-between text-xs font-bold text-slate-850 dark:text-zinc-200 cursor-pointer"
                          >
                            <span>{item.q}</span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90 text-brand-green' : 'text-slate-350'}`} />
                          </button>
                          {isOpen && (
                            <div className="p-3.5 bg-slate-55/20 dark:bg-zinc-900/30 text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed border-t border-slate-100 dark:border-zinc-800/40">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-5 shadow-sm space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/60 pb-3">
                    <MessageSquare className="w-5 h-5 text-brand-green" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      Contact Support Form
                    </h3>
                  </div>

                  <form onSubmit={handleSupportSubmit} className="space-y-3">
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs focus:outline-none focus:border-brand-green text-slate-850 dark:text-zinc-100 placeholder-slate-400"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Your Email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs focus:outline-none focus:border-brand-green text-slate-850 dark:text-zinc-100 placeholder-slate-400"
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe your issue or feedback..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-xs focus:outline-none focus:border-brand-green text-slate-850 dark:text-zinc-100 placeholder-slate-400 resize-none"
                    />

                    <button
                      type="submit"
                      disabled={supportLoading}
                      className="w-full bg-brand-green hover:bg-green-600 disabled:opacity-40 text-white py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
                    >
                      {supportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>SUBMIT REQUEST</span>}
                    </button>
                  </form>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. EMAIL OTP & LOGOUT MODALS (SHARED)                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEmailOtpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Verify Email Address
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-555 leading-relaxed">
                  Enter the 6-digit OTP verification code sent to your new email **{email}** to complete this profile change.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="------"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center py-3 rounded-2xl bg-slate-50 dark:bg-zinc-850 border border-slate-150 dark:border-zinc-800 text-lg font-black tracking-widest focus:outline-none focus:border-brand-green text-slate-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailOtpModal(false);
                    setEmailOtp('');
                  }}
                  className="flex-1 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-655 dark:text-slate-350 py-3 rounded-2xl text-[10px] font-black cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyEmailOtp}
                  disabled={emailOtpLoading || emailOtp.length !== 6}
                  className="flex-1 bg-brand-green hover:bg-green-600 disabled:opacity-40 text-white py-3 rounded-2xl text-[10px] font-black flex items-center justify-center gap-1 active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
                >
                  {emailOtpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Verify OTP</span>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 text-left"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Log Out Confirm
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-555 leading-relaxed">
                  Are you absolutely sure you want to end your active session and log out of the Grocery Expiry Tracker?
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-zinc-850 hover:bg-slate-200 text-slate-655 dark:text-slate-350 py-3 rounded-2xl text-[10px] font-black cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogoutConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl text-[10px] font-black active:scale-95 transition-all uppercase tracking-wider cursor-pointer"
                >
                  LOGOUT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
