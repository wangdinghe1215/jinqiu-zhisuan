import { NextResponse } from 'next/server';
import { getPipelineStatus, getDateRange, getAnalysisCoverage, getLeagueStats } from '@/lib/db';

export async function GET() {
  try {
    const pipeline = getPipelineStatus();
    const range = getDateRange();
    const coverage = getAnalysisCoverage();
    const leagues = getLeagueStats();

    return NextResponse.json({
      success: true,
      data: {
        pipeline,
        dateRange: range,
        coverage,
        leagues,
      },
    });
  } catch (error) {
    console.error('API Error [overview]:', error);
    return NextResponse.json(
      { success: false, error: '获取概览数据失败' },
      { status: 500 }
    );
  }
}
