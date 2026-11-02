import React from 'react';
import { useAuth, ToastItem } from '../../context/AuthContext.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast: ToastItem) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-slate-900/95 border-rose-500/40 text-rose-200'
              : 'bg-slate-900/95 border-purple-500/40 text-purple-200'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-purple-400" />}
          </div>
          <p className="text-xs font-medium leading-relaxed flex-1 text-slate-100">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white transition-colors shrink-0 p-0.5"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
