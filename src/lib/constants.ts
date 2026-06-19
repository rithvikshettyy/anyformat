import { ConversionCategory } from '@/types';

// ─── File Size Limits ───
export const MAX_FILE_SIZE: Record<ConversionCategory, number> = {
  image: 50 * 1024 * 1024,      // 50MB
  pdf: 50 * 1024 * 1024,        // 50MB
  document: 50 * 1024 * 1024,   // 50MB
  video: 50 * 1024 * 1024,      // 50MB
  audio: 50 * 1024 * 1024,      // 50MB
  archive: 50 * 1024 * 1024,    // 50MB
  utility: 50 * 1024 * 1024,    // 50MB
};

// ─── Temp Directory ───
export const TEMP_DIR = process.platform === 'win32'
  ? `${process.env.TEMP || 'C:\\Temp'}\\anyformat`
  : '/tmp/anyformat';

// ─── File Expiry ───
export const FILE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// ─── Supported Formats ───
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif', 'tiff', 'bmp'] as const;
export const PDF_FORMATS = ['pdf'] as const;
export const DOCUMENT_FORMATS = ['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'odt', 'ods', 'odp'] as const;
export const VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'gif'] as const;
export const AUDIO_FORMATS = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'] as const;
export const ARCHIVE_FORMATS = ['zip', 'rar', '7z', 'tar', 'gz', 'tar.gz'] as const;

// ─── Format Display Names ───
export const FORMAT_LABELS: Record<string, string> = {
  jpg: 'JPG', jpeg: 'JPEG', png: 'PNG', webp: 'WebP', avif: 'AVIF', svg: 'SVG',
  gif: 'GIF', tiff: 'TIFF', bmp: 'BMP',
  pdf: 'PDF',
  docx: 'DOCX', xlsx: 'XLSX', pptx: 'PPTX', doc: 'DOC', xls: 'XLS', ppt: 'PPT',
  odt: 'ODT', ods: 'ODS', odp: 'ODP',
  mp4: 'MP4', mov: 'MOV', avi: 'AVI', mkv: 'MKV', webm: 'WebM',
  mp3: 'MP3', wav: 'WAV', flac: 'FLAC', aac: 'AAC', ogg: 'OGG', m4a: 'M4A', wma: 'WMA',
  zip: 'ZIP', rar: 'RAR', '7z': '7Z', tar: 'TAR', gz: 'GZ', 'tar.gz': 'TAR.GZ',
};

// ─── MIME Types ───
export const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  avif: 'image/avif', svg: 'image/svg+xml', gif: 'image/gif', tiff: 'image/tiff', bmp: 'image/bmp',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska',
  webm: 'video/webm',
  mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', aac: 'audio/aac',
  ogg: 'audio/ogg', m4a: 'audio/mp4', wma: 'audio/x-ms-wma',
  zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar', gz: 'application/gzip',
};

// ─── Helper ───
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}
