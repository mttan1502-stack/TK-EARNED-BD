import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { ReferralRecord } from '../../types/index.js';
import {
  Users,
  Copy,
  Check,
  Share2,
  TrendingUp,
  Award,
  Sparkles,
  MessageCircle,
  Send,
  HelpCircle,
} from 'lucide-react';

export const ReferralView: React.FC = () => {
  const { user, token, appSettings, addToast, setAuthModal } = useAuth();
  const { formatMoney } = useTheme();

  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReferralData() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/user/referrals', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReferrals(data.referrals || []);
        }
      } catch (err) {
        console.error('Failed to load referral data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReferralData();
  }, [token]);

  const referralCode = user?.refCode || 'SULTAN';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
    addToast('success', 'Copied to clipboard!');
  };

  const shareText = encodeURIComponent(
    `🔥 Join TK EARNED BD and earn real money by completing tasks & watching videos! Use my invite code ${referralCode} to get a ৳10 signup bonus: ${referralLink}`
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Referral Program & Earnings
          <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Invite your friends to TK EARNED BD and receive a lifetime {appSettings?.referralCommissionPercent || 10}% commission on every task they complete!
        </p>
      </div>

      {/* Referral Link & Code Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Referrals */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Referrals</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            {user ? referrals.length : 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Active network members</div>
        </div>

        {/* Total Referral Earnings */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Referral Commission Earned</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            {user ? formatMoney(user.referralEarned) : '৳0.00'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Credited instantly to balance</div>
        </div>

        {/* Commission Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Commission Rate</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-purple-400">
            {appSettings?.referralCommissionPercent || 10}%
          </div>
          <div className="text-[11px] text-slate-400 mt-2">Plus ৳{appSettings?.referralBonusBdt || 15} per new user</div>
        </div>
      </div>

      {/* Share Box */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Share2 className="w-4 h-4 text-purple-400" />
          Your Unique Invite Tools
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Unique Referral Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Your Personal Referral Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={user ? referralLink : 'Please sign in to get link'}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-purple-300 focus:outline-none"
              />
              <button
                onClick={() => user ? copyToClipboard(referralLink, true) : setAuthModal('login')}
                className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Referral Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Your Referral Code</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={user ? referralCode : '----'}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold tracking-wider text-amber-400 focus:outline-none"
              />
              <button
                onClick={() => user ? copyToClipboard(referralCode, false) : setAuthModal('login')}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Direct Share:</span>
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join TK EARNED BD and earn real money!')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            Telegram
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Facebook
          </a>
        </div>
      </div>

      {/* Referrals Network Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">Your Referred Friends ({referrals.length})</h3>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading referral records...</div>
        ) : referrals.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            You don't have any referrals yet. Share your invite link to start earning lifetime commissions!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Referee Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Commission Earned</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-white">{ref.refereeName}</td>
                    <td className="py-3 px-4 text-slate-400">{ref.refereeEmail}</td>
                    <td className="py-3 px-4 tabular-nums text-emerald-400 font-bold">
                      {formatMoney(ref.commissionEarned)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans">
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
