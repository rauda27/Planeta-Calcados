'use client';

import React from 'react';
import { useStore } from '../../context/StoreContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
          error: 'border-rose-200 bg-rose-50 text-rose-950',
          warning: 'border-amber-200 bg-amber-50 text-amber-950',
          info: 'border-sky-200 bg-sky-50 text-sky-950',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <p className="text-sm font-medium leading-snug">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
};
