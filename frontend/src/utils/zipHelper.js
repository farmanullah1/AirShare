import JSZip from 'jszip';

export async function createZipFromFiles(filesWithPaths) {
  const zip = new JSZip();
  for (const { file, path } of filesWithPaths) {
    zip.file(path, file);
  }
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 3 },
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function downloadFile(file) {
  downloadBlob(file, file.name);
}
