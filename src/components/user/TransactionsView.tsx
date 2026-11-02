import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Transaction, TransactionType } from '../../types/index.js';
import { Wallet, Filter, ArrowDownLeft, ArrowUpRight, Award, Share2, PlayCircle } from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const { token, user } = useAuth();
  const { formatMoney } = useTheme();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/user/transactions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions || []);
        }
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [token]);

  const filteredTx = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    if (filterType === 'tasks') return tx.type === 'task_reward';
    if (filterType === 'ads') return tx.type === 'ad_reward';
    if (filterType === 'referrals') return tx.type.includes('referral');
    if (filterType === 'withdrawals') return tx.type.includes('withdrawal');
    return true;
  });

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'task_reward':
        return <Award className="w-4 h-4 text-purple-400" />;
      case 'ad_reward':
        return <PlayCircle className="w-4 h-4 text-emerald-400" />;
      case 'referral_bonus':
      case 'referral_commission':
        return <Share2 className="w-4 h-4 text-amber-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
      case 'withdrawal_refund':
        return <ArrowDownLeft className="w-4 h-4 text-blue-400" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Account Financial Ledger
            <Wallet className="w-5 h-5 text-purple-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit-grade record of all incoming earnings, referral commissions, and withdrawal payouts.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'ads', label: 'Video Ads' },
            { id: 'referrals', label: 'Referrals' },
            { id: 'withdrawals', label: 'Withdrawals' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filterType === tab.id
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading ledger data...</div>
        ) : filteredTx.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                          {getTypeIcon(tx.type)}
                        </div>
                        <span className="font-sans capitalize text-slate-300">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-white font-medium">
                      {tx.description}
                      {tx.referenceId && (
                        <span className="ml-2 text-[10px] text-slate-500 font-mono">
                          Ref: #{tx.referenceId.slice(-6)}
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3.5 px-4 tabular-nums font-bold text-sm ${
                        tx.amountBdt >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.amountBdt >= 0 ? `+${formatMoney(tx.amountBdt)}` : formatMoney(tx.amountBdt)}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-slate-300 font-semibold">
                      {formatMoney(tx.balanceAfter)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString()} ·{' '}
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
