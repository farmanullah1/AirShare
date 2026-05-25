import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, FolderOpen, FileUp, Send, Wifi, AlertTriangle, PartyPopper, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { useFileTransfer } from '../hooks/useFileTransfer';
import FileList from './FileList';
import QRCodeDisplay from './QRCodeDisplay';
import ConnectionStatus from './ConnectionStatus';
import TransferProgress from './TransferProgress';
import ThemeToggle from './ThemeToggle';
import { formatBytes } from '../utils/formatBytes';

export default function ShareZone() {
  const { state, dispatch, toast } = useApp();
  const [subState, setSubState] = useState('idle');
  const [files, setFiles] = useState([]);
  const [roomCode, setRoomCode] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const folderInputRef = useRef(null);
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
    setSubState('connected');
    dispatch({ type: 'PEER_CONNECTED' });
    toast('Device connected! Ready to send.', 'success');
  };
  rtcCallbacks.current.onClose = () => {
    if (subState === 'sending') {
      toast('Connection lost. Transfer interrupted.', 'error');
    }
    dispatch({ type: 'PEER_DISCONNECTED' });
  };

  useEffect(() => {
    if (!ws.connected || initRef.current) return;
    initRef.current = true;

    ws.emit('create-room', null, (res) => {
      if (res?.success) {
        setRoomCode(res.roomCode);
        dispatch({ type: 'SET_ROOM_CODE', code: res.roomCode });
      }
    });

    const cleanupJoined = ws.on('peer-joined', async () => {
      setSubState('connecting');
      await rtc.createOffer((signal) => {
        ws.emit('signal', signal);
      });
    });

    const cleanupSignal = ws.on('signal', (data) => {
      rtc.handleSignal(data);
    });

    const cleanupDisconnect = ws.on('peer-disconnected', () => {
      toast('Peer disconnected.', 'warning');
      dispatch({ type: 'PEER_DISCONNECTED' });
      setSubState(files.length > 0 ? 'waiting' : 'idle');
    });

    return () => {
      cleanupJoined?.();
      cleanupSignal?.();
      cleanupDisconnect?.();
    };
  }, [ws.connected]);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file, i) => ({
      id: `f_${Date.now()}_${i}`,
      file,
      path: file.path || file.webkitRelativePath || file.name,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    if (roomCode) setSubState('waiting');
  }, [roomCode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    multiple: true,
  });

  const handleFolderSelect = (e) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const newFiles = Array.from(fileList).map((file, i) => ({
      id: `folder_${Date.now()}_${i}`,
      file,
      path: file.webkitRelativePath || file.name,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    if (roomCode) setSubState('waiting');
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      if (next.length === 0 && subState === 'waiting') setSubState('idle');
      return next;
    });
  };

  const handleSend = async () => {
    setSubState('sending');
    dispatch({ type: 'TRANSFER_START' });
    await fileTransfer.sendFiles(
      files.map(f => ({ file: f.file, path: f.path })),
      () => {
        setSubState('done');
        dispatch({ type: 'TRANSFER_DONE' });
        toast('All files sent successfully!', 'success');
      }
    );
  };

  const handleBack = () => {
    if (files.length > 0 || subState !== 'idle') {
      setShowConfirm(true);
    } else {
      rtc.close();
      dispatch({ type: 'RESET' });
    }
  };

  const confirmBack = () => {
    rtc.close();
    setShowConfirm(false);
    dispatch({ type: 'RESET' });
  };

  const totalSize = files.reduce((sum, f) => sum + (f.file?.size || 0), 0);
  const isLargeTransfer = totalSize > 500 * 1024 * 1024;

  const connectionStatus = subState === 'sending' ? 'transferring'
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
          Share Files
        </h1>

        {/* Sending state */}
        {subState === 'sending' && (
          <TransferProgress
            files={fileTransfer.sendProgress}
            role="sender"
            onCancel={() => {
              fileTransfer.cancelSend();
              setSubState('connected');
              dispatch({ type: 'TRANSFER_DONE' });
            }}
          />
        )}

        {/* Done state with celebration */}
        {subState === 'done' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 text-center space-y-5 relative overflow-hidden"
          >
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#0ea5e9', '#8b5cf6', '#22c55e', '#f59e0b', '#ec4899'][i % 5],
                  }}
                  initial={{ top: '50%', opacity: 1, scale: 0 }}
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

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
            >
              <PartyPopper className="w-8 h-8 text-green-500" />
            </motion.div>
            <h2 className="text-xl font-display font-bold text-green-500">Transfer Complete!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              All {files.length} file{files.length !== 1 ? 's' : ''} sent successfully.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => { setFiles([]); setSubState('idle'); }} className="btn-primary">
                <RotateCcw className="w-4 h-4" />
                Send More Files
              </button>
            </div>
          </motion.div>
        )}

        {/* Idle / Waiting / Connected states */}
        {['idle', 'waiting', 'connecting', 'connected'].includes(subState) && (
          <>
            {/* Drop zone */}
            <motion.div
              {...getRootProps()}
              animate={isDragActive ? { scale: 1.02 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`glass-card p-8 border-2 border-dashed transition-all duration-300 cursor-pointer text-center relative overflow-hidden ${
                isDragActive
                  ? 'border-brand-400 drop-zone-active'
                  : 'border-slate-300 dark:border-slate-600 hover:border-brand-400/50 hover:shadow-lg'
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive && (
                <div className="absolute inset-0 bg-brand-500/5 dark:bg-brand-500/10 pointer-events-none" />
              )}
              <div className="space-y-3 relative z-10">
                <motion.div
                  className="w-16 h-16 mx-auto rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center"
                  animate={isDragActive ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <FileUp className={`w-8 h-8 ${isDragActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`} />
                </motion.div>
                <p className="text-lg font-display font-bold text-slate-700 dark:text-slate-200">
                  {isDragActive ? 'Drop to add files' : 'Drop files or folders here'}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  Images, videos, documents, archives &mdash; any file type
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); }}
                    className="btn-primary text-xs"
                  >
                    <FileUp className="w-4 h-4" />
                    Browse Files
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                    className="btn-secondary text-xs"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Browse Folder
                  </button>
                </div>
              </div>
            </motion.div>
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              multiple
              onChange={handleFolderSelect}
              className="hidden"
            />

            {/* Large file warning */}
            {isLargeTransfer && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/50">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Large transfer detected ({formatBytes(totalSize)}). Make sure both devices stay on the same WiFi network and keep the browser tab open.
                </p>
              </div>
            )}

            {/* File list */}
            <FileList
              files={files}
              onRemove={removeFile}
              disabled={subState === 'sending'}
            />

            {/* QR code + room code */}
            {roomCode && files.length > 0 && (
              <QRCodeDisplay roomCode={roomCode} />
            )}

            {/* Waiting indicator */}
            {subState === 'waiting' && roomCode && (
              <div className="text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                  <Wifi className="w-4 h-4 animate-pulse" />
                  Waiting for someone to join&hellip;
                </p>
              </div>
            )}

            {/* Connected — Send button */}
            {subState === 'connected' && files.length > 0 && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center"
              >
                <button onClick={handleSend} className="btn-primary text-base px-8">
                  <Send className="w-5 h-5" />
                  Send Now
                </button>
              </motion.div>
            )}
          </>
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
