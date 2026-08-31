'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Search,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Plus,
  X,
  Filter,
  Target,
  Trophy,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  loadAndMerge,
  filterMatches,
  genConditionId,
  fieldLabels,
  oddsFields,
  type FilterCondition,
  type FilterField,
  type MatchMode,
  type MergedMatch,
  type FilterResult,
  type OddsType,
} from '@/lib/mergedOddsData';
import type { ScoreItem } from '@/lib/mockOddsData';

export default function BizhonggePage() {
  // 多条件筛选
  const [conditions, setConditions] = useState<FilterCondition[]>([
    {
      id: genConditionId(),
      field: 'spf_home',
      mode: 'exact',
      value: '1.56',
    },
  ]);

  const [result, setResult] = useState<FilterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 今日在售比赛（sporttery API）
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // 展开的比分
  const [expandedScore, setExpandedScore] = useState<string | null>(null);

  // 加载今日比赛
  useEffect(() => {
    setLiveLoading(true);
    fetch('/api/sporttery/matches?type=basic')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setLiveMatches(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLiveLoading(false));
  }, []);

  // 添加筛选条件
  const addCondition = useCallback(() => {
    setConditions(prev => [
      ...prev,
      {
        id: genConditionId(),
        field: 'spf_draw',
        mode: 'exact',
        value: '3.60',
      },
    ]);
  }, []);

  // 删除筛选条件
  const removeCondition = useCallback((id: string) => {
    setConditions(prev => prev.filter(c => c.id !== id));
  }, []);

  // 更新筛选条件
  const updateCondition = useCallback(
    (id: string, updates: Partial<FilterCondition>) => {
      setConditions(prev =>
        prev.map(c => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    []
  );

  // 快速填入赔率
  const quickFill = useCallback((field: FilterField, value: string) => {
    // 检查是否已有同类型条件，有则更新第一个，没有则新增
    const existing = conditions.find(c => c.field === field);
    if (existing) {
      updateCondition(existing.id, { mode: 'exact', value });
    } else {
      setConditions(prev => [
        ...prev,
        { id: genConditionId(), field, mode: 'exact', value },
      ]);
    }
  }, [conditions, updateCondition]);

  // 执行筛选
  const handleSearch = useCallback(async () => {
    if (conditions.length === 0) return;

    setLoading(true);
    setHasSearched(true);
    setCurrentPage(1);
    setExpandedScore(null);

    try {
      // 收集需要加载的赔率类型
      const neededTypes: OddsType[] = [];
      for (const c of conditions) {
        if (oddsFields.includes(c.field as any) && !neededTypes.includes(c.field as OddsType)) {
          neededTypes.push(c.field as OddsType);
        }
      }

      // 如果没有赔率类条件（只有联赛），默认加载 spf_home
      if (neededTypes.length === 0) {
        neededTypes.push('spf_home');
      }

      // 为了更全面的统计，加载所有6个赔率类型（数据量不大，一次性加载）
      const allTypes: OddsType[] = ['spf_home', 'spf_draw', 'spf_away', 'rspf_home', 'rspf_draw', 'rspf_away'];
      const matches = await loadAndMerge(allTypes);
      const filterResult = filterMatches(matches, conditions);
      setResult(filterResult);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [conditions]);

  // 分页数据
  const pageMatches = useMemo(() => {
    if (!result) return [];
    const start = (currentPage - 1) * pageSize;
    return result.matches.slice(start, start + pageSize);
  }, [result, currentPage]);

  const totalPages = useMemo(
    () => (result ? Math.ceil(result.total / pageSize) : 0),
    [result]
  );

  // 饼图数据
  const pieData = useMemo(() => {
    if (!result) return [];
    return [
      { name: '主胜', value: result.win, color: '#ef4444' },
      { name: '平局', value: result.draw, color: '#eab308' },
      { name: '客胜', value: result.lose, color: '#3b82f6' },
    ];
  }, [result]);

  // 柱状图数据（Top20比分）
  const barData = useMemo(() => {
    if (!result) return [];
    return result.scores.slice(0, 20).map(s => ({
      score: s.score,
      场次: s.count,
    }));
  }, [result]);

  // 某比分下的比赛
  const scoreMatches = useMemo(() => {
    if (!result || !expandedScore) return [];
    return result.matches.filter(m => m.fullTimeScore === expandedScore);
  }, [result, expandedScore]);

  return (
    <AppLayout>
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-cyan-400" />
            必中哥分析 - 赔率历史回查
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            多条件组合筛选，精准定位历史赔率分布
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="px-3 py-1.5 bg-[#1a1a2e] border border-gray-700 rounded-lg text-gray-300">
            数据源：6类赔率历史数据
          </div>
        </div>
      </div>

      {/* 今日在售比赛 */}
      <div className="p-3 bg-[#1a1a2e] border border-orange-500/30 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-orange-300">
            今日在售比赛 · 点击赔率快速查询
          </span>
          {liveLoading && (
            <span className="text-xs text-gray-500">加载中...</span>
          )}
        </div>
        {liveMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {liveMatches.map((m: any) => (
              <div
                key={m.match_no}
                className="p-3 bg-[#0f0f1a] rounded-lg border border-gray-700/50 hover:border-orange-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-orange-400 font-medium">
                    {m.match_no}
                  </span>
                  <span className="text-xs text-gray-500">{m.league}</span>
                </div>
                <div className="text-sm text-white font-medium mb-2 text-center">
                  {m.home_team} vs {m.away_team}
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <button
                    onClick={() => quickFill('spf_home', String(m.spf_home))}
                    className="px-1.5 py-1 bg-red-900/30 text-red-400 rounded hover:bg-red-900/60 transition-colors truncate"
                    title="点击查询SPF主胜"
                  >
                    主{m.spf_home?.toFixed(2)}
                  </button>
                  <button
                    onClick={() => quickFill('spf_draw', String(m.spf_draw))}
                    className="px-1.5 py-1 bg-yellow-900/30 text-yellow-400 rounded hover:bg-yellow-900/60 transition-colors truncate"
                    title="点击查询SPF平局"
                  >
                    平{m.spf_draw?.toFixed(2)}
                  </button>
                  <button
                    onClick={() => quickFill('spf_away', String(m.spf_away))}
                    className="px-1.5 py-1 bg-blue-900/30 text-blue-400 rounded hover:bg-blue-900/60 transition-colors truncate"
                    title="点击查询SPF客胜"
                  >
                    客{m.spf_away?.toFixed(2)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !liveLoading && (
            <div className="text-sm text-gray-500">今日暂无竞彩比赛在售</div>
          )
        )}
      </div>

      {/* 多条件筛选面板 */}
      <div className="p-3 bg-[#1a1a2e] border border-gray-700 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold text-white">多条件筛选</span>
            <span className="text-xs text-gray-500">
              条件之间为 AND 关系（同时满足）
            </span>
          </div>
          <button
            onClick={addCondition}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加条件
          </button>
        </div>

        <div className="space-y-3">
          {conditions.map((cond, idx) => (
            <ConditionRow
              key={cond.id}
              condition={cond}
              index={idx}
              onUpdate={updates => updateCondition(cond.id, updates)}
              onRemove={() => removeCondition(cond.id)}
              canRemove={conditions.length > 1}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSearch}
            disabled={loading || conditions.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Target className="w-5 h-5" />
            )}
            {loading ? '查询中...' : '开始查询'}
          </button>
          <div className="text-sm text-gray-400">
            共 <span className="text-cyan-400 font-medium">{conditions.length}</span> 个条件
          </div>
        </div>
      </div>

      {/* Result */}
      {!hasSearched ? (
        <div className="p-16 text-center bg-[#1a1a2e] border border-dashed border-gray-700 rounded-xl">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">设置筛选条件后点击"开始查询"</p>
          <p className="text-gray-600 text-sm mt-2">
            支持多赔率叠加、联赛筛选、范围匹配
          </p>
        </div>
      ) : loading ? (
        <div className="p-16 text-center bg-[#1a1a2e] border border-gray-700 rounded-xl">
          <RefreshCw className="w-10 h-10 text-cyan-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">正在筛选数据...</p>
        </div>
      ) : result && result.total > 0 ? (
        <>
          {/* Probability Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-[#1a1a2e] border border-red-500/30 rounded-xl text-center">
              <div className="text-sm text-gray-400 mb-1">主胜场次</div>
              <div className="text-3xl font-bold text-red-400 tabular-nums">
                {result.win}
              </div>
              <div className="text-lg text-red-300 tabular-nums mt-1">
                {(result.winRate * 100).toFixed(1)}%
              </div>
              <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                  style={{ width: `${result.winRate * 100}%` }}
                />
              </div>
            </div>
            <div className="p-3 bg-[#1a1a2e] border border-yellow-500/30 rounded-xl text-center">
              <div className="text-sm text-gray-400 mb-1">平局场次</div>
              <div className="text-3xl font-bold text-yellow-400 tabular-nums">
                {result.draw}
              </div>
              <div className="text-lg text-yellow-300 tabular-nums mt-1">
                {(result.drawRate * 100).toFixed(1)}%
              </div>
              <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
                  style={{ width: `${result.drawRate * 100}%` }}
                />
              </div>
            </div>
            <div className="p-3 bg-[#1a1a2e] border border-blue-500/30 rounded-xl text-center">
              <div className="text-sm text-gray-400 mb-1">客胜场次</div>
              <div className="text-3xl font-bold text-blue-400 tabular-nums">
                {result.lose}
              </div>
              <div className="text-lg text-blue-300 tabular-nums mt-1">
                {(result.loseRate * 100).toFixed(1)}%
              </div>
              <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                  style={{ width: `${result.loseRate * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats summary row */}
          <div className="p-3 bg-[#1a1a2e] border border-gray-700 rounded-xl">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">总场次：</span>
                <span className="text-white font-medium tabular-nums">{result.total} 场</span>
              </div>
              <div>
                <span className="text-gray-500">胜率最高赔率类型：</span>
                {(() => {
                  let best: { type: string; rate: number } = { type: '-', rate: 0 };
                  for (const [t, s] of Object.entries(result.oddsSummary)) {
                    if (s.total >= 10 && s.winRate > best.rate) {
                      best = { type: t, rate: s.winRate };
                    }
                  }
                  return (
                    <span className="text-green-400 font-medium">
                      {best.type} ({(best.rate * 100).toFixed(1)}%)
                    </span>
                  );
                })()}
              </div>
              <div className="ml-auto flex items-center gap-2 text-gray-400">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>匹配 {result.scores.length} 种比分</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 赛果分布饼图 */}
            <div className="p-3 bg-[#1a1a2e] border border-gray-700 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <PieChartIcon className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">赛果分布</span>
              </div>
              <div className="h-60">
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
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-gray-300 text-sm">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 比分分布柱状图 */}
            <div className="p-3 bg-[#1a1a2e] border border-gray-700 rounded-xl lg:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">
                  比分分布 Top20
                </span>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis
                      dataKey="score"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="场次" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 比分详细列表 */}
          <div className="p-3 bg-[#1a1a2e] border border-gray-700 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-white">比分详细列表</span>
              <span className="text-xs text-gray-500">
                共 {result.scores.length} 种比分，点击展开查看比赛
              </span>
            </div>
            {result.scores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无比分数据</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {result.scores.map(s => (
                  <button
                    key={s.score}
                    onClick={() =>
                      setExpandedScore(expandedScore === s.score ? null : s.score)
                    }
                    className={`p-3 rounded-lg border text-center transition-all ${
                      expandedScore === s.score
                        ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300'
                        : 'bg-[#0f0f1a] border-gray-700 hover:border-cyan-600 text-gray-300'
                    }`}
                  >
                    <div className="text-lg font-bold tabular-nums">{s.score}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {s.count} 场 ({((s.count / result.total) * 100).toFixed(1)}%)
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 展开的比分比赛列表 */}
            {expandedScore && (
              <div className="mt-4 p-4 bg-[#0f0f1a] border border-cyan-500/30 rounded-lg">
                <div className="text-sm text-cyan-400 mb-3 font-medium">
                  比分 {expandedScore} · 共 {scoreMatches.length} 场比赛
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {scoreMatches.map(m => (
                    <div
                      key={m.id}
                      className="p-2.5 bg-[#1a1a2e] rounded border border-gray-700/50 text-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-xs">{m.date}</span>
                        <span className="text-xs text-cyan-600">{m.league}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-white truncate flex-1">
                          {m.homeTeam}
                        </span>
                        <span className="mx-2 text-cyan-400 font-bold">
                          {m.fullTimeScore}
                        </span>
                        <span className="text-white truncate flex-1 text-right">
                          {m.awayTeam}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 比赛明细表格 */}
          <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-white">比赛明细</span>
                <span className="text-xs text-gray-500">
                  共 {result.total} 场，每页 {pageSize} 条
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#16213e] text-gray-400 text-left">
                    <th className="px-4 py-3 font-medium">日期</th>
                    <th className="px-4 py-3 font-medium">联赛</th>
                    <th className="px-4 py-3 font-medium">主队</th>
                    <th className="px-4 py-3 font-medium">客队</th>
                    <th className="px-4 py-3 font-medium text-center">比分</th>
                    <th className="px-4 py-3 font-medium text-center">结果</th>
                    <th className="px-4 py-3 font-medium text-center">SPF主</th>
                    <th className="px-4 py-3 font-medium text-center">SPF平</th>
                    <th className="px-4 py-3 font-medium text-center">SPF客</th>
                  </tr>
                </thead>
                <tbody>
                  {pageMatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    pageMatches.map((m, i) => (
                      <tr
                        key={m.id}
                        className={`border-t border-gray-800 hover:bg-[#16213e]/50 transition-colors ${
                          i % 2 === 0 ? 'bg-[#0f0f1a]/30' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 text-gray-400 tabular-nums">
                          {m.date}
                        </td>
                        <td className="px-4 py-2.5 text-cyan-400">{m.league}</td>
                        <td className="px-4 py-2.5 text-white">{m.homeTeam}</td>
                        <td className="px-4 py-2.5 text-white">{m.awayTeam}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-yellow-400 tabular-nums">
                          {m.fullTimeScore}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              m.fullTimeResult === 'win'
                                ? 'bg-red-900/40 text-red-400'
                                : m.fullTimeResult === 'draw'
                                ? 'bg-yellow-900/40 text-yellow-400'
                                : 'bg-blue-900/40 text-blue-400'
                            }`}
                          >
                            {m.fullTimeResult === 'win'
                              ? '主胜'
                              : m.fullTimeResult === 'draw'
                              ? '平'
                              : '客胜'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-300 tabular-nums">
                          {m.spf_home?.toFixed(2) || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-300 tabular-nums">
                          {m.spf_draw?.toFixed(2) || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-300 tabular-nums">
                          {m.spf_away?.toFixed(2) || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-gray-700 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-[#0f0f1a] border border-gray-700 text-gray-300 rounded hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-400 px-3">
                  第 <span className="text-cyan-400">{currentPage}</span> /{' '}
                  {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-[#0f0f1a] border border-gray-700 text-gray-300 rounded hover:border-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-16 text-center bg-[#1a1a2e] border border-gray-700 rounded-xl">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">未找到符合条件的比赛</p>
          <p className="text-gray-600 text-sm mt-2">请调整筛选条件后重试</p>
        </div>
      )}
    </div>
    </AppLayout>
  );
}

// ——— 单个筛选条件行组件 ———
interface ConditionRowProps {
  condition: FilterCondition;
  index: number;
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function ConditionRow({ condition, index, onUpdate, onRemove, canRemove }: ConditionRowProps) {
  const isLeague = condition.field === 'league';

  return (
    <div className="flex items-center gap-3 p-3 bg-[#0f0f1a] border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
      {/* 序号 */}
      <div className="w-7 h-7 rounded-full bg-cyan-900/40 text-cyan-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
        {index + 1}
      </div>

      {/* 字段选择 */}
      <select
        value={condition.field}
        onChange={e => onUpdate({ field: e.target.value as FilterField })}
        className="px-3 py-1.5 bg-[#1a1a2e] border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500 min-w-[130px]"
      >
        {Object.entries(fieldLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* 匹配方式（仅赔率类显示） */}
      {!isLeague && (
        <select
          value={condition.mode}
          onChange={e => onUpdate({ mode: e.target.value as MatchMode })}
          className="px-3 py-1.5 bg-[#1a1a2e] border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="exact">精准匹配</option>
          <option value="range">范围匹配</option>
        </select>
      )}

      {/* 输入区 */}
      <div className="flex-1 flex items-center gap-2">
        {isLeague ? (
          <input
            type="text"
            value={condition.value}
            onChange={e => onUpdate({ value: e.target.value })}
            placeholder="输入联赛名称，如：英超"
            className="w-full px-3 py-1.5 bg-[#1a1a2e] border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500 placeholder-gray-600"
          />
        ) : condition.mode === 'exact' ? (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-gray-500 text-sm">= </span>
            <input
              type="number"
              step="0.01"
              value={condition.value}
              onChange={e => onUpdate({ value: e.target.value })}
              placeholder="赔率值，如 1.56"
              className="flex-1 px-3 py-1.5 bg-[#1a1a2e] border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500 placeholder-gray-600 tabular-nums"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="number"
              step="0.01"
              value={condition.valueMin || ''}
              onChange={e => onUpdate({ valueMin: e.target.value })}
              placeholder="最小值"
              className="flex-1 px-3 py-1.5 bg-[#1a1a2e] border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500 placeholder-gray-600 tabular-nums"
            />
            <span className="text-gray-500 text-sm">—</span>
            <input
              type="number"
              step="0.01"
              value={condition.valueMax || ''}
              onChange={e => onUpdate({ valueMax: e.target.value })}
              placeholder="最大值"
              className="flex-1 px-3 py-1.5 bg-[#1a1a2e] border border-gray-600 text-white rounded-lg text-sm focus:outline-none focus:border-cyan-500 placeholder-gray-600 tabular-nums"
            />
          </div>
        )}
      </div>

      {/* 删除按钮 */}
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className="w-8 h-8 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
        title="删除条件"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
