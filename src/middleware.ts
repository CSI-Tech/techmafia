import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Protect all API admin routes EXCEPT the login route
  if (request.nextUrl.pathname.startsWith('/api/admin') && !request.nextUrl.pathname.startsWith('/api/admin/login')) {
    if (request.headers.get('x-admin-auth') !== 'true') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/admin/:path*',
};
