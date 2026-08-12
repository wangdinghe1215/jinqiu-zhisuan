'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  Brain,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Trophy,
  Target,
  Gauge,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { TLevelBadge } from '@/components/badges';

interface TopScore {
  score: string;
  confidence: number;
}

interface PredictionData {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  handicap: number;
  // 泊松
  poisson: {
    direction: string;
    directionColor: string;
    confidence: number; // %
    top_score: string;
    top_score_prob: number; // %
    signal: string;
    signalType: 'normal' | 'warn' | 'danger';
  };
  // V4.2
  v42: {
    t_level: string;
    direction: string;
    directionColor: string;
    cr_value: number;
    golden_score: string;
    line0: 'Lock' | 'Normal';
    star_rating: number;
  };
  // 必中哥
  bizhongge: {
    direction: string;
    directionColor: string;
    odds: number;
    historical_rate: number; // %
    total_matches: number;
    top_score: string;
    top_score_count: number;
    draw_signal: string;
    draw_rate: number;
  };
  // 综合结论
  conclusion: {
    final_direction: string;
    final_color: string;
    confidence: number; // 1-10
    top3_scores: TopScore[];
    risk_tip: string;
    recommendation: '推荐' | '观望' | '放弃';
    recommendationColor: string;
  };
}

const mockData: PredictionData[] = [
  {
    match_no: '001',
    league: '英超',
    home_team: '曼城',
    away_team: '利物浦',
    match_date: '2026-08-11',
    spf_home: 1.95,
    spf_draw: 3.4,
    spf_away: 3.8,
    rspf_home: 2.15,
    rspf_draw: 3.3,
    rspf_away: 3.1,
    handicap: -0.5,
    poisson: {
      direction: '主胜',
      directionColor: 'text-red-400',
      confidence: 65,
      top_score: '2:1',
      top_score_prob: 18,
      signal: '平局预警⚠️',
      signalType: 'warn',
    },
    v42: {
      t_level: 'T1a',
      direction: '主胜',
      directionColor: 'text-red-400',
      cr_value: 0.85,
      golden_score: '2:1',
      line0: 'Lock',
      star_rating: 4,
    },
    bizhongge: {
      direction: '主胜',
      directionColor: 'text-red-400',
      odds: 1.95,
      historical_rate: 56,
      total_matches: 80,
      top_score: '2:1',
      top_score_count: 8,
      draw_signal: '平赔3.4',
      draw_rate: 25,
    },
    conclusion: {
      final_direction: '主胜',
      final_color: 'text-red-400',
      confidence: 8,
      top3_scores: [
        { score: '2:1', confidence: 18 },
        { score: '1:0', confidence: 15 },
        { score: '1:1', confidence: 12 },
      ],
      risk_tip: '三方一致看好主胜，但需警惕平局可能性，建议搭配让球胜平负双选',
      recommendation: '推荐',
      recommendationColor: 'text-green-400 bg-green-500/15 border-green-500/30',
    },
  },
  {
    match_no: '002',
    league: '西甲',
    home_team: '巴塞罗那',
    away_team: '皇家马德里',
    match_date: '2026-08-11',
    spf_home: 2.3,
    spf_draw: 3.1,
    spf_away: 2.9,
    rspf_home: 2.0,
    rspf_draw: 3.2,
    rspf_away: 3.6,
    handicap: 0,
    poisson: {
      direction: '平局',
      directionColor: 'text-yellow-400',
      confidence: 45,
      top_score: '1:1',
      top_score_prob: 22,
      signal: '平局高发区',
      signalType: 'normal',
    },
    v42: {
      t_level: 'T2',
      direction: '平局',
      directionColor: 'text-yellow-400',
      cr_value: 0.72,
      golden_score: '1:1',
      line0: 'Normal',
      star_rating: 3,
    },
    bizhongge: {
      direction: '平局',
      directionColor: 'text-yellow-400',
      odds: 3.1,
      historical_rate: 32,
      total_matches: 65,
      top_score: '1:1',
      top_score_count: 12,
      draw_signal: '平赔3.1',
      draw_rate: 32,
    },
    conclusion: {
      final_direction: '平局',
      final_color: 'text-yellow-400',
      confidence: 6,
      top3_scores: [
        { score: '1:1', confidence: 22 },
        { score: '2:2', confidence: 15 },
        { score: '0:0', confidence: 10 },
      ],
      risk_tip: '国家德比变数大，三方均指向平局但置信度一般，建议小注',
      recommendation: '观望',
      recommendationColor: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
    },
  },
  {
    match_no: '003',
    league: '德甲',
    home_team: '拜仁慕尼黑',
    away_team: '多特蒙德',
    match_date: '2026-08-11',
    spf_home: 1.65,
    spf_draw: 4.0,
    spf_away: 4.5,
    rspf_home: 1.85,
    rspf_draw: 3.6,
    rspf_away: 4.2,
    handicap: -1,
    poisson: {
      direction: '主胜',
      directionColor: 'text-red-400',
      confidence: 72,
      top_score: '2:0',
      top_score_prob: 20,
      signal: '正常',
      signalType: 'normal',
    },
    v42: {
      t_level: 'T0',
      direction: '主胜',
      directionColor: 'text-red-400',
      cr_value: 0.92,
      golden_score: '2:0',
      line0: 'Lock',
      star_rating: 5,
    },
    bizhongge: {
      direction: '主胜',
      directionColor: 'text-red-400',
      odds: 1.65,
      historical_rate: 68,
      total_matches: 95,
      top_score: '2:0',
      top_score_count: 14,
      draw_signal: '平赔4.0',
      draw_rate: 18,
    },
    conclusion: {
      final_direction: '主胜',
      final_color: 'text-red-400',
      confidence: 9,
      top3_scores: [
        { score: '2:0', confidence: 20 },
        { score: '3:1', confidence: 16 },
        { score: '2:1', confidence: 14 },
      ],
      risk_tip: '钻石级信号，三方高度一致主胜，信心指数9分，可重点关注',
      recommendation: '推荐',
      recommendationColor: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
    },
  },
  {
    match_no: '004',
    league: '意甲',
    home_team: '国际米兰',
    away_team: 'AC米兰',
    match_date: '2026-08-11',
    spf_home: 2.1,
    spf_draw: 3.0,
    spf_away: 3.5,
    rspf_home: 1.95,
    rspf_draw: 3.1,
    rspf_away: 3.8,
    handicap: -0.5,
    poisson: {
      direction: '主胜',
      directionColor: 'text-red-400',
      confidence: 55,
      top_score: '1:0',
      top_score_prob: 16,
      signal: '小比分倾向',
      signalType: 'normal',
    },
    v42: {
      t_level: 'T1b',
      direction: '主胜',
      directionColor: 'text-red-400',
      cr_value: 0.78,
      golden_score: '1:0',
      line0: 'Lock',
      star_rating: 4,
    },
    bizhongge: {
      direction: '客胜',
      directionColor: 'text-blue-400',
      odds: 3.5,
      historical_rate: 42,
      total_matches: 55,
      top_score: '0:1',
      top_score_count: 7,
      draw_signal: '平赔3.0',
      draw_rate: 28,
    },
    conclusion: {
      final_direction: '主胜',
      final_color: 'text-red-400',
      confidence: 6,
      top3_scores: [
        { score: '1:0', confidence: 16 },
        { score: '0:1', confidence: 14 },
        { score: '1:1', confidence: 12 },
      ],
      risk_tip: '米兰德比，泊松和V4.2看好主胜，但必中哥数据偏向客方，三方意见有分歧，建议谨慎',
      recommendation: '观望',
      recommendationColor: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
    },
  },
  {
    match_no: '005',
    league: '法甲',
    home_team: '巴黎圣日耳曼',
    away_team: '马赛',
    match_date: '2026-08-11',
    spf_home: 1.45,
    spf_draw: 4.5,
    spf_away: 6.0,
    rspf_home: 1.7,
    rspf_draw: 3.8,
    rspf_away: 4.8,
    handicap: -1.5,
    poisson: {
      direction: '主胜',
      directionColor: 'text-red-400',
      confidence: 80,
      top_score: '3:0',
      top_score_prob: 22,
      signal: '正常',
      signalType: 'normal',
    },
    v42: {
      t_level: 'T1a',
      direction: '主胜',
      directionColor: 'text-red-400',
      cr_value: 0.88,
      golden_score: '3:1',
      line0: 'Lock',
      star_rating: 4,
    },
    bizhongge: {
      direction: '主胜',
      directionColor: 'text-red-400',
      odds: 1.45,
      historical_rate: 75,
      total_matches: 110,
      top_score: '2:0',
      top_score_count: 18,
      draw_signal: '平赔4.5',
      draw_rate: 15,
    },
    conclusion: {
      final_direction: '主胜',
      final_color: 'text-red-400',
      confidence: 8,
      top3_scores: [
        { score: '2:0', confidence: 20 },
        { score: '3:0', confidence: 18 },
        { score: '3:1', confidence: 15 },
      ],
      risk_tip: '大巴黎实力占优，三方一致看好主胜。但让球较深（-1.5），需注意能否打穿让球盘',
      recommendation: '推荐',
      recommendationColor: 'text-green-400 bg-green-500/15 border-green-500/30',
    },
  },
  {
    match_no: '006',
    league: '英超',
    home_team: '伯恩利',
    away_team: '布莱顿',
    match_date: '2026-08-11',
    spf_home: 2.8,
    spf_draw: 3.2,
    spf_away: 2.5,
    rspf_home: 2.0,
    rspf_draw: 3.3,
    rspf_away: 3.5,
    handicap: 0,
    poisson: {
      direction: '客胜',
      directionColor: 'text-blue-400',
      confidence: 48,
      top_score: '0:1',
      top_score_prob: 15,
      signal: '走势模糊',
      signalType: 'warn',
    },
    v42: {
      t_level: 'T3',
      direction: '客胜',
      directionColor: 'text-blue-400',
      cr_value: 0.55,
      golden_score: '1:2',
      line0: 'Normal',
      star_rating: 2,
    },
    bizhongge: {
      direction: '客胜',
      directionColor: 'text-blue-400',
      odds: 2.5,
      historical_rate: 40,
      total_matches: 70,
      top_score: '1:2',
      top_score_count: 6,
      draw_signal: '平赔3.2',
      draw_rate: 28,
    },
    conclusion: {
      final_direction: '客胜',
      final_color: 'text-blue-400',
      confidence: 4,
      top3_scores: [
        { score: '0:1', confidence: 15 },
        { score: '1:2', confidence: 13 },
        { score: '1:1', confidence: 12 },
      ],
      risk_tip: '三方都偏客胜但置信度都不高，T3铁标+CR值偏低，比赛不确定性大，不建议投注',
      recommendation: '放弃',
      recommendationColor: 'text-red-400 bg-red-500/15 border-red-500/30',
    },
  },
];

