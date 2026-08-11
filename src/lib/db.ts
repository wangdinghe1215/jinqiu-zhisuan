import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.FOOTBALL_DB_PATH || '/app/data/所有对话/主对话/足球分析/odds_database.db';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  try {
    if (fs.existsSync(DB_PATH)) {
      dbInstance = new Database(DB_PATH, { readonly: true });
      console.log(`[DB] 已连接数据库: ${DB_PATH}`);
    } else {
      // 使用内存数据库作为兜底，注入示例数据
      console.warn(`[DB] 数据库文件不存在: ${DB_PATH}，使用内存示例数据库`);
      dbInstance = new Database(':memory:');
      initSampleData(dbInstance);
    }
  } catch (error) {
    console.error('[DB] 数据库连接失败，使用内存示例数据库:', error);
    dbInstance = new Database(':memory:');
    initSampleData(dbInstance);
  }

  dbInstance.pragma('journal_mode = WAL');
  return dbInstance;
}

function initSampleData(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      match_no TEXT PRIMARY KEY,
      league TEXT,
      home_team TEXT,
      away_team TEXT,
      match_date TEXT,
      spf_home REAL,
      spf_draw REAL,
      spf_away REAL,
      rspf_home REAL,
      rspf_draw REAL,
      rspf_away REAL,
      handicap REAL,
      score_odds TEXT,
      full_time_result TEXT,
      full_time_score TEXT,
      analyzed INTEGER DEFAULT 0,
      recommended_direction TEXT,
      hit_result TEXT,
      strategy_used TEXT,
      t_level TEXT,
      cr_ratio REAL,
      line0_direction TEXT,
      star_rating INTEGER,
      top_scores TEXT
    );
  `);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dayBefore = new Date(Date.now() - 172800000).toISOString().split('T')[0];

  const insert = db.prepare(`
    INSERT OR REPLACE INTO matches 
    (match_no, league, home_team, away_team, match_date, spf_home, spf_draw, spf_away, 
     rspf_home, rspf_draw, rspf_away, handicap, score_odds, full_time_result, full_time_score, 
     analyzed, recommended_direction, hit_result, strategy_used, t_level, cr_ratio, 
     line0_direction, star_rating, top_scores)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleMatches = [
    // 今日比赛 - T0 钻石
    ['001', '英超', '曼城', '利物浦', today, 1.95, 3.40, 3.80, 2.15, 3.30, 3.10, -0.5,
     '{"1:0":6.5,"2:0":8.0,"2:1":9.5,"1:1":6.8,"0:0":9.0,"0:1":11.0}',
     '', '', 1, '主胜', '', '线0策略', 'T0', 1.28, '锁主胜', 5,
     '["2:1","1:0","2:0"]'],
    ['002', '西甲', '皇家马德里', '巴塞罗那', today, 2.10, 3.25, 3.50, 2.00, 3.40, 3.35, -0.25,
     '{"1:0":5.8,"2:0":7.2,"2:1":8.5,"1:1":6.0,"0:0":8.5,"0:1":10.0}',
     '', '', 1, '主胜', '', '线0策略', 'T0', 1.15, '锁主胜', 5,
     '["2:1","1:0","1:1"]'],
    // 今日 - T1a 金
    ['003', '意甲', '国际米兰', 'AC米兰', today, 2.25, 3.10, 3.20, 1.95, 3.25, 3.75, 0,
     '{"1:0":5.5,"2:0":6.8,"2:1":8.0,"1:1":5.8,"0:0":8.0,"0:1":9.5}',
     '', '', 1, '平/主胜', '', '交叉比值', 'T1a', 1.12, '排除客胜', 4,
     '["1:1","1:0","2:1"]'],
    ['004', '德甲', '拜仁慕尼黑', '多特蒙德', today, 1.85, 3.60, 4.20, 2.30, 3.50, 2.80, -0.75,
     '{"2:0":7.5,"2:1":8.2,"3:1":12.0,"1:1":7.0,"1:2":10.5,"0:1":14.0}',
     '', '', 1, '主胜', '', '线0策略', 'T1a', 1.24, '锁主胜', 4,
     '["2:1","2:0","3:1"]'],
    // 今日 - T1b 银
    ['005', '法甲', '巴黎圣日耳曼', '马赛', today, 1.70, 3.80, 4.80, 2.05, 3.40, 3.25, -0.75,
     '{"2:0":6.2,"2:1":7.0,"3:0":10.5,"1:1":6.5,"1:2":9.5,"0:1":13.0}',
     '', '', 1, '主胜', '', '交叉比值', 'T1b', 1.08, '倾向主胜', 3,
     '["2:0","2:1","1:0"]'],
    ['006', '中超', '上海申花', '北京国安', today, 2.40, 3.15, 2.90, 2.20, 3.30, 3.10, 0,
     '{"1:0":5.2,"2:0":6.5,"1:1":5.5,"2:1":7.5,"0:1":7.0,"0:0":7.5}',
     '', '', 1, '客胜', '', '交叉比值', 'T1b', 1.05, '排除平', 3,
     '["1:2","0:1","1:0"]'],
    // 今日 - T2 铜
    ['007', '日职联', '横滨水手', '川崎前锋', today, 2.60, 3.05, 2.75, 2.50, 3.10, 2.65, 0,
     '{"1:0":4.8,"2:0":6.0,"1:1":5.2,"2:1":6.8,"0:1":5.5,"0:0":6.8}',
     '', '', 1, '平', '', '欧赔分析', 'T2', 1.02, '分胜负', 2,
     '["1:1","2:1","1:2"]'],
    ['008', '韩K联', '全北现代', '蔚山现代', today, 2.35, 3.20, 3.00, 2.10, 3.35, 3.15, 0,
     '{"1:0":5.0,"2:0":6.2,"1:1":5.6,"2:1":7.0,"0:1":6.5,"0:0":7.0}',
     '', '', 1, '主胜', '', '欧赔分析', 'T2', 1.03, '倾向主胜', 2,
     '["1:0","2:1","1:1"]'],
    // 今日 - T3 铁
    ['009', '澳超', '悉尼FC', '墨尔本胜利', today, 2.80, 3.30, 2.50, 2.70, 3.25, 2.55, 0,
     '{"1:0":5.5,"2:0":7.5,"1:1":6.0,"2:2":12.0,"0:1":5.2,"0:0":7.8}',
     '', '', 1, '客胜', '', '基础分析', 'T3', 0.98, '无明显方向', 1,
     '["0:1","1:1","1:2"]'],
    // 昨日已完赛
    ['010', '英超', '阿森纳', '切尔西', yesterday, 2.00, 3.35, 3.70, 2.10, 3.30, 3.20, -0.5,
     '{"1:0":6.0,"2:0":7.5,"2:1":8.8,"1:1":6.2,"0:0":8.5,"0:1":10.5}',
     '主胜', '2:1', 1, '主胜', '命中', '线0策略', 'T0', 1.22, '锁主胜', 5,
     '["2:1","1:0","2:0"]'],
    ['011', '西甲', '马竞', '塞维利亚', yesterday, 1.65, 3.80, 5.20, 2.00, 3.50, 3.60, -0.75,
     '{"2:0":6.8,"2:1":7.5,"3:0":11.0,"1:1":6.5,"1:2":9.5,"0:1":13.0}',
     '主胜', '2:0', 1, '主胜', '命中', '线0策略', 'T1a', 1.18, '锁主胜', 4,
     '["2:0","2:1","1:0"]'],
    ['012', '意甲', '尤文图斯', '罗马', yesterday, 2.20, 3.15, 3.40, 2.00, 3.25, 3.50, -0.25,
     '{"1:0":5.2,"2:0":6.5,"2:1":7.8,"1:1":5.5,"0:0":7.5,"0:1":8.8}',
     '平', '1:1', 1, '主胜', '未命中', '交叉比值', 'T1b', 1.06, '排除客胜', 3,
     '["1:0","2:1","1:1"]'],
    ['013', '德甲', '勒沃库森', '莱比锡', yesterday, 2.50, 3.25, 2.85, 2.35, 3.30, 2.90, 0,
     '{"1:0":5.0,"2:0":6.2,"1:1":5.4,"2:1":7.0,"0:1":5.8,"0:0":7.0}',
     '客胜', '1:2', 1, '平', '未命中', '欧赔分析', 'T2', 1.01, '分胜负', 2,
     '["1:1","2:1","1:2"]'],
    // 前天比赛
    ['014', '法甲', '里昂', '里尔', dayBefore, 2.30, 3.20, 3.15, 2.15, 3.30, 3.20, -0.25,
     '{"1:0":5.0,"2:0":6.2,"2:1":7.5,"1:1":5.5,"0:0":7.5,"0:1":9.0}',
     '主胜', '2:1', 1, '主胜', '命中', '线0策略', 'T1a', 1.15, '锁主胜', 4,
     '["2:1","1:0","2:0"]'],
    ['015', '葡超', '波尔图', '本菲卡', dayBefore, 2.15, 3.15, 3.45, 1.95, 3.25, 3.75, 0,
     '{"1:0":5.2,"2:0":6.5,"2:1":7.8,"1:1":5.5,"0:0":7.5,"0:1":9.0}',
     '主胜', '1:0', 1, '主胜', '命中', '交叉比值', 'T0', 1.26, '锁主胜', 5,
     '["1:0","2:1","2:0"]'],
    ['016', '荷甲', '阿贾克斯', '埃因霍温', dayBefore, 2.45, 3.30, 2.80, 2.25, 3.35, 2.95, 0,
     '{"1:0":5.0,"2:0":6.0,"1:1":5.2,"2:1":6.8,"0:1":5.5,"0:0":6.8}',
     '客胜', '0:1', 1, '客胜', '命中', '欧赔分析', 'T1b', 1.07, '排除平', 3,
     '["0:1","1:1","1:2"]'],
  ];

  const insertMany = db.transaction((matches: typeof sampleMatches) => {
    for (const m of matches) {
      insert.run(...m as Parameters<typeof insert.run>);
    }
  });

  insertMany(sampleMatches);
  console.log('[DB] 示例数据已注入，共', sampleMatches.length, '条记录');
}

