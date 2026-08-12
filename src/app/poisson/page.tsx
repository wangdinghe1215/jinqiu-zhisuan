'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  BarChart3,
  AlertTriangle,
  Activity,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  Sigma,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';

// 泊松概率计算
const factorial = (n: number): number => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

const poissonProb = (lambda: number, k: number): number => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

const RETURN_RATE = 0.88;

interface PoissonMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  match_time?: string;
}

interface TopScore {
  score: string;
  home: number;
  away: number;
  prob: number;
}

interface PoissonResult {
  match: PoissonMatch;
  lambda_home: number;
  lambda_away: number;
  top5: TopScore[];
  direction: string;
  confidence: number;
  drawAlert: boolean;
  homeProb: number;
  drawProb: number;
  awayProb: number;
  matrix: number[][];
}

const calcPoisson = (match: PoissonMatch): PoissonResult => {
  // λ计算：主胜赔率 → 客队λ；客胜赔率 → 主队λ
  const lambda_home = -Math.log(RETURN_RATE / match.spf_away);
  const lambda_away = -Math.log(RETURN_RATE / match.spf_home);

  // 6x6矩阵
  const matrix: number[][] = [];
  let total = 0;
  for (let h = 0; h < 6; h++) {
    matrix[h] = [];
    for (let a = 0; a < 6; a++) {
      const p = poissonProb(lambda_home, h) * poissonProb(lambda_away, a);
      matrix[h][a] = p;
      total += p;
    }
  }

  // 归一化
  for (let h = 0; h < 6; h++) {
    for (let a = 0; a < 6; a++) {
      matrix[h][a] = matrix[h][a] / total;
    }
  }

  // 胜平负概率
  let homeProb = 0, drawProb = 0, awayProb = 0;
  const topScores: TopScore[] = [];
  for (let h = 0; h < 6; h++) {
    for (let a = 0; a < 6; a++) {
      const p = matrix[h][a];
      if (h > a) homeProb += p;
      else if (h === a) drawProb += p;
      else awayProb += p;
      topScores.push({ score: `${h}:${a}`, home: h, away: a, prob: p });
    }
  }

  topScores.sort((a, b) => b.prob - a.prob);
  const top5 = topScores.slice(0, 5);

  // 方向和置信度
  let direction = '主胜';
  let confidence = homeProb;
  if (drawProb > homeProb && drawProb > awayProb) {
    direction = '平局';
    confidence = drawProb;
  } else if (awayProb > homeProb && awayProb > drawProb) {
    direction = '客胜';
    confidence = awayProb;
  }

  // 平局预警：Top1是平局
  const drawAlert = top5[0].home === top5[0].away;

  return {
    match,
    lambda_home,
    lambda_away,
    top5,
    direction,
    confidence,
    drawAlert,
    homeProb,
    drawProb,
    awayProb,
    matrix,
  };
};

const getDirectionColor = (dir: string) => {
  if (dir === '主胜') return 'text-red-400';
  if (dir === '客胜') return 'text-blue-400';
  return 'text-yellow-400';
};

const getDirectionBg = (dir: string) => {
  if (dir === '主胜') return 'bg-red-500/20 border-red-500/30';
  if (dir === '客胜') return 'bg-blue-500/20 border-blue-500/30';
  return 'bg-yellow-500/20 border-yellow-500/30';
};

