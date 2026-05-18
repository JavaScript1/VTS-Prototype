import { useState } from 'react';
import { 
  Globe, 
  LayoutDashboard,
  ArrowRight,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RiskMacroTrend from './RiskMacroTrend';
import RiskPlaybackCenter from './RiskPlaybackCenter';
import { useRiskPlaybackState } from './useRiskPlaybackState';

type RiskAnalysisTab = 'macro-trend' | 'risk-playback';

type RiskAnalysisViewProps = {
  onOpenPlayback: (index: number) => void;
};

export default function RiskAnalysisView({ onOpenPlayback: _onOpenPlayback }: RiskAnalysisViewProps) {
  const [activeTab, setActiveTab] = useState<RiskAnalysisTab>('macro-trend');
  const {
    filteredCases,
    isCollisionRisk,
    playbackSession,
    selectedCaseId,
    setSelectedCaseId,
  } = useRiskPlaybackState();

  const menuItems = [
    { id: 'macro-trend', label: '宏观态势', icon: Globe, description: '全辖区风险分布与趋势分析' },
    { id: 'risk-playback', label: '预警回放', icon: History, description: '包含碰撞预警在内的案例筛选、快照查看与回放入口' },
  ];
  const sidebarWidthClass = activeTab === 'risk-playback' ? 'w-80' : 'w-64';

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className={`flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-300 ${sidebarWidthClass}`}>
        <div className="flex h-14 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500 text-white shadow-lg shadow-sky-500/20">
            <LayoutDashboard size={18} />
          </div>
          <span className="text-sm font-black tracking-widest text-slate-800">风险分析中心</span>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-4">
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">主要模块</div>
          {menuItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as RiskAnalysisTab)}
                className={`group flex w-full flex-col gap-1 rounded-xl px-4 py-3 transition-all ${
                  active 
                    ? 'bg-sky-50 text-sky-600 shadow-sm ring-1 ring-inset ring-sky-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={active ? 'text-sky-500' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span className="text-xs font-bold">{item.label}</span>
                  {active && <ArrowRight size={12} className="ml-auto" />}
                </div>
                <div className={`pl-7 text-[10px] leading-relaxed ${active ? 'text-sky-500/70' : 'text-slate-400'}`}>
                  {item.description}
                </div>
              </button>
            );
          })}

          <div className="my-6 h-px bg-slate-100" />

          {activeTab === 'risk-playback' ? (
            <div className="space-y-2">
              <div className="custom-scrollbar-light space-y-2 overflow-y-auto">
                {filteredCases.map((item) => {
                  const active = selectedCaseId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedCaseId(item.id)}
                      className={`group flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-all ${
                        active
                          ? 'border-indigo-200 bg-indigo-50 ring-1 ring-indigo-200'
                          : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black ${active ? 'text-indigo-600' : 'text-slate-700'}`}>
                            {item.name}
                          </span>
                          {isCollisionRisk(item.risk) ? (
                            <span className="rounded-full border border-rose-200 bg-rose-100 px-1.5 py-0.5 text-[8px] font-bold text-rose-600">
                              碰撞
                            </span>
                          ) : null}
                          {item.isImageScenario ? (
                            <span className="rounded-full border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-600">
                              实况
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[9px] font-medium text-slate-400">{item.time.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className={`truncate text-[10px] font-bold ${active ? 'text-indigo-500/80' : 'text-slate-400'}`}>
                          {item.risk}
                        </div>
                        <ArrowRight size={12} className={active ? 'text-indigo-400' : 'text-slate-300'} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>系统状态</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                在线
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500">
              数据同步于 2026-05-11
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {activeTab === 'macro-trend' && <RiskMacroTrend />}
            {activeTab === 'risk-playback' && <RiskPlaybackCenter playbackSession={playbackSession} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
