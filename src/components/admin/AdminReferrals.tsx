import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { ReferralRecord } from '../../types/index.js';
import { Users, Award, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

export const AdminReferrals: React.FC = () => {
  const { token, appSettings, refreshSettings, addToast } = useAuth();
  const { formatMoney } = useTheme();

  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [commissionPercent, setCommissionPercent] = useState('10');
  const [bonusBdt, setBonusBdt] = useState('15');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch('/api/admin/referrals', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReferrals(data.referrals || []);
          if (data.settings) {
            setCommissionPercent(data.settings.referralCommissionPercent.toString());
            setBonusBdt(data.settings.referralBonusBdt.toString());
          }
        }
      } catch (err) {
        console.error('Failed to load referrals:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReferrals();
  }, [token]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/referrals/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referralCommissionPercent: parseFloat(commissionPercent),
          referralBonusBdt: parseFloat(bonusBdt),
        }),
      });
      if (!res.ok) throw new Error('Failed to update referral configuration.');
      await refreshSettings();
      addToast('success', 'Referral bonus and commission rates updated!');
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalCommissionsPaid = referrals.reduce((acc, r) => acc + (r.commissionEarned || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Referral System Management
          <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Control platform referral commission percentages, new user invitation bonuses, and monitor viral growth.
        </p>
      </div>

      {/* Settings & Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Form */}
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            Commission & Bonus Controls
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Referral Task Commission (%)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">
                Referrers earn this percentage of every completed task by their referee.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Instant Signup Bonus for Referrer (BDT)
              </label>
              <input
                type="number"
                min={0}
                max={200}
                required
                value={bonusBdt}
                onChange={(e) => setBonusBdt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white font-mono"
              />
              <span className="text-[10px] text-slate-500">
                Credited when a new verified user registers using an invitation code.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/40 transition-colors cursor-pointer"
            >
              {isSaving ? 'Updating...' : 'Save Referral Parameters'}
            </button>
          </div>
        </form>

        {/* Stats Pods */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Platform Referrals</span>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-white">
              {referrals.length}
            </div>
            <div className="text-xs text-slate-400 mt-2">Verified invitations recorded</div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Total Commissions Disbursed</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
              {formatMoney(totalCommissionsPaid)}
            </div>
            <div className="text-xs text-slate-400 mt-2">Credited to referrers</div>
          </div>
        </div>

      </div>

      {/* Referrals Network Records */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Referral Records & Audit Trail</h3>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading referral database...</div>
        ) : referrals.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No referral records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Referee Name</th>
                  <th className="py-3 px-4">Referee Email</th>
                  <th className="py-3 px-4">Commission Generated</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-semibold text-white">{ref.refereeName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{ref.refereeEmail}</td>
                    <td className="py-3.5 px-4 tabular-nums text-emerald-400 font-bold">
                      {formatMoney(ref.commissionEarned)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans text-[11px]">
                      {new Date(ref.joinedAt).toLocaleDateString()}
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
