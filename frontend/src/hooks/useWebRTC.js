import { useRef, useCallback, useState } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export function useWebRTC({ onMessage, onOpen, onClose }) {
  const pcRef = useRef(null);
  const channelRef = useRef(null);
  const [iceState, setIceState] = useState('new');

  const createConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
    });

    pc.oniceconnectionstatechange = () => {
      setIceState(pc.iceConnectionState);
      if (['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState)) {
        onClose?.();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [onClose]);

  const createOffer = useCallback(async (onSignal) => {
    const pc = createConnection();

    const channel = pc.createDataChannel('airshare', {
      ordered: true,
    });

    channel.binaryType = 'arraybuffer';
    channel.onopen = () => {
      console.log('[RTC] DataChannel open');
      onOpen?.();
    };
    channel.onmessage = (e) => onMessage?.(e.data);
    channel.onclose = () => onClose?.();
    channelRef.current = channel;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) onSignal({ type: 'candidate', candidate });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    onSignal({ type: 'offer', sdp: pc.localDescription });

    return pc;
  }, [createConnection, onMessage, onOpen, onClose]);

  const createAnswer = useCallback(async (offerSdp, onSignal) => {
    const pc = createConnection();

    pc.ondatachannel = (e) => {
      const channel = e.channel;
      channel.binaryType = 'arraybuffer';
      channel.onopen = () => {
        console.log('[RTC] DataChannel open (receiver)');
        onOpen?.();
      };
      channel.onmessage = (ev) => onMessage?.(ev.data);
      channel.onclose = () => onClose?.();
      channelRef.current = channel;
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) onSignal({ type: 'candidate', candidate });
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    onSignal({ type: 'answer', sdp: pc.localDescription });

    return pc;
  }, [createConnection, onMessage, onOpen, onClose]);

  const handleSignal = useCallback(async (data) => {
    const pc = pcRef.current;
    if (!pc) return;

    if (data.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === 'candidate') {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.warn('[RTC] ICE candidate error:', e);
      }
    }
  }, []);

  const sendRaw = useCallback((data) => {
    const ch = channelRef.current;
    if (ch?.readyState === 'open') {
      if (ch.bufferedAmount > 5 * 1024 * 1024) {
        return new Promise((resolve) => {
          const wait = setInterval(() => {
            if (ch.bufferedAmount < 1024 * 1024) {
              clearInterval(wait);
              ch.send(data);
              resolve();
            }
          }, 50);
        });
      }
      ch.send(data);
    }
  }, []);

  const close = useCallback(() => {
    channelRef.current?.close();
    pcRef.current?.close();
  }, []);

  return { createOffer, createAnswer, handleSignal, sendRaw, iceState, close };
}
