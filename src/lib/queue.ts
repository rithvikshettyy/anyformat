import Queue from 'bull';
import Redis from 'ioredis';
import cron from 'node-cron';
import { cleanupExpiredFiles } from './file-utils';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Setup ioredis connection options for Upstash
const redisOpts = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const client = new Redis(redisUrl, redisOpts);
const subscriber = new Redis(redisUrl, redisOpts);

// Prevent multiple instances in development hot reloading
const globalForQueue = globalThis as unknown as {
  conversionQueue?: Queue.Queue;
};

export const conversionQueue =
  globalForQueue.conversionQueue ??
  new Queue('conversionQueue', {
    createClient: (type) => {
      switch (type) {
        case 'client':
          return client;
        case 'subscriber':
          return subscriber;
        default:
          return new Redis(redisUrl, redisOpts);
      }
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForQueue.conversionQueue = conversionQueue;
}

// Prevent duplicate cron registration in development hot-reloading
const globalForCron = globalThis as unknown as {
  cronScheduled?: boolean;
};

if (!globalForCron.cronScheduled) {
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running automated temp file cleanup cron job...');
    try {
      const deleted = await cleanupExpiredFiles();
      console.log(`Automated cleanup completed successfully. Deleted ${deleted} files/folders.`);
    } catch (error) {
      console.error('Automated cleanup cron job failed:', error);
    }
  });
  globalForCron.cronScheduled = true;
}

