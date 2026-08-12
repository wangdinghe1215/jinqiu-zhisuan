// Sporttery 官方API 数据获取与解析层
// API: https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry

const SPORTTERY_URL =
  "https://webapi.sporttery.cn/gateway/jc/football/getMatchCalculatorV1.qry?poolCode=had,hhad,crs,ttg,hafu";

// 缓存配置：5分钟
const CACHE_TTL = 5 * 60 * 1000;
let cache: { data: SportteryMatch[]; timestamp: number } | null = null;

// 解析比分key: s10s00 -> 1:0, s1sa -> 胜其他
function parseScoreKey(key: string): string | null {
  // 特殊比分
  if (key === "s1sh") return "胜其他";
  if (key === "s1sd") return "平其他";
  if (key === "s1sa") return "负其他";
  // 普通比分 sXXsYY
  const m = key.match(/^s0*(\d+)s0*(\d+)$/);
  if (m) return `${m[1]}:${m[2]}`;
  return null;
}

export interface ScoreOdd {
  score: string;
  odds: number;
}

export interface SportteryMatch {
  match_no: string;       // 场次编号
  league: string;         // 联赛名
  home_team: string;      // 主队
  away_team: string;      // 客队
  match_date: string;     // 比赛日期 YYYY-MM-DD
  match_time: string;     // 比赛时间 HH:mm
  // SPF 胜平负
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  // RSPF 让球胜平负
  handicap: number;       // 让球数（正数=主队让球，负数=主队受让）
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  // CRS 比分赔率
  score_odds: ScoreOdd[];
  // TTG 总进球数赔率（0-6+）
  ttg_odds: Record<string, number>;
  // HAFU 半全场赔率
  hafu_odds: Record<string, number>;
}

