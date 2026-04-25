import { Shield } from 'lucide-react';
import { MOCK_RISK_STATS } from '../../../mockData';

export default function WarningManagementRoute() {
  return (
    <div className="space-y-4">
      {MOCK_RISK_STATS.map((item) => (
        <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-black text-white">{item.name}</div>
              <div className="mt-1 text-[11px] text-white/35">{item.mmsi} · {item.type}</div>
              <div className="mt-3 text-[12px] text-white/70">{item.risk}</div>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-right">
              <div className="text-[10px] uppercase tracking-widest text-red-300/70">风险分</div>
              <div className="mt-1 flex items-center gap-1 text-lg font-black text-red-400">
                <Shield size={14} /> {item.riskScore || '--'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