export default function PoissonPage() {
  const [matches, setMatches] = useState<PoissonMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [leagueFilter, setLeagueFilter] = useState('全部');
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'confidence' | 'drawAlert'>('time');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sporttery/matches?type=basic');
      const result = await res.json();
      if (result.success && result.data) {
        setMatches(result.data);
      }
    } catch (error) {
      console.error('获取比赛失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const leagues = useMemo(() => {
    const set = new Set(matches.map(m => m.league));
    return ['全部', ...Array.from(set)];
  }, [matches]);

  const results = useMemo(() => {
    return matches.map(calcPoisson);
  }, [matches]);

  const filteredResults = useMemo(() => {
    let r = results;

    if (leagueFilter !== '全部') {
      r = r.filter(x => x.match.league === leagueFilter);
    }

    if (search) {
      const kw = search.toLowerCase();
      r = r.filter(x =>
        x.match.home_team.toLowerCase().includes(kw) ||
        x.match.away_team.toLowerCase().includes(kw) ||
        x.match.league.toLowerCase().includes(kw) ||
        x.match.match_no.toLowerCase().includes(kw)
      );
    }

    if (sortBy === 'confidence') {
      r = [...r].sort((a, b) => b.confidence - a.confidence);
    } else if (sortBy === 'drawAlert') {
      r = [...r].sort((a, b) => Number(b.drawAlert) - Number(a.drawAlert));
    }

    return r;
  }, [results, leagueFilter, search, sortBy]);

  // 统计数据
  const stats = useMemo(() => ({
    total: results.length,
    drawAlerts: results.filter(r => r.drawAlert).length,
    avgConfidence: results.length > 0
      ? (results.reduce((s, r) => s + r.confidence, 0) / results.length) * 100
      : 0,
    homeWinRate: results.length > 0
      ? (results.filter(r => r.direction === '主胜').length / results.length) * 100
      : 0,
  }), [results]);

  return (
    <AppLayout>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Sigma className="w-6 h-6 text-purple-400" />
              泊松分析
              <span className="text-sm font-normal text-gray-500 ml-2">
                基于 SPF 赔率的泊松分布比分预测
              </span>
            </h1>
          </div>
          <button
            onClick={fetchMatches}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f2937] text-gray-300 rounded-lg hover:bg-[#374151] transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2.5 bg-[#1a1a2e] border border-gray-700/50 rounded-lg">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-0.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              在售场次
            </div>
            <div className="text-xl font-bold text-cyan-400 tabular-nums">
              {loading ? '...' : stats.total}
            </div>
          </div>
          <div className="p-2.5 bg-[#1a1a2e] border border-gray-700/50 rounded-lg">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
              平局预警
            </div>
            <div className="text-xl font-bold text-yellow-400 tabular-nums">
              {loading ? '...' : stats.drawAlerts}
            </div>
          </div>
          <div className="p-2.5 bg-[#1a1a2e] border border-gray-700/50 rounded-lg">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-0.5">
              <Target className="w-3.5 h-3.5 text-green-400" />
              平均置信度
            </div>
            <div className="text-xl font-bold text-green-400 tabular-nums">
              {loading ? '...' : `${stats.avgConfidence.toFixed(1)}%`}
            </div>
          </div>
          <div className="p-2.5 bg-[#1a1a2e] border border-gray-700/50 rounded-lg">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              主胜占比
            </div>
            <div className="text-xl font-bold text-purple-400 tabular-nums">
              {loading ? '...' : `${stats.homeWinRate.toFixed(0)}%`}
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜索球队/联赛/场次..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* 联赛筛选 */}
          <div className="relative">
            <button
              onClick={() => setShowLeagueDropdown(!showLeagueDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-gray-300 text-sm hover:border-gray-600 min-w-[130px] justify-between"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                {leagueFilter}
              </span>
              {showLeagueDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showLeagueDropdown && (
              <div className="absolute top-full mt-1 right-0 w-full max-h-60 overflow-y-auto bg-[#1f2937] border border-gray-600 rounded-lg z-20 shadow-xl min-w-[150px]">
                {leagues.map(l => (
                  <button
                    key={l}
                    onClick={() => { setLeagueFilter(l); setShowLeagueDropdown(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#374151] transition-colors ${
                      leagueFilter === l ? 'text-purple-400 bg-purple-500/10' : 'text-gray-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 排序 */}
          <div className="flex gap-1">
            {[
              { key: 'time', label: '按时间', icon: Activity },
              { key: 'confidence', label: '按置信度', icon: Target },
              { key: 'drawAlert', label: '平局预警优先', icon: AlertTriangle },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setSortBy(item.key as typeof sortBy)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  sortBy === item.key
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-[#1a1a2e] text-gray-400 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 比赛列表 */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3" />
            加载中...
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无符合条件的比赛</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredResults.map(result => (
              <div
                key={result.match.match_no}
                className={`p-3 bg-[#1a1a2e] border rounded-xl transition-all cursor-pointer hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5 ${
                  result.drawAlert
                    ? 'border-yellow-500/40'
                    : 'border-gray-700/50'
                }`}
                onClick={() => setExpanded(expanded === result.match.match_no ? null : result.match.match_no)}
              >
                {/* 头部 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      {result.match.match_no}
                    </span>
                    <span className="text-xs text-gray-500">{result.match.league}</span>
                    {result.match.match_time && (
                      <span className="text-xs text-gray-600 font-mono">
                        {result.match.match_time.slice(0, 5)}
                      </span>
                    )}
                  </div>
                  {result.drawAlert && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-400 text-xs font-medium animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      平局预警
                    </div>
                  )}
                </div>

                {/* 对阵 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-right flex-1">
                    <div className="text-base font-semibold text-gray-100">{result.match.home_team}</div>
                    <div className="text-xs text-gray-500">主胜 {result.match.spf_home.toFixed(2)}</div>
                  </div>
                  <div className="px-4 text-center">
                    <div className={`text-sm font-bold ${getDirectionColor(result.direction)}`}>
                      {result.direction}
                    </div>
                    <div className="text-xs text-gray-500">VS</div>
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-base font-semibold text-gray-100">{result.match.away_team}</div>
                    <div className="text-xs text-gray-500">客胜 {result.match.spf_away.toFixed(2)}</div>
                  </div>
                </div>

                {/* 胜平负概率条 */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>主胜 {(result.homeProb * 100).toFixed(1)}%</span>
                    <span>平 {(result.drawProb * 100).toFixed(1)}%</span>
                    <span>客胜 {(result.awayProb * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500" style={{ width: `${result.homeProb * 100}%` }} />
                    <div className="bg-yellow-500" style={{ width: `${result.drawProb * 100}%` }} />
                    <div className="bg-blue-500" style={{ width: `${result.awayProb * 100}%` }} />
                  </div>
                </div>

                {/* Top5 比分 */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    预测比分 Top5
                  </div>
                  {result.top5.map((s, i) => (
                    <div key={s.score} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-4 text-right">#{i + 1}</span>
                      <span className={`font-mono font-bold text-sm w-12 ${
                        i === 0 ? 'text-purple-400' : 'text-gray-300'
                      }`}>
                        {s.score}
                      </span>
                      <div className="flex-1 h-5 bg-[#0f0f1a] rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full ${
                            i === 0 ? 'bg-gradient-to-r from-purple-600 to-purple-400' : 'bg-purple-500/40'
                          }`}
                          style={{ width: `${(s.prob / result.top5[0].prob) * 100}%` }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                          {(s.prob * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* λ值 + 置信度 */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-700/50 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">
                      λ<sub>主</sub> = <span className="text-gray-300 font-mono">{result.lambda_home.toFixed(2)}</span>
                    </span>
                    <span className="text-gray-500">
                      λ<sub>客</sub> = <span className="text-gray-300 font-mono">{result.lambda_away.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${getDirectionBg(result.direction)}`}>
                    <Target className="w-3 h-3" />
                    置信度 <span className={`font-bold ${getDirectionColor(result.direction)}`}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 展开详情 - 6x6矩阵 */}
                {expanded === result.match.match_no && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50">
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      6×6 比分概率矩阵（单位：%）
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-center">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="py-1 px-1"></th>
                            {[0, 1, 2, 3, 4, 5].map(a => (
                              <th key={a} className="py-1 px-1 font-medium">客{a}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.matrix.map((row, h) => (
                            <tr key={h}>
                              <td className="py-1 px-1 text-gray-500 font-medium">主{h}</td>
                              {row.map((p, a) => {
                                const maxP = result.top5[0].prob;
                                const isTop = result.top5.slice(0, 3).some(t => t.home === h && t.away === a);
                                return (
                                  <td
                                    key={a}
                                    className={`py-1 px-1 font-mono rounded ${
                                      isTop
                                        ? 'bg-purple-500/30 text-purple-200 font-bold'
                                        : p > maxP * 0.5
                                        ? 'bg-purple-500/10 text-gray-300'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {(p * 100).toFixed(1)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      点击卡片收起详情
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
