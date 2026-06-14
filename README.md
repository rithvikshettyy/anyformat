# SocioVert 🚀

SocioVert is a powerful, production-ready, open-source file conversion and media utility platform built on **Next.js 14 (App Router)**. It provides a clean, modern, and high-performance user interface for handling dozens of operations on PDFs, images, documents, videos, audio, and archives.

Designed to run efficiently on self-hosted VPS instances, it leverages standard system utilities (like FFmpeg, LibreOffice, Tesseract OCR, Ghostscript, Pandoc, and ExifTool) to deliver desktop-grade file processing in a web interface.

---

## ✨ Features & Tools

### 📁 PDF Tools
*   **Merge PDFs:** Combine multiple PDFs into a single unified document.
*   **Split PDF:** Extract specific page ranges or split every page into individual files.
*   **Compress PDF:** Optimize and reduce file sizes with preset DPI profiles (Screen, Ebook, Printer).
*   **PDF to Word / Images:** Convert PDFs to editable `.docx` files or extract pages as high-quality images.
*   **Image to PDF:** Convert batches of images (`.jpg`, `.png`, `.webp`, `.gif`, `.tiff`) into a single PDF.
*   **OCR PDF:** Extract and overlay text onto scanned PDFs or images using Tesseract OCR.
*   **Rotate / Watermark:** Rotate pages or overlay custom text watermarks onto documents.

### 🖼️ Image Tools
*   **Format Converter:** Seamless conversion between `.jpg`, `.png`, `.webp`, `.avif`, `.svg`, and `.gif`.
*   **Compress & Resize:** Granular quality control and pixel-perfect resizing.
*   **Deep EXIF Purger:** Completely strip all metadata, camera info, and GPS coordinates from images and documents to preserve privacy.

### 📄 Document Tools
*   **Office to PDF:** Convert Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`), and OpenDocument files to PDF.
*   **PDF to Office:** Reverse conversion of PDFs back to editable Office formats.
*   **To LaTeX:** Convert `.docx` or `.pdf` files into structured, clean `.tex` code.
*   **OCR to Markdown:** Extract text from scanned pages directly into formatted Markdown (`.md`) files.

### 🎥 Video & Audio Tools
*   **Video Converter:** Convert between `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`, and `.gif`.
*   **Video Compressor:** Optimize video files using adjustable Constant Rate Factor (CRF) encoding.
*   **Audio Extractor & Converter:** Pull audio tracks from video files or convert between `.mp3`, `.wav`, `.flac`, `.aac`, and `.ogg`.
*   **Social Downloader:** Download video or audio links directly from YouTube, Reels, TikTok, and Shorts.

### 📦 Archive Tools
*   **Create Archive:** Bundle multiple files into `.zip`, `.tar`, or `.tar.gz` archives.
*   **Extract Archive:** Decompress and extract files from `.zip`, `.rar`, `.7z`, and `.tar` formats.

---

## 🛠️ Technology Stack

SocioVert is built on a modern, robust, and highly responsive frontend/backend architecture:

*   **Framework:** Next.js 14 (App Router) & React 18
*   **Language:** TypeScript
*   **Styling:** TailwindCSS
*   **Animations:** Framer Motion (for smooth transitions and interactive micro-animations)
*   **Document Engines:** `pdf-lib` (JS-native PDF manipulation) & `sharp` (high-performance image processor)
*   **Process Managers:** PM2 (for cluster-mode node environments)

---

## ⚙️ Local Development

### 1. Prerequisites
Ensure you have **Node.js 20+** installed on your system.

### 2. Installation
Clone the repository and install npm packages:
```bash
git clone https://github.com/rithvikshettyy/sociovert.git
cd sociovert
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env.local
```
Open `.env.local` and configure your keys:
*   `NEXTAUTH_SECRET`: Used for session encryption (generate with `openssl rand -base64 32`).
*   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Setup a Google OAuth Client at the Google Cloud Console.
*   `CLEANUP_API_KEY`: A secure key used to authorize scheduled automated file cleanup.

### 4. Running the App
Run the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 VPS / Server Deployment

SocioVert is designed to be hosted on a standard Ubuntu VPS. The repo contains a fully-automated bash installer.

### 1. Automated VPS Setup
To install all required packages, configure Node.js, install dependencies, build the application, and start the background processes, execute:
```bash
chmod +x scripts/setup-vps.sh
sudo ./scripts/setup-vps.sh
```

### 2. System Tools Installed
The script automatically configures the following system packages required for the file conversion pipelines:
*   `ffmpeg` — Video & Audio processing
*   `ghostscript` — PDF compression
*   `libreoffice` — Office-to-PDF conversion
*   `tesseract-ocr` — Optical Character Recognition
*   `imagemagick` — Raster image processing
*   `exiftool` — Deep metadata and EXIF stripping
*   `pandoc` — Document format compilation (LaTeX conversion)
*   `yt-dlp` — Social media downloads

### 3. File Lifecycle & Cron Cleanup
Processing files creates temporary data in `/tmp/sociovert`. To prevent disk overflow, a cron script runs every 15 minutes to purge files older than 30 minutes.

This is managed by `scripts/cleanup-cron.sh` which is automatically registered to crontab during setup.

### 4. Process Management
The application runs as a production service managed by PM2 under the configuration `ecosystem.config.js`. Use the following commands to check logs or manage the process:
```bash
# View real-time logs
pm2 logs sociovert

# Restart application
pm2 restart sociovert

# Monitor system resources
pm2 monit
```

---

## 📄 License
This project is private and proprietary. Unauthorized copying, distribution, or use is strictly prohibited.
