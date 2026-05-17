import { useState } from 'react';
import { Plus, Search, Map as MapIcon, Settings } from 'lucide-react';
import { AREA_CATEGORIES, MOCK_AREAS } from '../../mockData';
import type { MockAreaMap } from '../../types';

export default function RiskAdminConsole() {
  const [activeSubTab, setActiveSubTab] = useState(AREA_CATEGORIES[0]);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [areaConfig] = useState<MockAreaMap>(() =>
    Object.fromEntries(
      Object.entries(MOCK_AREAS).map(([category, areas]) => [
        category,
        areas.map((area) => ({ ...area, fields: { ...area.fields } })),
      ]),
    ) as MockAreaMap,
  );

  const tabs = Object.keys(areaConfig);
  const areas = (areaConfig[activeSubTab] || []).filter((area) => 
    area.name.includes(areaSearchQuery) || area.type.includes(areaSearchQuery)
  );

  return (
    <div className="flex h-full min-h-full flex-col overflow-hidden bg-slate-50">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-3 text-slate-800">
          <Settings size={18} className="text-slate-400" />
          <h2 className="text-sm font-black tracking-tight">系统后台管理</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  activeSubTab === tab 
                    ? 'bg-white text-sky-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-sky-600">
            <Plus size={14} /> 新增区域
          </button>
        </div>

        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={areaSearchQuery}
            onChange={(e) => setAreaSearchQuery(e.target.value)}
            placeholder="搜索区域名称..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-700 placeholder:text-slate-400 focus:border-sky-500/40 focus:outline-none transition-all shadow-sm"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-3">区域名称</th>
                <th className="px-6 py-3">类型</th>
                <th className="px-6 py-3">状态</th>
                <th className="px-6 py-3">字段数</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                        <MapIcon size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{area.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {area.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {area.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {Object.keys(area.fields || {}).length} 个配置字段
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-[10px] font-bold text-sky-600 hover:text-sky-700">编辑</button>
                      <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600">详情</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
