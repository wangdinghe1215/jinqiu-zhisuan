import { NextResponse } from 'next/server';
import { getMatchesByDate, getDateRange } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let date = searchParams.get('date');

  if (!date) {
    const today = new Date().toISOString().split('T')[0];
    date = today;
  }

  try {
    const matches = getMatchesByDate(date);
    const range = getDateRange();

    return NextResponse.json({
      success: true,
      data: matches,
      date,
      total: matches.length,
      dateRange: range,
    });
  } catch (error) {
    console.error('API Error [matches]:', error);
    return NextResponse.json(
      { success: false, error: '获取比赛数据失败' },
      { status: 500 }
    );
  }
}
