import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const colors = {
  info: 'border-l-brand-500 text-brand-600 dark:text-brand-400',
  success: 'border-l-green-500 text-green-600 dark:text-green-400',
  warning: 'border-l-amber-500 text-amber-600 dark:text-amber-400',
  error: 'border-l-red-500 text-red-600 dark:text-red-400',
};

const iconColors = {
  info: 'text-brand-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
};

export default function Toast() {
  const { state, dispatch } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {state.toasts.map((toast) => {
          const Icon = icons[toast.toastType] || Info;
          return (
            <motion.div
              key={toast.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`glass-card px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[360px] border-l-4 ${colors[toast.toastType] || colors.info}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[toast.toastType] || iconColors.info}`} />
              <p className="text-sm font-body flex-1 text-slate-700 dark:text-slate-200">{toast.message}</p>
              <button
                onClick={() => dispatch({ type: 'REMOVE_TOAST', id: toast.id })}
                className="p-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