// 从sporttery原始数据解析为标准化结构
function parseMatch(item: any): SportteryMatch | null {
  if (!item) return null;

  const matchNo = item.matchNumStr || item.matchNum || item.matchId || "";
  const league = item.leagueAllName || item.leagueAbbName || item.leagueName || "未知联赛";
  const homeTeam = item.homeTeamAllName || item.homeTeamAbbName || item.homeTeamName || item.homeTeam || "";
  const awayTeam = item.awayTeamAllName || item.awayTeamAbbName || item.awayTeamName || item.awayTeam || "";
  const matchDate = item.matchDate || item.businessDate || item.date || "";
  const matchTime = item.matchTime || item.time || "";

  // SPF (胜平负) - poolCode=had, 字段名 had
  let spfHome = 0, spfDraw = 0, spfAway = 0;
  const hadPool = item.had || item.h || item.hadPool || item.poolHad || {};
  if (hadPool && typeof hadPool === "object") {
    spfHome = parseFloat(hadPool.h || hadPool.home || hadPool.s0 || hadPool["0"] || 0);
    spfDraw = parseFloat(hadPool.d || hadPool.draw || hadPool.s1 || hadPool["1"] || 0);
    spfAway = parseFloat(hadPool.a || hadPool.away || hadPool.s2 || hadPool["2"] || 0);
  }

  // RSPF (让球胜平负) - poolCode=hhad, 字段名 hhad
  let handicap = 0;
  let rspfHome = 0, rspfDraw = 0, rspfAway = 0;
  const hhadPool = item.hhad || item.hh || item.hhadPool || item.poolHhad || {};
  if (hhadPool && typeof hhadPool === "object") {
    // goalLine='-1' 表示主队让1球 -> DB约定让球数为正表示主队让球，所以取反
    const gl = hhadPool.goalLine || hhadPool.handicap || hhadPool.gl || "0";
    if (gl && gl !== "") {
      handicap = -parseFloat(gl);
    }
    rspfHome = parseFloat(hhadPool.h || hhadPool.home || hhadPool.s0 || hhadPool["0"] || 0);
    rspfDraw = parseFloat(hhadPool.d || hhadPool.draw || hhadPool.s1 || hhadPool["1"] || 0);
    rspfAway = parseFloat(hhadPool.a || hhadPool.away || hhadPool.s2 || hhadPool["2"] || 0);
  }

  // 兼容其他可能的结构
  if (spfHome === 0 && item.spf) {
    spfHome = parseFloat(item.spf.home || item.spf.win || 0);
    spfDraw = parseFloat(item.spf.draw || 0);
    spfAway = parseFloat(item.spf.away || item.spf.lose || 0);
  }
  if (spfHome === 0 && item.odds) {
    spfHome = parseFloat(item.odds.spf_home || item.odds.h || 0);
    spfDraw = parseFloat(item.odds.spf_draw || item.odds.d || 0);
    spfAway = parseFloat(item.odds.spf_away || item.odds.a || 0);
  }

  // CRS 比分赔率 - poolCode=crs, 字段名 crs
  // 格式: s00s00=0:0, s10s00=1:0, s1sa=胜其他, s1sd=平其他, s1sh=负其他(注意：这里h/a/d是相对于主队的)
  const scoreOdds: ScoreOdd[] = [];
  const crsPool = item.crs || item.c || item.crsPool || item.poolCrs || {};
  if (crsPool && typeof crsPool === "object") {
    for (const key of Object.keys(crsPool)) {
      // 跳过非赔率字段（如 goalLine, updateDate 等）
      if (!key.startsWith("s")) continue;
      // 跳过带 f 后缀的（让球相关的其他字段）
      if (key.endsWith("f") || key.endsWith("F")) continue;
      const score = parseScoreKey(key);
      if (score) {
        const odds = parseFloat(crsPool[key] || 0);
        if (odds > 0) {
          scoreOdds.push({ score, odds });
        }
      }
    }
  }
  // 按赔率升序排序（最可能的比分排前面）
  scoreOdds.sort((a, b) => a.odds - b.odds);

  // TTG 总进球 - poolCode=ttg, 字段名 ttg
  const ttgOdds: Record<string, number> = {};
  const ttgPool = item.ttg || item.t || item.ttgPool || item.poolTtg || {};
  if (ttgPool && typeof ttgPool === "object") {
    for (const key of Object.keys(ttgPool)) {
      if (!key.startsWith("s") && key !== "goalLine" && key !== "goalLineValue" && !key.startsWith("update")) {
        const val = parseFloat(ttgPool[key] || 0);
        if (val > 0) ttgOdds[key] = val;
      }
    }
    // 如果上面的方式没找到，试试 s0-s6 格式
    if (Object.keys(ttgOdds).length === 0) {
      for (const key of Object.keys(ttgPool)) {
        if (key.startsWith("s")) {
          const val = parseFloat(ttgPool[key] || 0);
          if (val > 0) {
            const goals = key.replace(/^s/, "");
            ttgOdds[goals === "6up" || goals === "6+" ? "6+" : goals] = val;
          }
        }
      }
    }
  }

  // HAFU 半全场 - poolCode=hafu, 字段名 hafu
  const hafuOdds: Record<string, number> = {};
  const hafuPool = item.hafu || item.ha || item.hafuPool || item.poolHafu || {};
  if (hafuPool && typeof hafuPool === "object") {
    for (const key of Object.keys(hafuPool)) {
      if (key === "goalLine" || key === "goalLineValue" || key.startsWith("update")) continue;
      const val = parseFloat(hafuPool[key] || 0);
      if (val > 0) hafuOdds[key] = val;
    }
  }

  // 如果没有任何赔率数据，跳过
  if (spfHome === 0 && rspfHome === 0 && scoreOdds.length === 0) {
    return null;
  }

  return {
    match_no: String(matchNo),
    league,
    home_team: homeTeam,
    away_team: awayTeam,
    match_date: matchDate,
    match_time: matchTime,
    spf_home: spfHome,
    spf_draw: spfDraw,
    spf_away: spfAway,
    handicap,
    rspf_home: rspfHome,
    rspf_draw: rspfDraw,
    rspf_away: rspfAway,
    score_odds: scoreOdds,
    ttg_odds: ttgOdds,
    hafu_odds: hafuOdds,
  };
}

// 递归查找比赛数据数组（兼容不同的返回结构）
function findMatchList(data: any): any[] {
  if (!data) return [];
  // 常见结构
  if (Array.isArray(data)) return data;
  if (data.matchList && Array.isArray(data.matchList)) return data.matchList;
  if (data.list && Array.isArray(data.list)) return data.list;
  if (data.matches && Array.isArray(data.matches)) return data.matches;
  // sporttery 官方结构: value.matchInfoList[].subMatchList[]
  if (data.matchInfoList && Array.isArray(data.matchInfoList)) {
    const allMatches: any[] = [];
    for (const info of data.matchInfoList) {
      if (info.subMatchList && Array.isArray(info.subMatchList)) {
        allMatches.push(...info.subMatchList);
      }
    }
    if (allMatches.length > 0) return allMatches;
  }
  if (data.subMatchList && Array.isArray(data.subMatchList)) return data.subMatchList;
  if (data.data) {
    const inner = findMatchList(data.data);
    if (inner.length > 0) return inner;
  }
  if (data.value) {
    const inner = findMatchList(data.value);
    if (inner.length > 0) return inner;
  }
  if (data.result) {
    const inner = findMatchList(data.result);
    if (inner.length > 0) return inner;
  }
  // 尝试所有对象值
  for (const key of Object.keys(data)) {
    if (typeof data[key] === "object" && data[key] !== null) {
      const inner = findMatchList(data[key]);
      if (inner.length > 0) return inner;
    }
  }
  return [];
}

