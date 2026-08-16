"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Calendar, BarChart3, Target, AlertTriangle, Swords, Check, X } from "lucide-react";

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
  golden_scores: string[];
}

interface BzgV2OddsItem {
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

interface BizhonggeV2 {
  home_win: BzgV2OddsItem;
  draw: BzgV2OddsItem;
  away_win: BzgV2OddsItem;
}

interface BzgCondition {
  name: string;
  detail: string;
  passed: boolean;
}

interface BizhonggeData {
  pass_count: number;
  total: number;
  verdict: string;
  conditions: BzgCondition[];
}

interface XiaofengData {
  direction: string;
  confidence: string;
  top_scores: string[];
  conclusion?: string;
  spf_pick?: string;
  rspf_pick?: string;
  total_goals?: number;
  half_time?: string;
  spf_score?: string;
  rspf_score?: string;
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
    spf_prob?: { home: number; draw: number; away: number };
  };
  v42: V42Data;
  bizhongge: BizhonggeData;
  bizhongge_v2?: BizhonggeV2;
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
      bzgPass: matches.filter(m => m.bizhongge_v2 !== undefined).length,
      highConf: matches.filter(m => m.xiaofeng.confidence === "高").length,
      silverPlus: matches.filter(m => highStars.includes(m.v42.star_name)).length,
    };
  }, [todayData]);

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
              <div className="bg-[#1a1a2e] border border-emerald-700/40 rounded-lg px-3 py-2">
                <div className="text-xs text-orange-400">刻舟求剑</div>
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

            {/* 简洁统计 */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400">
              <span>
                总场次：<span className="text-white font-semibold">{stats.total} 场</span>
              </span>
              <span>
                高信心（白银以上）：<span className="text-purple-300 font-semibold">{stats.silverPlus} 场</span>
              </span>
            </div>

            {/* 比赛列表 */}
            <div className="space-y-3">
              {todayData.matches.length === 0 && (
                <div className="text-center py-12 text-gray-500">暂无比赛数据</div>
              )}
              {todayData.matches.map((m, idx) => (
                <TodayMatchCard key={m.match_no || idx} match={m} />
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
function TodayMatchCard({ match }: { match: TodayMatch }) {
  const hasBzgV2 = match.bizhongge_v2 !== undefined;
  return (
    <div className={`bg-[#1a1a2e] border rounded-lg overflow-hidden transition-all ${
      hasBzgV2 ? "border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.1)]" : "border-gray-700/50"
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
          {match.poisson.spf_prob && (
            <div className="text-xs mb-2 flex items-center gap-1 flex-wrap">
              <span className="text-gray-500">SPF概率:</span>
              {(() => {
                const p = match.poisson.spf_prob;
                const max = Math.max(p.home, p.draw, p.away);
                return (
                  <>
                    <span className={p.home === max ? "text-cyan-300 font-semibold" : "text-gray-400"}>
                      主胜 {p.home}%
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className={p.draw === max ? "text-cyan-300 font-semibold" : "text-gray-400"}>
                      平 {p.draw}%
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className={p.away === max ? "text-cyan-300 font-semibold" : "text-gray-400"}>
                      客胜 {p.away}%
                    </span>
                  </>
                );
              })()}
            </div>
          )}
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Top3预测</div>
            {match.poisson.top3.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-300">{t.score}</span>
                <span className="text-gray-400">{t.prob}</span>
              </div>
            ))}
          </div>
          {match.poisson.spf_prob && (
            <div className="mt-1.5 pt-1.5 border-t border-gray-700/50">
              <div className="text-[10px] text-gray-500 mb-1">SPF概率</div>
              <div className="text-xs font-mono">
                {(() => {
                  const p = match.poisson.spf_prob;
                  const maxP = Math.max(p.home, p.draw, p.away);
                  return (
                    <>
                      <span className={p.home === maxP ? "text-cyan-300 font-bold" : "text-gray-400"}>
                        主{p.home.toFixed(1)}%
                      </span>
                      <span className="text-gray-600"> | </span>
                      <span className={p.draw === maxP ? "text-cyan-300 font-bold" : "text-gray-400"}>
                        平{p.draw.toFixed(1)}%
                      </span>
                      <span className="text-gray-600"> | </span>
                      <span className={p.away === maxP ? "text-cyan-300 font-bold" : "text-gray-400"}>
                        客{p.away.toFixed(1)}%
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
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
          {match.v42.golden_scores && match.v42.golden_scores.length > 0 && (
            <div className="mt-1.5">
              <div className="text-[10px] text-gray-500 mb-1">🎯 泊松预测比分</div>
              <div className="flex flex-wrap gap-1">
                {match.v42.golden_scores.map((s: string, i: number) => (
                  <span
                    key={i}
                    className="bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded px-1.5 py-0.5 text-xs font-mono"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 刻舟求剑 V2 */}
        <div className="bg-[#1a1a2e] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-medium text-orange-300">刻舟求剑 V2</span>
            </div>
            {hasBzgV2 ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-orange-500/50 text-orange-400 bg-orange-500/10">
                已分析
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-600 text-gray-500">
                无数据
              </span>
            )}
          </div>
          {match.bizhongge_v2 ? (
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-1 text-center">
                {(["home_win", "draw", "away_win"] as const).map((key) => {
                  const data = match.bizhongge_v2![key];
                  const label = key === "home_win" ? "主胜" : key === "draw" ? "平局" : "客胜";
                  const colorClass = key === "home_win" ? "text-red-400" : key === "draw" ? "text-yellow-400" : "text-blue-400";
                  const top3 = data.top5.slice(0, 3);
                  return (
                    <div key={key} className="bg-gray-900/40 rounded p-1.5">
                      <div className={`text-[10px] font-medium ${colorClass} mb-0.5`}>
                        {label}
                        {!data.exact_match && <span className="text-gray-500">*</span>}
                      </div>
                      <div className="text-xs font-mono font-bold text-white tabular-nums">
                        @{data.target_odds.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {data.total}场
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              key === "home_win" ? "bg-red-500/60" : key === "draw" ? "bg-yellow-500/60" : "bg-blue-500/60"
                            }`}
                            style={{ width: `${key === "home_win" ? data.win_pct : key === "draw" ? data.draw_pct : data.lose_pct}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-gray-400 font-mono">
                          {key === "home_win" ? `胜${data.win_pct}%` : key === "draw" ? `平${data.draw_pct}%` : `负${data.lose_pct}%`}
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-0.5 justify-center">
                        {top3.map(([score, cnt], i) => (
                          <span
                            key={i}
                            className="text-[9px] font-mono px-1 py-0.5 rounded bg-orange-900/20 text-orange-300 border border-orange-800/40"
                          >
                            {score}({cnt})
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-600 italic text-center py-2">
              暂无刻舟求剑数据
            </div>
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
          {match.xiaofeng.conclusion && (
            <div className="text-[11px] text-gray-400 mb-2 italic">
              💡 {match.xiaofeng.conclusion}
            </div>
          )}
          <div className="space-y-1.5 mb-2">
            <div className="text-xs flex items-center gap-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-900/40 text-emerald-300">SPF推荐</span>
              <span className="text-amber-300 font-medium">{match.xiaofeng.spf_pick || match.xiaofeng.direction}</span>
            </div>
            <div className="text-xs flex items-center gap-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-900/40 text-purple-300">RSPF推荐</span>
              <span className="text-amber-300 font-medium">{match.xiaofeng.rspf_pick || "—"}</span>
            </div>
          </div>
          <div className="mb-2 space-y-1">
            {match.xiaofeng.spf_score && (
              <div className="text-xs flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500">SPF比分:</span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-700/40">
                  {match.xiaofeng.spf_score}
                </span>
              </div>
            )}
            {match.xiaofeng.rspf_score && (
              <div className="text-xs flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500">RSPF比分:</span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/40">
                  {match.xiaofeng.rspf_score}
                </span>
              </div>
            )}
          </div>
          {match.xiaofeng.top_scores && match.xiaofeng.top_scores.length > 0 && !match.xiaofeng.spf_score && (
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">推荐比分</div>
              <div className="flex gap-1.5 flex-wrap">
                {match.xiaofeng.top_scores.map((s, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-700/40">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 pt-1.5 border-t border-gray-800/60">
            {match.xiaofeng.total_goals !== undefined && match.xiaofeng.total_goals !== null && (
              <span>⚽ {match.xiaofeng.total_goals}球</span>
            )}
            {match.xiaofeng.half_time && (
              <span>🕐 半场 {match.xiaofeng.half_time}</span>
            )}
          </div>
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
