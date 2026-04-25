import { Plus, Search } from 'lucide-react';
import type { MockAreaMap } from '../../../types';

type AreaSettingsRouteProps = {
  areaConfig: MockAreaMap;
  activeSubTab: string;
  areaSearchQuery: string;
  onActiveSubTabChange: (value: string) => void;
  onAreaSearchQueryChange: (value: string) => void;
};

export default function AreaSettingsRoute({
  areaConfig,
  activeSubTab,
  areaSearchQuery,
  onActiveSubTabChange,
  onAreaSearchQueryChange,
}: AreaSettingsRouteProps) {
  const tabs = Object.keys(areaConfig);
  const areas = (areaConfig[activeSubTab] || []).filter((area) => area.name.includes(areaSearchQuery) || area.type.includes(areaSearchQuery));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 rounded-xl bg-white/[0.04] p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onActiveSubTabChange(tab)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${activeSubTab === tab ? 'bg-sky-500 text-white' : 'text-white/45 hover:text-white/70'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-2 text-[12px] font-semibold text-sky-300 transition-colors hover:bg-sky-500/20">
          <Plus size={14} /> 新增区域
        </button>
      </div>

      <div className="relative w-72">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={areaSearchQuery}
          onChange={(e) => onAreaSearchQueryChange(e.target.value)}
          placeholder="搜索区域名称..."
          className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 pl-9 pr-4 text-[12px] text-white placeholder:text-white/20 focus:border-sky-500/40 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.05]">
              <th className="px-4 py-4 text-[11px] font-bold text-white/40">区域名称</th>
              <th className="px-4 py-4 text-[11px] font-bold text-white/40">类型</th>
              <th className="px-4 py-4 text-[11px] font-bold text-white/40">状态</th>
              <th className="px-4 py-4 text-[11px] font-bold text-white/40">字段数</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]">
                <td className="px-4 py-4 text-[13px] text-white/88">{area.name}</td>
                <td className="px-4 py-4 text-[12px] text-white/55">{area.type}</td>
                <td className="px-4 py-4 text-[12px] text-white/55">{area.status}</td>
                <td className="px-4 py-4 text-[12px] text-white/55">{Object.keys(area.fields || {}).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
