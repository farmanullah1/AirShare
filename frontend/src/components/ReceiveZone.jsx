import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, QrCode, CheckCircle2, Download, PartyPopper, File } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import RoomCodeInput from './RoomCodeInput';
import ConnectionStatus from './ConnectionStatus';
import TransferProgress from './TransferProgress';
import ThemeToggle from './ThemeToggle';
import { formatBytes } from '../utils/formatBytes';

export default function ReceiveZone() {
  const { state, dispatch, toast } = useApp();
  const [subState, setSubState] = useState('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const initRef = useRef(false);

  const ws = useWebSocket();

  const rtcCallbacks = useRef({ onMessage: null, onOpen: null, onClose: null });

  const rtc = useWebRTC({
    onMessage: (data) => rtcCallbacks.current.onMessage?.(data),
    onOpen: () => rtcCallbacks.current.onOpen?.(),
    onClose: () => rtcCallbacks.current.onClose?.(),
  });

  const fileTransfer = useFileTransfer(rtc.sendRaw);

  rtcCallbacks.current.onMessage = fileTransfer.handleIncomingData;
  rtcCallbacks.current.onOpen = () => {
    setSubState('receiving');
    dispatch({ type: 'PEER_CONNECTED' });
    toast('Connected! Waiting for files...', 'success');
  };
  rtcCallbacks.current.onClose = () => {
    dispatch({ type: 'PEER_DISCONNECTED' });
    if (subState === 'receiving') {
      toast('Connection lost. Transfer interrupted.', 'error');
    }
  };

  const signalHandlerRef = useRef(null);

  useEffect(() => {
    if (!ws.connected || initRef.current) return;
    initRef.current = true;

    signalHandlerRef.current = ws.on('signal', async (data) => {
      if (data.type === 'offer') {
        await rtc.createAnswer(data.sdp, (signal) => {
          ws.emit('signal', signal);
        });
      } else {
        rtc.handleSignal(data);
      }
    });

    ws.on('peer-disconnected', () => {
      toast('Sender disconnected.', 'warning');
      dispatch({ type: 'PEER_DISCONNECTED' });
    });
  }, [ws.connected]);

  const handleSubmit = useCallback((code) => {
    if (loading) return;
    setLoading(true);
    setError('');

    ws.emit('join-room', { roomCode: code }, (res) => {
      setLoading(false);
      if (res?.success) {
        dispatch({ type: 'SET_ROOM_CODE', code });
        setSubState('connecting');
        toast('Joined room! Establishing connection...', 'info');
      } else {
        setError(res?.error || 'Room not found. Double-check the code or ask the sender to create a new room.');
      }
    });
  }, [ws, dispatch, toast, loading]);

  const handleBack = () => {
    if (subState !== 'input') {
      setShowConfirm(true);
    } else {
      dispatch({ type: 'RESET' });
    }
  };

  const confirmBack = () => {
    rtc.close();
    setShowConfirm(false);
    dispatch({ type: 'RESET' });
  };

  const receivingEntries = Object.entries(fileTransfer.receiveProgress);
  const allDone = receivingEntries.length > 0 &&
    receivingEntries.every(([, f]) => f.received >= f.total && f.total > 0);

  useEffect(() => {
    if (allDone && subState === 'receiving') {
      setSubState('done');
      dispatch({ type: 'TRANSFER_DONE' });
      toast('All files received!', 'success');
    }
  }, [allDone, subState]);

  const connectionStatus = subState === 'receiving' ? 'transferring'
    : state.peerConnected ? 'connected'
    : subState === 'connecting' ? 'connecting'
    : 'disconnected';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="min-h-dvh p-4 sm:p-6"
    >
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="btn-secondary py-2 px-3 text-xs" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <ConnectionStatus status={connectionStatus} />
          <ThemeToggle />
        </div>

        <h1 className="text-2xl font-display font-bold text-center">
          Receive Files
        </h1>

        {/* Input state */}
        {subState === 'input' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card p-8 space-y-6 text-center"
          >
            <div className="space-y-2">
              <p className="text-lg font-display font-bold text-slate-700 dark:text-slate-200">
                Enter the 6-digit code
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                shown on the sender&apos;s screen
              </p>
            </div>

            <RoomCodeInput onSubmit={handleSubmit} loading={loading} error={error} />

            <div className="flex items-center gap-3 justify-center">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <button
              onClick={() => toast('Camera QR scanning coming soon!', 'info')}
              className="btn-secondary"
            >
              <QrCode className="w-4 h-4" />
              Scan QR Code
            </button>
          </motion.div>
        )}

        {/* Connecting state */}
        {subState === 'connecting' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card p-8 text-center space-y-4"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-brand-500/10 flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-lg font-display font-bold">Establishing connection&hellip;</p>
            <p className="text-sm text-slate-400">Setting up secure peer-to-peer link</p>
          </motion.div>
        )}

        {/* Receiving state */}
        {subState === 'receiving' && (
          <TransferProgress
            files={fileTransfer.receiveProgress}
            role="receiver"
          />
        )}

        {/* Done state with received files list */}
        {subState === 'done' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 space-y-5 relative overflow-hidden"
          >
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899'][i % 5],
                  }}
                  initial={{ top: '40%', opacity: 1, scale: 0 }}
                  animate={{
                    top: `${-10 - Math.random() * 20}%`,
                    opacity: [1, 1, 0],
                    scale: [0, 1.5, 0.5],
                    x: (Math.random() - 0.5) * 200,
                  }}
                  transition={{ duration: 1.5, delay: i * 0.05, ease: 'easeOut' }}
                />
              ))}
            </div>

            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
              >
                <PartyPopper className="w-8 h-8 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-display font-bold text-green-500">All Files Received!</h2>
            </div>

            {/* Received files list */}
            {fileTransfer.receivedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {fileTransfer.receivedFiles.length} file{fileTransfer.receivedFiles.length !== 1 ? 's' : ''} received
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {fileTransfer.receivedFiles.map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                        <File className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-slate-700 dark:text-slate-200 truncate">{f.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{formatBytes(f.size)}</p>
                      </div>
                      <a
                        href={f.url}
                        download={f.name}
                        className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                        title="Download again"
                      >
                        <Download className="w-4 h-4 text-brand-500" />
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  rtc.close();
                  dispatch({ type: 'RESET' });
                }}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-6 max-w-sm w-full space-y-4 text-center"
            >
              <h3 className="text-lg font-display font-bold">Are you sure?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your current session will end.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={confirmBack} className="btn-danger">
                  Yes, go back
                </button>
                <button onClick={() => setShowConfirm(false)} className="btn-secondary">
                  Keep going
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
