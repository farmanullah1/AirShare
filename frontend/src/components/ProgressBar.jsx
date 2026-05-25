import clsx from 'clsx';
import { CheckCircle2 } from 'lucide-react';

const gradients = {
  blue: 'from-brand-400 to-brand-600',
  green: 'from-green-400 to-green-600',
  purple: 'from-accent-400 to-accent-600',
};

export default function ProgressBar({ value = 0, label = '', sublabel = '', color = 'blue', showShimmer = false }) {
  const isComplete = value >= 100;
  const gradient = isComplete ? gradients.green : (gradients[color] || gradients.blue);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-body font-medium text-slate-700 dark:text-slate-300 truncate max-w-[70%]">
          {label}
        </span>
        <span className="text-sm font-mono font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          {isComplete ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Done</span>
            </>
          ) : (
            `${Math.round(value)}%`
          )}
        </span>
      </div>
      <div className="progress-bar-track">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r relative overflow-hidden',
            gradient,
            isComplete && 'animate-pulse'
          )}
          style={{ width: `${Math.min(value, 100)}%` }}
        >
          {showShimmer && !isComplete && <div className="absolute inset-0 shimmer" />}
        </div>
      </div>
      {sublabel && (
        <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{sublabel}</p>
      )}
    </div>
  );
}
