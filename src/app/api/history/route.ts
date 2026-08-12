import { NextResponse } from 'next/server';
import { getTLevelStats, getDiamondSignals, getMatchesByDate, getDateRange } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    const tLevelStats = getTLevelStats();
    const diamondSignals = getDiamondSignals(30);
    const dateRange = getDateRange();

    let dateMatches: unknown[] = [];
    if (date) {
      dateMatches = getMatchesByDate(date);
    }

    return NextResponse.json({
      success: true,
      data: {
        tLevelStats,
        diamondSignals,
        dateMatches,
        dateRange,
      },
    });
  } catch (error) {
    console.error('API Error [history]:', error);
    return NextResponse.json(
      { success: false, error: '获取历史数据失败' },
      { status: 500 }
    );
  }
}
