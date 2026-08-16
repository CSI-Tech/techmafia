import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function getAdminToken() {
  const secret = process.env.ADMIN_PASSWORD || 'techmafia2026';
  const msgBuffer = new TextEncoder().encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function proxy(request: NextRequest) {
  // Protect all API admin routes EXCEPT the login route
  if (request.nextUrl.pathname.startsWith('/api/admin') && !request.nextUrl.pathname.startsWith('/api/admin/login')) {
    const adminToken = request.cookies.get('admin_token')?.value;
    const expected = await getAdminToken();

    if (!adminToken || adminToken !== expected) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/admin/:path*',
};
