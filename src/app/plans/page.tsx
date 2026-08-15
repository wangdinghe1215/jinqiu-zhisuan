"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, TrendingUp, Target, CalendarDays, Trophy, AlertCircle } from "lucide-react";
import Link from "next/link";

interface PlanMatch {
  mn: string;
  lg: string;
  ht: string;
  at: string;
  tm: string;
  spf?: { home: number; draw: number; away: number };
  rspf?: { home: number; draw: number; away: number };
  hcp?: number;
  dir?: string | null;
  top3?: string[] | null;
  score?: string | null;
  result?: string | null;
  dir_hit?: boolean | null;
  score_hit?: boolean | null;
  v42_dir?: string | null;
  v42_star?: number | null;
  xf_dir?: string | null;
  xf_conf?: string | null;
  bzg_pass?: boolean | null;
  poi_top3?: string[] | null;
}

interface PlanDay {
  date: string;
  matches: PlanMatch[];
  stats: {
    total: number;
    dir_hits: number;
    dir_rate: number;
    status: string;
  };
}

const WEEKDAY_MAP: Record<string, string> = {
  "0": "周日",
  "1": "周一",
  "2": "周二",
  "3": "周三",
  "4": "周四",
  "5": "周五",
  "6": "周六",
};

function getWeekday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return WEEKDAY_MAP[String(d.getDay())] || "";
}

