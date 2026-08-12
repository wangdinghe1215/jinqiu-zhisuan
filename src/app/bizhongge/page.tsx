'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Zap,
  ArrowRight,
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
  findByOdds,
  findByRange,
  aggregateRecords,
  type OddsRecord,
  type MatchDetail,
  type ScoreItem,
} from '@/lib/mockOddsData';

type OddsType =
  | 'spf_home'
  | 'spf_draw'
  | 'spf_away'
  | 'rspf_home'
  | 'rspf_draw'
  | 'rspf_away';

const oddsTypeOptions: { value: OddsType; label: string }[] = [
  { value: 'spf_home', label: 'SPF 主胜' },
  { value: 'spf_draw', label: 'SPF 平局' },
  { value: 'spf_away', label: 'SPF 客负' },
  { value: 'rspf_home', label: 'RSPF 主胜' },
  { value: 'rspf_draw', label: 'RSPF 平局' },
  { value: 'rspf_away', label: 'RSPF 客负' },
];

export default function BizhonggePage() {
  const [oddsType, setOddsType] = useState<OddsType>('spf_home');
  const [inputValue, setInputValue] = useState('1.56');
  const [searchMode, setSearchMode] = useState<'exact' | 'range'>('exact');
  const [rangeStart, setRangeStart] = useState('1.50');
  const [rangeEnd, setRangeEnd] = useState('1.60');
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedScore, setExpandedScore] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // 内存中缓存数据
  const [dataCache, setDataCache] = useState<Record<OddsType, OddsRecord[] | null>>({
    spf_home: null,
    spf_draw: null,
    spf_away: null,
    rspf_home: null,
    rspf_draw: null,
    rspf_away: null,
  });
  const [dataLoading, setDataLoading] = useState(false);

  const [result, setResult] = useState<ReturnType<typeof aggregateRecords> | null>(null);

  // 今日在售比赛数据
  const [todayMatches, setTodayMatches] = useState<any[]>([]);
  const [todayLoading, setTodayLoading] = useState(true);

  useEffect(() => {
    const loadToday = async () => {
      try {
        const res = await fetch('/api/sporttery/matches?type=basic');
        const data = await res.json();
        if (data.success) {
          setTodayMatches(data.data || []);
        }
      } catch (e) {
        console.error('加载今日比赛失败:', e);
      } finally {
        setTodayLoading(false);
      }
    };
    loadToday();
  }, []);

  // 从 public/data/ 目录加载对应 JSON 文件
  const loadData = useCallback(async (type: OddsType): Promise<OddsRecord[]> => {
    if (dataCache[type]) return dataCache[type]!;
    try {
      const res = await fetch(`/data/${type}.json`, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OddsRecord[] = await res.json();
      setDataCache((prev) => ({ ...prev, [type]: data }));
      return data;
    } catch (e) {
      console.error(`加载 ${type}.json 失败:`, e);
      // 加载失败返回空数组
      setDataCache((prev) => ({ ...prev, [type]: [] }));
      return [];
    }
  }, [dataCache]);

  const handleSearch = async () => {
    setLoading(true);
    setDataLoading(true);
    setHasSearched(true);
    setCurrentPage(1);
    setExpandedScore(null);

    // 加载对应赔率类型的数据
    const data = await loadData(oddsType);
    setDataLoading(false);
    let records: OddsRecord[];

    if (searchMode === 'exact') {
      const odds = parseFloat(inputValue);
      if (isNaN(odds)) {
        setResult(null);
        setLoading(false);
        return;
      }
      records = findByOdds(data, odds, 0.02);
    } else {
      const min = parseFloat(rangeStart);
      const max = parseFloat(rangeEnd);
      if (isNaN(min) || isNaN(max)) {
        setResult(null);
        setLoading(false);
        return;
      }
      records = findByRange(data, Math.min(min, max), Math.max(min, max));
    }

    const agg = aggregateRecords(records);
    setResult(agg);
    setLoading(false);
  };

  // 按比分筛选比赛
  const filteredMatches = useMemo(() => {
    if (!result) return [];
    if (!expandedScore) return result.matches;
    return result.matches.filter((m) => m.s === expandedScore);
  }, [result, expandedScore]);

  const totalPages = Math.ceil(filteredMatches.length / PAGE_SIZE);
  const pageMatches = filteredMatches.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const pieData = result
    ? [
        { name: '胜', value: result.win, color: '#10b981' },
        { name: '平', value: result.draw, color: '#eab308' },
        { name: '负', value: result.lose, color: '#ef4444' },
      ]
    : [];

  const barData = result?.scores.slice(0, 20).map((s) => ({
    name: s.score,
    次数: s.count,
  })) || [];

  // 根据赔率类型获取对应赔率值
  const getOddsValue = (match: any): number => {
    switch (oddsType) {
      case 'spf_home': return match.spf_home || 0;
      case 'spf_draw': return match.spf_draw || 0;
      case 'spf_away': return match.spf_away || 0;
      case 'rspf_home': return match.rspf_home || 0;
      case 'rspf_draw': return match.rspf_draw || 0;
      case 'rspf_away': return match.rspf_away || 0;
      default: return 0;
    }
  };

  // 快捷查询：点击今日比赛直接填入赔率
  const quickSearch = (match: any) => {
    const odds = getOddsValue(match);
    if (odds > 0) {
      setSearchMode('exact');
      setInputValue(odds.toFixed(2));
    }
  };

  const resultLabel = oddsType.includes('home')
    ? { win: '主胜', draw: '平局', lose: '客胜' }
    : oddsType.includes('away')
    ? { win: '客胜', draw: '平局', lose: '主胜' }
    : { win: '平局', draw: '主胜', lose: '客胜' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Search className="text-orange-400" size={28} />
          必中哥分析
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          赔率历史回查工具 - 查询特定赔率下的历史赛果分布
        </p>
      </div>

      {/* 今日在售比赛赔率 */}
      <div className="p-4 bg-[#1a1a2e] border border-orange-500/30 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-orange-400" />
          <span className="text-white font-semibold">今日在售比赛 · {oddsTypeOptions.find(o=>o.value===oddsType)?.label}</span>
          <span className="text-gray-500 text-xs ml-auto">
            {todayLoading ? '加载中...' : `共 ${todayMatches.length} 场`}
          </span>
        </div>
        {todayLoading ? (
          <div className="text-gray-500 text-sm text-center py-4">加载今日比赛数据...</div>
        ) : todayMatches.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">今日暂无竞彩比赛在售</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {todayMatches.map((m) => {
              const odds = getOddsValue(m);
              return (
                <button
                  key={m.match_no}
                  onClick={() => quickSearch(m)}
                  className="group bg-[#0f0f1a] hover:bg-orange-500/10 border border-[#2d3748] hover:border-orange-500/50 rounded-lg p-2 text-left transition-all"
                >
                  <div className="text-xs text-gray-500 font-mono">{m.match_no} · {m.league}</div>
                  <div className="text-white text-xs mt-1 truncate">{m.home_team}</div>
                  <div className="text-gray-500 text-xs">vs</div>
                  <div className="text-white text-xs truncate">{m.away_team}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-orange-400 font-mono font-bold text-sm">
                      {odds > 0 ? odds.toFixed(2) : '-'}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-orange-400 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          💡 点击比赛卡片快速查询该赔率的历史回查结果
        </p>
      </div>

      {/* Search Panel */}
      <div className="p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
        <div className="flex flex-wrap items-end gap-4">
          {/* 赔率类型 */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm text-gray-400 mb-2">
              赔率类型
            </label>
            <select
              value={oddsType}
              onChange={(e) => setOddsType(e.target.value as OddsType)}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-orange-500"
            >
              {oddsTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                  {dataCache[opt.value] ? ` (${dataCache[opt.value]!.length}条)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 搜索模式切换 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-2">
              查询模式
            </label>
            <div className="flex bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setSearchMode('exact')}
                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${
                  searchMode === 'exact'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                精确匹配
              </button>
              <button
                onClick={() => setSearchMode('range')}
                className={`flex-1 py-1.5 text-sm rounded-md transition-all ${
                  searchMode === 'range'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                范围查询
              </button>
            </div>
          </div>

          {/* 赔率输入 */}
          {searchMode === 'exact' ? (
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm text-gray-400 mb-2">
                赔率值
              </label>
              <input
                type="number"
                step="0.01"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="如 1.56"
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
          ) : (
            <div className="flex-1 min-w-[200px] flex gap-2">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-2">
                  最小赔率
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  placeholder="1.50"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-2">
                  最大赔率
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  placeholder="1.60"
                  className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* 搜索按钮 */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            查询
          </button>
        </div>
      </div>

      {/* Result */}
      {!hasSearched ? (
        <div className="p-20 text-center bg-[#1a1a2e] border border-gray-800 rounded-xl">
          <Search size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-500">选择赔率类型并输入赔率值开始查询</p>
          <p className="text-gray-600 text-sm mt-2">
            支持精确匹配和范围查询两种模式
          </p>
        </div>
      ) : (
        <>
          {/* Probability Cards */}
          <div className="grid grid-cols-3 gap-4">
            <ProbabilityCard
              label={resultLabel.win}
              value={result?.win || 0}
              rate={result?.win_rate || 0}
              color="green"
            />
            <ProbabilityCard
              label={resultLabel.draw}
              value={result?.draw || 0}
              rate={result?.draw_rate || 0}
              color="yellow"
            />
            <ProbabilityCard
              label={resultLabel.lose}
              value={result?.lose || 0}
              rate={result?.lose_rate || 0}
              color="red"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie chart */}
            <div className="p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <PieChartIcon size={16} className="text-purple-400" />
                赛果分布
              </h3>
              <div className="h-56">
                {loading || !result ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    加载中...
                  </div>
                ) : result.total === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    无数据
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid #2d3748',
                          borderRadius: '8px',
                          color: '#e5e7eb',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-500">
                  总场次:{' '}
                  <span className="text-white font-mono">{result?.total || 0}</span>
                </span>
              </div>
            </div>

            {/* Score distribution bar chart */}
            <div className="lg:col-span-2 p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-cyan-400" />
                比分分布 Top20
              </h3>
              <div className="h-56">
                {loading || !result ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    加载中...
                  </div>
                ) : barData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    无数据
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                      <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis stroke="#6b7280" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid #2d3748',
                          borderRadius: '8px',
                          color: '#e5e7eb',
                        }}
                      />
                      <Bar
                        dataKey="次数"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Score list with expand */}
          <div className="p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-yellow-400" />
              比分详细列表
              <span className="text-xs text-gray-500 ml-2">
                点击比分查看对应比赛
              </span>
            </h3>

            {result?.scores.length === 0 ? (
              <div className="text-center py-8 text-gray-500">无数据</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {result?.scores.map((s: ScoreItem) => (
                  <button
                    key={s.score}
                    onClick={() => {
                      setExpandedScore(expandedScore === s.score ? null : s.score);
                      setCurrentPage(1);
                    }}
                    className={`p-3 rounded-lg text-left transition-all ${
                      expandedScore === s.score
                        ? 'bg-orange-500/20 border border-orange-500/50'
                        : 'bg-gray-900/50 border border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-mono font-bold text-lg">
                        {s.score}
                      </span>
                      {expandedScore === s.score ? (
                        <ChevronUp size={14} className="text-orange-400" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">出现次数</span>
                      <span className="text-sm font-mono text-cyan-400 tabular-nums">
                        {s.count}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{
                          width: `${
                            (s.count / (result?.total || 1)) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Match table */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-white">比赛明细</h3>
                <span className="text-xs text-gray-500">
                  共 {filteredMatches.length} 场
                  {expandedScore && (
                    <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                      比分: {expandedScore}
                    </span>
                  )}
                </span>
              </div>
              {expandedScore && (
                <button
                  onClick={() => {
                    setExpandedScore(null);
                    setCurrentPage(1);
                  }}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  显示全部
                </button>
              )}
            </div>

            {pageMatches.length === 0 ? (
              <div className="p-10 text-center text-gray-500">暂无比赛数据</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-900/50">
                        <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">
                          日期
                        </th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">
                          联赛
                        </th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">
                          主队
                        </th>
                        <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium uppercase">
                          比分
                        </th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">
                          客队
                        </th>
                        <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium uppercase">
                          结果
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {pageMatches.map((m: MatchDetail, idx: number) => (
                        <tr
                          key={idx}
                          className="row-zebra hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-mono text-gray-400 text-xs">
                            {m.d}
                          </td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">
                            {m.l}
                          </td>
                          <td className="px-4 py-2.5 text-red-400">
                            {m.h}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono text-yellow-400 font-bold">
                            {m.s}
                          </td>
                          <td className="px-4 py-2.5 text-blue-400">
                            {m.a}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                m.r === 'win'
                                  ? 'bg-green-500/20 text-green-400'
                                  : m.r === 'draw'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {m.r === 'win'
                                ? resultLabel.win
                                : m.r === 'draw'
                                ? resultLabel.draw
                                : resultLabel.lose}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-800 flex items-center justify-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    <span className="text-sm text-gray-400">
                      第{' '}
                      <span className="text-white font-mono">
                        {currentPage}
                      </span>{' '}
                      / {totalPages} 页
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ProbabilityCard({
  label,
  value,
  rate,
  color,
}: {
  label: string;
  value: number;
  rate: number;
  color: 'green' | 'yellow' | 'red';
}) {
  const colorMap = {
    green: {
      text: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      bar: 'from-green-500 to-emerald-400',
    },
    yellow: {
      text: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      bar: 'from-yellow-500 to-amber-400',
    },
    red: {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      bar: 'from-red-500 to-orange-400',
    },
  };
  const c = colorMap[color];

  return (
    <div className={`p-6 bg-[#1a1a2e] border ${c.border} rounded-xl`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        <Info size={14} className="text-gray-600" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-bold ${c.text} tabular-nums`}>
          {(rate * 100).toFixed(1)}%
        </span>
        <span className="text-sm text-gray-500">{value} 场</span>
      </div>
      <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(rate * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
