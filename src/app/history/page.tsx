'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Target,
  Trophy,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  History as HistoryIcon,
  Wallet,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

interface HistoryMatch {
  match_no: string;
  home_team: string;
  away_team: string;
  league: string;
  match_time: string;
  recommended_direction: string;
  direction_label: string;
  spf_odds?: string;
  top3_scores: string[];
  actual_score: string;
  actual_result: string;
  result_label: string;
  direction_hit: boolean;
  score_hit: boolean;
}

interface HistoryDay {
  date: string;
  total: number;
  direction_hits: number;
  direction_total: number;
  direction_rate: string;
  score_hits: number;
  score_total: number;
  score_rate: string;
  matches: HistoryMatch[];
}

interface HistoryData {
  days: HistoryDay[];
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && Array.isArray(json.days) && json.days.length > 0) {
        setData(json);
        setSelectedIdx(0);
      } else {
        setData({ days: [] });
      }
    } catch (e) {
      console.error('fetch history failed:', e);
      setData({ days: [] });
    } finally {
      setLoading(false);
    }
  };

  const days = data?.days || [];
  const currentDay = days[selectedIdx] || null;

  // 累计统计
  const cumulative = useMemo(() => {
    if (days.length === 0) {
      return { total: 0, dir_hits: 0, dir_rate: '0%', score_hits: 0, score_rate: '0%' };
    }
    const total = days.reduce((s, d) => s + (d.direction_total || d.total || 0), 0);
    const dh = days.reduce((s, d) => s + (d.direction_hits || 0), 0);
    const st = days.reduce((s, d) => s + (d.score_total || d.total || 0), 0);
    const sh = days.reduce((s, d) => s + (d.score_hits || 0), 0);
    return {
      total,
      dir_hits: dh,
      dir_rate: total > 0 ? ((dh / total) * 100).toFixed(1) + '%' : '0%',
      score_hits: sh,
      score_rate: st > 0 ? ((sh / st) * 100).toFixed(1) + '%' : '0%',
    };
  }, [days]);

  const toggleMatch = (matchNo: string) => {
    setExpandedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(matchNo)) next.delete(matchNo);
      else next.add(matchNo);
      return next;
    });
  };

  const goPrev = () => {
    if (selectedIdx < days.length - 1) setSelectedIdx(selectedIdx + 1);
  };
  const goNext = () => {
    if (selectedIdx > 0) setSelectedIdx(selectedIdx - 1);
  };

  const getResultColor = (result: string) => {
    if (result === 'home' || result === 'win') return 'text-red-400';
    if (result === 'away' || result === 'lose') return 'text-blue-400';
    return 'text-yellow-400';
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100">
      {/* Header */}
      <div className="border-b border-[#2d3748] bg-[#1a1a2e]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
              title="返回首页"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg">
                <HistoryIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  历史战绩
                </h1>
                <p className="text-xs text-gray-500">每日赛果复盘 · 命中率追踪</p>
              </div>
            </div>
            <div className="flex-1" />
            <button
              onClick={fetchHistory}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="刷新"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>加载历史数据中...</p>
          </div>
        ) : !currentDay ? (
          <div className="text-center py-20 text-gray-500">
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">暂无历史数据</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 日期切换 */}
            <div className="flex items-center justify-between bg-[#1a1a2e] rounded-xl border border-[#2d3748] px-4 py-3">
              <button
                onClick={goPrev}
                disabled={selectedIdx >= days.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                前一天
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span className="text-lg font-bold text-white">{currentDay.date}</span>
                <span className="text-xs text-gray-500">
                  （第 {selectedIdx + 1} / {days.length} 天）
                </span>
              </div>
              <button
                onClick={goNext}
                disabled={selectedIdx <= 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                后一天
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 当日汇总卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" /> 总场次
                </div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {currentDay.total}
                </div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-emerald-500/30">
                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 方向命中
                </div>
                <div className="text-xl font-bold text-emerald-400 tabular-nums">
                  {currentDay.direction_hits}
                  <span className="text-sm text-gray-500 ml-1">
                    / {currentDay.direction_total || currentDay.total}
                  </span>
                </div>
                <div className="text-xs text-emerald-400/70 mt-0.5">{currentDay.direction_rate}</div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-amber-500/30">
                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-amber-400" /> 比分命中
                </div>
                <div className="text-xl font-bold text-amber-400 tabular-nums">
                  {currentDay.score_hits}
                  <span className="text-sm text-gray-500 ml-1">
                    / {currentDay.score_total || currentDay.total}
                  </span>
                </div>
                <div className="text-xs text-amber-400/70 mt-0.5">{currentDay.score_rate}</div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-purple-500/30">
                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> 累计方向命中
                </div>
                <div className="text-xl font-bold text-purple-400 tabular-nums">
                  {cumulative.dir_rate}
                </div>
                <div className="text-xs text-purple-400/70 mt-0.5">
                  {cumulative.dir_hits} / {cumulative.total}
                </div>
              </div>
            </div>

            {/* 比赛列表 */}
            <div className="bg-[#1a1a2e] rounded-xl border border-[#2d3748] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2d3748] flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-emerald-400" />
                  比赛记录
                </h2>
                <span className="text-xs text-gray-500">共 {currentDay.matches.length} 场</span>
              </div>

              <div className="divide-y divide-[#2d3748]">
                {currentDay.matches.map((match) => {
                  const isExpanded = expandedMatches.has(match.match_no);
                  return (
                    <div
                      key={match.match_no}
                      className={`transition-colors ${
                        match.direction_hit ? 'bg-emerald-500/5' : 'bg-red-500/5'
                      }`}
                    >
                      <button
                        onClick={() => toggleMatch(match.match_no)}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start gap-3 md:items-center md:flex-row flex-col">
                          {/* 第一行：状态 + 场次联赛 + 对阵 + 展开图标 */}
                          <div className="flex items-center gap-3 w-full">
                            {/* 命中状态 */}
                            <div className="flex-shrink-0 w-6">
                              {match.direction_hit ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                            </div>

                            {/* 场次 + 联赛 */}
                            <div className="w-24 flex-shrink-0">
                              <div className="text-xs px-2 py-0.5 bg-[#2d3748] rounded text-gray-300 inline-block mb-1">
                                {match.match_no}
                              </div>
                              <div className="text-xs text-gray-500">
                                {match.league} {match.match_time}
                              </div>
                            </div>

                            {/* 对阵 */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {match.home_team}{' '}
                                <span className="text-gray-500 mx-1">vs</span>{' '}
                                {match.away_team}
                              </div>
                              {match.spf_odds && (
                                <div className="text-xs text-gray-500 mt-0.5 font-mono">
                                  SPF: {match.spf_odds}
                                </div>
                              )}
                            </div>

                            {/* 桌面端隐藏的占位：只在移动端显示展开图标（底部还有一个） */}
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0 md:hidden" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 md:hidden" />
                            )}
                          </div>

                          {/* 右侧数据列：桌面横向，移动端纵向堆叠 */}
                          <div className="flex gap-3 md:gap-0 w-full md:w-auto pl-9 md:pl-0 flex-wrap md:flex-nowrap">
                            {/* 推荐方向 */}
                            <div className="text-center w-20 flex-shrink-0">
                              <div
                                className={`text-sm font-bold ${
                                  match.direction_hit ? 'text-emerald-400' : 'text-gray-400'
                                }`}
                              >
                                {match.direction_label}
                              </div>
                              <div className="text-xs text-gray-500">推荐方向</div>
                            </div>

                            {/* 实际赛果 */}
                            <div className="text-center w-20 flex-shrink-0">
                              <div
                                className={`text-sm font-bold ${getResultColor(
                                  match.actual_result
                                )}`}
                              >
                                {match.result_label}
                              </div>
                              <div className="text-xs text-gray-500">实际赛果</div>
                            </div>

                            {/* 实际比分 */}
                            <div className="text-center w-16 flex-shrink-0">
                              <div
                                className={`text-sm font-mono font-bold ${
                                  match.score_hit ? 'text-amber-400' : 'text-gray-400'
                                }`}
                              >
                                {match.actual_score}
                              </div>
                              <div className="text-xs text-gray-500">比分</div>
                            </div>

                            {/* 桌面端展开图标 */}
                            <div className="hidden md:flex items-center">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* 展开详情：Top3预测比分 */}
                      {isExpanded && (
                        <div className="px-4 pb-3">
                          <div className="bg-[#0f0f1a] rounded-lg p-3 border border-[#2d3748] md:ml-9">
                            <div className="text-xs text-gray-400 mb-2">
                              预测 Top3 比分（赔率最低的 3 个）
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {match.top3_scores.map((score, idx) => {
                                const hit = match.score_hit && score === match.actual_score;
                                return (
                                  <div
                                    key={idx}
                                    className={`px-3 py-1.5 rounded-full text-sm font-mono font-bold border flex items-center gap-1.5 ${
                                      hit
                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                        : 'bg-[#1a1a2e] border-[#2d3748] text-gray-400'
                                    }`}
                                  >
                                    <span className="text-xs opacity-60">No.{idx + 1}</span>
                                    {score}
                                    {hit && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 pt-2 border-t border-[#2d3748] flex items-center gap-4 text-xs">
                              <span
                                className={`flex items-center gap-1 ${
                                  match.direction_hit ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {match.direction_hit ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                方向{match.direction_hit ? '命中' : '未中'}
                              </span>
                              <span
                                className={`flex items-center gap-1 ${
                                  match.score_hit ? 'text-amber-400' : 'text-gray-500'
                                }`}
                              >
                                {match.score_hit ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                比分{match.score_hit ? '命中' : '未中'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 投注方案历史（昨日推荐方案结果） */}
            {selectedIdx < days.length - 1 && days[selectedIdx + 1] && (
              <div className="bg-[#1a1a2e] rounded-xl border border-amber-500/30 overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-500/20 flex items-center justify-between bg-amber-500/5">
                  <h2 className="font-semibold text-amber-300 flex items-center gap-2 text-sm">
                    <Wallet className="w-4 h-4" />
                    投注方案结果 · {days[selectedIdx + 1].date}
                  </h2>
                  <span className="text-xs text-amber-400/70">
                    方向 {days[selectedIdx + 1].direction_rate}
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-[#0f0f1a] rounded-lg">
                      <div className="text-xs text-gray-500">总场次</div>
                      <div className="text-lg font-bold text-white tabular-nums">
                        {days[selectedIdx + 1].total}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-[#0f0f1a] rounded-lg">
                      <div className="text-xs text-gray-500">方向命中</div>
                      <div className="text-lg font-bold text-emerald-400 tabular-nums">
                        {days[selectedIdx + 1].direction_hits}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-[#0f0f1a] rounded-lg">
                      <div className="text-xs text-gray-500">比分命中</div>
                      <div className="text-lg font-bold text-amber-400 tabular-nums">
                        {days[selectedIdx + 1].score_hits}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                    <span>
                      昨日推荐方案的完整赛果如上，点击「前一天」可查看每场比赛详情。
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 底部累计统计 */}
            <div className="bg-[#1a1a2e] rounded-xl border border-[#2d3748] p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                累计统计
                <span className="text-xs text-gray-500 font-normal">
                  （共 {days.length} 天 / {cumulative.total} 场）
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#0f0f1a] rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">总场次</div>
                  <div className="text-lg font-bold text-white tabular-nums">
                    {cumulative.total}
                  </div>
                </div>
                <div className="p-3 bg-[#0f0f1a] rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">方向命中</div>
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">
                    {cumulative.dir_hits}
                  </div>
                </div>
                <div className="p-3 bg-[#0f0f1a] rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">方向命中率</div>
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">
                    {cumulative.dir_rate}
                  </div>
                </div>
                <div className="p-3 bg-[#0f0f1a] rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">比分命中率</div>
                  <div className="text-lg font-bold text-amber-400 tabular-nums">
                    {cumulative.score_rate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