function formatDateShort(dateStr: string): string {
  const parts = dateStr.split("-");
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

function getRateColorClass(rate: number, status: string): string {
  if (status === "pending") return "bg-gray-700/50 text-gray-400 border-gray-600";
  if (rate >= 60) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
  if (rate >= 30) return "bg-amber-500/20 text-amber-400 border-amber-500/50";
  return "bg-red-500/20 text-red-400 border-red-500/50";
}

function getRateTextColor(rate: number, status: string): string {
  if (status === "pending") return "text-gray-400";
  if (rate >= 60) return "text-emerald-400";
  if (rate >= 30) return "text-amber-400";
  return "text-red-400";
}

function dirColor(dir?: string | null): string {
  if (!dir) return "text-gray-500";
  if (dir.includes("主")) return "text-red-400";
  if (dir.includes("客")) return "text-blue-400";
  if (dir.includes("平")) return "text-yellow-400";
  return "text-gray-400";
}

export default function PlansPage() {
  const [plansData, setPlansData] = useState<Record<string, PlanDay>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/data/plans_data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("加载失败");
        const data = await res.json();
        if (!cancelled) {
          setPlansData(data);
          const dates = Object.keys(data).sort().reverse();
          if (dates.length > 0) setSelectedDate(dates[0]);
          setLoading(false);
        }
      } catch (err) {
        console.error("加载方案数据失败:", err);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedDates = useMemo(() => Object.keys(plansData).sort().reverse(), [plansData]);

  const currentDay = selectedDate ? plansData[selectedDate] : null;
  const currentStats = currentDay?.stats;

  // 累计统计（从 8/13 起）
  const cumulative = useMemo(() => {
    let total = 0;
    let dirHits = 0;
    for (const date of sortedDates) {
      if (date < "2026-08-13") continue;
      const day = plansData[date];
      if (!day) continue;
      total += day.stats.total;
      dirHits += day.stats.dir_hits;
    }
    const rate = total > 0 ? (dirHits / total) * 100 : 0;
    return { total, dirHits, rate };
  }, [sortedDates, plansData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/3" />
            <div className="h-10 bg-gray-800 rounded w-full" />
            <div className="h-64 bg-gray-800 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentDay) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">暂无方案数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
              title="返回首页"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Target className="text-cyan-400" size={22} />
                投注方案
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">每日推荐方案追踪</p>
            </div>
          </div>
        </div>

        {/* 日期选择栏 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
          {sortedDates.map((date) => {
            const day = plansData[date];
            const isSelected = date === selectedDate;
            const rate = day.stats.dir_rate;
            const status = day.stats.status;
            const colorCls = getRateColorClass(rate, status);
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border transition-all min-w-[85px] ${
                  isSelected
                    ? `${colorCls} ring-2 ring-offset-2 ring-offset-gray-950 ring-cyan-500/60 scale-105`
                    : `${colorCls} opacity-70 hover:opacity-100`
                }`}
              >
                <span className="text-xs opacity-70">{getWeekday(date)}</span>
                <span className="text-sm font-bold">{formatDateShort(date)}</span>
                <span className="text-[11px] mt-0.5 font-mono">
                  {status === "pending"
                    ? "待赛"
                    : `${day.stats.dir_hits}/${day.stats.total}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* 当日汇总栏 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">总场次</div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {currentStats?.total ?? 0}
            </div>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">方向命中</div>
            <div className="text-2xl font-bold text-emerald-400 tabular-nums">
              {currentStats?.dir_hits ?? 0}
              <span className="text-sm text-gray-500 ml-1">场</span>
            </div>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">命中率</div>
            <div
              className={`text-2xl font-bold tabular-nums ${getRateTextColor(
                currentStats?.dir_rate ?? 0,
                currentStats?.status ?? "pending"
              )}`}
            >
              {currentStats?.status === "pending"
                ? "—"
                : `${currentStats?.dir_rate.toFixed(1)}%`}
            </div>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">状态</div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  currentStats?.status === "done"
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : currentStats?.status === "pending"
                    ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                    : "bg-red-400"
                }`}
              />
              <span className="text-sm font-medium">
                {currentStats?.status === "done"
                  ? "已完成"
                  : currentStats?.status === "pending"
                  ? "进行中"
                  : currentStats?.status}
              </span>
            </div>
          </div>
        </div>

        {/* 比赛列表 */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" />
              比赛列表
            </h2>
            <span className="text-xs text-gray-500">共 {currentDay.matches.length} 场</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">编号</th>
                  <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">联赛</th>
                  <th className="text-left px-4 py-2.5 font-medium whitespace-nowrap">对阵</th>
                  <th className="text-center px-4 py-2.5 font-medium whitespace-nowrap">推荐方向</th>
                  <th className="text-center px-4 py-2.5 font-medium whitespace-nowrap">Top3 比分</th>
                  <th className="text-center px-4 py-2.5 font-medium whitespace-nowrap">比分</th>
                  <th className="text-center px-4 py-2.5 font-medium whitespace-nowrap">赛果</th>
                  <th className="text-center px-4 py-2.5 font-medium whitespace-nowrap">方向</th>
                  <th className="text-center px-4 py-2.5 font-medium whitespace-nowrap">比分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {currentDay.matches.map((m, idx) => {
                  const dirHit = m.dir_hit;
                  const scoreHit = m.score_hit;
                  return (
                    <tr
                      key={m.mn || idx}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono text-cyan-400 text-xs font-bold whitespace-nowrap">
                        {m.mn}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                        {m.lg}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="text-red-400 font-medium">{m.ht}</span>
                          <span className="text-gray-600 text-xs">vs</span>
                          <span className="text-blue-400 font-medium">{m.at}</span>
                        </div>
                        <div className="text-[11px] text-gray-600 mt-0.5">{m.tm}</div>
                      </td>
                      <td className={`px-4 py-2.5 text-center font-semibold whitespace-nowrap ${dirColor(m.dir)}`}>
                        {m.dir || <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {m.top3 && m.top3.length > 0 ? (
                            m.top3.map((s, i) => (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 text-[11px] font-mono rounded ${
                                  i === 0
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : i === 1
                                    ? "bg-gray-500/20 text-gray-400"
                                    : "bg-amber-700/20 text-amber-500"
                                }`}
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-yellow-400 whitespace-nowrap">
                        {m.score || <span className="text-gray-600 font-normal">待赛</span>}
                      </td>
                      <td className={`px-4 py-2.5 text-center whitespace-nowrap ${dirColor(m.result)}`}>
                        {m.result || <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {dirHit === true ? (
                          <span className="text-emerald-400 text-lg">✅</span>
                        ) : dirHit === false ? (
                          <span className="text-red-400 text-lg">❌</span>
                        ) : (
                          <span className="text-gray-600">⏳</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {scoreHit === true ? (
                          <span className="text-emerald-400 text-lg">✅</span>
                        ) : scoreHit === false ? (
                          <span className="text-red-400 text-lg">❌</span>
                        ) : (
                          <span className="text-gray-600">⏳</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 底部累计统计 */}
        <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-cyan-400" />
            <h3 className="text-sm font-semibold">累计统计（8/13 起）</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">总场次</div>
              <div className="text-xl font-bold text-white tabular-nums">
                {cumulative.total}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">方向命中</div>
              <div className="text-xl font-bold text-emerald-400 tabular-nums">
                {cumulative.dirHits}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">命中率</div>
              <div
                className={`text-xl font-bold tabular-nums ${
                  cumulative.rate >= 60
                    ? "text-emerald-400"
                    : cumulative.rate >= 30
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {cumulative.total > 0 ? `${cumulative.rate.toFixed(1)}%` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
