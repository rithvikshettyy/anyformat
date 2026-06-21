// ─── Conversion Categories ───
export type ConversionCategory = 'image' | 'pdf' | 'document' | 'video' | 'audio' | 'archive' | 'utility';

export type ConversionAction =
  | 'convert'
  | 'merge'
  | 'split'
  | 'compress'
  | 'extract'
  | 'ocr'
  | 'rotate'
  | 'watermark'
  | 'resize'
  | 'download'
  | 'qr-generate'
  | 'bg-remove'
  | 'extract-palette'
  | 'word-count'
  | 'seo-generate'
  | 'shorten-link'
  | 'pdf-to-image'
  | 'pdf-to-excel'
  | 'ppt-to-pdf'
  | 'protect'
  | 'exif-purge'
  | 'crop'
  | 'upscale'
  | 'trim'
  | 'json-csv'
  | 'base64'
  | 'diff';

export type ConversionStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

// ─── Tool Definition ───
export interface ConversionTool {
  slug: string;
  name: string;
  description: string;
  category: ConversionCategory;
  inputFormats: string[];
  outputFormats: string[];
  icon: string;
  action: ConversionAction;
  multiFile?: boolean;
  options?: ToolOption[];
  requiresBinary?: boolean;
}

export interface ToolOption {
  name: string;
  label: string;
  type: 'number' | 'text' | 'select' | 'range' | 'password';
  defaultValue: string | number;
  min?: number;
  max?: number;
  step?: number;
  choices?: { label: string; value: string }[];
}

// ─── Conversion Result ───
export interface ConversionResult {
  id: string;
  fileName: string;
  fileSize: number;
  outputFormat: string;
  downloadUrl: string;
  expiresAt: number;
}

// ─── Conversion History ───
export interface HistoryEntry {
  id: string;
  toolSlug: string;
  toolName: string;
  inputFile: string;
  outputFile: string;
  inputSize: number;
  outputSize: number;
  status: ConversionStatus;
  timestamp: number;
}

// ─── API Response ───
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Category Metadata ───
export interface CategoryInfo {
  slug: ConversionCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  toolCount: number;
}
