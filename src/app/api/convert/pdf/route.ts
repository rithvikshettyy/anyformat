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
    const outputFormat = (formData.get('outputFormat') as string) || 'pdf';

    // Handle multi-file uploads (for merge, image-to-pdf)
    const files = formData.getAll('file') as File[];
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No file(s) provided' },
        { status: 400 }
      );
    }

    // Check file sizes
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE.pdf) {
        return NextResponse.json(
          { success: false, error: 'File too large (max 50MB)' },
          { status: 400 }
        );
      }
    }

    // Save all uploaded files
    const savedFiles = await Promise.all(
      files.map((f) =>
        saveUploadedFile(f, ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ppt', 'pptx', 'odp'])
      )
    );
    const inputPaths = savedFiles.map((f) => f.filePath);

    // Add job to the queue
    const job = await conversionQueue.add({
      category: 'pdf',
      action,
      filePaths: inputPaths,
      filePath: inputPaths[0],
      outputFormat,
      options: {
        pages: formData.get('pages') as string,
        quality: formData.get('quality') as string,
        degrees: formData.get('degrees') as string,
        text: formData.get('text') as string,
        password: formData.get('password') as string,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
      },
    });
  } catch (error) {
    console.error('PDF queue enqueue error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
