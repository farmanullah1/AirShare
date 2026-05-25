import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getFileIcon } from '../utils/fileChunker';
import { formatBytes } from '../utils/formatBytes';

export default function FileList({ files = [], onRemove, disabled = false }) {
  const totalSize = files.reduce((sum, f) => sum + (f.file?.size || 0), 0);

  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence>
          {files.map((item, i) => {
            const id = item.id || `file-${i}`;
            return (
              <motion.div
                key={id}
                layoutId={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 group"
              >
                <span className="text-xl flex-shrink-0" role="img" aria-label="file type">
                  {getFileIcon(item.file?.name || item.path || '')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-200 truncate">
                    {item.path || item.file?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    {formatBytes(item.file?.size || 0)}
                  </p>
                </div>
                {!disabled && onRemove && (
                  <button
                    onClick={() => onRemove(id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    aria-label={`Remove ${item.file?.name}`}
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <p className="text-xs font-mono text-slate-400 dark:text-slate-500 text-center pt-1">
        {files.length} file{files.length !== 1 ? 's' : ''} &bull; Total: {formatBytes(totalSize)}
      </p>
    </div>
  );
}
