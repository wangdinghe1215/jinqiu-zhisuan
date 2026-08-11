'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { MatchCard, type MatchData } from '@/components/MatchCard';
import { TLevelBadge } from '@/components/badges';
import {
  Calendar,
  Filter,
  Trophy,
  Target,
  Activity,
  RefreshCw,
  Search,
  ChevronDown,
} from 'lucide-react';

export default function TodayAnalysisPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [tLevelFilter, setTLevelFilter] = useState<string>('all');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMatches();
  }, [selectedDate]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches?date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setMatches(data.data);
      }
    } catch (error) {
      console.error('获取比赛数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const leagues = useMemo(() => {
    const set = new Set(matches.map((m) => m.league));
    return Array.from(set);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (tLevelFilter !== 'all' && m.t_level !== tLevelFilter) return false;
      if (leagueFilter !== 'all' && m.league !== leagueFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !m.home_team.toLowerCase().includes(q) &&
          !m.away_team.toLowerCase().includes(q) &&
          !m.league.toLowerCase().includes(q) &&
          !m.match_no.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [matches, tLevelFilter, leagueFilter, searchQuery]);

  // 统计数据
  const stats = useMemo(() => {
    const analyzed = matches.filter((m) => m.analyzed).length;
    const diamond = matches.filter((m) => m.t_level === 'T0').length;
    const t1a = matches.filter((m) => m.t_level === 'T1a').length;
    const t1b = matches.filter((m) => m.t_level === 'T1b').length;
    return { total: matches.length, analyzed, diamond, t1a, t1b };
  }, [matches]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Trophy className="text-cyan-400" size={28} />
              今日分析面板
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              当日竞彩比赛赔率分析结果一览
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={fetchMatches}
              className="p-2 bg-[#1a1a2e] border border-gray-700 rounded-lg hover:border-cyan-500 transition-colors"
              title="刷新"
            >
              <RefreshCw size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity size={20} />}
            label="比赛总数"
            value={stats.total}
            color="text-cyan-400"
            bgColor="bg-cyan-500/10"
          />
          <StatCard
            icon={<Target size={20} />}
            label="已分析"
            value={stats.analyzed}
            color="text-green-400"
            bgColor="bg-green-500/10"
          />
          <StatCard
            icon={<Trophy size={20} />}
            label="钻石信号"
            value={stats.diamond}
            color="text-diamond"
            bgColor="bg-cyan-500/10"
          />
          <StatCard
            icon={<Filter size={20} />}
            label="黄金级(T1a)"
            value={stats.t1a}
            color="text-gold"
            bgColor="bg-yellow-500/10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-[#1a1a2e] rounded-xl border border-gray-800">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-400">筛选:</span>
          </div>

          {/* T-level filter */}
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              active={tLevelFilter === 'all'}
              onClick={() => setTLevelFilter('all')}
            >
              全部
            </FilterChip>
            {['T0', 'T1a', 'T1b', 'T2', 'T2b', 'T3'].map((level) => (
              <button
                key={level}
                onClick={() =>
                  setTLevelFilter(tLevelFilter === level ? 'all' : level)
                }
                className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                  tLevelFilter === level
                    ? 'ring-2 ring-cyan-500 ring-offset-1 ring-offset-[#1a1a2e]'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <TLevelBadge level={level} size="sm" />
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-gray-700" />

          {/* League filter */}
          <div className="relative">
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">全部联赛</option>
              {leagues.map((league) => (
                <option key={league} value={league}>
                  {league}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="搜索球队/联赛..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-1.5 w-64 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Match list */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-20">
              <RefreshCw
                size={32}
                className="mx-auto text-cyan-400 animate-spin mb-4"
              />
              <p className="text-gray-500">加载比赛数据中...</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-20 bg-[#1a1a2e] rounded-xl border border-gray-800">
              <Activity size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-500">暂无符合条件的比赛</p>
              <p className="text-gray-600 text-sm mt-1">
                尝试调整筛选条件或切换日期
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                <span>
                  显示 <span className="text-cyan-400 font-medium">{filteredMatches.length}</span>{' '}
                  场比赛
                </span>
                <span>按场次编号排序</span>
              </div>
              {filteredMatches.map((match) => (
                <MatchCard key={match.match_no} match={match} />
              ))}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="p-4 bg-[#1a1a2e] border border-gray-800 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${bgColor} ${color}`}>{icon}</div>
        <div>
          <div className={`text-2xl font-bold ${color} tabular-nums`}>
            {value}
          </div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-md transition-all ${
        active
          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
          : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
      }`}
    >
      {children}
    </button>
  );
}
