/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  AlertCircle,
  BellRing,
  CheckCircle,
  ShieldAlert, 
  Search, 
  History, 
  ChevronRight, 
  Navigation, 
  Video, 
  Volume2, 
  Info, 
  CheckCircle2, 
  Map as MapIcon,
  Play,
  FileText,
  Anchor,
  Wind,
  Layers,
  MoreVertical,
  Activity,
  ArrowRight,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_RISK_STATS, MOCK_PATROL_BOATS } from '../../mockData';
import { Panel, SectionTitle } from '../risk-analysis/RiskSharedComponents';
import RiskMacroTrend from '../risk-analysis/RiskMacroTrend';

interface LawEnforcementViewProps {
  onOpenPlayback: (index: number) => void;
}

type EnforcementSeverity = 'low' | 'medium' | 'high';
type EnforcementStatus = 'pending' | 'in_progress' | 'completed';

type EnforcementCase = {
  id: string;
  violationType: string;
  shipName: string;
  mmsi: string;
  location: string;
  severity: EnforcementSeverity;
  timestamp: number;
  proposedActions: string[];
  status: EnforcementStatus;
};

type EnforcementFormData = {
  violationType: string;
  shipName: string;
  mmsi: string;
  location: string;
  severity: EnforcementSeverity;
};

const emptyEnforcementForm: EnforcementFormData = {
  violationType: '',
  shipName: '',
  mmsi: '',
  location: '',
  severity: 'medium',
};

const generateProposedActions = (violationType: string, severity: EnforcementSeverity) => {
  const actionMap: Record<string, Record<EnforcementSeverity, string[]>> = {
    超速航行: {
      high: ['立即警告', '罚款 5000 元', '扣留证件'],
      medium: ['警告', '罚款 2000 元'],
      low: ['口头警告', '记录在案'],
    },
    进入禁航区: {
      high: ['强制驱离', '罚款 10000 元', '扣船处理'],
      medium: ['驱离', '罚款 5000 元'],
      low: ['警告', '罚款 1000 元'],
    },
    走锚: {
      high: ['立即处置', '罚款 8000 元', '扣船'],
      medium: ['处置', '罚款 3000 元'],
      low: ['警告', '罚款 1000 元'],
    },
    其他违规: {
      high: ['立即处置', '罚款 5000 元'],
      medium: ['警告', '罚款 2000 元'],
      low: ['记录在案', '罚款 500 元'],
    },
  };

  return actionMap[violationType]?.[severity] ?? ['待评估'];
};

const getSeverityLabel = (severity: EnforcementSeverity) =>
  severity === 'high' ? '高风险' : severity === 'medium' ? '中风险' : '低风险';

const getSeverityClass = (severity: EnforcementSeverity) => {
  if (severity === 'high') return 'border-red-200 bg-red-50 text-red-600';
  if (severity === 'medium') return 'border-amber-200 bg-amber-50 text-amber-600';
  return 'border-emerald-200 bg-emerald-50 text-emerald-600';
};

