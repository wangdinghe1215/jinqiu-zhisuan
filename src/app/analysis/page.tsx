"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Loader2, AlertCircle, TrendingUp, Target, Search, Brain, Zap, Shield, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

// ===== 类型定义 =====
interface SportteryMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  match_time: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  handicap: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  score_odds: { score: string; odds: number }[];
}

interface PoissonResult {
  lambda_h: number;
  lambda_a: number;
  top3: { score: string; prob: number }[];
  direction: "home" | "draw" | "away";
  direction_label: string;
}

interface V42Result {
  direction: "home" | "draw" | "away";
  direction_label: string;
  star_level: number; // 1-5
  star_label: string;
  rspf_direction: "home" | "draw" | "away";
  rspf_label: string;
}

interface BizhonggeResult {
  passed_conditions: string[];
  failed_conditions: string[];
  total_conditions: number;
  pass_count: number;
  level: "推荐" | "观望" | "放弃";
  is_recommended: boolean;
  dispersion: number; // 赔率离散度（标准差）
  consistency: boolean; // SPF/RSPF方向一致性
  high_draw_odds: boolean; // 平赔≥5.0稳胆因子
}

interface XiaofengResult {
  direction: "home" | "draw" | "away";
  direction_label: string;
  top2_scores: string[];
  confidence_level: "高" | "中" | "低";
  confidence_score: number;
  risk_tip: string;
  is_consensus: boolean; // 多体系是否一致
}

interface FullAnalysisMatch extends SportteryMatch {
  poisson: PoissonResult;
  v42: V42Result;
  bizhongge: BizhonggeResult;
  xiaofeng: XiaofengResult;
}

// ===== 分析计算函数 =====
const RETURN_RATE = 0.88;

// 泊松分布概率
function poissonProb(lambda: number, k: number): number {
  let result = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) {
    result = (result * lambda) / i;
  }
  return result;
}

function calcPoisson(match: SportteryMatch): PoissonResult {
  const { spf_home, spf_draw, spf_away, score_odds } = match;

  // 从赔率推导λ
  const lambda_h = -Math.log(1 / spf_away / RETURN_RATE);
  const lambda_a = -Math.log(1 / spf_home / RETURN_RATE);

  // 生成6x6比分概率矩阵
  const scores: { score: string; prob: number }[] = [];
  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      const prob = poissonProb(lambda_h, h) * poissonProb(lambda_a, a);
      scores.push({ score: `${h}:${a}`, prob });
    }
  }

  // 排序取Top3
  scores.sort((a, b) => b.prob - a.prob);
  const top3 = scores.slice(0, 3);

  // 推导方向
  let homeProb = 0, drawProb = 0, awayProb = 0;
  for (let h = 0; h <= 5; h++) {
    for (let a = 0; a <= 5; a++) {
      const p = poissonProb(lambda_h, h) * poissonProb(lambda_a, a);
      if (h > a) homeProb += p;
      else if (h === a) drawProb += p;
      else awayProb += p;
    }
  }

  let direction: "home" | "draw" | "away";
  let direction_label: string;
  if (homeProb >= drawProb && homeProb >= awayProb) {
    direction = "home";
    direction_label = "主胜";
  } else if (awayProb >= drawProb && awayProb >= homeProb) {
    direction = "away";
    direction_label = "客胜";
  } else {
    direction = "draw";
    direction_label = "平局";
  }

  return { lambda_h, lambda_a, top3, direction, direction_label };
}

function calcV42(match: SportteryMatch): V42Result {
  const { spf_home, spf_draw, spf_away, rspf_home, rspf_draw, rspf_away } = match;

  // SPF方向
  let direction: "home" | "draw" | "away";
  let direction_label: string;
  if (spf_home <= spf_draw && spf_home <= spf_away) {
    direction = "home";
    direction_label = "主胜";
  } else if (spf_away <= spf_draw && spf_away <= spf_home) {
    direction = "away";
    direction_label = "客胜";
  } else {
    direction = "draw";
    direction_label = "平局";
  }

  // 星级：低赔方赔率越低星越高
  const favOdds = Math.min(spf_home, spf_draw, spf_away);
  let star_level = 1;
  if (favOdds < 1.3) star_level = 5;
  else if (favOdds < 1.5) star_level = 4;
  else if (favOdds < 1.7) star_level = 3;
  else if (favOdds < 2.0) star_level = 2;
  else star_level = 1;

  const star_label = "★".repeat(star_level) + "☆".repeat(5 - star_level);

  // RSPF方向
  let rspf_direction: "home" | "draw" | "away";
  let rspf_label: string;
  if (rspf_home <= rspf_draw && rspf_home <= rspf_away) {
    rspf_direction = "home";
    rspf_label = "主胜(让)";
  } else if (rspf_away <= rspf_draw && rspf_away <= rspf_home) {
    rspf_direction = "away";
    rspf_label = "客胜(让)";
  } else {
    rspf_direction = "draw";
    rspf_label = "平局(让)";
  }

  return { direction, direction_label, star_level, star_label, rspf_direction, rspf_label };
}

