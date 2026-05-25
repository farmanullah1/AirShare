import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Clock } from 'lucide-react';

export default function QRCodeDisplay({ roomCode, baseUrl }) {
  const [copied, setCopied] = useState(false);
  const joinUrl = `${baseUrl || window.location.origin}/receive?code=${roomCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = joinUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
      <p className="text-sm font-body font-medium text-slate-500 dark:text-slate-400">
        Scan to connect
      </p>
      <div className="bg-white p-3 rounded-xl shadow-sm">
        <QRCodeSVG
          value={joinUrl}
          size={180}
          level="M"
          includeMargin={false}
          className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px]"
        />
      </div>
      <div className="text-center">
        <p className="font-mono text-4xl font-black tracking-[0.3em] text-slate-900 dark:text-white">
          <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
            {roomCode}
          </span>
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="btn-secondary text-xs gap-1.5"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy Link
          </>
        )}
      </button>
      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Expires in 30 min
      </p>
    </div>
  );
}
