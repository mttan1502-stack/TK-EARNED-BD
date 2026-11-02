import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { User } from '../../types/index.js';
import {
  Search,
  Users,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  PlusCircle,
  MinusCircle,
  X,
  Sparkles,
  UserCheck,
  UserX,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { token, addToast } = useAuth();
  const { formatMoney } = useTheme();

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Balance Adjustment Modal State
  const [adjustUser, setAdjustUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed.');

      addToast('info', `User ${user.name} is now ${newStatus}.`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  const handleOpenAdjustModal = (user: User) => {
    setAdjustUser(user);
    setAdjustAmount('');
    setAdjustType('credit');
    setAdjustReason('Admin bonus adjustment / loyalty reward');
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUser) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) {
      addToast('error', 'Please enter a valid amount.');
      return;
    }
    if (!adjustReason.trim()) {
      addToast('error', 'A mandatory reason is required for balance adjustment.');
      return;
    }

    const finalAmount = adjustType === 'credit' ? num : -num;
    setIsAdjusting(true);

    try {
      const res = await fetch(`/api/admin/users/${adjustUser.id}/adjust-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountBdt: finalAmount,
          reason: adjustReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adjustment failed.');

      addToast('success', `Balance adjusted: ${finalAmount >= 0 ? '+' : ''}৳${finalAmount}`);
      setAdjustUser(null);
      await fetchUsers();
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q) ||
      u.refCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            User Management & Balances
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search registered platform members, view balances, suspend accounts, and perform audited balance adjustments.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, User ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading user database...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No users found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">User ID & Ref</th>
                  <th className="py-3 px-4">Available Balance</th>
                  <th className="py-3 px-4">Total Earned</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-purple-950 border border-purple-500/30 shrink-0">
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{user.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-purple-300">{user.userId}</div>
                      <div className="text-[11px] text-amber-400">{user.refCode}</div>
                    </td>

                    <td className="py-3.5 px-4 tabular-nums text-emerald-400 font-bold text-sm">
                      ৳{user.balance}
                    </td>

                    <td className="py-3.5 px-4 tabular-nums text-slate-300 font-semibold">
                      ৳{user.totalEarned}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          user.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-400" /> Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 text-rose-400" /> Suspended
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenAdjustModal(user)}
                          className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-semibold transition-colors"
                          title="Adjust balance"
                        >
                          Adjust ৳
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            user.status === 'active'
                              ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Balance Modal */}
      {adjustUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setAdjustUser(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              Adjust Balance for {adjustUser.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Current balance: <strong className="text-emerald-400 font-mono">৳{adjustUser.balance}</strong> ({adjustUser.userId})
            </p>

            <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                    adjustType === 'credit'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  Credit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                    adjustType === 'debit'
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <MinusCircle className="w-4 h-4 text-rose-400" />
                  Debit (-)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Amount (BDT)</label>
                <input
                  type="number"
                  required
                  min={1}
                  step="any"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Mandatory Audit Reason
                </label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Reason for financial record..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustUser(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {isAdjusting ? 'Updating Balance...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