// ─── Worker Process Handler (Concurrency = 3) ───
conversionQueue.process(3, async (job) => {
  const { category, action, filePath, filePaths, outputFormat, options = {} } = job.data;

  await job.progress(10);

  let result: { filePath: string; fileId: string };

  switch (category) {
    case 'image': {
      const { convertImage, compressImage, resizeImage, cropImage, upscaleImage } = await import('./converters/image');
      const { removeBackground } = await import('./converters/bg-removal');
      const { extractColorPalette, generateQrCode } = await import('./converters/utility');
      const { purgeExif } = await import('./converters/privacy');

      if (action === 'convert') {
        result = await convertImage(filePath, outputFormat, {
          quality: parseInt(options.quality || '90', 10),
        });
      } else if (action === 'compress') {
        const quality = parseInt(options.quality || '80', 10);
        const compressResult = await compressImage(filePath, quality);
        result = { filePath: compressResult.filePath, fileId: compressResult.fileId };
      } else if (action === 'exif-purge') {
        result = await purgeExif(filePath);
      } else if (action === 'bg-remove') {
        result = await removeBackground(filePath);
      } else if (action === 'extract-palette') {
        const palette = await extractColorPalette(filePath);
        await job.progress(100);
        return { palette };
      } else if (action === 'qr-generate') {
        const qrResult = await generateQrCode(options.text || '');
        const { stat } = await import('fs/promises');
        const outputStat = await stat(qrResult.filePath);
        await job.progress(100);
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
        result = await resizeImage(filePath, width, height, outputFormat);
      } else if (action === 'crop') {
        const x = parseInt(options.x || '0', 10);
        const y = parseInt(options.y || '0', 10);
        const cropWidth = parseInt(options.cropWidth || '500', 10);
        const cropHeight = parseInt(options.cropHeight || '500', 10);
        result = await cropImage(filePath, x, y, cropWidth, cropHeight, outputFormat);
      } else if (action === 'upscale') {
        const scale = parseInt(options.scale || '2', 10);
        result = await upscaleImage(filePath, scale, outputFormat);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
      break;
    }

    case 'pdf': {
      const {
        mergePdfs,
        splitPdf,
        compressPdf,
        pdfToImage,
        imageToPdf,
        rotatePdf,
        watermarkPdf,
        ocrPdf,
        pdfToWord,
        pdfToExcel,
        pptToPdf,
        protectPdf,
      } = await import('./converters/pdf');

      if (action === 'merge') {
        result = await mergePdfs(filePaths);
      } else if (action === 'split') {
        result = await splitPdf(filePath, options.pages || '1');
      } else if (action === 'compress') {
        result = await compressPdf(filePath, options.quality || 'ebook');
      } else if (action === 'pdf-to-image') {
        result = await pdfToImage(filePath, outputFormat);
      } else if (action === 'image-to-pdf') {
        result = await imageToPdf(filePaths);
      } else if (action === 'pdf-to-word') {
        result = await pdfToWord(filePath);
      } else if (action === 'pdf-to-excel') {
        result = await pdfToExcel(filePath);
      } else if (action === 'ppt-to-pdf') {
        result = await pptToPdf(filePath);
      } else if (action === 'protect') {
        result = await protectPdf(filePath, options.password);
      } else if (action === 'rotate') {
        const degrees = parseInt(options.degrees || '90', 10);
        result = await rotatePdf(filePath, degrees);
      } else if (action === 'watermark') {
        result = await watermarkPdf(filePath, options.text || 'CONFIDENTIAL');
      } else if (action === 'ocr') {
        result = await ocrPdf(filePath, outputFormat);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
      break;
    }

    case 'document': {
      const { convertDocument } = await import('./converters/document');
      const { convertToLatex } = await import('./converters/latex');
      const { convertOcrToMarkdown } = await import('./converters/ocr');
      const { countWords } = await import('./converters/utility');

      if (action === 'to-latex') {
        result = await convertToLatex(filePath);
      } else if (action === 'ocr-to-md') {
        result = await convertOcrToMarkdown(filePath);
      } else if (action === 'word-count') {
        const ext = options.ext || 'txt';
        const stats = await countWords(filePath, ext);
        await job.progress(100);
        return stats;
      } else {
        result = await convertDocument(filePath, outputFormat);
      }
      break;
    }

    case 'video': {
      const { convertVideo, compressVideo, extractAudio, trimVideo } = await import('./converters/video');

      if (action === 'download') {
        const { downloadMedia } = await import('./converters/downloader');
        const downloadResult = await downloadMedia(options.url, options.format || 'mp4');
        const { stat } = await import('fs/promises');
        const outputStat = await stat(downloadResult.filePath);
        await job.progress(100);
        return {
          id: downloadResult.fileId,
          fileName: `${downloadResult.title}.${downloadResult.ext}`,
          fileSize: outputStat.size,
          outputFormat: downloadResult.ext,
          downloadUrl: `/api/download/${downloadResult.fileId}`,
          expiresAt: Date.now() + 30 * 60 * 1000,
        };
      } else if (action === 'convert') {
        result = await convertVideo(filePath, outputFormat);
      } else if (action === 'compress') {
        const quality = parseInt(options.quality || '28', 10);
        result = await compressVideo(filePath, quality);
      } else if (action === 'extract') {
        result = await extractAudio(filePath, outputFormat);
      } else if (action === 'trim') {
        result = await trimVideo(filePath, options.start || '00:00:00', options.end || '00:01:00');
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
      break;
    }

    case 'audio': {
      const { convertAudio, compressAudio } = await import('./converters/audio');
      if (action === 'compress') {
        result = await compressAudio(filePath, options.bitrate || '128k');
      } else {
        result = await convertAudio(filePath, outputFormat, options.bitrate || '192k');
      }
      break;
    }

    case 'archive': {
      const { createArchive, extractArchive } = await import('./converters/archive');
      if (action === 'create') {
        result = await createArchive(filePaths, outputFormat);
      } else if (action === 'extract') {
        result = await extractArchive(filePath);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
      break;
    }

    default:
      throw new Error(`Unknown category: ${category}`);
  }

  await job.progress(80);

  const { stat } = await import('fs/promises');
  const outputStat = await stat(result.filePath);
  const outputExt = result.filePath.split('.').pop() || outputFormat;

  await job.progress(100);

  return {
    id: result.fileId,
    fileName: `${category === 'archive' ? 'archive' : 'converted'}.${outputExt}`,
    fileSize: outputStat.size,
    outputFormat: outputExt,
    downloadUrl: `/api/download/${result.fileId}`,
    expiresAt: Date.now() + 30 * 60 * 1000,
  };
});
