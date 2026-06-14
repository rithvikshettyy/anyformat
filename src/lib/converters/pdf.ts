import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { execSync } from 'child_process';
import { saveTempBuffer, generateFileId, getTempPath, ensureTempDir } from '../file-utils';

/**
 * Merge multiple PDFs into one
 */
export async function mergePdfs(
  inputPaths: string[]
): Promise<{ filePath: string; fileId: string }> {
  const merged = await PDFDocument.create();

  for (const path of inputPaths) {
    const bytes = await readFile(path);
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const buffer = Buffer.from(await merged.save());
  return saveTempBuffer(buffer, 'pdf');
}

/**
 * Split PDF by page range (e.g., "1-3" or "1,3,5")
 */
export async function splitPdf(
  inputPath: string,
  pageRange: string
): Promise<{ filePath: string; fileId: string }> {
  const bytes = await readFile(inputPath);
  const srcDoc = await PDFDocument.load(bytes);
  const newDoc = await PDFDocument.create();
  const totalPages = srcDoc.getPageCount();

  const pageIndices = parsePageRange(pageRange, totalPages);
  const pages = await newDoc.copyPages(srcDoc, pageIndices);
  pages.forEach((page) => newDoc.addPage(page));

  const buffer = Buffer.from(await newDoc.save());
  return saveTempBuffer(buffer, 'pdf');
}

/**
 * Compress a PDF using Ghostscript
 */
export async function compressPdf(
  inputPath: string,
  quality: string = 'ebook'
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const outputPath = getTempPath(fileId, 'pdf');

  const settings = `/d${quality.charAt(0).toUpperCase() + quality.slice(1)}`;

  let gsCmd = 'gs';
  if (process.platform === 'win32') {
    try {
      execSync('where.exe gswin64c', { stdio: 'ignore' });
      gsCmd = 'gswin64c';
    } catch {
      try {
        execSync('where.exe gswin32c', { stdio: 'ignore' });
        gsCmd = 'gswin32c';
      } catch {
        gsCmd = 'gswin64c';
      }
    }
  }

  execSync(
    `${gsCmd} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${settings} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`,
    { timeout: 120000 }
  );

  return { filePath: outputPath, fileId };
}

/**
 * Convert PDF pages to images using Ghostscript
 */
export async function pdfToImage(
  inputPath: string,
  outputFormat: string = 'png'
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const outputPath = getTempPath(fileId, outputFormat);

  const device = outputFormat === 'jpg' || outputFormat === 'jpeg' ? 'jpeg' : 'png16m';

  let gsCmd = 'gs';
  if (process.platform === 'win32') {
    try {
      execSync('where.exe gswin64c', { stdio: 'ignore' });
      gsCmd = 'gswin64c';
    } catch {
      try {
        execSync('where.exe gswin32c', { stdio: 'ignore' });
        gsCmd = 'gswin32c';
      } catch {
        gsCmd = 'gswin64c';
      }
    }
  }

  execSync(
    `${gsCmd} -sDEVICE=${device} -r300 -dNOPAUSE -dQUIET -dBATCH -dFirstPage=1 -dLastPage=1 -sOutputFile="${outputPath}" "${inputPath}"`,
    { timeout: 60000 }
  );

  return { filePath: outputPath, fileId };
}

/**
 * Convert images to PDF using pdf-lib
 */
export async function imageToPdf(
  imagePaths: string[]
): Promise<{ filePath: string; fileId: string }> {
  const doc = await PDFDocument.create();

  for (const imgPath of imagePaths) {
    const imgBytes = await readFile(imgPath);
    const ext = imgPath.split('.').pop()?.toLowerCase() || '';

    let image;
    if (ext === 'png') {
      image = await doc.embedPng(imgBytes);
    } else {
      image = await doc.embedJpg(imgBytes);
    }

    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  const buffer = Buffer.from(await doc.save());
  return saveTempBuffer(buffer, 'pdf');
}

/**
 * Rotate all pages in a PDF
 */
export async function rotatePdf(
  inputPath: string,
  rotationDegrees: number
): Promise<{ filePath: string; fileId: string }> {
  const bytes = await readFile(inputPath);
  const doc = await PDFDocument.load(bytes);

  doc.getPages().forEach((page) => {
    page.setRotation(degrees(page.getRotation().angle + rotationDegrees));
  });

  const buffer = Buffer.from(await doc.save());
  return saveTempBuffer(buffer, 'pdf');
}

/**
 * Add text watermark to all pages
 */
export async function watermarkPdf(
  inputPath: string,
  text: string
): Promise<{ filePath: string; fileId: string }> {
  const bytes = await readFile(inputPath);
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) * 0.08;

    page.drawText(text, {
      x: width / 2 - (font.widthOfTextAtSize(text, fontSize) / 2),
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.7, 0.7, 0.7),
      opacity: 0.3,
      rotate: degrees(45),
    });
  });

  const buffer = Buffer.from(await doc.save());
  return saveTempBuffer(buffer, 'pdf');
}

/**
 * OCR a PDF or image using Tesseract
 */
export async function ocrPdf(
  inputPath: string,
  outputFormat: string = 'txt'
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const ext = outputFormat === 'pdf' ? 'pdf' : 'txt';
  const outputBase = getTempPath(fileId, '');
  // Tesseract adds the extension automatically
  const outputPath = getTempPath(fileId, ext);

  const tesseractOutput = outputFormat === 'pdf' ? 'pdf' : '';

  execSync(
    `tesseract "${inputPath}" "${outputBase.replace(/\.$/, '')}" ${tesseractOutput} -l eng`,
    { timeout: 120000 }
  );

  return { filePath: outputPath, fileId };
}

/**
 * Convert PDF to Word using LibreOffice
 */
export async function pdfToWord(
  inputPath: string
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();

  let cmd = 'libreoffice';
  if (process.platform === 'win32') {
    try {
      execSync('where.exe soffice', { stdio: 'ignore' });
      cmd = 'soffice';
    } catch {
      cmd = '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"';
    }
  }

  execSync(
    `${cmd} --headless --convert-to docx --outdir "${getTempPath(fileId, '').replace(/[^/\\]+$/, '')}" "${inputPath}"`,
    { timeout: 120000 }
  );

  // LibreOffice outputs with original filename, we need to rename
  const outputPath = getTempPath(fileId, 'docx');
  return { filePath: outputPath, fileId };
}

// ─── Helper ───
function parsePageRange(range: string, totalPages: number): number[] {
  const indices: number[] = [];
  const parts = range.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
        indices.push(i - 1); // 0-indexed
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (page >= 1 && page <= totalPages) {
        indices.push(page - 1);
      }
    }
  }

  return Array.from(new Set(indices)).sort((a, b) => a - b);
}
