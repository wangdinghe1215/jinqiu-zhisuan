import { NextResponse } from 'next/server';
import historyData from '../../../../public/data/history_records.json';

export const dynamic = 'force-dynamic';

const REMOTE_URL = 'https://www.coze.cn/s/Hq1SsX46pcs/';
const EMPTY_DATA = { days: [] };

function isValidData(data: unknown): data is { days: unknown[] } {
  return !!data && typeof data === 'object' && data !== null && 'days' in data && Array.isArray((data as { days: unknown }).days);
}

export async function GET() {
  // 优先用本地静态 import 的 JSON（构建时打包，路径最可靠）
  if (isValidData(historyData)) {
    return NextResponse.json(historyData);
  }

  // 降级：远程 fetch
  try {
    const res = await fetch(REMOTE_URL, {
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (isValidData(data)) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // 远程也失败
  }

  return NextResponse.json(EMPTY_DATA);
}
