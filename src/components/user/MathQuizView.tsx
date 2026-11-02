import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { AdsterraAdBanner } from '../common/AdsterraAdBanner.js';
import {
  Calculator,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuestionData {
  questionId: string;
  num1: number;
  num2: number;
  operator: '+' | '-' | '×';
  options: number[];
  timeLimitSeconds: number;
  rewardBdt: number;
  dailyMathLeft: number;
}

export const MathQuizView: React.FC = () => {
  const { token, refreshUser, addToast, user } = useAuth();
  const { formatMoney } = useTheme();

  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    correctAnswer: number;
    message: string;
    rewardBdt: number;
  } | null>(null);

  const [timerSeconds, setTimerSeconds] = useState<number>(25);

  // Fetch a new question from backend
  const fetchNewQuestion = async () => {
    if (!token) return;
    setLoading(true);
    setSelectedOption(null);
    setFeedback(null);
    setTimerSeconds(25);

    try {
      const res = await fetch('/api/user/math/question', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setQuestion(data);
        setTimerSeconds(data.timeLimitSeconds || 25);
      } else {
        addToast('error', data.error || 'Failed to load math quiz.');
      }
    } catch {
      addToast('error', 'Network error loading question.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewQuestion();
  }, [token]);

  // Timer countdown
  useEffect(() => {
    if (loading || feedback !== null || timerSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          // Time expired
          setFeedback({
            correct: false,
            correctAnswer: 0,
            message: 'সময় শেষ হয়ে গেছে! পরবর্তী প্রশ্নের চেষ্টা করুন।',
            rewardBdt: 0,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, feedback, timerSeconds]);

  const handleOptionClick = async (option: number) => {
    if (submitting || feedback !== null || !question) return;

    setSelectedOption(option);
    setSubmitting(true);

    try {
      const res = await fetch('/api/user/math/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: question.questionId,
          selectedAnswer: option,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({
          correct: data.correct,
          correctAnswer: data.correctAnswer,
          message: data.message,
          rewardBdt: data.rewardBdt,
        });

        if (data.correct) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
          addToast('success', data.message);
          refreshUser();
        } else {
          addToast('error', data.message);
        }
      } else {
        addToast('error', data.error || 'Verification failed.');
      }
    } catch {
      addToast('error', 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const timerPercent = question ? (timerSeconds / (question.timeLimitSeconds || 25)) * 100 : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900/80 border border-purple-500/30 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>ম্যাথ কুইজ · সহজ অঙ্ক সমাধান করে ইনকাম</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            সহজ অংক সমাধান করুন ও প্রতি উত্তরে ৳৪+ আয় করুন
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            যোগ, বিয়োগ ও গুণন সংক্রান্ত সাধারণ কুইজের সঠিক উত্তর নির্বাচন করুন। সঠিক উত্তর দেওয়ার সাথে সাথে আপনার একাউন্টে নগদ টাকা জমা হবে।
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              আজকের বাকি কুইজ
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {loading ? '...' : `${question?.dailyMathLeft ?? 0} কুইজ বাকি`}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              কুইজ থেকে মোট আয়
            </div>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {formatMoney(user?.mathEarned || 0)}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              প্রতি প্রশ্নের পুরস্কার
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {formatMoney(question?.rewardBdt || 4)}
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Card */}
      <div className="bg-slate-900/80 border border-purple-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md max-w-xl mx-auto">
        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400">নতুন অংক লোড হচ্ছে...</p>
          </div>
        ) : question ? (
          <div className="space-y-6">
            
            {/* Countdown Timer Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  সময় বাকি:
                </span>
                <span className="font-mono font-bold text-white">
                  {timerSeconds} সেকেন্ড
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    timerSeconds > 10
                      ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                      : timerSeconds > 5
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-red-500 to-rose-400 animate-pulse'
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>

            {/* Math Expression Board */}
            <div className="py-8 px-6 bg-slate-950/90 border border-purple-500/30 rounded-2xl text-center shadow-inner relative overflow-hidden">
              <div className="absolute top-2 right-3 text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                পুরস্কার: {formatMoney(question.rewardBdt)}
              </div>
              
              <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-wider font-mono flex items-center justify-center gap-4">
                <span>{question.num1}</span>
                <span className="text-amber-400">{question.operator}</span>
                <span>{question.num2}</span>
                <span className="text-purple-400">=</span>
                <span className="text-slate-500">?</span>
              </div>
              <p className="text-xs text-slate-400 mt-3">নিচের চারটি অপশন থেকে সঠিক উত্তরটি বেছে নিন</p>
            </div>

            {/* 4 Multiple Choice Options */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {question.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                let btnStyle = 'bg-slate-950/70 border-slate-700/80 hover:border-purple-500 text-white hover:bg-slate-800/80';

                if (feedback) {
                  if (opt === feedback.correctAnswer) {
                    btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold';
                  } else if (isSelected && !feedback.correct) {
                    btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-300 line-through';
                  } else {
                    btnStyle = 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-50';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-purple-900/60 border-purple-400 text-white';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(opt)}
                    disabled={submitting || feedback !== null}
                    className={`p-4 sm:p-5 rounded-2xl border text-xl sm:text-2xl font-mono font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 ${btnStyle}`}
                  >
                    {opt}
                    {feedback && opt === feedback.correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {feedback && isSelected && !feedback.correct && (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Result Feedback Banner */}
            {feedback && (
              <div
                className={`p-4 rounded-2xl border text-sm flex items-start gap-3 animate-in fade-in ${
                  feedback.correct
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                }`}
              >
                {feedback.correct ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-white mb-0.5">
                    {feedback.correct ? 'সঠিক উত্তর!' : 'ভুল উত্তর'}
                  </div>
                  <div className="text-xs">{feedback.message}</div>
                </div>
              </div>
            )}

            {/* Next Question Button */}
            {feedback && (
              <button
                onClick={fetchNewQuestion}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>পরবর্তী প্রশ্ন সমাধান করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">আজকের কোটা শেষ</h3>
            <p className="text-xs text-slate-400">আপনি আজকের সর্বোচ্চ কুইজ সম্পন্ন করেছেন। আগামীকাল আবার আসুন!</p>
          </div>
        )}
      </div>

      {/* Adsterra Sponsor Banner for Monetization */}
      <AdsterraAdBanner placement="math_quiz" />
    </div>
  );
};
