import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-white/95 border-status-teal/40 text-ink-primary'
                : isError
                ? 'bg-white/95 border-status-red/40 text-ink-primary'
                : isWarning
                ? 'bg-white/95 border-status-amber/40 text-ink-primary'
                : 'bg-white/95 border-steel/40 text-ink-primary'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-status-teal" />}
              {isError && <XCircle className="w-5 h-5 text-status-red" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-status-amber" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-steel" />}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-sm font-semibold text-ink-primary leading-snug">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed break-words">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 text-ink-muted hover:text-ink-primary rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-steel/40"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
