"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Calendar, BarChart3, TrendingUp, Target, AlertTriangle, Check, X, ChevronDown, ChevronUp } from "lucide-react";

// ===== 类型定义 =====
interface PoissonTop {
  score: string;
  prob: string;
}

interface PoissonData {
  lambda_h: number;
  lambda_a: number;
  top3: PoissonTop[];
  spf_prob?: { home: number; draw: number; away: number };
}

interface V42Data {
  direction: string;
  star: number;        // starCount
  star_name: string;   // 钻石/金星/银星/铜星/铁星/无星
  rspf_direction: string;
  rv: number;          // 返还率
  golden_scores?: string[];
  t_level?: string;
  cross_cr?: number;
}

interface BzgV2Direction {
  target_odds: number;
  actual_odds: number;
  exact_match: boolean;
  total: number;
  win: number;
  draw: number;
  lose: number;
  win_pct: number;
  draw_pct: number;
  lose_pct: number;
  top5: [string, number][];
}

interface BizhonggeV2Data {
  home_win: BzgV2Direction;
  draw: BzgV2Direction;
  away_win: BzgV2Direction;
}

interface XiaofengData {
  direction: string;
  confidence: string;
  top_scores?: string[];
}

interface TodayMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_time: string;
  spf_odds: string;
  rspf_odds: string;
  handicap: number;
  poisson: PoissonData;
  v42: V42Data;
  bizhongge_v2: BizhonggeV2Data | null;
  xiaofeng: XiaofengData;
}

interface TodayData {
  date: string;
  total: number;
  bizhongge_pass: number;
  matches: TodayMatch[];
}

interface HistoryMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_time: string;
  spf_odds: string;
  rspf_odds: string;
  handicap: number;
  actual_score: string;
  result_label: string;
  direction_label: string;
  top3_scores: string[];
  direction_hit: boolean;
  score_hit: boolean;
  half_score?: string;
}

interface HistoryDay {
  date: string;
  total?: number;
  direction_hits?: number;
  direction_total?: number;
  direction_rate?: string;
  score_hits?: number;
  score_total?: number;
  score_rate?: string;
  matches: HistoryMatch[];
}

interface HistoryData {
  days: HistoryDay[];
}

// ===== API 原始返回类型（来自 /api/sporttery/matches?type=all）=====
interface ApiPoissonResult {
  top5?: { score: string; prob: number }[];
  homeWinProb?: number;
  drawProb?: number;
  awayWinProb?: number;
  lambdaHome?: number;
  lambdaAway?: number;
  matrix?: number[][];
  // 兼容可能的 snake_case 格式
  lambda_h?: number;
  lambda_a?: number;
  top3?: PoissonTop[];
  spf_prob?: { home: number; draw: number; away: number };
}

interface ApiV42Result {
  tLevel?: string;
  tLabel?: string;
  starLevel?: string;    // 钻石 / 金 / 银 / 铜 / 铁 / 无星
  starCount?: number;
  direction?: string;
  spfCR?: number;
  rspfCR?: number;
  crossCR?: number;
  line0?: string;
  goldenScores?: { score: string; odds: number }[];
}

interface ApiSportteryMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  match_time: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  handicap: number;
  score_odds?: Array<{ score: string; odds: number }>;
  poisson?: ApiPoissonResult | null;
  v42?: ApiV42Result | null;
}

// ===== bizhongge_data.json 类型 =====
interface BizhonggeRawMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  handicap: number;
  spf_odds: string;
  bizhongge: BizhonggeV2Data;
}

interface BizhonggeRawData {
  date: string;
  total_matches: number;
  source: string;
  matches: BizhonggeRawMatch[];
}

// ===== 星级颜色 =====
const starColors: Record<string, string> = {
  "钻石": "text-cyan-300 bg-cyan-900/40 border-cyan-400/60",
  "金星": "text-amber-300 bg-amber-900/40 border-amber-400/60",
  "银星": "text-gray-200 bg-gray-700/40 border-gray-300/50",
  "铜星": "text-orange-300 bg-orange-900/40 border-orange-500/60",
  "铁星": "text-gray-400 bg-gray-800/40 border-gray-500/40",
  "无星": "text-gray-500 bg-gray-800/30 border-gray-700/40",
};

