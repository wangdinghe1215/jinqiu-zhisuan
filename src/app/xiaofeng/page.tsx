"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Target,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Filter,
} from "lucide-react";

interface PoissonData {
  top5: { score: string; prob: number }[];
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  lambdaHome: number;
  lambdaAway: number;
}

interface V42Data {
  tLevel: string;
  tLabel: string;
  starLevel: string;
  starCount: number;
  direction: string;
  spfCR: number;
  rspfCR: number;
  crossCR: number;
  line0: string;
  goldenScores: { score: string; odds: number }[];
}

interface HistoryStat {
  odds: number;
  total: number;
  winRate: number;
  drawRate: number;
  loseRate: number;
  topScore: string;
  topScoreCount: number;
}

interface CombinedAnalysis {
  finalDirection: string;
  finalScore: number; // 0-100
  confidenceLevel: "推荐" | "参考" | "观望";
  recommendedScores: { score: string; reason: string }[];
  riskTips: string[];
  poissonScore: number;
  v42Score: number;
  historyScore: number;
  historyStat: HistoryStat | null;
}

interface Match {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_time: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  handicap: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  score_odds: { score: string; odds: number }[];
  poisson: PoissonData | null;
  v42: V42Data | null;
  combined: CombinedAnalysis | null;
}

type OddsType = "spf_home" | "spf_draw" | "spf_away";

function getStarScore(starLevel: string): number {
  switch (starLevel) {
    case "钻石": return 100;
    case "金": return 85;
    case "银": return 70;
    case "铜": return 55;
    case "铁": return 40;
    default: return 20;
  }
}

function getDirectionText(isHome: boolean): string {
  return isHome ? "主胜" : "客胜";
}

function getConfidenceColor(level: string): string {
  if (level === "推荐") return "border-green-500/60 bg-green-500/5";
  if (level === "参考") return "border-yellow-500/60 bg-yellow-500/5";
  return "border-gray-500/60 bg-gray-500/5";
}

function getConfidenceBadge(level: string): string {
  if (level === "推荐") return "bg-green-500/20 text-green-400 border-green-500/40";
  if (level === "参考") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  return "bg-gray-500/20 text-gray-400 border-gray-500/40";
}

function getConfidenceEmoji(level: string): string {
  if (level === "推荐") return "🟢";
  if (level === "参考") return "🟡";
  return "🔴";
}

