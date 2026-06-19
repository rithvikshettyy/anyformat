import QRCode from 'qrcode';
import sharp from 'sharp';
import { readFile, rm } from 'fs/promises';
import { ensureTempDir, generateFileId, getTempPath } from '../file-utils';
import { convertDocument } from './document';
import { createShortLink, shortCodeExists } from '../link-store';

/**
 * Generates a QR Code for text/URL and saves it as a PNG file.
 */
export async function generateQrCode(
  text: string
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const outputPath = getTempPath(fileId, 'png');

  try {
    await QRCode.toFile(outputPath, text, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR Code image.');
  }

  return { filePath: outputPath, fileId };
}

/**
 * Extracts the 6 most dominant colors from an image using a k-means/median-cut hybrid.
 */
export async function extractColorPalette(
  imagePath: string
): Promise<{ hex: string; percentage: number }[]> {
  try {
    const { data, info } = await sharp(imagePath)
      .resize(60, 60, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    const colorCounts: Record<string, { r: number; g: number; b: number; count: number }> = {};

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Skip transparent pixels in PNGs/WebPs
      if (channels === 4 && data[i + 3] < 15) continue;

      // Quantize colors (group similar shades)
      const q = 24; 
      const qr = Math.round(r / q) * q;
      const qg = Math.round(g / q) * q;
      const qb = Math.round(b / q) * q;
      const key = `${qr},${qg},${qb}`;

      if (colorCounts[key]) {
        colorCounts[key].count++;
        colorCounts[key].r += r;
        colorCounts[key].g += g;
        colorCounts[key].b += b;
      } else {
        colorCounts[key] = { r, g, b, count: 1 };
      }
    }

    // Map counts to averaged RGB and HEX values
    const palette = Object.values(colorCounts).map((c) => {
      const avgR = Math.round(c.r / c.count);
      const avgG = Math.round(c.g / c.count);
      const avgB = Math.round(c.b / c.count);
      return {
        r: avgR,
        g: avgG,
        b: avgB,
        count: c.count,
        hex: '#' + [avgR, avgG, avgB].map((x) => x.toString(16).padStart(2, '0')).join(''),
      };
    });

    palette.sort((a, b) => b.count - a.count);

    // Filter to find distinct colors using Euclidean distance
    const selected: typeof palette = [];
    const minDistance = 60;

    for (const color of palette) {
      let isDistinct = true;
      for (const sel of selected) {
        const dist = Math.sqrt(
          Math.pow(color.r - sel.r, 2) +
            Math.pow(color.g - sel.g, 2) +
            Math.pow(color.b - sel.b, 2)
        );
        if (dist < minDistance) {
          isDistinct = false;
          break;
        }
      }
      if (isDistinct) {
        selected.push(color);
      }
      if (selected.length >= 6) break;
    }

    const totalCount = selected.reduce((sum, c) => sum + c.count, 0);
    return selected.map((c) => ({
      hex: c.hex.toUpperCase(),
      percentage: totalCount > 0 ? Math.round((c.count / totalCount) * 100) : 0,
    }));
  } catch (error) {
    console.error('Palette extraction error:', error);
    throw new Error('Failed to extract color palette from image.');
  }
}

/**
 * Counts words, characters, lines, and paragraphs from files (TXT, MD, PDF, DOCX).
 */
export async function countWords(
  inputPath: string,
  extension: string
): Promise<{
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
}> {
  let text = '';
  let tempTextFile: string | null = null;

  try {
    if (extension === 'txt' || extension === 'md') {
      text = await readFile(inputPath, 'utf-8');
    } else if (extension === 'docx' || extension === 'pdf') {
      // Use LibreOffice converter helper to transform document into a text file
      const txtResult = await convertDocument(inputPath, 'txt');
      tempTextFile = txtResult.filePath;
      text = await readFile(tempTextFile, 'utf-8');
    } else {
      throw new Error(`Unsupported format for word counting: ${extension}`);
    }
  } catch (error) {
    console.error('Word count text extraction error:', error);
    throw new Error(
      'Failed to read text from file. Make sure LibreOffice is installed for PDF/DOCX files.'
    );
  } finally {
    // Clean up temporary text file immediately
    if (tempTextFile) {
      try {
        await rm(tempTextFile);
      } catch {}
    }
  }

  const cleanText = text.trim();
  if (!cleanText) {
    return { words: 0, characters: 0, charactersNoSpaces: 0, lines: 0, paragraphs: 0 };
  }

  const words = cleanText.split(/\s+/).filter((w) => w.length > 0).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const lines = text.split('\n').length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

  return { words, characters, charactersNoSpaces, lines, paragraphs };
}

/**
 * Shortens a URL using Redis-backed persistence (with in-memory fallback).
 */
export async function shortenLink(
  longUrl: string,
  customCode?: string,
  userId?: string
): Promise<{ shortCode: string; longUrl: string }> {
  // Validate URL structure and protocol
  try {
    const parsed = new URL(longUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP and HTTPS URLs are allowed');
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('Only HTTP')) throw e;
    throw new Error('Invalid URL format');
  }

  let code = customCode ? customCode.trim() : '';

  if (code) {
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      throw new Error('Custom alias can only contain letters, numbers, hyphens, and underscores');
    }
    const exists = await shortCodeExists(code);
    if (exists) {
      throw new Error('Custom alias is already taken');
    }
  } else {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let isUnique = false;
    while (!isUnique) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      isUnique = !(await shortCodeExists(code));
    }
  }

  await createShortLink(longUrl, code, userId);

  return { shortCode: code, longUrl };
}

/**
 * Convert between JSON and CSV formats.
 */
export function convertJsonCsv(
  input: string,
  inputFormat: 'json' | 'csv'
): string {
  if (inputFormat === 'json') {
    const data = JSON.parse(input);
    const rows: Record<string, unknown>[] = Array.isArray(data) ? data : [data];
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h] ?? '');
            return val.includes(',') || val.includes('"') || val.includes('\n')
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(',')
      ),
    ];
    return csvRows.join('\n');
  } else {
    const lines = input.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || '';
      });
      return obj;
    });
    return JSON.stringify(rows, null, 2);
  }
}

/**
 * Encode or decode Base64.
 */
export function convertBase64(
  input: string,
  mode: 'encode' | 'decode'
): string {
  if (mode === 'encode') {
    return Buffer.from(input, 'utf-8').toString('base64');
  } else {
    return Buffer.from(input, 'base64').toString('utf-8');
  }
}
