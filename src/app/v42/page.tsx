"use client";

import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Target,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Star,
  Lock,
  Loader2,
  Activity,
  Sparkles,
  Flame,
  Calculator,
  ShoppingCart,
  Info,
  Check,
  Filter,
  Search,
} from "lucide-react";

interface ScoreOdd {
  score: string;
  odds: number;
}

interface FullMatch {
  match_no: string;
  league: string;
  home_team: string;
  away_team: string;
  match_time: string;
  match_date: string;
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  handicap: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  score_odds: ScoreOdd[];
  total_goals: { goals: number; odds: number }[];
  half_full: { key: string; odds: number }[];
  v42: V42Data | null;
}

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

const T_LEVEL_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  T0: { bg: "from-cyan-400 to-teal-500", text: "text-cyan-100", label: "💎T0 钻石" },
  T1a: { bg: "from-yellow-400 to-amber-500", text: "text-yellow-900", label: "🥇T1a 金星" },
  T1b: { bg: "from-gray-300 to-gray-400", text: "text-gray-900", label: "🥈T1b 银星" },
  T2: { bg: "from-orange-400 to-amber-700", text: "text-orange-100", label: "🥉T2 铜星" },
  T2b: { bg: "from-orange-600 to-red-700", text: "text-orange-100", label: "⚙️T2b 铁星" },
  T3c: { bg: "from-gray-500 to-gray-600", text: "text-gray-200", label: "T3c" },
  T3b: { bg: "from-gray-600 to-gray-700", text: "text-gray-300", label: "T3b" },
  EX: { bg: "from-red-600 to-red-800", text: "text-red-100", label: "EX 排除" },
  P: { bg: "from-blue-600 to-blue-700", text: "text-blue-100", label: "P 待定" },
};

const calcV42 = (m: {
  spf_home: number;
  spf_draw: number;
  spf_away: number;
  handicap: number;
  rspf_home: number;
  rspf_draw: number;
  rspf_away: number;
  score_odds: { score: string; odds: number }[];
}): V42Data => {
  // T级判定
  const minSpf = Math.min(m.spf_home, m.spf_away);
  const favoriteHome = m.spf_home < m.spf_away;
  let tLevel = "P";
  if (minSpf <= 1.20) tLevel = "T0";
  else if (minSpf <= 1.30) tLevel = "T1a";
  else if (minSpf <= 1.35) tLevel = "T1b";
  else if (minSpf <= 1.65) tLevel = "T2";
  else if (minSpf <= 1.75) tLevel = "T2b";
  else if (minSpf <= 2.0) tLevel = "T3c";
  else if (minSpf <= 2.5) tLevel = "T3b";
  else tLevel = "EX";

  const direction = favoriteHome ? "主胜" : "客胜";

  // 星级
  const drawOdds = m.spf_draw;
  let starLevel = "无";
  let starCount = 0;
  if (tLevel === "T0" || (tLevel === "T1a" && drawOdds >= 5.0)) {
    starLevel = "钻石"; starCount = 5;
  } else if ((tLevel === "T1a" && drawOdds < 5.0) || (tLevel === "T1b" && drawOdds >= 5.0)) {
    starLevel = "金"; starCount = 4;
  } else if ((tLevel === "T1b" && drawOdds < 5.0) || (tLevel === "T2" && drawOdds >= 4.5)) {
    starLevel = "银"; starCount = 3;
  } else if (tLevel === "T2" && drawOdds < 4.5) {
    starLevel = "铜"; starCount = 2;
  } else if (tLevel === "T2b") {
    starLevel = "铁"; starCount = 1;
  }

  // CR值
  const spfCR = (m.spf_home * m.spf_away) / (m.spf_draw * m.spf_draw) * 100;
  const rspfCR = (m.rspf_home * m.rspf_away) / (m.rspf_draw * m.rspf_draw) * 100;
  const crossCR = (spfCR * rspfCR) / 100;

  // 线0
  const line0 = tLevel === "T0" || tLevel === "T1a" ? "Lock" : "Normal";

  // 黄金比分TOP3
  const filteredScores = m.score_odds.filter(s => {
    const [h, a] = s.score.split(":").map(Number);
    return favoriteHome ? h > a : a > h;
  });
  const goldenScores = filteredScores
    .sort((a, b) => a.odds - b.odds)
    .slice(0, 3);

  const config = T_LEVEL_CONFIG[tLevel] || T_LEVEL_CONFIG.P;

  return {
    tLevel,
    tLabel: config.label,
    starLevel,
    starCount,
    direction,
    spfCR,
    rspfCR,
    crossCR,
    line0,
    goldenScores,
  };
};

