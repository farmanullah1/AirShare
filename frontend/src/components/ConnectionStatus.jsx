import clsx from 'clsx';

const statusConfig = {
  disconnected: { color: 'bg-slate-400', label: 'Disconnected', animate: false },
  connecting:   { color: 'bg-amber-400', label: 'Connecting\u2026', animate: true },
  connected:    { color: 'bg-green-400', label: 'Connected', animate: false },
  transferring: { color: 'bg-brand-400', label: 'Transferring\u2026', animate: true },
};

export default function ConnectionStatus({ status = 'disconnected' }) {
  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium glass-card">
      <span
        className={clsx(
          'status-dot',
          config.color,
          config.animate && 'animate-pulse'
        )}
      />
      <span>{config.label}</span>
    </div>
  );
}
