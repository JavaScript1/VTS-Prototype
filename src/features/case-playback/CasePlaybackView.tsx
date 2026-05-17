/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Play, 
  Search, 
  Calendar, 
  Filter, 
  FileText, 
  Activity, 
  ShieldAlert,
  Clock,
  ChevronRight,
  Map as MapIcon,
  Video,
  History,
  Bookmark,
  Share2,
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_RISK_STATS } from '../../mockData';
import { Panel, SectionTitle, RISK_LEVEL_STYLES } from '../risk-analysis/RiskSharedComponents';
import RiskMacroTrend from '../risk-analysis/RiskMacroTrend';

interface CasePlaybackViewProps {
  onOpenPlayback: (index: number) => void;
}

export default function CasePlaybackView({ onOpenPlayback }: CasePlaybackViewProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(MOCK_RISK_STATS[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('全部');

  const categories = ['全部', '碰撞风险', '区域入侵', '航道超速', '走锚告警', '实况场景'];

  const filteredCases = useMemo(() => {
    return MOCK_RISK_STATS.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.risk.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === '全部' || 
                             (category === '实况场景' && item.isImageScenario) ||
                             (category !== '实况场景' && item.risk.includes(category.replace('风险', '').replace('告警', '')));
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, category]);

  const selectedCase = useMemo(() => {
    return MOCK_RISK_STATS.find(c => c.id === selectedCaseId) || MOCK_RISK_STATS[0];
  }, [selectedCaseId]);

  const selectedIndex = useMemo(() => {
    return MOCK_RISK_STATS.findIndex(c => c.id === selectedCaseId);
  }, [selectedCaseId]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* Left Sidebar: Case Library */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
            <History size={18} />
          </div>
          <span className="text-sm font-black tracking-widest text-slate-800">案情回放库</span>
        </div>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="搜索船舶名称、案情类型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                  category === cat 
                    ? 'bg-indigo-500 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar-light px-4 pb-4 space-y-2">
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
                    {item.isImageScenario && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-600 border border-amber-200">
                        实况
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">{item.time.split(' ')[0]}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className={`text-[10px] font-bold truncate ${active ? 'text-indigo-500/80' : 'text-slate-400'}`}>
                    {item.risk}
                  </div>
                  <ChevronRight size={12} className={active ? 'text-indigo-400' : 'text-slate-300'} />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content: Map & Details */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between bg-white px-6 border-b border-slate-200 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-slate-800">全域案情分布</h2>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Calendar size={14} className="text-indigo-500" />
              <span>2026-05-01 ~ 2026-05-17</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
              <Download size={14} /> 导出报告
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all">
              <Share2 size={14} /> 共享案例
            </button>
          </div>
        </header>

        {/* Map Area (Reusing Macro Trend Map logic) */}
        <div className="flex-1 min-h-0 relative">
          <RiskMacroTrend />
          
          {/* Detail Overlay Panel */}
          <AnimatePresence mode="wait">
            {selectedCase && (
              <motion.div
                key={selectedCase.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-6 top-6 z-[1000] w-80 pointer-events-auto"
              >
                <Panel className="p-5 shadow-2xl border-slate-200/60 backdrop-blur-md bg-white/95">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bookmark size={16} className="text-indigo-500" />
                      <SectionTitle title="案情摘要" />
                    </div>
                    <button className="text-slate-300 hover:text-slate-500 transition-colors">
                      <Info size={14} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        船舶信息
                      </div>
                      <div className="text-lg font-black text-slate-800">{selectedCase.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <span>MMSI: {selectedCase.mmsi}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>类型: {selectedCase.type}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">发生时间</div>
                        <div className="mt-1 text-xs font-bold text-slate-700">{selectedCase.time.split(' ')[1]}</div>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">案情类型</div>
                        <div className="mt-1 text-xs font-bold text-indigo-600">{selectedCase.risk}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">场景快照</div>
                      <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-900 group">
                        <img 
                          src={selectedCase.snapshot.image} 
                          alt="Case Snapshot" 
                          className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-white/20 p-2 backdrop-blur-md border border-white/30">
                            <Video size={20} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenPlayback(selectedIndex)}
                      className="w-full flex items-center justify-center gap-3 rounded-xl bg-indigo-500 py-3.5 text-xs font-black text-white shadow-xl shadow-indigo-500/30 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play size={16} fill="currentColor" />
                      立即复盘此案情
                    </button>
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-light::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar-light::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-light::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}} />
    </div>
  );
}
