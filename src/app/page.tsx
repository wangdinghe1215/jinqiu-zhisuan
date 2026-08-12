'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Calendar,
  Trophy,
  Activity,
  RefreshCw,
  Search,
  TrendingUp,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
  score_odds: Array<{ score: string; odds: number }>;
}

export default function TodayAnalysisPage() {
  const [matches, setMatches] = useState<SportteryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sporttery/matches?type=full');
      const data = await res.json();
      if (data.success) {
        setMatches(data.data || []);
        setLastUpdate(new Date().toLocaleTimeString('zh-CN'));
      }
    } catch (error) {
      console.error('获取比赛失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const leagues = useMemo(() => {
    const set = new Set(matches.map(m => m.league));
    return Array.from(set);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      if (leagueFilter !== 'all' && m.league !== leagueFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!m.home_team.toLowerCase().includes(q) &&
            !m.away_team.toLowerCase().includes(q) &&
            !m.league.toLowerCase().includes(q) &&
            !m.match_no.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [matches, leagueFilter, searchQuery]);

  const calcReturnRate = (h: number, d: number, a: number) => {
    return 1 / (1/h + 1/d + 1/a);
  };

  const getFavorite = (m: SportteryMatch) => {
    const min = Math.min(m.spf_home, m.spf_draw, m.spf_away);
    if (min === m.spf_home) return { label: '主胜热门', color: 'text-red-400' };
    if (min === m.spf_away) return { label: '客胜热门', color: 'text-blue-400' };
    return { label: '平局热门', color: 'text-yellow-400' };
  };

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Activity className="text-emerald-400" size={28} />
              今日分析
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              体彩官方在售比赛实时赔率 · 最后更新：{lastUpdate || '--'}
              <button
                onClick={fetchMatches}
                className="ml-3 text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 text-xs"
              >
                <RefreshCw size={14} /> 刷新
              </button>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="text-emerald-400 text-xs">在售场次</div>
              <div className="text-xl font-bold text-emerald-300 tabular-nums">{matches.length}场</div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="搜索球队/联赛..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm text-gray-200 w-48 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="all">全部联赛</option>
              {leagues.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        {matches.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-[#1a1a2e] border border-gray-700 rounded-xl">
              <div className="text-gray-400 text-xs mb-1">总场次</div>
              <div className="text-2xl font-bold text-gray-100">{matches.length}</div>
            </div>
            <div className="p-4 bg-[#1a1a2e] border border-gray-700 rounded-xl">
              <div className="text-gray-400 text-xs mb-1">涉及联赛</div>
              <div className="text-2xl font-bold text-gray-100">{leagues.length}</div>
            </div>
            <div className="p-4 bg-[#1a1a2e] border border-gray-700 rounded-xl">
              <div className="text-gray-400 text-xs mb-1">主胜热门</div>
              <div className="text-2xl font-bold text-red-400">
                {matches.filter(m => m.spf_home < m.spf_draw && m.spf_home < m.spf_away).length}
              </div>
            </div>
            <div className="p-4 bg-[#1a1a2e] border border-gray-700 rounded-xl">
              <div className="text-gray-400 text-xs mb-1">平均返还率</div>
              <div className="text-2xl font-bold text-emerald-400">
                {(matches.reduce((s, m) => s + calcReturnRate(m.spf_home, m.spf_draw, m.spf_away), 0) / matches.length * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Match List */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
            正在获取体彩最新在售比赛...
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="mx-auto mb-4 text-gray-500" size={48} />
            <div className="text-gray-400 text-lg">暂无符合条件的在售比赛</div>
            <div className="text-gray-500 text-sm mt-2">当前体彩无在售比赛或筛选条件过于严格</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMatches.map((m) => {
              const fav = getFavorite(m);
              const retRate = calcReturnRate(m.spf_home, m.spf_draw, m.spf_away);
              const isExpanded = expandedMatch === m.match_no;
              const topScores = m.score_odds?.slice(0, 6) || [];

              return (
                <div
                  key={m.match_no}
                  className="bg-[#1a1a2e] border border-gray-700 rounded-xl overflow-hidden hover:border-cyan-500/40 transition-all duration-200 group"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">
                          {m.match_no}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Trophy size={12} />
                          {m.league}
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${fav.color} flex items-center gap-1`}>
                        <Zap size={12} />
                        {fav.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="text-right flex-1">
                        <div className="text-base font-semibold text-gray-100">{m.home_team}</div>
                        <div className="text-xs text-gray-500">主队</div>
                      </div>
                      <div className="px-4 text-center">
                        <div className="text-xs text-gray-500">VS</div>
                        {m.handicap !== 0 && (
                          <div className="text-xs text-yellow-400 mt-1">
                            让 {m.handicap > 0 ? '主' : '客'} {Math.abs(m.handicap)}
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-base font-semibold text-gray-100">{m.away_team}</div>
                        <div className="text-xs text-gray-500">客队</div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                      <Calendar size={12} />
                      {m.match_date} {m.match_time?.slice(0, 5)}
                      <span className="ml-auto text-emerald-400">在售中</span>
                    </div>
                  </div>

                  {/* SPF Odds */}
                  <div className="p-4 grid grid-cols-3 gap-2 border-b border-gray-700/50">
                    <div className="text-center p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="text-xs text-red-400 mb-1">主胜</div>
                      <div className="text-lg font-bold text-red-300 tabular-nums">{m.spf_home.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                      <div className="text-xs text-yellow-400 mb-1">平局</div>
                      <div className="text-lg font-bold text-yellow-300 tabular-nums">{m.spf_draw.toFixed(2)}</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="text-xs text-blue-400 mb-1">客胜</div>
                      <div className="text-lg font-bold text-blue-300 tabular-nums">{m.spf_away.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* RSPF Odds */}
                  <div className="p-4 grid grid-cols-3 gap-2 border-b border-gray-700/50">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">让主</div>
                      <div className="text-sm font-medium text-gray-300 tabular-nums">{m.rspf_home?.toFixed(2) || '-'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">让平</div>
                      <div className="text-sm font-medium text-gray-300 tabular-nums">{m.rspf_draw?.toFixed(2) || '-'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">让客</div>
                      <div className="text-sm font-medium text-gray-300 tabular-nums">{m.rspf_away?.toFixed(2) || '-'}</div>
                    </div>
                  </div>

                  {/* Expand Toggle */}
                  <button
                    onClick={() => setExpandedMatch(isExpanded ? null : m.match_no)}
                    className="w-full py-2 text-xs text-gray-400 hover:text-cyan-400 flex items-center justify-center gap-1 transition-colors"
                  >
                    {isExpanded ? '收起详情' : '展开比分赔率'}
                    {isExpanded ? '▲' : '▼'}
                  </button>

                  {/* Expanded: Score Odds */}
                  {isExpanded && topScores.length > 0 && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-700/50">
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <TrendingUp size={12} />
                        比分赔率 TOP6（低赔排序）
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {topScores.map((s, i) => (
                          <div
                            key={s.score}
                            className="flex items-center justify-between p-2 bg-[#0f0f1a] rounded-lg border border-gray-700/50"
                          >
                            <span className="text-xs font-mono text-gray-300">{s.score}</span>
                            <span className="text-xs font-bold text-cyan-400 tabular-nums">{s.odds.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-gray-500 flex justify-between">
                        <span>返还率：{(retRate * 100).toFixed(1)}%</span>
                        <span>共 {m.score_odds?.length || 0} 个比分选项</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* League Distribution Chart */}
        {leagues.length > 0 && (
          <div className="mt-8 p-6 bg-[#1a1a2e] border border-gray-700 rounded-xl">
            <h3 className="text-base font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Trophy className="text-amber-400" size={18} />
              联赛场次分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leagues.map(l => ({
                  league: l,
                  count: matches.filter(m => m.league === l).length,
                })).sort((a, b) => b.count - a.count)} layout="vertical">
                  <XAxis type="number" stroke="#4b5563" fontSize={11} />
                  <YAxis type="category" dataKey="league" stroke="#9ca3af" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {leagues.map((_, index) => (
                      <Cell key={index} fill={index === 0 ? '#06b6d4' : index === 1 ? '#0ea5e9' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
