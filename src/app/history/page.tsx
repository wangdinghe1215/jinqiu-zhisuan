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
  ChevronDown,
  ChevronUp,
  Clock,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

// ============== 类型定义 ==============

interface HistoryMatch {
  match_no: string;
  home_team: string;
  away_team: string;
  league: string;
  match_time: string;
  half_score: string;
  spf_odds: string;
  rspf_odds: string;
  handicap: number;
  poisson_lambda_h: number;
  poisson_lambda_a: number;
  top3_scores: string[];
  recommended_direction: string;
  direction_label: string;
  rspf_direction: string;
  xf_direction: string;
  xf_label: string;
  xf_top_scores: string[];
  actual_score: string;
  actual_result: string;
  result_label: string;
  spf_result_detail: string;
  rspf_result_detail: string;
  direction_hit: boolean;
  score_hit: boolean;
  direction_hit_label: string;
  score_hit_label: string;
  poisson_vs_actual: string;
  summary: string;
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

// 必中哥V2（刻舟求剑）数据类型
interface BzgOddsItem {
  target_odds: number;
  total: number;
  win_pct: number;
  draw_pct: number;
  lose_pct: number;
  top5: [string, number][];
}

interface BzgMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  bizhongge: {
    home_win: BzgOddsItem;
    draw: BzgOddsItem;
    away_win: BzgOddsItem;
  };
}

interface BzgDay {
  date: string;
  matches: BzgMatch[];
}

interface BzgData {
  days: BzgDay[];
}

// 每日追踪数据类型
interface TrackMatch {
  mn: string;
  lg: string;
  ht: string;
  at: string;
  tm: string | null;
  spf: string;
  hcp: number;
  score: string;
  result: string;
  dir: string;
  hit: boolean | null;
}

interface TrackDay {
  date: string;
  wd: string;
  matches: TrackMatch[];
  stats: { total: number; hits: number; rate: number; status: string };
}

type TrackData = Record<string, TrackDay>;

