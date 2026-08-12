import { NextResponse } from 'next/server'
import { loadRadarReports, getRadarDates } from '@/lib/radar'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || undefined
    const type = searchParams.get('type')

    if (type === 'dates') {
      const dates = getRadarDates()
      return NextResponse.json({
        success: true,
        data: dates,
      })
    }

    const reports = loadRadarReports(date)

    // 简化版（列表用）
    const list = reports.map(r => ({
      id: r.id,
      exec_time: r.exec_time,
      exec_date: r.exec_date,
      exec_time_str: r.exec_time_str,
      total_matches: r.total_matches,
      abnormal_high: r.abnormal_high,
      abnormal_medium: r.abnormal_medium,
      abnormal_normal: r.abnormal_normal,
      summary: r.summary,
    }))

    // 详情版（带比赛列表）
    if (type === 'all') {
      return NextResponse.json({
        success: true,
        data: reports,
        count: reports.length,
      })
    }

    return NextResponse.json({
      success: true,
      data: list,
      count: list.length,
    })
  } catch (err) {
    console.error('[API] radar error:', err)
    return NextResponse.json(
      { success: false, error: '加载雷达报告失败' },
      { status: 500 }
    )
  }
}
