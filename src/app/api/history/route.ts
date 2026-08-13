import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const HISTORY_JSON_PATH = path.join(
  process.cwd(),
  'public',
  'data',
  'history_records.json'
);

export async function GET() {
  try {
    if (!fs.existsSync(HISTORY_JSON_PATH)) {
      return NextResponse.json(
        { days: [] },
        { status: 200 }
      );
    }
    const raw = fs.readFileSync(HISTORY_JSON_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'read failed' },
      { status: 500 }
    );
  }
}
