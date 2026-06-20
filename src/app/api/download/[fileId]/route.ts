import { NextRequest, NextResponse } from 'next/server';
import { findFileById, deleteFile } from '@/lib/file-utils';
import { stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { dirname } from 'path';
import { MIME_MAP } from '@/lib/constants';

export async function GET(
  req: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!/^[a-f0-9-]{36}$/.test(fileId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file ID' },
        { status: 400 }
      );
    }

    const file = await findFileById(fileId);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found or expired' },
        { status: 404 }
      );
    }

    const fileStat = await stat(file.filePath);
    const mimeType = MIME_MAP[file.ext] || 'application/octet-stream';
    const fileName = `converted.${file.ext}`;

    const fileStream = createReadStream(file.filePath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        fileStream.on('end', async () => {
          controller.close();
          try {
            // Delete the parent UUID isolated directory and all contents immediately
            const parentDir = dirname(file.filePath);
            await deleteFile(parentDir);
          } catch (e) {
            console.error('Failed to delete downloaded file directory:', e);
          }
        });
        fileStream.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        fileStream.destroy();
        const parentDir = dirname(file.filePath);
        deleteFile(parentDir).catch(() => {});
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { success: false, error: 'Download failed' },
      { status: 500 }
    );
  }
}
