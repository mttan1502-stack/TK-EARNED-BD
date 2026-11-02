import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider, useTheme } from './context/ThemeContext.js';
import { Navbar } from './components/common/Navbar.js';
import { ToastContainer } from './components/common/ToastContainer.js';
import { AuthModals } from './components/auth/AuthModals.js';

// User Views
import { UserDashboard } from './components/user/UserDashboard.js';
import { TasksView } from './components/user/TasksView.js';
import { VideoAdsView } from './components/user/VideoAdsView.js';
import { WithdrawView } from './components/user/WithdrawView.js';
import { ReferralView } from './components/user/ReferralView.js';
import { TransactionsView } from './components/user/TransactionsView.js';
import { ProfileView } from './components/user/ProfileView.js';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { AdminTasks } from './components/admin/AdminTasks.js';
import { AdminWithdrawals } from './components/admin/AdminWithdrawals.js';
import { AdminUsers } from './components/admin/AdminUsers.js';
import { AdminAds } from './components/admin/AdminAds.js';
import { AdminReferrals } from './components/admin/AdminReferrals.js';
import { AdminSettings } from './components/admin/AdminSettings.js';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs.js';

import {
  LayoutDashboard,
  CheckSquare,
  PlayCircle,
  ArrowUpRight,
  Share2,
  User as UserIcon,
  ShieldCheck,
  X,
  Sparkles,
  Settings,
  History,
} from 'lucide-react';

function AppContent() {
  const { role, activeView, setActiveView, setAuthModal, appSettings } = useAuth();
  const { mode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check URL query for referral invite: e.g. ?ref=SULTAN1029
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && role === 'guest') {
      setAuthModal('register');
    }
  }, [role, setAuthModal]);

  const renderActiveView = () => {
    switch (activeView) {
      // User Views
      case 'dashboard':
        return <UserDashboard />;
      case 'tasks':
        return <TasksView />;
      case 'video_ads':
        return <VideoAdsView />;
      case 'withdraw':
        return <WithdrawView />;
      case 'referrals':
        return <ReferralView />;
      case 'transactions':
        return <TransactionsView />;
      case 'profile':
        return <ProfileView />;

      // Admin Views
      case 'admin_overview':
        return <AdminDashboard />;
      case 'admin_tasks':
        return <AdminTasks />;
      case 'admin_withdrawals':
        return <AdminWithdrawals />;
      case 'admin_users':
        return <AdminUsers />;
      case 'admin_ads':
        return <AdminAds />;
      case 'admin_referrals':
        return <AdminReferrals />;
      case 'admin_settings':
        return <AdminSettings />;
      case 'admin_audit_logs':
        return <AdminAuditLogs />;

      default:
        return <UserDashboard />;
    }
  };

  const isUserView = role === 'user' || role === 'guest';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      mode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Bar Contract Navbar */}
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[80vw] h-full bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <img
                      src="/src/assets/images/sultan_earn_logo_1793649223508.jpg"
                      alt="TK EARNED BD"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-extrabold text-white">
                    {appSettings?.platformName || 'TK EARNED BD'}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex flex-col gap-1.5 text-xs font-semibold">
                {isUserView ? (
                  <>
                    <button
                      onClick={() => {
                        setActiveView('dashboard');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        activeView === 'dashboard'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('tasks');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        activeView === 'tasks'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <CheckSquare className="w-4 h-4" />
                      Earning Tasks (10s Ad Gate)
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('video_ads');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        activeView === 'video_ads'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4" />
                      Video Ads
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('withdraw');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        activeView === 'withdraw'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Withdraw (bKash/Nagad/USDT)
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('referrals');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        activeView === 'referrals'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Share2 className="w-4 h-4" />
                      Referrals & Invite
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('profile');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        activeView === 'profile'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile & Theme
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setActiveView('admin_overview');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                        activeView === 'admin_overview' ? 'bg-purple-600 text-white' : 'text-slate-300'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Admin Overview
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('admin_tasks');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                        activeView === 'admin_tasks' ? 'bg-purple-600 text-white' : 'text-slate-300'
                      }`}
                    >
                      <CheckSquare className="w-4 h-4" />
                      Tasks
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('admin_withdrawals');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                        activeView === 'admin_withdrawals' ? 'bg-purple-600 text-white' : 'text-slate-300'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Withdrawals
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('admin_users');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                        activeView === 'admin_users' ? 'bg-purple-600 text-white' : 'text-slate-300'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      Users & Balances
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('admin_ads');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                        activeView === 'admin_ads' ? 'bg-purple-600 text-white' : 'text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      Ad Network
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('admin_settings');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                        activeView === 'admin_settings' ? 'bg-purple-600 text-white' : 'text-slate-300'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      Settings & Setup
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('admin_audit_logs');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${
                        activeView === 'admin_audit_logs' ? 'bg-purple-600 text-white' : 'text-slate-300'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      Audit Logs
                    </button>
                  </>
                )}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center font-mono">
              TK EARNED BD Platform v2.0
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderActiveView()}
      </main>

      {/* Bottom Sticky Navigation on Mobile */}
      {isUserView && (
        <div className="md:hidden sticky bottom-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 py-2 px-4 flex items-center justify-around text-[10px] font-semibold text-slate-400">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex flex-col items-center gap-1 ${
              activeView === 'dashboard' ? 'text-purple-400' : 'hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Home
          </button>
          <button
            onClick={() => setActiveView('tasks')}
            className={`flex flex-col items-center gap-1 ${
              activeView === 'tasks' ? 'text-purple-400' : 'hover:text-white'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            Tasks
          </button>
          <button
            onClick={() => setActiveView('video_ads')}
            className={`flex flex-col items-center gap-1 ${
              activeView === 'video_ads' ? 'text-purple-400' : 'hover:text-white'
            }`}
          >
            <PlayCircle className="w-5 h-5" />
            Video Ads
          </button>
          <button
            onClick={() => setActiveView('withdraw')}
            className={`flex flex-col items-center gap-1 ${
              activeView === 'withdraw' ? 'text-purple-400' : 'hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-5 h-5" />
            Withdraw
          </button>
          <button
            onClick={() => setActiveView('referrals')}
            className={`flex flex-col items-center gap-1 ${
              activeView === 'referrals' ? 'text-purple-400' : 'hover:text-white'
            }`}
          >
            <Share2 className="w-5 h-5" />
            Invite
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">{appSettings?.platformName || 'TK EARNED BD'}</span>
            <span>·</span>
            <span>Professional Earning Platform & Security Verified</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Supported Networks: bKash · Nagad · USDT TRC-20</span>
            <span>·</span>
            <button
              onClick={() => setAuthModal('admin_login')}
              className="hover:text-purple-400 transition-colors"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals & Notifications */}
      <AuthModals />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
