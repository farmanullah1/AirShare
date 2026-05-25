import { motion } from 'framer-motion';
import { XCircle, ArrowUp, ArrowDown, Clock, HardDrive } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { formatBytes, formatSpeed, formatTime } from '../utils/formatBytes';

export default function TransferProgress({ files = {}, role = 'sender', onCancel }) {
  const entries = Object.entries(files);
  if (entries.length === 0) return null;

  const totalBytes = entries.reduce((sum, [, f]) => sum + (f.total || 0), 0);
  const doneBytes = entries.reduce((sum, [, f]) => sum + (f.sent || f.received || 0), 0);
  const overallPercent = totalBytes > 0 ? (doneBytes / totalBytes) * 100 : 0;
  const avgSpeed = entries.reduce((sum, [, f]) => sum + (f.speed || 0), 0) / Math.max(entries.length, 1);
  const maxEta = Math.max(...entries.map(([, f]) => f.eta || 0));
  const completedFiles = entries.filter(([, f]) => {
    const done = f.sent || f.received || 0;
    return f.total > 0 && done >= f.total;
  }).length;

  const DirectionIcon = role === 'sender' ? ArrowUp : ArrowDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-5 w-full"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <DirectionIcon className="w-5 h-5 text-brand-500" />
            {role === 'sender' ? 'Sending' : 'Receiving'} Files
          </h3>
          <p className="text-xs font-mono text-slate-400">
            {completedFiles}/{entries.length} files complete
          </p>
        </div>
        <div className="text-right text-xs font-mono text-slate-500 dark:text-slate-400 space-y-1">
          <div className="flex items-center gap-1 justify-end">
            <HardDrive className="w-3 h-3" />
            {formatBytes(doneBytes)} / {formatBytes(totalBytes)}
          </div>
          {avgSpeed > 0 && (
            <div className="flex items-center gap-1 justify-end text-brand-500">
              <DirectionIcon className="w-3 h-3" />
              {formatSpeed(avgSpeed)}
            </div>
          )}
          {maxEta > 0 && overallPercent < 100 && (
            <div className="flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" />
              ~{formatTime(maxEta)}
            </div>
          )}
        </div>
      </div>

      <ProgressBar
        value={overallPercent}
        label="Overall Progress"
        sublabel={overallPercent < 100 ? `${formatSpeed(avgSpeed)} ${maxEta > 0 ? `\u2022 ~${formatTime(maxEta)} remaining` : ''}` : ''}
        color="blue"
        showShimmer
      />

      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
        {entries.map(([id, file]) => {
          const sent = file.sent || file.received || 0;
          const pct = file.total > 0 ? (sent / file.total) * 100 : 0;
          return (
            <ProgressBar
              key={id}
              value={pct}
              label={file.name}
              sublabel={pct < 100 ? `${formatSpeed(file.speed || 0)} \u2022 ~${formatTime(file.eta || 0)}` : ''}
              color="purple"
              showShimmer
            />
          );
        })}
      </div>

      {onCancel && overallPercent < 100 && (
        <div className="flex justify-center pt-2">
          <button onClick={onCancel} className="btn-danger">
            <XCircle className="w-4 h-4" />
            Cancel Transfer
          </button>
        </div>
      )}
    </motion.div>
  );
}
