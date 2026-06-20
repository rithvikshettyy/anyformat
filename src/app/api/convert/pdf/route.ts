import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/file-utils';
import { MAX_FILE_SIZE } from '@/lib/constants';
import { validateTurnstileToken } from '@/lib/turnstile';

const isServerless = process.env.VERCEL === '1';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

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

    const ALLOWED_OUTPUT = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'docx', 'pptx', 'txt'];
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
      if (file.size > MAX_FILE_SIZE.pdf) {
        return NextResponse.json(
          { success: false, error: 'File too large (max 50MB)' },
          { status: 400 }
        );
      }
    }

    const savedFiles = await Promise.all(
      files.map((f) =>
        saveUploadedFile(f, ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'ppt', 'pptx', 'odp'])
      )
    );
    const inputPaths = savedFiles.map((f) => f.filePath);

    const options = {
      pages: formData.get('pages') as string,
      quality: formData.get('quality') as string,
      degrees: formData.get('degrees') as string,
      text: formData.get('text') as string,
      password: formData.get('password') as string,
    };

    const jobData = {
      category: 'pdf',
      action,
      filePaths: inputPaths,
      filePath: inputPaths[0],
      outputFormat,
      options,
    };

    if (isServerless) {
      const { processConversion } = await import('@/lib/process-direct');
      const result = await processConversion(jobData);
      return NextResponse.json({ success: true, data: result });
    }

    const { conversionQueue } = await import('@/lib/queue');
    const job = await conversionQueue.add(jobData);
    return NextResponse.json({ success: true, data: { jobId: job.id } });
  } catch (error) {
    console.error('PDF conversion error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}
