import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/file-utils';
import {
  MAX_FILE_SIZE,
  ARCHIVE_FORMATS,
  IMAGE_FORMATS,
  PDF_FORMATS,
  DOCUMENT_FORMATS,
  VIDEO_FORMATS,
  AUDIO_FORMATS
} from '@/lib/constants';
// Queue imported dynamically to avoid Bull/ioredis on Vercel
import { validateTurnstileToken } from '@/lib/turnstile';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Verify Turnstile Token
    const turnstileToken = formData.get('turnstileToken') as string;
    const isBotValid = await validateTurnstileToken(turnstileToken);
    if (!isBotValid) {
      return NextResponse.json(
        { success: false, error: 'Bot verification failed' },
        { status: 403 }
      );
    }

    const action = (formData.get('action') as string) || 'create';
    const outputFormat = (formData.get('outputFormat') as string) || 'zip';

    const ALLOWED_OUTPUT = ['zip', 'tar', 'gz', 'tar.gz', '7z'];
    if (!ALLOWED_OUTPUT.includes(outputFormat)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported output format' },
        { status: 400 }
      );
    }
    const files = formData.getAll('file') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No file(s) provided' },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE.archive) {
        return NextResponse.json(
          { success: false, error: 'File too large (max 50MB)' },
          { status: 400 }
        );
      }
    }

    const allowedExts = action === 'extract'
      ? [...ARCHIVE_FORMATS]
      : [
          ...IMAGE_FORMATS,
          ...PDF_FORMATS,
          ...DOCUMENT_FORMATS,
          ...VIDEO_FORMATS,
          ...AUDIO_FORMATS,
          ...ARCHIVE_FORMATS,
          'txt', 'csv', 'tex', 'latex', 'md', 'json', 'html', 'xml'
        ];

    const savedFiles = await Promise.all(files.map((f) => saveUploadedFile(f, allowedExts)));
    const inputPaths = savedFiles.map((f) => f.filePath);

    // Add job to the queue
    const { conversionQueue } = await import('@/lib/queue');
    const job = await conversionQueue.add({
      category: 'archive',
      action,
      filePaths: inputPaths,
      filePath: inputPaths[0],
      outputFormat,
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
      },
    });
  } catch (error) {
    console.error('Archive queue enqueue error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}
