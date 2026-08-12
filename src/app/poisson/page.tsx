'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopScore {
  score: string;
  prob: number;
}

interface PoissonMatch {
  league: string;
  home_team: string;
  away_team: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  top5_scores: TopScore[];
  direction: string;
  confidence: number;
  lambda_home: number;
  lambda_away: number;
  draw_alert: boolean;
}

const mockData: PoissonMatch[] = [
  {
    league: '英超',
    home_team: '曼城',
    away_team: '利物浦',
    spf_home: 1.95,
    spf_draw: 3.40,
    spf_away: 3.80,
    top5_scores: [
      { score: '2:1', prob: 18.5 },
      { score: '1:1', prob: 15.2 },
      { score: '1:0', prob: 12.8 },
      { score: '2:0', prob: 11.3 },
      { score: '2:2', prob: 8.7 },
    ],
    direction: '主胜',
    confidence: 62.5,
    lambda_home: 1.68,
    lambda_away: 1.12,
    draw_alert: false,
  },
  {
    league: '西甲',
    home_team: '皇家马德里',
    away_team: '巴塞罗那',
    spf_home: 2.10,
    spf_draw: 3.25,
    spf_away: 3.50,
    top5_scores: [
      { score: '1:1', prob: 16.8 },
      { score: '1:0', prob: 14.2 },
      { score: '2:1', prob: 13.5 },
      { score: '0:1', prob: 12.0 },
      { score: '2:0', prob: 9.8 },
    ],
    direction: '平局',
    confidence: 45.2,
    lambda_home: 1.35,
    lambda_away: 1.28,
    draw_alert: true,
  },
  {
    league: '意甲',
    home_team: '国际米兰',
    away_team: 'AC米兰',
    spf_home: 2.25,
    spf_draw: 3.10,
    spf_away: 3.20,
    top5_scores: [
      { score: '1:0', prob: 17.5 },
      { score: '1:1', prob: 14.8 },
      { score: '2:1', prob: 13.2 },
      { score: '0:1', prob: 10.5 },
      { score: '0:0', prob: 9.2 },
    ],
    direction: '主胜',
    confidence: 56.8,
    lambda_home: 1.42,
    lambda_away: 1.15,
    draw_alert: false,
  },
  {
    league: '德甲',
    home_team: '拜仁慕尼黑',
    away_team: '多特蒙德',
    spf_home: 1.85,
    spf_draw: 3.60,
    spf_away: 4.20,
    top5_scores: [
      { score: '2:1', prob: 19.2 },
      { score: '2:0', prob: 17.8 },
      { score: '3:1', prob: 14.5 },
      { score: '1:0', prob: 12.0 },
      { score: '1:1', prob: 10.5 },
    ],
    direction: '主胜',
    confidence: 72.3,
    lambda_home: 2.15,
    lambda_away: 1.08,
    draw_alert: false,
  },
  {
    league: '法甲',
    home_team: '巴黎圣日耳曼',
    away_team: '马赛',
    spf_home: 1.70,
    spf_draw: 3.80,
    spf_away: 4.80,
    top5_scores: [
      { score: '2:0', prob: 20.5 },
      { score: '2:1', prob: 16.8 },
      { score: '1:0', prob: 15.2 },
      { score: '3:0', prob: 12.5 },
      { score: '1:1', prob: 9.8 },
    ],
    direction: '主胜',
    confidence: 78.6,
    lambda_home: 2.28,
    lambda_away: 0.95,
    draw_alert: false,
  },
  {
    league: '中超',
    home_team: '上海申花',
    away_team: '北京国安',
    spf_home: 2.40,
    spf_draw: 3.15,
    spf_away: 2.90,
    top5_scores: [
      { score: '1:1', prob: 17.8 },
      { score: '1:0', prob: 13.5 },
      { score: '0:1', prob: 12.8 },
      { score: '2:1', prob: 11.2 },
      { score: '0:0', prob: 10.5 },
    ],
    direction: '平局',
    confidence: 48.5,
    lambda_home: 1.22,
    lambda_away: 1.18,
    draw_alert: true,
  },
  {
    league: '日职联',
    home_team: '横滨水手',
    away_team: '川崎前锋',
    spf_home: 2.60,
    spf_draw: 3.05,
    spf_away: 2.75,
    top5_scores: [
      { score: '1:1', prob: 18.2 },
      { score: '0:1', prob: 14.5 },
      { score: '1:0', prob: 13.8 },
      { score: '2:1', prob: 11.5 },
      { score: '0:0', prob: 10.2 },
    ],
    direction: '客胜',
    confidence: 42.8,
    lambda_home: 1.18,
    lambda_away: 1.32,
    draw_alert: true,
  },
  {
    league: '韩K联',
    home_team: '全北现代',
    away_team: '蔚山现代',
    spf_home: 2.35,
    spf_draw: 3.20,
    spf_away: 3.00,
    top5_scores: [
      { score: '1:0', prob: 16.5 },
      { score: '2:1', prob: 14.8 },
      { score: '1:1', prob: 13.2 },
      { score: '0:0', prob: 11.5 },
      { score: '2:0', prob: 10.8 },
    ],
    direction: '主胜',
    confidence: 58.2,
    lambda_home: 1.45,
    lambda_away: 1.10,
    draw_alert: false,
  },
];

