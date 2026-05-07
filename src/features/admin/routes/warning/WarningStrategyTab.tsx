import { Search, Settings, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MockArea } from '../../../../types';
import type { WarningRule } from '../../../../mockData';

type WarningStrategyTabProps = {
  warningRules: WarningRule[];
  warningAreaLookup: Map<string, MockArea>;
  onToggleRule: (ruleId: string) => void;
};

const SEVERITY_STYLES: Record<WarningRule['severity'], string> = {
  紧急: 'border-red-500/20 bg-red-500/10 text-red-400',
  警报: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  警告: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
  注意: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
};

export default function WarningStrategyTab({
  warningRules,
  warningAreaLookup,
  onToggleRule,
}: WarningStrategyTabProps) {
  const [keyword, setKeyword] = useState('');

  const filteredRules = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    if (!text) return warningRules;
    return warningRules.filter(
      (rule) =>
        rule.name.toLowerCase().includes(text) ||
        rule.category.toLowerCase().includes(text) ||
        rule.trigger.toLowerCase().includes(text),
    );
  }, [keyword, warningRules]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#0a101a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 rounded-full bg-sky-500" />
              <h3 className="whitespace-nowrap text-xs font-black uppercase tracking-widest text-white/90">
                预警触发规则配置
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/20">规则总数</span>
                <span className="text-[12px] font-mono font-black text-sky-400">
                  {warningRules.length}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/20">已激活</span>
                <span className="text-[12px] font-mono font-black text-emerald-400">
                  {warningRules.filter((rule) => rule.enabled).length}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索规则名称..."
              className="w-48 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-9 pr-4 text-[11px] text-white transition-all focus:border-sky-500/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">规则名称</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">预警类型</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">等级</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">生效区域</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">状态</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right text-white/30">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRules.map((rule) => {
                const areaNames = rule.effectiveAreaIds
                  .map((id) => warningAreaLookup.get(id)?.name)
                  .filter(Boolean) as string[];

                return (
                  <tr key={rule.id} className="group transition-colors hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                            rule.enabled
                              ? 'border-sky-500/20 bg-sky-500/10 text-sky-400'
                              : 'border-white/10 bg-white/5 text-white/20'
                          }`}
                        >
                          <Shield size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-bold text-white/90">{rule.name}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                            {rule.trigger}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-medium text-white/60">{rule.category}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${SEVERITY_STYLES[rule.severity]}`}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex max-w-[240px] flex-wrap gap-1.5">
                        {areaNames.length > 0 ? (
                          areaNames.slice(0, 3).map((name) => (
                            <span
                              key={name}
                              className="whitespace-nowrap rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-white/20">未指定</span>
                        )}
                        {areaNames.length > 3 && (
                          <span className="rounded-md border border-sky-500/10 bg-sky-500/5 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                            +{areaNames.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onToggleRule(rule.id)}
                        className={`relative h-5 w-10 rounded-full transition-all duration-300 ${
                          rule.enabled ? 'bg-sky-500' : 'bg-white/10'
                        }`}
                      >
                        <div
                          className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all duration-300 ${
                            rule.enabled ? 'left-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'left-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-white/40 transition-all hover:bg-sky-500/20 hover:text-sky-400">
                        <Settings size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
