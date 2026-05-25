import clsx from 'clsx';
import { Wifi, WifiOff, Loader2, ArrowUpDown } from 'lucide-react';

const statusConfig = {
  disconnected: { color: 'bg-slate-400', label: 'Disconnected', animate: false, icon: WifiOff },
  connecting:   { color: 'bg-amber-400', label: 'Connecting\u2026', animate: true, icon: Loader2 },
  connected:    { color: 'bg-green-400', label: 'Connected', animate: false, icon: Wifi },
  transferring: { color: 'bg-brand-400', label: 'Transferring\u2026', animate: true, icon: ArrowUpDown },
};

export default function ConnectionStatus({ status = 'disconnected' }) {
  const config = statusConfig[status] || statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium glass-card">
      <span
        className={clsx(
          'status-dot',
          config.color,
          config.animate && 'animate-pulse'
        )}
      />
      <Icon className={clsx('w-3 h-3', config.animate && status === 'connecting' && 'animate-spin')} />
      <span>{config.label}</span>
    </div>
  );
}
