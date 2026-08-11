import { NextResponse } from 'next/server';
import { getMatchByNo } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const match = getMatchByNo(id);

    if (!match) {
      return NextResponse.json(
        { success: false, error: '比赛不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('API Error [match detail]:', error);
    return NextResponse.json(
      { success: false, error: '获取比赛详情失败' },
      { status: 500 }
    );
  }
}
