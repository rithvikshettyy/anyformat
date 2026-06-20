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
    const outputFormat = (formData.get('outputFormat') as string) || 'png';

    const ALLOWED_OUTPUT = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'tiff', 'bmp'];
    if (action === 'convert' && !ALLOWED_OUTPUT.includes(outputFormat)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported output format' },
        { status: 400 }
      );
    }
    const quality = parseInt((formData.get('quality') as string) || '90', 10);
    const width = parseInt((formData.get('width') as string) || '0', 10);
    const height = parseInt((formData.get('height') as string) || '0', 10);
    const x = formData.get('x') as string;
    const y = formData.get('y') as string;
    const cropWidth = formData.get('cropWidth') as string;
    const cropHeight = formData.get('cropHeight') as string;
    const scale = formData.get('scale') as string;

    if (action === 'qr-generate') {
      const text = formData.get('text') as string;
      if (!text) {
        return NextResponse.json(
          { success: false, error: 'No text provided for QR Code' },
          { status: 400 }
        );
      }

      if (isServerless) {
        const { processConversion } = await import('@/lib/process-direct');
        const result = await processConversion({
          category: 'image', action, outputFormat: 'png', options: { text },
        });
        return NextResponse.json({ success: true, data: result });
      }

      const { conversionQueue } = await import('@/lib/queue');
      const job = await conversionQueue.add({
        category: 'image', action, outputFormat: 'png', options: { text },
      });
      return NextResponse.json({ success: true, data: { jobId: job.id } });
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE.image) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 50MB)' },
        { status: 400 }
      );
    }

    const { filePath: inputPath } = await saveUploadedFile(file, ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif', 'tiff', 'bmp']);

    const options = {
      quality: String(quality),
      width: String(width),
      height: String(height),
      ...(x && { x }),
      ...(y && { y }),
      ...(cropWidth && { cropWidth }),
      ...(cropHeight && { cropHeight }),
      ...(scale && { scale }),
    };

    if (isServerless) {
      const { processConversion } = await import('@/lib/process-direct');
      const result = await processConversion({
        category: 'image', action, filePath: inputPath, outputFormat, options,
      });
      return NextResponse.json({ success: true, data: result });
    }

    const { conversionQueue } = await import('@/lib/queue');
    const job = await conversionQueue.add({
      category: 'image', action, filePath: inputPath, outputFormat, options,
    });
    return NextResponse.json({ success: true, data: { jobId: job.id } });
  } catch (error) {
    console.error('Image conversion error:', error);
    return NextResponse.json(
      { success: false, error: 'Processing failed' },
      { status: 500 }
    );
  }
}
