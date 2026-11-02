import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import {
  Wallet,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, admin, role, logout, activeView, setActiveView, setAuthModal, appSettings } = useAuth();
  const { mode, toggleMode, formatMoney } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isUserView = role === 'user' || role === 'guest';

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single Brand element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveView(role === 'admin' ? 'admin_overview' : 'dashboard')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-400 p-[1px] shadow-lg shadow-purple-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center overflow-hidden">
                <img
                  src="/src/assets/images/sultan_earn_logo_1793649223508.jpg"
                  alt="TK EARNED BD"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                {appSettings?.platformName || 'TK EARNED BD'}
                {role === 'admin' && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Admin
                  </span>
                )}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 4–5 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {isUserView ? (
            <>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'dashboard' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('tasks')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'tasks' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Earn Tasks
              </button>
              <button
                onClick={() => setActiveView('video_ads')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'video_ads' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Video Ads
              </button>
              <button
                onClick={() => setActiveView('withdraw')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'withdraw' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Withdraw
              </button>
              <button
                onClick={() => setActiveView('referrals')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'referrals' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Referrals
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveView('admin_overview')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'admin_overview' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveView('admin_tasks')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'admin_tasks' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Manage Tasks
              </button>
              <button
                onClick={() => setActiveView('admin_withdrawals')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'admin_withdrawals' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Withdrawals
              </button>
              <button
                onClick={() => setActiveView('admin_users')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'admin_users' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Users & Balances
              </button>
              <button
                onClick={() => setActiveView('admin_ads')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'admin_ads' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Ad Network
              </button>
              <button
                onClick={() => setActiveView('admin_settings')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  activeView === 'admin_settings' ? 'text-purple-400 font-semibold' : 'hover:text-white'
                }`}
              >
                Settings
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action & Profile Zone */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Pure BDT Badge */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono text-purple-300 font-bold">
            ৳ BDT
          </div>

          {/* Theme Mode Toggle */}
          <button
            onClick={toggleMode}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors border border-transparent hover:border-slate-800"
            title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme mode"
          >
            {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {/* If Logged In as User */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-500/60 transition-all text-left group"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-purple-900/40 border border-purple-500/40 shrink-0">
                  <img
                    src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden lg:flex flex-col text-xs">
                  <span className="font-semibold text-white leading-tight truncate max-w-[100px]">{user.name}</span>
                  <span className="text-[11px] font-mono tabular-nums text-emerald-400 font-bold">
                    {formatMoney(user.balance)}
                  </span>
                </div>
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <div className="p-2.5 border-b border-slate-800 mb-1">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-slate-400 text-[11px] font-mono truncate">{user.userId}</p>
                    <p className="text-emerald-400 font-bold font-mono mt-1">
                      Balance: {formatMoney(user.balance)}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('profile')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <UserIcon className="w-4 h-4 text-purple-400" />
                    Profile & Theme
                  </button>
                  <button
                    onClick={() => setActiveView('transactions')}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    Transaction Ledger
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left mt-1 border-t border-slate-800/60 pt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* If Logged in as Admin */}
          {admin && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/70 border border-purple-500/30 text-purple-200 text-xs">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="font-semibold">{admin.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg hover:bg-rose-900/40 transition-colors whitespace-nowrap"
                title="Log out of Admin Panel"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}

          {/* If Guest */}
          {!user && !admin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthModal('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthModal('register')}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg shadow-md shadow-purple-900/30 transition-all whitespace-nowrap flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Register
              </button>
              <button
                onClick={() => setAuthModal('admin_login')}
                className="p-1.5 text-slate-500 hover:text-purple-400 transition-colors"
                title="Admin Portal Login"
                aria-label="Admin Portal"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile hamburger menu */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