// 必中哥字段映射（兼容短名/长名）
function mapBzgMatch(m: any): BzgMatch {
  const bk = m.bizhongge || m.bk || {};
  const mapTarget = (t: any): BzgOddsItem => ({
    target_odds: t?.target_odds ?? t?.o,
    total: t?.total ?? t?.t ?? 0,
    win_pct: t?.win_pct ?? t?.wp ?? 0,
    draw_pct: t?.draw_pct ?? t?.dp ?? 0,
    lose_pct: t?.lose_pct ?? t?.lp ?? 0,
    top5: (t?.top5 ?? t?.top ?? []).map((x: any) => [String(x[0]), Number(x[1])]),
  });
  return {
    match_no: m.match_no ?? m.mn ?? '',
    league: m.league ?? m.lg ?? '',
    home_team: m.home_team ?? m.ht ?? '',
    away_team: m.away_team ?? m.at ?? '',
    bizhongge: {
      home_win: mapTarget(bk.home_win),
      draw: mapTarget(bk.draw),
      away_win: mapTarget(bk.away_win),
    }
  };
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'analysis'>('tracking');
  const [data, setData] = useState<HistoryData | null>(null);
  const [bzgData, setBzgData] = useState<BzgData | null>(null);
  const [trackData, setTrackData] = useState<TrackData>({});
  const [loading, setLoading] = useState(true);
  const [trackLoading, setTrackLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // ============== 数据加载 ==============
  useEffect(() => {
    fetchHistory();
    fetchTracking();
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

  const fetchTracking = async () => {
    setTrackLoading(true);
    try {
      const res = await fetch('/data/daily_tracking.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json && typeof json === 'object') {
        setTrackData(json);
        // 默认展开第一天
        const dates = Object.keys(json).sort((a, b) => b.localeCompare(a));
        if (dates.length > 0) {
          setExpandedDays({ [dates[0]]: true });
        }
      }
    } catch (e) {
      console.error('fetch tracking failed:', e);
    } finally {
      setTrackLoading(false);
    }
  };

  // 加载必中哥V2数据
  useEffect(() => {
    const fetchBzg = async () => {
      try {
        const res = await fetch('/data/bizhongge_data.json', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        let normalized: BzgData;
        if (json && Array.isArray(json.days)) {
          normalized = json;
        } else if (json && json.matches) {
          const normalizedDay: BzgDay = {
            date: json.date,
            matches: json.matches.map((m: any) => mapBzgMatch(m))
          };
          normalized = { days: [normalizedDay] };
        } else {
          return;
        }
        setBzgData(normalized);
      } catch (e) {
        console.error('fetch bizhongge failed:', e);
      }
    };
    fetchBzg();
  }, []);

  // ============== 多维分析数据 ==============
  const days = data?.days || [];
  const currentDay = days[selectedIdx] || null;

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

  const poissonDirFromScores = (scores: string[]) => {
    if (!scores || scores.length === 0) return null;
    const [h, a] = scores[0].split(':').map(Number);
    if (h > a) return 'home';
    if (h < a) return 'away';
    return 'draw';
  };

  const dimensionStats = useMemo(() => {
    const matches = currentDay?.matches || [];
    const count = (getDir: (m: HistoryMatch) => string | null | undefined) => {
      let total = 0;
      let hits = 0;
      matches.forEach((m) => {
        const dir = getDir(m);
        if (dir && dir !== 'none') {
          total++;
          if (dir === m.actual_result) hits++;
        }
      });
      return { total, hits, rate: total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '-' };
    };
    return {
      poisson: count((m) => poissonDirFromScores(m.top3_scores)),
      v42: count((m) => m.recommended_direction),
      xiaofeng: count((m) => m.xf_direction),
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

  // ============== 每日追踪数据 ==============
  const trackDays = useMemo(() => {
    return Object.keys(trackData)
      .sort((a, b) => b.localeCompare(a))
      .map((k) => trackData[k]);
  }, [trackData]);

  const trackSummary = useMemo(() => {
    let totalDays = trackDays.length;
    let totalMatches = 0;
    let totalHits = 0;
    trackDays.forEach((d) => {
      totalMatches += d.stats?.total || d.matches?.length || 0;
      totalHits += d.stats?.hits || 0;
    });
    const rate = totalMatches > 0 ? ((totalHits / totalMatches) * 100).toFixed(1) + '%' : '0%';
    return { totalDays, totalMatches, totalHits, rate };
  }, [trackDays]);

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const getDayColor = (status: string, rate: number) => {
    if (status === 'pending') return 'border-gray-600 bg-gray-800/30';
    if (rate >= 60) return 'border-emerald-500/40 bg-emerald-500/5';
    if (rate >= 30) return 'border-orange-500/40 bg-orange-500/5';
    return 'border-red-500/40 bg-red-500/5';
  };

  const getDayTextColor = (status: string, rate: number) => {
    if (status === 'pending') return 'text-gray-400';
    if (rate >= 60) return 'text-emerald-400';
    if (rate >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const dirLabel = (dir: string) => {
    if (dir === 'home') return '主胜';
    if (dir === 'away') return '客胜';
    if (dir === 'draw') return '平局';
    return dir || '-';
  };

  const resultLabel = (result: string) => {
    if (result === 'win' || result === 'home') return '主胜';
    if (result === 'lose' || result === 'away') return '客胜';
    if (result === 'draw') return '平';
    return result || '-';
  };

  // ============== 渲染 ==============
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100">
      {/* Header */}
      <div className="border-b border-[#2d3748] bg-[#1a1a2e]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
              title="返回首页"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg">
                <HistoryIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  历史战绩
                </h1>
                <p className="text-[11px] text-gray-500">每日赛果复盘 · 命中率追踪</p>
              </div>
            </div>
            <div className="flex-1" />
            <button
              onClick={activeTab === 'tracking' ? fetchTracking : fetchHistory}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 ${(activeTab === 'tracking' ? trackLoading : loading) ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-[#0f0f1a] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'tracking'
                  ? 'bg-[#1a1a2e] text-white shadow-sm border border-[#2d3748]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📋 每日追踪
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'analysis'
                  ? 'bg-[#1a1a2e] text-white shadow-sm border border-[#2d3748]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 多维分析
            </button>
          </div>
        </div>
      </div>

      <main className="p-4 max-w-6xl mx-auto pb-10">
        {/* ============== Tab 1: 每日追踪 ============== */}
        {activeTab === 'tracking' && (
          <div className="space-y-3">
            {/* 汇总栏 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-[11px] mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> 总天数
                </div>
                <div className="text-lg font-bold text-white tabular-nums">
                  {trackSummary.totalDays}
                </div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-[11px] mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> 总场次
                </div>
                <div className="text-lg font-bold text-white tabular-nums">
                  {trackSummary.totalMatches}
                </div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-emerald-500/30">
                <div className="text-gray-400 text-[11px] mb-1 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-emerald-400" /> 总命中率
                </div>
                <div className="text-lg font-bold text-emerald-400 tabular-nums">
                  {trackSummary.rate}
                </div>
                <div className="text-[10px] text-emerald-400/70">
                  {trackSummary.totalHits} / {trackSummary.totalMatches}
                </div>
              </div>
            </div>

            {trackLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                <p>加载追踪数据中...</p>
              </div>
            ) : trackDays.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <HistoryIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">暂无追踪数据</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trackDays.map((day) => {
                  const expanded = expandedDays[day.date];
                  const status = day.stats?.status || 'done';
                  const rate = day.stats?.rate || 0;
                  const total = day.stats?.total || day.matches?.length || 0;
                  const hits = day.stats?.hits || 0;
                  return (
                    <div
                      key={day.date}
                      className={`rounded-xl border overflow-hidden transition-colors ${getDayColor(status, rate)}`}
                    >
                      {/* 卡片头部 */}
                      <div
                        className="px-3 py-2.5 flex items-center gap-2 cursor-pointer"
                        onClick={() => toggleDay(day.date)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm font-bold text-white">
                            {day.date}
                          </span>
                          <span className="text-xs text-gray-400">{day.wd}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">
                            {hits}/{total}
                          </span>
                          <span className={`text-xs font-bold tabular-nums ${getDayTextColor(status, rate)}`}>
                            {rate}%
                          </span>
                          {status === 'pending' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-600/40 text-gray-300">
                              待回填
                            </span>
                          ) : (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              rate >= 60 ? 'bg-emerald-500/20 text-emerald-400' :
                              rate >= 30 ? 'bg-orange-500/20 text-orange-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              已完成
                            </span>
                          )}
                          {expanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* 展开的比赛列表 */}
                      {expanded && (
                        <div className="border-t border-[#2d3748] overflow-x-auto">
                          <table className="w-full text-xs min-w-[640px]">
                            <thead className="bg-[#0f0f1a]/50">
                              <tr className="text-gray-400 text-[11px]">
                                <th className="px-2 py-2 text-left font-medium">编号</th>
                                <th className="px-2 py-2 text-left font-medium">联赛</th>
                                <th className="px-2 py-2 text-left font-medium">对阵</th>
                                <th className="px-2 py-2 text-center font-medium">SPF赔率</th>
                                <th className="px-2 py-2 text-center font-medium">预测方向</th>
                                <th className="px-2 py-2 text-center font-medium">比分</th>
                                <th className="px-2 py-2 text-center font-medium">结果</th>
                                <th className="px-2 py-2 text-center font-medium">命中</th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.matches.map((m, i) => {
                                const isHit = m.hit === true;
                                const isPending = m.hit === null || m.hit === undefined;
                                return (
                                  <tr
                                    key={m.mn || i}
                                    className={`border-t border-[#2d3748]/50 ${
                                      isHit ? 'bg-emerald-500/5' : ''
                                    }`}
                                  >
                                    <td className="px-2 py-2 font-mono text-gray-300">{m.mn}</td>
                                    <td className="px-2 py-2 text-gray-400">{m.lg}</td>
                                    <td className="px-2 py-2">
                                      <span className="text-red-400">{m.ht}</span>
                                      <span className="text-gray-600 mx-1">vs</span>
                                      <span className="text-blue-400">{m.at}</span>
                                    </td>
                                    <td className="px-2 py-2 text-center font-mono tabular-nums text-gray-300">
                                      {m.spf}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                        m.dir === 'home' ? 'bg-red-500/20 text-red-400' :
                                        m.dir === 'away' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                      }`}>
                                        {dirLabel(m.dir)}
                                      </span>
                                    </td>
                                    <td className="px-2 py-2 text-center font-mono text-white">
                                      {m.score || '-'}
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      <span className={getResultColor(m.result)}>
                                        {resultLabel(m.result)}
                                      </span>
                                    </td>
                                    <td className="px-2 py-2 text-center">
                                      {isPending ? (
                                        <span className="text-gray-400">⏳</span>
                                      ) : isHit ? (
                                        <span className="text-emerald-400">✅</span>
                                      ) : (
                                        <span className="text-red-400">❌</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============== Tab 2: 多维分析（原有内容） ============== */}
        {activeTab === 'analysis' && (
          <>
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
                      比赛记录 · 五维对比
                    </h2>
                    <span className="text-xs text-gray-500">共 {currentDay.matches.length} 场</span>
                  </div>

                  {currentDay.matches.map((match) => {
                    const bzgMatches = bzgData?.days?.find((d: any) => d.date === currentDay?.date)?.matches;
                    const poissonDir = poissonDirFromScores(match.top3_scores);
                    const poissonDirHit = isDirHit(poissonDir, match.actual_result, match.result_label);
                    const dirHit = match.direction_hit;
                    const scoreHit = match.score_hit;
                    const xfHit = match.xf_direction && match.xf_direction !== 'none'
                      ? match.xf_direction === match.actual_result
                      : false;
                    const xfScoreHit = Array.isArray(match.xf_top_scores) && match.xf_top_scores.includes(match.actual_score);
                    const bzgMatch = bzgMatches?.find((b) => b.match_no === match.match_no);

                    return (
                      <div
                        key={match.match_no}
                        className={`bg-[#1a1a2e] rounded-xl border overflow-hidden transition-colors ${
                          dirHit ? 'border-emerald-500/30' : 'border-[#2d3748]'
                        }`}
                      >
                        {/* 卡片头部 */}
                        <div className="px-3 py-2 border-b border-[#2d3748] flex items-center gap-2.5 bg-[#16213e]/50">
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
                                <CheckCircle2 className="w-3.5 h-3.5" />方向中
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
                                <XCircle className="w-3.5 h-3.5" />方向失
                              </span>
                            )}
                            {scoreHit && (
                              <span className="flex items-center gap-1 text-xs text-amber-400 font-medium ml-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />比分中
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 五维对比：移动端2列 / 桌面端5列 */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#2d3748]">
                          {/* 1️⃣ 泊松分析 */}
                          <div className="bg-[#1a1a2e] p-2.5">
                            <div className="text-xs text-cyan-400 font-medium mb-2 flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />泊松分析
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">预期进球 λ</div>
                                <div className="font-mono text-cyan-300">
                                  主 {match.poisson_lambda_h?.toFixed?.(2) || '-'} / 客 {match.poisson_lambda_a?.toFixed?.(2) || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">
                                  方向 {poissonDirHit && <span className="text-emerald-400">✅</span>}
                                </div>
                                <div className={`font-medium ${poissonDirHit ? 'text-emerald-400' : 'text-gray-300'}`}>
                                  {poissonDir ? (poissonDir === 'home' ? '主胜' : poissonDir === 'away' ? '客胜' : '平局') : '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">Top3 比分</div>
                                <div className="flex flex-wrap gap-1">
                                  {(match.top3_scores || []).slice(0, 3).map((s, i) => {
                                    const hit = scoreHit && s === match.actual_score;
                                    return (
                                      <span
                                        key={i}
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                                          hit
                                            ? 'bg-amber-500/30 text-amber-300 font-bold'
                                            : 'bg-cyan-500/10 text-cyan-300'
                                        }`}
                                      >
                                        {s}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2️⃣ V4.2分析 */}
                          <div className="bg-[#1a1a2e] p-2.5">
                            <div className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1">
                              <Target className="w-3 h-3" />V4.2分析
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">
                                  SPF方向 {dirHit && <span className="text-emerald-400">✅</span>}
                                </div>
                                <div className={`font-medium ${dirHit ? 'text-emerald-400' : 'text-gray-300'}`}>
                                  {match.direction_label || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">SPF赔率</div>
                                <div className="font-mono text-amber-200 tabular-nums">
                                  {match.spf_odds || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">RSPF方向</div>
                                <div className="font-medium text-amber-300">
                                  {match.rspf_direction || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">RSPF赔率</div>
                                <div className="font-mono text-amber-200/80 tabular-nums">
                                  {match.rspf_odds || '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 3️⃣ 小丰综合 */}
                          <div className="bg-[#1a1a2e] p-2.5">
                            <div className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1">
                              <Wallet className="w-3 h-3" />小丰综合
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">
                                  综合方向 {xfHit && <span className="text-emerald-400">✅</span>}
                                </div>
                                <div className={`font-medium ${xfHit ? 'text-emerald-400' : 'text-gray-300'}`}>
                                  {match.xf_label || match.direction_label || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">
                                  推荐比分 {xfScoreHit && <span className="text-amber-400">✅</span>}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(match.xf_top_scores || match.top3_scores || []).slice(0, 2).map((s, i) => {
                                    const hit = xfScoreHit && s === match.actual_score;
                                    return (
                                      <span
                                        key={i}
                                        className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                                          hit
                                            ? 'bg-amber-500/30 text-amber-300 font-bold'
                                            : 'bg-emerald-500/10 text-emerald-300'
                                        }`}
                                      >
                                        {s}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">SPF参考</div>
                                <div className="font-mono text-emerald-200/80 tabular-nums text-[11px]">
                                  {match.spf_odds || '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 4️⃣ 实际赛果 */}
                          <div className="bg-[#1a1a2e] p-2.5">
                            <div className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1">
                              <Trophy className="w-3 h-3" />实际赛果
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">全场比分</div>
                                <div className="text-lg font-bold text-white font-mono">
                                  {match.actual_score || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">半场比分</div>
                                <div className="font-mono text-gray-300">
                                  {match.half_score || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">赛果</div>
                                <div className={`font-bold ${getResultColor(match.actual_result || '')}`}>
                                  {match.result_label || '-'}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-[11px] mb-0.5">SPF开奖</div>
                                <div className="text-red-300 text-[11px]">
                                  {match.spf_result_detail || '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 5️⃣ 必中哥·刻舟求剑 */}
                          <div className="bg-[#1a1a2e] p-2.5 md:col-span-1 col-span-2">
                            <div className="text-xs text-orange-400 font-medium mb-2 flex items-center gap-1">
                              <Activity className="w-3 h-3" />必中哥·刻舟求剑
                            </div>
                            {bzgMatch ? (
                              <div className="space-y-1.5 text-[11px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">主胜@{bzgMatch.bizhongge.home_win.target_odds}</span>
                                  <span className="text-orange-300 font-mono">
                                    {bzgMatch.bizhongge.home_win.win_pct}% · {bzgMatch.bizhongge.home_win.total}场
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-0.5">
                                  {bzgMatch.bizhongge.home_win.top5.slice(0, 3).map(([s, c], i) => (
                                    <span key={i} className="px-1 py-0.5 rounded bg-orange-500/10 text-orange-300 font-mono">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">平局@{bzgMatch.bizhongge.draw.target_odds}</span>
                                  <span className="text-yellow-300 font-mono">
                                    {bzgMatch.bizhongge.draw.draw_pct}% · {bzgMatch.bizhongge.draw.total}场
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-0.5">
                                  {bzgMatch.bizhongge.draw.top5.slice(0, 3).map(([s, c], i) => (
                                    <span key={i} className="px-1 py-0.5 rounded bg-yellow-500/10 text-yellow-300 font-mono">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">客胜@{bzgMatch.bizhongge.away_win.target_odds}</span>
                                  <span className="text-blue-300 font-mono">
                                    {bzgMatch.bizhongge.away_win.lose_pct}% · {bzgMatch.bizhongge.away_win.total}场
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-0.5">
                                  {bzgMatch.bizhongge.away_win.top5.slice(0, 3).map(([s, c], i) => (
                                    <span key={i} className="px-1 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 py-4 text-center">
                                暂无刻舟求剑数据
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 底部总结条 */}
                        <div className="px-3 py-1.5 bg-[#0f0f1a]/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] border-t border-[#2d3748]">
                          <span className="text-gray-500">
                            方向：{dirHit ? <span className="text-emerald-400 font-medium">✅命中</span> : <span className="text-red-400 font-medium">❌未中</span>}
                          </span>
                          <span className="text-gray-500">
                            比分：{scoreHit ? <span className="text-amber-400 font-medium">✅命中</span> : <span className="text-gray-400">未中</span>}
                          </span>
                          <span className="text-gray-600 flex-1 truncate text-right">
                            {match.poisson_vs_actual || ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 累计汇总 */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 p-4 mt-6">
                  <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    累计统计（{days.length} 天）
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-gray-400 text-xs mb-1">总场次</div>
                      <div className="text-xl font-bold text-white tabular-nums">{cumulative.total}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">方向命中</div>
                      <div className="text-xl font-bold text-emerald-400 tabular-nums">
                        {cumulative.dir_rate}
                      </div>
                      <div className="text-xs text-emerald-400/70">
                        {cumulative.dir_hits} 场
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">比分命中</div>
                      <div className="text-xl font-bold text-amber-400 tabular-nums">
                        {cumulative.score_rate}
                      </div>
                      <div className="text-xs text-amber-400/70">
                        {cumulative.score_hits} 场
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">统计范围</div>
                      <div className="text-sm text-white">
                        {days[days.length - 1]?.date} ~ {days[0]?.date}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
