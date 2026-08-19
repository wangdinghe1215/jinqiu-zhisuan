"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { Calendar as CalendarIcon, Target, TrendingUp, Award, Swords, BarChart3, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Clock, Trophy, Zap, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// ========== 类型定义 ==========
interface ScoreOdd {
  score: string;
  odds: number;
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
  handicap: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  score_odds: ScoreOdd[];
  ttg_odds: Record<string, number>;
  hafu_odds: Record<string, number>;
}

// CR 8级分级
function getCRLevel(cr: number): number {
  if (cr >= 180) return 1;   // 钻石
  if (cr >= 100) return 2;   // 金
  if (cr >= 75) return 3;    // 银
  if (cr >= 50) return 4;    // 铜
  if (cr >= 25) return 5;    // 木
  if (cr >= 10) return 6;    // 铁
  if (cr > 0) return 7;      // 低
  return 8;                   // 无
}

function getCRLabel(level: number): string {
  const labels: Record<number, string> = {
    1: "钻石", 2: "金", 3: "银", 4: "铜",
    5: "木", 6: "铁", 7: "低", 8: "-"
  };
  return labels[level] || "-";
}

// 计算SPF的CR值：CR = (主胜 × 客胜) / (平赔²)
function calcSPF_CR(h: number, d: number, a: number): number {
  if (d <= 0) return 0;
  return (h * a) / (d * d) * 100;
}

// 比分赔率的CR：单个比分赔率 vs 平均赔率的偏离度
// 简化：用 (赔率 / 平均赔率) 的归一化值
function calcScoreCR(odds: number, avgOdds: number): number {
  if (avgOdds <= 0) return 0;
  return (odds / avgOdds) * 25;
}

// 半全场映射
const hafuLabels: Record<string, string> = {
  hh: "胜胜", hd: "胜平", ha: "胜负",
  dh: "平胜", dd: "平平", da: "平负",
  ah: "负胜", ad: "负平", aa: "负负"
};

