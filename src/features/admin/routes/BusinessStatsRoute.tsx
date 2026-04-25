import { MOCK_INTENT_STATS, MOCK_RISK_STATS } from '../../../mockData';

type BusinessStatsRouteProps = {
  activeStatsTab: string;
  onActiveStatsTabChange: (value: string) => void;
};

export default function BusinessStatsRoute({
  activeStatsTab,
  onActiveStatsTabChange,
}: BusinessStatsRouteProps) {
  const isIntent = activeStatsTab === '意图统计';
  const data = isIntent ? MOCK_INTENT_STATS : MOCK_RISK_STATS;
  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl bg-white/[0.04] p-1">
        {['值班统计', '意图统计'].map((tab) => (
          <button
            key={tab}
            onClick={() => onActiveStatsTabChange(tab)}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${activeStatsTab === tab ? 'bg-sky-500 text-white' : 'text-white/45 hover:text-white/70'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/30">统计对象</div>
          <div className="mt-2 text-2xl font-black text-white">{data.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/30">高优先级</div>
          <div className="mt-2 text-2xl font-black text-orange-400">
            {isIntent ? MOCK_INTENT_STATS.filter((item) => item.confidence >= 90).length : MOCK_RISK_STATS.filter((item) => (item.riskScore || 0) >= 80).length}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/30">今日趋势</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">+12%</div>
        </div>
      </div>
    </div>
  );
}
