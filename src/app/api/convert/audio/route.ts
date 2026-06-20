import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/file-utils';
import { MAX_FILE_SIZE, AUDIO_FORMATS } from '@/lib/constants';
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

    const file = formData.get('file') as File | null;
    const outputFormat = (formData.get('outputFormat') as string) || 'mp3';
    const bitrate = (formData.get('bitrate') as string) || '192k';

    const ALLOWED_OUTPUT = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
    if (!ALLOWED_OUTPUT.includes(outputFormat)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported output format' },
        { status: 400 }
      );
    }

    const ALLOWED_BITRATES = ['64k', '128k', '192k', '256k', '320k'];
    if (!ALLOWED_BITRATES.includes(bitrate)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bitrate' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE.audio) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 50MB)' },
        { status: 400 }
      );
    }

    const { filePath: inputPath } = await saveUploadedFile(file, [...AUDIO_FORMATS]);

    // Add job to the queue
    const { conversionQueue } = await import('@/lib/queue');
    const job = await conversionQueue.add({
      category: 'audio',
      action: 'convert',
      filePath: inputPath,
      outputFormat,
      options: {
        bitrate,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
      },
    });
  } catch (error) {
    console.error('Audio queue enqueue error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}
