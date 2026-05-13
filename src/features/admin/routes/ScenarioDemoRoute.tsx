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
      {MOCK_RISK_STATS.slice(0, 5).map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-all hover:bg-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-black text-white">{item.name}</div>
              {item.isImageScenario && (
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                  实况场景
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-white/35">{item.time}</div>
            <div className="mt-3 text-[12px] text-white/70">{item.risk}</div>
          </div>
          <button
            onClick={() => setDynamicPlaybackSession(getRiskPlaybackSession(item))}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-bold transition-all ${
              item.isImageScenario 
                ? 'border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20' 
                : 'border border-sky-500/20 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
            }`}
          >
            <Play size={12} /> {item.isImageScenario ? '查看实况' : '打开回放'}
          </button>
        </div>
      ))}
    </div>
  );
}
