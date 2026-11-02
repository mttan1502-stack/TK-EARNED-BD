import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Task, Transaction } from '../../types/index.js';
import { AdTimerModal } from './AdTimerModal.js';
import { TaskExecutionModal } from './TaskExecutionModal.js';
import {
  Wallet,
  TrendingUp,
  Award,
  Users,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
  PlayCircle,
  Share2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, token, appSettings, setActiveView, setAuthModal } = useAuth();
  const { formatMoney } = useTheme();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 10-Second Ad Timer Gate State
  const [selectedTaskForAd, setSelectedTaskForAd] = useState<Task | null>(null);
  const [unlockedTaskState, setUnlockedTaskState] = useState<{ task: Task; unlockToken: string } | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const [tasksRes, txRes] = await Promise.all([
          fetch('/api/user/tasks', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/user/transactions', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (tasksRes.ok) {
          const tData = await tasksRes.json();
          setTasks(tData.tasks || []);
        }
        if (txRes.ok) {
          const txData = await txRes.json();
          setRecentTransactions(txData.transactions?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [token]);

  const handleStartTaskClick = (task: Task) => {
    if (!user) {
      setAuthModal('login');
      return;
    }
    setSelectedTaskForAd(task);
  };

  const handleAdVerified = (taskUnlockToken: string) => {
    if (selectedTaskForAd) {
      setUnlockedTaskState({
        task: selectedTaskForAd,
        unlockToken: taskUnlockToken,
      });
      setSelectedTaskForAd(null);
    }
  };

  const handleTaskCompleteSuccess = (rewardBdt: number) => {
    if (unlockedTaskState) {
      setTasks((prev) =>
        prev.map((t) => (t.id === unlockedTaskState.task.id ? { ...t, isCompletedByUser: true } as any : t))
      );
      setUnlockedTaskState(null);
    }
  };

  // Filter top 3 uncompleted tasks for quick access
  const featuredTasks = tasks.filter((t: any) => !t.isCompletedByUser).slice(0, 3);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Global Announcement Banner */}
      {appSettings?.announcementText && (
        <div className="p-3 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 rounded-2xl flex items-center gap-3 text-xs text-purple-200 shadow-md">
          <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg shrink-0">
            <Megaphone className="w-4 h-4 text-amber-400" />
          </div>
          <p className="flex-1 font-medium leading-relaxed">{appSettings.announcementText}</p>
        </div>
      )}

      {/* 2. Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/25 bg-slate-900/90 shadow-2xl p-6 sm:p-8">
        {/* Background Image Scrim */}
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-luminosity">
          <img
            src="/src/assets/images/earning_hero_banner_1793649223903.jpg"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-purple-950/60 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              TK EARNED BD Official Platform
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-mono">Currency: Bangladeshi Taka (৳ BDT)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {user ? `Welcome back, ${user.name}` : 'TK EARNED BD – Professional Earning'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Earn verified cash rewards in Bangladeshi Taka (৳ BDT) by discovering sponsors, completing quick tasks, and watching video ads with instant payouts to bKash, Nagad & USDT.
            </p>
          </div>

          {/* Quick Balance Pod (Pure BDT) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex flex-col gap-3 min-w-[260px] shadow-xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Available Wallet Balance</span>
              <span className="font-mono text-[11px] bg-purple-950/60 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30 font-bold">
                ৳ BDT
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
              {user ? formatMoney(user.balance) : '৳0'}
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              {user ? (
                <>
                  <button
                    onClick={() => setActiveView('withdraw')}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-900/40 flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Withdraw
                  </button>
                  <button
                    onClick={() => setActiveView('tasks')}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    Earn Now
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAuthModal('register')}
                  className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-900/40 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Sign Up & Claim ৳10
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4-KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Available Balance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Available Balance</span>
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
            {user ? formatMoney(user.balance) : '৳0.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">Instant</span> payout ready
          </div>
        </div>

        {/* KPI 2: Total Earned */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Lifetime Earnings</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
            {user ? formatMoney(user.totalEarned) : '৳0.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            Tasks, Ads & Referrals
          </div>
        </div>

        {/* KPI 3: Task Earnings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Task Earnings</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
            {user ? formatMoney(user.taskEarned) : '৳0.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Verified ad timer completions
          </div>
        </div>

        {/* KPI 4: Referral Earnings */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Referral Commissions</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
            {user ? formatMoney(user.referralEarned) : '৳0.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {appSettings?.referralCommissionPercent || 10}% lifetime bonus
          </div>
        </div>
      </div>

      {/* 4. Highlight: 10-Second Ad Timer Feature Showcase */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30 shrink-0">
            <ShieldCheck className="w-7 h-7 text-purple-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300">Security Engine</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">10s Guard</span>
            </div>
            <h3 className="text-base font-bold text-white">Verified 10-Second Ad Timer Gate</h3>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              Every earning task is protected with a 10-second sponsor ad countdown and active-tab focus monitoring. Ensures zero fake clicks and protects high payouts for genuine earners.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveView('tasks')}
          className="w-full sm:w-auto py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-950/50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          Explore Tasks
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 5. Featured Tasks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">High Paying Daily Tasks</h3>
            <p className="text-xs text-slate-400">Complete the 10-second sponsor gate to unlock task rewards.</p>
          </div>
          <button
            onClick={() => setActiveView('tasks')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            View All ({tasks.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredTasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                    {task.category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
                    {task.durationSeconds}s
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
                  {task.title}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Reward</div>
                  <div className="text-base font-extrabold font-mono tabular-nums text-emerald-400">
                    {formatMoney(task.rewardBdt)}
                  </div>
                </div>

                <button
                  onClick={() => handleStartTaskClick(task)}
                  className="py-2 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Start Task
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Quick Video Ads & Referral Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Video Ads */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4" />
              Rewarded Video Showcase
            </div>
            <h4 className="text-base font-bold text-white">Watch Sponsor Videos</h4>
            <p className="text-xs text-slate-400">Earn up to ৳15 per completed sponsor video clip.</p>
          </div>
          <button
            onClick={() => setActiveView('video_ads')}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            Watch Ads →
          </button>
        </div>

        {/* Card: Referral Program */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Share2 className="w-4 h-4" />
              Invite Friends & Earn
            </div>
            <h4 className="text-base font-bold text-white">10% Lifetime Commission</h4>
            <p className="text-xs text-slate-400">Earn commission every time your friends complete tasks.</p>
          </div>
          <button
            onClick={() => setActiveView('referrals')}
            className="py-2.5 px-4 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold rounded-xl transition-colors shrink-0"
          >
            My Referral Link →
          </button>
        </div>
      </div>

      {/* 7. Recent Transactions Feed */}
      {user && recentTransactions.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Recent Account Transactions</h4>
            <button
              onClick={() => setActiveView('transactions')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              Full Ledger →
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-200">{tx.description}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {new Date(tx.createdAt).toLocaleDateString()} · {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div
                  className={`font-mono font-bold tabular-nums text-sm ${
                    tx.amountBdt >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.amountBdt >= 0 ? `+${formatMoney(tx.amountBdt)}` : formatMoney(tx.amountBdt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals for 10-Second Ad Gate & Task Execution */}
      {selectedTaskForAd && (
        <AdTimerModal
          task={selectedTaskForAd}
          onClose={() => setSelectedTaskForAd(null)}
          onAdVerified={handleAdVerified}
        />
      )}

      {unlockedTaskState && (
        <TaskExecutionModal
          task={unlockedTaskState.task}
          taskUnlockToken={unlockedTaskState.unlockToken}
          onClose={() => setUnlockedTaskState(null)}
          onTaskCompleted={handleTaskCompleteSuccess}
        />
      )}
    </div>
  );
};
