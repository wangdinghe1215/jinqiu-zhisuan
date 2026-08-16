"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { Calendar, Target, TrendingUp, Award, Swords, BarChart3, ChevronDown, ChevronUp, Clock, Trophy, Zap, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// ========== 类型定义 ==========
interface ScoreOdd {
  score: string;
  odds: number;
}

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
  score_odds: ScoreOdd[];
  ttg_odds: Record<string, number>;
  hafu_odds: Record<string, number>;
}

// CR 8级分级
function getCRLevel(cr: number): number {
  if (cr >= 180) return 1;   // 钻石
  if (cr >= 100) return 2;   // 金
  if (cr >= 75) return 3;    // 银
  if (cr >= 50) return 4;    // 铜
  if (cr >= 25) return 5;    // 木
  if (cr >= 10) return 6;    // 铁
  if (cr > 0) return 7;      // 低
  return 8;                   // 无
}

function getCRLabel(level: number): string {
  const labels: Record<number, string> = {
    1: "钻石", 2: "金", 3: "银", 4: "铜",
    5: "木", 6: "铁", 7: "低", 8: "-"
  };
  return labels[level] || "-";
}

// 计算SPF的CR值：CR = (主胜 × 客胜) / (平赔²)
function calcSPF_CR(h: number, d: number, a: number): number {
  if (d <= 0) return 0;
  return (h * a) / (d * d) * 100;
}

// 比分赔率的CR：单个比分赔率 vs 平均赔率的偏离度
// 简化：用 (赔率 / 平均赔率) 的归一化值
function calcScoreCR(odds: number, avgOdds: number): number {
  if (avgOdds <= 0) return 0;
  return (odds / avgOdds) * 25;
}

// 半全场映射
const hafuLabels: Record<string, string> = {
  hh: "胜胜", hd: "胜平", ha: "胜负",
  dh: "平胜", dd: "平平", da: "平负",
  ah: "负胜", ad: "负平", aa: "负负"
};

