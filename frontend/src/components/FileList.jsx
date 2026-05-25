import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Film, Music, FileText, Archive, Code, File, BarChart2 } from 'lucide-react';
import { formatBytes } from '../utils/formatBytes';

const fileTypeConfig = {
  image:   { icon: Image,    color: 'text-pink-500',   bg: 'bg-pink-50 dark:bg-pink-900/20' },
  video:   { icon: Film,     color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  audio:   { icon: Music,    color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
  pdf:     { icon: FileText, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  archive: { icon: Archive,  color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  code:    { icon: Code,     color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  sheet:   { icon: BarChart2,color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  default: { icon: File,     color: 'text-slate-500',  bg: 'bg-slate-50 dark:bg-slate-800/50' },
};

function getFileCategory(fileName, mimeType = '') {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  if (['jpg','jpeg','png','gif','webp','svg','bmp','ico','tiff'].includes(ext) || mimeType.startsWith('image/')) return 'image';
  if (['mp4','mov','avi','mkv','webm','flv','wmv'].includes(ext) || mimeType.startsWith('video/')) return 'video';
  if (['mp3','wav','aac','flac','ogg','wma','m4a'].includes(ext) || mimeType.startsWith('audio/')) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['zip','rar','7z','tar','gz','bz2'].includes(ext)) return 'archive';
  if (['js','ts','jsx','tsx','py','java','cpp','c','html','css','json','xml','yaml','yml','sh','rb','go','rs'].includes(ext)) return 'code';
  if (['xls','xlsx','csv'].includes(ext)) return 'sheet';
  return 'default';
}

function FileIcon({ fileName, mimeType }) {
  const category = getFileCategory(fileName, mimeType);
  const config = fileTypeConfig[category];
  const Icon = config.icon;
  return (
    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${config.color}`} />
    </div>
  );
}

function FileThumbnail({ file }) {
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    if (!file || !file.type?.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    const url = URL.createObjectURL(file);
    setThumb(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!thumb) return null;
  return (
    <img
      src={thumb}
      alt=""
      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-200/50 dark:border-slate-700/50"
    />
  );
}

export default function FileList({ files = [], onRemove, disabled = false }) {
  const totalSize = files.reduce((sum, f) => sum + (f.file?.size || 0), 0);

  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
        <AnimatePresence>
          {files.map((item, i) => {
            const id = item.id || `file-${i}`;
            const fileName = item.file?.name || item.path || 'Unknown';
            const isImage = item.file?.type?.startsWith('image/');
            return (
              <motion.div
                key={id}
                layoutId={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 group hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors"
              >
                {isImage ? (
                  <FileThumbnail file={item.file} />
                ) : (
                  <FileIcon fileName={fileName} mimeType={item.file?.type} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-200 truncate">
                    {item.path || fileName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    {formatBytes(item.file?.size || 0)}
                  </p>
                </div>
                {!disabled && onRemove && (
                  <button
                    onClick={() => onRemove(id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    aria-label={`Remove ${fileName}`}
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
