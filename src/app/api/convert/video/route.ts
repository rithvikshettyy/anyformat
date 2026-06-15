import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/file-utils';
import { MAX_FILE_SIZE } from '@/lib/constants';
import { conversionQueue } from '@/lib/queue';
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

    if (action === 'download') {
      if (!url) {
        return NextResponse.json(
          { success: false, error: 'No URL provided' },
          { status: 400 }
        );
      }

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
      { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
