import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/file-utils';
import { MAX_FILE_SIZE, AUDIO_FORMATS } from '@/lib/constants';
import { conversionQueue } from '@/lib/queue';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const outputFormat = (formData.get('outputFormat') as string) || 'mp3';
    const bitrate = (formData.get('bitrate') as string) || '192k';

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
      { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
