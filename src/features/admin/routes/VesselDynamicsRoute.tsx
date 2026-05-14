import { Activity } from 'lucide-react';
import { MOCK_VESSEL_DYNAMICS } from '../../../mockData';

type VesselDynamicsRouteProps = {
  onLocate: (payload: any) => void;
};

export default function VesselDynamicsRoute({ onLocate }: VesselDynamicsRouteProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="text-[10px] uppercase tracking-widest text-white/30">在辖区船舶</div>
          <div className="mt-1 text-2xl font-black text-white">{MOCK_VESSEL_DYNAMICS.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="text-[10px] uppercase tracking-widest text-white/30">作业中</div>
          <div className="mt-1 text-2xl font-black text-emerald-400">{MOCK_VESSEL_DYNAMICS.filter((item) => item.status === '正在作业').length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="text-[10px] uppercase tracking-widest text-white/30">航行中</div>
          <div className="mt-1 text-2xl font-black text-sky-400">{MOCK_VESSEL_DYNAMICS.filter((item) => item.status === '正在航行').length}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 px-4 py-2.5 text-xs font-black text-white/80 uppercase tracking-widest">船舶动态</div>
        <div className="divide-y divide-white/5">
          {MOCK_VESSEL_DYNAMICS.map((vessel) => (
            <div key={vessel.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
              <div>
                <div className="text-[13px] font-bold text-white/90">{vessel.name}</div>
                <div className="mt-0.5 text-[11px] text-white/25 font-medium">{vessel.mmsi} · {vessel.origin} → {vessel.destination}</div>
              </div>
              <button
                onClick={() => onLocate({ vessel, event: vessel.events.find((item: any) => item.status === 'current') || vessel.events[vessel.events.length - 1] })}
                className="flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-bold text-sky-300 transition-all hover:bg-sky-500/20"
              >
                <Activity size={12} /> 定位
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