const getCRColor = (cr: number) => {
  if (cr >= 200) return "text-red-400 bg-red-500/20 border-red-500/30";
  if (cr >= 150) return "text-orange-400 bg-orange-500/20 border-orange-500/30";
  if (cr >= 100) return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
  if (cr >= 70) return "text-green-400 bg-green-500/20 border-green-500/30";
  if (cr >= 40) return "text-cyan-400 bg-cyan-500/20 border-cyan-500/30";
  return "text-purple-400 bg-purple-500/20 border-purple-500/30";
};

const getStarIcon = (level: string) => {
  if (level === "钻石") return "💎";
  if (level === "金") return "🥇";
  if (level === "银") return "🥈";
  if (level === "铜") return "🥉";
  if (level === "铁") return "⚙️";
  return "☆";
};

const getHFLabel = (key: string): string => {
  const map: Record<string, string> = {
    "01": "胜胜", "10": "胜负", "02": "胜平",
    "20": "平胜", "11": "平平", "00": "平负",
    "12": "负胜", "21": "负平", "22": "负负",
  };
  return map[key] || key;
};

const TTG_LABELS = ["0球", "1球", "2球", "3球", "4球", "5球", "6球", "7+球"];

export default function V42Page() {
  const [activeTab, setActiveTab] = useState<'v42' | 'golden'>('v42');
  const [matches, setMatches] = useState<FullMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [leagueFilter, setLeagueFilter] = useState("全部");
  const [tFilter, setTFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [showLeagueDropdown, setShowLeagueDropdown] = useState(false);
  const [showTDropdown, setShowTDropdown] = useState(false);
  // 选号投注 - 选中的比赛场次
  const [selectedBets, setSelectedBets] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sporttery/matches?type=full');
      const result = await res.json();
      if (result.success && result.data) {
        const processed = result.data.map((m: any) => {
          // 转换 ttg_odds 对象为数组
          const total_goals: { goals: number; odds: number }[] = m.ttg_odds
            ? Object.entries(m.ttg_odds).map(([g, o]) => ({
                goals: parseInt(g),
                odds: o as number,
              })).sort((a, b) => a.goals - b.goals)
            : [];
          // 转换 hafu_odds 对象为数组
          const hafuMap: Record<string, string> = {
            hh: '胜胜', hd: '胜平', ha: '胜负',
            dh: '平胜', dd: '平平', da: '平负',
            ah: '负胜', ad: '负平', aa: '负负',
          };
          const half_full: { key: string; label: string; odds: number }[] = m.hafu_odds
            ? Object.entries(m.hafu_odds).map(([k, o]) => ({
                key: k,
                label: hafuMap[k] || k,
                odds: o as number,
              }))
            : [];
          return {
            ...m,
            total_goals,
            half_full,
            v42: calcV42(m),
          };
        });
        setMatches(processed);
      }
    } catch (error) {
      console.error('获取比赛失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const leagues = useMemo(() => {
    const set = new Set(matches.map(m => m.league));
    return ['全部', ...Array.from(set)];
  }, [matches]);

  const tLevels = ['全部', 'T0', 'T1a', 'T1b', 'T2', 'T2b', 'T3c', 'T3b', 'EX'];

  const filteredMatches = useMemo(() => {
    let r = matches;
    if (leagueFilter !== '全部') r = r.filter(m => m.league === leagueFilter);
    if (tFilter !== '全部' && activeTab === 'v42') {
      r = r.filter(m => m.v42?.tLevel === tFilter);
    }
    if (search) {
      const kw = search.toLowerCase();
      r = r.filter(m =>
        m.home_team.toLowerCase().includes(kw) ||
        m.away_team.toLowerCase().includes(kw) ||
        m.league.toLowerCase().includes(kw) ||
        m.match_no.toLowerCase().includes(kw)
      );
    }
    return r;
  }, [matches, leagueFilter, tFilter, search, activeTab]);

  const stats = useMemo(() => {
    const total = matches.length;
    const byLevel: Record<string, number> = {};
    matches.forEach(m => {
      const l = m.v42?.tLevel || 'P';
      byLevel[l] = (byLevel[l] || 0) + 1;
    });
    return { total, byLevel };
  }, [matches]);

  const toggleBet = (matchNo: string, option: string) => {
    setSelectedBets(prev => {
      const current = prev[matchNo] || [];
      const exists = current.includes(option);
      return {
        ...prev,
        [matchNo]: exists
          ? current.filter(o => o !== option)
          : [...current, option],
      };
    });
  };

  const totalBets = Object.values(selectedBets).reduce((s, arr) => s + arr.length, 0);

  return (
    <AppLayout>
      <div className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Crosshair className="w-6 h-6 text-amber-400" />
              V4.2 分析体系
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              线0八级方向预筛 + CR交叉比值 + 黄金比分
            </p>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex gap-1 p-1 bg-[#1a1a2e] border border-gray-700/50 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('v42')}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'v42'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            V4.2 分析
          </button>
          <button
            onClick={() => setActiveTab('golden')}
            className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'golden'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            金球智算
            {totalBets > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                {totalBets}
              </span>
            )}
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="搜索球队/联赛/场次..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowLeagueDropdown(!showLeagueDropdown); setShowTDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-gray-300 text-sm hover:border-gray-600 min-w-[120px] justify-between"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                {leagueFilter}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showLeagueDropdown && (
              <div className="absolute top-full mt-1 right-0 w-full max-h-60 overflow-y-auto bg-[#1f2937] border border-gray-600 rounded-lg z-20 shadow-xl min-w-[150px]">
                {leagues.map(l => (
                  <button
                    key={l}
                    onClick={() => { setLeagueFilter(l); setShowLeagueDropdown(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#374151] ${
                      leagueFilter === l ? 'text-amber-400 bg-amber-500/10' : 'text-gray-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'v42' && (
            <div className="relative">
              <button
                onClick={() => { setShowTDropdown(!showTDropdown); setShowLeagueDropdown(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-gray-300 text-sm hover:border-gray-600 min-w-[120px] justify-between"
              >
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  {tFilter === '全部' ? '全部等级' : tFilter}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showTDropdown && (
                <div className="absolute top-full mt-1 right-0 w-full max-h-60 overflow-y-auto bg-[#1f2937] border border-gray-600 rounded-lg z-20 shadow-xl">
                  {tLevels.map(l => (
                    <button
                      key={l}
                      onClick={() => { setTFilter(l); setShowTDropdown(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[#374151] ${
                        tFilter === l ? 'text-amber-400 bg-amber-500/10' : 'text-gray-300'
                      }`}
                    >
                      {l === '全部' ? '全部等级' : T_LEVEL_CONFIG[l]?.label || l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-gray-500 ml-auto">
            共 <span className="text-amber-400 font-bold">{filteredMatches.length}</span> 场
          </div>
        </div>

        {/* ============ V4.2 分析 Tab ============ */}
        {activeTab === 'v42' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-20 text-gray-500">
                <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3" />
                加载中...
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无符合条件的比赛</p>
              </div>
            ) : (
              filteredMatches.map(m => (
                <div
                  key={m.match_no}
                  className="p-3 bg-[#1a1a2e] border border-gray-700/50 rounded-xl cursor-pointer hover:border-amber-500/40 transition-all"
                  onClick={() => setExpanded(expanded === m.match_no ? null : m.match_no)}
                >
                  {/* 头部 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        {m.match_no}
                      </span>
                      <span className="text-xs text-gray-500">{m.league}</span>
                    </div>
                    {m.v42 && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r ${T_LEVEL_CONFIG[m.v42.tLevel]?.bg} ${T_LEVEL_CONFIG[m.v42.tLevel]?.text}`}
                      >
                        {m.v42.tLabel}
                      </span>
                    )}
                  </div>

                  {/* 对阵 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-right flex-1">
                      <div className="text-base font-semibold text-gray-100">{m.home_team}</div>
                      <div className="text-xs text-gray-500">主</div>
                    </div>
                    <div className="px-4 text-center">
                      <div className="text-xs text-red-400 font-mono">{m.spf_home.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">VS</div>
                      <div className="text-xs text-blue-400 font-mono">{m.spf_away.toFixed(2)}</div>
                    </div>
                    <div className="text-left flex-1">
                      <div className="text-base font-semibold text-gray-100">{m.away_team}</div>
                      <div className="text-xs text-gray-500">客</div>
                    </div>
                  </div>

                  {/* 星级 + 方向 + 线0 */}
                  <div className="flex items-center justify-between mb-3 px-2 py-2 bg-[#0f0f1a] rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStarIcon(m.v42?.starLevel || '无')}</span>
                      <span className="text-xs text-gray-400">{m.v42?.starLevel}星</span>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-bold ${
                      m.v42?.direction === '主胜' ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10'
                    }`}>
                      → {m.v42?.direction}
                    </div>
                    <div className="flex items-center gap-1">
                      {m.v42?.line0 === 'Lock' ? (
                        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                          <Lock className="w-3 h-3" /> 线0 Lock
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">线0 Normal</span>
                      )}
                    </div>
                  </div>

                  {/* CR值 */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className={`py-1.5 rounded border text-xs font-mono ${getCRColor(m.v42?.spfCR || 0)}`}>
                      SPF-CR {(m.v42?.spfCR || 0).toFixed(0)}
                    </div>
                    <div className={`py-1.5 rounded border text-xs font-mono ${getCRColor(m.v42?.rspfCR || 0)}`}>
                      RSPF-CR {(m.v42?.rspfCR || 0).toFixed(0)}
                    </div>
                    <div className={`py-1.5 rounded border text-xs font-mono font-bold ${getCRColor(m.v42?.crossCR || 0)}`}>
                      交叉 {(m.v42?.crossCR || 0).toFixed(0)}
                    </div>
                  </div>

                  {/* 黄金比分 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      黄金比分 Top3
                    </div>
                    <div className="flex gap-2">
                      {m.v42?.goldenScores.map((s, i) => (
                        <div
                          key={s.score}
                          className="flex-1 text-center py-2 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-lg"
                        >
                          <div className="text-amber-400 font-bold font-mono">{s.score}</div>
                          <div className="text-xs text-gray-400 font-mono">{s.odds.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {expanded === m.match_no && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                        <div className="text-gray-500">让球</div>
                        <div className="text-gray-500">主(让)</div>
                        <div className="text-gray-500">客(让)</div>
                        <div className="text-amber-400 font-mono">{m.handicap > 0 ? `-${m.handicap}` : `+${Math.abs(m.handicap)}`}</div>
                        <div className="text-red-400 font-mono">{m.rspf_home.toFixed(2)}</div>
                        <div className="text-blue-400 font-mono">{m.rspf_away.toFixed(2)}</div>
                      </div>
                      <div className="text-xs text-gray-600 text-center">点击卡片收起详情</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ============ 金球智算 Tab ============ */}
        {activeTab === 'golden' && (
          <div className="space-y-4">
            {/* 投注栏 */}
            {totalBets > 0 && (
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-900/40 to-orange-900/40 border border-amber-500/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-amber-400" />
                  <span className="text-gray-200">
                    已选 <span className="text-amber-400 font-bold">{totalBets}</span> 个投注明细
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBets({})}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                >
                  清空
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-gray-500">
                <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3" />
                加载中...
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无符合条件的比赛</p>
              </div>
            ) : (
              filteredMatches.map(m => (
                <div
                  key={m.match_no}
                  className="bg-[#1a1a2e] border border-gray-700/50 rounded-xl overflow-hidden"
                >
                  {/* 比赛头部 */}
                  <div className="p-4 bg-[#1f2937] border-b border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {m.match_no}
                        </span>
                        <span className="text-xs text-gray-400">{m.league}</span>
                        <span className="text-xs text-gray-600 font-mono">
                          {m.match_time?.slice(0, 5) || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.v42 && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded bg-gradient-to-r ${T_LEVEL_CONFIG[m.v42.tLevel]?.bg} ${T_LEVEL_CONFIG[m.v42.tLevel]?.text}`}>
                            {m.v42.tLabel}
                          </span>
                        )}
                        {m.v42?.starLevel === '钻石' && (
                          <span className="flex items-center gap-1 text-xs text-cyan-400">
                            <Flame className="w-3 h-3" /> 高价值
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-right flex-1">
                        <div className="text-lg font-bold text-gray-100">{m.home_team}</div>
                        <div className="text-xs text-red-400 font-mono">主胜 {m.spf_home.toFixed(2)}</div>
                      </div>
                      <div className="px-6 text-center">
                        <div className="text-xs text-gray-500 mb-1">让球 {m.handicap > 0 ? `-${m.handicap}` : `+${Math.abs(m.handicap)}`}</div>
                        <div className="text-gray-300 text-sm">VS</div>
                        <div className="text-xs text-yellow-400 font-mono">平 {m.spf_draw.toFixed(2)}</div>
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-lg font-bold text-gray-100">{m.away_team}</div>
                        <div className="text-xs text-blue-400 font-mono">客胜 {m.spf_away.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* 玩法表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {/* SPF 胜平负 */}
                        <tr className="border-b border-gray-700/30">
                          <td className="py-2 px-3 text-gray-500 text-xs w-20 whitespace-nowrap">胜平负</td>
                          {['主胜', '平局', '客胜'].map((label, i) => {
                            const odds = [m.spf_home, m.spf_draw, m.spf_away][i];
                            const color = ['text-red-400', 'text-yellow-400', 'text-blue-400'][i];
                            const key = `spf_${['home', 'draw', 'away'][i]}`;
                            const isSelected = (selectedBets[m.match_no] || []).includes(key);
                            const isValue = (m.v42?.direction === '主胜' && i === 0) || (m.v42?.direction === '客胜' && i === 2);
                            return (
                              <td
                                key={label}
                                onClick={() => toggleBet(m.match_no, key)}
                                className={`text-center py-2 px-2 cursor-pointer transition-all relative ${
                                  isSelected
                                    ? 'bg-amber-500/20 border-amber-500/40'
                                    : 'hover:bg-gray-700/30'
                                }`}
                              >
                                {isValue && <Flame className="absolute top-1 right-1 w-3 h-3 text-orange-400" />}
                                <div className={`font-mono font-bold ${color}`}>{odds.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">{label}</div>
                                {isSelected && (
                                  <Check className="absolute top-1 left-1 w-3.5 h-3.5 text-amber-400" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {/* RSPF 让球 */}
                        <tr className="border-b border-gray-700/30">
                          <td className="py-2 px-3 text-gray-500 text-xs">让球胜平负</td>
                          {['主胜', '平局', '客胜'].map((label, i) => {
                            const odds = [m.rspf_home, m.rspf_draw, m.rspf_away][i];
                            const color = ['text-red-400', 'text-yellow-400', 'text-blue-400'][i];
                            const key = `rspf_${['home', 'draw', 'away'][i]}`;
                            const isSelected = (selectedBets[m.match_no] || []).includes(key);
                            return (
                              <td
                                key={label}
                                onClick={() => toggleBet(m.match_no, key)}
                                className={`text-center py-2 px-2 cursor-pointer transition-all relative ${
                                  isSelected ? 'bg-amber-500/20' : 'hover:bg-gray-700/30'
                                }`}
                              >
                                <div className={`font-mono ${color}`}>{odds.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">{label}</div>
                                {isSelected && (
                                  <Check className="absolute top-1 left-1 w-3.5 h-3.5 text-amber-400" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {/* 比分 CRS */}
                        <tr className="border-b border-gray-700/30">
                          <td className="py-2 px-3 text-gray-500 text-xs align-top pt-3">比分</td>
                          <td colSpan={3} className="py-2 px-2">
                            <div className="grid grid-cols-8 gap-1">
                              {m.score_odds.slice(0, 16).map(s => {
                                const key = `score_${s.score}`;
                                const isSelected = (selectedBets[m.match_no] || []).includes(key);
                                const isGolden = m.v42?.goldenScores.some(g => g.score === s.score);
                                return (
                                  <div
                                    key={s.score}
                                    onClick={() => toggleBet(m.match_no, key)}
                                    className={`relative text-center py-1.5 rounded cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-amber-500/30 border border-amber-500/50'
                                        : isGolden
                                        ? 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
                                        : 'bg-[#0f0f1a] hover:bg-gray-700/30 border border-transparent'
                                    }`}
                                  >
                                    {isGolden && <Flame className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-orange-400" />}
                                    <div className="text-gray-200 font-mono text-xs font-bold">{s.score}</div>
                                    <div className="text-gray-500 font-mono text-[10px]">{s.odds.toFixed(2)}</div>
                                    {isSelected && (
                                      <Check className="absolute top-0.5 left-0.5 w-3 h-3 text-amber-400" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                              <Info className="w-3 h-3" />
                              显示前16个比分，点击赔率即可选号
                            </div>
                          </td>
                        </tr>
                        {/* 总进球 TTG */}
                        <tr className="border-b border-gray-700/30">
                          <td className="py-2 px-3 text-gray-500 text-xs">总进球</td>
                          <td colSpan={3} className="py-2 px-2">
                            <div className="grid grid-cols-8 gap-1">
                              {m.total_goals.map(t => {
                                const key = `ttg_${t.goals}`;
                                const isSelected = (selectedBets[m.match_no] || []).includes(key);
                                return (
                                  <div
                                    key={t.goals}
                                    onClick={() => toggleBet(m.match_no, key)}
                                    className={`relative text-center py-1.5 rounded cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-green-500/30 border border-green-500/50'
                                        : 'bg-[#0f0f1a] hover:bg-gray-700/30 border border-transparent'
                                    }`}
                                  >
                                    <div className="text-gray-200 font-mono text-xs font-bold">
                                      {TTG_LABELS[t.goals] || `${t.goals}球`}
                                    </div>
                                    <div className="text-gray-500 font-mono text-[10px]">{t.odds.toFixed(2)}</div>
                                    {isSelected && (
                                      <Check className="absolute top-0.5 left-0.5 w-3 h-3 text-green-400" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                        {/* 半全场 HAFU */}
                        <tr>
                          <td className="py-2 px-3 text-gray-500 text-xs align-top pt-3">半全场</td>
                          <td colSpan={3} className="py-2 px-2">
                            <div className="grid grid-cols-9 gap-1">
                              {m.half_full.slice(0, 9).map(h => {
                                const key = `hafu_${h.key}`;
                                const isSelected = (selectedBets[m.match_no] || []).includes(key);
                                return (
                                  <div
                                    key={h.key}
                                    onClick={() => toggleBet(m.match_no, key)}
                                    className={`relative text-center py-1.5 rounded cursor-pointer transition-all ${
                                      isSelected
                                        ? 'bg-purple-500/30 border border-purple-500/50'
                                        : 'bg-[#0f0f1a] hover:bg-gray-700/30 border border-transparent'
                                    }`}
                                  >
                                    <div className="text-gray-200 text-xs font-bold">{getHFLabel(h.key)}</div>
                                    <div className="text-gray-500 font-mono text-[10px]">{h.odds.toFixed(2)}</div>
                                    {isSelected && (
                                      <Check className="absolute top-0.5 left-0.5 w-3 h-3 text-purple-400" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
