import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const bgStyle =
    toast.type === 'success'
      ? 'bg-emerald-900 text-white border-emerald-700'
      : toast.type === 'warning'
      ? 'bg-amber-900 text-white border-amber-700'
      : 'bg-stone-900 text-white border-stone-700';

  const icon =
    toast.type === 'success' ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
    ) : toast.type === 'warning' ? (
      <AlertTriangle className="w-4 h-4 text-amber-300" />
    ) : (
      <Info className="w-4 h-4 text-blue-300" />
    );

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl max-w-sm ${bgStyle}`}>
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 text-xs">
          <p className="font-bold">{toast.title}</p>
          {toast.message && <p className="text-stone-300 mt-0.5">{toast.message}</p>}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
