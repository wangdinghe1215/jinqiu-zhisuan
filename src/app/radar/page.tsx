'use client';

import { useState, useEffect } from 'react';
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

interface AbnormalMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  level: 'high' | 'medium' | 'normal';
  deviation_pct: number;
  direction_hint: string;
  key_odds: string;
  change_trend: string;
}

interface RadarReport {
  id: string;
  exec_time: string;
  exec_date: string;
  exec_time_str: string;
  total_matches: number;
  abnormal_high: number;
  abnormal_medium: number;
  abnormal_normal: number;
  summary: string;
  matches?: AbnormalMatch[];
}

export default function RadarPage() {
  const [reports, setReports] = useState<RadarReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<RadarReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchReports();
    fetchDates();
  }, [selectedDate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = selectedDate
        ? `/api/radar/reports?type=all&date=${selectedDate}`
        : `/api/radar/reports?type=all`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setReports(data.data);
        setSelectedReport(data.data[0]);
      } else {
        setReports([]);
        setSelectedReport(null);
      }
    } catch (err) {
      console.error('加载雷达报告失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDates = async () => {
    try {
      const res = await fetch('/api/radar/reports?type=dates');
      const data = await res.json();
      if (data.success) {
        setAvailableDates(data.data);
        if (data.data?.length > 0 && !selectedDate) {
          setSelectedDate(data.data[0]);
        }
      }
    } catch (err) {
      console.error('加载日期列表失败:', err);
    }
  };

  const toggleMatch = (matchNo: string) => {
    const next = new Set(expandedMatches);
    if (next.has(matchNo)) {
      next.delete(matchNo);
    } else {
      next.add(matchNo);
    }
    setExpandedMatches(next);
  };

  const pieData = selectedReport
    ? [
        { name: '高度异动', value: selectedReport.abnormal_high, color: '#ef4444' },
        { name: '中度异动', value: selectedReport.abnormal_medium, color: '#f59e0b' },
        { name: '正常', value: selectedReport.abnormal_normal, color: '#10b981' },
      ]
    : [];

  const levelBadge = (level: string) => {
    if (level === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30">
          <AlertTriangle size={12} /> 高度异动
        </span>
      );
    }
    if (level === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-medium border border-amber-500/30">
          <Activity size={12} /> 中度异动
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30">
        <Shield size={12} /> 正常
      </span>
    );
  };

  const trendIcon = (trend: string) => {
    if (trend.includes('下降')) return <TrendingDown size={14} className="text-green-400" />;
    if (trend.includes('上升')) return <TrendingUp size={14} className="text-red-400" />;
    if (trend.includes('震荡')) return <Activity size={14} className="text-amber-400" />;
    return <Activity size={14} className="text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Radar size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              雷达预警
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </h1>
            <p className="text-sm text-gray-500">实时赔率异动监控报告</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a2e] rounded-lg border border-gray-800">
            <Calendar size={16} className="text-gray-500" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer"
            >
              {availableDates.map((d) => (
                <option key={d} value={d} className="bg-[#1a1a2e]">
                  {d}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>
      </div>

      {/* Report selector - 时间轴 */}
      <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-gray-500" />
          <span className="text-sm text-gray-400">当日监控报告</span>
          <span className="text-xs text-gray-600">（点击切换查看）</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={24} className="text-gray-500 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Radar size={48} className="mx-auto mb-3 opacity-30" />
            <p>暂无雷达监控报告</p>
          </div>
        ) : (
          <div className="relative">
            {/* 时间轴 */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-700" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
              {reports.map((report) => {
                const isActive = selectedReport?.id === report.id;
                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`relative p-3 rounded-lg border transition-all text-left ${
                      isActive
                        ? 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10'
                        : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {/* 时间轴节点 */}
                    <div
                      className={`absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10 ${
                        isActive
                          ? 'bg-rose-500 border-rose-300 shadow-lg shadow-rose-500/50'
                          : 'bg-gray-700 border-gray-600'
                      }`}
                    />
                    <div className="mt-2">
                      <div className={`font-bold text-lg ${isActive ? 'text-rose-400' : 'text-gray-300'}`}>
                        {report.exec_time_str.split(' ')[0]}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {report.exec_time_str.split(' ').slice(1).join(' ')}
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div className="flex justify-between">
                          <span>监控</span>
                          <span className="text-gray-300 font-medium">{report.total_matches} 场</span>
                        </div>
                        <div className="flex justify-between">
                          <span>高度异动</span>
                          <span className="text-red-400 font-medium">{report.abnormal_high} 场</span>
                        </div>
                        <div className="flex justify-between">
                          <span>中度异动</span>
                          <span className="text-amber-400 font-medium">{report.abnormal_medium} 场</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 报告详情 */}
      {selectedReport && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">监控总场次</div>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">
                {selectedReport.total_matches}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {selectedReport.exec_time_str}
              </div>
            </div>
            <div className="bg-[#1a1a2e] border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
                <AlertTriangle size={12} /> 高度异动
              </div>
              <div className="text-2xl font-bold text-red-400 font-mono tabular-nums">
                {selectedReport.abnormal_high}
              </div>
              <div className="text-xs text-red-400/60 mt-1">
                {((selectedReport.abnormal_high / selectedReport.total_matches) * 100).toFixed(1)}%
                占比
              </div>
            </div>
            <div className="bg-[#1a1a2e] border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
                <Activity size={12} /> 中度异动
              </div>
              <div className="text-2xl font-bold text-amber-400 font-mono tabular-nums">
                {selectedReport.abnormal_medium}
              </div>
              <div className="text-xs text-amber-400/60 mt-1">
                {((selectedReport.abnormal_medium / selectedReport.total_matches) * 100).toFixed(1)}%
                占比
              </div>
            </div>
            <div className="bg-[#1a1a2e] border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
                <Shield size={12} /> 正常
              </div>
              <div className="text-2xl font-bold text-green-400 font-mono tabular-nums">
                {selectedReport.abnormal_normal}
              </div>
              <div className="text-xs text-green-400/60 mt-1">
                {((selectedReport.abnormal_normal / selectedReport.total_matches) * 100).toFixed(1)}%
                占比
              </div>
            </div>
          </div>

          {/* 核心提示 */}
          <div className="bg-gradient-to-r from-rose-500/10 via-orange-500/5 to-transparent border border-rose-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <Zap size={20} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-white font-bold mb-1">核心提示</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{selectedReport.summary}</p>
              </div>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 异动分布饼图 */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-cyan-400" />
                异动分布
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#e5e7eb',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 text-sm">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-400">{item.name}</span>
                    <span className="text-gray-300 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 方向引导分布 */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-5 lg:col-span-2">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Target size={18} className="text-cyan-400" />
                方向引导分布
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={(selectedReport.matches || []).reduce<{ dir: string; count: number }[]>(
                    (acc, m) => {
                      const existing = acc.find((a) => a.dir === m.direction_hint);
                      if (existing) existing.count++;
                      else acc.push({ dir: m.direction_hint, count: 1 });
                      return acc;
                    },
                    []
                  )}
                >
                  <XAxis
                    dataKey="dir"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#e5e7eb',
                    }}
                  />
                  <Bar dataKey="count" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 异动比赛列表 */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-gray-800">
              <h3 className="text-white font-bold flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-400" />
                异动比赛列表
                <span className="text-xs text-gray-500 font-normal">
                  共 {(selectedReport.matches || []).length} 场
                </span>
              </h3>
            </div>

            <div className="divide-y divide-gray-800/50">
              {(selectedReport.matches || []).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield size={48} className="mx-auto mb-3 opacity-30" />
                  <p>暂无异动比赛记录</p>
                </div>
              ) : (
                (selectedReport.matches || []).map((match) => {
                  const isExpanded = expandedMatches.has(match.match_no);
                  return (
                    <div key={match.match_no}>
                      <button
                        onClick={() => toggleMatch(match.match_no)}
                        className="w-full p-4 hover:bg-gray-800/30 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4">
                          {/* 序号 + 展开箭头 */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown size={16} className="text-gray-500" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-500" />
                            )}
                            <span className="text-xs text-gray-500 font-mono w-10">
                              {match.match_no}
                            </span>
                          </div>

                          {/* 联赛 */}
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-400 flex-shrink-0">
                            {match.league}
                          </span>

                          {/* 对阵 */}
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">
                              {match.home_team}{' '}
                              <span className="text-gray-600 mx-1">vs</span>{' '}
                              {match.away_team}
                            </div>
                          </div>

                          {/* 偏差率 */}
                          <div className="text-right flex-shrink-0">
                            <div
                              className={`font-bold font-mono ${
                                match.level === 'high'
                                  ? 'text-red-400'
                                  : match.level === 'medium'
                                  ? 'text-amber-400'
                                  : 'text-green-400'
                              }`}
                            >
                              +{match.deviation_pct}%
                            </div>
                            <div className="text-xs text-gray-600">偏差</div>
                          </div>

                          {/* 方向引导 */}
                          <div className="text-right flex-shrink-0 w-20">
                            <div className="text-sm text-cyan-400 font-medium">
                              {match.direction_hint}
                            </div>
                            <div className="text-xs text-gray-600">方向引导</div>
                          </div>

                          {/* 等级标签 */}
                          <div className="flex-shrink-0">{levelBadge(match.level)}</div>
                        </div>
                      </button>

                      {/* 展开详情 */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pl-16">
                          <div className="bg-[#0f0f1a] rounded-lg p-4 border border-gray-800">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500 text-xs mb-1">关键赔率</div>
                                <div className="text-white font-medium">{match.key_odds}</div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-xs mb-1">变化趋势</div>
                                <div className="text-white font-medium flex items-center gap-1.5">
                                  {trendIcon(match.change_trend)}
                                  {match.change_trend}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-xs mb-1">方向引导</div>
                                <div className="text-cyan-400 font-medium">
                                  {match.direction_hint}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 text-xs mb-1">偏差幅度</div>
                                <div
                                  className={`font-bold font-mono ${
                                    match.level === 'high'
                                      ? 'text-red-400'
                                      : 'text-amber-400'
                                  }`}
                                >
                                  +{match.deviation_pct}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
