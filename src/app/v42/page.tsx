"use client";

import { useState, useEffect } from "react";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Star,
  Lock,
  Loader2,
  Activity,
} from "lucide-react";

interface V42Data {
  tLevel: string;
  tLabel: string;
  starLevel: string;
  starCount: number;
  direction: string;
  spfCR: number;
  rspfCR: number;
  crossCR: number;
  line0: string;
  goldenScores: { score: string; odds: number }[];
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
  handicap: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  score_odds: { score: string; odds: number }[];
  v42: V42Data | null;
}

const T_LEVEL_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  T0: { bg: "from-cyan-400 to-teal-500", text: "text-cyan-100", label: "💎T0 钻石" },
  T1a: { bg: "from-yellow-400 to-amber-500", text: "text-yellow-900", label: "🥇T1a 金星" },
  T1b: { bg: "from-gray-300 to-gray-400", text: "text-gray-900", label: "🥈T1b 银星" },
  T2: { bg: "from-orange-400 to-amber-700", text: "text-orange-100", label: "🥉T2 铜星" },
  T2b: { bg: "from-orange-600 to-red-700", text: "text-orange-100", label: "⚙️T2b 铁星" },
  T3c: { bg: "from-gray-500 to-gray-600", text: "text-gray-100", label: "T3c" },
  T3b: { bg: "from-gray-600 to-gray-700", text: "text-gray-100", label: "T3b" },
  EX: { bg: "from-red-700 to-red-900", text: "text-red-100", label: "EX 排除" },
  P: { bg: "from-gray-500 to-gray-600", text: "text-gray-100", label: "P 待定" },
};

function renderStars(level: string, count: number) {
  if (level === "钻石") return "💎💎💎💎💎";
  if (level === "金") return "🥇⭐⭐⭐";
  if (level === "银") return "🥈⭐⭐";
  if (level === "铜") return "🥉⭐";
  if (level === "铁") return "⚙️";
  return "—";
}

function getCRColor(cr: number): string {
  if (cr >= 150) return "text-cyan-400";
  if (cr >= 120) return "text-green-400";
  if (cr >= 100) return "text-yellow-400";
  if (cr >= 80) return "text-orange-400";
  return "text-red-400";
}

