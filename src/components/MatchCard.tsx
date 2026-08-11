'use client';

import { useState } from 'react';
import { TLevelBadge, StarRating, DirectionBadge } from '@/components/badges';
import { ChevronDown, ChevronUp, Target, TrendingUp, Zap } from 'lucide-react';

export interface MatchData {
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
  score_odds: string;
  full_time_result: string;
  full_time_score: string;
  analyzed: number;
  recommended_direction: string;
  hit_result: string;
  strategy_used: string;
  t_level: string;
  cr_ratio: number;
  line0_direction: string;
  star_rating: number;
  top_scores: string;
}

interface MatchCardProps {
  match: MatchData;
}

export function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const topScores = match.top_scores ? JSON.parse(match.top_scores) : [];
  const scoreOdds = match.score_odds ? JSON.parse(match.score_odds) : {};

  const handicapStr = match.handicap > 0 ? `+${match.handicap}` : `${match.handicap}`;

  return (
    <div
      className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-700 hover:shadow-lg hover:shadow-cyan-500/5 group"
    >
      {/* Main row */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Match No & League */}
          <div className="flex flex-col gap-1 min-w-[80px]">
            <span className="text-xs font-mono text-cyan-400 font-bold">
              #{match.match_no}
            </span>
            <span className="text-xs text-gray-500">{match.league}</span>
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
            {match.full_time_score && (
              <div className="text-xs text-gray-500 mt-0.5 font-mono">
                比分:{' '}
                <span className="text-yellow-400 font-bold">
                  {match.full_time_score}
                </span>
                <span className="ml-2 text-gray-600">
                  ({match.full_time_result})
                </span>
              </div>
            )}
          </div>

          {/* SPF Odds */}
          <div className="flex items-center gap-1 bg-gray-900/50 rounded-lg p-1.5">
            <div className="text-center px-2 min-w-[50px]">
              <div className="text-xs text-red-400 font-mono font-bold tabular-nums">
                {match.spf_home.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-600">主胜</div>
            </div>
            <div className="text-center px-2 min-w-[50px]">
              <div className="text-xs text-yellow-400 font-mono font-bold tabular-nums">
                {match.spf_draw.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-600">平</div>
            </div>
            <div className="text-center px-2 min-w-[50px]">
              <div className="text-xs text-blue-400 font-mono font-bold tabular-nums">
                {match.spf_away.toFixed(2)}
              </div>
              <div className="text-[10px] text-gray-600">客胜</div>
            </div>
          </div>

          {/* Handicap & RSPF */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded font-mono font-bold">
              让{handicapStr}
            </span>
            <div className="flex items-center gap-0.5 bg-gray-900/50 rounded px-1.5 py-1">
              <span className="text-[10px] text-gray-500 mr-1">RSPF</span>
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

          {/* T-Level */}
          <TLevelBadge level={match.t_level} />

          {/* Star rating */}
          <StarRating rating={match.star_rating} />

          {/* Line0 direction */}
          <DirectionBadge direction={match.line0_direction || '—'} />

          {/* CR ratio */}
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-gray-400 font-mono tabular-nums">
              CR {match.cr_ratio.toFixed(2)}
            </span>
          </div>

          {/* Expand button */}
          <button className="p-1.5 hover:bg-gray-800 rounded transition-colors">
            {expanded ? (
              <ChevronUp size={18} className="text-gray-500" />
            ) : (
              <ChevronDown size={18} className="text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-800 bg-[#0f0f1a]/50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 推荐方向 */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target size={14} />
                推荐方向
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">推荐结果</span>
                  <span className="text-cyan-400 font-medium">
                    {match.recommended_direction}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">使用策略</span>
                  <span className="text-yellow-400">{match.strategy_used}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">线0方向</span>
                  <span className="text-purple-400">{match.line0_direction}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">CR比值</span>
                  <span className="text-green-400 font-mono">
                    {match.cr_ratio.toFixed(3)}
                  </span>
                </div>
                {match.hit_result && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">命中状态</span>
                    <span
                      className={
                        match.hit_result === '命中'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {match.hit_result}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 黄金比分 TOP3 */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />
                黄金比分 TOP3
              </h4>
              <div className="space-y-2">
                {topScores.map((score: string, idx: number) => (
                  <div
                    key={score}
                    className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0
                            ? 'bg-yellow-500 text-black'
                            : idx === 1
                            ? 'bg-gray-400 text-black'
                            : 'bg-amber-700 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-white font-mono font-bold text-sm">
                        {score}
                      </span>
                    </div>
                    {scoreOdds[score] && (
                      <span className="text-cyan-400 font-mono text-sm tabular-nums">
                        @{scoreOdds[score]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 赔率对比 */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                赔率详情
              </h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-red-500/10 rounded">
                    <div className="text-red-400 font-mono font-bold tabular-nums">
                      {match.spf_home.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500">SPF主胜</div>
                  </div>
                  <div className="p-2 bg-yellow-500/10 rounded">
                    <div className="text-yellow-400 font-mono font-bold tabular-nums">
                      {match.spf_draw.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500">SPF平</div>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded">
                    <div className="text-blue-400 font-mono font-bold tabular-nums">
                      {match.spf_away.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-500">SPF客胜</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-red-500/5 rounded">
                    <div className="text-red-400 font-mono text-sm tabular-nums">
                      {match.rspf_home.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-600">RSPF主</div>
                  </div>
                  <div className="p-2 bg-yellow-500/5 rounded">
                    <div className="text-yellow-400 font-mono text-sm tabular-nums">
                      {match.rspf_draw.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-600">RSPF平</div>
                  </div>
                  <div className="p-2 bg-blue-500/5 rounded">
                    <div className="text-blue-400 font-mono text-sm tabular-nums">
                      {match.rspf_away.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-600">RSPF客</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