const bzgDominantColors: Record<string, string> = {
  "home_win": "text-red-400 bg-red-900/30 border-red-500/50",
  "draw": "text-amber-400 bg-amber-900/30 border-amber-500/50",
  "away_win": "text-blue-400 bg-blue-900/30 border-blue-500/50",
};

const confidenceColors: Record<string, string> = {
  "高": "text-emerald-400",
  "中": "text-amber-400",
  "低": "text-gray-400",
  "不推荐": "text-gray-600",
};

// ===== 辅助函数 =====

// starLevel（钻石/金/银/铜/铁/无星）→ star_name（钻石/金星/银星/铜星/铁星/无星）
function normalizeStarName(starLevel: string): string {
  if (!starLevel) return "无星";
  if (starLevel === "钻石" || starLevel === "钻石星") return "钻石";
  if (starLevel === "金" || starLevel === "金星") return "金星";
  if (starLevel === "银" || starLevel === "银星") return "银星";
  if (starLevel === "铜" || starLevel === "铜星") return "铜星";
  if (starLevel === "铁" || starLevel === "铁星") return "铁星";
  return "无星";
}

// 计算返还率
function calcRv(home: number, draw: number, away: number): number {
  if (home <= 0 || draw <= 0 || away <= 0) return 0.88;
  return 1 / (1 / home + 1 / draw + 1 / away);
}

// 计算让球方向
function calcRspfDirection(rspfHome: number, rspfDraw: number, rspfAway: number): string {
  const min = Math.min(rspfHome || 999, rspfDraw || 999, rspfAway || 999);
  if (min === rspfHome) return "主胜(让)";
  if (min === rspfAway) return "客胜(让)";
  return "平局(让)";
}

// 将 API poisson 结果适配为 UI 期望格式
function adaptPoisson(apiPoisson: ApiPoissonResult | null | undefined): PoissonData {
  if (!apiPoisson) {
    return {
      lambda_h: 0,
      lambda_a: 0,
      top3: [],
      spf_prob: { home: 0, draw: 0, away: 0 },
    };
  }

  // 如果已经是 snake_case 格式（未来API升级后）
  if (apiPoisson.lambda_h !== undefined && apiPoisson.top3) {
    return {
      lambda_h: apiPoisson.lambda_h,
      lambda_a: apiPoisson.lambda_a ?? 0,
      top3: apiPoisson.top3,
      spf_prob: apiPoisson.spf_prob,
    };
  }

  // 从 calculatePoisson 的返回格式转换
  const lambdaH = apiPoisson.lambdaHome ?? apiPoisson.lambda_h ?? 0;
  const lambdaA = apiPoisson.lambdaAway ?? apiPoisson.lambda_a ?? 0;

  // top5 → top3，prob 转为百分比字符串
  const top5 = apiPoisson.top5 || [];
  const top3: PoissonTop[] = top5.slice(0, 3).map(item => ({
    score: item.score,
    prob: (item.prob * 100).toFixed(1) + "%",
  }));

  const spfProb = apiPoisson.spf_prob || {
    home: Math.round((apiPoisson.homeWinProb ?? 0) * 1000) / 10,
    draw: Math.round((apiPoisson.drawProb ?? 0) * 1000) / 10,
    away: Math.round((apiPoisson.awayWinProb ?? 0) * 1000) / 10,
  };

  return {
    lambda_h: lambdaH,
    lambda_a: lambdaA,
    top3,
    spf_prob: spfProb,
  };
}

// 将 API v42 结果适配为 UI 期望格式
function adaptV42(
  apiV42: ApiV42Result | null | undefined,
  m: ApiSportteryMatch
): V42Data {
  if (!apiV42) {
    return {
      direction: "无",
      star: 0,
      star_name: "无星",
      rspf_direction: calcRspfDirection(m.rspf_home, m.rspf_draw, m.rspf_away),
      rv: calcRv(m.spf_home, m.spf_draw, m.spf_away),
      golden_scores: [],
    };
  }

  const starName = normalizeStarName(apiV42.starLevel || "无星");
  const goldenScores = (apiV42.goldenScores || []).map(s => s.score);

  return {
    direction: apiV42.direction || "无",
    star: apiV42.starCount ?? 0,
    star_name: starName,
    rspf_direction: calcRspfDirection(m.rspf_home, m.rspf_draw, m.rspf_away),
    rv: calcRv(m.spf_home, m.spf_draw, m.spf_away),
    golden_scores: goldenScores,
    t_level: apiV42.tLevel,
    cross_cr: apiV42.crossCR,
  };
}

