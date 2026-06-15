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
import { conversionQueue } from '@/lib/queue';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const action = (formData.get('action') as string) || 'create';
    const outputFormat = (formData.get('outputFormat') as string) || 'zip';
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
      { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
