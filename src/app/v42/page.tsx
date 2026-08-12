'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Target,
  TrendingUp,
  Zap,
  Lock,
  Unlock,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface V42Match {
  league: string;
  home_team: string;
  away_team: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  handicap: number;
  t_level: string;
  direction: string;
  cr_value: number;
  golden_scores: string[];
  line0_status: 'Lock' | 'Normal';
  star_rating: number;
}

const mockData: V42Match[] = [
  {
    league: '英超',
    home_team: '曼城',
    away_team: '利物浦',
    spf_home: 1.95,
    spf_draw: 3.40,
    spf_away: 3.80,
    rspf_home: 2.15,
    rspf_draw: 3.30,
    rspf_away: 3.10,
    handicap: -0.5,
    t_level: 'T0',
    direction: '主胜',
    cr_value: 1.28,
    golden_scores: ['2:1', '1:0'],
    line0_status: 'Lock',
    star_rating: 5,
  },
  {
    league: '西甲',
    home_team: '皇家马德里',
    away_team: '巴塞罗那',
    spf_home: 2.10,
    spf_draw: 3.25,
    spf_away: 3.50,
    rspf_home: 2.00,
    rspf_draw: 3.40,
    rspf_away: 3.35,
    handicap: -0.25,
    t_level: 'T0',
    direction: '主胜',
    cr_value: 1.15,
    golden_scores: ['1:0', '2:1'],
    line0_status: 'Lock',
    star_rating: 5,
  },
  {
    league: '意甲',
    home_team: '国际米兰',
    away_team: 'AC米兰',
    spf_home: 2.25,
    spf_draw: 3.10,
    spf_away: 3.20,
    rspf_home: 1.95,
    rspf_draw: 3.25,
    rspf_away: 3.75,
    handicap: 0,
    t_level: 'T1a',
    direction: '主胜',
    cr_value: 1.12,
    golden_scores: ['1:0', '1:1'],
    line0_status: 'Lock',
    star_rating: 4,
  },
  {
    league: '德甲',
    home_team: '拜仁慕尼黑',
    away_team: '多特蒙德',
    spf_home: 1.85,
    spf_draw: 3.60,
    spf_away: 4.20,
    rspf_home: 2.30,
    rspf_draw: 3.50,
    rspf_away: 2.80,
    handicap: -0.75,
    t_level: 'T1a',
    direction: '主胜',
    cr_value: 1.24,
    golden_scores: ['2:1', '2:0'],
    line0_status: 'Lock',
    star_rating: 4,
  },
  {
    league: '法甲',
    home_team: '巴黎圣日耳曼',
    away_team: '马赛',
    spf_home: 1.70,
    spf_draw: 3.80,
    spf_away: 4.80,
    rspf_home: 2.05,
    rspf_draw: 3.40,
    rspf_away: 3.25,
    handicap: -0.75,
    t_level: 'T1b',
    direction: '主胜',
    cr_value: 1.08,
    golden_scores: ['2:0', '2:1'],
    line0_status: 'Normal',
    star_rating: 3,
  },
  {
    league: '中超',
    home_team: '上海申花',
    away_team: '北京国安',
    spf_home: 2.40,
    spf_draw: 3.15,
    spf_away: 2.90,
    rspf_home: 2.20,
    rspf_draw: 3.30,
    rspf_away: 3.10,
    handicap: 0,
    t_level: 'T1b',
    direction: '客胜',
    cr_value: 1.05,
    golden_scores: ['1:2', '0:1'],
    line0_status: 'Normal',
    star_rating: 3,
  },
  {
    league: '日职联',
    home_team: '横滨水手',
    away_team: '川崎前锋',
    spf_home: 2.60,
    spf_draw: 3.05,
    spf_away: 2.75,
    rspf_home: 2.50,
    rspf_draw: 3.10,
    rspf_away: 2.65,
    handicap: 0,
    t_level: 'T2',
    direction: '平局',
    cr_value: 1.02,
    golden_scores: ['1:1', '2:1'],
    line0_status: 'Normal',
    star_rating: 2,
  },
  {
    league: '韩K联',
    home_team: '全北现代',
    away_team: '蔚山现代',
    spf_home: 2.35,
    spf_draw: 3.20,
    spf_away: 3.00,
    rspf_home: 2.10,
    rspf_draw: 3.35,
    rspf_away: 3.15,
    handicap: 0,
    t_level: 'T2',
    direction: '主胜',
    cr_value: 1.03,
    golden_scores: ['1:0', '2:1'],
    line0_status: 'Normal',
    star_rating: 2,
  },
  {
    league: '澳超',
    home_team: '悉尼FC',
    away_team: '墨尔本胜利',
    spf_home: 2.80,
    spf_draw: 3.30,
    spf_away: 2.50,
    rspf_home: 2.70,
    rspf_draw: 3.25,
    rspf_away: 2.55,
    handicap: 0,
    t_level: 'T3c',
    direction: '客胜',
    cr_value: 0.98,
    golden_scores: ['0:1', '1:2'],
    line0_status: 'Normal',
    star_rating: 1,
  },
  {
    league: '葡超',
    home_team: '波尔图',
    away_team: '本菲卡',
    spf_home: 2.15,
    spf_draw: 3.15,
    spf_away: 3.45,
    rspf_home: 1.95,
    rspf_draw: 3.25,
    rspf_away: 3.75,
    handicap: 0,
    t_level: 'EX',
    direction: '主胜',
    cr_value: 1.35,
    golden_scores: ['2:1', '1:0'],
    line0_status: 'Lock',
    star_rating: 5,
  },
];

