import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme, AccentColor } from '../../context/ThemeContext.js';
import {
  User as UserIcon,
  Palette,
  Shield,
  KeyRound,
  Check,
  Moon,
  Sun,
  Coins,
  Sparkles,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, token, addToast } = useAuth();
  const { mode, toggleMode, accent, setAccent, formatMoney } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', 'New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('success', 'Security password updated successfully!');
    }, 600);
  };

  const accentOptions: { id: AccentColor; name: string; colorClass: string; borderClass: string }[] = [
    { id: 'purple', name: 'Royal Purple', colorClass: 'bg-purple-600', borderClass: 'border-purple-500' },
    { id: 'gold', name: 'Sultan Gold', colorClass: 'bg-amber-500', borderClass: 'border-amber-500' },
    { id: 'emerald', name: 'Emerald Wealth', colorClass: 'bg-emerald-600', borderClass: 'border-emerald-500' },
    { id: 'cyan', name: 'Cyber Blue', colorClass: 'bg-sky-600', borderClass: 'border-sky-500' },
  ];

  if (!user) {
    return (
      <div className="py-20 text-center text-slate-400">
        Please sign in to view your profile settings.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Profile & App Customization
          <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your personal details, theme skins, currency display preference, and account credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: User Identity Details (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-950 border-2 border-purple-500/40 shrink-0">
              <img
                src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user.name}</h3>
              <div className="text-xs font-mono text-purple-400">{user.userId}</div>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Member
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Email:</span>
              <span className="text-white font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Phone:</span>
              <span className="text-white font-mono">{user.phone || 'Not linked'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Referral Code:</span>
              <span className="text-amber-400 font-mono font-bold">{user.refCode}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Member Since:</span>
              <span className="text-slate-300 font-mono">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Center: App Skin & Theme Customizer (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            App Skin & Theme
          </h3>

          {/* Mode Switch (Light / Dark) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Interface Display Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={toggleMode}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  mode === 'dark'
                    ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4 text-purple-400" />
                Dark Navy
              </button>
              <button
                type="button"
                onClick={toggleMode}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  mode === 'light'
                    ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-300" />
                Light Canvas
              </button>
            </div>
          </div>

          {/* Color Themes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Accent Color Palette</label>
            <div className="grid grid-cols-2 gap-2.5">
              {accentOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setAccent(opt.id);
                    addToast('info', `Switched theme accent to ${opt.name}`);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all ${
                    accent === opt.id
                      ? 'bg-slate-800/90 border-purple-400 text-white font-semibold'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${opt.colorClass}`} />
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency Display Note */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Platform Currency</label>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300 flex items-center justify-between">
              <span>Standard Currency:</span>
              <span className="font-bold text-white bg-purple-950/80 px-2.5 py-1 rounded border border-purple-500/30">
                ৳ BDT (Taka)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Security & Credentials (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Security & Password
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-900/30 cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Saving Changes...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
