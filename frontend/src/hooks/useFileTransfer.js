import { useState, useCallback, useRef } from 'react';
import { chunkFile, CHUNK_SIZE, reassembleFile } from '../utils/fileChunker';
import { downloadFile, createZipFromFiles, downloadBlob } from '../utils/zipHelper';

export const MSG_TYPE = {
  META: 'META',
  CHUNK: 'CHUNK',
  DONE: 'DONE',
  BATCH_START: 'BATCH_START',
  BATCH_END: 'BATCH_END',
  CANCEL: 'CANCEL',
};

export function useFileTransfer(sendRaw) {
  const [sendProgress, setSendProgress] = useState({});
  const [receiveProgress, setReceiveProgress] = useState({});
  const [receiving, setReceiving] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const receiveBuffers = useRef({});
  const receiveFileMeta = useRef({});
  const cancelRef = useRef(false);

  const sendFiles = useCallback(async (filesWithPaths, onDone) => {
    cancelRef.current = false;

    const batch = filesWithPaths.map((f, i) => ({
      id: `file_${i}_${Date.now()}`,
      name: f.path || f.file.name,
      size: f.file.size,
      type: f.file.type,
      file: f.file,
    }));

    sendRaw(JSON.stringify({
      msgType: MSG_TYPE.BATCH_START,
      files: batch.map(({ id, name, size, type }) => ({ id, name, size, type })),
    }));

    for (const item of batch) {
      if (cancelRef.current) break;

      setSendProgress(prev => ({
        ...prev,
        [item.id]: { name: item.name, sent: 0, total: item.size, speed: 0, eta: 0 },
      }));

      const startTime = Date.now();
      let sentBytes = 0;

      for await (const chunk of chunkFile(item.file)) {
        if (cancelRef.current) break;

        sendRaw(JSON.stringify({
          msgType: MSG_TYPE.CHUNK,
          fileId: item.id,
          index: chunk.index,
          total: chunk.total,
          size: chunk.data.byteLength,
        }));

        await sendRaw(chunk.data);

        sentBytes += chunk.data.byteLength;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = sentBytes / elapsed;
        const eta = (item.size - sentBytes) / speed;

        setSendProgress(prev => ({
          ...prev,
          [item.id]: { name: item.name, sent: sentBytes, total: item.size, speed, eta },
        }));
      }

      sendRaw(JSON.stringify({ msgType: MSG_TYPE.DONE, fileId: item.id }));
    }

    sendRaw(JSON.stringify({ msgType: MSG_TYPE.BATCH_END }));
    onDone?.();
  }, [sendRaw]);

  const cancelSend = useCallback(() => {
    cancelRef.current = true;
    sendRaw(JSON.stringify({ msgType: MSG_TYPE.CANCEL }));
  }, [sendRaw]);

  const pendingHeader = useRef(null);

  const handleIncomingData = useCallback((data) => {
    if (typeof data === 'string') {
      const msg = JSON.parse(data);

      if (msg.msgType === MSG_TYPE.BATCH_START) {
        setReceiving(msg.files);
        msg.files.forEach(f => {
          receiveBuffers.current[f.id] = [];
          receiveFileMeta.current[f.id] = f;
          setReceiveProgress(prev => ({
            ...prev,
            [f.id]: { name: f.name, received: 0, total: f.size, speed: 0, eta: 0 },
          }));
        });
        return;
      }

      if (msg.msgType === MSG_TYPE.CHUNK) {
        pendingHeader.current = msg;
        return;
      }

      if (msg.msgType === MSG_TYPE.DONE) {
        const meta = receiveFileMeta.current[msg.fileId];
        const chunks = receiveBuffers.current[msg.fileId];
        if (meta && chunks) {
          const file = reassembleFile(chunks, meta.name, meta.type);
          downloadFile(file);
          const url = URL.createObjectURL(file);
          setReceivedFiles(prev => [...prev, { id: msg.fileId, name: meta.name, size: meta.size, type: meta.type, url }]);
          delete receiveBuffers.current[msg.fileId];
          delete receiveFileMeta.current[msg.fileId];
        }
        return;
      }

      if (msg.msgType === MSG_TYPE.BATCH_END) {
        setReceiving([]);
        return;
      }

      if (msg.msgType === MSG_TYPE.CANCEL) {
        setReceiving([]);
        setReceiveProgress({});
        return;
      }
    }

    if (data instanceof ArrayBuffer && pendingHeader.current) {
      const hdr = pendingHeader.current;
      pendingHeader.current = null;

      receiveBuffers.current[hdr.fileId]?.push({ index: hdr.index, data });

      const meta = receiveFileMeta.current[hdr.fileId];
      if (meta) {
        setReceiveProgress(prev => {
          const current = prev[hdr.fileId];
          const received = (current?.received || 0) + hdr.size;
          return {
            ...prev,
            [hdr.fileId]: {
              ...current,
              received,
            },
          };
        });
      }
    }
  }, []);

  return {
    sendFiles,
    cancelSend,
    handleIncomingData,
    sendProgress,
    receiveProgress,
    receiving,
    receivedFiles,
  };
}
