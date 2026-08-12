"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Target,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface TopScore {
  score: string;
  prob: number;
}

interface PoissonData {
  top5: TopScore[];
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  lambdaHome: number;
  lambdaAway: number;
  drawAlert: boolean;
}

interface Match {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_time: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  poisson: PoissonData | null;
}

export default function PoissonPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [leagueFilter, setLeagueFilter] = useState("全部");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/sporttery/matches?type=poisson");
        const data = await res.json();
        if (data.success) {
          setMatches(data.data || []);
        } else {
          setError(data.error || "加载失败");
        }
      } catch (e: any) {
        setError(e.message || "网络错误");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const leagues = ["全部", ...new Set(matches.map((m) => m.league))];

  const filtered = matches.filter((m) => {
    if (leagueFilter !== "全部" && m.league !== leagueFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (
        !m.home_team.toLowerCase().includes(q) &&
        !m.away_team.toLowerCase().includes(q) &&
        !m.league.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const getDirectionColor = (p: PoissonData) => {
    if (p.homeWinProb > p.awayWinProb && p.homeWinProb > p.drawProb) return "text-red-400";
    if (p.awayWinProb > p.homeWinProb && p.awayWinProb > p.drawProb) return "text-blue-400";
    return "text-yellow-400";
  };

  const getDirection = (p: PoissonData) => {
    if (p.homeWinProb >= p.awayWinProb && p.homeWinProb >= p.drawProb) return "主胜";
    if (p.awayWinProb >= p.homeWinProb && p.awayWinProb >= p.drawProb) return "客胜";
    return "平局";
  };

  const getConfidence = (p: PoissonData) => {
    const max = Math.max(p.homeWinProb, p.drawProb, p.awayWinProb);
    return Math.round(max * 100);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            泊松分析
          </h1>
          <p className="text-sm text-gray-400 mt-1">基于SPF赔率的泊松分布比分预测</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-cyan-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            加载中...
          </div>
        )}
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-3">
        <select
          value={leagueFilter}
          onChange={(e) => setLeagueFilter(e.target.value)}
          className="bg-[#1a1a2e] border border-[#2d3748] text-gray-200 text-sm rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
        >
          {leagues.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="搜索球队/联赛..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="bg-[#1a1a2e] border border-[#2d3748] text-gray-200 text-sm rounded-lg px-3 py-2 w-48 focus:border-cyan-500 focus:outline-none"
        />
        <div className="flex items-center gap-2 text-sm text-gray-400 ml-auto">
          <Target className="w-4 h-4" />
          共 {filtered.length} 场比赛
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>今日暂无竞彩比赛在售</p>
        </div>
      )}

      {/* 比赛列表 */}
      <div className="grid gap-3">
        {filtered.map((match) => {
          const p = match.poisson;
          const isExpanded = expandedId === match.match_no;
          const drawAlert = p && ["0:0", "1:1", "2:2"].includes(p.top5[0]?.score);

          return (
            <div
              key={match.match_no}
              className="bg-[#1a1a2e] border border-[#2d3748] rounded-xl overflow-hidden hover:border-cyan-500/40 transition-colors cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : match.match_no)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {match.match_no}
                    </span>
                    <span className="text-xs text-gray-400 bg-[#0f0f1a] px-2 py-0.5 rounded">
                      {match.league}
                    </span>
                    {match.match_time && (
                      <span className="text-xs text-gray-500">{match.match_time}</span>
                    )}
                  </div>
                  {drawAlert && (
                    <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      平局预警
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">{match.home_team}</div>
                    <div className="text-gray-500 text-xs mt-1">主队</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-gray-500 text-xs mb-1">VS</div>
                    {p && (
                      <div className={`text-sm font-bold ${getDirectionColor(p)}`}>
                        {getDirection(p)}
                        <span className="text-xs ml-1 opacity-70">
                          {getConfidence(p)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-white font-semibold text-sm">{match.away_team}</div>
                    <div className="text-gray-500 text-xs mt-1">客队</div>
                  </div>
                </div>

                {/* SPF赔率 */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center bg-[#0f0f1a] py-2 rounded">
                    <div className="text-red-400 font-mono font-bold text-sm">
                      {match.spf_home || "-"}
                    </div>
                    <div className="text-gray-500 text-xs">主胜</div>
                  </div>
                  <div className="text-center bg-[#0f0f1a] py-2 rounded">
                    <div className="text-yellow-400 font-mono font-bold text-sm">
                      {match.spf_draw || "-"}
                    </div>
                    <div className="text-gray-500 text-xs">平局</div>
                  </div>
                  <div className="text-center bg-[#0f0f1a] py-2 rounded">
                    <div className="text-blue-400 font-mono font-bold text-sm">
                      {match.spf_away || "-"}
                    </div>
                    <div className="text-gray-500 text-xs">客胜</div>
                  </div>
                </div>

                {/* Top5比分进度条 */}
                {p && (
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      泊松预测 Top5 比分
                    </div>
                    {p.top5.map((s, i) => {
                      const isDraw = s.score.includes(":") && s.score.split(":")[0] === s.score.split(":")[1];
                      const barColor = isDraw
                        ? "from-yellow-600/50 to-yellow-500/50"
                        : s.score.split(":")[0] > s.score.split(":")[1]
                        ? "from-red-600/50 to-red-500/50"
                        : "from-blue-600/50 to-blue-500/50";
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-400 w-8">{i + 1}</span>
                          <span className="text-xs text-white font-mono w-12">{s.score}</span>
                          <div className="flex-1 bg-[#0f0f1a] h-4 rounded overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${barColor} transition-all`}
                              style={{ width: `${Math.min(s.prob * 400, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 font-mono w-12 text-right">
                            {(s.prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!p && (
                  <div className="text-center text-gray-500 text-sm py-3">
                    暂无完整赔率数据
                  </div>
                )}

                {/* 展开详情 */}
                {isExpanded && p && (
                  <div className="mt-4 pt-4 border-t border-[#2d3748] space-y-3">
                    {/* λ值 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0f0f1a] p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">主队进攻力 λ</div>
                        <div className="text-xl font-bold text-red-400 font-mono">
                          {p.lambdaHome.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#0f0f1a] p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">客队进攻力 λ</div>
                        <div className="text-xl font-bold text-blue-400 font-mono">
                          {p.lambdaAway.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* 胜平负概率 */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center bg-red-500/10 p-2 rounded">
                        <div className="text-red-400 font-bold">
                          {(p.homeWinProb * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">主胜</div>
                      </div>
                      <div className="text-center bg-yellow-500/10 p-2 rounded">
                        <div className="text-yellow-400 font-bold">
                          {(p.drawProb * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">平局</div>
                      </div>
                      <div className="text-center bg-blue-500/10 p-2 rounded">
                        <div className="text-blue-400 font-bold">
                          {(p.awayWinProb * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">客胜</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-2 text-gray-500">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
