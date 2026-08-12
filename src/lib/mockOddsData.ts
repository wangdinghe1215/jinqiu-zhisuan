// 必中哥赔率历史回查 - 模拟数据生成器
// 在用户上传真实JSON文件前，使用此模拟数据

export interface MatchDetail {
  d: string; // date
  l: string; // league
  h: string; // home team
  a: string; // away team
  s: string; // score
  r: 'win' | 'draw' | 'lose'; // result relative to selected type
}

export interface ScoreItem {
  score: string;
  count: number;
}

export interface OddsRecord {
  odds: number;
  total: number;
  win: number;
  draw: number;
  lose: number;
  win_rate: number;
  draw_rate: number;
  lose_rate: number;
  scores: ScoreItem[];
  matches: MatchDetail[];
}

const leagues = ['英超', '西甲', '意甲', '德甲', '法甲', '葡超', '荷甲', '比甲', '奥甲', '苏超', '瑞超', '丹超', '挪超', '中超', '日职联', '韩K联'];

const teamPairs: Record<string, [string, string][]> = {
  英超: [['曼城', '利物浦'], ['阿森纳', '切尔西'], ['曼联', '热刺'], ['纽卡斯尔', '阿斯顿维拉'], ['布莱顿', '西汉姆']],
  西甲: [['皇家马德里', '巴塞罗那'], ['马竞', '塞维利亚'], ['皇家社会', '比利亚雷亚尔'], ['贝蒂斯', '瓦伦西亚'], ['毕尔巴鄂', '赫罗纳']],
  意甲: [['国际米兰', 'AC米兰'], ['尤文图斯', '罗马'], ['那不勒斯', '拉齐奥'], ['亚特兰大', '佛罗伦萨'], ['博洛尼亚', '都灵']],
  德甲: [['拜仁慕尼黑', '多特蒙德'], ['勒沃库森', '莱比锡'], ['斯图加特', '法兰克福'], ['门兴', '沃尔夫斯堡'], ['弗赖堡', '霍芬海姆']],
  法甲: [['巴黎圣日耳曼', '马赛'], ['里昂', '里尔'], ['摩纳哥', '雷恩'], ['尼斯', '朗斯'], ['斯特拉斯堡', '南特']],
  中超: [['上海申花', '北京国安'], ['上海海港', '山东泰山'], ['成都蓉城', '浙江队'], ['武汉三镇', '河南队'], ['北京国安', '上海海港']],
  日职联: [['横滨水手', '川崎前锋'], ['鹿岛鹿角', '浦和红钻'], ['名古屋鲸八', '大阪樱花'], ['神户胜利船', 'FC东京'], ['广岛三箭', '札幌冈萨多']],
  韩K联: [['全北现代', '蔚山现代'], ['首尔FC', '浦项制铁'], ['水原三星', '济州联'], ['仁川联', '大邱FC'], ['光州FC', '江原FC']],
};

