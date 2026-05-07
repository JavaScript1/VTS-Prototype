import { Activity, Clock, Filter, Play, Search, ShieldAlert } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import type { MockRiskStat } from '../../../../types';

type WarningRiskListTabProps = {
  risks: MockRiskStat[];
  selectedRiskId: string | null;
  onSelectRisk: (riskId: string | null) => void;
  onPlayback: (item: MockRiskStat) => void;
};

const LEVEL_STYLES: Record<string, string> = {
  紧急: 'border-red-500/20 bg-red-500/10 text-red-400',
  警报: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  警告: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
  注意: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
};

function getRiskLevel(score?: number) {
  if ((score ?? 0) >= 85) return '紧急';
  if ((score ?? 0) >= 75) return '警报';
  if ((score ?? 0) >= 60) return '警告';
  return '注意';
}

function getRiskStatus(score?: number) {
  return (score ?? 0) >= 80 ? '报警中' : '已关闭';
}

export default function WarningRiskListTab({
  risks,
  selectedRiskId,
  onSelectRisk,
  onPlayback,
}: WarningRiskListTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [levelFilter, setLevelFilter] = useState('全部');

  const filteredRisks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return risks.filter((item) => {
      const level = getRiskLevel(item.riskScore);
      const status = getRiskStatus(item.riskScore);
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.mmsi.includes(keyword) ||
        item.risk.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === '全部' || status === statusFilter;
      const matchesLevel = levelFilter === '全部' || level === levelFilter;
      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [levelFilter, risks, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-[#0a101a] p-3 shadow-xl">
        <div className="flex items-center gap-3 overflow-x-auto pr-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Activity size={12} className="text-emerald-400" />
            <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white/20">状态</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="cursor-pointer bg-transparent text-[11px] font-bold text-white/80 focus:outline-none"
            >
              {['全部', '报警中', '已关闭'].map((value) => (
                <option key={value} value={value} className="bg-[#0a1420]">
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <ShieldAlert size={12} className="text-amber-400" />
            <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white/20">等级</span>
            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="cursor-pointer bg-transparent text-[11px] font-bold text-white/80 focus:outline-none"
            >
              {['全部', '紧急', '警报', '警告', '注意'].map((value) => (
                <option key={value} value={value} className="bg-[#0a1420]">
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Clock size={12} className="text-sky-400" />
            <span className="text-[11px] font-bold text-white/80">今天</span>
          </div>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索船名/MMSI..."
            className="w-44 rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-[11px] text-white transition-all hover:bg-white/[0.08] focus:border-sky-500/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#0a101a] shadow-2xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">目标船舶</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">风险类型</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">风险等级</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">发生区域</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">时间</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right text-white/30">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredRisks.map((item) => {
              const level = getRiskLevel(item.riskScore);
              const selected = selectedRiskId === item.id;
              return (
                <Fragment key={item.id}>
                  <tr
                    className={`cursor-pointer transition-colors hover:bg-white/5 ${selected ? 'bg-white/[0.03]' : ''}`}
                    onClick={() => onSelectRisk(selected ? null : item.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-white/90">{item.name}</span>
                        <span className="text-[10px] font-mono text-white/30">{item.mmsi} · {item.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-medium text-white/70">{item.risk}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${LEVEL_STYLES[level]}`}>
                        {level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-white/60">{item.snapshot.location}</td>
                    <td className="px-6 py-4 text-[11px] font-mono text-white/40">{item.time}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onPlayback(item);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-sky-400 transition-all hover:bg-sky-500 hover:text-white"
                      >
                        <Play size={12} />
                        动态回放
                      </button>
                    </td>
                  </tr>
                  {selected && (
                    <tr>
                      <td colSpan={6} className="bg-black/20 px-6 py-5">
                        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                          <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-3">
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">风险分</div>
                                <div className="mt-2 text-lg font-black text-red-400">{item.riskScore ?? '--'}</div>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">航速</div>
                                <div className="mt-2 text-sm font-bold text-white/80">{item.speed.toFixed(1)} kn</div>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">可视距离</div>
                                <div className="mt-2 text-sm font-bold text-white/80">{item.visibility}</div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                                <Filter size={12} className="text-sky-400" />
                                风险时间线
                              </div>
                              <div className="space-y-3">
                                {item.timeline.map((event) => (
                                  <div key={`${item.id}-${event.time}-${event.event}`} className="flex gap-3">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                                    <div className="space-y-1">
                                      <div className="text-[10px] font-mono text-white/30">{event.time}</div>
                                      <div className="text-[12px] text-white/75">{event.event}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/30">
                              环境快照
                            </div>
                            <div className="space-y-3 text-[12px] text-white/70">
                              <div className="flex justify-between gap-4">
                                <span className="text-white/35">风险区域</span>
                                <span className="text-right">{item.snapshot.location}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-white/35">风力 / 浪高</span>
                                <span>{item.wind} / {item.wave}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-white/35">航向</span>
                                <span>{item.heading}°</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-white/35">货种</span>
                                <span>{item.cargo}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-white/35">目的港</span>
                                <span>{item.destination || '--'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
