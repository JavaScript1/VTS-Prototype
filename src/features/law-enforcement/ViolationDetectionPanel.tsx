/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 违章AI识别引擎面板
 * 对应需求文档 5.1: 违章AI识别
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, AlertTriangle, ChevronDown, Shield, Lock,
  Activity, CheckCircle, Clock, Send
} from 'lucide-react';
import { 
  MOCK_VIOLATIONS, VIOLATION_TYPE_CONFIG, 
  type ViolationRecord, type ViolationStatus 
} from './lawEnforcementData';

const getStatusConfig = (status: ViolationStatus) => {
  switch (status) {
    case 'detected': return { label: 'AI检测', color: 'amber', icon: Eye };
    case 'confirmed': return { label: '已确认', color: 'blue', icon: CheckCircle };
    case 'dispatched': return { label: '已派单', color: 'indigo', icon: Send };
    case 'closed': return { label: '已结案', color: 'emerald', icon: Shield };
  }
};

export default function ViolationDetectionPanel() {
  const [violations] = useState<ViolationRecord[]>(MOCK_VIOLATIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Eye size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            违章AI识别引擎
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600 border border-indigo-100">
          <Activity size={10} className="animate-pulse" />
          实时监测
        </div>
      </div>

      {/* 统计条 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 text-center">
          <div className="text-lg font-black text-amber-600">{violations.filter(v => v.status === 'detected').length}</div>
          <div className="text-[8px] font-bold text-amber-500">待确认</div>
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-2 text-center">
          <div className="text-lg font-black text-blue-600">{violations.filter(v => v.status === 'confirmed' || v.status === 'dispatched').length}</div>
          <div className="text-[8px] font-bold text-blue-500">处理中</div>
        </div>
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-center">
          <div className="text-lg font-black text-emerald-600">{violations.filter(v => v.status === 'closed').length}</div>
          <div className="text-[8px] font-bold text-emerald-500">已结案</div>
        </div>
      </div>

      {/* 违章记录列表 */}
      <div className="space-y-2">
        {violations.map((violation) => {
          const typeConfig = VIOLATION_TYPE_CONFIG[violation.type];
          const statusConfig = getStatusConfig(violation.status);
          const StatusIcon = statusConfig.icon;
          const isExpanded = expandedId === violation.id;

          return (
            <motion.div
              key={violation.id}
              className="rounded-xl border border-slate-100 bg-white overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : violation.id)}
                className="w-full text-left p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 p-1 rounded-md bg-${typeConfig.color}-50`}>
                      <AlertTriangle size={10} className={`text-${typeConfig.color}-500`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-800">{violation.vesselName}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black bg-${typeConfig.color}-50 text-${typeConfig.color}-600`}>
                          {typeConfig.label}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 mt-0.5">{violation.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-${statusConfig.color}-50 text-${statusConfig.color}-600`}>
                      <StatusIcon size={8} />
                      {statusConfig.label}
                    </div>
                    <ChevronDown size={12} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* AI置信度 */}
                <div className="flex items-center gap-3 mt-2 pl-7">
                  <span className="text-[8px] font-bold text-slate-400">AI置信度:</span>
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                    <div className="h-full rounded-full bg-indigo-400" style={{ width: `${violation.aiConfidence}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-indigo-600">{violation.aiConfidence}%</span>
                  <span className="text-[8px] font-bold text-slate-400 ml-auto">{violation.detectedAt.split(' ')[1]}</span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2">
                      {/* 法规依据 */}
                      <div className="rounded-lg bg-slate-50 border border-slate-100 p-2">
                        <div className="text-[9px] font-black text-slate-600 mb-0.5">法规依据</div>
                        <p className="text-[9px] font-bold text-slate-500">{violation.regulation}</p>
                      </div>

                      {/* 证据链 */}
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-slate-600 flex items-center gap-1">
                          <Lock size={9} className="text-indigo-500" />
                          证据链 ({violation.evidence.length} 项)
                        </div>
                        {violation.evidence.map((ev) => (
                          <div key={ev.id} className="flex items-start gap-2 rounded-lg bg-white border border-slate-100 px-2 py-1.5">
                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full ${ev.verified ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-slate-600">{ev.source}</span>
                                <span className="text-[8px] font-bold text-slate-400">{ev.timestamp}</span>
                                {ev.hash && (
                                  <span className="text-[7px] font-mono text-indigo-400 bg-indigo-50 px-1 py-0.5 rounded">
                                    {ev.hash}
                                  </span>
                                )}
                              </div>
                              <p className="text-[8px] font-bold text-slate-500">{ev.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 处罚结果 */}
                      {violation.penalty && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2">
                          <div className="text-[9px] font-black text-emerald-700">处罚结果: {violation.penalty}</div>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex gap-2 pt-1">
                        {violation.status === 'detected' && (
                          <button className="flex-1 py-1.5 rounded-lg bg-blue-500 text-white text-[9px] font-black text-center">
                            确认违章
                          </button>
                        )}
                        {violation.status === 'confirmed' && (
                          <button className="flex-1 py-1.5 rounded-lg bg-indigo-500 text-white text-[9px] font-black text-center">
                            跨部门派单
                          </button>
                        )}
                        <button className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black text-center">
                          生成卷宗
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
