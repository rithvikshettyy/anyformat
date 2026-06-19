interface ToolSeoInfo {
  title: string;
  description: string;
  keywords: string[];
}

export const SEO_METADATA_REGISTRY: Record<string, ToolSeoInfo> = {
  // ── PDF Tools ──
  'pdf/merge': {
    title: 'Merge PDF Files Online Free - Combine PDF | AnyFormat',
    description: 'Combine multiple PDF files into a single document online. Free, secure, no registration or watermark. Safe self-hosted PDF merger.',
    keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'free pdf merger', 'combine pdf online'],
  },
  'pdf/split': {
    title: 'Split PDF Online Free - Extract PDF Pages | AnyFormat',
    description: 'Split PDF documents into separate pages or extract specific page ranges online. Free, safe, self-hosted PDF splitter tool.',
    keywords: ['split pdf', 'extract pdf pages', 'cut pdf file', 'free pdf splitter', 'split pdf online'],
  },
  'pdf/compress': {
    title: 'Compress PDF Online - Reduce PDF File Size | AnyFormat',
    description: 'Reduce PDF file size online while maintaining document quality. Compress PDFs for email attachments. Free, secure, self-hosted.',
    keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'free pdf compressor', 'compress pdf online'],
  },
  'pdf/pdf-to-word': {
    title: 'PDF to Word Converter Free Online — AnyFormat',
    description: 'Convert PDF to editable Word DOCX files free online. Safe, fast, no signup, no watermark. Perfect layout preservation.',
    keywords: ['pdf to word', 'pdf to docx', 'convert pdf to word', 'free pdf to word converter', 'pdf to editable word'],
  },
  'pdf/pdf-to-image': {
    title: 'Convert PDF to Image (JPG/PNG) Online Free | AnyFormat',
    description: 'Convert PDF pages to high-quality JPG or PNG images online. Free, secure, self-hosted converter tool.',
    keywords: ['pdf to image', 'pdf to jpg', 'pdf to png', 'convert pdf to jpg', 'pdf extraction'],
  },
  'pdf/image-to-pdf': {
    title: 'Convert JPG/PNG Images to PDF Online Free | AnyFormat',
    description: 'Convert JPG, PNG, WebP, and other images into a single PDF document. Free, easy, secure, no watermarks.',
    keywords: ['image to pdf', 'jpg to pdf', 'png to pdf', 'convert image to pdf', 'images to pdf'],
  },
  'pdf/ocr': {
    title: 'Free OCR PDF Online - Extract Text from Scanned PDFs | AnyFormat',
    description: 'Extract editable text from scanned PDF documents and images using advanced OCR. Free, secure, self-hosted text extractor.',
    keywords: ['ocr pdf', 'scanned pdf to text', 'extract text from pdf', 'free online ocr', 'image to text converter'],
  },
  'pdf/rotate': {
    title: 'Rotate PDF Pages Online Free - Turn PDF Pages | AnyFormat',
    description: 'Rotate PDF pages clockwise or counter-clockwise online. Flip specific pages or entire documents instantly. Free and secure.',
    keywords: ['rotate pdf', 'turn pdf page', 'flip pdf online', 'free pdf rotater', 'rotate pdf pages'],
  },
  'pdf/watermark': {
    title: 'Add Watermark to PDF Online Free | AnyFormat',
    description: 'Add text watermarks to your PDF pages online. Customize position, color, and text securely. No registration required.',
    keywords: ['watermark pdf', 'add watermark to pdf', 'pdf watermark tool', 'protect pdf online', 'free pdf watermarker'],
  },
  'pdf/pdf-to-excel': {
    title: 'PDF to Excel Converter Free Online — AnyFormat',
    description: 'Convert PDF documents to editable Excel XLSX spreadsheets online. Fast, secure, no watermarks, and no signup.',
    keywords: ['pdf to excel', 'pdf to xlsx', 'convert pdf to excel', 'free pdf to excel converter', 'pdf to spreadsheet'],
  },
  'pdf/ppt-to-pdf': {
    title: 'PowerPoint PPT to PDF Converter Free Online — AnyFormat',
    description: 'Convert PPT, PPTX, and ODP presentations to high-quality PDF files online. Secure, fast, self-hosted converter.',
    keywords: ['ppt to pdf', 'pptx to pdf', 'convert powerpoint to pdf', 'free ppt to pdf converter', 'convert presentation to pdf'],
  },
  'pdf/protect': {
    title: 'Protect PDF Online - Encrypt PDF with Password | AnyFormat',
    description: 'Encrypt and password-protect your PDF files online. Secure your sensitive documents using standard PDF encryption. Free and self-hosted.',
    keywords: ['protect pdf', 'encrypt pdf', 'password protect pdf', 'pdf lock', 'secure pdf file online'],
  },

  // ── Image Tools ──
  'image/convert': {
    title: 'Convert Image Formats Online Free - JPG, PNG, WebP, AVIF | AnyFormat',
    description: 'Convert between JPG, PNG, WebP, AVIF, SVG, and GIF formats online. Free, secure, self-hosted batch image converter.',
    keywords: ['image converter', 'convert image format', 'jpg to png', 'png to webp', 'avif converter', 'free image converter'],
  },
  'image/compress': {
    title: 'Compress Image Online - Reduce Image Size Free | AnyFormat',
    description: 'Reduce image file sizes (JPG, PNG, WebP) with adjustable quality compression. Fast, safe, self-hosted image optimizer.',
    keywords: ['compress image', 'reduce image size', 'optimize image', 'free image compressor', 'compress png', 'compress jpeg'],
  },
  'image/resize': {
    title: 'Resize Image Online Free - Change Image Dimensions | AnyFormat',
    description: 'Resize images to exact pixel dimensions or percentage scaling. Free, secure, self-hosted image resizer.',
    keywords: ['resize image', 'image resizer', 'change image resolution', 'crop image online', 'free image scale'],
  },
  'image/exif-purge': {
    title: 'Deep EXIF Purger Online Free - Strip Image Metadata | AnyFormat',
    description: 'Remove EXIF, GPS location, camera data, and metadata from images and documents to protect your privacy. Safe, secure, offline-capable.',
    keywords: ['exif purger', 'remove image metadata', 'strip gps from photo', 'remove exif data', 'metadata remover'],
  },
  'image/bg-removal': {
    title: 'Remove Image Background Online Free - AI Bg Remover | AnyFormat',
    description: 'Remove background from images automatically using advanced AI. Export high-quality transparent PNGs. Free, secure, no watermarks.',
    keywords: ['remove background', 'bg removal', 'transparent background', 'free bg remover', 'ai background removal'],
  },
  'image/color-palette': {
    title: 'Color Palette Extractor Free - Extract Colors from Image | AnyFormat',
    description: 'Extract dominant color palettes and hex codes from any image online. Free, instant, self-hosted design tool.',
    keywords: ['color palette extractor', 'extract color from image', 'image color picker', 'get palette from photo', 'hex code finder'],
  },
  'image/qr-generator': {
    title: 'QR Code Generator Free Online - Create Custom QRs | AnyFormat',
    description: 'Generate high-quality custom QR codes for URLs, text, Wi-Fi networks, and contacts. Free, secure, no expiry.',
    keywords: ['qr code generator', 'create qr code', 'free qr maker', 'custom qr code', 'qr generator online'],
  },

  // ── Document Tools ──
  'document/to-pdf': {
    title: 'Convert Word/Excel/PPT to PDF Online Free | AnyFormat',
    description: 'Convert Microsoft Office documents (DOCX, XLSX, PPTX) to high-quality PDF files. Free, secure, self-hosted LibreOffice converter.',
    keywords: ['document to pdf', 'docx to pdf', 'word to pdf', 'convert docx to pdf', 'xlsx to pdf'],
  },
  'document/from-pdf': {
    title: 'Convert PDF to Word/Excel/PPT Online Free | AnyFormat',
    description: 'Convert PDF documents back to Microsoft Word, Excel, and PowerPoint formats. Free, easy, secure, self-hosted.',
    keywords: ['pdf to docx', 'pdf to word', 'pdf to excel', 'pdf to powerpoint', 'convert pdf to document'],
  },
  'document/to-latex': {
    title: 'Convert DOCX/PDF to LaTeX Code Online Free | AnyFormat',
    description: 'Transform Word documents and PDF text files into clean, structured LaTeX code (.tex). Free, secure, self-hosted document converter.',
    keywords: ['convert to latex', 'word to latex', 'pdf to latex', 'docx to tex', 'latex converter online'],
  },
  'document/ocr-to-md': {
    title: 'Convert Scan/PDF to Markdown Online Free | AnyFormat',
    description: 'Extract text from scanned PDFs and images and convert it into structured Markdown formatting. Free, safe, self-hosted OCR.',
    keywords: ['ocr to markdown', 'pdf to markdown', 'image to markdown', 'extract text to md', 'scan to markdown'],
  },
  'document/word-counter': {
    title: 'Word Counter Online - Count Words & Characters | AnyFormat',
    description: 'Count words, characters, lines, and paragraphs in typed text or uploaded files (PDF, DOCX, TXT). Free, instant, privacy-focused.',
    keywords: ['word counter', 'character counter', 'count words in pdf', 'word count tool', 'reading time calculator'],
  },

  // ── Video Tools ──
  'video/convert': {
    title: 'Convert Video Formats Online Free - MP4, WebM, GIF | AnyFormat',
    description: 'Convert between MP4, WebM, MOV, AVI, and animated GIF formats. Secure, self-hosted video converter with no size limits.',
    keywords: ['video converter', 'convert mp4 to webm', 'mov to mp4', 'video format changer', 'mp4 to gif'],
  },
  'video/compress': {
    title: 'Compress Video Online Free - Reduce Video Size | AnyFormat',
    description: 'Reduce video file size (MP4, WebM) with customizable quality control. Secure, self-hosted compression that runs locally.',
    keywords: ['compress video', 'reduce video size', 'shrink mp4', 'free video compressor', 'optimize video online'],
  },
  'video/extract-audio': {
    title: 'Extract Audio from Video Online Free - MP3/WAV | AnyFormat',
    description: 'Extract high-quality audio tracks from MP4, MOV, WebM, and other video files into MP3, WAV, or FLAC. Free, secure, fast.',
    keywords: ['extract audio from video', 'video to mp3', 'mp4 to mp3', 'convert video to audio', 'audio extractor'],
  },
  'video/social-download': {
    title: 'Social Video Downloader Free - Download Reels/TikToks | AnyFormat',
    description: 'Download videos and audio tracks from YouTube, Instagram Reels, TikTok, and YouTube Shorts. Free, secure, self-hosted.',
    keywords: ['social downloader', 'download reels', 'tiktok downloader', 'youtube shorts downloader', 'download video online'],
  },

  // ── Audio Tools ──
  'audio/convert': {
    title: 'Convert Audio Formats Online Free - MP3, WAV, FLAC | AnyFormat',
    description: 'Convert between MP3, WAV, FLAC, AAC, OGG, and M4A audio files online. Free, safe, self-hosted converter.',
    keywords: ['audio converter', 'convert mp3 to wav', 'flac to mp3', 'wav to mp3', 'audio converter online'],
  },

  // ── Archive Tools ──
  'archive/create': {
    title: 'Create ZIP/TAR Archive Online Free - Compress Files | AnyFormat',
    description: 'Compress multiple files and folders into a secure ZIP or TAR archive online. Free, self-hosted, no registration.',
    keywords: ['create zip file', 'make zip online', 'compress files to zip', 'tar creator', 'free file archiver'],
  },
  'archive/extract': {
    title: 'Extract ZIP/RAR/7Z Archives Online Free | AnyFormat',
    description: 'Unpack and extract files from ZIP, RAR, 7Z, and TAR archives online securely. Free, fast, self-hosted file extractor.',
    keywords: ['extract zip file', 'rar extractor', 'unzip files online', '7z extractor', 'free archive unpacker'],
  },

  // ── Utility Tools ──
  'utility/seo-generator': {
    title: 'SEO Meta Tag & robots.txt Generator Free | AnyFormat',
    description: 'Generate optimized HTML meta tags, OpenGraph properties, Twitter cards, and robots.txt files for your website. Free developer utility.',
    keywords: ['seo generator', 'meta tag generator', 'robots.txt creator', 'generate meta tags', 'seo tool'],
  },
  'utility/link-shortener': {
    title: 'Self-Hosted Link Shortener Free - Short URLs | AnyFormat',
    description: 'Create custom, short aliases for long URLs securely. Lightweight, self-hosted link shortener utility with instant redirection.',
    keywords: ['link shortener', 'short url generator', 'custom alias link', 'free URL shortener', 'shorten links'],
  },
};

export function getToolSeoMetadata(category: string, toolSlug: string): ToolSeoInfo | null {
  const key = `${category}/${toolSlug}`;
  return SEO_METADATA_REGISTRY[key] || null;
}
