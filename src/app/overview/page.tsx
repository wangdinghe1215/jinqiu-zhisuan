'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Database,
  Calendar,
  Activity,
  PieChartIcon,
  BarChart3,
  TrendingUp,
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

interface OverviewData {
  dateRange: { min: string; max: string; total: number };
  coverage: { analyzed: number; total: number; rate: number };
  leagues: { league: string; count: number }[];
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/overview');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('获取概览数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    '#06b6d4',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#14b8a6',
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="text-cyan-400" size={28} />
            数据概览面板
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            数据库统计与赔率覆盖情况一览
          </p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Database size={20} />}
            label="总记录数"
            value={data?.dateRange.total || 0}
            color="text-cyan-400"
            bgColor="bg-cyan-500/10"
          />
          <StatCard
            icon={<Calendar size={20} />}
            label="起始日期"
            value={data?.dateRange.min || '—'}
            color="text-green-400"
            bgColor="bg-green-500/10"
            isDate
          />
          <StatCard
            icon={<Activity size={20} />}
            label="最新日期"
            value={data?.dateRange.max || '—'}
            color="text-yellow-400"
            bgColor="bg-yellow-500/10"
            isDate
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="分析覆盖率"
            value={`${data?.coverage.rate || 0}%`}
            color="text-purple-400"
            bgColor="bg-purple-500/10"
          />
        </div>

        {/* Coverage section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coverage progress */}
          <div className="p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon size={18} className="text-cyan-400" />
              <h3 className="text-sm font-medium text-gray-300">赔率分析覆盖</h3>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">已分析场次</span>
                  <span className="text-sm font-mono text-cyan-400 tabular-nums">
                    {data?.coverage.analyzed || 0} /{' '}
                    {data?.coverage.total || 0}
                  </span>
                </div>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${data?.coverage.rate || 0}%` }}
                  />
                </div>
                <div className="text-right mt-1">
                  <span className="text-lg font-bold text-cyan-400 tabular-nums">
                    {data?.coverage.rate || 0}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400 tabular-nums">
                    {data?.coverage.analyzed || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">已分析</div>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-400 tabular-nums">
                    {(data?.coverage.total || 0) - (data?.coverage.analyzed || 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">待分析</div>
                </div>
              </div>

              <div className="p-4 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">数据库状态</span>
                  <span className="flex items-center gap-1.5 text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    正常连接
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-600 font-mono break-all">
                  /app/data/.../odds_database.db
                </div>
              </div>
            </div>
          </div>

          {/* League pie chart */}
          <div className="lg:col-span-2 p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-cyan-400" />
              <h3 className="text-sm font-medium text-gray-300">
                各联赛数据占比
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    加载中...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.leagues || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="league"
                      >
                        {(data?.leagues || []).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid #2d3748',
                          borderRadius: '8px',
                          color: '#e5e7eb',
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} 场`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="flex flex-col justify-center space-y-2">
                {(data?.leagues || []).map((league, index) => {
                  const total = data?.dateRange.total || 1;
                  const percent = ((league.count / total) * 100).toFixed(1);
                  return (
                    <div key={league.league} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-sm"
                            style={{
                              backgroundColor:
                                COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="text-gray-300">{league.league}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 font-mono text-xs tabular-nums">
                            {league.count} 场
                          </span>
                          <span className="text-cyan-400 font-mono text-xs tabular-nums w-12 text-right">
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor:
                              COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* League bar chart */}
        <div className="p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            各联赛比赛数量分布
          </h3>
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                加载中...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.leagues || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis
                    dataKey="league"
                    type="category"
                    stroke="#6b7280"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #2d3748',
                      borderRadius: '8px',
                      color: '#e5e7eb',
                    }}
                    formatter={(value: number) => [`${value} 场`, '比赛数']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {(data?.leagues || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Data sources info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              数据表结构
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">表名</span>
                <span className="font-mono text-cyan-400">matches</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">字段数</span>
                <span className="font-mono text-yellow-400 tabular-nums">21+</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">数据类型</span>
                <span className="text-green-400">SQLite</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              数据字段概览
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                'match_no 场次编号',
                'league 联赛',
                'home_team 主队',
                'away_team 客队',
                'match_date 比赛日期',
                'spf_* SPF赔率',
                'rspf_* RSPF赔率',
                'handicap 让球',
                'score_odds 比分赔率',
                't_level 等级',
                'cr_ratio 交叉比值',
                'star_rating 星级',
              ].map((field) => (
                <div
                  key={field}
                  className="px-2 py-1.5 bg-gray-900/50 rounded font-mono text-gray-400"
                >
                  {field}
                </div>
              ))}
            </div>
          </div>
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
  isDate,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  isDate?: boolean;
}) {
  return (
    <div className="p-4 bg-[#1a1a2e] border border-gray-800 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${bgColor} ${color}`}>{icon}</div>
        <div>
          <div
            className={`text-xl font-bold ${color} ${
              isDate ? 'font-mono text-sm' : 'tabular-nums'
            }`}
          >
            {value}
          </div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
