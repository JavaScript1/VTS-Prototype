import { useMemo, useState } from 'react';
import { BarChart3, List, Map as MapIcon, Settings, Globe, Shield } from 'lucide-react';
import { AREA_CATEGORIES, INITIAL_WARNING_RULES, MOCK_AREAS, MOCK_RISK_STATS } from '../../mockData';
import type { MockRiskStat } from '../../types';
import type { WarningRule } from '../../mockData';
import { Panel, RISK_LEVEL_STYLES } from './RiskSharedComponents';
import RiskWarningRiskListTab from './RiskWarningRiskListTab';

type WarningTabId = '预警策略' | '风险列表' | '风险看板' | '重点区域' | '宏观态势';

const WARNING_TABS: Array<{ id: WarningTabId; label: string; icon: any }> = [
  { id: '预警策略', label: '预警策略', icon: Settings },
  { id: '风险列表', label: '风险列表', icon: List },
  { id: '风险看板', label: '风险看板', icon: BarChart3 },
  { id: '重点区域', label: '重点区域', icon: MapIcon },
];

export default function RiskWarningManagement() {
  const [activeTab, setActiveTab] = useState<WarningTabId>('风险列表');
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(MOCK_RISK_STATS[0]?.id ?? null);

  const handlePlayback = (item: MockRiskStat) => {
    console.log('Playback risk:', item);
    // In a real app, this would trigger the global playback session
  };

  return (
    <div className="flex h-full min-h-full flex-col overflow-hidden bg-slate-50">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-800">
            <Shield size={18} className="text-sky-500" />
            <h2 className="text-sm font-black tracking-tight">预警管理中心</h2>
          </div>
          
          <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {WARNING_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === '风险列表' && (
          <RiskWarningRiskListTab
            risks={MOCK_RISK_STATS}
            selectedRiskId={selectedRiskId}
            onSelectRisk={setSelectedRiskId}
            onPlayback={handlePlayback}
          />
        )}
        
        {activeTab !== '风险列表' && (
          <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400">
            <div className="flex flex-col items-center gap-3">
              <Settings size={32} className="animate-spin-slow" />
              <p className="text-sm font-medium">{activeTab} 模块正在适配白色主题中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
