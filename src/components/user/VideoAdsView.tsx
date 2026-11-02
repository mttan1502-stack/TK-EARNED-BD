import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { Advertisement } from '../../types/index.js';
import confetti from 'canvas-confetti';
import { PlayCircle, Award, CheckCircle2, AlertCircle, Sparkles, Volume2, VolumeX } from 'lucide-react';

export const VideoAdsView: React.FC = () => {
  const { token, user, refreshProfile, addToast, setAuthModal } = useAuth();
  const { formatMoney } = useTheme();

  const [videoAds, setVideoAds] = useState<Advertisement[]>([]);
  const [dailyLimit, setDailyLimit] = useState(15);
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Video playback & countdown state
  const [countdown, setCountdown] = useState(15);
  const [isWatching, setIsWatching] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchAds() {
      try {
        const res = await fetch('/api/user/video-ads', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setVideoAds(data.videoAds || []);
          if (data.dailyLimit) setDailyLimit(data.dailyLimit);
        }
      } catch (err) {
        console.error('Failed to load video ads:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAds();
  }, [token]);

  const handleStartWatch = (ad: Advertisement) => {
    if (!user) {
      setAuthModal('login');
      return;
    }

    setActiveAd(ad);
    const duration = ad.timerSeconds || 15;
    setCountdown(duration);
    setIsWatching(true);
    setIsCompleted(false);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClaimReward = async () => {
    if (!activeAd || !isCompleted) return;
    setIsClaiming(true);
    try {
      const res = await fetch('/api/user/video-ads/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adId: activeAd.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim video reward.');

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });

      await refreshProfile();
      addToast('success', `🎉 Video reward claimed: ${formatMoney(data.rewardBdt)}!`);
      setActiveAd(null);
      setIsWatching(false);
    } catch (err: any) {
      addToast('error', err.message || 'Reward claim failed.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          Rewarded Video Advertisements
          <Sparkles className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Watch short sponsor video clips to the end and get rewarded with instant wallet balance credits.
        </p>
      </div>

      {/* Active Video Player Modal/Screen */}
      {isWatching && activeAd && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sponsor Video Clip · {activeAd.title}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="px-3 py-1 bg-slate-950 rounded-lg text-xs font-mono font-bold text-amber-400 border border-slate-800">
                {isCompleted ? 'Finished ✓' : `${countdown}s remaining`}
              </div>
            </div>
          </div>

          {/* Video Container */}
          <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
            {activeAd.videoUrl ? (
              <video
                ref={videoRef}
                src={activeAd.videoUrl}
                autoPlay
                playsInline
                muted={isMuted}
                controls={false}
                onEnded={() => setIsCompleted(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-8 text-center space-y-2">
                <PlayCircle className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
                <p className="text-sm font-bold text-white">{activeAd.title}</p>
                <p className="text-xs text-slate-400">Streaming sponsor presentation...</p>
              </div>
            )}

            {/* Overlay Countdown Badge */}
            {!isCompleted && (
              <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs font-mono tabular-nums text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Wait {countdown}s
              </div>
            )}
          </div>

          {/* Claim Button Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400">
              Reward upon completion:{' '}
              <span className="text-emerald-400 font-bold font-mono text-sm">
                {formatMoney(activeAd.rewardBdt || 10)}
              </span>
            </div>

            <button
              onClick={handleClaimReward}
              disabled={!isCompleted || isClaiming}
              className={`py-2.5 px-6 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/50 cursor-pointer animate-in zoom-in-95'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              {isClaiming ? (
                'Crediting...'
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Claim {formatMoney(activeAd.rewardBdt || 10)} Reward
                </>
              ) : (
                `Complete Video (${countdown}s)`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Available Video Ads List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videoAds.map((ad) => (
          <div
            key={ad.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Partner Video
                </span>
                <span className="text-slate-400 font-mono text-[11px]">{ad.timerSeconds || 15}s</span>
              </div>
              <h4 className="text-base font-bold text-white">{ad.title}</h4>
              <p className="text-xs text-slate-400">
                Watch full duration with active audio/video stream to qualify for reward credit.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Reward</div>
                <div className="text-base font-bold font-mono tabular-nums text-emerald-400">
                  {formatMoney(ad.rewardBdt || 12)}
                </div>
              </div>

              <button
                onClick={() => handleStartWatch(ad)}
                className="py-2 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                Watch Video
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
