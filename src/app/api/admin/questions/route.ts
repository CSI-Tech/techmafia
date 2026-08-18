import { NextResponse } from 'next/server';
import { loadRound1Questions } from '@/lib/game/content';

export async function GET() {
  try {
    const questions = loadRound1Questions();
    return NextResponse.json({ success: true, questions });
  } catch (err) {
    console.error('[Admin API] Failed to load round 1 questions:', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