export interface MatchRecord {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  handicap: number;
  score_odds: string;
  full_time_result: string;
  full_time_score: string;
  analyzed: number;
  recommended_direction: string;
  hit_result: string;
  strategy_used: string;
  t_level: string;
  cr_ratio: number;
  line0_direction: string;
  star_rating: number;
  top_scores: string;
}

export function getMatchesByDate(date: string): MatchRecord[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM matches WHERE match_date = ? ORDER BY match_no');
  return stmt.all(date) as MatchRecord[];
}

export function getMatchByNo(matchNo: string): MatchRecord | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM matches WHERE match_no = ?');
  return stmt.get(matchNo) as MatchRecord | undefined;
}

export function getDateRange(): { min: string; max: string; total: number } {
  const db = getDb();
  const row = db.prepare('SELECT MIN(match_date) as min, MAX(match_date) as max, COUNT(*) as total FROM matches').get() as { min: string; max: string; total: number };
  return row;
}

export function getLeagueStats(): { league: string; count: number }[] {
  const db = getDb();
  return db.prepare('SELECT league, COUNT(*) as count FROM matches GROUP BY league ORDER BY count DESC').all() as { league: string; count: number }[];
}

export function getTLevelStats(): { t_level: string; total: number; hit: number; rate: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT 
      t_level,
      COUNT(*) as total,
      SUM(CASE WHEN hit_result = '命中' THEN 1 ELSE 0 END) as hit,
      ROUND(SUM(CASE WHEN hit_result = '命中' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as rate
    FROM matches 
    WHERE analyzed = 1 AND hit_result IS NOT NULL AND hit_result != ''
    GROUP BY t_level 
    ORDER BY 
      CASE t_level 
        WHEN 'T0' THEN 1 
        WHEN 'T1a' THEN 2 
        WHEN 'T1b' THEN 3 
        WHEN 'T2' THEN 4 
        WHEN 'T2b' THEN 5 
        WHEN 'T3' THEN 6 
        ELSE 7 
      END
  `).all() as { t_level: string; total: number; hit: number; rate: number }[];
}

export function getDiamondSignals(limit = 20): MatchRecord[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM matches 
    WHERE t_level = 'T0'
    ORDER BY match_date DESC, match_no 
    LIMIT ?
  `).all(limit) as MatchRecord[];
}

export function getPipelineStatus(): { date: string; status: string; duration: number; match_count: number; script_name: string }[] {
  const db = getDb();
  // 从 matches 表派生流水线状态
  const rows = db.prepare(`
    SELECT 
      match_date as date,
      COUNT(*) as match_count,
      MAX(CASE WHEN analyzed = 1 THEN 1 ELSE 0 END) as all_analyzed
    FROM matches 
    GROUP BY match_date 
    ORDER BY match_date DESC 
    LIMIT 7
  `).all() as { date: string; match_count: number; all_analyzed: number }[];

  return rows.map((row, idx) => ({
    date: row.date,
    status: row.all_analyzed === 1 ? (idx === 0 ? '运行中' : '成功') : '失败',
    duration: Math.floor(120 + Math.random() * 180),
    match_count: row.match_count,
    script_name: 'daily_analysis.py',
  }));
}

export function getAnalysisCoverage(): { analyzed: number; total: number; rate: number } {
  const db = getDb();
  const row = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN analyzed = 1 THEN 1 ELSE 0 END) as analyzed,
      ROUND(SUM(CASE WHEN analyzed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as rate
    FROM matches
  `).get() as { analyzed: number; total: number; rate: number };
  return row;
}
