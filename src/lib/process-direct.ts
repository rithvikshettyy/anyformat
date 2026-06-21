import { stat } from 'fs/promises';

interface ProcessResult {
  id: string;
  fileName: string;
  fileSize: number;
  outputFormat: string;
  downloadUrl: string;
  expiresAt: number;
}

export async function processConversion(data: {
  category: string;
  action: string;
  filePath?: string;
  filePaths?: string[];
  outputFormat?: string;
  options?: Record<string, string>;
}): Promise<ProcessResult | Record<string, unknown>> {
  const { category, action, filePath, filePaths, outputFormat = '', options = {} } = data;

  let result: { filePath: string; fileId: string };

  switch (category) {
    case 'image': {
      const { convertImage, compressImage, resizeImage, cropImage, upscaleImage } = await import('./converters/image');
      const { extractColorPalette, generateQrCode } = await import('./converters/utility');

      if (action === 'convert') {
        result = await convertImage(filePath!, outputFormat, {
          quality: parseInt(options.quality || '90', 10),
        });
      } else if (action === 'compress') {
        const quality = parseInt(options.quality || '80', 10);
        const compressResult = await compressImage(filePath!, quality);
        result = { filePath: compressResult.filePath, fileId: compressResult.fileId };
      } else if (action === 'extract-palette') {
        const palette = await extractColorPalette(filePath!);
        return { palette };
      } else if (action === 'qr-generate') {
        const qrResult = await generateQrCode(options.text || '');
        const outputStat = await stat(qrResult.filePath);
        return {
          id: qrResult.fileId,
          fileName: 'qrcode.png',
          fileSize: outputStat.size,
          outputFormat: 'png',
          downloadUrl: `/api/download/${qrResult.fileId}`,
          expiresAt: Date.now() + 30 * 60 * 1000,
        };
      } else if (action === 'resize') {
        const width = parseInt(options.width || '0', 10);
        const height = parseInt(options.height || '0', 10);
        result = await resizeImage(filePath!, width, height, outputFormat);
      } else if (action === 'crop') {
        const x = parseInt(options.x || '0', 10);
        const y = parseInt(options.y || '0', 10);
        const cropWidth = parseInt(options.cropWidth || '500', 10);
        const cropHeight = parseInt(options.cropHeight || '500', 10);
        result = await cropImage(filePath!, x, y, cropWidth, cropHeight, outputFormat);
      } else if (action === 'upscale') {
        const scale = parseInt(options.scale || '2', 10);
        result = await upscaleImage(filePath!, scale, outputFormat);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
      break;
    }

    case 'pdf': {
      const {
        mergePdfs, splitPdf, pdfToImage, imageToPdf, rotatePdf, watermarkPdf, protectPdf,
      } = await import('./converters/pdf');

      if (action === 'merge') {
        result = await mergePdfs(filePaths!);
      } else if (action === 'split') {
        result = await splitPdf(filePath!, options.pages || '1');
      } else if (action === 'pdf-to-image') {
        result = await pdfToImage(filePath!, outputFormat);
      } else if (action === 'convert' && ['jpg', 'jpeg', 'png'].includes(outputFormat)) {
        result = await pdfToImage(filePath!, outputFormat);
      } else if (action === 'image-to-pdf') {
        result = await imageToPdf(filePaths!);
      } else if (action === 'rotate') {
        const degrees = parseInt(options.degrees || '90', 10);
        result = await rotatePdf(filePath!, degrees);
      } else if (action === 'watermark') {
        result = await watermarkPdf(filePath!, options.text || 'CONFIDENTIAL');
      } else if (action === 'protect') {
        result = await protectPdf(filePath!, options.password);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
      break;
    }

    case 'document': {
      const { countWords } = await import('./converters/utility');

      if (action === 'word-count') {
        const ext = options.ext || 'txt';
        const stats = await countWords(filePath!, ext);
        return stats;
      }
      throw new Error(`Action ${action} requires system binaries not available on this server`);
    }

    default:
      throw new Error(`Category ${category} requires system binaries not available on this server`);
  }

  const outputStat = await stat(result.filePath);
  const outputExt = result.filePath.split('.').pop() || outputFormat;

  return {
    id: result.fileId,
    fileName: `converted.${outputExt}`,
    fileSize: outputStat.size,
    outputFormat: outputExt,
    downloadUrl: `/api/download/${result.fileId}`,
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
}
