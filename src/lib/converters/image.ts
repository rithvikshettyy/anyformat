import sharp from 'sharp';
import { saveTempBuffer } from '../file-utils';

interface ImageConvertOptions {
  quality?: number;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Convert an image to a different format
 */
export async function convertImage(
  inputPath: string,
  outputFormat: string,
  options: ImageConvertOptions = {}
): Promise<{ filePath: string; fileId: string }> {
  const { quality = 90 } = options;

  let pipeline = sharp(inputPath);

  const format = outputFormat.toLowerCase() as keyof sharp.FormatEnum;

  switch (format) {
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality: Math.min(quality, 100), compressionLevel: 6 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality });
      break;
    default:
      pipeline = pipeline.toFormat(format);
  }

  const buffer = await pipeline.toBuffer();
  const ext = format === 'jpeg' ? 'jpg' : format;
  return saveTempBuffer(buffer, ext);
}

/**
 * Compress an image (same format, reduced quality/size)
 */
export async function compressImage(
  inputPath: string,
  quality: number = 75
): Promise<{ filePath: string; fileId: string; ext: string }> {
  const metadata = await sharp(inputPath).metadata();
  const format = metadata.format || 'jpeg';

  let pipeline = sharp(inputPath);

  switch (format) {
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: Math.round(9 - (quality / 100) * 9) });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    default:
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  const buffer = await pipeline.toBuffer();
  const ext = format === 'jpeg' ? 'jpg' : format;
  const result = await saveTempBuffer(buffer, ext);
  return { ...result, ext };
}

/**
 * Resize an image
 */
export async function resizeImage(
  inputPath: string,
  width: number,
  height: number,
  outputFormat?: string,
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' = 'inside'
): Promise<{ filePath: string; fileId: string }> {
  const metadata = await sharp(inputPath).metadata();
  const format = outputFormat || metadata.format || 'jpeg';

  let pipeline = sharp(inputPath).resize(width, height, {
    fit,
    withoutEnlargement: true,
  });

  const fmt = format.toLowerCase();
  switch (fmt) {
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: 90 });
      break;
    case 'png':
      pipeline = pipeline.png();
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: 90 });
      break;
    default:
      pipeline = pipeline.jpeg({ quality: 90 });
  }

  const buffer = await pipeline.toBuffer();
  const ext = fmt === 'jpeg' ? 'jpg' : fmt;
  return saveTempBuffer(buffer, ext);
}

/**
 * Crop an image to specified region
 */
export async function cropImage(
  inputPath: string,
  x: number,
  y: number,
  cropWidth: number,
  cropHeight: number,
  outputFormat?: string
): Promise<{ filePath: string; fileId: string }> {
  const metadata = await sharp(inputPath).metadata();
  const format = outputFormat || metadata.format || 'jpeg';

  const imgWidth = metadata.width || 0;
  const imgHeight = metadata.height || 0;

  const safeX = Math.max(0, Math.min(x, imgWidth - 1));
  const safeY = Math.max(0, Math.min(y, imgHeight - 1));
  const safeW = Math.min(cropWidth, imgWidth - safeX);
  const safeH = Math.min(cropHeight, imgHeight - safeY);

  if (safeW <= 0 || safeH <= 0) {
    throw new Error('Crop dimensions are outside the image bounds');
  }

  let pipeline = sharp(inputPath).extract({
    left: safeX,
    top: safeY,
    width: safeW,
    height: safeH,
  });

  const fmt = format.toLowerCase();
  switch (fmt) {
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: 90 });
      break;
    case 'png':
      pipeline = pipeline.png();
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: 90 });
      break;
    default:
      pipeline = pipeline.jpeg({ quality: 90 });
  }

  const buffer = await pipeline.toBuffer();
  const ext = fmt === 'jpeg' ? 'jpg' : fmt;
  return saveTempBuffer(buffer, ext);
}

/**
 * Upscale an image by a given factor
 */
export async function upscaleImage(
  inputPath: string,
  scale: number = 2,
  outputFormat?: string
): Promise<{ filePath: string; fileId: string }> {
  const metadata = await sharp(inputPath).metadata();
  const format = outputFormat || metadata.format || 'jpeg';
  const width = (metadata.width || 100) * scale;
  const height = (metadata.height || 100) * scale;

  let pipeline = sharp(inputPath).resize(width, height, {
    kernel: sharp.kernel.lanczos3,
    withoutEnlargement: false,
  });

  const fmt = format.toLowerCase();
  switch (fmt) {
    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: 90 });
      break;
    case 'png':
      pipeline = pipeline.png();
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: 90 });
      break;
    default:
      pipeline = pipeline.jpeg({ quality: 90 });
  }

  const buffer = await pipeline.toBuffer();
  const ext = fmt === 'jpeg' ? 'jpg' : fmt;
  return saveTempBuffer(buffer, ext);
}
