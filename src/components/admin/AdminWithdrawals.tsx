import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Withdrawal, WithdrawalStatus, WithdrawalMethod } from '../../types/index.js';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  Send,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const AdminWithdrawals: React.FC = () => {
  const { token, addToast } = useAuth();
  const { formatMoney } = useTheme();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mark Paid Modal state
  const [paidModalItem, setPaidModalItem] = useState<Withdrawal | null>(null);
  const [trxIdInput, setTrxIdInput] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isProcessingPaid, setIsProcessingPaid] = useState(false);

  // Reject Modal state
  const [rejectModalItem, setRejectModalItem] = useState<Withdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingReject, setIsProcessingReject] = useState(false);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [token]);

  const handleApprove = async (withdrawal: Withdrawal) => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawal.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNote: 'Approved by Admin. In queue for payment.' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Approval failed.');
      }
      addToast('success', `Withdrawal #${withdrawal.id.slice(-6)} approved.`);
      await fetchWithdrawals();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  const handleOpenMarkPaid = (withdrawal: Withdrawal) => {
    setPaidModalItem(withdrawal);
    setTrxIdInput(`BKH${Math.floor(100000000 + Math.random() * 900000000)}`);
    setAdminNoteInput('Disbursed via official merchant payout API');
  };

  const handleConfirmPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidModalItem) return;
    if (!trxIdInput.trim()) {
      addToast('error', 'Transaction ID (TrxID) is mandatory.');
      return;
    }

    setIsProcessingPaid(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${paidModalItem.id}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          trxId: trxIdInput,
          adminNote: adminNoteInput,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to mark paid.');
      }

      addToast('success', `Payment marked as PAID with TrxID: ${trxIdInput}`);
      setPaidModalItem(null);
      await fetchWithdrawals();
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setIsProcessingPaid(false);
    }
  };

  const handleOpenReject = (withdrawal: Withdrawal) => {
    setRejectModalItem(withdrawal);
    setRejectionReason('Invalid destination wallet or phone number');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;
    if (!rejectionReason.trim()) {
      addToast('error', 'Rejection reason is required.');
      return;
    }

    setIsProcessingReject(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${rejectModalItem.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reject withdrawal.');
      }

      addToast('info', `Withdrawal rejected. ৳${rejectModalItem.amountBdt} refunded back to user balance.`);
      setRejectModalItem(null);
      await fetchWithdrawals();
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setIsProcessingReject(false);
    }
  };

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || w.method === methodFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      w.userName.toLowerCase().includes(q) ||
      w.userEmail.toLowerCase().includes(q) ||
      w.accountNumber.toLowerCase().includes(q) ||
      w.id.toLowerCase().includes(q) ||
      (w.trxId && w.trxId.toLowerCase().includes(q));

    return matchesStatus && matchesMethod && matchesSearch;
  });

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Paid
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Clock className="w-3 h-3 text-blue-400" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" /> Rejected (Refunded)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Withdrawal Management
          <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review user payout requests, verify account details, approve or reject with automatic refunds, and submit TrxIDs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['all', 'pending', 'approved', 'paid', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  statusFilter === st ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none"
          >
            <option value="all">All Methods</option>
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
            <option value="USDT">USDT</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, TrxID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading withdrawals...</div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No withdrawal requests match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Method & Account</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Transaction / Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-white">{w.userName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{w.userEmail}</div>
                    </td>

                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-semibold text-purple-300">{w.method}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{w.accountNumber}</div>
                    </td>

                    <td className="py-3.5 px-4 tabular-nums text-white font-semibold">
                      ৳{w.amountBdt} <span className="text-[10px] text-slate-500 font-normal">(${w.amountUsd})</span>
                    </td>

                    <td className="py-3.5 px-4 tabular-nums text-emerald-400 font-bold">
                      ৳{w.netAmount}
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(w.status)}</td>

                    <td className="py-3.5 px-4 font-sans text-[11px] text-slate-400 max-w-[200px]">
                      {w.trxId && (
                        <div className="text-purple-300 font-mono font-bold truncate">
                          TrxID: {w.trxId}
                        </div>
                      )}
                      {w.rejectionReason && (
                        <div className="text-rose-400 truncate">
                          Reason: {w.rejectionReason}
                        </div>
                      )}
                      {!w.trxId && !w.rejectionReason && (w.adminNote || 'Awaiting action')}
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {w.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(w)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Approve
                          </button>
                        )}

                        {w.status !== 'paid' && w.status !== 'rejected' && (
                          <button
                            onClick={() => handleOpenMarkPaid(w)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}

                        {w.status !== 'paid' && w.status !== 'rejected' && (
                          <button
                            onClick={() => handleOpenReject(w)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Reject & Refund
                          </button>
                        )}

                        {(w.status === 'paid' || w.status === 'rejected') && (
                          <span className="text-[11px] text-slate-500">Archived</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Mark Paid */}
      {paidModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setPaidModalItem(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Complete Payout for #{paidModalItem.id.slice(-6)}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Payout of <strong className="text-emerald-400 font-mono">৳{paidModalItem.netAmount}</strong> to{' '}
              <strong className="text-white">{paidModalItem.userName}</strong> ({paidModalItem.method}: {paidModalItem.accountNumber}).
            </p>

            <form onSubmit={handleConfirmPaid} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Transaction ID / TrxID (Mandatory)
                </label>
                <input
                  type="text"
                  required
                  value={trxIdInput}
                  onChange={(e) => setTrxIdInput(e.target.value)}
                  placeholder="e.g. BKH984210389 or USDT TxHash"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Admin Notes</label>
                <input
                  type="text"
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Notes for the audit log..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPaidModalItem(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPaid}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {isProcessingPaid ? 'Recording...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject with Mandatory Refund */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setRejectModalItem(null)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-400" />
              Reject & Refund Request
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Rejecting will automatically restore{' '}
              <strong className="text-rose-400 font-mono">৳{rejectModalItem.amountBdt}</strong> back to{' '}
              <strong className="text-white">{rejectModalItem.userName}</strong>'s wallet balance.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Mandatory Rejection Reason
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Invalid bKash account number. Please check and re-submit."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingReject}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {isProcessingReject ? 'Processing...' : 'Confirm Rejection & Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
