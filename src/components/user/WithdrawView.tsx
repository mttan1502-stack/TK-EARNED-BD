import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Withdrawal, WithdrawalMethod } from '../../types/index.js';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Coins,
  ShieldAlert,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const WithdrawView: React.FC = () => {
  const { user, token, appSettings, refreshProfile, addToast, setAuthModal } = useAuth();
  const { formatMoney } = useTheme();

  const [method, setMethod] = useState<WithdrawalMethod>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [amountBdt, setAmountBdt] = useState<string>('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWithdrawals = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/user/withdrawals', {
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

  // Minimum amount calculation
  const bdtRate = appSettings?.bdtToUsdRate || 125;
  const usdtRate = appSettings?.usdtWithdrawalRate || 125;

  let minLimit = appSettings?.minWithdrawBkash || 200;
  if (method === 'Nagad') minLimit = appSettings?.minWithdrawNagad || 200;
  if (method === 'USDT') minLimit = (appSettings?.minWithdrawUsdt || 2) * usdtRate;

  const parsedAmount = parseFloat(amountBdt) || 0;
  const feePercent = method === 'USDT' ? 0 : 0.02; // 2% fee on mobile banking
  const feeAmount = Math.round(parsedAmount * feePercent * 100) / 100;
  const netAmount = Math.max(0, parsedAmount - feeAmount);

  // USDT conversion
  const usdtEquivalent = (parsedAmount / usdtRate).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModal('login');
      return;
    }

    if (!accountNumber.trim()) {
      addToast('error', 'Please enter your destination account number or address.');
      return;
    }

    if (parsedAmount < minLimit) {
      addToast('error', `Minimum withdrawal amount for ${method} is ৳${minLimit}`);
      return;
    }

    if (user.balance < parsedAmount) {
      addToast('error', `Insufficient wallet balance. You have ৳${user.balance}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method,
          accountNumber,
          amountBdt: parsedAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal request failed.');

      addToast('success', 'Withdrawal request submitted! Pending admin processing.');
      setAmountBdt('');
      setAccountNumber('');
      await refreshProfile();
      await fetchWithdrawals();
    } catch (err: any) {
      addToast('error', err.message || 'Withdrawal request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (w: Withdrawal) => {
    switch (w.status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Paid
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Withdraw Funds
          <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Instant and secure withdrawals to bKash, Nagad, and USDT (TRC-20 / BEP-20) networks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form & Calculator (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            {/* Step 1: Select Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                1. Select Withdrawal Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* bKash */}
                <button
                  type="button"
                  onClick={() => setMethod('bKash')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    method === 'bKash'
                      ? 'bg-pink-950/40 border-pink-500 shadow-lg shadow-pink-950/40 text-pink-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center font-bold text-pink-400 text-sm">
                    bK
                  </div>
                  <span className="text-xs font-bold">bKash</span>
                  <span className="text-[10px] text-slate-400 font-mono">Min ৳200</span>
                </button>

                {/* Nagad */}
                <button
                  type="button"
                  onClick={() => setMethod('Nagad')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    method === 'Nagad'
                      ? 'bg-orange-950/40 border-orange-500 shadow-lg shadow-orange-950/40 text-orange-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center font-bold text-orange-400 text-sm">
                    NG
                  </div>
                  <span className="text-xs font-bold">Nagad</span>
                  <span className="text-[10px] text-slate-400 font-mono">Min ৳200</span>
                </button>

                {/* USDT */}
                <button
                  type="button"
                  onClick={() => setMethod('USDT')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                    method === 'USDT'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/40 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm">
                    ₮
                  </div>
                  <span className="text-xs font-bold">USDT</span>
                  <span className="text-[10px] text-slate-400 font-mono">Min 2 USDT</span>
                </button>
              </div>
            </div>

            {/* Step 2: Account Number / Wallet Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                2. {method === 'USDT' ? 'USDT TRC20 / BEP20 Wallet Address' : `${method} Mobile Number`}
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={
                  method === 'USDT'
                    ? 'e.g. T9yD14Nj9j7xAB4dbGeiX9h8unkkhxmTkn'
                    : 'e.g. 01712345678 (Personal / Agent)'
                }
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 font-mono focus:outline-none transition-colors"
              />
            </div>

            {/* Step 3: Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  3. Withdrawal Amount (in BDT)
                </label>
                {user && (
                  <span className="text-xs text-slate-400">
                    Available: <strong className="text-emerald-400 font-mono">{formatMoney(user.balance)}</strong>
                  </span>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">৳</span>
                <input
                  type="number"
                  required
                  min={minLimit}
                  max={user?.balance || 999999}
                  step="any"
                  value={amountBdt}
                  onChange={(e) => setAmountBdt(e.target.value)}
                  placeholder={`Min ${minLimit}`}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-base text-white placeholder-slate-500 font-mono tabular-nums focus:outline-none transition-colors"
                />
              </div>

              {/* Quick Presets */}
              {user && (
                <div className="flex items-center gap-2 mt-2">
                  {[200, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountBdt(preset.toString())}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-colors"
                    >
                      ৳{preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmountBdt(Math.floor(user.balance).toString())}
                    className="px-2.5 py-1 bg-purple-900/50 hover:bg-purple-800/60 text-purple-300 rounded-lg text-xs font-mono font-semibold transition-colors"
                  >
                    Max (৳{Math.floor(user.balance)})
                  </button>
                </div>
              )}
            </div>

            {/* Calculation & Breakdown Pod */}
            {parsedAmount > 0 && (
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Gross Requested:</span>
                  <span className="font-mono text-white font-semibold">৳{parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Platform Fee ({feePercent * 100}%):</span>
                  <span className="font-mono text-amber-400">৳{feeAmount.toFixed(2)}</span>
                </div>
                {method === 'USDT' && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>USDT Rate (1 USDT = {usdtRate} ৳):</span>
                    <span className="font-mono text-emerald-400 font-bold">{usdtEquivalent} USDT</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-white">
                  <span>Net Payout You Receive:</span>
                  <span className="font-mono tabular-nums text-emerald-400">
                    {method === 'USDT' ? `${usdtEquivalent} USDT` : `৳${netAmount.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={Boolean(isSubmitting || parsedAmount < minLimit || (user && user.balance < parsedAmount))}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Verifying Balance with Server...' : 'Submit Withdrawal Request'}
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Policies & Wallet Status (1 col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Withdrawal Rules & Guarantees
            </h3>

            <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Server-side Atomic Lock:</strong> Funds are deducted safely and will never be deducted twice.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Auto-Refund Guarantee:</strong> If a request is rejected by admin, the full balance is automatically credited back.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Processing Time:</strong> bKash and Nagad transfers are processed within 15 to 60 minutes. USDT transfers within 2 hours.
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Rates Card */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-xs space-y-2">
            <div className="font-semibold text-purple-300">Crypto Settlement Rate</div>
            <div className="flex items-center justify-between text-slate-300 font-mono">
              <span>1 USDT:</span>
              <span className="text-white font-bold">{usdtRate} ৳ BDT</span>
            </div>
            <div className="text-[11px] text-slate-400">
              bKash and Nagad withdrawals are settled 1:1 in Bangladeshi Taka (৳).
            </div>
          </div>
        </div>

      </div>

      {/* Withdrawal History Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Your Withdrawal History</h3>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading your withdrawal records...</div>
        ) : withdrawals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            You have not made any withdrawal requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Method & Account</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Transaction / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">#{w.id.slice(-6)}</td>
                    <td className="py-3 px-4">
                      <div className="font-sans font-semibold text-white">{w.method}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{w.accountNumber}</div>
                    </td>
                    <td className="py-3 px-4 tabular-nums text-white font-semibold">
                      ৳{w.amountBdt}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-emerald-400 font-bold">
                      ৳{w.netAmount}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(w)}</td>
                    <td className="py-3 px-4 font-sans text-[11px] text-slate-400">
                      {w.trxId && (
                        <div className="text-purple-300 font-mono font-semibold">
                          TrxID: {w.trxId}
                        </div>
                      )}
                      {w.rejectionReason && (
                        <div className="text-rose-400">Reason: {w.rejectionReason}</div>
                      )}
                      {!w.trxId && !w.rejectionReason && (w.adminNote || 'Processing')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
