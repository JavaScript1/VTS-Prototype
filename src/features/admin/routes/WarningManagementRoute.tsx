import { useMemo, useState } from 'react';
import { BarChart3, List, Settings, Shield } from 'lucide-react';
import { AREA_CATEGORIES, INITIAL_WARNING_RULES, MOCK_AREAS, MOCK_RISK_STATS } from '../../../mockData';
import type { MockRiskStat } from '../../../types';
import type { WarningRule } from '../../../mockData';
import WarningDashboardTab from './warning/WarningDashboardTab';
import WarningRiskListTab from './warning/WarningRiskListTab';
import WarningStrategyTab from './warning/WarningStrategyTab';

type WarningManagementRouteProps = {
  setDynamicPlaybackSession?: (value: any) => void;
  getRiskPlaybackSession?: (item: MockRiskStat) => any;
};

type WarningTabId = '实时预警' | '风险列表' | '风险统计';

const WARNING_TABS: Array<{ id: WarningTabId; label: string; icon: typeof Settings }> = [
  { id: '实时预警', label: '预警策略', icon: Settings },
  { id: '风险列表', label: '风险列表', icon: List },
  { id: '风险统计', label: '风险看板', icon: BarChart3 },
];

export default function WarningManagementRoute({
  setDynamicPlaybackSession,
  getRiskPlaybackSession,
}: WarningManagementRouteProps) {
  const [activeTab, setActiveTab] = useState<WarningTabId>('实时预警');
  const [warningRules, setWarningRules] = useState<WarningRule[]>(
    INITIAL_WARNING_RULES.map((rule) => ({ ...rule })),
  );
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(MOCK_RISK_STATS[0]?.id ?? null);

  const warningAreaLookup = useMemo(
    () =>
      new Map(
        AREA_CATEGORIES.flatMap((category) =>
          (MOCK_AREAS[category] || []).map((area) => [area.id, area] as const),
        ),
      ),
    [],
  );

  const handleToggleRule = (ruleId: string) => {
    setWarningRules((current) =>
      current.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule)),
    );
  };

  const handlePlayback = (item: MockRiskStat) => {
    if (!setDynamicPlaybackSession || !getRiskPlaybackSession) return;
    setDynamicPlaybackSession(getRiskPlaybackSession(item));
  };

  return (
    <div className="flex h-full min-h-full flex-col overflow-hidden bg-[#050a10]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#0a101a]/50 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <Shield size={18} />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">
              预警与风险管理
            </span>
          </div>

          <nav className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
            {WARNING_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
        {activeTab === '实时预警' && (
          <WarningStrategyTab
            warningRules={warningRules}
            warningAreaLookup={warningAreaLookup}
            onToggleRule={handleToggleRule}
          />
        )}

        {activeTab === '风险列表' && (
          <WarningRiskListTab
            risks={MOCK_RISK_STATS}
            selectedRiskId={selectedRiskId}
            onSelectRisk={setSelectedRiskId}
            onPlayback={handlePlayback}
          />
        )}

        {activeTab === '风险统计' && (
          <WarningDashboardTab risks={MOCK_RISK_STATS} warningRules={warningRules} />
        )}
      </div>
    </div>
  );
}
