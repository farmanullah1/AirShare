import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Clock, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QRCodeDisplay({ roomCode, baseUrl }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const joinUrl = `${baseUrl || window.location.origin}/receive?code=${roomCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      fallbackCopy(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      fallbackCopy(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const fallbackCopy = (text) => {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 flex flex-col items-center gap-4 w-full max-w-xs mx-auto"
    >
      <p className="text-sm font-body font-medium text-slate-500 dark:text-slate-400">
        Scan to connect
      </p>
      <div className="bg-white p-3 rounded-xl shadow-sm relative group">
        <QRCodeSVG
          value={joinUrl}
          size={180}
          level="M"
          includeMargin={false}
          className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px]"
        />
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-xl" />
      </div>

      {/* Room code - clickable to copy */}
      <button
        onClick={handleCopyCode}
        className="text-center group/code relative cursor-pointer"
        title="Click to copy room code"
      >
        <p className="font-mono text-4xl font-black tracking-[0.3em] text-slate-900 dark:text-white">
          <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent group-hover/code:from-brand-400 group-hover/code:to-accent-400 transition-all">
            {roomCode}
          </span>
        </p>
        {copiedCode && (
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-green-500 font-mono"
          >
            Copied!
          </motion.span>
        )}
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={handleCopyCode}
          className="btn-secondary text-xs gap-1.5 flex-1"
        >
          {copiedCode ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy Code
            </>
          )}
        </button>
        <button
          onClick={handleCopyLink}
          className="btn-secondary text-xs gap-1.5 flex-1"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5" />
              Copy Link
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Expires in 30 min
      </p>
    </motion.div>
  );
}