export default function V42Page() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tFilter, setTFilter] = useState("全部");
  const [leagueFilter, setLeagueFilter] = useState("全部");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/sporttery/matches?type=v42");
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

  const tLevels = ["全部", "T0", "T1a", "T1b", "T2", "T2b", "T3c", "T3b", "EX"];
  const leagues = ["全部", ...new Set(matches.map((m) => m.league))];

  const filtered = matches.filter((m) => {
    if (tFilter !== "全部" && m.v42?.tLevel !== tFilter) return false;
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

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            V4.2 分析
          </h1>
          <p className="text-sm text-gray-400 mt-1">线0八级方向预筛 + CR交叉比值 + 黄金比分</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            加载中...
          </div>
        )}
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap gap-2">
        {tLevels.map((t) => (
          <button
            key={t}
            onClick={() => setTFilter(t)}
            className={`px-3 py-1 text-xs rounded-full transition-all ${
              tFilter === t
                ? "bg-amber-500 text-white"
                : "bg-[#1a1a2e] text-gray-400 hover:text-white border border-[#2d3748]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          value={leagueFilter}
          onChange={(e) => setLeagueFilter(e.target.value)}
          className="bg-[#1a1a2e] border border-[#2d3748] text-gray-200 text-sm rounded-lg px-3 py-2 focus:border-amber-500 focus:outline-none"
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
          className="bg-[#1a1a2e] border border-[#2d3748] text-gray-200 text-sm rounded-lg px-3 py-2 w-48 focus:border-amber-500 focus:outline-none"
        />
        <div className="flex items-center gap-2 text-sm text-gray-400 ml-auto">
          <Activity className="w-4 h-4" />
          共 {filtered.length} 场
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>今日暂无竞彩比赛在售</p>
        </div>
      )}

      {/* 比赛卡片 */}
      <div className="grid gap-3">
        {filtered.map((match) => {
          const v = match.v42;
          const isExpanded = expandedId === match.match_no;
          const tConfig = v ? T_LEVEL_CONFIG[v.tLevel] || T_LEVEL_CONFIG.P : T_LEVEL_CONFIG.P;

          return (
            <div
              key={match.match_no}
              className="bg-[#1a1a2e] border border-[#2d3748] rounded-xl overflow-hidden hover:border-amber-500/40 transition-colors cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : match.match_no)}
            >
              <div className="p-4">
                {/* 头部 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      {match.match_no}
                    </span>
                    <span className="text-xs text-gray-400 bg-[#0f0f1a] px-2 py-0.5 rounded">
                      {match.league}
                    </span>
                    {match.match_time && (
                      <span className="text-xs text-gray-500">{match.match_time}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {v?.line0 === "Lock" && (
                      <span className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-medium">
                        <Lock className="w-3 h-3" />
                        线0 Lock
                      </span>
                    )}
                    {v && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded bg-gradient-to-r ${tConfig.bg} ${tConfig.text}`}
                      >
                        {tConfig.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* 对阵 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-white font-semibold">{match.home_team}</div>
                    <div className="text-gray-500 text-xs">主队</div>
                  </div>
                  <div className="text-center px-4">
                    {v && (
                      <div className="text-lg font-bold text-amber-400">
                        {v.direction}
                      </div>
                    )}
                    <div className="text-gray-500 text-xs mt-1">VS</div>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-white font-semibold">{match.away_team}</div>
                    <div className="text-gray-500 text-xs">客队</div>
                  </div>
                </div>

                {/* 赔率区 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* SPF */}
                  <div className="bg-[#0f0f1a] p-3 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2">SPF 胜平负</div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <div className="text-red-400 font-mono font-bold text-sm">
                          {match.spf_home || "-"}
                        </div>
                        <div className="text-gray-500 text-xs">主胜</div>
                      </div>
                      <div>
                        <div className="text-yellow-400 font-mono font-bold text-sm">
                          {match.spf_draw || "-"}
                        </div>
                        <div className="text-gray-500 text-xs">平</div>
                      </div>
                      <div>
                        <div className="text-blue-400 font-mono font-bold text-sm">
                          {match.spf_away || "-"}
                        </div>
                        <div className="text-gray-500 text-xs">客胜</div>
                      </div>
                    </div>
                  </div>
                  {/* RSPF */}
                  <div className="bg-[#0f0f1a] p-3 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      RSPF 让球
                      <span className="text-cyan-400 font-mono">
                        ({match.handicap > 0 ? "+" : ""}
                        {match.handicap})
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <div className="text-red-400 font-mono font-bold text-sm">
                          {match.rspf_home || "-"}
                        </div>
                        <div className="text-gray-500 text-xs">主胜</div>
                      </div>
                      <div>
                        <div className="text-yellow-400 font-mono font-bold text-sm">
                          {match.rspf_draw || "-"}
                        </div>
                        <div className="text-gray-500 text-xs">平</div>
                      </div>
                      <div>
                        <div className="text-blue-400 font-mono font-bold text-sm">
                          {match.rspf_away || "-"}
                        </div>
                        <div className="text-gray-500 text-xs">客胜</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 星级 + CR */}
                {v && (
                  <div className="flex items-center justify-between mb-3 bg-[#0f0f1a] p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-white">{renderStars(v.starLevel, v.starCount)}</span>
                      <span className="text-xs text-gray-500 ml-1">{v.starLevel}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">SPF-CR: </span>
                        <span className={`font-mono font-bold ${getCRColor(v.spfCR)}`}>
                          {v.spfCR.toFixed(1)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">交叉CR: </span>
                        <span className={`font-mono font-bold ${getCRColor(v.crossCR)}`}>
                          {v.crossCR.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 黄金比分TOP3 */}
                {v && v.goldenScores.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-amber-400" />
                      黄金比分 TOP{v.goldenScores.length}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {v.goldenScores.map((s, i) => (
                        <div
                          key={i}
                          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-2 rounded-lg text-center"
                        >
                          <div className="text-white font-mono font-bold text-sm">
                            {s.score}
                          </div>
                          <div className="text-amber-400 font-mono text-xs">
                            @ {s.odds.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!v && (
                  <div className="text-center text-gray-500 text-sm py-3">
                    暂无完整V4.2分析数据
                  </div>
                )}

                {/* 展开详情 */}
                {isExpanded && v && (
                  <div className="mt-4 pt-4 border-t border-[#2d3748] space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-[#0f0f1a] p-3 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">T级判定</div>
                        <div className="text-white font-semibold">{v.tLevel} · {v.tLabel}</div>
                      </div>
                      <div className="bg-[#0f0f1a] p-3 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">星级等级</div>
                        <div className="text-white font-semibold">{v.starLevel} ({v.starCount}星)</div>
                      </div>
                      <div className="bg-[#0f0f1a] p-3 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">SPF-CR</div>
                        <div className={`font-mono font-bold ${getCRColor(v.spfCR)}`}>
                          {v.spfCR.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#0f0f1a] p-3 rounded-lg">
                        <div className="text-gray-400 text-xs mb-1">RSPF-CR</div>
                        <div className={`font-mono font-bold ${getCRColor(v.rspfCR)}`}>
                          {v.rspfCR.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-center mt-2 text-gray-500">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
