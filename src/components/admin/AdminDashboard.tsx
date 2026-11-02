import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { InteractiveChart } from '../common/InteractiveChart.js';
import {
  Users,
  Wallet,
  Clock,
  CheckCircle2,
  Award,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Layers,
  Settings,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token, admin, setActiveView } = useAuth();
  const { formatMoney } = useTheme();

  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!token) return;
      try {
        const res = await fetch('/api/admin/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setChartData(data.chartData || []);
          setRecentWithdrawals(data.recentWithdrawals || []);
          setRecentUsers(data.recentUsers || []);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [token]);

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading administrator analytics...</p>
      </div>
    );
  }

  const pendingWithdrawalsCount = stats?.pendingWithdrawals || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold mb-1">
            Backoffice Management Suite
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Administrator Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Realtime platform telemetry, user balances, task verifications, and financial withdrawals.
          </p>
        </div>

        {/* Quick Operator Status */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Operator: <strong>{admin?.username || 'Sultan'}</strong></span>
        </div>
      </div>

      {/* Alert Banner: Pending Withdrawals */}
      {pendingWithdrawalsCount > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-200">
                {pendingWithdrawalsCount} Withdrawal Request{pendingWithdrawalsCount > 1 ? 's' : ''} Awaiting Review
              </h4>
              <p className="text-amber-300/80 mt-0.5">
                Users are waiting for their bKash, Nagad, or USDT transfers to be processed.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('admin_withdrawals')}
            className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            Review Requests →
          </button>
        </div>
      )}

      {/* 6-Card KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Users */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Registered Users</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {stats?.activeUsers || 0} Active
          </div>
        </div>

        {/* Total Withdrawals */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Withdrawal Requests</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {stats?.totalWithdrawals || 0}
          </div>
          <div className="text-[10px] text-amber-400 font-semibold">
            {stats?.pendingWithdrawals || 0} Pending
          </div>
        </div>

        {/* Paid Out Volume */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Paid Withdrawals</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            ৳{stats?.paidWithdrawalsAmount || 0}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Disbursed</div>
        </div>

        {/* Total Task Completions */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Tasks Completed</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-purple-400">
            {stats?.totalTaskCompletions || 0}
          </div>
          <div className="text-[10px] text-slate-500">10s Ad Verified</div>
        </div>

        {/* Total Rewards Distributed */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Total Rewards Paid</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
            ৳{stats?.totalRewardsPaid || 0}
          </div>
          <div className="text-[10px] text-slate-500">Platform Lifetime</div>
        </div>

        {/* Total Referrals */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">Referral Network</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-400">
            {stats?.totalReferrals || 0}
          </div>
          <div className="text-[10px] text-slate-500">10% Commission</div>
        </div>
      </div>

      {/* Analytics Chart: 7-Day Performance */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">7-Day Platform Cashflow Trends</h3>
            <p className="text-xs text-slate-400">Comparing user rewards issued vs withdrawals settled.</p>
          </div>
        </div>
        <InteractiveChart data={chartData} currencySymbol="৳" />
      </div>

      {/* Two Column Grid: Recent Withdrawals & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Withdrawals */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent Withdrawal Requests</h3>
            <button
              onClick={() => setActiveView('admin_withdrawals')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              Manage All
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 text-xs">
            {recentWithdrawals.slice(0, 4).map((w) => (
              <div key={w.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">
                    {w.userName} · <span className="font-mono text-slate-400">{w.method}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{w.accountNumber}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
                    ৳{w.amountBdt}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      w.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : w.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Registered Users */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Recent User Signups</h3>
            <button
              onClick={() => setActiveView('admin_users')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              All Users
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 text-xs">
            {recentUsers.slice(0, 4).map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-purple-900/30 border border-purple-500/30 shrink-0">
                    <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-slate-200 tabular-nums">
                    Balance: ৳{u.balance}
                  </div>
                  <span className="text-[10px] text-slate-500">{u.userId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
