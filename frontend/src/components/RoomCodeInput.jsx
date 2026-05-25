import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function RoomCodeInput({ onSubmit, loading = false, error = '' }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const [shake, setShake] = useState(false);

  const formatCode = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    if (digits.length > 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  const handleChange = (e) => {
    const formatted = formatCode(e.target.value);
    setValue(formatted);
    const digits = formatted.replace('-', '');
    if (digits.length === 6) {
      onSubmit?.(`${digits.slice(0, 3)}-${digits.slice(3)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const digits = value.replace('-', '');
      if (digits.length === 6) {
        onSubmit?.(`${digits.slice(0, 3)}-${digits.slice(3)}`);
      }
    }
  };

  if (error && !shake) {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      <motion.div
        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder="000-000"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={loading}
          className="input-field text-4xl tracking-[0.4em] font-black"
          autoFocus
          aria-label="Room code"
        />
      </motion.div>
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Connecting...
        </div>
      )}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 text-center font-body">
          {error}
        </p>
      )}
    </div>
  );
}
