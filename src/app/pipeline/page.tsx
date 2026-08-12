'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Calendar,
  Terminal,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface PipelineRun {
  date: string;
  status: string;
  duration: number;
  match_count: number;
  script_name: string;
}

export default function PipelinePage() {
  const [pipelineData, setPipelineData] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      const res = await fetch('/api/overview');
      const data = await res.json();
      if (data.success) {
        setPipelineData(data.data.pipeline);
      }
    } catch (error) {
      console.error('获取流水线数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = pipelineData[0];
  const chartData = pipelineData
    .slice()
    .reverse()
    .map((item) => ({
      name: item.date.slice(5),
      场次: item.match_count,
      耗时: item.duration,
    }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '成功':
        return <CheckCircle size={20} className="text-green-400" />;
      case '失败':
        return <XCircle size={20} className="text-red-400" />;
      case '运行中':
        return <Play size={20} className="text-yellow-400 animate-pulse" />;
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '成功':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      case '失败':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case '运行中':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <PlayCircle className="text-cyan-400" size={28} />
            流水线状态面板
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            每日自动分析脚本运行状态监控
          </p>
        </div>

        {/* Current status hero */}
        {currentStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2 p-6 bg-[#1a1a2e] border border-gray-800 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">当前运行状态</p>
                  <div className="flex items-center gap-3 mt-2">
                    {getStatusIcon(currentStatus.status)}
                    <span
                      className={`px-3 py-1 text-sm font-bold rounded-lg border ${getStatusBadge(
                        currentStatus.status
                      )}`}
                    >
                      {currentStatus.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">运行日期</p>
                  <p className="text-lg font-mono text-cyan-400 mt-1">
                    {currentStatus.date}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-500">脚本名称</p>
                  <p className="text-sm text-gray-200 font-mono mt-1 flex items-center gap-2">
                    <Terminal size={14} className="text-gray-500" />
                    {currentStatus.script_name}
                  </p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-500">处理场次</p>
                  <p className="text-lg font-bold text-green-400 font-mono mt-0.5 tabular-nums">
                    {currentStatus.match_count}
                  </p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-500">耗时</p>
                  <p className="text-lg font-bold text-yellow-400 font-mono mt-0.5 tabular-nums">
                    {currentStatus.duration}s
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1a1a2e] border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-cyan-400" />
                <span className="text-sm text-gray-400">7日成功率</span>
              </div>
              <div className="text-3xl font-bold text-green-400 tabular-nums">
                {((pipelineData.filter((d) => d.status === '成功' || d.status === '运行中').length /
                  Math.max(pipelineData.length, 1)) *
                  100).toFixed(0)}
                %
              </div>
              <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  style={{
                    width: `${
                      (pipelineData.filter(
                        (d) => d.status === '成功' || d.status === '运行中'
                      ).length /
                        Math.max(pipelineData.length, 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3 bg-[#1a1a2e] border border-gray-800 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} className="text-cyan-400" />
                <span className="text-sm text-gray-400">总运行天数</span>
              </div>
              <div className="text-3xl font-bold text-cyan-400 tabular-nums">
                {pipelineData.length}
              </div>
              <p className="text-xs text-gray-500 mt-3">近7天运行记录</p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-3 bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              每日处理场次趋势
            </h3>
            <div className="h-64">
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
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #2d3748',
                        borderRadius: '8px',
                        color: '#e5e7eb',
                      }}
                    />
                    <Bar dataKey="场次" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <h3 className="text-sm font-medium text-gray-300 mb-4">
              运行耗时趋势 (秒)
            </h3>
            <div className="h-64">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  加载中...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #2d3748',
                        borderRadius: '8px',
                        color: '#e5e7eb',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="耗时"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Run history table */}
        <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-300">
              最近7天运行记录
            </h3>
          </div>
          {loading ? (
            <div className="p-10 text-center text-gray-500">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900/50">
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">
                      日期
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">
                      脚本
                    </th>
                    <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase tracking-wider">
                      处理场次
                    </th>
                    <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase tracking-wider">
                      耗时
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {pipelineData.map((run, idx) => (
                    <tr
                      key={run.date}
                      className="row-zebra hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-gray-300">
                        {run.date}
                        {idx === 0 && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                            最新
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border ${getStatusBadge(
                            run.status
                          )}`}
                        >
                          {getStatusIcon(run.status)}
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {run.script_name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-cyan-400 tabular-nums">
                        {run.match_count}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-yellow-400 tabular-nums">
                        {run.duration}s
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
