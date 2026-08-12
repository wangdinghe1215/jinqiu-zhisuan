// 必中哥多条件筛选 - 多赔率文件合并工具
// 将6个赔率类型的JSON文件按比赛维度合并，支持多条件AND筛选

import type { OddsRecord, MatchDetail, ScoreItem } from './mockOddsData';

export type OddsType =
  | 'spf_home'
  | 'spf_draw'
  | 'spf_away'
  | 'rspf_home'
  | 'rspf_draw'
  | 'rspf_away';

// 筛选字段类型
export type FilterField =
  | 'spf_home'
  | 'spf_draw'
  | 'spf_away'
  | 'rspf_home'
  | 'rspf_draw'
  | 'rspf_away'
  | 'league';

// 匹配方式
export type MatchMode = 'exact' | 'range';

// 单个筛选条件
export interface FilterCondition {
  id: string;
  field: FilterField;
  mode: MatchMode;
  value: string;      // 精确匹配值
  valueMin?: string;  // 范围最小值
  valueMax?: string;  // 范围最大值
}

// 合并后的比赛记录（包含所有可获取的赔率）
export interface MergedMatch {
  id: string;           // 唯一标识 = date|league|home|away
  date: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  fullTimeScore: string;
  fullTimeResult: 'win' | 'draw' | 'lose'; // 以主胜视角
  // 各类型赔率（如果该比赛出现在对应赔率文件中）
  spf_home?: number;
  spf_draw?: number;
  spf_away?: number;
  rspf_home?: number;
  rspf_draw?: number;
  rspf_away?: number;
}

// 筛选结果统计
export interface FilterResult {
  total: number;
  win: number;
  draw: number;
  lose: number;
  winRate: number;
  drawRate: number;
  loseRate: number;
  scores: ScoreItem[];
  matches: MergedMatch[];
  // 每个赔率类型对应的胜率（用于多维度参考）
  oddsSummary: Record<OddsType, { total: number; winRate: number }>;
}

// 赔率字段对应标签
export const fieldLabels: Record<FilterField, string> = {
  spf_home: 'SPF 主胜赔率',
  spf_draw: 'SPF 平局赔率',
  spf_away: 'SPF 客胜赔率',
  rspf_home: '让球主胜赔率',
  rspf_draw: '让球平赔率',
  rspf_away: '让球客胜赔率',
  league: '联赛名称',
};

// 赔率类型对应字段（用于判断是否为赔率类筛选）
export const oddsFields: FilterField[] = [
  'spf_home', 'spf_draw', 'spf_away',
  'rspf_home', 'rspf_draw', 'rspf_away',
];

// 结果归一化：将不同赔率类型的r转换为主队视角的胜/平/负
function normalizeResult(
  r: string,
  oddsType: OddsType
): 'win' | 'draw' | 'lose' {
  // SPF类型：win=主胜, draw=平, lose=客胜 (已为主队视角)
  if (oddsType.startsWith('spf_')) {
    return r as 'win' | 'draw' | 'lose';
  }
  // RSPF类型：结果是相对于让球的，但比分是真实比分
  // 我们用真实比分来判断结果，所以这里只需要用比分判断
  return r as 'win' | 'draw' | 'lose';
}

// 从比分判断主队结果
function resultFromScore(score: string): 'win' | 'draw' | 'lose' {
  const [h, a] = score.split(':').map(Number);
  if (h > a) return 'win';
  if (h < a) return 'lose';
  return 'draw';
}

// 生成比赛唯一ID
function matchId(d: string, l: string, h: string, a: string): string {
  return `${d}|${l}|${h}|${a}`;
}

// 数据缓存
let mergedCache: MergedMatch[] | null = null;
let loadedTypes: Set<OddsType> = new Set();
let rawDataCache: Partial<Record<OddsType, OddsRecord[]>> = {};

// 加载单个赔率文件
async function loadOddsFile(type: OddsType): Promise<OddsRecord[]> {
  if (rawDataCache[type]) {
    return rawDataCache[type]!;
  }
  try {
    const res = await fetch(`/data/${type}.json`);
    if (!res.ok) throw new Error(`加载失败: ${res.status}`);
    const data = await res.json();
    rawDataCache[type] = data;
    return data;
  } catch {
    rawDataCache[type] = [];
    return [];
  }
}

// 将原始赔率数据展开为比赛列表（附加赔率值）
function expandRecords(
  records: OddsRecord[],
  oddsType: OddsType
): { match: MergedMatch; oddsValue: number }[] {
  const result: { match: MergedMatch; oddsValue: number }[] = [];
  
  for (const rec of records) {
    for (const m of rec.matches) {
      const id = matchId(m.d, m.l, m.h, m.a);
      const score = m.s || '';
      const matchResult = resultFromScore(score);
      const merged: MergedMatch = {
        id,
        date: m.d,
        league: m.l,
        homeTeam: m.h,
        awayTeam: m.a,
        fullTimeScore: score,
        fullTimeResult: matchResult,
      };
      // 设置对应赔率字段
      (merged as any)[oddsType] = rec.odds;
      result.push({ match: merged, oddsValue: rec.odds });
    }
  }
  
  return result;
}

