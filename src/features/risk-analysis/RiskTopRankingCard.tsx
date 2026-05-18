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
    <Panel className={`border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur-md ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-red-100 text-red-500">
            <Flame size={12} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
            TOP 风险区域
          </span>
        </div>
        <span className="text-[8px] font-bold text-sky-500">{snapshot.timeLabel}</span>
      </div>

      <div className="space-y-3">
        {snapshot.hotspots.slice(0, 4).map((hotspot, index) => {
          const maxCount = snapshot.hotspots[0]?.eventCount || 1;
          const percentage = (hotspot.eventCount / maxCount) * 100;
          const active = hotspot.id === snapshot.activeFocusHotspotId;

          return (
            <div key={hotspot.id} className="space-y-1.5 transition-all">
              <div className="flex items-center justify-between gap-3 text-[10px]">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-3 font-mono font-black italic text-slate-300">0{index + 1}</span>
                  <span
                    className={`truncate font-bold transition-colors ${
                      active ? 'text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    {hotspot.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="font-black text-slate-900">{hotspot.eventCount}</span>
                  {hotspot.trend === 'up' ? (
                    <ArrowUpRight size={10} className="text-red-500" />
                  ) : (
                    <ArrowDownRight size={10} className="text-emerald-500" />
                  )}
                </div>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full shadow-sm transition-all duration-700 ${
                    active
                      ? 'bg-gradient-to-r from-sky-400 to-sky-600'
                      : 'bg-gradient-to-r from-slate-300 to-slate-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