// 根据 v42 数据计算小丰综合
function calcXiaofeng(v42: V42Data, goldenScores?: string[]): XiaofengData {
  // star 为 0 或 direction 为"无" → 不推荐
  if (v42.star === 0 || v42.direction === "无" || !v42.direction) {
    return {
      direction: "不推荐",
      confidence: "不推荐",
      top_scores: [],
    };
  }

  let confidence = "低";
  if (v42.star >= 4) {
    confidence = "高";
  } else if (v42.star >= 2) {
    confidence = "中";
  }

  return {
    direction: v42.direction,
    confidence,
    top_scores: goldenScores || v42.golden_scores || [],
  };
}

// 将 API 比赛数据 + bizhongge 数据合并为 TodayMatch
function buildTodayMatch(
  apiMatch: ApiSportteryMatch,
  bzgMap: Record<string, BizhonggeV2Data>
): TodayMatch {
  const poisson = adaptPoisson(apiMatch.poisson);
  const v42 = adaptV42(apiMatch.v42, apiMatch);
  const bizhongge_v2 = bzgMap[apiMatch.match_no] || null;
  const xiaofeng = calcXiaofeng(v42);

  const spf_odds = `${apiMatch.spf_home.toFixed(2)}/${apiMatch.spf_draw.toFixed(2)}/${apiMatch.spf_away.toFixed(2)}`;
  const rspf_odds = `${apiMatch.rspf_home?.toFixed(2) || "-"}/${apiMatch.rspf_draw?.toFixed(2) || "-"}/${apiMatch.rspf_away?.toFixed(2) || "-"}`;

  return {
    match_no: apiMatch.match_no,
    league: apiMatch.league,
    home_team: apiMatch.home_team,
    away_team: apiMatch.away_team,
    match_time: `${apiMatch.match_date?.slice(5) || ""} ${apiMatch.match_time?.slice(0, 5) || ""}`.trim(),
    spf_odds,
    rspf_odds,
    handicap: apiMatch.handicap,
    poisson,
    v42,
    bizhongge_v2,
    xiaofeng,
  };
}

