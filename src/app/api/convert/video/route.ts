import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/file-utils';
import { MAX_FILE_SIZE } from '@/lib/constants';
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

    const action = (formData.get('action') as string) || 'convert';
    const outputFormat = (formData.get('outputFormat') as string) || 'mp4';
    const quality = parseInt((formData.get('quality') as string) || '28', 10);
    const url = formData.get('url') as string | null;
    const format = (formData.get('format') as string) || 'mp4';

    const ALLOWED_OUTPUT = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'gif'];
    if (!ALLOWED_OUTPUT.includes(outputFormat) || !ALLOWED_OUTPUT.includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported output format' },
        { status: 400 }
      );
    }

    if (quality < 0 || quality > 51 || isNaN(quality)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quality value' },
        { status: 400 }
      );
    }

    if (action === 'download') {
      if (!url) {
        return NextResponse.json(
          { success: false, error: 'No URL provided' },
          { status: 400 }
        );
      }

      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return NextResponse.json(
            { success: false, error: 'Only HTTP/HTTPS URLs allowed' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid URL' },
          { status: 400 }
        );
      }

      const { conversionQueue } = await import('@/lib/queue');
    const job = await conversionQueue.add({
        category: 'video',
        action,
        outputFormat: format,
        options: {
          url,
          format,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          jobId: job.id,
        },
      });
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE.video) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 50MB)' },
        { status: 400 }
      );
    }

    const { filePath: inputPath } = await saveUploadedFile(file, ['mp4', 'mov', 'avi', 'mkv', 'webm', 'gif']);

    // Add job to the queue
    const { conversionQueue } = await import('@/lib/queue');
    const job = await conversionQueue.add({
      category: 'video',
      action,
      filePath: inputPath,
      outputFormat,
      options: {
        quality: String(quality),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
      },
    });
  } catch (error) {
    console.error('Video queue enqueue error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}
