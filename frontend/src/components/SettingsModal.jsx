import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Github, Settings2 } from 'lucide-react';

const defaultSettings = {
  turnUrl: '',
  turnUser: '',
  turnPass: '',
  usePublicTurn: true,
  chunkSize: 65536,
  autoAccept: true,
  autoDownload: true,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('airshare-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings) {
  localStorage.setItem('airshare-settings', JSON.stringify(settings));
}

export default function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="glass-card max-w-md w-full mx-4 p-6 space-y-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-brand-500" />
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Connection
              </h3>
              <label className="flex items-center justify-between">
                <span className="text-sm">Use public TURN servers</span>
                <button
                  onClick={() => update('usePublicTurn', !settings.usePublicTurn)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.usePublicTurn ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  role="switch"
                  aria-checked={settings.usePublicTurn}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    settings.usePublicTurn ? 'translate-x-5' : ''
                  }`} />
                </button>
              </label>
              {!settings.usePublicTurn && (
                <div className="space-y-2 pl-2 border-l-2 border-brand-500/30">
                  <input
                    type="text"
                    placeholder="TURN server URL"
                    value={settings.turnUrl}
                    onChange={(e) => update('turnUrl', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <input
                    type="text"
                    placeholder="Username"
                    value={settings.turnUser}
                    onChange={(e) => update('turnUser', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <input
                    type="password"
                    placeholder="Credential"
                    value={settings.turnPass}
                    onChange={(e) => update('turnPass', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Transfer
              </h3>
              <div>
                <span className="text-sm">Chunk size</span>
                <div className="flex gap-2 mt-1.5">
                  {[
                    { label: 'Small (16KB)', value: 16384 },
                    { label: 'Medium (64KB)', value: 65536 },
                    { label: 'Large (256KB)', value: 262144 },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update('chunkSize', opt.value)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                        settings.chunkSize === opt.value
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center justify-between">
                <span className="text-sm">Auto-accept incoming files</span>
                <button
                  onClick={() => update('autoAccept', !settings.autoAccept)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.autoAccept ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  role="switch"
                  aria-checked={settings.autoAccept}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    settings.autoAccept ? 'translate-x-5' : ''
                  }`} />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm">Auto-download files</span>
                <button
                  onClick={() => update('autoDownload', !settings.autoDownload)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings.autoDownload ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  role="switch"
                  aria-checked={settings.autoDownload}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    settings.autoDownload ? 'translate-x-5' : ''
                  }`} />
                </button>
              </label>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                About
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Shield className="w-4 h-4 text-green-500" />
                No files are stored on servers. All transfers are end-to-end.
              </div>
              <div className="flex items-center justify-between">
                <span className="tag">v1.0.0</span>
                <a
                  href="https://github.com/farmanullah1/AirShare"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-500 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
