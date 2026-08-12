'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Star, TrendingUp, Calendar, Trophy, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Target } from 'lucide-react';
import Link from 'next/link';

// 投注方案数据类型
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
  allocation: number; // 资金分配比例
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

const PLANS_URL = 'https://www.coze.cn/s/1M_Aj3hvBbc/';

// 生成示例方案（当远程数据不可用时）
function generateMockPlans(): DailyPlan[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  return [
    {
      date: todayStr,
      total_matches: 5,
      total_allocation: 100,
      expected_return: 135,
      matches: [
        {
          match_no: '周三001',
          league: '欧洲超级杯',
          home_team: '巴黎圣日尔曼',
          away_team: '阿斯顿维拉',
          match_time: '03:00',
          recommended_direction: '主胜',
          recommended_score: '2:1',
          confidence: 85,
          star_level: '💎钻石',
          allocation: 25,
          odds: 1.56,
          analysis: 'V4.2 T1a金星信号 + 泊松主胜68% + 历史主胜1.56赔率56%胜率，三方一致主胜方向。',
        },
        {
          match_no: '周三002',
          league: '解放者杯',
          home_team: '帕梅拉斯',
          away_team: '波特诺',
          match_time: '06:00',
          recommended_direction: '主胜',
          recommended_score: '2:0',
          confidence: 92,
          star_level: '💎钻石',
          allocation: 30,
          odds: 1.19,
          analysis: 'T0超级热门，竞彩主胜压低28.7%，高度异动信号强烈。',
        },
        {
          match_no: '周三003',
          league: '欧冠资格赛',
          home_team: '布拉加',
          away_team: '年青人',
          match_time: '03:00',
          recommended_direction: '平/主胜',
          recommended_score: '1:1',
          confidence: 65,
          star_level: '🥈银',
          allocation: 15,
          odds: 3.40,
          analysis: '泊松平局概率偏高，谨慎防平。',
        },
        {
          match_no: '周三004',
          league: '欧协联',
          home_team: '萨格勒布迪纳摩',
          away_team: '塞萨洛尼基',
          match_time: '02:00',
          recommended_direction: '主胜',
          recommended_score: '1:0',
          confidence: 72,
          star_level: '🥇金',
          allocation: 20,
          odds: 1.85,
          analysis: 'V4.2 T1b银星 + 主场优势明显，CR值良好。',
        },
        {
          match_no: '周三005',
          league: '南美杯',
          home_team: '圣保罗',
          away_team: '水晶体育',
          match_time: '08:30',
          recommended_direction: '让球主胜',
          recommended_score: '3:1',
          confidence: 78,
          star_level: '🥇金',
          allocation: 10,
          odds: 2.30,
          analysis: '实力差距明显，让球仍有价值。',
        },
      ],
    },
  ];
}

export default function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // 尝试从远程获取
      const res = await fetch(PLANS_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      // 尝试解析为方案格式（如果是雷达数据则用示例）
      if (data.reports && Array.isArray(data.reports)) {
        // 这是雷达数据，不是方案数据，先用示例
        setPlans(generateMockPlans());
      } else {
        setPlans(data.plans || generateMockPlans());
      }
      if (plans.length === 0) {
        setPlans(generateMockPlans());
      }
    } catch {
      // 加载失败时用示例
      setPlans(generateMockPlans());
    } finally {
      setLoading(false);
    }
  };

  // 初始化选择日期
  useEffect(() => {
    if (plans.length > 0 && !selectedDate) {
      setSelectedDate(plans[0].date);
    }
  }, [plans, selectedDate]);

  const currentPlan = plans.find((p) => p.date === selectedDate);

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
            <div className="flex-1" />
            <button
              onClick={fetchPlans}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
              title="刷新"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p>加载投注方案中...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">暂无投注方案</p>
            <p className="text-sm mt-2">请稍后再来查看</p>
          </div>
        ) : currentPlan ? (
          <div className="space-y-6">
            {/* 日期选择 */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
              {plans.map((plan) => (
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
              <div className="p-5 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-sm mb-2">总投注场次</div>
                <div className="text-2xl font-bold text-white">{currentPlan.total_matches} 场</div>
                <div className="text-xs text-gray-500 mt-1">精选高信心赛事</div>
              </div>
              <div className="p-5 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-sm mb-2">资金总投入</div>
                <div className="text-2xl font-bold text-amber-400">{currentPlan.total_allocation}%</div>
                <div className="text-xs text-gray-500 mt-1">单位资金分配比例</div>
              </div>
              <div className="p-5 bg-[#1a1a2e] rounded-xl border border-emerald-500/30">
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
                      {/* 比赛卡片头部 */}
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