export default function XiaofengPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "推荐" | "参考" | "观望">("all");
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // 加载历史数据（只加载主胜的，用于评分参考）
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/data/spf_home.json', { cache: 'force-cache' });
        if (res.ok) {
          const data = await res.json();
          setHistoryData(data);
        }
      } catch (e) {
        // ignore
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadHistory();
  }, []);

  // 从历史数据中查找同赔率的胜率
  const findHistoryStat = (odds: number, oddsType: OddsType): HistoryStat | null => {
    // 简化：只处理主胜赔率查询，其他方向暂不深入
    if (!historyData.length) return null;

    const target = oddsType === 'spf_home' ? odds : odds;
    // 查找相近赔率（±0.05）
    const matches = historyData.filter((r: any) => Math.abs(r.odds - target) <= 0.05);
    if (matches.length === 0) return null;

    // 聚合
    let total = 0, win = 0, draw = 0, lose = 0;
    const scoreMap: Record<string, number> = {};
    matches.forEach((r: any) => {
      total += r.total || 0;
      win += r.win || 0;
      draw += r.draw || 0;
      lose += r.lose || 0;
      (r.scores || []).forEach((s: any) => {
        scoreMap[s[0]] = (scoreMap[s[0]] || 0) + s[1];
      });
    });

    if (total === 0) return null;

    const sortedScores = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);

    return {
      odds: target,
      total,
      winRate: win / total,
      drawRate: draw / total,
      loseRate: lose / total,
      topScore: sortedScores[0]?.[0] || "-",
      topScoreCount: sortedScores[0]?.[1] || 0,
    };
  };

  // 计算综合分析
  const calculateCombined = (match: Match): CombinedAnalysis => {
    const p = match.poisson;
    const v = match.v42;

    const isHomeFav = match.spf_home < match.spf_away;
    const favOdds = isHomeFav ? match.spf_home : match.spf_away;

    // 1. 泊松评分（0-100）：热门方胜率越高分越高
    let poissonScore = 50;
    if (p) {
      const favProb = isHomeFav ? p.homeWinProb : p.awayWinProb;
      // 胜率 40%→50分，70%→90分
      poissonScore = Math.round(50 + (favProb - 0.4) * 133);
      poissonScore = Math.max(20, Math.min(100, poissonScore));
    }

    // 2. V4.2评分（0-100）：基于星级
    let v42Score = 40;
    if (v) {
      v42Score = getStarScore(v.starLevel);
      // CR加成
      if (v.crossCR > 120) v42Score = Math.min(100, v42Score + 5);
      else if (v.crossCR < 80) v42Score = Math.max(0, v42Score - 10);
    }

    // 3. 历史一致性评分（0-100）
    let historyScore = 60;
    let historyStat: HistoryStat | null = null;
    if (historyLoaded && historyData.length > 0 && favOdds > 0) {
      historyStat = findHistoryStat(favOdds, 'spf_home');
      if (historyStat) {
        const histWinRate = isHomeFav ? historyStat.winRate : historyStat.loseRate;
        // 历史胜率 40%→40分，65%→90分
        historyScore = Math.round(40 + (histWinRate - 0.4) * 200);
        historyScore = Math.max(20, Math.min(100, historyScore));
      }
    }

    // 综合评分：泊松30% + V4.2 40% + 历史30%
    const finalScore = Math.round(poissonScore * 0.3 + v42Score * 0.4 + historyScore * 0.3);

    // 最终方向
    let finalDirection = getDirectionText(isHomeFav);
    // 如果泊松和V4.2方向不一致，降低评分
    if (p && v) {
      const poissonDir = p.homeWinProb > p.awayWinProb ? "主胜" : "客胜";
      if (poissonDir !== v.direction) {
        // 方向冲突扣分
      }
    }

    // 信心等级
    let confidenceLevel: "推荐" | "参考" | "观望" = "观望";
    if (finalScore >= 70) confidenceLevel = "推荐";
    else if (finalScore >= 50) confidenceLevel = "参考";

    // 推荐比分Top3
    const recommendedScores: { score: string; reason: string }[] = [];
    const scoreRank: Record<string, number> = {};

    // 泊松top3
    if (p) {
      p.top5.slice(0, 3).forEach((s, i) => {
        scoreRank[s.score] = (scoreRank[s.score] || 0) + (3 - i) * 10;
      });
    }
    // V4.2黄金比分
    if (v) {
      v.goldenScores.slice(0, 2).forEach((s, i) => {
        scoreRank[s.score] = (scoreRank[s.score] || 0) + (2 - i) * 15;
      });
    }
    // 历史top
    if (historyStat?.topScore) {
      scoreRank[historyStat.topScore] = (scoreRank[historyStat.topScore] || 0) + 12;
    }

    const sorted = Object.entries(scoreRank).sort((a, b) => b[1] - a[1]);
    sorted.slice(0, 3).forEach(([score]) => {
      const reasons: string[] = [];
      if (p?.top5.find((t) => t.score === score)) reasons.push("泊松推荐");
      if (v?.goldenScores.find((g) => g.score === score)) reasons.push("黄金比分");
      if (historyStat?.topScore === score) reasons.push("历史最多");
      recommendedScores.push({ score, reason: reasons.join("·") || "综合推荐" });
    });

    // 风险提示
    const riskTips: string[] = [];
    if (p && ["0:0", "1:1", "2:2"].includes(p.top5[0]?.score)) {
      riskTips.push("泊松Top1为平局，平局预警");
    }
    if (v?.line0 !== "Lock" && v?.tLevel.startsWith("T2")) {
      riskTips.push("线0未锁定，冷门风险");
    }
    if (historyStat && historyStat.winRate < 0.5 && isHomeFav) {
      riskTips.push("同赔率历史胜率偏低");
    }
    if (match.spf_draw < 3.0) {
      riskTips.push("平赔较低，平局不可忽视");
    }
    if (riskTips.length === 0) {
      riskTips.push("暂无明显风险点");
    }

    return {
      finalDirection,
      finalScore,
      confidenceLevel,
      recommendedScores,
      riskTips,
      poissonScore,
      v42Score,
      historyScore,
      historyStat,
    };
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/sporttery/matches?type=all");
        const data = await res.json();
        if (data.success) {
          setMatches(data.data || []);
        } else {
          setError(data.error || "加载失败");
        }
      } catch (e: any) {
        setError(e.message || "网络错误");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 计算每一场的综合分析
  const matchesWithCombined = useMemoMatches(matches, calculateCombined, historyLoaded);

  const filtered = matchesWithCombined.filter((m) => {
    if (filter === "all") return true;
    return m.combined?.confidenceLevel === filter;
  });

  // 统计
  const stats = {
    total: matchesWithCombined.length,
    recommend: matchesWithCombined.filter((m) => m.combined?.confidenceLevel === "推荐").length,
    reference: matchesWithCombined.filter((m) => m.combined?.confidenceLevel === "参考").length,
    wait: matchesWithCombined.filter((m) => m.combined?.confidenceLevel === "观望").length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            小丰综合分析
          </h1>
          <p className="text-sm text-gray-400 mt-1">泊松 + V4.2 + 历史数据 三体系融合评分</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-purple-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            加载中...
          </div>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#1a1a2e] border border-[#2d3748] rounded-xl p-3">
          <div className="text-gray-400 text-xs">总场次</div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <div className="text-green-400 text-xs">🟢 推荐</div>
          <div className="text-2xl font-bold text-green-400 font-mono">{stats.recommend}</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
          <div className="text-yellow-400 text-xs">🟡 参考</div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">{stats.reference}</div>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-3">
          <div className="text-gray-400 text-xs">🔴 观望</div>
          <div className="text-2xl font-bold text-gray-400 font-mono">{stats.wait}</div>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {(["all", "推荐", "参考", "观望"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              filter === f
                ? "bg-purple-500 text-white"
                : "bg-[#1a1a2e] text-gray-400 hover:text-white border border-[#2d3748]"
            }`}
          >
            {f === "all" ? "全部" : f}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>今日暂无竞彩比赛在售</p>
        </div>
      )}

      {/* 比赛卡片 */}
      <div className="grid gap-4">
        {filtered.map((match) => {
          const c = match.combined!;
          const v = match.v42;
          const p = match.poisson;
          const isExpanded = expandedId === match.match_no;
          const drawAlert = p && ["0:0", "1:1", "2:2"].includes(p.top5[0]?.score);

          return (
            <div
              key={match.match_no}
              className={`bg-[#1a1a2e] border-2 rounded-xl overflow-hidden transition-all cursor-pointer ${getConfidenceColor(
                c.confidenceLevel
              )}`}
              onClick={() => setExpandedId(isExpanded ? null : match.match_no)}
            >
              <div className="p-4">
                {/* 头部 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-purple-400 font-bold">
                      {match.match_no}
                    </span>
                    <span className="text-xs text-gray-400 bg-[#0f0f1a] px-2 py-0.5 rounded">
                      {match.league}
                    </span>
                    {match.match_time && (
                      <span className="text-xs text-gray-500">{match.match_time}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${getConfidenceBadge(
                      c.confidenceLevel
                    )}`}
                  >
                    {getConfidenceEmoji(c.confidenceLevel)} {c.confidenceLevel}
                    <span className="ml-1 opacity-80">{c.finalScore}分</span>
                  </span>
                </div>

                {/* 对阵 + 最终方向 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-white font-semibold">{match.home_team}</div>
                    <div className="text-gray-500 text-xs">主队</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-lg font-bold text-purple-400">{c.finalDirection}</div>
                    <div className="text-gray-500 text-xs">综合结论</div>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-white font-semibold">{match.away_team}</div>
                    <div className="text-gray-500 text-xs">客队</div>
                  </div>
                </div>

                {/* 三体系对比表格 */}
                <div className="bg-[#0f0f1a] rounded-lg overflow-hidden mb-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2d3748]">
                        <th className="text-left text-gray-500 text-xs font-medium p-2 w-16">
                          维度
                        </th>
                        <th className="text-left text-cyan-400 text-xs font-medium p-2">
                          📊 泊松模型
                        </th>
                        <th className="text-left text-amber-400 text-xs font-medium p-2">
                          🎯 V4.2线0
                        </th>
                        <th className="text-left text-orange-400 text-xs font-medium p-2">
                          🔍 必中哥历史
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#2d3748]/50">
                        <td className="text-gray-400 text-xs p-2">方向</td>
                        <td className="text-white text-xs p-2">
                          {p
                            ? `${p.homeWinProb > p.awayWinProb ? "主胜" : "客胜"}(${Math.round(
                                Math.max(p.homeWinProb, p.awayWinProb) * 100
                              )}%)`
                            : "-"}
                        </td>
                        <td className="text-white text-xs p-2">
                          {v ? `${v.tLevel}${v.starLevel}-${v.direction}` : "-"}
                        </td>
                        <td className="text-white text-xs p-2">
                          {c.historyStat
                            ? `${c.finalDirection} ${(
                                (match.spf_home < match.spf_away
                                  ? c.historyStat.winRate
                                  : c.historyStat.loseRate) * 100
                              ).toFixed(1)}%胜率`
                            : "数据不足"}
                        </td>
                      </tr>
                      <tr className="border-b border-[#2d3748]/50">
                        <td className="text-gray-400 text-xs p-2">比分</td>
                        <td className="text-white text-xs p-2">
                          {p?.top5[0]
                            ? `${p.top5[0].score}(${(p.top5[0].prob * 100).toFixed(1)}%)`
                            : "-"}
                          {drawAlert && " ⚠️"}
                        </td>
                        <td className="text-white text-xs p-2">
                          {v?.goldenScores[0]
                            ? `黄金比分 ${v.goldenScores[0].score}`
                            : "-"}
                        </td>
                        <td className="text-white text-xs p-2">
                          {c.historyStat
                            ? `${c.historyStat.topScore} 出现${c.historyStat.topScoreCount}次/${c.historyStat.total}场`
                            : "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-gray-400 text-xs p-2">信号</td>
                        <td className="text-white text-xs p-2">
                          {drawAlert ? "平局预警⚠️" : p ? "正常" : "-"}
                        </td>
                        <td className="text-white text-xs p-2">
                          {v ? (v.line0 === "Lock" ? "线0 Lock" : "线0 Normal") : "-"}
                        </td>
                        <td className="text-white text-xs p-2">
                          {c.historyStat
                            ? `平赔${match.spf_draw} 历史${(c.historyStat.drawRate * 100).toFixed(1)}%平率`
                            : "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 综合评分条 */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">综合评分</span>
                    <span className="text-white font-bold">{c.finalScore}/100</span>
                  </div>
                  <div className="flex h-3 bg-[#0f0f1a] rounded overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
                      style={{ width: "30%", opacity: c.poissonScore / 100 }}
                      title={`泊松: ${c.poissonScore}分`}
                    />
                    <div
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 transition-all"
                      style={{ width: "40%", opacity: c.v42Score / 100 }}
                      title={`V4.2: ${c.v42Score}分`}
                    />
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                      style={{ width: "30%", opacity: c.historyScore / 100 }}
                      title={`历史: ${c.historyScore}分`}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1 text-gray-500">
                    <span>泊松 {c.poissonScore}</span>
                    <span>V4.2 {c.v42Score}</span>
                    <span>历史 {c.historyScore}</span>
                  </div>
                </div>

                {/* 推荐比分 */}
                {c.recommendedScores.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-purple-400" />
                      推荐比分 TOP{c.recommendedScores.length}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {c.recommendedScores.map((s, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-2 rounded-lg text-center"
                        >
                          <div className="text-white font-mono font-bold text-sm">{s.score}</div>
                          <div className="text-purple-300 text-[10px] mt-0.5 truncate">
                            {s.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#2d3748] space-y-3">
                    {/* 风险提示 */}
                    <div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                        <AlertTriangle className="w-3 h-3 text-orange-400" />
                        风险提示
                      </div>
                      <ul className="space-y-1">
                        {c.riskTips.map((tip, i) => (
                          <li key={i} className="text-xs text-orange-300 flex items-start gap-2">
                            <span>•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* SPF+RSPF赔率 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0f0f1a] p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-2">SPF</div>
                        <div className="grid grid-cols-3 gap-1 text-center text-xs">
                          <div>
                            <div className="text-red-400 font-mono font-bold">
                              {match.spf_home}
                            </div>
                            <div className="text-gray-500">主胜</div>
                          </div>
                          <div>
                            <div className="text-yellow-400 font-mono font-bold">
                              {match.spf_draw}
                            </div>
                            <div className="text-gray-500">平</div>
                          </div>
                          <div>
                            <div className="text-blue-400 font-mono font-bold">
                              {match.spf_away}
                            </div>
                            <div className="text-gray-500">客胜</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#0f0f1a] p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-2">
                          RSPF ({match.handicap > 0 ? "+" : ""}
                          {match.handicap})
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center text-xs">
                          <div>
                            <div className="text-red-400 font-mono font-bold">
                              {match.rspf_home || "-"}
                            </div>
                            <div className="text-gray-500">主胜</div>
                          </div>
                          <div>
                            <div className="text-yellow-400 font-mono font-bold">
                              {match.rspf_draw || "-"}
                            </div>
                            <div className="text-gray-500">平</div>
                          </div>
                          <div>
                            <div className="text-blue-400 font-mono font-bold">
                              {match.rspf_away || "-"}
                            </div>
                            <div className="text-gray-500">客胜</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-2 text-gray-500">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 辅助：useMemo 计算综合分析
function useMemoMatches(
  matches: Match[],
  calcFn: (m: Match) => CombinedAnalysis,
  deps: boolean
): (Match & { combined: CombinedAnalysis | null })[] {
  const [memoized, setMemoized] = useState<(Match & { combined: CombinedAnalysis | null })[]>([]);

  useEffect(() => {
    const result = matches.map((m) => ({
      ...m,
      combined: calcFn(m),
    }));
    setMemoized(result);
  }, [matches, deps]);

  return memoized;
}
