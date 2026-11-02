import React, { useState, useEffect, useRef } from 'react';
import { Task, Advertisement } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { ShieldCheck, AlertTriangle, CheckCircle2, Lock, ArrowRight, Eye, X } from 'lucide-react';

interface AdTimerModalProps {
  task: Task;
  onClose: () => void;
  onAdVerified: (taskUnlockToken: string) => void;
}

export const AdTimerModal: React.FC<AdTimerModalProps> = ({ task, onClose, onAdVerified }) => {
  const { token, addToast } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [securityToken, setSecurityToken] = useState<string | null>(null);
  const [sponsorAd, setSponsorAd] = useState<Advertisement | null>(null);

  const [totalSeconds, setTotalSeconds] = useState(10);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [isTabFocused, setIsTabFocused] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [taskUnlockToken, setTaskUnlockToken] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isTabFocusedRef = useRef(true);

  // 1. Initialize Ad Session from Backend
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      try {
        const res = await fetch('/api/user/tasks/start-ad', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ taskId: task.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to start sponsor verification.');

        if (isMounted) {
          setSessionId(data.sessionId);
          setSecurityToken(data.token);
          setSponsorAd(data.sponsorAd);
          const dur = data.timerSeconds || 10;
          setTotalSeconds(dur);
          setSecondsRemaining(dur);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setVerificationError(err.message);
          setIsLoading(false);
        }
      }
    }

    initSession();
    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [task.id, token]);

  // 2. Track Window Focus & Page Visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const active = !document.hidden;
      setIsTabFocused(active);
      isTabFocusedRef.current = active;
    };

    const handleBlur = () => {
      setIsTabFocused(false);
      isTabFocusedRef.current = false;
    };

    const handleFocus = () => {
      setIsTabFocused(true);
      isTabFocusedRef.current = true;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 3. Strict 10-Second Countdown (Only increments while user is actively focused on screen)
  useEffect(() => {
    if (isLoading || isCompleted || verificationError || !sessionId) return;

    timerRef.current = setInterval(() => {
      if (!isTabFocusedRef.current) {
        // Paused because tab is not active
        return;
      }

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAdFinished();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLoading, isCompleted, verificationError, sessionId]);

  // 4. Verify on Backend upon timer completion
  const handleAdFinished = async () => {
    if (!sessionId || !securityToken) return;
    setIsVerifying(true);
    try {
      const res = await fetch('/api/user/tasks/verify-ad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, token: securityToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server rejected ad verification.');
      }

      setIsCompleted(true);
      setTaskUnlockToken(data.taskUnlockToken);
      addToast('success', 'Sponsor verified! Task is unlocked.');
    } catch (err: any) {
      setVerificationError(err.message || 'Ad verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const progressPercent = Math.min(100, Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-purple-400">10-Second Security Gate</div>
              <h3 className="text-base font-bold text-white truncate max-w-xs">{task.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Focus warning alert banner */}
        {!isTabFocused && !isCompleted && (
          <div className="mt-4 p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-200 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Attention:</strong> You switched tabs! The timer is paused. Please stay on this screen to unlock your task.
            </span>
          </div>
        )}

        {/* Main Countdown & Verification Card */}
        <div className="my-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading verified sponsor advertisement...</p>
            </div>
          ) : verificationError ? (
            <div className="py-6 space-y-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-300 font-medium">{verificationError}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg font-semibold"
              >
                Close and Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Circular Countdown Ring */}
              <div className="relative w-24 h-24 my-2 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="7"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                    stroke={isCompleted ? '#10b981' : isTabFocused ? '#8b5cf6' : '#f43f5e'}
                    strokeWidth="7"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * progressPercent) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-in zoom-in" />
                  ) : (
                    <>
                      <span className="text-2xl font-extrabold font-mono tabular-nums text-white">
                        {secondsRemaining}s
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Remaining</span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress message */}
              <div className="mt-2 text-xs">
                {isCompleted ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5 justify-center">
                    <CheckCircle2 className="w-4 h-4" /> Sponsor Verification Complete!
                  </span>
                ) : isVerifying ? (
                  <span className="text-purple-300 font-semibold animate-pulse">
                    Verifying security token with server...
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Keep this window open for <strong className="text-white">{secondsRemaining} seconds</strong> to unlock this task.
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sponsor Advertisement Placement Section */}
        {sponsorAd && (
          <div className="flex-1 overflow-y-auto mb-4 border border-purple-500/20 bg-slate-950/90 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-purple-400 font-semibold border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Official Sponsor Placement
              </span>
              <span className="text-slate-400 font-mono text-[10px]">Verified Ad ID: #{sponsorAd.id}</span>
            </div>

            {/* Render Safe Ad HTML or Card */}
            {sponsorAd.bannerCodeHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: sponsorAd.bannerCodeHtml }}
                className="overflow-hidden"
              />
            ) : (
              <div className="p-4 bg-purple-900/20 rounded-lg text-center space-y-2">
                <div className="text-sm font-bold text-white">{sponsorAd.title}</div>
                {sponsorAd.targetUrl && (
                  <a
                    href={sponsorAd.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-purple-400 hover:text-purple-300 underline font-medium"
                  >
                    Visit Partner Website →
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Button: Locked until completion */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (taskUnlockToken) {
                onAdVerified(taskUnlockToken);
              }
            }}
            disabled={!isCompleted || !taskUnlockToken}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              isCompleted && taskUnlockToken
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/50 cursor-pointer animate-in zoom-in-95'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            {isCompleted ? (
              <>
                Start Task Now
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Locked ({secondsRemaining}s)
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
