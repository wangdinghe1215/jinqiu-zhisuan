'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Database,
  Calendar,
  Activity,
  PieChartIcon,
  BarChart3,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  Trophy,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
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

interface LeagueStat {
  league: string;
  count: number;
}

interface OverviewData {
  dateRange: { min: string; max: string; total: number };
  coverage: { analyzed: number; total: number; rate: number };
  leagues: LeagueStat[];
  pipeline: { date: string; status: string; duration: number; match_count: number; script_name: string }[];
  avgSpfHome: number;
  avgSpfAway: number;
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
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  handicap: number;
}

const PIE_COLORS = ['#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#f97316'];

export default function OverviewPage() {
  const [dbData, setDbData] = useState<OverviewData | null>(null);
  const [liveMatches, setLiveMatches] = useState<SportteryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(true);
  
  // 筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('全部');
  const [sortBy, setSortBy] = useState<'time' | 'hot' | 'odds'>('time');
  const [showLeagueList, setShowLeagueList] = useState(false);

  useEffect(() => {
    fetchOverview();
    fetchLiveMatches();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/overview');
      const result = await res.json();
      if (result.success) {
        setDbData(result.data);
      }
    } catch (error) {
      console.error('获取概览数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveMatches = async () => {
    try {
      const res = await fetch('/api/sporttery/matches?type=basic');
      const result = await res.json();
      if (result.success) {
        setLiveMatches(result.data || []);
      }
    } catch (error) {
      console.error('获取在售比赛失败:', error);
    } finally {
      setLiveLoading(false);
    }
  };

  // 在售比赛的联赛列表
  const liveLeagues = useMemo(() => {
    const set = new Set(liveMatches.map(m => m.league));
    return ['全部', ...Array.from(set)];
  }, [liveMatches]);

  // 筛选后的比赛
  const filteredMatches = useMemo(() => {
    let result = [...liveMatches];
    
    if (selectedLeague !== '全部') {
      result = result.filter(m => m.league === selectedLeague);
    }
    
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(m => 
        m.home_team.toLowerCase().includes(kw) ||
        m.away_team.toLowerCase().includes(kw) ||
        m.league.toLowerCase().includes(kw) ||
        m.match_no.toLowerCase().includes(kw)
      );
    }
    
    if (sortBy === 'hot') {
      result.sort((a, b) => (a.spf_home + a.spf_away) - (b.spf_home + b.spf_away));
    } else if (sortBy === 'odds') {
      result.sort((a, b) => a.spf_home - b.spf_home);
    }
    
    return result;
  }, [liveMatches, selectedLeague, searchKeyword, sortBy]);

  // 在售比赛联赛统计
  const liveLeagueStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of liveMatches) {
      map.set(m.league, (map.get(m.league) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([league, count]) => ({ league, count }))
      .sort((a, b) => b.count - a.count);
  }, [liveMatches]);

  const formatDate = (d: string) => {
    if (!d) return '-';
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  };

  const getOddsLevel = (odds: number) => {
    if (odds < 1.5) return { text: '超低', color: 'text-red-400' };
    if (odds < 2.0) return { text: '低', color: 'text-orange-400' };
    if (odds < 3.0) return { text: '中', color: 'text-yellow-400' };
    return { text: '高', color: 'text-green-400' };
  };

  return (
    <AppLayout>
      <div className="space-y-4 pb-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Database className="w-6 h-6 text-cyan-400" />
              数据概览
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              数据库统计 + 今日在售比赛实时数据
            </p>
          </div>
          <button
            onClick={() => { fetchOverview(); fetchLiveMatches(); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f2937] text-gray-300 rounded-lg hover:bg-[#374151] transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </button>
        </div>

        {/* 核心统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-[#1a1a2e] border border-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Target className="w-4 h-4 text-cyan-400" />
              今日在售
            </div>
            <div className="text-3xl font-bold text-cyan-400 tabular-nums">
              {liveLoading ? '...' : liveMatches.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">场竞彩比赛</div>
          </div>
          
          <div className="p-3 bg-[#1a1a2e] border border-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              赛事数量
            </div>
            <div className="text-3xl font-bold text-amber-400 tabular-nums">
              {liveLoading ? '...' : liveLeagueStats.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">个联赛/杯赛</div>
          </div>
          
          <div className="p-3 bg-[#1a1a2e] border border-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Calendar className="w-4 h-4 text-green-400" />
              历史总场次
            </div>
            <div className="text-3xl font-bold text-green-400 tabular-nums">
              {loading ? '...' : dbData?.dateRange.total?.toLocaleString() || '-'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? '' : dbData ? `${dbData.dateRange.min} ~ ${dbData.dateRange.max}` : '-'}
            </div>
          </div>
          
          <div className="p-3 bg-[#1a1a2e] border border-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Activity className="w-4 h-4 text-purple-400" />
              分析覆盖率
            </div>
            <div className="text-3xl font-bold text-purple-400 tabular-nums">
              {loading ? '...' : dbData ? `${(dbData.coverage.rate * 100).toFixed(1)}%` : '-'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? '' : dbData ? `${dbData.coverage.analyzed} / ${dbData.coverage.total} 场` : '-'}
            </div>
          </div>
        </div>

        {/* 筛选栏 - 今日在售比赛 */}
        <div className="p-3 bg-[#1a1a2e] border border-gray-700/50 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              今日在售比赛明细
              <span className="text-sm font-normal text-gray-500">
                （{filteredMatches.length} 场）
              </span>
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {/* 搜索框 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="搜索球队/联赛/场次..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0f0f1a] border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            
            {/* 联赛筛选 */}
            <div className="relative">
              <button
                onClick={() => setShowLeagueList(!showLeagueList)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0f0f1a] border border-gray-700 rounded-lg text-gray-300 text-sm hover:border-gray-600 transition-colors min-w-[140px] justify-between"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  {selectedLeague}
                </span>
                {showLeagueList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showLeagueList && (
                <div className="absolute top-full mt-1 right-0 w-full max-h-60 overflow-y-auto bg-[#1f2937] border border-gray-600 rounded-lg z-20 shadow-xl">
                  {liveLeagues.map(league => (
                    <button
                      key={league}
                      onClick={() => { setSelectedLeague(league); setShowLeagueList(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[#374151] transition-colors ${
                        selectedLeague === league ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-300'
                      }`}
                    >
                      {league}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* 排序 */}
            <div className="flex gap-1">
              {[
                { key: 'time', label: '按时间' },
                { key: 'hot', label: '按热度' },
                { key: 'odds', label: '按主胜赔率' },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setSortBy(item.key as typeof sortBy)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    sortBy === item.key
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-[#0f0f1a] text-gray-400 border border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 比赛列表 */}
          {liveLoading ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3" />
              加载中...
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              暂无符合条件的比赛
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700/50">
                    <th className="text-left py-3 px-3 font-medium">场次</th>
                    <th className="text-left py-3 px-3 font-medium">联赛</th>
                    <th className="text-left py-3 px-3 font-medium">主队</th>
                    <th className="text-center py-3 px-3 font-medium">SPF赔率</th>
                    <th className="text-right py-3 px-3 font-medium">客队</th>
                    <th className="text-center py-3 px-3 font-medium">让球</th>
                    <th className="text-center py-3 px-3 font-medium">开赛时间</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.slice(0, 20).map((m) => (
                    <tr key={m.match_no} className="border-b border-gray-800/50 hover:bg-[#1f2937]/50 transition-colors">
                      <td className="py-3 px-3 text-cyan-400 font-mono">{m.match_no}</td>
                      <td className="py-3 px-3 text-gray-400">{m.league}</td>
                      <td className="py-3 px-3 text-gray-200 text-right">{m.home_team}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-2 font-mono">
                          <span className={`px-2 py-0.5 rounded bg-red-500/10 ${getOddsLevel(m.spf_home).color}`}>
                            {m.spf_home?.toFixed(2)}
                          </span>
                          <span className="text-yellow-500/70">
                            {m.spf_draw?.toFixed(2)}
                          </span>
                          <span className={`px-2 py-0.5 rounded bg-blue-500/10 ${getOddsLevel(m.spf_away).color}`}>
                            {m.spf_away?.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-200">{m.away_team}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono ${m.handicap > 0 ? 'text-red-400' : m.handicap < 0 ? 'text-blue-400' : 'text-gray-500'}`}>
                          {m.handicap > 0 ? '+' : ''}{m.handicap}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-gray-400 font-mono">
                        {m.match_time?.slice(0, 5)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMatches.length > 20 && (
                <div className="text-center py-3 text-gray-500 text-sm">
                  共 {filteredMatches.length} 场，仅显示前 20 场 - 请使用筛选缩小范围
                </div>
              )}
            </div>
          )}
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 联赛分布饼图 */}
          <div className="p-3 bg-[#1a1a2e] border border-gray-700/50 rounded-xl">
            <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2 mb-4">
              <PieChartIcon className="w-4 h-4 text-cyan-400" />
              今日在售赛事分布
            </h3>
            <div className="h-64">
              {liveLeagueStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={liveLeagueStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="league"
                      label={({ league, percent }) => `${league} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {liveLeagueStats.map((entry, index) => (
                        <Cell key={entry.league} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">暂无数据</div>
              )}
            </div>
          </div>

          {/* 数据库联赛柱状图 */}
          <div className="p-3 bg-[#1a1a2e] border border-gray-700/50 rounded-xl">
            <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              历史数据库联赛分布 TOP10
            </h3>
            <div className="h-64">
              {dbData && dbData.leagues.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dbData.leagues.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" stroke="#6b7280" fontSize={11} />
                    <YAxis
                      dataKey="league"
                      type="category"
                      stroke="#9ca3af"
                      fontSize={11}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">暂无数据</div>
              )}
            </div>
          </div>
        </div>

        {/* 流水线状态 */}
        {dbData && dbData.pipeline && (
          <div className="p-3 bg-[#1a1a2e] border border-gray-700/50 rounded-xl">
            <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-green-400" />
              最近运行记录
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-700/50">
                    <th className="text-left py-3 px-3 font-medium">日期</th>
                    <th className="text-left py-3 px-3 font-medium">脚本</th>
                    <th className="text-center py-3 px-3 font-medium">状态</th>
                    <th className="text-right py-3 px-3 font-medium">处理场次</th>
                    <th className="text-right py-3 px-3 font-medium">耗时</th>
                  </tr>
                </thead>
                <tbody>
                  {dbData.pipeline.slice(0, 7).map((p, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-[#1f2937]/50">
                      <td className="py-3 px-3 text-gray-300 font-mono">{p.date}</td>
                      <td className="py-3 px-3 text-gray-400">{p.script_name}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          p.status === '成功' ? 'bg-green-500/20 text-green-400' :
                          p.status === '失败' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            p.status === '成功' ? 'bg-green-400' :
                            p.status === '失败' ? 'bg-red-400' :
                            'bg-yellow-400 animate-pulse'
                          }`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-cyan-400 font-mono">{p.match_count}</td>
                      <td className="py-3 px-3 text-right text-gray-400 font-mono">{p.duration}秒</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