// ========== 单场比赛卡片 ==========
function MatchCard({ match }: { match: SportteryMatch }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"spf" | "rspf" | "score" | "hafu" | "ttg">("score");

  // SPF CR值
  const spfCR = calcSPF_CR(match.spf_home, match.spf_draw, match.spf_away);
  const spfLevel = getCRLevel(spfCR);

  // RSPF CR值
  const rspfCR = calcSPF_CR(match.rspf_home, match.rspf_draw, match.rspf_away);
  const rspfLevel = getCRLevel(rspfCR);

  // 比分平均赔率，用于计算每个比分的相对CR
  const scoreOdds = match.score_odds || [];
  const avgScoreOdds = scoreOdds.length > 0
    ? scoreOdds.reduce((s, x) => s + x.odds, 0) / scoreOdds.length
    : 0;

  // 总进球平均赔率
  const ttgEntries = Object.entries(match.ttg_odds || {}).filter(
    ([k]) => !k.endsWith("f")
  );
  const avgTtgOdds = ttgEntries.length > 0
    ? ttgEntries.reduce((s, [, v]) => s + v, 0) / ttgEntries.length
    : 0;

  // 半全场平均赔率
  const hafuEntries = Object.entries(match.hafu_odds || {}).filter(
    ([k]) => k.length === 2 && !k.endsWith("f")
  );
  const avgHafuOdds = hafuEntries.length > 0
    ? hafuEntries.reduce((s, [, v]) => s + v, 0) / hafuEntries.length
    : 0;

  const handicapStr = match.handicap > 0
    ? `主+${match.handicap}`
    : `主${match.handicap}`;

  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors mb-3">
      {/* 卡片头部 - 点击展开/折叠 */}
      <div
        className="p-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* 编号 + 联赛 */}
          <div className="flex flex-col min-w-[70px]">
            <span className="text-cyan-400 font-mono text-xs font-bold">{match.match_no}</span>
            <span className="text-gray-500 text-[11px]">{match.league}</span>
          </div>

          {/* 对阵 */}
          <div className="flex-1 min-w-[180px]">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-semibold text-sm">{match.home_team}</span>
              <span className="text-gray-600 text-xs">VS</span>
              <span className="text-blue-400 font-semibold text-sm">{match.away_team}</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
              <Clock size={12} />
              <span className="font-mono tabular-nums">{match.match_time.slice(0, 5)}</span>
              <span className="text-gray-700">|</span>
              <span>让球: {handicapStr}</span>
            </div>
          </div>

          {/* SPF赔率摘要 */}
          <div className="flex items-center gap-1 bg-gray-900/60 rounded-lg px-2 py-1.5">
            <div className="text-center min-w-[48px]">
              <div className={cn(
                "font-mono font-bold text-sm tabular-nums",
                match.spf_home < match.spf_draw && match.spf_home < match.spf_away
                  ? "text-cyan-300" : "text-red-400"
              )}>
                {match.spf_home.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-600">主胜</div>
            </div>
            <div className="text-center min-w-[48px]">
              <div className={cn(
                "font-mono font-bold text-sm tabular-nums",
                match.spf_draw < match.spf_home && match.spf_draw < match.spf_away
                  ? "text-cyan-300" : "text-yellow-400"
              )}>
                {match.spf_draw.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-600">平</div>
            </div>
            <div className="text-center min-w-[48px]">
              <div className={cn(
                "font-mono font-bold text-sm tabular-nums",
                match.spf_away < match.spf_home && match.spf_away < match.spf_draw
                  ? "text-cyan-300" : "text-blue-400"
              )}>
                {match.spf_away.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-600">客胜</div>
            </div>
          </div>

          {/* CR等级徽章 */}
          <div
            className={cn(
              "px-2.5 py-1 rounded font-mono text-xs font-bold border",
              getCRBgClass(spfLevel)
            )}
          >
            CR {getCRLabel(spfLevel)}
          </div>

          {/* 展开按钮 */}
          <button className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="border-t border-gray-800 bg-[#0f0f1a]/60">
          {/* 5标签页切换 */}
          <div className="flex border-b border-gray-800">
            {[
              { key: "spf" as const, label: "胜平负(SPF)" },
              { key: "rspf" as const, label: "让球胜平负" },
              { key: "score" as const, label: "比分" },
              { key: "hafu" as const, label: "半全场" },
              { key: "ttg" as const, label: "总进球" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 py-2 text-xs font-medium transition-colors border-b-2",
                  activeTab === tab.key
                    ? "text-cyan-300 border-cyan-400 bg-cyan-500/5"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 标签页内容 */}
          <div className="p-4">
            {/* SPF 胜平负 */}
            {activeTab === "spf" && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "主胜", odds: match.spf_home, color: "text-red-400" },
                  { label: "平局", odds: match.spf_draw, color: "text-yellow-400" },
                  { label: "客胜", odds: match.spf_away, color: "text-blue-400" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-4 rounded-lg text-center border transition-all",
                      getCRBgClass(getCRLevel(calcScoreCR(item.odds, (match.spf_home + match.spf_draw + match.spf_away) / 3)))
                    )}
                  >
                    <div className="text-[11px] text-gray-400 mb-1">{item.label}</div>
                    <div className={cn("font-mono font-bold text-2xl tabular-nums", item.color)}>
                      {item.odds.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      返 {((1 / item.odds) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* RSPF 让球胜平负 */}
            {activeTab === "rspf" && (
              <div>
                <div className="text-[11px] text-gray-500 mb-3 text-center">
                  让球数：<span className="text-purple-400 font-mono">{handicapStr}</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "主胜(让)", odds: match.rspf_home, color: "text-red-400" },
                    { label: "平(让)", odds: match.rspf_draw, color: "text-yellow-400" },
                    { label: "客胜(让)", odds: match.rspf_away, color: "text-blue-400" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-4 rounded-lg text-center border",
                        getCRBgClass(getCRLevel(calcScoreCR(item.odds, (match.rspf_home + match.rspf_draw + match.rspf_away) / 3)))
                      )}
                    >
                      <div className="text-[11px] text-gray-400 mb-1">{item.label}</div>
                      <div className={cn("font-mono font-bold text-2xl tabular-nums", item.color)}>
                        {item.odds.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        返 {((1 / item.odds) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 比分 */}
            {activeTab === "score" && (
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                {scoreOdds.slice(0, 32).map((s, i) => {
                  const level = getCRLevel(calcScoreCR(s.odds, avgScoreOdds));
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-2 rounded text-center font-mono text-xs border transition-all hover:scale-105 cursor-default",
                        getCRBgClass(level)
                      )}
                    >
                      <div className="text-[11px] text-gray-200 font-semibold">{s.score}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 tabular-nums">{s.odds.toFixed(1)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 半全场 */}
            {activeTab === "hafu" && (
              <div className="grid grid-cols-3 gap-2">
                {hafuEntries.map(([key, odds]) => {
                  const level = getCRLevel(calcScoreCR(odds, avgHafuOdds));
                  return (
                    <div
                      key={key}
                      className={cn(
                        "p-3 rounded text-center font-mono border",
                        getCRBgClass(level)
                      )}
                    >
                      <div className="text-[11px] text-gray-300">{hafuLabels[key] || key}</div>
                      <div className="text-base font-bold text-white tabular-nums mt-0.5">
                        {odds.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 总进球 */}
            {activeTab === "ttg" && (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {ttgEntries.sort((a, b) => {
                  const na = a[0] === "7up" || a[0] === "7+" ? 99 : parseInt(a[0]);
                  const nb = b[0] === "7up" || b[0] === "7+" ? 99 : parseInt(b[0]);
                  return na - nb;
                }).map(([key, odds]) => {
                  const level = getCRLevel(calcScoreCR(odds, avgTtgOdds));
                  const label = key === "7up" || key === "7+" ? "7+" : key + "球";
                  return (
                    <div
                      key={key}
                      className={cn(
                        "p-3 rounded text-center font-mono border",
                        getCRBgClass(level)
                      )}
                    >
                      <div className="text-[11px] text-gray-300">{label}</div>
                      <div className="text-lg font-bold text-white tabular-nums mt-0.5">
                        {odds.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== 历史回查 Tab ==========
interface HistoryDay {
  date: string;
  matches: HistoryMatchItem[];
  stats?: { total?: number; hits?: number; rate?: number };
}

interface HistoryMatchItem {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_time?: string;
  spf_odds?: string;
  actual_score?: string;
  result_label?: string;
  direction_label?: string;
  top3_scores?: string[];
  direction_hit?: boolean | null;
  score_hit?: boolean | null;
}

function HistoryTab() {
  const [historyData, setHistoryData] = useState<HistoryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMonth, setViewMonth] = useState<Date>(new Date());

  useEffect(() => {
    fetch('/data/analysis_history.json')
      .then(res => res.json())
      .then(data => {
        const days = (data.days || []).map((d: any) => ({
          date: d.date,
          matches: d.matches || [],
          stats: d.stats || null,
        }));
        days.sort((a: HistoryDay, b: HistoryDay) => b.date.localeCompare(a.date));
        setHistoryData(days);
        if (days.length > 0) {
          const latest = days[0].date;
          setSelectedDate(latest);
          setViewMonth(new Date(latest.replace(/-/g, '/')));
        }
      })
      .catch(err => console.error('加载历史数据失败:', err))
      .finally(() => setLoading(false));
  }, []);

  const dayMap = useMemo<Map<string, HistoryDay>>(() => {
    const m = new Map<string, HistoryDay>();
    historyData.forEach(d => m.set(d.date, d));
    return m;
  }, [historyData]);

  const selectedDay = selectedDate ? dayMap.get(selectedDate) : null;

  return (
    <div className="space-y-6">
      {/* 日历选择器 */}
      <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4">
        <Calendar
          viewMonth={viewMonth}
          setViewMonth={setViewMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          dayMap={dayMap}
        />
      </div>

      {/* 选中日期统计 */}
      {selectedDay && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-gray-500 text-xs mb-1">总场次</div>
            <div className="text-white text-2xl font-bold tabular-nums">
              {selectedDay.matches.length}
            </div>
          </div>
          <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-gray-500 text-xs mb-1">方向命中</div>
            <div className="text-green-400 text-2xl font-bold tabular-nums">
              {selectedDay.matches.filter(m => m.direction_hit === true).length}
            </div>
          </div>
          <div className="bg-[#1a1a2e] border border-gray-700 rounded-xl p-4 text-center">
            <div className="text-gray-500 text-xs mb-1">命中率</div>
            <div className="text-cyan-400 text-2xl font-bold tabular-nums">
              {(() => {
                const total = selectedDay.matches.filter(m => m.direction_hit !== null && m.direction_hit !== undefined).length;
                const hits = selectedDay.matches.filter(m => m.direction_hit === true).length;
                return total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '-';
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 比赛列表 */}
      {loading && (
        <div className="text-center text-gray-500 py-12">加载中...</div>
      )}
      {!loading && selectedDay && selectedDay.matches.length === 0 && (
        <div className="text-center text-gray-500 py-12">该日期暂无数据</div>
      )}
      {!loading && selectedDay && selectedDay.matches.length > 0 && (
        <div className="space-y-3">
          {selectedDay.matches.map((match, idx) => (
            <HistoryMatchCard key={`${selectedDay.date}-${idx}`} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

// ========== 日历组件 ==========
interface CalendarProps {
  viewMonth: Date;
  setViewMonth: (d: Date) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  dayMap: Map<string, HistoryDay>;
}

function Calendar({ viewMonth, setViewMonth, selectedDate, onSelectDate, dayMap }: CalendarProps) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // 周一=0
  const daysInMonth = lastDay.getDate();

  // 生成日历格子
  const cells: Array<{ date: string | null; day: number | null }> = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    cells.push({ date: null, day: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ date: dateStr, day: d });
  }
  // 补齐到整周
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null });
  }

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

  const hasData = (date: string | null) => date && dayMap.has(date);
  const getDotColor = (date: string | null) => {
    if (!date || !dayMap.has(date)) return '';
    const day = dayMap.get(date)!;
    const total = day.matches.length;
    const hits = day.matches.filter(m => m.direction_hit === true).length;
    const rate = total > 0 ? hits / total : 0;
    if (rate >= 0.6) return 'bg-green-400';
    if (rate >= 0.3) return 'bg-cyan-400';
    return 'bg-gray-500';
  };

  return (
    <div>
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-white font-semibold text-lg">
          {year}年 {month + 1}月
        </div>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((w, i) => (
          <div
            key={i}
            className={`text-center text-xs py-1 ${i >= 5 ? 'text-gray-600' : 'text-gray-500'}`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell.date) {
            return <div key={idx} className="aspect-square" />;
          }
          const isSelected = cell.date === selectedDate;
          const has = hasData(cell.date);
          const dotColor = getDotColor(cell.date);

          return (
            <button
              key={idx}
              onClick={() => has && onSelectDate(cell.date!)}
              disabled={!has}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative',
                has ? 'cursor-pointer hover:bg-gray-700/50' : 'cursor-not-allowed opacity-40',
                isSelected && 'bg-cyan-500/20 border border-cyan-500/50',
                !isSelected && has && 'text-gray-300',
                !has && 'text-gray-600',
              )}
            >
              <span className={isSelected ? 'text-cyan-300 font-bold' : ''}>
                {cell.day}
              </span>
              {has && (
                <span className={cn('w-1.5 h-1.5 rounded-full mt-0.5', dotColor)} />
              )}
            </button>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          高命中率(≥60%)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          中命中率(30-60%)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-500" />
          低命中率(＜30%)
        </div>
      </div>
    </div>
  );
}

// ========== 历史比赛卡片 ==========
function HistoryMatchCard({ match }: { match: HistoryMatchItem }) {
  const [expanded, setExpanded] = useState(false);

  const hitStatus = match.direction_hit === true
    ? { label: '命中', cls: 'text-green-400 bg-green-500/10 border-green-500/30' }
    : match.direction_hit === false
    ? { label: '未中', cls: 'text-red-400 bg-red-500/10 border-red-500/30' }
    : { label: '待赛', cls: 'text-gray-500 bg-gray-500/10 border-gray-500/30' };

  return (
    <div
      className="bg-[#1a1a2e] border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors"
    >
      <div
        className="p-3 cursor-pointer flex items-center gap-3 flex-wrap"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-cyan-400 font-mono text-xs font-bold min-w-[60px]">
          {match.match_no}
        </div>
        <div className="text-gray-500 text-xs min-w-[40px]">
          {match.league}
        </div>
        <div className="flex-1 min-w-[140px]">
          <span className="text-red-400 font-semibold">{match.home_team}</span>
          <span className="text-gray-600 mx-1 text-sm">vs</span>
          <span className="text-blue-400 font-semibold">{match.away_team}</span>
        </div>
        <div className="text-gray-400 font-mono text-sm tabular-nums">
          {match.spf_odds}
        </div>
        <div className="text-sm">
          {match.direction_label && (
            <span className="text-yellow-400 mr-2">{match.direction_label}</span>
          )}
        </div>
        {match.actual_score && (
          <div className="text-white font-mono font-bold text-sm tabular-nums">
            {match.actual_score}
            <span className="text-gray-500 text-xs ml-1">({match.result_label})</span>
          </div>
        )}
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', hitStatus.cls)}>
          {hitStatus.label}
        </span>
        <ChevronDown
          size={18}
          className={cn('text-gray-500 transition-transform', expanded && 'rotate-180')}
        />
      </div>

      {expanded && (
        <div className="border-t border-gray-700 bg-[#0f0f1a]/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500 text-xs mb-2">SPF 赔率</div>
              <div className="font-mono text-white tabular-nums">
                {match.spf_odds || '-'}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-2">预测 Top3 比分</div>
              <div className="flex flex-wrap gap-1.5">
                {(match.top3_scores || []).map((s, i) => {
                  const isHit = match.score_hit && i === 0;
                  return (
                    <span
                      key={i}
                      className={cn(
                        'px-2 py-0.5 rounded font-mono text-xs tabular-nums border',
                        isHit
                          ? 'bg-green-500/20 text-green-300 border-green-500/40'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                      )}
                    >
                      {s}
                    </span>
                  );
                })}
                {(!match.top3_scores || match.top3_scores.length === 0) && (
                  <span className="text-gray-600 text-xs">无</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-xs mb-2">实际结果</div>
              <div className="font-mono text-white">
                {match.actual_score
                  ? `${match.actual_score} (${match.result_label})`
                  : '待赛'}
              </div>
              <div className="mt-1 text-xs">
                <span className={cn('px-1.5 py-0.5 rounded', hitStatus.cls)}>
                  方向{hitStatus.label}
                </span>
                {match.score_hit !== null && match.score_hit !== undefined && (
                  <span
                    className={cn(
                      'ml-2 px-1.5 py-0.5 rounded',
                      match.score_hit
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    )}
                  >
                    比分{match.score_hit ? '命中' : '未中'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// CR等级背景色类（暗色主题 + 金属色系）
function getCRBgClass(level: number): string {
  switch (level) {
    case 1: // 钻石
      return "bg-yellow-900/20 border-yellow-600/40 shadow-sm shadow-yellow-500/10";
    case 2: // 金
      return "bg-yellow-900/15 border-yellow-700/30";
    case 3: // 银
      return "bg-slate-800/40 border-slate-500/30";
    case 4: // 铜
      return "bg-orange-900/15 border-orange-700/30";
    case 5: // 木
      return "bg-emerald-900/15 border-emerald-700/30";
    case 6: // 铁
      return "bg-gray-800/40 border-gray-600/30";
    case 7: // 低
      return "bg-gray-900/60 border-gray-700/20";
    default: // 无
      return "bg-gray-900/40 border-gray-800/30";
  }
}

// ========== 主页面 ==========
export default function AnalysisPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<SportteryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  useEffect(() => {
    fetch("/api/sporttery/matches?type=full")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setMatches(data.data);
        } else {
          setError("数据加载失败");
        }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // 统计数据
  const total = matches.length;
  const highCRCount = matches.filter(m => getCRLevel(calcSPF_CR(m.spf_home, m.spf_draw, m.spf_away)) <= 4).length; // 铜及以上
  const avgReturnRate = matches.length > 0
    ? matches.reduce((s, m) => s + (1 / m.spf_home + 1 / m.spf_draw + 1 / m.spf_away), 0) / matches.length
    : 0;

  // 钻石级比赛
  const diamondMatches = matches.filter(m => getCRLevel(calcSPF_CR(m.spf_home, m.spf_draw, m.spf_away)) <= 2);

  return (
    <AppLayout>
      <div className="p-4">
        {/* 页面标题 + 返回 */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/60 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 size={22} className="text-cyan-400" />
              全维度赔率分析
            </h1>
            <p className="text-gray-500 text-sm mt-1">SPF · RSPF · 比分 · 半全场 · 总进球 · CR值8级分级</p>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex gap-1 mb-5 bg-[#1a1a2e] p-1 rounded-lg border border-gray-800 w-fit">
          <button
            onClick={() => setActiveTab('today')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === 'today'
                ? "bg-cyan-600 text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            今日分析
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === 'history'
                ? "bg-cyan-600 text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            历史回查
          </button>
        </div>

        {activeTab === 'today' && (
          <>
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
              <Trophy size={14} className="text-yellow-500" /> 总场次
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {loading ? "..." : total}
              <span className="text-sm text-gray-500 font-normal ml-1">场</span>
            </div>
          </div>

          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
              <Award size={14} className="text-orange-500" /> 高价值场次
            </div>
            <div className="text-2xl font-bold text-orange-400 font-mono tabular-nums">
              {loading ? "..." : highCRCount}
              <span className="text-sm text-gray-500 font-normal ml-1">场</span>
            </div>
          </div>

          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
              <TrendingUp size={14} className="text-green-500" /> 平均返还率
            </div>
            <div className="text-2xl font-bold text-green-400 font-mono tabular-nums">
              {loading ? "..." : (avgReturnRate * 100).toFixed(1)}
              <span className="text-sm text-gray-500 font-normal ml-1">%</span>
            </div>
          </div>

          <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3">
            <div className="text-gray-500 text-xs mb-1 flex items-center gap-1">
              <Zap size={14} className="text-yellow-400" /> 钻石/金级
            </div>
            <div className="text-2xl font-bold text-yellow-400 font-mono tabular-nums">
              {loading ? "..." : diamondMatches.length}
              <span className="text-sm text-gray-500 font-normal ml-1">场</span>
            </div>
          </div>
        </div>

        {/* CR等级说明 */}
        <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-3 mb-5">
          <div className="text-gray-400 text-xs mb-2 flex items-center gap-1">
            <Target size={14} /> CR值交叉比值分级（从高到低）
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { level: 1, name: "钻石", color: "bg-yellow-900/20 border-yellow-600/40 text-yellow-300" },
              { level: 2, name: "金", color: "bg-yellow-900/15 border-yellow-700/30 text-yellow-500" },
              { level: 3, name: "银", color: "bg-slate-800/40 border-slate-500/30 text-slate-300" },
              { level: 4, name: "铜", color: "bg-orange-900/15 border-orange-700/30 text-orange-300" },
              { level: 5, name: "木", color: "bg-emerald-900/15 border-emerald-700/30 text-emerald-300" },
              { level: 6, name: "铁", color: "bg-gray-800/40 border-gray-600/30 text-gray-300" },
              { level: 7, name: "低", color: "bg-gray-900/60 border-gray-700/20 text-gray-400" },
            ].map(item => (
              <span
                key={item.level}
                className={cn(
                  "px-2 py-1 rounded text-xs font-mono border",
                  item.color
                )}
              >
                L{item.level} {item.name}
              </span>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-red-300 text-center mb-4">
            数据加载失败：{error}
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-pulse">加载比赛数据中...</div>
          </div>
        )}

        {/* 比赛列表 */}
        {!loading && !error && (
          <div>
            <div className="text-gray-400 text-sm mb-3 flex items-center justify-between">
              <span>今日在售比赛 · 共 {total} 场</span>
              <span className="text-gray-600 text-xs">点击卡片展开5维度赔率详情</span>
            </div>
            {matches.map((match, i) => (
              <MatchCard key={i} match={match} />
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === 'history' && <HistoryTab />}
      </div>
    </AppLayout>
  );
}