// ===== 组件 =====
export default function AnalysisPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [expandedBzg, setExpandedBzg] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // 并行获取：实时比赛数据（含poisson+v42）、必中哥数据、历史数据
      const [matchRes, bzgRes, hRes] = await Promise.all([
        fetch("/api/sporttery/matches?type=all"),
        fetch("/data/bizhongge_data.json").catch(() => null),
        fetch("/data/analysis_history.json").catch(() => null),
      ]);

      if (!matchRes.ok) throw new Error("比赛数据加载失败");
      const matchData = await matchRes.json();
      if (!matchData.success) throw new Error(matchData.message || "比赛数据加载失败");
      const apiMatches: ApiSportteryMatch[] = matchData.data || [];

      // 解析必中哥数据
      let bzgMap: Record<string, BizhonggeV2Data> = {};
      if (bzgRes && bzgRes.ok) {
        try {
          const bzgData: BizhonggeRawData = await bzgRes.json();
          if (bzgData.matches && Array.isArray(bzgData.matches)) {
            for (const m of bzgData.matches) {
              if (m.match_no && m.bizhongge) {
                bzgMap[m.match_no] = m.bizhongge;
              }
            }
          }
        } catch (e) {
          console.warn("必中哥数据解析失败:", e);
        }
      }

      // 合并数据
      const matches: TodayMatch[] = apiMatches.map(m => buildTodayMatch(m, bzgMap));

      // 统计必中哥通过数
      const bzgPass = matches.filter(m => {
        const bv2 = m.bizhongge_v2;
        if (!bv2) return false;
        return Math.max(bv2.home_win.win_pct, bv2.draw.draw_pct, bv2.away_win.lose_pct) >= 40;
      }).length;

      const today: TodayData = {
        date: apiMatches.length > 0 ? (apiMatches[0].match_date || new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10),
        total: matches.length,
        bizhongge_pass: bzgPass,
        matches,
      };
      setTodayData(today);

      // 历史数据
      if (hRes && hRes.ok) {
        try {
          const h = await hRes.json();
          setHistoryData(h);
          if (h.days && h.days.length > 0) {
            setSelectedDate(h.days[h.days.length - 1].date);
          }
        } catch (e) {
          console.warn("历史数据解析失败:", e);
        }
      }
    } catch (e: any) {
      setError(e.message || "数据加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 筛选后的今日比赛
  const filteredMatches = useMemo(() => {
    if (!todayData?.matches) return [];
    let list = [...todayData.matches];
    if (filter === "bzg_pass") {
      list = list.filter(m => {
        const bv2 = m.bizhongge_v2;
        if (!bv2) return false;
        return Math.max(bv2.home_win.win_pct, bv2.draw.draw_pct, bv2.away_win.lose_pct) >= 40;
      });
    } else if (filter === "high_conf") {
      list = list.filter(m => m.xiaofeng.confidence === "高");
    } else if (filter === "silver_plus") {
      const highStars = ["钻石", "金星", "银星"];
      list = list.filter(m => highStars.includes(m.v42.star_name));
    }
    return list;
  }, [todayData, filter]);

  // 选中的历史日
  const selectedDay = useMemo(() => {
    if (!historyData?.days || !selectedDate) return null;
    return historyData.days.find(d => d.date === selectedDate) || null;
  }, [historyData, selectedDate]);

  // 今日统计
  const stats = useMemo(() => {
    if (!todayData?.matches) return { total: 0, bzgPass: 0, highConf: 0, silverPlus: 0 };
    const matches = todayData.matches;
    const highStars = ["钻石", "金星", "银星"];
    return {
      total: matches.length,
      bzgPass: matches.filter(m => {
        const bv2 = m.bizhongge_v2;
        if (!bv2) return false;
        return Math.max(bv2.home_win.win_pct, bv2.draw.draw_pct, bv2.away_win.lose_pct) >= 40;
      }).length,
      highConf: matches.filter(m => m.xiaofeng.confidence === "高").length,
      silverPlus: matches.filter(m => highStars.includes(m.v42.star_name)).length,
    };
  }, [todayData]);

  const toggleBzg = (key: string) => {
    setExpandedBzg(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-gray-200 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <span>加载分析数据中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-gray-200 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />返回首页
          </button>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-200">
      {/* 顶部栏 */}
      <div className="bg-[#1a1a2e] border-b border-gray-700/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">返回</span>
              </button>
              <h1 className="text-base md:text-lg font-semibold text-white">全维度分析</h1>
            </div>
            <div className="flex items-center gap-2">
              {todayData && (
                <span className="text-xs text-gray-500 hidden sm:inline">{todayData.date}</span>
              )}
            </div>
          </div>
        </div>
        {/* Tab 切换 */}
        <div className="max-w-7xl mx-auto px-3 md:px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "today"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              今日分析
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              历史回查
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 md:p-4 space-y-4">
        {activeTab === "today" && todayData && (
          <>
            {/* 统计条 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <div className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-500">总场次</div>
                <div className="text-lg md:text-xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="bg-[#1a1a2e] border border-orange-700/40 rounded-lg px-3 py-2">
                <div className="text-xs text-orange-500">必中哥V2</div>
                <div className="text-lg md:text-xl font-bold text-orange-400">{stats.bzgPass}</div>
              </div>
              <div className="bg-[#1a1a2e] border border-amber-700/40 rounded-lg px-3 py-2">
                <div className="text-xs text-amber-500">高信心</div>
                <div className="text-lg md:text-xl font-bold text-amber-400">{stats.highConf}</div>
              </div>
              <div className="bg-[#1a1a2e] border border-purple-700/40 rounded-lg px-3 py-2">
                <div className="text-xs text-purple-400">银星以上</div>
                <div className="text-lg md:text-xl font-bold text-purple-300">{stats.silverPlus}</div>
              </div>
            </div>

            {/* 筛选 */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "全部" },
                { key: "bzg_pass", label: "必中哥V2" },
                { key: "high_conf", label: "高信心" },
                { key: "silver_plus", label: "银星以上" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    filter === f.key
                      ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                      : "bg-[#1a1a2e] border-gray-700 text-gray-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 比赛列表 */}
            <div className="space-y-3">
              {filteredMatches.length === 0 && (
                <div className="text-center py-12 text-gray-500">没有符合条件的比赛</div>
              )}
              {filteredMatches.map((m, idx) => (
                <TodayMatchCard key={m.match_no || idx} match={m} expanded={!!expandedBzg[m.match_no]} onToggleBzg={() => toggleBzg(m.match_no)} />
              ))}
            </div>
          </>
        )}

        {activeTab === "history" && historyData && (
          <HistoryTab
            days={historyData.days}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedDay={selectedDay}
          />
        )}
      </div>
    </div>
  );
}

// ===== 今日比赛卡片 =====
function TodayMatchCard({ match, expanded, onToggleBzg }: { match: TodayMatch; expanded: boolean; onToggleBzg: () => void }) {
  const bv2 = match.bizhongge_v2;
  const bzgDominant = bv2 ? (
    bv2.home_win.win_pct >= bv2.draw.draw_pct && bv2.home_win.win_pct >= bv2.away_win.lose_pct ? "home_win" :
    bv2.draw.draw_pct >= bv2.away_win.lose_pct ? "draw" : "away_win"
  ) : null;
  const bzgDominantPct = bv2 && bzgDominant ? (
    bzgDominant === "home_win" ? bv2.home_win.win_pct :
    bzgDominant === "draw" ? bv2.draw.draw_pct : bv2.away_win.lose_pct
  ) : 0;
  const bzgDominantLabel: Record<string, string> = { home_win: "主胜", draw: "平局", away_win: "客胜" };
  const bzgDominantTop5 = bv2 && bzgDominant ? (
    bzgDominant === "home_win" ? bv2.home_win.top5 :
    bzgDominant === "draw" ? bv2.draw.top5 : bv2.away_win.top5
  ) : [];
  return (
    <div className={`bg-[#1a1a2e] border rounded-lg overflow-hidden transition-all ${
      bzgDominantPct >= 40 ? "border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.1)]" : "border-gray-700/50"
    }`}>
      {/* 卡片头部 */}
      <div className="px-3 py-2 border-b border-gray-700/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-cyan-400 shrink-0">{match.match_no}</span>
          <span className="text-xs text-gray-500 shrink-0">{match.league}</span>
          <span className="text-xs text-gray-500 shrink-0">{match.match_time}</span>
        </div>
        <div className="text-sm font-semibold text-white truncate text-right">
          {match.home_team} <span className="text-gray-500 mx-1">vs</span> {match.away_team}
        </div>
      </div>

      {/* 四维面板 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-700/30">
        {/* 泊松 */}
        <div className="bg-[#1a1a2e] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-300">泊松分析</span>
          </div>
          <div className="text-xs text-gray-400 mb-1.5">
            预期进球 <span className="text-cyan-300 font-mono">λ={match.poisson.lambda_h}</span> vs <span className="text-cyan-300 font-mono">{match.poisson.lambda_a}</span>
          </div>
          <div className="space-y-1 mb-2">
            <div className="text-xs text-gray-500">Top3预测</div>
            {match.poisson.top3.length > 0 ? (
              match.poisson.top3.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-cyan-300">{t.score}</span>
                  <span className="text-gray-400">{t.prob}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-600">暂无数据</div>
            )}
          </div>
          {match.poisson.spf_prob && (match.poisson.spf_prob.home > 0 || match.poisson.spf_prob.draw > 0 || match.poisson.spf_prob.away > 0) && (() => {
            const sp = match.poisson.spf_prob;
            const maxP = Math.max(sp.home, sp.draw, sp.away);
            const spfRec = maxP === sp.home ? "主胜" : maxP === sp.away ? "客胜" : "平局";
            const recColor = spfRec === "主胜" ? "text-red-400" : spfRec === "客胜" ? "text-blue-400" : "text-amber-400";
            return (
              <div className="pt-1.5 border-t border-gray-700/50">
                <div className="text-[10px] text-gray-500 mb-1">胜平负概率</div>
                <div className="flex items-center gap-1 text-[10px] mb-1">
                  <span className="text-red-400">胜{sp.home}%</span>
                  <span className="text-amber-400">平{sp.draw}%</span>
                  <span className="text-blue-400">负{sp.away}%</span>
                </div>
                <div className="text-[10px]">
                  推荐: <span className={`font-semibold ${recColor}`}>{spfRec}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* V4.2 */}
        <div className="bg-[#1a1a2e] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">V4.2分析</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-sm font-semibold ${match.v42.direction === "主胜" ? "text-red-300" : match.v42.direction === "客胜" ? "text-blue-300" : match.v42.direction === "平局" ? "text-amber-300" : "text-purple-200"}`}>
              {match.v42.direction}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${starColors[match.v42.star_name] || "text-gray-400 border-gray-600"}`}>
              {match.v42.star_name}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 mb-1">
            胜平负推荐: <span className={`font-medium ${match.v42.direction === "主胜" ? "text-red-400" : match.v42.direction === "客胜" ? "text-blue-400" : match.v42.direction === "平局" ? "text-amber-400" : "text-gray-400"}`}>{match.v42.direction}</span>
          </div>
          <div className="text-xs text-gray-400 mb-1">
            让球方向: <span className="text-purple-300">{match.v42.rspf_direction}</span>
          </div>
          <div className="text-xs text-gray-500 mb-1.5">
            返还率: <span className="text-gray-300">{(match.v42.rv * 100).toFixed(1)}%</span>
          </div>
          {match.v42.golden_scores && match.v42.golden_scores.length > 0 && (
            <>
              <div className="text-[10px] text-gray-500 mb-0.5">🏆 黄金比分</div>
              <div className="flex gap-1.5 flex-wrap">
                {match.v42.golden_scores.map((s, i) => (
                  <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-600/50">
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 必中哥V2 · 刻舟求剑 */}
        <div className="bg-[#1a1a2e] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-medium text-orange-300">必中哥V2</span>
            </div>
            {bzgDominant && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${bzgDominantColors[bzgDominant] || ""}`}>
                {bzgDominantLabel[bzgDominant]} {bzgDominantPct}%
              </span>
            )}
          </div>
          {bv2 ? (
            <>
              <div className="space-y-1.5 mb-1.5">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-5 text-red-400">胜</span>
                  <div className="flex-1 bg-gray-700/30 rounded-full h-3 relative">
                    <div className="bg-red-500/50 h-3 rounded-full" style={{ width: `${bv2.home_win.win_pct}%` }}></div>
                  </div>
                  <span className="w-10 text-right text-red-300 font-mono">{bv2.home_win.win_pct}%</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-5 text-amber-400">平</span>
                  <div className="flex-1 bg-gray-700/30 rounded-full h-3 relative">
                    <div className="bg-amber-500/50 h-3 rounded-full" style={{ width: `${bv2.draw.draw_pct}%` }}></div>
                  </div>
                  <span className="w-10 text-right text-amber-300 font-mono">{bv2.draw.draw_pct}%</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="w-5 text-blue-400">负</span>
                  <div className="flex-1 bg-gray-700/30 rounded-full h-3 relative">
                    <div className="bg-blue-500/50 h-3 rounded-full" style={{ width: `${bv2.away_win.lose_pct}%` }}></div>
                  </div>
                  <span className="w-10 text-right text-blue-300 font-mono">{bv2.away_win.lose_pct}%</span>
                </div>
              </div>
              <button
                onClick={onToggleBzg}
                className="w-full text-left text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? "收起Top5" : `Top5比分`}
              </button>
              {expanded && bzgDominantTop5.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-700/50 space-y-0.5">
                  <div className="text-[10px] text-gray-500 mb-1">{bzgDominant ? bzgDominantLabel[bzgDominant] : ''}方向 · 查史{bzgDominant ? bv2[bzgDominant]?.total || 0 : 0}场</div>
                  {bzgDominantTop5.map(([score, count], i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-orange-300">{score}</span>
                      <span className="text-gray-400">{count}场</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-gray-500 py-4 text-center">暂无数据</div>
          )}
        </div>

        {/* 小丰综合 */}
        <div className="bg-[#1a1a2e] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15 9L22 9L16 13L18 20L12 16L6 20L8 13L2 9L9 9L12 2Z"/>
              </svg>
              <span className="text-xs font-medium text-amber-300">小丰综合</span>
            </div>
            <span className={`text-[10px] font-medium ${confidenceColors[match.xiaofeng.confidence] || ""}`}>
              信心{match.xiaofeng.confidence}
            </span>
          </div>
          <div className="text-[10px] text-gray-500 mb-0.5">胜平负推荐</div>
          <div className={`text-sm font-semibold mb-1.5 ${match.xiaofeng.direction === "主胜" ? "text-red-300" : match.xiaofeng.direction === "客胜" ? "text-blue-300" : match.xiaofeng.direction === "平局" ? "text-amber-300" : "text-gray-400"}`}>
            {match.xiaofeng.direction}
          </div>
          {match.xiaofeng.top_scores && match.xiaofeng.top_scores.length > 0 && (
            <>
              <div className="text-xs text-gray-500 mb-1">推荐比分</div>
              <div className="flex gap-1.5 flex-wrap">
                {match.xiaofeng.top_scores.map((s, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-700/40">
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 历史回查 Tab =====
function HistoryTab({
  days,
  selectedDate,
  onSelectDate,
  selectedDay,
}: {
  days: HistoryDay[];
  selectedDate: string;
  onSelectDate: (d: string) => void;
  selectedDay: HistoryDay | null;
}) {
  // 简单统计
  const dayStats = useMemo(() => {
    if (!selectedDay) return { total: 0, dirHits: 0, dirRate: "0%", scoreHits: 0, scoreRate: "0%" };
    const matches = selectedDay.matches || [];
    const dirHits = matches.filter(m => m.direction_hit).length;
    const scoreHits = matches.filter(m => m.score_hit).length;
    const total = matches.length;
    return {
      total,
      dirHits,
      dirRate: total > 0 ? ((dirHits / total) * 100).toFixed(1) + "%" : "0%",
      scoreHits,
      scoreRate: total > 0 ? ((scoreHits / total) * 100).toFixed(1) + "%" : "0%",
    };
  }, [selectedDay]);

  return (
    <div className="space-y-4">
      {/* 日期选择 */}
      <div className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-gray-300">选择日期</span>
          <span className="text-xs text-gray-500">（共{days.length}天数据）</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map((d, i) => (
            <button
              key={d.date || i}
              onClick={() => onSelectDate(d.date)}
              className={`shrink-0 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                selectedDate === d.date
                  ? "bg-cyan-500/20 border-cyan-500/60 text-cyan-300"
                  : "bg-[#0f0f1a] border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              <div className="font-medium">{d.date?.slice(5)}</div>
              <div className="text-[10px] opacity-70">{d.matches?.length || 0}场</div>
            </button>
          ))}
        </div>
      </div>

      {/* 当日汇总 */}
      {selectedDay && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <div className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-3 py-2">
            <div className="text-xs text-gray-500">总场次</div>
            <div className="text-lg font-bold text-white">{dayStats.total}</div>
          </div>
          <div className="bg-[#1a1a2e] border border-emerald-700/40 rounded-lg px-3 py-2">
            <div className="text-xs text-emerald-500">方向命中</div>
            <div className="text-lg font-bold text-emerald-400">
              {dayStats.dirHits}/{dayStats.total}
            </div>
            <div className="text-xs text-emerald-300/70">{dayStats.dirRate}</div>
          </div>
          <div className="bg-[#1a1a2e] border border-amber-700/40 rounded-lg px-3 py-2">
            <div className="text-xs text-amber-500">比分命中</div>
            <div className="text-lg font-bold text-amber-400">
              {dayStats.scoreHits}/{dayStats.total}
            </div>
            <div className="text-xs text-amber-300/70">{dayStats.scoreRate}</div>
          </div>
          <div className="bg-[#1a1a2e] border border-purple-700/40 rounded-lg px-3 py-2">
            <div className="text-xs text-purple-400">日期</div>
            <div className="text-sm font-bold text-purple-200">{selectedDay.date}</div>
          </div>
        </div>
      )}

      {/* 比赛列表 */}
      {selectedDay && (
        <div className="space-y-3">
          {selectedDay.matches?.map((m, idx) => (
            <HistoryMatchCard key={m.match_no || idx} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== 历史比赛卡片（四维对比） =====
function HistoryMatchCard({ match }: { match: HistoryMatch }) {
  return (
    <div className={`bg-[#1a1a2e] border rounded-lg overflow-hidden ${
      match.direction_hit ? "border-emerald-600/40" : "border-gray-700/50"
    }`}>
      {/* 头部 */}
      <div className={`px-3 py-2 border-b border-gray-700/50 flex items-center justify-between gap-2 ${
        match.direction_hit ? "bg-emerald-900/10" : match.score_hit ? "bg-amber-900/10" : ""
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          {match.direction_hit ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <X className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-mono text-cyan-400 shrink-0">{match.match_no}</span>
          <span className="text-xs text-gray-500 shrink-0">{match.league}</span>
          <span className="text-xs text-gray-500 shrink-0">{match.match_time}</span>
        </div>
        <div className="text-sm font-semibold text-white truncate text-right">
          {match.home_team} <span className="text-gray-500 mx-1">vs</span> {match.away_team}
        </div>
      </div>

      {/* 四维面板 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-700/30">
        {/* 泊松 */}
        <div className="bg-[#1a1a2e] p-2.5">
          <div className="flex items-center gap-1 mb-1.5">
            <BarChart3 className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-medium text-cyan-300">泊松分析</span>
          </div>
          <div className="text-[11px] text-gray-500 mb-1">Top3预测</div>
          <div className="flex flex-wrap gap-1">
            {match.top3_scores?.slice(0, 3).map((s, i) => (
              <span
                key={i}
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                  match.score_hit && s === match.actual_score
                    ? "bg-amber-500/30 text-amber-200 border-amber-500"
                    : "bg-cyan-900/20 text-cyan-300 border-cyan-800/50"
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* V4.2/方向 */}
        <div className="bg-[#1a1a2e] p-2.5">
          <div className="flex items-center gap-1 mb-1.5">
            <Target className="w-3 h-3 text-purple-400" />
            <span className="text-[11px] font-medium text-purple-300">方向分析</span>
          </div>
          <div className="text-sm font-semibold text-purple-200 mb-1">{match.direction_label}</div>
          <div className="text-[11px] text-gray-400">赔率 {match.spf_odds}</div>
        </div>

        {/* 小丰综合 */}
        <div className="bg-[#1a1a2e] p-2.5">
          <div className="flex items-center gap-1 mb-1.5">
            <svg className="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15 9L22 9L16 13L18 20L12 16L6 20L8 13L2 9L9 9L12 2Z"/>
            </svg>
            <span className="text-[11px] font-medium text-amber-300">小丰综合</span>
          </div>
          <div className="text-sm font-semibold text-amber-200 mb-1">{match.direction_label}</div>
          <div className="flex gap-1">
            {match.top3_scores?.slice(0, 2).map((s, i) => (
              <span key={i} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-700/40">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* 实际赛果 */}
        <div className={`p-2.5 ${match.direction_hit ? "bg-emerald-900/20" : "bg-red-900/10"}`}>
          <div className="flex items-center gap-1 mb-1.5">
            <svg className={`w-3 h-3 ${match.direction_hit ? "text-emerald-400" : "text-red-400"}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className={`text-[11px] font-medium ${match.direction_hit ? "text-emerald-300" : "text-red-300"}`}>
              实际赛果
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-white mb-0.5">{match.actual_score}</div>
          <div className={`text-xs ${match.direction_hit ? "text-emerald-300" : "text-red-300"}`}>
            {match.result_label} {match.direction_hit ? "✅" : "❌"}
          </div>
          {match.score_hit && (
            <div className="text-[11px] text-amber-400 mt-0.5">🎯 比分命中</div>
          )}
        </div>
      </div>
    </div>
  );
}
