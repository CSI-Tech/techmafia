import { NextResponse } from 'next/server';
import { getLogs } from '@/lib/db/dbHelper';

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const logs = await getLogs({ teamId });
    // sort ascending for this endpoint
    logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