// 加载并合并指定赔率类型的数据
export async function loadAndMerge(types: OddsType[]): Promise<MergedMatch[]> {
  // 检查哪些类型还没加载
  const needLoad = types.filter(t => !loadedTypes.has(t));
  
  if (needLoad.length === 0 && mergedCache) {
    return mergedCache;
  }
  
  // 加载所有需要的文件
  const allData = await Promise.all(
    types.map(t => loadOddsFile(t))
  );
  
  // 用 Map 合并
  const matchMap = new Map<string, MergedMatch>();
  
  types.forEach((type, idx) => {
    const records = allData[idx];
    const expanded = expandRecords(records, type);
    
    for (const { match } of expanded) {
      const existing = matchMap.get(match.id);
      if (existing) {
        // 合并赔率字段
        (existing as any)[type] = (match as any)[type];
        // 确保比分和结果正确（以先有的为准，一般都一致）
        if (!existing.fullTimeScore && match.fullTimeScore) {
          existing.fullTimeScore = match.fullTimeScore;
          existing.fullTimeResult = match.fullTimeResult;
        }
      } else {
        matchMap.set(match.id, { ...match });
      }
    }
    
    loadedTypes.add(type);
  });
  
  mergedCache = Array.from(matchMap.values());
  return mergedCache;
}

// 重置缓存（调试用）
export function resetMergeCache() {
  mergedCache = null;
  loadedTypes.clear();
  rawDataCache = {};
}

// 执行多条件筛选
export function filterMatches(
  matches: MergedMatch[],
  conditions: FilterCondition[]
): FilterResult {
  let filtered = [...matches];
  
  // 逐个条件过滤（AND关系）
  for (const cond of conditions) {
    filtered = filtered.filter(m => matchCondition(m, cond));
  }
  
  // 统计
  const total = filtered.length;
  let win = 0, draw = 0, lose = 0;
  const scoreCount = new Map<string, number>();
  
  for (const m of filtered) {
    if (m.fullTimeResult === 'win') win++;
    else if (m.fullTimeResult === 'draw') draw++;
    else lose++;
    
    if (m.fullTimeScore) {
      scoreCount.set(m.fullTimeScore, (scoreCount.get(m.fullTimeScore) || 0) + 1);
    }
  }
  
  const scores: ScoreItem[] = Array.from(scoreCount.entries())
    .map(([score, count]) => ({ score, count }))
    .sort((a, b) => b.count - a.count);
  
  // 各赔率类型统计
  const oddsSummary = {} as Record<OddsType, { total: number; winRate: number }>;
  for (const type of ['spf_home','spf_draw','spf_away','rspf_home','rspf_draw','rspf_away'] as OddsType[]) {
    const withOdds = filtered.filter(m => (m as any)[type] !== undefined);
    const w = withOdds.filter(m => {
      // 对应该赔率类型下的"win"含义
      if (type === 'spf_home' || type === 'rspf_home') return m.fullTimeResult === 'win';
      if (type === 'spf_draw' || type === 'rspf_draw') return m.fullTimeResult === 'draw';
      return m.fullTimeResult === 'lose'; // away
    }).length;
    oddsSummary[type] = {
      total: withOdds.length,
      winRate: withOdds.length > 0 ? w / withOdds.length : 0,
    };
  }
  
  return {
    total,
    win,
    draw,
    lose,
    winRate: total > 0 ? win / total : 0,
    drawRate: total > 0 ? draw / total : 0,
    loseRate: total > 0 ? lose / total : 0,
    scores,
    matches: filtered,
    oddsSummary,
  };
}

// 判断单个比赛是否满足单个条件
function matchCondition(match: MergedMatch, cond: FilterCondition): boolean {
  if (cond.field === 'league') {
    // 联赛名称：模糊匹配（包含）
    const keyword = cond.value.trim().toLowerCase();
    if (!keyword) return true;
    return match.league.toLowerCase().includes(keyword);
  }
  
  // 赔率类字段
  const oddsValue = (match as any)[cond.field] as number | undefined;
  if (oddsValue === undefined) return false; // 没有该赔率数据的比赛排除
  
  if (cond.mode === 'exact') {
    const target = parseFloat(cond.value);
    if (isNaN(target)) return true;
    // 保留2位小数的精度比较
    return Math.abs(oddsValue - target) < 0.005;
  } else {
    // 范围匹配
    const min = parseFloat(cond.valueMin || '');
    const max = parseFloat(cond.valueMax || '');
    if (!isNaN(min) && oddsValue < min - 0.005) return false;
    if (!isNaN(max) && oddsValue > max + 0.005) return false;
    return true;
  }
}

// 生成唯一ID
export function genConditionId(): string {
  return Math.random().toString(36).slice(2, 10);
}
