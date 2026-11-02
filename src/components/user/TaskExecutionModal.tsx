import React, { useState, useEffect } from 'react';
import { Task } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import confetti from 'canvas-confetti';
import { ExternalLink, CheckCircle2, Clock, Sparkles, X, AlertCircle } from 'lucide-react';

interface TaskExecutionModalProps {
  task: Task;
  taskUnlockToken: string;
  onClose: () => void;
  onTaskCompleted: (rewardBdt: number) => void;
}

export const TaskExecutionModal: React.FC<TaskExecutionModalProps> = ({
  task,
  taskUnlockToken,
  onClose,
  onTaskCompleted,
}) => {
  const { token, refreshProfile, addToast } = useAuth();
  const { formatMoney } = useTheme();

  const [proof, setProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [taskCountdown, setTaskCountdown] = useState(task.durationSeconds || 30);
  const [canSubmit, setCanSubmit] = useState(task.durationSeconds <= 5);

  useEffect(() => {
    if (taskCountdown <= 0) {
      setCanSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTaskCountdown((prev) => {
        if (prev <= 1) {
          setCanSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [taskCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      addToast('info', `Please complete the required ${task.durationSeconds}s duration.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/user/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: task.id,
          taskUnlockToken,
          submittedProof: proof || 'Completed successfully',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim task reward.');
      }

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#eab308', '#10b981', '#38bdf8'],
      });

      await refreshProfile();
      onTaskCompleted(data.rewardBdt);
      addToast('success', `🎉 Reward credited: ${formatMoney(data.rewardBdt)}!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission error.');
      addToast('error', err.message || 'Task submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-100 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Active Task Execution
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{task.title}</h3>

        <div className="flex items-center gap-4 text-xs font-mono mb-4 text-slate-300">
          <div className="px-2.5 py-1 bg-purple-950/80 border border-purple-500/30 rounded-lg text-purple-300 font-semibold">
            Reward: <span className="text-emerald-400 font-bold">{formatMoney(task.rewardBdt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            Duration: {task.durationSeconds}s
          </div>
        </div>

        {/* Task Details & Action */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 mb-5 text-xs text-slate-300">
          <p className="leading-relaxed">{task.description}</p>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
            <strong className="text-purple-300 block mb-1">Step-by-step instructions:</strong>
            {task.instructions}
          </div>

          {task.targetUrl && (
            <a
              href={task.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-all shadow-md shadow-purple-950/50"
            >
              Open Sponsor Destination
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Task Timer Notice */}
        <div className="mb-4 flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400">Required Completion Timer:</span>
          {canSubmit ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Ready to Submit
            </span>
          ) : (
            <span className="font-mono tabular-nums text-amber-400 font-bold">
              {taskCountdown} seconds remaining
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Proof / Completion Confirmation (Optional)
            </label>
            <input
              type="text"
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="e.g. Telegram username or confirmation note"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                canSubmit
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/40 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                'Submitting...'
              ) : canSubmit ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Claim {formatMoney(task.rewardBdt)}
                </>
              ) : (
                `Wait (${taskCountdown}s)`
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