export default function PoissonPage() {
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const leagues = Array.from(new Set(mockData.map((m) => m.league)));
  const filtered =
    selectedLeague === 'all'
      ? mockData
      : mockData.filter((m) => m.league === selectedLeague);

  const directionColor = (dir: string) => {
    switch (dir) {
      case '主胜':
        return 'text-red-400';
      case '客胜':
        return 'text-blue-400';
      case '平局':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const directionBg = (dir: string) => {
    switch (dir) {
      case '主胜':
        return 'bg-red-500/20 border-red-500/40';
      case '客胜':
        return 'bg-blue-500/20 border-blue-500/40';
      case '平局':
        return 'bg-yellow-500/20 border-yellow-500/40';
      default:
        return 'bg-gray-500/20 border-gray-500/40';
    }
  };

  const stats = {
    total: filtered.length,
    drawAlert: filtered.filter((m) => m.draw_alert).length,
    avgConfidence: (
      filtered.reduce((s, m) => s + m.confidence, 0) / filtered.length
    ).toFixed(1),
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="text-green-400" size={28} />
              泊松分析
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              基于泊松分布模型的比分预测与概率分析
            </p>
          </div>
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-green-500"
          >
            <option value="all">全部联赛</option>
            {leagues.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<Activity size={20} />}
            label="比赛总数"
            value={stats.total}
            color="text-green-400"
          />
          <StatCard
            icon={<AlertTriangle size={20} />}
            label="平局预警"
            value={stats.drawAlert}
            color="text-yellow-400"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="平均置信度"
            value={`${stats.avgConfidence}%`}
            color="text-cyan-400"
          />
        </div>

        {/* Match cards */}
        <div className="space-y-3">
          {filtered.map((match, idx) => (
            <div
              key={`${match.home_team}-${match.away_team}`}
              className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-700"
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() =>
                  setExpandedIndex(expandedIndex === idx ? null : idx)
                }
              >
                <div className="flex flex-wrap items-center gap-4">
                  {/* League */}
                  <div className="min-w-[70px]">
                    <span className="text-xs text-gray-500">
                      {match.league}
                    </span>
                  </div>

                  {/* Teams */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-sm font-semibold">
                        {match.home_team}
                      </span>
                      <span className="text-gray-600 text-xs">VS</span>
                      <span className="text-blue-400 text-sm font-semibold">
                        {match.away_team}
                      </span>
                    </div>
                  </div>

                  {/* SPF odds */}
                  <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg p-1.5">
                    <div className="text-center px-2 min-w-[45px]">
                      <div className="text-xs text-red-400 font-mono font-bold tabular-nums">
                        {match.spf_home.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-600">主胜</div>
                    </div>
                    <div className="text-center px-2 min-w-[45px]">
                      <div className="text-xs text-yellow-400 font-mono font-bold tabular-nums">
                        {match.spf_draw.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-600">平</div>
                    </div>
                    <div className="text-center px-2 min-w-[45px]">
                      <div className="text-xs text-blue-400 font-mono font-bold tabular-nums">
                        {match.spf_away.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-600">客胜</div>
                    </div>
                  </div>

                  {/* Direction + confidence */}
                  <div
                    className={`px-3 py-1.5 rounded-lg border text-sm font-bold ${directionBg(
                      match.direction
                    )}`}
                  >
                    <span className={directionColor(match.direction)}>
                      {match.direction}
                    </span>
                    <span className="text-gray-500 text-xs ml-2 tabular-nums">
                      {match.confidence}%
                    </span>
                  </div>

                  {/* Lambda values */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Gauge size={14} className="text-gray-500" />
                      <span className="text-red-400 font-mono tabular-nums">
                        {match.lambda_home.toFixed(2)}
                      </span>
                      <span className="text-gray-600">/</span>
                      <span className="text-blue-400 font-mono tabular-nums">
                        {match.lambda_away.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Draw alert */}
                  {match.draw_alert && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded text-yellow-400 text-xs font-medium">
                      <AlertTriangle size={14} />
                      平局预警
                    </div>
                  )}

                  {/* Top score */}
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-gray-500" />
                    <div className="text-xs">
                      <span className="text-cyan-400 font-mono font-bold">
                        {match.top5_scores[0].score}
                      </span>
                      <span className="text-gray-600 ml-1 tabular-nums">
                        {match.top5_scores[0].prob}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded: Top5 scores */}
              {expandedIndex === idx && (
                <div className="border-t border-gray-800 bg-[#0f0f1a]/50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top5 scores bars */}
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Target size={14} />
                        泊松预测 Top5 比分
                      </h4>
                      <div className="space-y-2">
                        {match.top5_scores.map((item, i) => (
                          <div key={item.score} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                                    i === 0
                                      ? 'bg-green-500 text-black'
                                      : 'bg-gray-700 text-gray-300'
                                  )}
                                >
                                  {i + 1}
                                </span>
                                <span className="text-white font-mono font-bold">
                                  {item.score}
                                </span>
                              </div>
                              <span className="text-green-400 font-mono text-sm tabular-nums">
                                {item.prob.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  i === 0
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                    : 'bg-gray-600'
                                )}
                                style={{ width: `${item.prob * 3}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats detail */}
                    <div>
                      <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                        泊松参数
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-900/50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">
                            主队进攻力 λ
                          </div>
                          <div className="text-2xl font-bold text-red-400 font-mono tabular-nums">
                            {match.lambda_home.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-900/50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">
                            客队进攻力 λ
                          </div>
                          <div className="text-2xl font-bold text-blue-400 font-mono tabular-nums">
                            {match.lambda_away.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-900/50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">
                            预测方向
                          </div>
                          <div
                            className={cn(
                              'text-lg font-bold',
                              directionColor(match.direction)
                            )}
                          >
                            {match.direction}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-900/50 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">
                            置信度
                          </div>
                          <div className="text-lg font-bold text-cyan-400 font-mono tabular-nums">
                            {match.confidence}%
                          </div>
                        </div>
                      </div>
                      {match.draw_alert && (
                        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-400">
                            <AlertTriangle size={16} />
                            <span className="font-medium text-sm">
                              平局预警
                            </span>
                          </div>
                          <p className="text-xs text-yellow-300/70 mt-1">
                            泊松预测 Top1 比分为 1:1，平局概率较高，需谨慎对待胜负方向推荐
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="p-4 bg-[#1a1a2e] border border-gray-800 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg bg-gray-800/50 ${color}`}>{icon}</div>
        <div>
          <div className={`text-xl font-bold ${color} tabular-nums`}>
            {value}
          </div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