function calcBizhongge(match: SportteryMatch): BizhonggeResult {
  const { spf_home, spf_draw, spf_away, handicap, rspf_home, rspf_away } = match;

  const passed: string[] = [];
  const failed: string[] = [];

  // 条件1：赔率离散度（三赔率标准差越大越有方向性）
  const mean = (spf_home + spf_draw + spf_away) / 3;
  const variance = ((spf_home - mean) ** 2 + (spf_draw - mean) ** 2 + (spf_away - mean) ** 2) / 3;
  const dispersion = Math.sqrt(variance);
  // 离散度越大越好，> 0.5 认为通过
  if (dispersion > 0.5) {
    passed.push(`赔率离散度 (${dispersion.toFixed(2)})`);
  } else {
    failed.push(`赔率离散度 (${dispersion.toFixed(2)})`);
  }

  // 条件2：SPF与RSPF方向一致性
  const spfFav = spf_home < spf_away ? "home" : "away";
  const rspfFav = rspf_home < rspf_away ? "home" : "away";
  const consistency = spfFav === rspfFav;
  if (consistency) {
    passed.push("SPF/RSPF方向一致");
  } else {
    failed.push("SPF/RSPF方向不一致");
  }

  // 条件3：平赔≥5.0（稳胆因子）
  const highDrawOdds = spf_draw >= 5.0;
  if (highDrawOdds) {
    passed.push("平赔≥5.0（稳胆）");
  } else {
    failed.push(`平赔${spf_draw.toFixed(2)}（偏低）`);
  }

  // 条件4：主客场优势（低赔方为主队时加分）
  const homeAdvantage = spf_home < spf_away;
  if (homeAdvantage) {
    passed.push("主队有主场优势");
  } else {
    failed.push("客队偏强或均衡");
  }

  const total = 4;
  const passCount = passed.length;

  let level: "推荐" | "观望" | "放弃";
  if (passCount >= 3) level = "推荐";
  else if (passCount === 2) level = "观望";
  else level = "放弃";

  return {
    passed_conditions: passed,
    failed_conditions: failed,
    total_conditions: total,
    pass_count: passCount,
    level,
    is_recommended: level === "推荐",
    dispersion,
    consistency,
    high_draw_odds: highDrawOdds,
  };
}

function calcXiaofeng(match: SportteryMatch, poisson: PoissonResult, v42: V42Result, bizhongge: BizhonggeResult): XiaofengResult {
  let score = 0;
  const reasons: string[] = [];

  // 泊松Top1是否支持SPF方向
  if (poisson.direction === v42.direction) {
    score += 1;
    reasons.push("泊松与V4.2方向一致");
  }

  // V4.2星级≥3
  if (v42.star_level >= 3) {
    score += 1;
    reasons.push(`V4.2 ${v42.star_level}星`);
  }

  // 必中哥推荐
  if (bizhongge.level === "推荐") {
    score += 1;
    reasons.push("必中哥筛选通过");
  }

  let level: "高" | "中" | "低";
  if (score >= 3) level = "高";
  else if (score >= 2) level = "中";
  else level = "低";

  // 综合方向 = V4.2方向（与泊松一致则确认）
  const direction = v42.direction;
  const direction_label = v42.direction_label;
  const isConsensus = poisson.direction === v42.direction;

  // 推荐比分 = 泊松Top2
  const top2_scores = poisson.top3.slice(0, 2).map((s) => s.score);

  // 风险提示
  let riskTip = "";
  if (!isConsensus) riskTip = "泊松与V4.2方向分歧，谨慎参考";
  else if (level === "低") riskTip = "多体系支持度低，建议观望";
  else if (level === "高") riskTip = "多体系一致看好，可重点关注";
  else riskTip = "综合评估中等，合理分配仓位";

  return {
    direction,
    direction_label,
    top2_scores,
    confidence_level: level,
    confidence_score: score,
    risk_tip: riskTip,
    is_consensus: isConsensus,
  };
}

