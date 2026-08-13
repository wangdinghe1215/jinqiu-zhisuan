'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Wallet, Star, TrendingUp, Calendar, Trophy, AlertTriangle, ChevronDown, ChevronUp, Target } from 'lucide-react';
import Link from 'next/link';

interface PlanMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_time: string;
  recommended_direction: string;
  recommended_score: string;
  confidence: number;
  star_level: string;
  allocation: number;
  odds: number;
  analysis: string;
}

interface DailyPlan {
  date: string;
  total_matches: number;
  total_allocation: number;
  expected_return: number;
  matches: PlanMatch[];
}

// 今日静态数据（硬编码，不再依赖远程 fetch）
const PLANS_DATA: DailyPlan[] = (() => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const matches: PlanMatch[] = [
    {
      match_no: '周四001',
      league: '竞彩',
      home_team: '艾卜哈',
      away_team: '拉斯决心',
      match_time: '00:15',
      recommended_direction: '主胜',
      recommended_score: '待分析',
      confidence: 65,
      star_level: '⚙铁',
      allocation: 10,
      odds: 2.42,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
    {
      match_no: '周四002',
      league: '竞彩',
      home_team: '克拉约瓦',
      away_team: '库奥皮奥',
      match_time: '01:00',
      recommended_direction: '主胜',
      recommended_score: '待分析',
      confidence: 60,
      star_level: '⚙铁',
      allocation: 10,
      odds: 1.33,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
    {
      match_no: '周四003',
      league: '竞彩',
      home_team: '帕福斯',
      away_team: '萨尔茨堡',
      match_time: '01:00',
      recommended_direction: '客胜',
      recommended_score: '待分析',
      confidence: 65,
      star_level: '⚙铁',
      allocation: 10,
      odds: 2.06,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
    {
      match_no: '周四004',
      league: '竞彩',
      home_team: '雷克维京',
      away_team: '图恩',
      match_time: '01:30',
      recommended_direction: '主胜',
      recommended_score: '待分析',
      confidence: 65,
      star_level: '⚙铁',
      allocation: 10,
      odds: 2.25,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
    {
      match_no: '周四005',
      league: '竞彩',
      home_team: '利雅青年',
      away_team: '胡巴卡德',
      match_time: '02:00',
      recommended_direction: '客胜',
      recommended_score: '待分析',
      confidence: 60,
      star_level: '⚙铁',
      allocation: 10,
      odds: 1.46,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
    {
      match_no: '周四006',
      league: '竞彩',
      home_team: '流浪者',
      away_team: '比亚韦',
      match_time: '02:30',
      recommended_direction: '主胜',
      recommended_score: '待分析',
      confidence: 60,
      star_level: '⚙铁',
      allocation: 10,
      odds: 1.39,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
    {
      match_no: '周四007',
      league: '竞彩',
      home_team: '安德莱',
      away_team: '塞萨洛',
      match_time: '02:30',
      recommended_direction: '客胜',
      recommended_score: '待分析',
      confidence: 65,
      star_level: '⚙铁',
      allocation: 10,
      odds: 2.25,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
    {
      match_no: '周四008',
      league: '竞彩',
      home_team: '哈茨',
      away_team: '本菲卡',
      match_time: '02:45',
      recommended_direction: '客胜',
      recommended_score: '待分析',
      confidence: 60,
      star_level: '⚙铁',
      allocation: 10,
      odds: 1.35,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
    {
      match_no: '周四009',
      league: '竞彩',
      home_team: '米拉索尔',
      away_team: '基多体大',
      match_time: '06:00',
      recommended_direction: '主胜',
      recommended_score: '待分析',
      confidence: 65,
      star_level: '⚙铁',
      allocation: 10,
      odds: 1.50,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
    {
      match_no: '周四010',
      league: '竞彩',
      home_team: '罗萨里奥',
      away_team: '科林蒂安',
      match_time: '08:30',
      recommended_direction: '主胜',
      recommended_score: '待分析',
      confidence: 65,
      star_level: '⚙铁',
      allocation: 10,
      odds: 2.08,
      analysis: '基于赔率的初步分析，待深入计算后更新。',
    },
  ];

  return [
    {
      date: todayStr,
      total_matches: 10,
      total_allocation: 100,
      expected_return: 120,
      matches,
    },
  ];
})();

export default function PlansPage() {
  const [selectedDate, setSelectedDate] = useState<string>(PLANS_DATA[0].date);
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());

  const currentPlan = useMemo(
    () => PLANS_DATA.find((p) => p.date === selectedDate),
    [selectedDate]
  );

  const toggleMatch = (matchNo: string) => {
    setExpandedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(matchNo)) next.delete(matchNo);
      else next.add(matchNo);
      return next;
    });
  };

  const getStarColor = (level: string) => {
    if (level.includes('钻石')) return 'text-cyan-400';
    if (level.includes('金')) return 'text-yellow-400';
    if (level.includes('银')) return 'text-gray-300';
    if (level.includes('铜')) return 'text-orange-400';
    return 'text-gray-500';
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return 'text-emerald-400';
    if (conf >= 70) return 'text-yellow-400';
    if (conf >= 55) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100">
      {/* Header */}
      <div className="border-b border-[#2d3748] bg-[#1a1a2e]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors group"
              title="返回首页"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg">
                <Wallet className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  投注方案
                </h1>
                <p className="text-xs text-gray-500">每日精选方案 · 资金分配管理</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        {currentPlan ? (
          <div className="space-y-4">
            {/* 日期选择 */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
              {PLANS_DATA.map((plan) => (
                <button
                  key={plan.date}
                  onClick={() => setSelectedDate(plan.date)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedDate === plan.date
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-[#1a1a2e] text-gray-400 hover:text-white border border-transparent hover:border-[#2d3748]'
                  }`}
                >
                  {plan.date}
                  <span className="ml-2 text-xs opacity-70">{plan.total_matches}场</span>
                </button>
              ))}
            </div>

            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-sm mb-2">总投注场次</div>
                <div className="text-2xl font-bold text-white">{currentPlan.total_matches} 场</div>
                <div className="text-xs text-gray-500 mt-1">精选高信心赛事</div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-sm mb-2">资金总投入</div>
                <div className="text-2xl font-bold text-amber-400">{currentPlan.total_allocation}%</div>
                <div className="text-xs text-gray-500 mt-1">单位资金分配比例</div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-emerald-500/30">
                <div className="text-gray-400 text-sm mb-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  预期回报率
                </div>
                <div className="text-2xl font-bold text-emerald-400">+{currentPlan.expected_return}%</div>
                <div className="text-xs text-gray-500 mt-1">理论收益估算</div>
              </div>
            </div>

            {/* 方案列表 */}
            <div className="bg-[#1a1a2e] rounded-xl border border-[#2d3748] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2d3748] flex items-center justify-between">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  今日推荐方案
                </h2>
                <span className="text-xs text-gray-500">
                  按信心度排序 · 共 {currentPlan.matches.length} 场
                </span>
              </div>

              <div className="divide-y divide-[#2d3748]">
                {currentPlan.matches
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((match, index) => (
                    <div key={match.match_no} className="group">
                      <button
                        onClick={() => toggleMatch(match.match_no)}
                        className="w-full px-5 py-4 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* 序号 + 资金占比 */}
                          <div className="flex flex-col items-center gap-1 w-16">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="text-xs text-amber-400 font-medium">
                              {match.allocation}%
                            </div>
                          </div>

                          {/* 场次联赛 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 bg-[#2d3748] rounded text-gray-400">
                                {match.match_no}
                              </span>
                              <span className="text-xs text-gray-500">{match.league}</span>
                              <span className="text-xs text-gray-600">{match.match_time}</span>
                            </div>
                            <div className="text-white font-medium">
                              {match.home_team} <span className="text-gray-500 mx-1">vs</span>{' '}
                              {match.away_team}
                            </div>
                          </div>

                          {/* 推荐方向 */}
                          <div className="text-center w-20">
                            <div className="text-sm font-bold text-emerald-400">
                              {match.recommended_direction}
                            </div>
                            <div className="text-xs text-gray-500">
                              @{match.odds}
                            </div>
                          </div>

                          {/* 比分 */}
                          <div className="text-center w-20">
                            <div className="text-sm font-mono text-amber-400 font-bold">
                              {match.recommended_score}
                            </div>
                            <div className="text-xs text-gray-500">推荐比分</div>
                          </div>

                          {/* 星级 */}
                          <div className={`text-center w-20 font-bold ${getStarColor(match.star_level)}`}>
                            {match.star_level}
                          </div>

                          {/* 信心度 */}
                          <div className="w-24">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-400">信心度</span>
                              <span className={getConfidenceColor(match.confidence)}>
                                {match.confidence}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#2d3748] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  match.confidence >= 85
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                    : match.confidence >= 70
                                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                                      : match.confidence >= 55
                                        ? 'bg-gradient-to-r from-orange-500 to-red-400'
                                        : 'bg-gradient-to-r from-red-500 to-red-400'
                                }`}
                                style={{ width: `${match.confidence}%` }}
                              />
                            </div>
                          </div>

                          {/* 展开图标 */}
                          {expandedMatches.has(match.match_no) ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      </button>

                      {/* 展开详情 */}
                      {expandedMatches.has(match.match_no) && (
                        <div className="px-5 pb-4 pl-24">
                          <div className="bg-[#0f0f1a] rounded-lg p-4 border border-[#2d3748]">
                            <div className="flex items-start gap-2 mb-3">
                              <Target className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-sm font-medium text-white mb-1">分析要点</div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                  {match.analysis}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#2d3748] text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" /> 星级：{match.star_level}
                              </span>
                              <span className="flex items-center gap-1">
                                <Wallet className="w-3 h-3" /> 资金：{match.allocation}%
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> 赔率：{match.odds}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* 风险提示 */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200/80">
                <div className="font-medium text-amber-400 mb-1">风险提示</div>
                <p>
                  投注方案仅供参考，不构成投注建议。彩票有风险，投注需谨慎。
                  请根据自身情况理性投注，切勿过度投入资金。
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
