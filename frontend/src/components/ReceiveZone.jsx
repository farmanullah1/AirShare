import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, QrCode, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import RoomCodeInput from './RoomCodeInput';
import ConnectionStatus from './ConnectionStatus';
import TransferProgress from './TransferProgress';
import ThemeToggle from './ThemeToggle';

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

        {/* Done state */}
        {subState === 'done' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 text-center space-y-4"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-display font-bold text-green-500">All Files Received!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Files have been downloaded to your device.
            </p>
            <button
              onClick={() => {
                rtc.close();
                dispatch({ type: 'RESET' });
              }}
              className="btn-primary"
            >
              Done
            </button>
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