const tLevelConfig: Record<string, { label: string; bg: string; glow?: string }> = {
  T0: {
    label: 'T0 钻石',
    bg: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black',
    glow: 'shadow-[0_0_12px_rgba(0,212,255,0.4)]',
  },
  T1a: {
    label: 'T1a 金星',
    bg: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black',
    glow: 'shadow-[0_0_10px_rgba(255,215,0,0.4)]',
  },
  T1b: {
    label: 'T1b 银星',
    bg: 'bg-gradient-to-r from-gray-300 to-gray-500 text-black',
  },
  T2: {
    label: 'T2 铜星',
    bg: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white',
  },
  T2b: {
    label: 'T2b 铁星',
    bg: 'bg-gradient-to-r from-gray-500 to-gray-700 text-white',
  },
  T3c: {
    label: 'T3c',
    bg: 'bg-gray-700 text-gray-300',
  },
  EX: {
    label: 'EX 特选',
    bg: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.4)]',
  },
};

function StarRating({ rating }: { rating: number }) {
  const starIcons = ['💎', '🥇', '🥈', '🥉', '⚙️'];
  const labels = ['钻石', '金', '银', '铜', '铁'];
  const idx = Math.min(Math.max(5 - rating, 0), 4);
  const stars = Array.from({ length: 5 }, (_, i) => i < rating);

  return (
    <div className="flex items-center gap-1" title={`${rating}星 - ${labels[idx]}`}>
      {stars.map((filled, i) => (
        <Star
          key={i}
          size={14}
          className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">
        {starIcons[idx]}
      </span>
    </div>
  );
}

export default function V42Page() {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const levels = ['T0', 'T1a', 'T1b', 'T2', 'T2b', 'T3c', 'EX'];
  const filtered =
    selectedLevel === 'all'
      ? mockData
      : mockData.filter((m) => m.t_level === selectedLevel);

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
        return 'bg-red-500/20 border-red-500/40 text-red-400';
      case '客胜':
        return 'bg-blue-500/20 border-blue-500/40 text-blue-400';
      case '平局':
        return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      default:
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400';
    }
  };

  const stats = {
    total: filtered.length,
    lockCount: filtered.filter((m) => m.line0_status === 'Lock').length,
    t0Count: filtered.filter((m) => m.t_level === 'T0' || m.t_level === 'EX').length,
    avgCr: (filtered.reduce((s, m) => s + m.cr_value, 0) / filtered.length).toFixed(3),
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Target className="text-yellow-400" size={28} />
              V4.2 分析
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              V4.2分析体系完整分析结果 - 黄金比分 + 线0策略 + CR值
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<Target size={20} />}
            label="比赛总数"
            value={stats.total}
            color="text-yellow-400"
          />
          <StatCard
            icon={<Lock size={20} />}
            label="线0 Lock"
            value={stats.lockCount}
            color="text-green-400"
          />
          <StatCard
            icon={<Zap size={20} />}
            label="钻石+特选"
            value={stats.t0Count}
            color="text-cyan-400"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="平均CR值"
            value={stats.avgCr}
            color="text-purple-400"
          />
        </div>

        {/* Level filters */}
        <div className="flex flex-wrap items-center gap-2 p-4 bg-[#1a1a2e] rounded-xl border border-gray-800">
          <span className="text-sm text-gray-400 mr-2">T级筛选:</span>
          <button
            onClick={() => setSelectedLevel('all')}
            className={cn(
              'px-3 py-1 text-xs rounded-md transition-all',
              selectedLevel === 'all'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600'
            )}
          >
            全部
          </button>
          {levels.map((level) => {
            const config = tLevelConfig[level];
            return (
              <button
                key={level}
                onClick={() =>
                  setSelectedLevel(selectedLevel === level ? 'all' : level)
                }
                className={cn(
                  'px-2.5 py-1 text-xs rounded font-bold transition-all',
                  config.bg,
                  selectedLevel === level
                    ? 'ring-2 ring-white/30 scale-105'
                    : 'opacity-70 hover:opacity-100'
                )}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Match cards */}
        <div className="space-y-3">
          {filtered.map((match, idx) => {
            const tConfig = tLevelConfig[match.t_level] || tLevelConfig.T3c;
            return (
              <div
                key={`${match.home_team}-${match.away_team}`}
                className={cn(
                  'bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden transition-all duration-300',
                  match.line0_status === 'Lock' &&
                    'hover:border-green-500/30 hover:shadow-lg hover:shadow-green-500/5'
                )}
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
                    <div className="flex-1 min-w-[180px]">
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
                    <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg px-2 py-1.5">
                      <span className="text-[10px] text-gray-500 mr-1">SPF</span>
                      <span className="text-xs font-mono text-red-400 tabular-nums">
                        {match.spf_home.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-700">/</span>
                      <span className="text-xs font-mono text-yellow-400 tabular-nums">
                        {match.spf_draw.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-700">/</span>
                      <span className="text-xs font-mono text-blue-400 tabular-nums">
                        {match.spf_away.toFixed(2)}
                      </span>
                    </div>

                    {/* RSPF + handicap */}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded font-mono font-bold">
                        让
                        {match.handicap > 0
                          ? `+${match.handicap}`
                          : match.handicap}
                      </span>
                      <div className="flex items-center gap-0.5 bg-gray-900/50 rounded px-2 py-1">
                        <span className="text-[10px] text-gray-500 mr-1">
                          RSPF
                        </span>
                        <span className="text-xs font-mono text-red-400 tabular-nums">
                          {match.rspf_home.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-700">/</span>
                        <span className="text-xs font-mono text-yellow-400 tabular-nums">
                          {match.rspf_draw.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-700">/</span>
                        <span className="text-xs font-mono text-blue-400 tabular-nums">
                          {match.rspf_away.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* T-level */}
                    <span
                      className={cn(
                        'px-2.5 py-1 text-xs font-bold rounded',
                        tConfig.bg,
                        tConfig.glow
                      )}
                    >
                      {tConfig.label}
                    </span>

                    {/* Direction */}
                    <span
                      className={cn(
                        'px-3 py-1 text-sm font-bold rounded-lg border',
                        directionBg(match.direction)
                      )}
                    >
                      {match.direction}
                    </span>

                    {/* CR value */}
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-purple-400" />
                      <span className="text-xs font-mono text-purple-400 tabular-nums">
                        CR {match.cr_value.toFixed(2)}
                      </span>
                    </div>

                    {/* Line0 status */}
                    <div
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
                        match.line0_status === 'Lock'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-700/50 text-gray-400'
                      )}
                    >
                      {match.line0_status === 'Lock' ? (
                        <Lock size={14} />
                      ) : (
                        <Unlock size={14} />
                      )}
                      {match.line0_status === 'Lock' ? '线0 Lock' : '线0 Normal'}
                    </div>

                    {/* Stars */}
                    <StarRating rating={match.star_rating} />

                    {/* Golden scores */}
                    <div className="flex items-center gap-1">
                      <Zap size={14} className="text-yellow-400" />
                      <div className="text-xs font-mono">
                        {match.golden_scores.map((s, i) => (
                          <span
                            key={s}
                            className={cn(
                              'px-1.5 py-0.5 rounded',
                              i === 0
                                ? 'bg-yellow-500/30 text-yellow-300 font-bold'
                                : 'bg-gray-700/50 text-gray-300'
                            )}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expand */}
                    {expandedIndex === idx ? (
                      <ChevronUp size={18} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedIndex === idx && (
                  <div className="border-t border-gray-800 bg-[#0f0f1a]/50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 分析维度 */}
                      <div>
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                          V4.2 分析维度
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">T级评定</span>
                            <span
                              className={cn(
                                'px-2 py-0.5 text-xs font-bold rounded',
                                tConfig.bg
                              )}
                            >
                              {tConfig.label}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">推荐方向</span>
                            <span className={directionColor(match.direction)}>
                              {match.direction}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">CR一致性比率</span>
                            <span className="text-purple-400 font-mono">
                              {match.cr_value.toFixed(3)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">线0状态</span>
                            <span
                              className={
                                match.line0_status === 'Lock'
                                  ? 'text-green-400'
                                  : 'text-gray-400'
                              }
                            >
                              {match.line0_status === 'Lock' ? '锁定' : '普通'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">星级评定</span>
                            <StarRating rating={match.star_rating} />
                          </div>
                        </div>
                      </div>

                      {/* 黄金比分 */}
                      <div>
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Zap size={14} className="text-yellow-400" />
                          黄金比分 (交叉比值Top2)
                        </h4>
                        <div className="space-y-2">
                          {match.golden_scores.map((score, i) => (
                            <div
                              key={score}
                              className="flex items-center justify-between p-2.5 bg-gray-800/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                                    i === 0
                                      ? 'bg-yellow-500 text-black'
                                      : 'bg-gray-600 text-white'
                                  )}
                                >
                                  {i + 1}
                                </span>
                                <span className="text-white font-mono font-bold">
                                  {score}
                                </span>
                              </div>
                              <span className="text-xs text-yellow-400">
                                {i === 0 ? '最高CR' : '次高CR'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 赔率对比 */}
                      <div>
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                          赔率矩阵
                        </h4>
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-1 text-center text-xs">
                            <div className="p-1.5 bg-gray-800/50 rounded text-gray-500">
                              类型
                            </div>
                            <div className="p-1.5 bg-red-500/10 rounded text-red-400">
                              主胜
                            </div>
                            <div className="p-1.5 bg-yellow-500/10 rounded text-yellow-400">
                              平
                            </div>
                            <div className="p-1.5 bg-blue-500/10 rounded text-blue-400">
                              客胜
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center text-xs font-mono">
                            <div className="p-1.5 bg-gray-800/30 rounded text-gray-400">
                              SPF
                            </div>
                            <div className="p-1.5 bg-red-500/10 rounded text-red-400 tabular-nums">
                              {match.spf_home.toFixed(2)}
                            </div>
                            <div className="p-1.5 bg-yellow-500/10 rounded text-yellow-400 tabular-nums">
                              {match.spf_draw.toFixed(2)}
                            </div>
                            <div className="p-1.5 bg-blue-500/10 rounded text-blue-400 tabular-nums">
                              {match.spf_away.toFixed(2)}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center text-xs font-mono">
                            <div className="p-1.5 bg-gray-800/30 rounded text-gray-400">
                              RSPF
                            </div>
                            <div className="p-1.5 bg-red-500/5 rounded text-red-400 tabular-nums">
                              {match.rspf_home.toFixed(2)}
                            </div>
                            <div className="p-1.5 bg-yellow-500/5 rounded text-yellow-400 tabular-nums">
                              {match.rspf_draw.toFixed(2)}
                            </div>
                            <div className="p-1.5 bg-blue-500/5 rounded text-blue-400 tabular-nums">
                              {match.rspf_away.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-center text-xs text-gray-600 pt-1">
                            让球数:{' '}
                            <span className="text-purple-400 font-mono">
                              {match.handicap > 0
                                ? `+${match.handicap}`
                                : match.handicap}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
