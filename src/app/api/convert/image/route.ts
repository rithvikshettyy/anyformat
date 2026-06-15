import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedFile } from '@/lib/file-utils';
import { MAX_FILE_SIZE } from '@/lib/constants';
import { conversionQueue } from '@/lib/queue';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const action = (formData.get('action') as string) || 'convert';
    const outputFormat = (formData.get('outputFormat') as string) || 'png';
    const quality = parseInt((formData.get('quality') as string) || '90', 10);
    const width = parseInt((formData.get('width') as string) || '0', 10);
    const height = parseInt((formData.get('height') as string) || '0', 10);

    if (action === 'qr-generate') {
      const text = formData.get('text') as string;
      if (!text) {
        return NextResponse.json(
          { success: false, error: 'No text provided for QR Code' },
          { status: 400 }
        );
      }

      const job = await conversionQueue.add({
        category: 'image',
        action,
        outputFormat: 'png',
        options: { text },
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

    if (file.size > MAX_FILE_SIZE.image) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 50MB)' },
        { status: 400 }
      );
    }

    // Save uploaded file
    const { filePath: inputPath } = await saveUploadedFile(file, ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg', 'gif', 'tiff', 'bmp']);

    // Add job to the queue
    const job = await conversionQueue.add({
      category: 'image',
      action,
      filePath: inputPath,
      outputFormat,
      options: {
        quality: String(quality),
        width: String(width),
        height: String(height),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
      },
    });
  } catch (error) {
    console.error('Image queue enqueue error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
