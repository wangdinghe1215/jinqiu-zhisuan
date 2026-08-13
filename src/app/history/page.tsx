'use client';

import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Calendar, Target, Trophy, TrendingUp, ChevronDown, ChevronRight, CheckCircle2, XCircle, RefreshCw, History as HistoryIcon } from 'lucide-react';
import Link from 'next/link';

interface HistoryMatch {
  match_no: string;
  home_team: string;
  away_team: string;
  league: string;
  match_time: string;
  recommended_direction: string;
  direction_label: string;
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
  direction_rate: string;
  score_hits: number;
  score_rate: string;
  matches: HistoryMatch[];
}

interface HistoryData {
  days: HistoryDay[];
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
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
      setData(json);
      if (json.days?.length > 0) {
        setSelectedDate(json.days[0].date);
      }
    } catch (e) {
      console.error('fetch history failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentDay = useMemo(
    () => data?.days?.find((d) => d.date === selectedDate) || null,
    [data, selectedDate]
  );

  // 累计统计
  const cumulative = useMemo(() => {
    if (!data?.days || data.days.length === 0) {
      return { total: 0, direction_hits: 0, direction_rate: '0%', score_hits: 0, score_rate: '0%' };
    }
    const total = data.days.reduce((s, d) => s + d.total, 0);
    const dh = data.days.reduce((s, d) => s + d.direction_hits, 0);
    const sh = data.days.reduce((s, d) => s + d.score_hits, 0);
    return {
      total,
      direction_hits: dh,
      direction_rate: total > 0 ? ((dh / total) * 100).toFixed(1) + '%' : '0%',
      score_hits: sh,
      score_rate: total > 0 ? ((sh / total) * 100).toFixed(1) + '%' : '0%',
    };
  }, [data]);

  const toggleMatch = (matchNo: string) => {
    setExpandedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(matchNo)) next.delete(matchNo);
      else next.add(matchNo);
      return next;
    });
  };

  const getResultColor = (result: string) => {
    if (result === 'home') return 'text-red-400';
    if (result === 'away') return 'text-blue-400';
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
            {/* 日期选择 Tab */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
              {data?.days?.map((day) => (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
                    selectedDate === day.date
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-[#1a1a2e] text-gray-400 hover:text-white border-transparent hover:border-[#2d3748]'
                  }`}
                >
                  {day.date}
                  <span className="ml-2 text-xs opacity-70">
                    {day.direction_hits}/{day.total}
                  </span>
                </button>
              ))}
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
                  {currentDay.direction_hits} <span className="text-sm text-gray-500">({currentDay.direction_rate})</span>
                </div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-amber-500/30">
                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-amber-400" /> 比分命中
                </div>
                <div className="text-xl font-bold text-amber-400 tabular-nums">
                  {currentDay.score_hits} <span className="text-sm text-gray-500">({currentDay.score_rate})</span>
                </div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> 累计命中率
                </div>
                <div className="text-xl font-bold text-purple-400 tabular-nums">
                  {cumulative.direction_rate}
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
                        <div className="flex items-center gap-3">
                          {/* 命中状态 */}
                          <div className="flex-shrink-0 w-6">
                            {match.direction_hit ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                          </div>

                          {/* 场次 + 联赛 */}
                          <div className="w-20 flex-shrink-0">
                            <div className="text-xs px-2 py-0.5 bg-[#2d3748] rounded text-gray-300 inline-block mb-1">
                              {match.match_no}
                            </div>
                            <div className="text-xs text-gray-500">{match.league} {match.match_time}</div>
                          </div>

                          {/* 对阵 */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {match.home_team} <span className="text-gray-500 mx-1">vs</span> {match.away_team}
                            </div>
                          </div>

                          {/* 推荐方向 */}
                          <div className="text-center w-20 flex-shrink-0">
                            <div className={`text-sm font-bold ${match.direction_hit ? 'text-emerald-400' : 'text-gray-400'}`}>
                              {match.direction_label}
                            </div>
                            <div className="text-xs text-gray-500">推荐方向</div>
                          </div>

                          {/* 实际赛果 */}
                          <div className="text-center w-20 flex-shrink-0">
                            <div className={`text-sm font-bold ${getResultColor(match.actual_result)}`}>
                              {match.result_label}
                            </div>
                            <div className="text-xs text-gray-500">实际赛果</div>
                          </div>

                          {/* 实际比分 */}
                          <div className="text-center w-16 flex-shrink-0">
                            <div className={`text-sm font-mono font-bold ${
                              match.score_hit ? 'text-amber-400' : 'text-gray-400'
                            }`}>
                              {match.actual_score}
                            </div>
                            <div className="text-xs text-gray-500">比分</div>
                          </div>

                          {/* 展开图标 */}
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>

                      {/* 展开详情：Top3预测比分 */}
                      {isExpanded && (
                        <div className="px-4 pb-3 pl-13">
                          <div className="bg-[#0f0f1a] rounded-lg p-3 border border-[#2d3748] ml-9">
                            <div className="text-xs text-gray-400 mb-2">预测 Top3 比分</div>
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
                                    {hit && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-3 pt-2 border-t border-[#2d3748] flex items-center gap-4 text-xs">
                              <span className={`flex items-center gap-1 ${
                                match.direction_hit ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {match.direction_hit ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                方向{match.direction_hit ? '命中' : '未中'}
                              </span>
                              <span className={`flex items-center gap-1 ${
                                match.score_hit ? 'text-amber-400' : 'text-gray-500'
                              }`}>
                                {match.score_hit ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
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

            {/* 底部累计统计 */}
            <div className="bg-[#1a1a2e] rounded-xl border border-[#2d3748] p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                累计统计 <span className="text-xs text-gray-500 font-normal">（共 {cumulative.total} 场）</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#0f0f1a] rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">总场次</div>
                  <div className="text-lg font-bold text-white tabular-nums">{cumulative.total}</div>
                </div>
                <div className="p-3 bg-[#0f0f1a] rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">方向命中</div>
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">{cumulative.direction_hits}</div>
                </div>
                <div className="p-3 bg-[#0f0f1a] rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">方向命中率</div>
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">{cumulative.direction_rate}</div>
                </div>
                <div className="p-3 bg-[#0f0f1a] rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">比分命中率</div>
                  <div className="text-lg font-bold text-amber-400 tabular-nums">{cumulative.score_rate}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
