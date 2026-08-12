'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Radar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  BarChart3,
  Target,
  RefreshCw,
  Zap,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const RADAR_DATA_URL = 'https://www.coze.cn/s/1M_Aj3hvBbc/';

interface OddsItem {
  jingcai: number;
  avg99: number;
  deviation: number;
  signal: string;
}

interface RadarMatch {
  level: string;
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  source: string;
  odds: {
    主胜: OddsItem;
    平局: OddsItem;
    客胜: OddsItem;
  };
  guide_direction: string;
}

interface RadarReportItem {
  date: string;
  time: string;
  datetime: string;
  total_matches: number;
  high_count: number;
  mid_count: number;
  low_count: number;
  normal_count: number;
  matches: RadarMatch[];
}

interface RadarData {
  generated_at: string;
  total_reports: number;
  dates: string[];
  reports: RadarReportItem[];
}

function getLevelInfo(level: string) {
  if (level.includes('🔴')) return { label: '高度异动', className: 'text-red-400', bg: 'bg-red-500/20 border-red-500/50', color: '#ef4444' };
  if (level.includes('🟠')) return { label: '中度异动', className: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/50', color: '#f97316' };
  if (level.includes('🟡')) return { label: '低度异动', className: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/50', color: '#eab308' };
  return { label: '正常', className: 'text-green-400', bg: 'bg-green-500/20 border-green-500/50', color: '#10b981' };
}

function getDeviationIcon(deviation: number) {
  if (deviation > 0) return <ArrowUpRight className="w-4 h-4 text-red-400" />;
  if (deviation < 0) return <ArrowDownRight className="w-4 h-4 text-green-400" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

function getSignalColor(signal: string) {
  if (signal.includes('高度')) return 'text-red-400';
  if (signal.includes('中度')) return 'text-orange-400';
  if (signal.includes('压低')) return 'text-green-400';
  return 'text-yellow-400';
}

export default function RadarPage() {
  const [data, setData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedReportIdx, setSelectedReportIdx] = useState(0);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(RADAR_DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      if (json.dates?.length > 0) {
        setSelectedDate(json.dates[0]);
      }
      setSelectedReportIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dateReports = useMemo(() => {
    if (!data?.reports) return [];
    return data.reports.filter(r => r.date === selectedDate);
  }, [data, selectedDate]);

  const currentReport = dateReports[selectedReportIdx];

  const toggleMatch = (key: string) => {
    const next = new Set(expandedMatches);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedMatches(next);
  };

  // 方向引导分布统计
  const directionStats = useMemo(() => {
    if (!currentReport?.matches) return [];
    const map = new Map<string, number>();
    for (const m of currentReport.matches) {
      // 提取方向引导的主要方向
      const dir = m.guide_direction.split('（')[0].trim();
      map.set(dir, (map.get(dir) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [currentReport]);

  // 异动分布饼图数据
  const pieData = useMemo(() => {
    if (!currentReport) return [];
    return [
      { name: '高度异动', value: currentReport.high_count || 0, color: '#ef4444' },
      { name: '中度异动', value: currentReport.mid_count || 0, color: '#f97316' },
      { name: '低度异动', value: currentReport.low_count || 0, color: '#eab308' },
      { name: '正常', value: currentReport.normal_count || 0, color: '#10b981' },
    ].filter(d => d.value > 0);
  }, [currentReport]);

  const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-medium">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-[#e5e7eb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#9ca3af]">正在加载雷达数据...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-[#e5e7eb] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">数据加载失败</h2>
          <p className="text-[#9ca3af] mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-[#e5e7eb]">
      {/* Header */}
      <div className="border-b border-[#2d3748] bg-[#1a1a2e]/50 backdrop-blur sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="p-2 rounded-lg bg-[#252a3a] hover:bg-[#2d3748] border border-[#374151] hover:border-cyan-500/50 transition-all flex items-center gap-1.5 text-[#9ca3af] hover:text-cyan-400 text-sm"
            >
              ← 返回首页
            </button>
            <div className="w-px h-6 bg-[#374151]"></div>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <Radar className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                雷达预警
              </h1>
              <p className="text-xs text-[#9ca3af]">赔率异动监控 · 数据生成于 {data.generated_at}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#9ca3af]" />
              <select
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedReportIdx(0); }}
                className="bg-[#1f2937] border border-[#374151] text-sm rounded-lg px-3 py-1.5 text-[#e5e7eb] focus:outline-none focus:border-orange-500/50"
              >
                {data.dates.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg bg-[#1f2937] border border-[#374151] hover:border-orange-500/50 transition-colors"
              title="刷新数据"
            >
              <RefreshCw className="w-4 h-4 text-[#9ca3af]" />
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* 时间轴报告选择器 */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#9ca3af]" />
            <span className="text-sm text-[#9ca3af]">当日报告记录（{dateReports.length} 份）</span>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {dateReports.map((report, idx) => {
                const isActive = idx === selectedReportIdx;
                const level = report.high_count > 0 ? 'high' : report.mid_count > 0 ? 'mid' : 'normal';
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedReportIdx(idx)}
                    className={`relative flex-shrink-0 w-44 p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-[#1a1a2e] border-orange-500/60 shadow-lg shadow-orange-500/10 scale-105'
                        : 'bg-[#1a1a2e]/50 border-[#2d3748] hover:border-[#4b5563] hover:bg-[#1a1a2e]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    )}
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-lg font-bold text-[#e5e7eb]">{report.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#9ca3af] mb-3">
                      <Activity className="w-3 h-3" />
                      <span>{report.total_matches} 场</span>
                    </div>
                    <div className="flex gap-1.5">
                      {report.high_count > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded">
                          高{report.high_count}
                        </span>
                      )}
                      {report.mid_count > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/20 text-orange-400 rounded">
                          中{report.mid_count}
                        </span>
                      )}
                      {report.low_count > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-yellow-500/20 text-yellow-400 rounded">
                          低{report.low_count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {currentReport && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-[#1a1a2e] border border-[#2d3748] rounded-xl">
                <div className="flex items-center gap-2 text-[#9ca3af] text-sm mb-2">
                  <Target className="w-4 h-4" />
                  <span>监控总场次</span>
                </div>
                <div className="text-3xl font-bold text-[#e5e7eb] tabular-nums">
                  {currentReport.total_matches}
                </div>
              </div>

              <div className={`p-5 bg-[#1a1a2e] border rounded-xl ${currentReport.high_count > 0 ? 'border-red-500/50' : 'border-[#2d3748]'}`}>
                <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>高度异动</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-red-400 tabular-nums">{currentReport.high_count}</span>
                  <span className="text-sm text-[#9ca3af]">
                    ({((currentReport.high_count / currentReport.total_matches) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className={`p-5 bg-[#1a1a2e] border rounded-xl ${currentReport.mid_count > 0 ? 'border-orange-500/50' : 'border-[#2d3748]'}`}>
                <div className="flex items-center gap-2 text-orange-400 text-sm mb-2">
                  <Zap className="w-4 h-4" />
                  <span>中度异动</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-orange-400 tabular-nums">{currentReport.mid_count}</span>
                  <span className="text-sm text-[#9ca3af]">
                    ({((currentReport.mid_count / currentReport.total_matches) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className={`p-5 bg-[#1a1a2e] border rounded-xl ${currentReport.normal_count > 0 ? 'border-green-500/50' : 'border-[#2d3748]'}`}>
                <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                  <Shield className="w-4 h-4" />
                  <span>正常</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-green-400 tabular-nums">{currentReport.normal_count + currentReport.low_count}</span>
                  <span className="text-sm text-[#9ca3af]">
                    ({(((currentReport.normal_count + currentReport.low_count) / currentReport.total_matches) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 核心提示 */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-amber-500/20 border border-orange-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-100 font-medium">
                    📡 {currentReport.date} {currentReport.time} 监控报告摘要
                  </p>
                  <p className="text-xs text-orange-200/70 mt-1">
                    本次共监控 <span className="font-medium text-orange-200">{currentReport.total_matches}</span> 场比赛，
                    发现高度异动 <span className="font-medium text-red-300">{currentReport.high_count}</span> 场，
                    中度异动 <span className="font-medium text-orange-300">{currentReport.mid_count}</span> 场，
                    请关注高偏差场次的方向引导价值。
                  </p>
                </div>
              </div>
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 异动分布饼图 */}
              <div className="p-3 bg-[#1a1a2e] border border-[#2d3748] rounded-xl">
                <h3 className="text-sm font-medium text-[#e5e7eb] mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-400" />
                  异动分布
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={PieLabel}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#e5e7eb',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span>{item.name} {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 方向引导柱状图 */}
              <div className="p-3 bg-[#1a1a2e] border border-[#2d3748] rounded-xl lg:col-span-2">
                <h3 className="text-sm font-medium text-[#e5e7eb] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  方向引导分布
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={directionStats.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 20 }}>
                      <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#374151' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        axisLine={{ stroke: '#374151' }}
                        width={100}
                      />
                      <Tooltip
                        cursor={{ fill: '#2d3748' }}
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#e5e7eb',
                        }}
                      />
                      <defs>
                        <linearGradient id="dirBarGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#fb923c" />
                        </linearGradient>
                      </defs>
                      <Bar dataKey="value" fill="url(#dirBarGrad)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 异动比赛列表 */}
            <div className="bg-[#1a1a2e] border border-[#2d3748] rounded-xl overflow-hidden">
              <div className="p-3 border-b border-[#2d3748] flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#e5e7eb] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  异动比赛列表
                  <span className="text-xs text-[#6b7280] font-normal">（共 {currentReport.matches.length} 场）</span>
                </h3>
                <span className="text-xs text-[#6b7280]">数据来源: {currentReport.matches[0]?.source || '—'}</span>
              </div>

              <div className="divide-y divide-[#2d3748]">
                {currentReport.matches.map((match, idx) => {
                  const levelInfo = getLevelInfo(match.level);
                  const matchKey = `${currentReport.datetime}-${idx}`;
                  const isExpanded = expandedMatches.has(matchKey);
                  const maxDeviation = Math.max(
                    ...Object.values(match.odds).map(o => Math.abs(o.deviation))
                  );

                  return (
                    <div key={matchKey} className="transition-colors">
                      <button
                        onClick={() => toggleMatch(matchKey)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-[#252a3a]/50 transition-colors text-left"
                      >
                        <span className="text-xs text-[#6b7280] w-8 tabular-nums">{idx + 1}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${levelInfo.bg} ${levelInfo.className} flex-shrink-0`}>
                          {levelInfo.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-[#6b7280] mb-0.5">
                            {match.match_no} · {match.league}
                          </div>
                          <div className="text-sm font-medium text-[#e5e7eb] truncate">
                            {match.home_team} <span className="text-[#6b7280]">vs</span> {match.away_team}
                          </div>
                        </div>
                        <div className="hidden md:block text-right flex-shrink-0">
                          <div className="text-xs text-[#6b7280]">最大偏差</div>
                          <div className={`text-sm font-bold tabular-nums ${
                            maxDeviation > 30 ? 'text-red-400' : maxDeviation > 15 ? 'text-orange-400' : 'text-yellow-400'
                          }`}>
                            {maxDeviation > 0 ? '+' : ''}{maxDeviation.toFixed(1)}%
                          </div>
                        </div>
                        <div className="hidden lg:block text-sm text-[#9ca3af] max-w-[200px] truncate">
                          {match.guide_direction}
                        </div>
                        <div className="flex-shrink-0 text-[#6b7280]">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 bg-[#0f0f1a]/50">
                          {/* 方向引导 */}
                          <div className="mb-3 p-3 bg-[#1a1a2e] rounded-lg border-l-2 border-orange-500">
                            <div className="text-xs text-[#9ca3af] mb-1">🎯 方向引导</div>
                            <div className="text-sm font-medium text-orange-300">{match.guide_direction}</div>
                          </div>

                          {/* 赔率对比表 */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-[#6b7280] border-b border-[#2d3748]">
                                  <th className="text-left py-2 px-2 font-medium">方向</th>
                                  <th className="text-right py-2 px-2 font-medium">竞彩赔率</th>
                                  <th className="text-right py-2 px-2 font-medium">99家平均</th>
                                  <th className="text-right py-2 px-2 font-medium">偏差</th>
                                  <th className="text-left py-2 px-2 font-medium">信号</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#2d3748]/50">
                                {(['主胜', '平局', '客胜'] as const).map(dir => {
                                  const odd = match.odds[dir];
                                  if (!odd) return null;
                                  const isHigh = Math.abs(odd.deviation) >= 30;
                                  const isMid = Math.abs(odd.deviation) >= 15 && Math.abs(odd.deviation) < 30;
                                  return (
                                    <tr key={dir} className={`${
                                      isHigh ? 'bg-red-500/5' : isMid ? 'bg-orange-500/5' : ''
                                    }`}>
                                      <td className="py-2 px-2">
                                        <span className={`font-medium ${
                                          dir === '主胜' ? 'text-red-400' : dir === '平局' ? 'text-yellow-400' : 'text-blue-400'
                                        }`}>
                                          {dir}
                                        </span>
                                      </td>
                                      <td className="text-right py-2 px-2 text-[#e5e7eb] font-mono tabular-nums">
                                        {odd.jingcai.toFixed(2)}
                                      </td>
                                      <td className="text-right py-2 px-2 text-[#9ca3af] font-mono tabular-nums">
                                        {odd.avg99.toFixed(2)}
                                      </td>
                                      <td className={`text-right py-2 px-2 font-mono tabular-nums flex items-center justify-end gap-0.5 ${
                                        Math.abs(odd.deviation) >= 30 ? 'text-red-400 font-bold' :
                                        Math.abs(odd.deviation) >= 15 ? 'text-orange-400' :
                                        odd.deviation < 0 ? 'text-green-400' : 'text-yellow-400'
                                      }`}>
                                        {getDeviationIcon(odd.deviation)}
                                        {odd.deviation > 0 ? '+' : ''}{odd.deviation.toFixed(1)}%
                                      </td>
                                      <td className={`py-2 px-2 text-xs ${getSignalColor(odd.signal)}`}>
                                        {odd.signal}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 底部提示 */}
            <div className="text-center text-xs text-[#6b7280] py-4">
              数据来源: 竞彩官方赔率 vs 99家平均赔率对比 · 更新于 {data.generated_at}
            </div>
          </>
        )}
      </div>
      </main>
    </div>
    );
}
