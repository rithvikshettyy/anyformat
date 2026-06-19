import { NextRequest, NextResponse } from 'next/server';
import { generateQrCode, shortenLink, convertJsonCsv, convertBase64 } from '@/lib/converters/utility';
import { stat } from 'fs/promises';
import { validateTurnstileToken } from '@/lib/turnstile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserTier } from '@/lib/user-store';
import { getUserMonthlyCount, incrementUserMonthlyCount, getIpMonthlyCount, incrementIpMonthlyCount } from '@/lib/link-store';

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
      if (text.length > 4096) {
        return NextResponse.json(
          { success: false, error: 'Text too long for QR Code (max 4096 characters)' },
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

      // Usage enforcement: check tier limits
      const session = await getServerSession(authOptions);
      const email = session?.user?.email;
      let tier: 'free' | 'enterprise' = 'free';
      let userId: string | undefined;

      if (email) {
        tier = await getUserTier(email);
        userId = email;
      }

      if (tier !== 'enterprise') {
        if (email) {
          // Signed-in free user: 15 links/month
          const monthlyCount = await getUserMonthlyCount(email);
          if (monthlyCount >= 15) {
            return NextResponse.json(
              { success: false, error: 'Monthly limit reached (15 links). Upgrade to Enterprise for unlimited links.' },
              { status: 403 }
            );
          }
        } else {
          // Anonymous user: 5 links/month per IP
          const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
          const ipCount = await getIpMonthlyCount(ip);
          if (ipCount >= 5) {
            return NextResponse.json(
              { success: false, error: 'Monthly limit reached (5 links). Sign in for more, or upgrade to Enterprise for unlimited.' },
              { status: 403 }
            );
          }
        }

        // Custom aliases only for enterprise
        if (customCode && customCode.trim()) {
          return NextResponse.json(
            { success: false, error: 'Custom aliases are available on the Enterprise plan' },
            { status: 403 }
          );
        }
      }

      try {
        const result = await shortenLink(longUrl, tier === 'enterprise' ? customCode : undefined, userId);

        // Increment usage counters
        if (email) {
          await incrementUserMonthlyCount(email);
        } else {
          const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
          await incrementIpMonthlyCount(ip);
        }

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

    if (action === 'json-csv') {
      const text = formData.get('text') as string;
      const inputFormat = formData.get('inputFormat') as 'json' | 'csv';
      if (!text) {
        return NextResponse.json(
          { success: false, error: 'No input text provided' },
          { status: 400 }
        );
      }
      try {
        const result = convertJsonCsv(text, inputFormat || 'json');
        return NextResponse.json({
          success: true,
          data: { result, outputFormat: inputFormat === 'json' ? 'csv' : 'json' },
        });
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err instanceof Error ? err.message : 'Conversion failed' },
          { status: 400 }
        );
      }
    }

    if (action === 'base64') {
      const text = formData.get('text') as string;
      const mode = (formData.get('mode') as string) || 'encode';
      if (!text) {
        return NextResponse.json(
          { success: false, error: 'No input text provided' },
          { status: 400 }
        );
      }
      try {
        const result = convertBase64(text, mode as 'encode' | 'decode');
        return NextResponse.json({ success: true, data: { result } });
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid input for Base64 operation' },
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
