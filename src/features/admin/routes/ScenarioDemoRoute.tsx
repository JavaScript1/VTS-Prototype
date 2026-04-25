import { Play } from 'lucide-react';
import { MOCK_RISK_STATS } from '../../../mockData';

type ScenarioDemoRouteProps = {
  setDynamicPlaybackSession: (value: any) => void;
  getRiskPlaybackSession: (item: any) => any;
};

export default function ScenarioDemoRoute({
  setDynamicPlaybackSession,
  getRiskPlaybackSession,
}: ScenarioDemoRouteProps) {
  return (
    <div className="space-y-4">
      {MOCK_RISK_STATS.slice(0, 4).map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div>
            <div className="text-sm font-black text-white">{item.name}</div>
            <div className="mt-1 text-[11px] text-white/35">{item.time}</div>
            <div className="mt-3 text-[12px] text-white/70">{item.risk}</div>
          </div>
          <button
            onClick={() => setDynamicPlaybackSession(getRiskPlaybackSession(item))}
            className="flex items-center gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-[11px] font-bold text-sky-300"
          >
            <Play size={12} /> 打开回放
          </button>
        </div>
      ))}
    </div>
  );
}
