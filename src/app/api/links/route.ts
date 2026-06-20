import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserLinks, deleteLink } from '@/lib/link-store';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
  }
  const links = await getUserLinks(session.user.email);
  return NextResponse.json({ success: true, data: links });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
  }
  const { code } = await req.json();
  if (!code || typeof code !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(code)) {
    return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 });
  }
  await deleteLink(code, session.user.email);
  return NextResponse.json({ success: true });
}
