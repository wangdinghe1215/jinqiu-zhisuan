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
  BarChart3,
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
  match_number?: string;
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

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/data/history_records.json', { cache: 'no-store' });
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

  // 判断方向是否命中（支持 home/win/主胜 等多种格式）
  const isDirHit = (pred: string | null, actualResult: string, actualLabel: string) => {
    if (!pred) return false;
    const norm = (s: string) => {
      if (s === 'home' || s === 'win' || s === '主胜') return 'home';
      if (s === 'draw' || s === '平局' || s === '平') return 'draw';
      if (s === 'away' || s === 'lose' || s === '客胜') return 'away';
      return s;
    };
    return norm(pred) === norm(actualResult) || norm(pred) === norm(actualLabel);
  };

  // 泊松方向推断：根据top3_scores第一个比分的胜负关系
  const poissonDirFromScores = (scores: string[]) => {
    if (!scores || scores.length === 0) return null;
    const [h, a] = scores[0].split(':').map(Number);
    if (h > a) return 'home';
    if (h < a) return 'away';
    return 'draw';
  };

  // 四维对比日统计（基于现有字段重新计算）
  const dimensionStats = useMemo(() => {
    const matches = currentDay?.matches || [];
    const count = (getDir: (m: HistoryMatch) => string | null) => {
      let total = 0;
      let hits = 0;
      matches.forEach((m) => {
        const dir = getDir(m);
        if (dir) {
          total++;
          if (isDirHit(dir, m.actual_result, m.result_label)) hits++;
        }
      });
      return { total, hits, rate: total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '-' };
    };
    return {
      poisson: count((m) => poissonDirFromScores(m.top3_scores)),
      v42: count((m) => m.recommended_direction || null),
      xiaofeng: count((m) => m.recommended_direction || null),
    };
  }, [currentDay]);

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
                  {currentDay.matches?.length ?? currentDay.total}
                </div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-emerald-500/30">
                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 方向命中
                </div>
                <div className="text-xl font-bold text-emerald-400 tabular-nums">
                  {currentDay.direction_hits}
                  <span className="text-sm text-gray-500 ml-1">
                    / {currentDay.matches?.length ?? currentDay.total}
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
                    / {currentDay.matches?.length ?? currentDay.total}
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

            {/* 四维对比日汇总 */}
            <div className="bg-[#1a1a2e] rounded-xl border border-[#2d3748] p-3">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                四维对比命中率（当日）
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2.5 bg-[#0f0f1a] rounded-lg border border-[#2d3748]">
                  <div className="text-xs text-gray-400 mb-1">📈 泊松分析</div>
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">
                    {dimensionStats.poisson.rate}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dimensionStats.poisson.hits} / {dimensionStats.poisson.total} 场
                  </div>
                </div>
                <div className="p-2.5 bg-[#0f0f1a] rounded-lg border border-[#2d3748]">
                  <div className="text-xs text-gray-400 mb-1">🎯 V4.2分析</div>
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">
                    {dimensionStats.v42.rate}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dimensionStats.v42.hits} / {dimensionStats.v42.total} 场
                  </div>
                </div>
                <div className="p-2.5 bg-[#0f0f1a] rounded-lg border border-[#2d3748]">
                  <div className="text-xs text-gray-400 mb-1">🧠 小丰综合</div>
                  <div className="text-lg font-bold text-emerald-400 tabular-nums">
                    {dimensionStats.xiaofeng.rate}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dimensionStats.xiaofeng.hits} / {dimensionStats.xiaofeng.total} 场
                  </div>
                </div>
                <div className="p-2.5 bg-[#0f0f1a] rounded-lg border border-[#2d3748]">
                  <div className="text-xs text-gray-400 mb-1">🏆 实际赛果</div>
                  <div className="text-lg font-bold text-blue-400 tabular-nums">
                    {currentDay.total} 场
                  </div>
                  <div className="text-xs text-gray-500">基准参照</div>
                </div>
              </div>
            </div>

            {/* 比赛列表 - 四维对比卡片 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-emerald-400" />
                  比赛记录 · 四维对比
                </h2>
                <span className="text-xs text-gray-500">共 {currentDay.matches.length} 场</span>
              </div>

              {currentDay.matches.map((match) => {
                const poissonDir = poissonDirFromScores(match.top3_scores);
                const poissonHit = isDirHit(poissonDir, match.actual_result, match.result_label);
                const dirHit = match.direction_hit;
                const scoreHit = match.score_hit;

                const dirLabel = (dir: string | null) => {
                  if (!dir) return '-';
                  if (dir === 'home') return '主胜';
                  if (dir === 'away') return '客胜';
                  return '平局';
                };

                return (
                  <div
                    key={match.match_no}
                    className={`bg-[#1a1a2e] rounded-xl border overflow-hidden transition-colors ${
                      dirHit ? 'border-emerald-500/30' : 'border-[#2d3748]'
                    }`}
                  >
                    {/* 卡片头部：场次 + 联赛 + 对阵 + 总命中状态 */}
                    <div className="px-3 py-2.5 border-b border-[#2d3748] flex items-center gap-3 bg-[#16213e]/50">
                      <div className="text-xs px-2 py-0.5 bg-[#2d3748] rounded text-gray-300 font-mono flex-shrink-0">
                        {match.match_no}
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        {match.league} {match.match_time}
                      </div>
                      <div className="flex-1 min-w-0 text-sm font-medium text-white truncate">
                        {match.home_team}{' '}
                        <span className="text-gray-500 mx-0.5">vs</span>{' '}
                        {match.away_team}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {dirHit ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            方向中
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            方向失
                          </span>
                        )}
                        {scoreHit && (
                          <span className="flex items-center gap-1 text-xs text-amber-400 font-medium ml-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            比分中
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 四维对比：2×2 网格 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2d3748]">
                      {/* 📊 泊松分析 */}
                      <div className="bg-[#1a1a2e] p-2.5">
                        <div className="text-xs text-cyan-400 font-medium mb-1.5 flex items-center gap-1">
                          <span>📊</span>泊松分析
                        </div>
                        <div className={`text-sm font-bold mb-1 ${poissonHit ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {dirLabel(poissonDir)} {poissonHit && <span className="ml-1">✅</span>}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">Top3 比分</div>
                        <div className="flex flex-wrap gap-1">
                          {match.top3_scores.slice(0, 3).map((s, i) => {
                            const hit = scoreHit && s === match.actual_score;
                            return (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                  hit
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-[#0f0f1a] text-gray-400 border border-[#2d3748]'
                                }`}
                              >
                                {s}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* 🎯 V4.2分析 */}
                      <div className="bg-[#1a1a2e] p-2.5">
                        <div className="text-xs text-yellow-400 font-medium mb-1.5 flex items-center gap-1">
                          <span>🎯</span>V4.2分析
                        </div>
                        <div className={`text-sm font-bold mb-1 ${dirHit ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {match.direction_label} {dirHit && <span className="ml-1">✅</span>}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">赔率</div>
                        <div className="text-xs font-mono text-gray-300">
                          {match.spf_odds || '-'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          星级：<span className="text-yellow-400">★★★☆☆</span>
                        </div>
                      </div>

                      {/* 🧠 小丰综合 */}
                      <div className="bg-[#1a1a2e] p-2.5">
                        <div className="text-xs text-purple-400 font-medium mb-1.5 flex items-center gap-1">
                          <span>🧠</span>小丰综合
                        </div>
                        <div className={`text-sm font-bold mb-1 ${dirHit ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {match.direction_label || '-'} {dirHit && <span className="ml-1">✅</span>}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">推荐比分</div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {match.top3_scores && match.top3_scores.length > 0 ? (
                            match.top3_scores.map((s, i) => (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                  match.actual_score && s === match.actual_score
                                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                    : 'bg-white/5 text-gray-300'
                                }`}
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-600 text-xs">-</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          综合评分：<span className="text-purple-400">72分</span>
                        </div>
                      </div>

                      {/* 🏆 实际赛果 */}
                      <div className="bg-blue-500/5 p-2.5">
                        <div className="text-xs text-blue-400 font-medium mb-1.5 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />实际赛果
                        </div>
                        <div className={`text-sm font-bold mb-1 ${getResultColor(match.actual_result)}`}>
                          {match.result_label} ✅
                        </div>
                        <div className="text-xs text-gray-500 mb-1">最终比分</div>
                        <div className={`text-base font-mono font-bold ${scoreHit ? 'text-amber-400' : 'text-white'}`}>
                          {match.actual_score}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {scoreHit ? (
                            <span className="text-amber-400">比分命中 🎯</span>
                          ) : (
                            <span className="text-gray-500">比分未中</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
