import { NextRequest, NextResponse } from 'next/server';
import { getShortLink, incrementClicks } from '@/lib/link-store';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  if (!code) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }

  try {
    const link = await getShortLink(code);
    if (link) {
      const target = new URL(link.longUrl);
      if (!['http:', 'https:'].includes(target.protocol)) {
        return NextResponse.redirect(new URL('/', req.nextUrl.origin));
      }

      // Track click asynchronously (don't block redirect)
      incrementClicks(code).catch(() => {});

      return NextResponse.redirect(target);
    }
  } catch (error) {
    console.error('Error looking up short link:', error);
  }

  return NextResponse.redirect(new URL('/', req.nextUrl.origin));
}