// ========== 单场比赛卡片 ==========
function MatchCard({ match }: { match: SportteryMatch }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"spf" | "rspf" | "score" | "hafu" | "ttg">("score");

  // SPF CR值
  const spfCR = calcSPF_CR(match.spf_home, match.spf_draw, match.spf_away);
  const spfLevel = getCRLevel(spfCR);

  // RSPF CR值
  const rspfCR = calcSPF_CR(match.rspf_home, match.rspf_draw, match.rspf_away);
  const rspfLevel = getCRLevel(rspfCR);

  // 比分平均赔率，用于计算每个比分的相对CR
  const scoreOdds = match.score_odds || [];
  const avgScoreOdds = scoreOdds.length > 0
    ? scoreOdds.reduce((s, x) => s + x.odds, 0) / scoreOdds.length
    : 0;

  // 总进球平均赔率
  const ttgEntries = Object.entries(match.ttg_odds || {}).filter(
    ([k]) => !k.endsWith("f")
  );
  const avgTtgOdds = ttgEntries.length > 0
    ? ttgEntries.reduce((s, [, v]) => s + v, 0) / ttgEntries.length
    : 0;

  // 半全场平均赔率
  const hafuEntries = Object.entries(match.hafu_odds || {}).filter(
    ([k]) => k.length === 2 && !k.endsWith("f")
  );
  const avgHafuOdds = hafuEntries.length > 0
    ? hafuEntries.reduce((s, [, v]) => s + v, 0) / hafuEntries.length
    : 0;

  const handicapStr = match.handicap > 0
    ? `主+${match.handicap}`
    : `主${match.handicap}`;

  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors mb-3">
      {/* 卡片头部 - 点击展开/折叠 */}
      <div
        className="p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* 编号 + 联赛 */}
          <div className="flex flex-col min-w-[70px]">
            <span className="text-cyan-400 font-mono text-xs font-bold">{match.match_no}</span>
            <span className="text-gray-500 text-[11px]">{match.league}</span>
          </div>

          {/* 对阵 */}
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-semibold text-sm">{match.home_team}</span>
              <span className="text-gray-600 text-xs">VS</span>
              <span className="text-blue-400 font-semibold text-sm">{match.away_team}</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
              <Clock size={12} />
              <span className="font-mono tabular-nums">{match.match_time.slice(0, 5)}</span>
              <span className="text-gray-700">|</span>
              <span>让球: {handicapStr}</span>
            </div>
          </div>

          {/* SPF赔率摘要 */}
          <div className="flex items-center gap-1 bg-gray-900/60 rounded-lg px-2 py-1.5">
            <div className="text-center min-w-[48px]">
              <div className={cn(
                "font-mono font-bold text-sm tabular-nums",
                match.spf_home < match.spf_draw && match.spf_home < match.spf_away
                  ? "text-cyan-300" : "text-red-400"
              )}>
                {match.spf_home.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-600">主胜</div>
            </div>
            <div className="text-center min-w-[48px]">
              <div className={cn(
                "font-mono font-bold text-sm tabular-nums",
                match.spf_draw < match.spf_home && match.spf_draw < match.spf_away
                  ? "text-cyan-300" : "text-yellow-400"
              )}>
                {match.spf_draw.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-600">平</div>
            </div>
            <div className="text-center min-w-[48px]">
              <div className={cn(
                "font-mono font-bold text-sm tabular-nums",
                match.spf_away < match.spf_home && match.spf_away < match.spf_draw
                  ? "text-cyan-300" : "text-blue-400"
              )}>
                {match.spf_away.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-600">客胜</div>
            </div>
          </div>

          {/* CR等级徽章 */}
          <div
            className={cn(
              "px-2.5 py-1 rounded font-mono text-xs font-bold border",
              getCRBgClass(spfLevel)
            )}
          >
            CR {getCRLabel(spfLevel)}
          </div>

          {/* 展开按钮 */}
          <button className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="border-t border-gray-800 bg-[#0f0f1a]/60">
          {/* 5标签页切换 */}
          <div className="flex border-b border-gray-800">
            {[
              { key: "spf" as const, label: "胜平负(SPF)" },
              { key: "rspf" as const, label: "让球胜平负" },
              { key: "score" as const, label: "比分" },
              { key: "hafu" as const, label: "半全场" },
              { key: "ttg" as const, label: "总进球" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 py-2 text-xs font-medium transition-colors border-b-2",
                  activeTab === tab.key
                    ? "text-cyan-300 border-cyan-400 bg-cyan-500/5"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 标签页内容 */}
          <div className="p-4">
            {/* SPF 胜平负 */}
            {activeTab === "spf" && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "主胜", odds: match.spf_home, color: "text-red-400" },
                  { label: "平局", odds: match.spf_draw, color: "text-yellow-400" },
                  { label: "客胜", odds: match.spf_away, color: "text-blue-400" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-4 rounded-lg text-center border transition-all",
                      getCRBgClass(getCRLevel(calcScoreCR(item.odds, (match.spf_home + match.spf_draw + match.spf_away) / 3)))
                    )}
                  >
                    <div className="text-[11px] text-gray-400 mb-1">{item.label}</div>
                    <div className={cn("font-mono font-bold text-2xl tabular-nums", item.color)}>
                      {item.odds.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      返 {((1 / item.odds) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* RSPF 让球胜平负 */}
            {activeTab === "rspf" && (
              <div>
                <div className="text-[11px] text-gray-500 mb-3 text-center">
                  让球数：<span className="text-purple-400 font-mono">{handicapStr}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "主胜(让)", odds: match.rspf_home, color: "text-red-400" },
                    { label: "平(让)", odds: match.rspf_draw, color: "text-yellow-400" },
                    { label: "客胜(让)", odds: match.rspf_away, color: "text-blue-400" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-4 rounded-lg text-center border",
                        getCRBgClass(getCRLevel(calcScoreCR(item.odds, (match.rspf_home + match.rspf_draw + match.rspf_away) / 3)))
                      )}
                    >
                      <div className="text-[11px] text-gray-400 mb-1">{item.label}</div>
                      <div className={cn("font-mono font-bold text-2xl tabular-nums", item.color)}>
                        {item.odds.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        返 {((1 / item.odds) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 比分 */}
            {activeTab === "score" && (
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                {scoreOdds.slice(0, 32).map((s, i) => {
                  const level = getCRLevel(calcScoreCR(s.odds, avgScoreOdds));
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-2 rounded text-center font-mono text-xs border transition-all hover:scale-105 cursor-default",
                        getCRBgClass(level)
                      )}
                    >
                      <div className="text-[11px] text-gray-200 font-semibold">{s.score}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 tabular-nums">{s.odds.toFixed(1)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 半全场 */}
            {activeTab === "hafu" && (
              <div className="grid grid-cols-3 gap-2">
                {hafuEntries.map(([key, odds]) => {
                  const level = getCRLevel(calcScoreCR(odds, avgHafuOdds));
                  return (
                    <div
                      key={key}
                      className={cn(
                        "p-3 rounded text-center font-mono border",
                        getCRBgClass(level)
                      )}
                    >
                      <div className="text-[11px] text-gray-300">{hafuLabels[key] || key}</div>
                      <div className="text-base font-bold text-white tabular-nums mt-0.5">
                        {odds.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 总进球 */}
            {activeTab === "ttg" && (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {ttgEntries.sort((a, b) => {
                  const na = a[0] === "7up" || a[0] === "7+" ? 99 : parseInt(a[0]);
                  const nb = b[0] === "7up" || b[0] === "7+" ? 99 : parseInt(b[0]);
                  return na - nb;
                }).map(([key, odds]) => {
                  const level = getCRLevel(calcScoreCR(odds, avgTtgOdds));
                  const label = key === "7up" || key === "7+" ? "7+" : key + "球";
                  return (
                    <div
                      key={key}
                      className={cn(
                        "p-3 rounded text-center font-mono border",
                        getCRBgClass(level)
                      )}
                    >
                      <div className="text-[11px] text-gray-300">{label}</div>
                      <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                        {odds.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// CR等级背景色类（暗色主题 + 金属色系）
function getCRBgClass(level: number): string {
  switch (level) {
    case 1: // 钻石
      return "bg-yellow-900/20 border-yellow-600/40 shadow-sm shadow-yellow-500/10";
    case 2: // 金
      return "bg-yellow-900/15 border-yellow-700/30";
    case 3: // 银
      return "bg-slate-800/40 border-slate-500/30";
    case 4: // 铜
      return "bg-orange-900/15 border-orange-700/30";
    case 5: // 木
      return "bg-emerald-900/15 border-emerald-700/30";
    case 6: // 铁
      return "bg-gray-800/40 border-gray-600/30";
    case 7: // 低
      return "bg-gray-900/60 border-gray-700/20";
    default: // 无
      return "bg-gray-900/40 border-gray-800/30";
  }
}

// ========== 主页面 ==========
export default function AnalysisPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<SportteryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sporttery/matches?type=full")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setMatches(data.data);
        } else {
          setError("数据加载失败");
        }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // 统计数据
  const total = matches.length;
  const highCRCount = matches.filter(m => getCRLevel(calcSPF_CR(m.spf_home, m.spf_draw, m.spf_away)) <= 4).length; // 铜及以上
  const avgReturnRate = matches.length > 0
    ? matches.reduce((s, m) => s + (1 / m.spf_home + 1 / m.spf_draw + 1 / m.spf_away), 0) / matches.length
    : 0;

  // 钻石级比赛
  const diamondMatches = matches.filter(m => getCRLevel(calcSPF_CR(m.spf_home, m.spf_draw, m.spf_away)) <= 2);

  return (
    <AppLayout>
      <div className="p-4">
        {/* 页面标题 + 返回 */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 size={22} className="text-cyan-400" />
              全维度赔率分析
            </h1>
            <p className="text-gray-500 text-sm mt-1">SPF · RSPF · 比分 · 半全场 · 总进球 · CR值8级分级</p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
              <Trophy size={14} className="text-yellow-500" /> 总场次
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {loading ? "..." : total}
              <span className="text-sm text-gray-500 font-normal ml-1">场</span>
            </div>
          </div>

          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
              <Award size={14} className="text-orange-500" /> 高价值场次
            </div>
            <div className="text-2xl font-bold text-orange-400 font-mono tabular-nums">
              {loading ? "..." : highCRCount}
              <span className="text-sm text-gray-500 font-normal ml-1">场</span>
            </div>
          </div>

          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
              <TrendingUp size={14} className="text-green-500" /> 平均返还率
            </div>
            <div className="text-2xl font-bold text-green-400 font-mono tabular-nums">
              {loading ? "..." : (avgReturnRate * 100).toFixed(1)}
              <span className="text-sm text-gray-500 font-normal ml-1">%</span>
            </div>
          </div>

          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
              <Zap size={14} className="text-yellow-400" /> 钻石/金级
            </div>
            <div className="text-2xl font-bold text-yellow-400 font-mono tabular-nums">
              {loading ? "..." : diamondMatches.length}
              <span className="text-sm text-gray-500 font-normal ml-1">场</span>
            </div>
          </div>
        </div>

        {/* CR等级说明 */}
        <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3 mb-5">
          <div className="text-gray-400 text-xs mb-2 flex items-center gap-1">
            <Target size={14} /> CR值交叉比值分级（从高到低）
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { level: 1, name: "钻石", color: "bg-yellow-900/20 border-yellow-600/40 text-yellow-300" },
              { level: 2, name: "金", color: "bg-yellow-900/15 border-yellow-700/30 text-yellow-500" },
              { level: 3, name: "银", color: "bg-slate-800/40 border-slate-500/30 text-slate-300" },
              { level: 4, name: "铜", color: "bg-orange-900/15 border-orange-700/30 text-orange-300" },
              { level: 5, name: "木", color: "bg-emerald-900/15 border-emerald-700/30 text-emerald-300" },
              { level: 6, name: "铁", color: "bg-gray-800/40 border-gray-600/30 text-gray-300" },
              { level: 7, name: "低", color: "bg-gray-900/60 border-gray-700/20 text-gray-400" },
            ].map(item => (
              <span
                key={item.level}
                className={cn(
                  "px-2 py-1 rounded text-xs font-mono border",
                  item.color
                )}
              >
                L{item.level} {item.name}
              </span>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-red-300 text-center mb-4">
            数据加载失败：{error}
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-pulse">加载比赛数据中...</div>
          </div>
        )}

        {/* 比赛列表 */}
        {!loading && !error && (
          <div>
            <div className="text-gray-400 text-sm mb-3 flex items-center justify-between">
              <span>今日在售比赛 · 共 {total} 场</span>
              <span className="text-gray-600 text-xs">点击卡片展开5维度赔率详情</span>
            </div>
            {matches.map((match, i) => (
              <MatchCard key={i} match={match} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
