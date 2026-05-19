import { ArrowDownRight, ArrowUpRight, Flame } from 'lucide-react';
import { Panel } from './RiskSharedComponents';

export type RiskTopRankingItem = {
  id: string;
  name: string;
  eventCount: number;
  trend: 'up' | 'down';
};

export type RiskTopRankingSnapshot = {
  timeLabel: string;
  activeFocusHotspotId: string | null;
  hotspots: RiskTopRankingItem[];
};

type RiskTopRankingCardProps = {
  snapshot: RiskTopRankingSnapshot;
  className?: string;
};

export default function RiskTopRankingCard({
  snapshot,
  className = '',
}: RiskTopRankingCardProps) {
  return (
    <Panel className={`flex flex-col border-slate-200/60 bg-white/95 p-4 shadow-xl shadow-slate-200/50 backdrop-blur-xl ${className}`}>
      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
            <Flame size={14} fill="currentColor" className="opacity-80" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
              TOP 风险区域
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Risk Ranking</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-sky-50 px-2 py-0.5 ring-1 ring-sky-100">
          <span className="h-1 w-1 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[9px] font-black text-sky-600">{snapshot.timeLabel}</span>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {snapshot.hotspots.slice(0, 4).map((hotspot, index) => {
          const maxCount = snapshot.hotspots[0]?.eventCount || 1;
          const percentage = (hotspot.eventCount / maxCount) * 100;
          const active = hotspot.id === snapshot.activeFocusHotspotId;

          return (
            <div 
              key={hotspot.id} 
              className={`group relative rounded-xl transition-all duration-300 ${
                active ? 'bg-sky-50/50 p-2 -mx-2' : 'hover:bg-slate-50/50 p-2 -mx-2'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-[10px]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black italic transition-all ${
                      active ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}>
                      {index + 1}
                    </div>
                    <span
                      className={`truncate text-[11px] font-bold transition-colors ${
                        active ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {hotspot.name}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`font-black tabular-nums transition-colors ${active ? 'text-sky-600' : 'text-slate-900'}`}>
                      {hotspot.eventCount}
                    </span>
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      hotspot.trend === 'up' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
                    }`}>
                      {hotspot.trend === 'up' ? (
                        <ArrowUpRight size={10} strokeWidth={3} />
                      ) : (
                        <ArrowDownRight size={10} strokeWidth={3} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-100/80">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      active
                        ? 'bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]'
                        : 'bg-slate-300 group-hover:bg-slate-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  {active && (
                    <div 
                      className="absolute top-0 h-full w-1 bg-white/40 blur-[1px]"
                      style={{ left: `calc(${percentage}% - 2px)` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 border-t border-slate-50 pt-3">
        <div className="flex items-center justify-between rounded-lg bg-slate-50/50 p-2 ring-1 ring-slate-100">
          <span className="text-[9px] font-bold text-slate-400 uppercase">当前焦点</span>
          <span className="text-[10px] font-black text-sky-600">
            {snapshot.hotspots.find(h => h.id === snapshot.activeFocusHotspotId)?.name || '未选择'}
          </span>
        </div>
      </div>
    </Panel>
  );
}
