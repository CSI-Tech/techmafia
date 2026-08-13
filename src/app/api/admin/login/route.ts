import { NextResponse } from 'next/server';
import { validateAdminCredentials } from '@/lib/utils/adminAuth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password.trim()) {
      return NextResponse.json({ success: false, message: 'Missing or invalid credentials' }, { status: 400 });
    }

    if (validateAdminCredentials(username.trim(), password)) {
      const response = NextResponse.json({ success: true });
      const token = crypto.createHash('sha256').update(password).digest('hex');
      response.cookies.set('admin_token', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
      });
      return response;
    } else {
      return NextResponse.json({ success: false, message: 'Invalid admin credentials' }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
