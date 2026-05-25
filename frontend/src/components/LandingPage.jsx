import { motion } from 'framer-motion';
import { Upload, Download, Lock, Zap, Cloud, Smartphone, Settings, Shield, Globe, FileUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ThemeToggle from './ThemeToggle';
import SettingsModal from './SettingsModal';
import { useState, useMemo } from 'react';

function TransferAnimation() {
  return (
    <div className="relative flex items-center justify-center gap-8 py-8" aria-hidden="true">
      {/* Phone */}
      <div className="w-16 h-24 rounded-xl border-2 border-brand-400/50 dark:border-brand-400/30 flex items-center justify-center bg-white/30 dark:bg-slate-800/30">
        <Smartphone className="w-6 h-6 text-brand-500 dark:text-brand-400" />
      </div>

      {/* Animated dots */}
      <div className="relative w-32 h-8 flex items-center">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full bg-brand-500 dark:bg-brand-400"
            animate={{
              x: [0, 128],
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 1, 0.5],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        <div className="absolute inset-0 border-b-2 border-dashed border-slate-300/50 dark:border-slate-600/50 top-1/2" />
      </div>

      {/* Laptop */}
      <div className="w-20 h-16 rounded-xl border-2 border-accent-400/50 dark:border-accent-400/30 flex items-center justify-center bg-white/30 dark:bg-slate-800/30">
        <svg className="w-8 h-6 text-accent-500 dark:text-accent-400" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="1" width="20" height="13" rx="2" />
          <path d="M0 16h24" />
        </svg>
      </div>
    </div>
  );
}

function Particles() {
  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      size: Math.random() * 3 + 2,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle bg-brand-400/30 dark:bg-brand-400/20"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

const features = [
  { icon: Shield, label: 'End-to-End Encrypted', color: 'text-green-500', desc: 'Files never touch a server' },
  { icon: Zap, label: 'Full Speed P2P', color: 'text-amber-500', desc: 'Direct device-to-device' },
  { icon: Cloud, label: 'No Cloud Storage', color: 'text-brand-500', desc: 'Zero data retention' },
  { icon: Globe, label: 'Cross Platform', color: 'text-accent-500', desc: 'Works on any modern browser' },
];

export default function LandingPage() {
  const { dispatch } = useApp();
  const [showSettings, setShowSettings] = useState(false);

  const isWebRTCSupported = typeof window !== 'undefined' &&
    'RTCPeerConnection' in window &&
    'createDataChannel' in RTCPeerConnection.prototype;

  if (!isWebRTCSupported) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="glass-card p-8 max-w-md text-center space-y-4">
          <h1 className="text-2xl font-display font-bold text-red-500">Browser Not Supported</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Your browser doesn&apos;t support WebRTC. Please use Chrome, Firefox, Safari 15+, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="relative min-h-dvh flex flex-col items-center justify-center p-6"
    >
      <Particles />

      <div className="relative z-10 w-full max-w-xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-2"
        >
          <h1 className="text-5xl sm:text-6xl font-display font-black">
            <span className="bg-gradient-to-r from-brand-500 via-accent-500 to-brand-500 bg-clip-text text-transparent">
              AirShare
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-body text-lg max-w-sm mx-auto">
            Drop files, share a code, transfer instantly.
            <span className="block text-sm mt-1 text-slate-400 dark:text-slate-500">No signup. No cloud. No limits.</span>
          </p>
        </motion.div>

        {/* Hero animation */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TransferAnimation />
        </motion.div>

        {/* CTA Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <button
            onClick={() => {
              dispatch({ type: 'SET_VIEW', view: 'share' });
              dispatch({ type: 'SET_ROLE', role: 'sender' });
            }}
            className="glass-card p-6 min-h-[200px] flex flex-col items-center justify-center gap-4
                       hover:-translate-y-1 hover:shadow-glow-blue transition-all duration-300
                       active:scale-95 cursor-pointer text-center group
                       focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-brand-500" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white">Share Files</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pick files &amp; get a code</p>
            </div>
          </button>

          <button
            onClick={() => {
              dispatch({ type: 'SET_VIEW', view: 'receive' });
              dispatch({ type: 'SET_ROLE', role: 'receiver' });
            }}
            className="glass-card p-6 min-h-[200px] flex flex-col items-center justify-center gap-4
                       hover:-translate-y-1 hover:shadow-glow-purple transition-all duration-300
                       active:scale-95 cursor-pointer text-center group
                       focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent-500/10 dark:bg-accent-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-8 h-8 text-accent-500" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white">Receive Files</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter room code to download</p>
            </div>
          </button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-3 overflow-x-auto pb-2"
        >
          {features.map(({ icon: Icon, label, color, desc }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-2 glass-card rounded-xl text-xs font-mono font-medium whitespace-nowrap group hover:scale-105 transition-transform"
              title={desc}
            >
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3"
        >
          <ThemeToggle />
          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl glass-card hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
          <span className="tag">v1.1.0</span>
        </motion.div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </motion.div>
  );
}