type FilterType = 'all' | '推荐' | '观望' | '放弃';

export default function XiaofengPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredData = filter === 'all'
    ? mockData
    : mockData.filter((m) => m.conclusion.recommendation === filter);

  const stats = {
    total: mockData.length,
    recommend: mockData.filter((m) => m.conclusion.recommendation === '推荐').length,
    wait: mockData.filter((m) => m.conclusion.recommendation === '观望').length,
    abandon: mockData.filter((m) => m.conclusion.recommendation === '放弃').length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="text-purple-400" size={28} />
            小丰综合分析
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            融合泊松、V4.2、必中哥三套体系的终极分析
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="总场次" value={stats.total} icon={<Target size={20} />} color="text-gray-300" bg="bg-gray-500/10" />
          <StatCard label="推荐" value={stats.recommend} icon={<CheckCircle size={20} />} color="text-green-400" bg="bg-green-500/10" />
          <StatCard label="观望" value={stats.wait} icon={<Eye size={20} />} color="text-yellow-400" bg="bg-yellow-500/10" />
          <StatCard label="放弃" value={stats.abandon} icon={<XCircle size={20} />} color="text-red-400" bg="bg-red-500/10" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', '推荐', '观望', '放弃'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filter === f
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:border-gray-700'
              }`}
            >
              {f === 'all' ? '全部' : f}
            </button>
          ))}
        </div>

        {/* Match cards */}
        <div className="space-y-4">
          {filteredData.map((match) => (
            <div
              key={match.match_no}
              className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all"
            >
              {/* Card header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === match.match_no ? null : match.match_no)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-0.5">场次</div>
                      <div className="text-lg font-bold text-white font-mono">
                        {match.match_no}
                      </div>
                    </div>

                    <div className="h-10 w-px bg-gray-700" />

                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">
                        {match.league}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-medium">
                          {match.home_team}
                        </span>
                        <span className="text-gray-600 text-sm">VS</span>
                        <span className="text-blue-400 font-medium">
                          {match.away_team}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* SPF odds */}
                    <div className="text-right hidden md:block">
                      <div className="text-xs text-gray-500 mb-0.5">SPF</div>
                      <div className="flex gap-2 text-sm font-mono">
                        <span className="text-red-400">{match.spf_home.toFixed(2)}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-yellow-400">{match.spf_draw.toFixed(2)}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-blue-400">{match.spf_away.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Conclusion */}
                    <div className={`px-3 py-1.5 rounded-lg border ${match.conclusion.recommendationColor}`}>
                      <div className="flex items-center gap-2">
                        {match.conclusion.recommendation === '推荐' ? (
                          <Trophy size={16} />
                        ) : match.conclusion.recommendation === '观望' ? (
                          <Eye size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        <span className="font-medium text-sm">
                          {match.conclusion.recommendation}
                        </span>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="text-center w-16 hidden sm:block">
                      <div className="text-xs text-gray-500 mb-1">信心</div>
                      <div className="flex items-center justify-center gap-1">
                        <Gauge size={14} className="text-purple-400" />
                        <span className="text-lg font-bold text-purple-400">
                          {match.conclusion.confidence}
                        </span>
                        <span className="text-xs text-gray-500">/10</span>
                      </div>
                    </div>

                    {expandedId === match.match_no ? (
                      <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === match.match_no && (
                <div className="border-t border-gray-800 p-4 space-y-4">
                  {/* Comparison table */}
                  <div className="bg-gray-900/50 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-4 text-xs border-b border-gray-800">
                      <div className="p-3 text-gray-500 font-medium">维度</div>
                      <div className="p-3 text-cyan-400 font-medium flex items-center gap-1">
                        <Sparkles size={14} /> 泊松模型
                      </div>
                      <div className="p-3 text-yellow-400 font-medium flex items-center gap-1">
                        <Trophy size={14} /> V4.2 体系
                      </div>
                      <div className="p-3 text-orange-400 font-medium flex items-center gap-1">
                        <BarChart3 size={14} /> 必中哥历史
                      </div>
                    </div>
                    <div className="grid grid-cols-4 text-sm border-b border-gray-800">
                      <div className="p-3 text-gray-500">方向</div>
                      <div className={`p-3 font-medium ${match.poisson.directionColor}`}>
                        {match.poisson.direction} ({match.poisson.confidence}%)
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2">
                          <TLevelBadge level={match.v42.t_level} />
                          <span className={match.v42.directionColor}>
                            {match.v42.direction}
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 font-medium ${match.bizhongge.directionColor}`}>
                        {match.bizhongge.direction} {match.bizhongge.odds}
                        <span className="text-gray-500 text-xs ml-1">
                          历史{match.bizhongge.historical_rate}%
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 text-sm border-b border-gray-800">
                      <div className="p-3 text-gray-500">比分</div>
                      <div className="p-3">
                        <span className="text-white font-mono font-bold">
                          {match.poisson.top_score}
                        </span>
                        <span className="text-gray-500 text-xs ml-1">
                          ({match.poisson.top_score_prob}%)
                        </span>
                      </div>
                      <div className="p-3">
                        <span className="text-yellow-400 font-mono font-bold">
                          黄金 {match.v42.golden_score}
                        </span>
                      </div>
                      <div className="p-3">
                        <span className="text-white font-mono font-bold">
                          {match.bizhongge.top_score}
                        </span>
                        <span className="text-gray-500 text-xs ml-1">
                          {match.bizhongge.top_score_count}次/{match.bizhongge.total_matches}场
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 text-sm">
                      <div className="p-3 text-gray-500">信号</div>
                      <div className="p-3">
                        <span
                          className={`text-sm ${
                            match.poisson.signalType === 'warn'
                              ? 'text-yellow-400'
                              : match.poisson.signalType === 'danger'
                              ? 'text-red-400'
                              : 'text-gray-400'
                          }`}
                        >
                          {match.poisson.signal}
                        </span>
                      </div>
                      <div className="p-3">
                        <span className="text-cyan-400">
                          线0 {match.v42.line0}
                        </span>
                        <span className="text-gray-600 text-xs ml-2">
                          CR: {match.v42.cr_value.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-3">
                        <span className="text-orange-400">
                          {match.bizhongge.draw_signal}
                        </span>
                        <span className="text-gray-500 text-xs ml-1">
                          历史{match.bizhongge.draw_rate}%平率
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Conclusion card */}
                  <div className="p-5 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                          <Brain size={16} className="text-purple-400" />
                          综合结论
                        </h3>
                        <div className="flex items-center gap-4 mb-3">
                          <div>
                            <span className="text-xs text-gray-500">最终方向</span>
                            <div className={`text-3xl font-bold ${match.conclusion.final_color}`}>
                              {match.conclusion.final_direction}
                            </div>
                          </div>
                          <div className="h-12 w-px bg-gray-700" />
                          <div>
                            <span className="text-xs text-gray-500">信心指数</span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 rounded-full ${
                                    i < match.conclusion.confidence
                                      ? 'h-6 bg-gradient-to-t from-purple-600 to-purple-400'
                                      : 'h-3 bg-gray-700'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-2xl font-bold text-purple-400">
                                {match.conclusion.confidence}
                              </span>
                              <span className="text-gray-500">/10</span>
                            </div>
                          </div>
                          <div className="h-12 w-px bg-gray-700" />
                          <div>
                            <span className="text-xs text-gray-500">投注建议</span>
                            <div className={`mt-1 px-3 py-1 rounded-lg inline-block border ${match.conclusion.recommendationColor}`}>
                              <span className="font-bold">
                                {match.conclusion.recommendation}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <span className="text-xs text-gray-500">推荐比分 Top3</span>
                          <div className="flex gap-3 mt-1">
                            {match.conclusion.top3_scores.map((ts, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/60 rounded-lg"
                              >
                                <span className="text-xs font-bold text-purple-400">
                                  TOP{idx + 1}
                                </span>
                                <span className="text-white font-mono font-bold">
                                  {ts.score}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {ts.confidence}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-gray-900/40 rounded-lg">
                          <AlertTriangle
                            size={16}
                            className="text-yellow-400 flex-shrink-0 mt-0.5"
                          />
                          <span className="text-sm text-gray-300">
                            {match.conclusion.risk_tip}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="p-20 text-center bg-[#1a1a2e] border border-gray-800 rounded-xl">
            <TrendingUp size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500">当前筛选条件下无比赛</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="p-4 bg-[#1a1a2e] border border-gray-800 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div className={`text-2xl font-bold ${color} tabular-nums`}>{value}</div>
        </div>
        <div className={`p-2.5 rounded-lg ${bg} ${color}`}>{icon}</div>
      </div>
    </div>
  );
}
