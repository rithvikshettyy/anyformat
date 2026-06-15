import { NextRequest, NextResponse } from 'next/server';
import { generateQrCode, shortenLink } from '@/lib/converters/utility';
import { stat } from 'fs/promises';
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

    const action = formData.get('action') as string;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'No action provided' },
        { status: 400 }
      );
    }

    if (action === 'qr-generate') {
      const text = formData.get('text') as string;
      if (!text) {
        return NextResponse.json(
          { success: false, error: 'No text provided for QR Code' },
          { status: 400 }
        );
      }

      const result = await generateQrCode(text);
      const outputStat = await stat(result.filePath);

      return NextResponse.json({
        success: true,
        data: {
          id: result.fileId,
          fileName: `qrcode.png`,
          fileSize: outputStat.size,
          outputFormat: 'png',
          downloadUrl: `/api/download/${result.fileId}`,
          expiresAt: Date.now() + 30 * 60 * 1000,
        },
      });
    }

    if (action === 'shorten-link') {
      const longUrl = formData.get('longUrl') as string;
      const customCode = formData.get('customCode') as string | undefined;

      if (!longUrl) {
        return NextResponse.json(
          { success: false, error: 'No URL provided' },
          { status: 400 }
        );
      }

      try {
        const result = await shortenLink(longUrl, customCode);
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const shortUrl = `${protocol}://${host}/s/${result.shortCode}`;

        return NextResponse.json({
          success: true,
          data: {
            shortCode: result.shortCode,
            shortUrl,
            longUrl: result.longUrl,
          },
        });
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err instanceof Error ? err.message : 'Failed to shorten link' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Utility API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
