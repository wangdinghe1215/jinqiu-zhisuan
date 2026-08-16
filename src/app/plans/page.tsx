'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Trophy, AlertTriangle, TrendingUp, Loader2, Target } from 'lucide-react';
import Link from 'next/link';

interface PlanPick {
  match_no: string;
  match: string;
  time: string;
  direction: string;
  odds: number;
  star: string;
  v2_win_rate: string;
  golden_scores: string[];
  confidence: string;
}

interface Plan {
  id: string;
  name: string;
  strategy: string;
  unit: number;
  picks: PlanPick[];
  type: string;
  bets: number;
  total_cost: number;
  expected_return: number;
  expected_profit: number;
  risk: string;
  details?: string;
}

interface PlansData {
  date: string;
  generated_at: string;
  total_matches: number;
  recommended_matches: number;
  plans: Plan[];
}

export default function PlansPage() {
  const [plansData, setPlansData] = useState<PlansData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('plan_a');

  useEffect(() => {
    fetch('/data/plans_data.json')
      .then(res => res.json())
      .then(data => {
        setPlansData(data);
        if (data.plans && data.plans.length > 0) setSelectedPlan(data.plans[0].id);
      })
      .catch(err => console.error('load plans failed:', err))
      .finally(() => setLoading(false));
  }, []);

  const currentPlan = plansData?.plans.find(p => p.id === selectedPlan);

  const riskCls = (r: string) => {
    const m: Record<string,string> = {'低':'text-emerald-400 bg-emerald-500/10','中低':'text-cyan-400 bg-cyan-500/10','中':'text-yellow-400 bg-yellow-500/10'};
    return m[r] || 'text-orange-400 bg-orange-500/10';
  };
  const confCls = (c: string) => {
    const m: Record<string,string> = {'极高':'text-emerald-400','高':'text-cyan-400','中':'text-yellow-400'};
    return m[c] || 'text-gray-400';
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      <span className="ml-3 text-gray-400">加载中...</span>
    </div>
  );

  if (!plansData || !plansData.plans?.length) return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100">
      <div className="border-b border-[#2d3748] bg-[#1a1a2e]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/"><ArrowLeft className="w-5 h-5 text-gray-400" /></Link>
          <h1 className="text-xl font-bold text-amber-400">投注方案</h1>
        </div>
      </div>
      <main className="p-6 max-w-6xl mx-auto text-center py-20 text-gray-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg mb-2">暂无投注方案</p>
        <p className="text-sm">今日方案尚未生成，请稍后刷新</p>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-gray-100">
      <div className="border-b border-[#2d3748] bg-[#1a1a2e]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/"><ArrowLeft className="w-5 h-5 text-gray-400" /></Link>
          <div className="p-2 bg-amber-500/20 rounded-lg"><Wallet className="w-6 h-6 text-amber-400" /></div>
          <div>
            <h1 className="text-xl font-bold text-amber-400">投注方案</h1>
            <p className="text-xs text-gray-500">{plansData.date} · {plansData.total_matches}场在售 · {plansData.recommended_matches}场推荐</p>
          </div>
        </div>
      </div>

      <main className="p-4 max-w-6xl mx-auto space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Trophy className="w-4 h-4 text-gray-500 flex-shrink-0 mt-2" />
          {plansData.plans.map(p => (
            <button key={p.id} onClick={() => setSelectedPlan(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedPlan === p.id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-[#1a1a2e] text-gray-400 border border-transparent hover:border-[#2d3748]'}`}>
              {p.name}
            </button>
          ))}
        </div>

        {currentPlan && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-xs mb-1">方案策略</div>
                <div className="text-sm text-white">{currentPlan.strategy}</div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-xs mb-1">过关方式</div>
                <div className="text-sm text-cyan-400 font-bold">{currentPlan.type}</div>
                <div className="text-xs text-gray-500">{currentPlan.details || currentPlan.bets+'注'}</div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
                <div className="text-gray-400 text-xs mb-1">总投入</div>
                <div className="text-2xl font-bold text-amber-400">{currentPlan.total_cost}元</div>
                <div className="text-xs text-gray-500">{currentPlan.bets}注 x {currentPlan.unit}元</div>
              </div>
              <div className="p-3 bg-[#1a1a2e] rounded-xl border border-emerald-500/30">
                <div className="text-gray-400 text-xs mb-1">预期回报</div>
                <div className="text-2xl font-bold text-emerald-400">{currentPlan.expected_return.toFixed(0)}元</div>
                <div className="text-xs text-gray-500">利润+{currentPlan.expected_profit.toFixed(0)}元 · <span className={riskCls(currentPlan.risk)}>{currentPlan.risk}风险</span></div>
              </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-xl border border-[#2d3748]">
              <div className="px-4 py-3 border-b border-[#2d3748] flex justify-between">
                <span className="font-semibold text-white flex items-center gap-2"><Target className="w-4 h-4 text-amber-400"/>推荐场次</span>
                <span className="text-xs text-gray-500">{currentPlan.picks.length}场</span>
              </div>
              {currentPlan.picks.map((pick, i) => (
                <div key={pick.match_no} className="px-4 py-3 border-b border-[#2d3748] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold flex-shrink-0">{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                        <span className="px-1.5 py-0.5 bg-[#2d3748] rounded">{pick.match_no}</span>
                        <span>{pick.time}</span>
                      </div>
                      <div className="text-sm text-white font-medium truncate">{pick.match}</div>
                    </div>
                    <div className="text-center w-20 flex-shrink-0">
                      <div className="text-sm font-bold text-emerald-400">{pick.direction}</div>
                      <div className="text-xs text-gray-500">@{pick.odds}</div>
                    </div>
                    <div className="text-center w-24 flex-shrink-0">
                      <div className="text-xs text-amber-400 font-bold">{pick.star}</div>
                      <div className="text-xs text-gray-500">{pick.v2_win_rate}</div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {pick.golden_scores.map((s,si) => <span key={si} className="text-xs px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded font-mono">{s}</span>)}
                    </div>
                    <div className={`text-sm font-bold w-12 text-center flex-shrink-0 ${confCls(pick.confidence)}`}>{pick.confidence}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm text-amber-200/80">
              <span className="font-medium text-amber-400">⚠️ 风险提示：</span>投注方案仅供参考，不构成投注建议。彩票有风险，投注需谨慎。
            </div>
          </>
        )}
      </main>
    </div>
  );
}
