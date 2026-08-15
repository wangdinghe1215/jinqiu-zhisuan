import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const REMOTE_URL = 'https://www.coze.cn/s/Hq1SsX46pcs/';
const LOCAL_JSON_PATH = path.join(
  process.cwd(),
  'public',
  'data',
  'history_records.json'
);

const EMPTY_DATA = { days: [] };

export async function GET() {
  // 优先读取本地静态 JSON 文件
  try {
    if (fs.existsSync(LOCAL_JSON_PATH)) {
      const raw = fs.readFileSync(LOCAL_JSON_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.days)) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // 本地读取失败，继续尝试远程
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
      if (data && Array.isArray(data.days)) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // 远程也失败，返回空数据
  }

  return NextResponse.json(EMPTY_DATA);
}
