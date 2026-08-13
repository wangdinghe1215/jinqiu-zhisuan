import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLANS_URL = 'https://www.coze.cn/s/w1yiwOW5X40/';

export async function GET() {
  try {
    const res = await fetch(PLANS_URL, {
      // 跟随重定向
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'fetch failed' },
      { status: 500 }
    );
  }
}
