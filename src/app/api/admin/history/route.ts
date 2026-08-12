import { NextResponse } from 'next/server';
import { getRooms } from '@/lib/db/dbHelper';

export async function GET() {
  try {
    const rooms = await getRooms({ status: 'COMPLETED' });
    return NextResponse.json({ success: true, history: rooms });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
