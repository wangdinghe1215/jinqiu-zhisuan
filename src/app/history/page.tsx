'use client';

import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { TLevelBadge, ResultBadge, DirectionBadge } from '@/components/badges';
import {
  History,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

interface TLevelStat {
  t_level: string;
  total: number;
  hit: number;
  rate: number;
}

interface DiamondSignal {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  recommended_direction: string;
  full_time_score: string;
  hit_result: string;
  t_level: string;
}

export default function HistoryPage() {
  const [tLevelStats, setTLevelStats] = useState<TLevelStat[]>([]);
  const [diamondSignals, setDiamondSignals] = useState<DiamondSignal[]>([]);
  const [dateRange, setDateRange] = useState<{ min: string; max: string; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const url = selectedDate
        ? `/api/history?date=${selectedDate}`
        : '/api/history';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTLevelStats(data.data.tLevelStats || []);
        setDiamondSignals(data.data.diamondSignals || []);
        setDateRange(data.data.dateRange || null);
      }
    } catch (error) {
      console.error('获取历史数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return tLevelStats.map((item) => ({
      name: item.t_level,
      命中率: item.rate,
      场次: item.total,
    }));
  }, [tLevelStats]);

  const barColors: Record<string, string> = {
    T0: '#00d4ff',
    T1a: '#ffd700',
    T1b: '#c0c0c0',
    T2: '#cd7f32',
    T2b: '#8b4513',
    T3: '#6b7280',
  };

  const avgHitRate = useMemo(() => {
    if (tLevelStats.length === 0) return 0;
    const total = tLevelStats.reduce((sum, s) => sum + s.total, 0);
    const hits = tLevelStats.reduce((sum, s) => sum + s.hit, 0);
    return total > 0 ? ((hits / total) * 100).toFixed(1) : '0';
  }, [tLevelStats]);

  const diamondHitRate = useMemo(() => {
    const diamond = tLevelStats.find((s) => s.t_level === 'T0');
    return diamond ? diamond.rate : 0;
  }, [tLevelStats]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <History className="text-cyan-400" size={28} />
              历史战绩面板
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              T-level各等级命中率统计与钻石信号追踪
              {dateRange && (
                <span className="ml-2 text-cyan-400">
                  · 数据日期: {dateRange.min} ~ {dateRange.max}
                </span>
              )}
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
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Trophy size={20} />}
            label="钻石信号命中率"
            value={`${diamondHitRate}%`}
            color="text-diamond"
            bgColor="bg-cyan-500/10"
            highlight
          />
          <StatCard
            icon={<Target size={20} />}
            label="平均命中率"
            value={`${avgHitRate}%`}
            color="text-green-400"
            bgColor="bg-green-500/10"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="总分析场次"
            value={tLevelStats.reduce((s, t) => s + t.total, 0)}
            color="text-cyan-400"
            bgColor="bg-cyan-500/10"
          />
          <StatCard
            icon={<Award size={20} />}
            label="T-level等级数"
            value={tLevelStats.length}
            color="text-yellow-400"
            bgColor="bg-yellow-500/10"
          />
        </div>

        {/* Hit rate chart + stats table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              T-Level 命中率分布
            </h3>
            <div className="h-72">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  加载中...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #2d3748',
                        borderRadius: '8px',
                        color: '#e5e7eb',
                      }}
                      formatter={(value: number) => [`${value}%`, '命中率']}
                    />
                    <Legend />
                    <Bar dataKey="命中率" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={barColors[entry.name] || '#6b7280'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              等级详细统计
            </h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-gray-500 py-8">加载中...</div>
              ) : (
                tLevelStats.map((stat) => (
                  <div key={stat.t_level} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <TLevelBadge level={stat.t_level} size="sm" />
                      <span className="text-sm font-mono text-gray-300 tabular-nums">
                        {stat.rate}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${stat.rate}%`,
                          backgroundColor:
                            barColors[stat.t_level] || '#6b7280',
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{stat.hit} 命中</span>
                      <span>{stat.total} 场</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Diamond signals tracking */}
        <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-diamond" />
              <h3 className="font-medium text-white">钻石信号追踪记录</h3>
              <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
                T0 级别
              </span>
            </div>
            <span className="text-xs text-gray-500">
              共 {diamondSignals.length} 条记录
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">加载中...</div>
          ) : diamondSignals.length === 0 ? (
            <div className="p-10 text-center text-gray-500">暂无钻石信号记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900/50">
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">
                      日期
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">
                      场次
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">
                      联赛
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">
                      对阵
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">
                      推荐方向
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium uppercase">
                      比分
                    </th>
                    <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium uppercase">
                      结果
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {diamondSignals.map((signal) => (
                    <tr
                      key={`${signal.match_date}-${signal.match_no}`}
                      className="row-zebra hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-gray-400 text-xs">
                        {signal.match_date}
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan-400">
                        #{signal.match_no}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {signal.league}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-red-400">{signal.home_team}</span>
                        <span className="text-gray-600 mx-1.5">vs</span>
                        <span className="text-blue-400">{signal.away_team}</span>
                      </td>
                      <td className="px-4 py-3">
                        <DirectionBadge direction={signal.recommended_direction} />
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-yellow-400 font-bold tabular-nums">
                        {signal.full_time_score || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ResultBadge result={signal.hit_result} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 border rounded-xl transition-all ${
        highlight
          ? 'bg-[#1a1a2e] border-cyan-500/30 shadow-lg shadow-cyan-500/10'
          : 'bg-[#1a1a2e] border-gray-800'
      }`}
    >
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
