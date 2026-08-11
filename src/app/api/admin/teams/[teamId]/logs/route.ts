import { NextResponse } from 'next/server';
import { GameLog } from '@/lib/db/models/GameLog';

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const logs = await GameLog.find({ teamId })
      .sort({ timestamp: 1 })
      .lean();
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
