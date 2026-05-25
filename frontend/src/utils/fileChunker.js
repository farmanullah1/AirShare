export const CHUNK_SIZE = 65536;

export async function* chunkFile(file) {
  let offset = 0;
  let chunkIndex = 0;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  while (offset < file.size) {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await slice.arrayBuffer();
    yield {
      index: chunkIndex,
      total: totalChunks,
      data: buffer,
      isLast: offset + CHUNK_SIZE >= file.size,
    };
    offset += CHUNK_SIZE;
    chunkIndex++;
  }
}

export function reassembleFile(chunks, fileName, fileType) {
  const sorted = chunks.sort((a, b) => a.index - b.index);
  const blob = new Blob(sorted.map(c => c.data), { type: fileType || 'application/octet-stream' });
  return new File([blob], fileName, { type: fileType });
}

export function getFileIcon(fileName, mimeType = '') {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return '\uD83D\uDDBC\uFE0F';
  if (['mp4','mov','avi','mkv','webm'].includes(ext)) return '\uD83C\uDFAC';
  if (['mp3','wav','aac','flac','ogg'].includes(ext)) return '\uD83C\uDFB5';
  if (['pdf'].includes(ext)) return '\uD83D\uDCC4';
  if (['doc','docx'].includes(ext)) return '\uD83D\uDCDD';
  if (['xls','xlsx'].includes(ext)) return '\uD83D\uDCCA';
  if (['ppt','pptx'].includes(ext)) return '\uD83D\uDCD1';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return '\uD83D\uDDDC\uFE0F';
  if (['js','ts','jsx','tsx','py','java','cpp','c','html','css'].includes(ext)) return '\uD83D\uDCBB';
  if (mimeType.startsWith('image/')) return '\uD83D\uDDBC\uFE0F';
  if (mimeType.startsWith('video/')) return '\uD83C\uDFAC';
  if (mimeType.startsWith('audio/')) return '\uD83C\uDFB5';
  return '\uD83D\uDCC1';
}
