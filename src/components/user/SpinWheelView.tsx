import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { AdsterraAdBanner } from '../common/AdsterraAdBanner.js';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SpinStatus {
  dailySpinsLeft: number;
  dailyMax: number;
  cooldownSecondsRemaining: number;
  canSpin: boolean;
  prizes: number[];
  spinEarned: number;
}

const SEGMENTS = [
  { prize: 1, label: '৳1', color: '#7c3aed' },   // Purple
  { prize: 5, label: '৳5', color: '#f59e0b' },   // Amber
  { prize: 2, label: '৳2', color: '#4f46e5' },   // Indigo
  { prize: 10, label: '৳10', color: '#10b981' }, // Emerald
  { prize: 3, label: '৳3', color: '#8b5cf6' },   // Violet
  { prize: 15, label: '৳15', color: '#ec4899' }, // Pink
  { prize: 2, label: '৳2', color: '#3b82f6' },   // Blue
  { prize: 25, label: '৳25', color: '#eab308' }, // Gold
  { prize: 5, label: '৳5', color: '#06b6d4' },   // Cyan
  { prize: 50, label: '৳50', color: '#d946ef' }, // Fuchsia Super Prize
];

export const SpinWheelView: React.FC = () => {
  const { token, refreshUser, addToast, user } = useAuth();
  const { formatMoney } = useTheme();

  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<number | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState<boolean>(false);
  const [cooldownTimer, setCooldownTimer] = useState<number>(0);

  const currentRotationRef = useRef<number>(0);

  // Fetch spin status from backend
  const fetchSpinStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/user/spin/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setCooldownTimer(data.cooldownSecondsRemaining || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpinStatus();
  }, [token]);

  // Cooldown countdown interval
  useEffect(() => {
    if (cooldownTimer <= 0) return;
    const interval = setInterval(() => {
      setCooldownTimer((prev) => {
        if (prev <= 1) {
          fetchSpinStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownTimer]);

  const handleSpinClick = async () => {
    if (spinning || !status?.canSpin || cooldownTimer > 0) return;

    setSpinning(true);
    setWonPrize(null);

    try {
      const res = await fetch('/api/user/spin/execute', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        addToast('error', data.error || 'Failed to spin.');
        setSpinning(false);
        return;
      }

      // Calculate target rotation angle
      // 10 segments = 36 deg per segment
      const numSegments = SEGMENTS.length;
      const degPerSegment = 360 / numSegments;
      const targetIndex = data.segmentIndex;

      // The top pointer points at 270 deg (or top: 0 deg).
      // Segment i starts at i * degPerSegment to (i+1) * degPerSegment.
      // To bring the center of segment i to the top pointer (0 deg / 360 deg):
      const segmentCenter = targetIndex * degPerSegment + degPerSegment / 2;
      const baseRotation = 360 - segmentCenter;

      // Add 6-8 full rotations
      const extraRevolutions = 360 * 6;
      const newTotalRotation = currentRotationRef.current + extraRevolutions + (baseRotation - (currentRotationRef.current % 360));
      currentRotationRef.current = newTotalRotation;
      setWheelRotation(newTotalRotation);

      // Wait 4 seconds for CSS transition to complete
      setTimeout(() => {
        setSpinning(false);
        setWonPrize(data.prizeBdt);
        setShowPrizeModal(true);
        setCooldownTimer(data.cooldownSeconds || 30);
        setStatus((prev) => prev ? {
          ...prev,
          dailySpinsLeft: data.dailySpinsLeft,
          canSpin: false,
          spinEarned: (prev.spinEarned || 0) + data.prizeBdt,
        } : null);

        // Confetti explosion
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981'],
        });

        addToast('success', data.message);
        refreshUser();
      }, 4200);

    } catch (err: any) {
      addToast('error', err.message || 'Network error occurred.');
      setSpinning(false);
    }
  };

  const numSegments = SEGMENTS.length;
  const anglePerSegment = 360 / numSegments;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900/80 border border-purple-500/30 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>লাকি স্পিন হুইল · ১০০% নিশ্চিত পুরষ্কার</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            চাকা ঘুরান এবং প্রতি স্পিনে ৳৫০ পর্যন্ত ইনকাম করুন
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            প্রতিদিন নির্ধারিত সংখ্যক ফ্রি স্পিন করুন। চাকাটি ঘুরে যে নম্বরে থামবে, সেই পরিমাণ বাংলাদেশি টাকা সরাসরি আপনার মূল ব্যালেন্সে যোগ হবে!
          </p>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              আজকের বাকি স্পিন
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {loading ? '...' : `${status?.dailySpinsLeft ?? 0} / ${status?.dailyMax ?? 15}`}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              স্পিন থেকে মোট আয়
            </div>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {formatMoney(user?.spinEarned || status?.spinEarned || 0)}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              স্পিন কুলডাউন
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {cooldownTimer > 0 ? (
                <span className="text-amber-400 flex items-center gap-1">
                  {cooldownTimer} সেকেন্ড বাকি
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> প্রস্তুত
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Wheel Arena */}
      <div className="bg-slate-900/80 border border-purple-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md flex flex-col items-center">
        
        {/* Wheel Container with Pointer */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center my-4">
          
          {/* Glowing Ambient Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-amber-500/30 blur-2xl pointer-events-none" />

          {/* Top Pointer Needle */}
          <div className="absolute -top-3 z-30 flex flex-col items-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[28px] border-t-amber-400" />
            <div className="w-4 h-4 rounded-full bg-amber-300 -mt-7 shadow-md border-2 border-slate-950" />
          </div>

          {/* Outer Chrome Bezel */}
          <div className="relative w-full h-full rounded-full p-2.5 bg-gradient-to-tr from-purple-900 via-indigo-800 to-amber-600 shadow-2xl border-4 border-slate-950">
            <div className="w-full h-full rounded-full p-1.5 bg-slate-950">
              
              {/* Rotating Wheel Canvas/SVG */}
              <div
                className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.12, 0.85, 0.25, 1)' : 'none',
                }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full select-none">
                  <defs>
                    {SEGMENTS.map((seg, idx) => (
                      <linearGradient key={`grad-${idx}`} id={`wedge-grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={seg.color} stopOpacity="1" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
                      </linearGradient>
                    ))}
                  </defs>

                  {SEGMENTS.map((seg, idx) => {
                    const startAngle = idx * anglePerSegment;
                    const endAngle = (idx + 1) * anglePerSegment;
                    const midAngle = startAngle + anglePerSegment / 2;

                    // Convert polar to cartesian
                    const r = 200;
                    const cx = 200;
                    const cy = 200;
                    const x1 = cx + r * Math.cos((Math.PI * (startAngle - 90)) / 180);
                    const y1 = cy + r * Math.sin((Math.PI * (startAngle - 90)) / 180);
                    const x2 = cx + r * Math.cos((Math.PI * (endAngle - 90)) / 180);
                    const y2 = cy + r * Math.sin((Math.PI * (endAngle - 90)) / 180);

                    // Text position
                    const textR = 135;
                    const textX = cx + textR * Math.cos((Math.PI * (midAngle - 90)) / 180);
                    const textY = cy + textR * Math.sin((Math.PI * (midAngle - 90)) / 180);

                    return (
                      <g key={idx}>
                        <path
                          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                          fill={`url(#wedge-grad-${idx})`}
                          stroke="#1e293b"
                          strokeWidth="2"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill="#ffffff"
                          fontSize="20"
                          fontWeight="800"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                          className="filter drop-shadow"
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Center Cap Hub with Button */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 border-4 border-slate-950 shadow-2xl flex flex-col items-center justify-center text-slate-950 font-extrabold text-[11px] sm:text-xs">
                  <Flame className="w-5 h-5 text-amber-600 animate-pulse" />
                  <span>WIN</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full max-w-sm flex flex-col items-center gap-3 mt-4">
          <button
            onClick={handleSpinClick}
            disabled={spinning || !(status?.canSpin) || cooldownTimer > 0}
            className={`w-full py-4 px-8 rounded-2xl font-extrabold text-base tracking-wide uppercase transition-all duration-200 shadow-xl flex items-center justify-center gap-3 cursor-pointer ${
              spinning
                ? 'bg-purple-800 text-purple-300 opacity-80 cursor-wait'
                : cooldownTimer > 0
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                : (status?.dailySpinsLeft ?? 0) <= 0
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {spinning ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin text-purple-300" />
                <span>চাকা ঘুরছে...</span>
              </>
            ) : cooldownTimer > 0 ? (
              <>
                <Clock className="w-5 h-5 text-amber-400" />
                <span>অপেক্ষা করুন ({cooldownTimer}s)</span>
              </>
            ) : (status?.dailySpinsLeft ?? 0) <= 0 ? (
              <>
                <AlertCircle className="w-5 h-5 text-slate-500" />
                <span>আজকের স্পিন কোটা শেষ</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-slate-950" />
                <span>চাকা ঘুরান (SPIN NOW)</span>
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 text-center flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            প্রতি স্পিনের পর {status ? (status.cooldownSecondsRemaining || 30) : 30} সেকেন্ড কুলডাউন থাকে।
          </p>
        </div>
      </div>

      {/* Prize Won Modal Dialog */}
      {showPrizeModal && wonPrize !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 to-purple-950 border border-amber-400/50 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl overflow-hidden">
            
            <div className="w-16 h-16 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-4 text-3xl">
              🎉
            </div>

            <h3 className="text-xl font-extrabold text-white">অভিনন্দন! আপনি জিতেছেন!</h3>
            <p className="text-xs text-slate-300 mt-1">লাকি স্পিন থেকে আপনার পুরষ্কার:</p>

            <div className="my-5 py-4 px-6 bg-slate-950/80 border border-amber-400/40 rounded-2xl shadow-inner inline-block">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-400">
                {formatMoney(wonPrize)}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              টাকা সাথে সাথে আপনার উপলব্ধ ব্যালেন্সে জমা হয়েছে। আপনি যেকোনো সময় bKash বা Nagad-এ উত্তোলন করতে পারেন।
            </p>

            <button
              onClick={() => setShowPrizeModal(false)}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
            >
              পুরষ্কার গ্রহণ করুন
            </button>
          </div>
        </div>
      )}

      {/* Adsterra Sponsor Banner for Monetization */}
      <AdsterraAdBanner placement="spin_wheel" />
    </div>
  );
};