export async function fetchSportteryMatches(): Promise<SportteryMatch[]> {
  // 检查缓存
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  try {
    // 使用 undici 的 fetch，设置 headers 绕过代理
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(SPORTTERY_URL, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.sporttery.cn/",
        Accept: "application/json, text/plain, */*",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[Sporttery] API 请求失败: ${response.status}`);
      return [];
    }

    const json = await response.json();
    const rawList = findMatchList(json);
    const matches: SportteryMatch[] = [];

    for (const item of rawList) {
      const parsed = parseMatch(item);
      if (parsed) matches.push(parsed);
    }

    // 写入缓存
    cache = { data: matches, timestamp: Date.now() };
    return matches;
  } catch (error) {
    console.error("[Sporttery] 获取数据异常:", error);
    // 如果缓存有数据（过期的），返回过期数据
    if (cache) return cache.data;
    return [];
  }
}

// 计算返还率
export function calculateReturnRate(
  home: number,
  draw: number,
  away: number
): number {
  if (home <= 0 || draw <= 0 || away <= 0) return 0.88;
  const total = 1 / home + 1 / draw + 1 / away;
  return 1 / total;
}

// 泊松分布概率
function poissonProb(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  // 用自然对数计算避免大数溢出
  let logFact = 0;
  for (let i = 1; i <= k; i++) logFact += Math.log(i);
  return Math.exp(k * Math.log(lambda) - lambda - logFact);
}

export interface PoissonResult {
  top5: { score: string; prob: number }[];
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  lambdaHome: number;
  lambdaAway: number;
  matrix: number[][]; // 6x6 matrix [homeGoals][awayGoals]
}

// 基于SPF赔率的泊松预测
export function calculatePoisson(
  spfHome: number,
  spfDraw: number,
  spfAway: number,
  returnRate = 0.88
): PoissonResult {
  const rr = calculateReturnRate(spfHome, spfDraw, spfAway) || returnRate;

  // 从赔率反推概率
  const pHome = (1 / spfHome) / (1 / rr);
  const pDraw = (1 / spfDraw) / (1 / rr);
  const pAway = (1 / spfAway) / (1 / rr);

  // 用近似法求λ: 从胜平负概率反推双泊松参数
  // 主队λ和客队λ的关系，通过二分法找到满足胜平负概率的λ组合
  // 简化方法：用经验公式估算
  const totalGoals = 2.7; // 平均总进球

  // 初始估计
  let lambdaHome = totalGoals * pHome / (pHome + pAway);
  let lambdaAway = totalGoals * pAway / (pHome + pAway);

  // 迭代校正：让胜平负概率更接近目标
  for (let iter = 0; iter < 30; iter++) {
    let calcHome = 0, calcDraw = 0, calcAway = 0;
    const maxG = 10;
    for (let h = 0; h < maxG; h++) {
      for (let a = 0; a < maxG; a++) {
        const prob = poissonProb(lambdaHome, h) * poissonProb(lambdaAway, a);
        if (h > a) calcHome += prob;
        else if (h === a) calcDraw += prob;
        else calcAway += prob;
      }
    }

    // 调整系数
    const total = calcHome + calcDraw + calcAway;
    const ratioHome = pHome / (calcHome / total || 0.001);
    const ratioAway = pAway / (calcAway / total || 0.001);

    lambdaHome *= Math.sqrt(ratioHome);
    lambdaAway *= Math.sqrt(ratioAway);

    // 约束范围
    lambdaHome = Math.max(0.1, Math.min(5.0, lambdaHome));
    lambdaAway = Math.max(0.1, Math.min(5.0, lambdaAway));
  }

  // 生成6x6比分矩阵
  const matrix: number[][] = [];
  const allScores: { score: string; prob: number }[] = [];
  let homeWinProb = 0, drawProb = 0, awayWinProb = 0;

  for (let h = 0; h <= 5; h++) {
    matrix[h] = [];
    for (let a = 0; a <= 5; a++) {
      const prob = poissonProb(lambdaHome, h) * poissonProb(lambdaAway, a);
      matrix[h][a] = prob;
      allScores.push({ score: `${h}:${a}`, prob });
      if (h > a) homeWinProb += prob;
      else if (h === a) drawProb += prob;
      else awayWinProb += prob;
    }
  }

  // 加上5+以上的概率补充（用其他）
  const totalProb = homeWinProb + drawProb + awayWinProb;
  homeWinProb = homeWinProb / totalProb;
  drawProb = drawProb / totalProb;
  awayWinProb = awayWinProb / totalProb;

  // Top5 比分
  allScores.sort((a, b) => b.prob - a.prob);
  const top5 = allScores.slice(0, 5);

  // 归一化Top5概率（基于整体）
  const top5Total = top5.reduce((s, x) => s + x.prob, 0);
  top5.forEach((s) => (s.prob = s.prob / totalProb));

  return {
    top5,
    homeWinProb,
    drawProb,
    awayWinProb,
    lambdaHome: Math.round(lambdaHome * 100) / 100,
    lambdaAway: Math.round(lambdaAway * 100) / 100,
    matrix,
  };
}

// V4.2 线0分级
export interface V42LevelResult {
  tLevel: string;       // T0 / T1a / T1b / T2 / T2b / T3c / T3b / EX / P
  tLabel: string;       // 显示名称
  starLevel: string;    // 钻石 / 金 / 银 / 铜 / 铁 / 无星
  starCount: number;    // 星级数字 0-5
  direction: string;    // 主胜 / 客胜
  spfCR: number;        // SPF-CR
  rspfCR: number;       // RSPF-CR
  crossCR: number;      // 交叉CR
  line0: string;        // Lock / Normal
  goldenScores: { score: string; odds: number }[];
}

export function calculateV42(
  spfHome: number,
  spfDraw: number,
  spfAway: number,
  rspfHome: number,
  rspfDraw: number,
  rspfAway: number,
  handicap: number,
  scoreOdds: { score: string; odds: number }[]
): V42LevelResult {
  // 确定主方向：哪边赔率低就是热门方
  const isHomeFav = spfHome < spfAway;
  const favOdds = isHomeFav ? spfHome : spfAway;
  const direction = isHomeFav ? "主胜" : "客胜";

  // T级划分（基于热门方SPF赔率）
  let tLevel = "P";
  let tLabel = "待定";

  if (favOdds <= 1.2) {
    tLevel = "T0"; tLabel = "超级热门";
  } else if (favOdds <= 1.30) {
    tLevel = "T1a"; tLabel = "强热门";
  } else if (favOdds <= 1.35) {
    tLevel = "T1b"; tLabel = "中热门";
  } else if (favOdds <= 1.65) {
    tLevel = "T2"; tLabel = "次热门";
  } else if (favOdds <= 1.75) {
    tLevel = "T2b"; tLabel = "弱热门";
  } else if (favOdds <= 2.0) {
    tLevel = "T3c"; tLabel = "胶着";
  } else if (favOdds <= 2.5) {
    tLevel = "T3b"; tLabel = "偏弱";
  } else {
    tLevel = "EX"; tLabel = "排除";
  }

  // 星级评定
  let starLevel = "无星";
  let starCount = 0;

  if (tLevel === "T0") {
    starLevel = "钻石"; starCount = 5;
  } else if (tLevel === "T1a") {
    if (spfDraw >= 5.0) { starLevel = "钻石"; starCount = 5; }
    else { starLevel = "金"; starCount = 4; }
  } else if (tLevel === "T1b") {
    if (spfDraw >= 5.0) { starLevel = "金"; starCount = 4; }
    else { starLevel = "银"; starCount = 3; }
  } else if (tLevel === "T2") {
    if (spfDraw >= 4.5) { starLevel = "银"; starCount = 3; }
    else { starLevel = "铜"; starCount = 2; }
  } else if (tLevel === "T2b") {
    starLevel = "铁"; starCount = 1;
  }

  // CR值计算
  // SPF-CR = (主胜 × 客胜) / (平局 × 平局) × 100
  const spfCR = spfDraw > 0 ? (spfHome * spfAway) / (spfDraw * spfDraw) * 100 : 0;
  const rspfCR = rspfDraw > 0 ? (rspfHome * rspfAway) / (rspfDraw * rspfDraw) * 100 : 0;
  const crossCR = spfCR > 0 && rspfCR > 0 ? (spfCR * rspfCR) / 100 : 0;

  // 线0状态
  const line0 = (tLevel === "T0" || tLevel === "T1a") ? "Lock" : "Normal";

  // 黄金比分TOP3：热门方方向，按赔率升序
  const goldenScores: { score: string; odds: number }[] = [];
  if (scoreOdds.length > 0) {
    const filtered = scoreOdds.filter((s) => {
      const parts = s.score.split(":");
      if (parts.length !== 2) return false;
      // 排除"其他"比分
      if (isNaN(parseInt(parts[0])) || isNaN(parseInt(parts[1]))) return false;
      const h = parseInt(parts[0]);
      const a = parseInt(parts[1]);
      return isHomeFav ? h > a : a > h;
    });
    goldenScores.push(...filtered.slice(0, 3));
  }

  return {
    tLevel,
    tLabel,
    starLevel,
    starCount,
    direction,
    spfCR: Math.round(spfCR * 10) / 10,
    rspfCR: Math.round(rspfCR * 10) / 10,
    crossCR: Math.round(crossCR * 10) / 10,
    line0,
    goldenScores,
  };
}
