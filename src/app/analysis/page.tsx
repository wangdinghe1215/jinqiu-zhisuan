"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Calendar, BarChart3, TrendingUp, Target, AlertTriangle, Check, X, ChevronDown, ChevronUp } from "lucide-react";

// ===== 类型定义 =====
interface PoissonTop {
  score: string;
  prob: string;
}

interface V42Data {
  direction: string;
  star: number;
  star_name: string;
  rspf_direction: string;
  rv: number;
  golden_scores?: string[];
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
  poisson: {
    lambda_h: number;
    lambda_a: number;
    top3: PoissonTop[];
  };
  v42: V42Data;
  bizhongge_v2: BizhonggeV2Data;
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

// ===== 星级颜色 =====
const starColors: Record<string, string> = {
  "钻石": "text-cyan-400 bg-cyan-900/30 border-cyan-500/50",
  "铂金": "text-blue-300 bg-blue-900/30 border-blue-500/50",
  "黄金": "text-amber-400 bg-amber-900/30 border-amber-500/50",
  "白银": "text-gray-300 bg-gray-800/50 border-gray-500/50",
  "青铜": "text-orange-400 bg-orange-900/30 border-orange-500/50",
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
};

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [tRes, hRes] = await Promise.all([
          fetch("/data/analysis_data.json"),
          fetch("/data/analysis_history.json"),
        ]);
        if (!tRes.ok) throw new Error("今日数据加载失败");
        const t = await tRes.json();
        setTodayData(t);
        if (hRes.ok) {
          const h = await hRes.json();
          // 按日期降序排列（最新在前）
          if (h.days && Array.isArray(h.days)) {
            h.days.sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
          }
          setHistoryData(h);
          if (h.days && h.days.length > 0) {
            setSelectedDate(h.days[0].date);
          }
        }
      } catch (e: any) {
        setError(e.message || "数据加载失败");
      } finally {
        setLoading(false);
      }
    };
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
      const highStars = ["钻石", "铂金", "黄金", "白银"];
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
    const highStars = ["钻石", "铂金", "黄金", "白银"];
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
                <div className="text-xs text-purple-400">白银以上</div>
                <div className="text-lg md:text-xl font-bold text-purple-300">{stats.silverPlus}</div>
              </div>
            </div>

            {/* 筛选 */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "全部" },
                { key: "bzg_pass", label: "必中哥V2" },
                { key: "high_conf", label: "高信心" },
                { key: "silver_plus", label: "白银以上" },
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
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Top3预测</div>
            {match.poisson.top3.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-300">{t.score}</span>
                <span className="text-gray-400">{t.prob}</span>
              </div>
            ))}
          </div>
        </div>

        {/* V4.2 */}
        <div className="bg-[#1a1a2e] p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">V4.2分析</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-semibold text-purple-200">{match.v42.direction}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${starColors[match.v42.star_name] || "text-gray-400 border-gray-600"}`}>
              {match.v42.star_name}
            </span>
          </div>
          <div className="text-xs text-gray-400 mb-1">
            让球方向: <span className="text-purple-300">{match.v42.rspf_direction}</span>
          </div>
          <div className="text-xs text-gray-500">
            返还率: <span className="text-gray-300">{(match.v42.rv * 100).toFixed(1)}%</span>
          </div>
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
          {bv2 && (
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
                  <div className="text-[10px] text-gray-500 mb-1">{bzgDominant && bzgDominantLabel[bzgDominant]}方向 · 查史{bv2[bzgDominant as keyof typeof bv2]?.total || 0}场</div>
                  {bzgDominantTop5.map(([score, count], i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-orange-300">{score}</span>
                      <span className="text-gray-400">{count}场</span>
                    </div>
                  ))}
                </div>
              )}
            </>
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
          <div className="text-sm font-semibold text-amber-200 mb-1.5">{match.xiaofeng.direction}</div>
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
          {match.v42.golden_scores && match.v42.golden_scores.length > 0 && (
            <>
              <div className="text-[10px] text-gray-500 mt-1.5 mb-1">黄金比分</div>
              <div className="flex gap-1 flex-wrap">
                {match.v42.golden_scores.map((s, i) => (
                  <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/20 text-cyan-300 border border-cyan-700/30">
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const getDayRateColor = (d: HistoryDay) => {
    const matches = d.matches || [];
    if (matches.length === 0) return "text-gray-500";
    const hits = matches.filter(m => m.direction_hit).length;
    const rate = hits / matches.length;
    if (rate >= 0.6) return "text-emerald-400";
    if (rate >= 0.3) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-4">
      {/* 日期选择 - 下拉列表 */}
      <div className="bg-[#1a1a2e] border border-gray-700/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-gray-300">选择日期</span>
          <span className="text-xs text-gray-500">（共{days.length}天数据）</span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#0f0f1a] border border-gray-700 rounded-lg hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">{selectedDate}</span>
              {selectedDay && (
                <span className={`text-xs ${getDayRateColor(selectedDay)}`}>
                  {selectedDay.matches?.length || 0}场 · 命中率{dayStats.dirRate}
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-[#16213e] border border-gray-700 rounded-lg shadow-xl z-50">
              {days.map((d, i) => {
                const matches = d.matches || [];
                const hits = matches.filter(m => m.direction_hit).length;
                const rate = matches.length > 0 ? ((hits / matches.length) * 100).toFixed(1) + "%" : "-";
                const isSelected = selectedDate === d.date;
                const colorCls = getDayRateColor(d);
                return (
                  <button
                    key={d.date || i}
                    onClick={() => { onSelectDate(d.date); setDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-200"
                        : "text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <span className="font-mono">{d.date}</span>
                    <span className={`text-xs ${colorCls}`}>
                      {matches.length}场 · {hits}中 · {rate}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
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