export default function LawEnforcementView({ onOpenPlayback }: LawEnforcementViewProps) {
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(MOCK_RISK_STATS[1]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'clues' | 'planning'>('clues');
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [showEnforcementForm, setShowEnforcementForm] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [enforcementForm, setEnforcementForm] =
    useState<EnforcementFormData>(emptyEnforcementForm);
  const [enforcementCases, setEnforcementCases] = useState<EnforcementCase[]>([
    {
      id: 'case-seed-1',
      violationType: '进入禁航区',
      shipName: '江海通8',
      mmsi: '413000008',
      location: '吴淞口警戒区',
      severity: 'high',
      timestamp: Date.now() - 1000 * 60 * 18,
      proposedActions: generateProposedActions('进入禁航区', 'high'),
      status: 'pending',
    },
  ]);

  const filteredVessels = useMemo(() => {
    return MOCK_RISK_STATS.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.risk.includes(searchQuery));
  }, [searchQuery]);

  const selectedVessel = useMemo(() => {
    return MOCK_RISK_STATS.find(v => v.id === selectedVesselId) || MOCK_RISK_STATS[1];
  }, [selectedVesselId]);

  const selectedIndex = useMemo(() => {
    return MOCK_RISK_STATS.findIndex(v => v.id === selectedVesselId);
  }, [selectedVesselId]);

  const filteredEnforcementCases = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return enforcementCases;
    return enforcementCases.filter((caseItem) =>
      caseItem.shipName.toLowerCase().includes(keyword) ||
      caseItem.mmsi.includes(keyword) ||
      caseItem.violationType.includes(searchQuery) ||
      caseItem.location.includes(searchQuery),
    );
  }, [enforcementCases, searchQuery]);

  const selectedCase = useMemo(
    () => enforcementCases.find((caseItem) => caseItem.id === selectedCaseId) ?? null,
    [enforcementCases, selectedCaseId],
  );

  const selectedCaseActions = useMemo(() => {
    if (selectedCase) return selectedCase.proposedActions;
    if (!selectedVessel) return [];
    const violationType = selectedVessel.risk.includes('禁航')
      ? '进入禁航区'
      : selectedVessel.risk.includes('走锚')
        ? '走锚'
        : selectedVessel.risk.includes('超速')
          ? '超速航行'
          : '其他违规';
    return generateProposedActions(violationType, selectedVessel.risk.includes('紧急') ? 'high' : 'medium');
  }, [selectedCase, selectedVessel]);

  const handleCreateEnforcementCase = () => {
    if (
      !enforcementForm.violationType ||
      !enforcementForm.shipName ||
      !enforcementForm.mmsi ||
      !enforcementForm.location
    ) {
      return;
    }

    const newCase: EnforcementCase = {
      ...enforcementForm,
      id: `case-${Date.now()}`,
      timestamp: Date.now(),
      proposedActions: generateProposedActions(
        enforcementForm.violationType,
        enforcementForm.severity,
      ),
      status: 'pending',
    };

    setEnforcementCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
    setEnforcementForm(emptyEnforcementForm);
    setShowEnforcementForm(false);
  };

  const updateEnforcementStatus = (caseId: string, status: EnforcementStatus) => {
    setEnforcementCases((prev) =>
      prev.map((caseItem) => (caseItem.id === caseId ? { ...caseItem, status } : caseItem)),
    );
  };

  const removeEnforcementCase = (caseId: string) => {
    setEnforcementCases((prev) => prev.filter((caseItem) => caseItem.id !== caseId));
    if (selectedCaseId === caseId) {
      setSelectedCaseId(null);
    }
  };

  // Planning logic
  const nearestPatrolBoat = useMemo(() => {
    if (!selectedVessel || !selectedVessel.coords) return null;
    return MOCK_PATROL_BOATS.reduce((prev, curr) => {
      const d1 = Math.sqrt(Math.pow(curr.lat - selectedVessel.coords![0], 2) + Math.pow(curr.lng - selectedVessel.coords![1], 2));
      const d2 = Math.sqrt(Math.pow(prev.lat - selectedVessel.coords![0], 2) + Math.pow(prev.lng - selectedVessel.coords![1], 2));
      return d1 < d2 ? curr : prev;
    });
  }, [selectedVessel]);

  const planningData = useMemo(() => {
    if (!selectedVessel || !nearestPatrolBoat || !selectedVessel.coords) return null;
    const distance = 4.2; // Mock distance in nm
    const eta = Math.round((distance / nearestPatrolBoat.speed) * 60);
    return {
      distance,
      eta,
      suitability: '高',
      recommendation: '建议现场拦截检查'
    };
  }, [selectedVessel, nearestPatrolBoat]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* 1) Identification Sidebar: 甄别违法船舶 */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-white shadow-lg shadow-rose-500/20">
            <ShieldAlert size={18} />
          </div>
          <span className="text-sm font-black tracking-widest text-slate-800">违法船舶甄别</span>
        </div>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="搜索船名、MMSI、违法类型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium outline-none transition-all focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/10"
            />
          </div>
          
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
            <span>疑似违法船舶 ({filteredVessels.length})</span>
            <Layers size={12} />
          </div>

          <button
            onClick={() => setShowEnforcementForm((value) => !value)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2 text-xs font-black text-rose-600 transition-all hover:border-rose-300 hover:bg-rose-100"
          >
            <Plus size={14} />
            {showEnforcementForm ? '收起违规录入' : '新增违规信息'}
          </button>

          <AnimatePresence initial={false}>
            {showEnforcementForm && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              >
                <label className="block space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">违规类型</span>
                  <select
                    value={enforcementForm.violationType}
                    onChange={(event) =>
                      setEnforcementForm((prev) => ({ ...prev, violationType: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-rose-300"
                  >
                    <option value="">请选择</option>
                    <option value="超速航行">超速航行</option>
                    <option value="进入禁航区">进入禁航区</option>
                    <option value="走锚">走锚</option>
                    <option value="其他违规">其他违规</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={enforcementForm.shipName}
                    onChange={(event) =>
                      setEnforcementForm((prev) => ({ ...prev, shipName: event.target.value }))
                    }
                    placeholder="船舶名称"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300 focus:border-rose-300"
                  />
                  <input
                    value={enforcementForm.mmsi}
                    onChange={(event) =>
                      setEnforcementForm((prev) => ({ ...prev, mmsi: event.target.value }))
                    }
                    placeholder="MMSI"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300 focus:border-rose-300"
                  />
                </div>
                <input
                  value={enforcementForm.location}
                  onChange={(event) =>
                    setEnforcementForm((prev) => ({ ...prev, location: event.target.value }))
                  }
                  placeholder="位置，如：吴淞口警戒区"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none placeholder:text-slate-300 focus:border-rose-300"
                />
                <select
                  value={enforcementForm.severity}
                  onChange={(event) =>
                    setEnforcementForm((prev) => ({
                      ...prev,
                      severity: event.target.value as EnforcementSeverity,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-rose-300"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
                <button
                  onClick={handleCreateEnforcementCase}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2 text-xs font-black text-white transition-all hover:bg-slate-800 active:scale-[0.98]"
                >
                  <ShieldAlert size={14} />
                  生成执法方案
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar-light px-4 pb-4 space-y-2">
          {filteredVessels.map((v) => {
            const active = selectedVesselId === v.id;
            return (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVesselId(v.id);
                  setSelectedCaseId(null);
                }}
                className={`group flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-all ${
                  active 
                    ? 'border-rose-200 bg-rose-50 ring-1 ring-rose-200' 
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-black ${active ? 'text-rose-600' : 'text-slate-700'}`}>
                    {v.name}
                  </span>
                  <span className="text-[9px] font-medium text-slate-400">{v.time.split(' ')[1]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] font-bold ${active ? 'text-rose-500/80' : 'text-slate-400'}`}>
                    {v.risk}
                  </div>
                  <ChevronRight size={12} className={active ? 'text-rose-400' : 'text-slate-300'} />
                </div>
              </button>
            );
          })}

          <div className="pt-4">
            <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>人工录入案件 ({filteredEnforcementCases.length})</span>
              <ShieldAlert size={12} />
            </div>
            <div className="space-y-2">
              {filteredEnforcementCases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-[10px] font-bold text-slate-400">
                  暂无违规案件
                </div>
              ) : (
                filteredEnforcementCases.map((caseItem) => {
                  const active = selectedCaseId === caseItem.id;
                  return (
                    <button
                      key={caseItem.id}
                      onClick={() => {
                        setSelectedCaseId(active ? null : caseItem.id);
                        setSelectedVesselId(null);
                      }}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        active
                          ? 'border-rose-200 bg-rose-50 ring-1 ring-rose-200'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-800">{caseItem.shipName}</span>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-black ${getSeverityClass(caseItem.severity)}`}>
                          {getSeverityLabel(caseItem.severity)}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] font-bold text-rose-500">{caseItem.violationType}</div>
                      <div className="mt-1 text-[10px] text-slate-400">{caseItem.location}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-between bg-white px-6 border-b border-slate-200 z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-black text-slate-800">全域执法态势</h2>
            <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { id: 'clues', label: '执法线索', icon: FileText },
                { id: 'planning', label: '抓捕规划', icon: Navigation }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPlanningModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-1.5 text-xs font-black text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
            >
              <Navigation size={14} /> 启动现场规划
            </button>
          </div>
        </header>

        {/* Map & Detail Split */}
        <div className="flex-1 min-h-0 relative flex">
          {/* Left: Map */}
          <div className="flex-1 relative">
            <RiskMacroTrend
              showToolbar={false}
              showTopRanking={false}
              showLegend={false}
            />
          </div>

          {/* 2) Right: Enforcement Clues (形成执法线索) */}
          <aside className="w-96 border-l border-slate-200 bg-white overflow-y-auto custom-scrollbar-light">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <SectionTitle title="执法线索证据链" icon={<History size={14} />} />
                <button className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-400">
                  <MoreVertical size={16} />
                </button>
              </div>

              {(selectedVessel || selectedCase) && (
                <>
                  {/* Vessel Info */}
                  <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">船舶信息</div>
                      <div className="text-xl font-black">{selectedCase?.shipName ?? selectedVessel?.name}</div>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[9px] text-white/30 uppercase">MMSI</div>
                          <div className="text-xs font-bold">{selectedCase?.mmsi ?? selectedVessel?.mmsi ?? '--'}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-white/30 uppercase">船型</div>
                          <div className="text-xs font-bold">{selectedVessel?.type || '待核验'}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-[10px] text-white/50">所属单位: 上海远洋运输集团</div>
                    </div>
                    <div className="absolute -right-8 -bottom-8 text-white/5 transform -rotate-12 transition-transform group-hover:scale-110">
                      <Navigation size={120} />
                    </div>
                  </div>

                  {/* Violation Table-like Details */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <AlertCircle size={12} className="text-rose-500" /> 违法事实甄别
                      </div>
                      <Panel className="p-4 space-y-4 border-rose-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[9px] font-black text-slate-400 uppercase">违法类型</div>
                            <div className="mt-1 text-sm font-black text-rose-600">{selectedCase?.violationType ?? selectedVessel?.risk}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] font-black text-slate-400 uppercase">发生时间</div>
                            <div className="mt-1 text-xs font-bold text-slate-700">
                              {selectedCase
                                ? new Date(selectedCase.timestamp).toLocaleString()
                                : selectedVessel?.time}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase">发生地点</div>
                          <div className="mt-1 text-xs font-bold text-slate-700">
                            {selectedCase?.location ?? selectedVessel?.snapshot.location}
                          </div>
                        </div>
                      </Panel>
                    </div>

                    <Panel className="border-sky-100 bg-sky-50/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sky-700">
                          <ShieldAlert size={12} />
                          执法方案生成
                        </div>
                        {selectedCase && (
                          <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${getSeverityClass(selectedCase.severity)}`}>
                            {getSeverityLabel(selectedCase.severity)}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {selectedCaseActions.map((action, index) => (
                          <div
                            key={`${action}-${index}`}
                            className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-[11px] font-bold text-sky-900"
                          >
                            <CheckCircle size={12} className="text-sky-500" />
                            {action}
                          </div>
                        ))}
                      </div>
                      {selectedCase && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => updateEnforcementStatus(selectedCase.id, 'in_progress')}
                            disabled={selectedCase.status === 'in_progress'}
                            className="flex-1 rounded-lg bg-amber-500/15 py-2 text-[10px] font-black text-amber-600 transition-all hover:bg-amber-500/25 disabled:opacity-45"
                          >
                            执行中
                          </button>
                          <button
                            onClick={() => updateEnforcementStatus(selectedCase.id, 'completed')}
                            disabled={selectedCase.status === 'completed'}
                            className="flex-1 rounded-lg bg-emerald-500/15 py-2 text-[10px] font-black text-emerald-600 transition-all hover:bg-emerald-500/25 disabled:opacity-45"
                          >
                            已完成
                          </button>
                          <button
                            onClick={() => removeEnforcementCase(selectedCase.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-500 transition-all hover:bg-rose-100 hover:text-rose-600"
                            title="删除案件"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </Panel>

                    {/* Evidence Chain */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">证据链详情</div>
                      
                      {/* Track Evidence */}
                      <div className="flex gap-4 group">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <Activity size={14} />
                          </div>
                          <div className="w-px flex-1 bg-slate-100 my-1" />
                        </div>
                        <div className="pb-4 flex-1">
                          <div className="text-[11px] font-bold text-slate-800">轨迹轨迹证据</div>
                          <div className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                            {selectedCase
                              ? '案件已建立待核验航迹证据，需关联 AIS 轨迹、速度变化和航向记录。'
                              : `历史航迹、实时速度(${selectedVessel?.speed}kn)、船首向(${selectedVessel?.heading}°)。航迹显示其多次试探禁航区边缘。`}
                          </div>
                        </div>
                      </div>

                      {/* VHF Evidence */}
                      <div className="flex gap-4 group">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                            <Volume2 size={14} />
                          </div>
                          <div className="w-px flex-1 bg-slate-100 my-1" />
                        </div>
                        <div className="pb-4 flex-1">
                          <div className="text-[11px] font-bold text-slate-800">通话语音证据</div>
                          <div className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                            已记录 3 条 VHF 通话记录。曾于 10:24 呼叫 VTS 谎报当前船位。
                          </div>
                          <button className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-sky-600 uppercase">
                            <Play size={10} fill="currentColor" /> 播放录音
                          </button>
                        </div>
                      </div>

                      {/* Alert Evidence */}
                      <div className="flex gap-4 group">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            <BellRing size={14} />
                          </div>
                          <div className="w-px flex-1 bg-slate-100 my-1" />
                        </div>
                        <div className="pb-4 flex-1">
                          <div className="text-[11px] font-bold text-slate-800">系统预警证据</div>
                          <div className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                            系统共触发 4 次预警。其中“{selectedCase?.violationType ?? selectedVessel?.risk}”预警等级为“紧急”。
                          </div>
                        </div>
                      </div>

                      {/* History Record */}
                      <div className="flex gap-4 group">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <History size={14} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-[11px] font-bold text-slate-800">历史违章记录</div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            该船在过去 30 天内有 2 次类似的违章记录。
                          </div>
                          <div className="mt-2 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[8px] font-black text-amber-700 uppercase border border-amber-200">
                            惯犯 / 高危
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenPlayback(selectedIndex)}
                      disabled={selectedCase !== null}
                      className="w-full flex items-center justify-center gap-3 rounded-xl bg-slate-900 py-3.5 text-xs font-black text-white shadow-xl transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play size={16} fill="currentColor" />
                      {selectedCase ? '人工案件待关联回放' : '立即复盘动态细节'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* 3) Planning Modal: 规划抓捕/执法路线 */}
      <AnimatePresence>
        {isPlanningModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlanningModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl h-[600px] overflow-hidden rounded-3xl bg-white shadow-2xl flex border border-slate-200"
            >
              {/* Left Side: Resource List */}
              <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50">
                <div className="p-6 border-b border-slate-100 bg-white">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">执法资源调度</div>
                  <div className="text-lg font-black text-slate-800">当前可用海巡艇</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {MOCK_PATROL_BOATS.map(pb => (
                    <div 
                      key={pb.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        pb.readiness === 'ready' 
                          ? 'border-white bg-white shadow-sm ring-1 ring-slate-100' 
                          : 'border-transparent opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-black text-slate-800">{pb.name}</div>
                        <div className={`h-2 w-2 rounded-full ${pb.readiness === 'ready' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400 font-bold">{pb.type}</div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-slate-100 p-1.5 text-center">
                          <div className="text-[8px] text-slate-400 uppercase font-black">距离</div>
                          <div className="text-xs font-black text-slate-700">2.5 nm</div>
                        </div>
                        <div className="rounded-lg bg-slate-100 p-1.5 text-center">
                          <div className="text-[8px] text-slate-400 uppercase font-black">航速</div>
                          <div className="text-xs font-black text-slate-700">{pb.speed} kn</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Center: Interactive Planning Area */}
              <div className="flex-1 flex flex-col">
                <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white">
                  <div className="flex items-center gap-2">
                    <Navigation size={18} className="text-rose-500" />
                    <span className="text-sm font-black text-slate-800">拦截路线规划详情</span>
                  </div>
                  <button onClick={() => setIsPlanningModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50">
                  <div className="max-w-xl mx-auto space-y-8">
                    {/* Target info card */}
                    <div className="flex items-center gap-6">
                      <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目标船舶</div>
                          <div className="px-2 py-0.5 rounded bg-rose-50 text-[9px] font-black text-rose-500 uppercase">拦截目标</div>
                        </div>
                        <div className="text-xl font-black text-slate-800">{selectedVessel?.name}</div>
                        <div className="mt-1 text-[10px] text-slate-400 font-bold">位置: {selectedVessel?.snapshot.location}</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <ArrowRight size={24} className="text-slate-200" />
                      </div>
                      <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">推荐海巡艇</div>
                          <div className="px-2 py-0.5 rounded bg-sky-50 text-[9px] font-black text-sky-500 uppercase">最快到达</div>
                        </div>
                        <div className="text-xl font-black text-slate-800">{nearestPatrolBoat?.name}</div>
                        <div className="mt-1 text-[10px] text-slate-400 font-bold">位置: {nearestPatrolBoat?.destination}</div>
                      </div>
                    </div>

                    {/* Planning stats */}
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: '预计航程', value: planningData?.distance + ' nm', icon: Activity },
                        { label: '预计到达时间', value: planningData?.eta + ' min', icon: Clock },
                        { label: '任务匹配度', value: planningData?.suitability, icon: CheckCircle2 }
                      ].map(item => (
                        <div key={item.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 mb-3">
                            <item.icon size={20} />
                          </div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{item.label}</div>
                          <div className="text-lg font-black text-slate-800">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendation */}
                    <div className="rounded-2xl bg-sky-50 p-6 border border-sky-100">
                      <div className="flex items-center gap-3 text-sky-600 mb-3">
                        <Info size={18} />
                        <span className="text-sm font-black">执法方案建议</span>
                      </div>
                      <p className="text-sm text-sky-800 leading-relaxed font-medium">
                        综合目标航速与当前水域交通密度，系统分析认为 <span className="font-bold underline">海巡 01</span> 具备最佳拦截条件。
                        {planningData?.recommendation}。
                      </p>
                      <div className="mt-4 flex gap-3">
                        <div className="flex-1 flex items-center gap-2 rounded-lg bg-white/60 p-3 text-[10px] font-bold text-sky-700">
                          <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                          建议 VHF 16 频道通知其接受处理
                        </div>
                        <div className="flex-1 flex items-center gap-2 rounded-lg bg-white/60 p-3 text-[10px] font-bold text-sky-700">
                          <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                          预备靠泊后登船检查
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button className="flex-1 bg-rose-500 py-4 rounded-2xl text-white font-black text-sm shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95">
                        确认发布执法指令
                      </button>
                      <button onClick={() => setIsPlanningModalOpen(false)} className="px-8 bg-slate-100 py-4 rounded-2xl text-slate-500 font-black text-sm hover:bg-slate-200 transition-all">
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
