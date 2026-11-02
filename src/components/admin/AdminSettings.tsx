import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { AppSettings } from '../../types/index.js';
import {
  Settings,
  Sparkles,
  Coins,
  AlertCircle,
  CheckCircle2,
  Database,
  Server,
  Cloud,
  FileCode,
  Shield,
  BookOpen,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { token, appSettings, refreshSettings, addToast } = useAuth();

  const [platformName, setPlatformName] = useState('TK EARNED BD');
  const [bdtToUsdRate, setBdtToUsdRate] = useState('125');
  const [usdtWithdrawalRate, setUsdtWithdrawalRate] = useState('125');
  const [minWithdrawBkash, setMinWithdrawBkash] = useState('200');
  const [minWithdrawNagad, setMinWithdrawNagad] = useState('200');
  const [minWithdrawUsdt, setMinWithdrawUsdt] = useState('2');
  const [announcementText, setAnnouncementText] = useState('');
  const [isWithdrawalEnabled, setIsWithdrawalEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (appSettings) {
      setPlatformName(appSettings.platformName || 'SULTAN EARN');
      setBdtToUsdRate(appSettings.bdtToUsdRate?.toString() || '125');
      setUsdtWithdrawalRate(appSettings.usdtWithdrawalRate?.toString() || '125');
      setMinWithdrawBkash(appSettings.minWithdrawBkash?.toString() || '200');
      setMinWithdrawNagad(appSettings.minWithdrawNagad?.toString() || '200');
      setMinWithdrawUsdt(appSettings.minWithdrawUsdt?.toString() || '2');
      setAnnouncementText(appSettings.announcementText || '');
      setIsWithdrawalEnabled(appSettings.isWithdrawalEnabled ?? true);
    }
  }, [appSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<AppSettings> = {
        platformName,
        bdtToUsdRate: parseFloat(bdtToUsdRate),
        usdtWithdrawalRate: parseFloat(usdtWithdrawalRate),
        minWithdrawBkash: parseFloat(minWithdrawBkash),
        minWithdrawNagad: parseFloat(minWithdrawNagad),
        minWithdrawUsdt: parseFloat(minWithdrawUsdt),
        announcementText,
        isWithdrawalEnabled,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update system settings.');

      await refreshSettings();
      addToast('success', 'System parameters updated successfully!');
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          System Configuration & Deployment
          <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Adjust exchange rates, withdrawal limits, global announcement tickers, and view real-world deployment instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Form Settings */}
        <form onSubmit={handleSave} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            Financial & Announcement Parameters
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Platform Brand Name</label>
              <input
                type="text"
                required
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white font-semibold"
              />
            </div>

            {/* Currency Rates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Platform Currency
                </label>
                <div className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-purple-300 font-bold">
                  ৳ BDT (Bangladeshi Taka)
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  1 USDT to BDT Rate (৳)
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={usdtWithdrawalRate}
                  onChange={(e) => setUsdtWithdrawalRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white font-mono"
                />
              </div>
            </div>

            {/* Minimum Withdrawals */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Min bKash (৳)</label>
                <input
                  type="number"
                  required
                  value={minWithdrawBkash}
                  onChange={(e) => setMinWithdrawBkash(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Min Nagad (৳)</label>
                <input
                  type="number"
                  required
                  value={minWithdrawNagad}
                  onChange={(e) => setMinWithdrawNagad(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Min USDT ($)</label>
                <input
                  type="number"
                  required
                  value={minWithdrawUsdt}
                  onChange={(e) => setMinWithdrawUsdt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white font-mono"
                />
              </div>
            </div>

            {/* Platform Announcement */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Global Platform Notice (Displayed in user dashboard)
              </label>
              <textarea
                rows={3}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Important announcements, bonus periods, or holiday payout notice..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white"
              />
            </div>

            {/* Withdrawal Toggle */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Withdrawal System Status</span>
                <span className="text-[11px] text-slate-400">
                  {isWithdrawalEnabled ? 'Withdrawals are currently open to all users.' : 'Withdrawals are paused.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawalEnabled(!isWithdrawalEnabled)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                  isWithdrawalEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {isWithdrawalEnabled ? 'Active' : 'Paused'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 transition-colors cursor-pointer"
            >
              {isSaving ? 'Updating...' : 'Save Configuration Changes'}
            </button>
          </div>
        </form>

        {/* Right Column: Setup & Deployment Instructions */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            Deployment & Database Integration Guide
          </h3>

          <div className="text-xs text-slate-300 space-y-4 leading-relaxed">
            <div className="p-3.5 bg-purple-950/30 rounded-2xl border border-purple-500/20 space-y-2">
              <div className="font-bold text-purple-300 flex items-center gap-1.5">
                <Database className="w-4 h-4" />
                1. Database Architecture & Persistence
              </div>
              <p>
                The platform currently runs with a persistent, atomic file-backed JSON database engine located at <code className="bg-slate-950 px-1 py-0.5 rounded text-purple-300 font-mono">data/sultan_earn_db.json</code>, protected by PBKDF2 cryptography with 100,000 hash iterations and HMAC-SHA256 session tokens.
              </p>
            </div>

            <div className="p-3.5 bg-indigo-950/30 rounded-2xl border border-indigo-500/20 space-y-2">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Cloud className="w-4 h-4" />
                2. Firebase Cloud Firestore Migration (Optional)
              </div>
              <p>
                To migrate collections to Google Cloud Firestore or Firebase:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                <li>Create a Firebase Project in the Google Cloud Console.</li>
                <li>Enable Cloud Firestore and Firebase Authentication (Email/Password).</li>
                <li>Import the collections: <code className="text-purple-300">users</code>, <code className="text-purple-300">tasks</code>, <code className="text-purple-300">withdrawals</code>, <code className="text-purple-300">referrals</code>, <code className="text-purple-300">advertisements</code>.</li>
                <li>Set environment variables in your hosting provider: <code className="text-purple-300">FIREBASE_PROJECT_ID</code>, <code className="text-purple-300">FIREBASE_CLIENT_EMAIL</code>.</li>
              </ol>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Server className="w-4 h-4" />
                3. Real-World Production Deployment
              </div>
              <p>
                To deploy to Cloud Run, VPS, DigitalOcean, or AWS:
              </p>
              <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-purple-300 overflow-x-auto">
                npm run build<br />
                npm start
              </div>
              <p className="text-slate-400">
                The Express application automatically binds to port 3000 (or <code className="text-purple-300">process.env.PORT</code>) and serves the production Vite bundle with client-side SPA routing.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