const commonScores = ['1:0', '2:0', '2:1', '1:1', '0:0', '0:1', '0:2', '1:2', '2:2', '3:1', '3:0', '3:2', '1:3', '2:3', '0:3', '3:3', '4:1', '4:2'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateMatchesForOdds(
  odds: number,
  type: 'spf_home' | 'spf_draw' | 'spf_away' | 'rspf_home' | 'rspf_draw' | 'rspf_away',
  count: number,
  seed: number
): MatchDetail[] {
  const rand = seededRandom(seed);
  const matches: MatchDetail[] = [];

  // 根据赔率类型计算基础胜率
  let baseWinRate: number;
  if (type.includes('home')) {
    baseWinRate = Math.min(0.85, Math.max(0.2, 1 / odds * 0.95));
  } else if (type.includes('away')) {
    baseWinRate = Math.min(0.85, Math.max(0.15, 1 / odds * 0.95));
  } else {
    baseWinRate = Math.min(0.5, Math.max(0.15, 1 / odds * 0.9));
  }

  for (let i = 0; i < count; i++) {
    const leagueIdx = Math.floor(rand() * leagues.length);
    const league = leagues[leagueIdx];
    const pairs = teamPairs[league] || teamPairs['英超'];
    const pairIdx = Math.floor(rand() * pairs.length);
    let [home, away] = pairs[pairIdx];

    // 如果是客胜类型，偶尔交换主客队让结果合理
    if (type.includes('away') && rand() > 0.5) {
      [home, away] = [away, home];
    }

    const r = rand();
    let result: 'win' | 'draw' | 'lose';
    let score: string;

    if (r < baseWinRate) {
      result = 'win';
      // 胜利比分
      const winScores = type.includes('draw')
        ? ['1:1', '0:0', '2:2', '3:3']
        : ['1:0', '2:0', '2:1', '3:1', '3:0', '1:0', '2:1'];
      score = winScores[Math.floor(rand() * winScores.length)];
    } else if (r < baseWinRate + (type.includes('draw') ? 0.6 : 0.25)) {
      result = 'draw';
      const drawScores = ['1:1', '0:0', '2:2', '3:3', '1:1', '0:0'];
      score = drawScores[Math.floor(rand() * drawScores.length)];
    } else {
      result = 'lose';
      const loseScores = type.includes('draw')
        ? ['0:1', '1:2', '0:2', '1:0', '2:1']
        : ['0:1', '1:2', '0:2', '1:3', '0:3', '2:3'];
      score = loseScores[Math.floor(rand() * loseScores.length)];
    }

    // 如果是平局类型，确保结果合理
    if (type.includes('draw')) {
      if (result === 'win' || result === 'lose') {
        const s = score.split(':');
        if (s[0] === s[1]) {
          result = 'win'; // 平局类别的"胜"就是打出平局
        }
      }
    }

    const daysAgo = Math.floor(rand() * 730);
    const date = new Date(Date.now() - daysAgo * 86400000);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    matches.push({
      d: dateStr,
      l: league,
      h: home,
      a: away,
      s: score,
      r: result,
    });
  }

  return matches.sort((a, b) => b.d.localeCompare(a.d));
}

function generateScoresFromMatches(matches: MatchDetail[]): ScoreItem[] {
  const scoreMap = new Map<string, number>();
  for (const m of matches) {
    scoreMap.set(m.s, (scoreMap.get(m.s) || 0) + 1);
  }
  return Array.from(scoreMap.entries())
    .map(([score, count]) => ({ score, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

// 生成完整数据集
export function generateOddsData(
  type: 'spf_home' | 'spf_draw' | 'spf_away' | 'rspf_home' | 'rspf_draw' | 'rspf_away'
): OddsRecord[] {
  const data: OddsRecord[] = [];
  const baseSeed = type.charCodeAt(0) + type.length * 100;

  // 赔率范围：1.10 - 5.00，间隔0.01，但我们抽样生成
  const oddsValues: number[] = [];
  for (let o = 1.10; o <= 5.00; o += 0.05) {
    oddsValues.push(parseFloat(o.toFixed(2)));
  }

  for (let i = 0; i < oddsValues.length; i++) {
    const odds = oddsValues[i];
    const seed = baseSeed + Math.floor(odds * 100);
    const matchCount = Math.floor(30 + Math.random() * 120);
    const matches = generateMatchesForOdds(odds, type, matchCount, seed);

    const win = matches.filter((m) => m.r === 'win').length;
    const draw = matches.filter((m) => m.r === 'draw').length;
    const lose = matches.filter((m) => m.r === 'lose').length;
    const total = matches.length;

    data.push({
      odds,
      total,
      win,
      draw,
      lose,
      win_rate: parseFloat((win / total).toFixed(4)),
      draw_rate: parseFloat((draw / total).toFixed(4)),
      lose_rate: parseFloat((lose / total).toFixed(4)),
      scores: generateScoresFromMatches(matches),
      matches,
    });
  }

  return data;
}

// 按赔率精确查找
export function findByOdds(data: OddsRecord[], odds: number, tolerance = 0.02): OddsRecord[] {
  return data.filter((d) => Math.abs(d.odds - odds) <= tolerance);
}

// 按范围查找
export function findByRange(data: OddsRecord[], min: number, max: number): OddsRecord[] {
  return data.filter((d) => d.odds >= min && d.odds <= max);
}

// 聚合多条记录
export function aggregateRecords(records: OddsRecord[]): Omit<OddsRecord, 'odds' | 'matches'> & { matches: MatchDetail[] } {
  if (records.length === 0) {
    return {
      total: 0,
      win: 0,
      draw: 0,
      lose: 0,
      win_rate: 0,
      draw_rate: 0,
      lose_rate: 0,
      scores: [],
      matches: [],
    };
  }

  let total = 0, win = 0, draw = 0, lose = 0;
  const scoreMap = new Map<string, number>();
  const allMatches: MatchDetail[] = [];

  for (const r of records) {
    total += r.total;
    win += r.win;
    draw += r.draw;
    lose += r.lose;
    for (const s of r.scores) {
      scoreMap.set(s.score, (scoreMap.get(s.score) || 0) + s.count);
    }
    allMatches.push(...r.matches);
  }

  const scores = Array.from(scoreMap.entries())
    .map(([score, count]) => ({ score, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    total,
    win,
    draw,
    lose,
    win_rate: parseFloat((win / total).toFixed(4)),
    draw_rate: parseFloat((draw / total).toFixed(4)),
    lose_rate: parseFloat((lose / total).toFixed(4)),
    scores,
    matches: allMatches.sort((a, b) => b.d.localeCompare(a.d)),
  };
}