function analyzeMatch(match: SportteryMatch): FullAnalysisMatch {
  const poisson = calcPoisson(match);
  const v42 = calcV42(match);
  const bizhongge = calcBizhongge(match);
  const xiaofeng = calcXiaofeng(match, poisson, v42, bizhongge);
  return { ...match, poisson, v42, bizhongge, xiaofeng };
}

// ===== 工具函数 =====
function starColor(level: number): string {
  if (level >= 4) return "text-yellow-400";
  if (level >= 3) return "text-yellow-500";
  if (level >= 2) return "text-orange-400";
  return "text-gray-500";
}

function confidenceColor(level: string): string {
  if (level === "高") return "text-emerald-400";
  if (level === "中") return "text-amber-400";
  return "text-gray-400";
}

function levelBg(level: string): string {
  if (level === "推荐") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (level === "观望") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-red-500/10 text-red-400 border-red-500/30";
}

// ===== 组件 =====
export default function AnalysisPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<FullAnalysisMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sporttery/matches", { cache: "no-store" });
      if (!res.ok) throw new Error("数据加载失败");
      const data = await res.json();
      const list = data.matches || [];
      const analyzed = list.map(analyzeMatch);
      setMatches(analyzed);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const recommendedCount = matches.filter((m) => m.bizhongge.is_recommended).length;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-200">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 z-10 bg-[#1a1a2e]/95 backdrop-blur border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </button>
            <div className="h-5 w-px bg-gray-700" />
            <h1 className="text-lg font-bold text-white">今日竞彩全维度分析</h1>
            <span className="text-xs text-gray-500">{today}</span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            刷新
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">数据加载失败</p>
              <p className="text-sm text-red-400/70">{error}</p>
            </div>
            <button onClick={fetchData} className="ml-auto px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 rounded">
              重试
            </button>
          </div>
        )}

        {/* 加载中 */}
        {loading && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-cyan-500" />
            <p>正在获取实时赔率数据...</p>
          </div>
        )}

        {/* 统计汇总 */}
        {!loading && matches.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-1">在售场次</div>
              <div className="text-2xl font-bold text-white tabular-nums">{matches.length}</div>
            </div>
            <div className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-1">必中哥推荐</div>
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">{recommendedCount}</div>
            </div>
            <div className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-1">高信心场次</div>
              <div className="text-2xl font-bold text-amber-400 tabular-nums">
                {matches.filter((m) => m.xiaofeng.confidence_level === "高").length}
              </div>
            </div>
            <div className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-1">平均星级</div>
              <div className="text-2xl font-bold text-yellow-400 tabular-nums">
                {matches.length > 0
                  ? (matches.reduce((s, m) => s + m.v42.star_level, 0) / matches.length).toFixed(1)
                  : "-"}
              </div>
            </div>
          </div>
        )}

        {/* 比赛列表 */}
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.match_no}
              className={`bg-[#1a1a2e] rounded-lg border overflow-hidden transition-colors ${
                match.bizhongge.is_recommended ? "border-emerald-500/40 shadow-lg shadow-emerald-500/5" : "border-gray-700/50"
              }`}
            >
              {/* 卡片头部 */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[#16213e]/50 border-b border-gray-700/30">
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-mono rounded">
                  {match.match_no}
                </span>
                <span className="text-xs text-gray-500">{match.league}</span>
                <div className="flex-1 font-semibold text-white text-sm md:text-base truncate">
                  {match.home_team} <span className="text-gray-500 mx-1">vs</span> {match.away_team}
                </div>
                <span className="text-xs text-gray-500 font-mono">{match.match_time}</span>
                {match.bizhongge.is_recommended && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    推荐
                  </span>
                )}
              </div>

              {/* 四维面板 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-700/30">
                {/* 泊松分析 */}
                <div className="bg-[#1a1a2e] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-400">泊松分析</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">主队λ</span>
                      <span className="text-cyan-300 font-mono">{match.poisson.lambda_h.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">客队λ</span>
                      <span className="text-cyan-300 font-mono">{match.poisson.lambda_a.toFixed(2)}</span>
                    </div>
                    <div className="pt-1">
                      <div className="text-gray-500 mb-1">Top3比分</div>
                      <div className="flex flex-wrap gap-1">
                        {match.poisson.top3.map((s) => (
                          <span
                            key={s.score}
                            className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 text-xs font-mono rounded"
                          >
                            {s.score} <span className="text-cyan-500/70 text-[10px]">{(s.prob * 100).toFixed(1)}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-gray-500">预测方向</span>
                      <span className="text-cyan-300 font-medium">{match.poisson.direction_label}</span>
                    </div>
                  </div>
                </div>

                {/* V4.2分析 */}
                <div className="bg-[#1a1a2e] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold text-purple-400">V4.2分析</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">SPF方向</span>
                      <span className="text-purple-300 font-medium">{match.v42.direction_label}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-red-400">{match.spf_home.toFixed(2)}</span>
                      <span className="text-yellow-400">{match.spf_draw.toFixed(2)}</span>
                      <span className="text-blue-400">{match.spf_away.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">星级</span>
                      <span className={`font-mono ${starColor(match.v42.star_level)}`}>{match.v42.star_label}</span>
                    </div>
                    <div className="pt-1 border-t border-gray-700/30">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-500">RSPF (让{match.handicap > 0 ? match.handicap : Math.abs(match.handicap) + "客"})</span>
                        <span className="text-purple-300">{match.v42.rspf_label}</span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-red-400/80">{match.rspf_home.toFixed(2)}</span>
                        <span className="text-yellow-400/80">{match.rspf_draw.toFixed(2)}</span>
                        <span className="text-blue-400/80">{match.rspf_away.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 必中哥筛选 */}
                <div className="bg-[#1a1a2e] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-semibold text-rose-400">必中哥筛选</span>
                    <span className={`ml-auto px-1.5 py-0.5 text-[10px] rounded border ${levelBg(match.bizhongge.level)}`}>
                      {match.bizhongge.level}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {match.bizhongge.passed_conditions.map((c) => (
                      <div key={c} className="flex items-center gap-1.5 text-emerald-400">
                        <span className="text-[10px]">✓</span>
                        <span className="truncate">{c}</span>
                      </div>
                    ))}
                    {match.bizhongge.failed_conditions.map((c) => (
                      <div key={c} className="flex items-center gap-1.5 text-red-400/70">
                        <span className="text-[10px]">✗</span>
                        <span className="truncate">{c}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1.5 mt-1 border-t border-gray-700/30">
                      <span className="text-gray-500">通过率</span>
                      <span className="font-mono font-medium">
                        {match.bizhongge.pass_count}/{match.bizhongge.total_conditions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 小丰综合 */}
                <div className="bg-[#1a1a2e] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-400">小丰综合</span>
                    <span className={`ml-auto text-xs font-medium ${confidenceColor(match.xiaofeng.confidence_level)}`}>
                      信心{match.xiaofeng.confidence_level}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">综合方向</span>
                      <span className="text-amber-300 font-medium">
                        {match.xiaofeng.direction_label}
                        {match.xiaofeng.is_consensus && <span className="text-emerald-400 ml-1">✓</span>}
                      </span>
                    </div>
                    <div className="pt-0.5">
                      <div className="text-gray-500 mb-1">推荐比分</div>
                      <div className="flex flex-wrap gap-1">
                        {match.xiaofeng.top2_scores.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-mono rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">评分</span>
                      <span className="font-mono">{match.xiaofeng.confidence_score}/3</span>
                    </div>
                    <div className="pt-1 text-[11px] text-gray-400 leading-tight">
                      ⚠ {match.xiaofeng.risk_tip}
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部汇总栏 */}
              <div className="px-3 py-2 bg-[#0f0f1a]/50 border-t border-gray-700/30 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-gray-500">综合结论：</span>
                <span className={`font-medium ${confidenceColor(match.xiaofeng.confidence_level)}`}>
                  信心{match.xiaofeng.confidence_level}
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">
                  方向：<span className="text-white">{match.xiaofeng.direction_label}</span>
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">
                  比分：<span className="font-mono text-amber-300">{match.xiaofeng.top2_scores.join(", ")}</span>
                </span>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">
                  评级：<span className={levelBg(match.bizhongge.level).match(/text-(\w+)-\d+/)?.[0] || ""}>
                    {match.bizhongge.level}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {!loading && !error && matches.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">今日暂无竞彩比赛在售</p>
            <p className="text-sm mt-1 text-gray-600">请等待下期开售</p>
          </div>
        )}

        {/* 底部推荐汇总 */}
        {!loading && recommendedCount > 0 && (
          <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              今日必中哥推荐场次（{recommendedCount}场）
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {matches
                .filter((m) => m.bizhongge.is_recommended)
                .map((m) => (
                  <div key={m.match_no} className="flex items-center gap-3 text-xs p-2 bg-[#1a1a2e] rounded">
                    <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 font-mono rounded text-[11px]">
                      {m.match_no}
                    </span>
                    <span className="flex-1 text-white truncate">
                      {m.home_team} vs {m.away_team}
                    </span>
                    <span className="text-emerald-400 font-medium">{m.xiaofeng.direction_label}</span>
                    <span className="font-mono text-amber-300">{m.xiaofeng.top2_scores[0]}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
