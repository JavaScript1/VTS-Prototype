/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 船-港-引-拖 四方协同排班面板
 * 对应需求文档 2.2: 协同排班
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Anchor, Ship, Clock, CheckCircle, AlertTriangle, 
  ChevronDown, Zap, Navigation, ArrowRight
} from 'lucide-react';
import { MOCK_COLLABORATIVE_SCHEDULE, type CollaborativeScheduleItem, type ScheduleStatus } from './portNavData';

const getScheduleStatusConfig = (status: ScheduleStatus) => {
  switch (status) {
    case 'confirmed': return { label: '已确认', color: 'emerald', icon: CheckCircle };
    case 'tentative': return { label: '暂定', color: 'amber', icon: Clock };
    case 'conflict': return { label: '冲突', color: 'rose', icon: AlertTriangle };
    case 'auto_optimized': return { label: 'AI优化', color: 'violet', icon: Zap };
  }
};

const getResourceTypeConfig = (type: string) => {
  switch (type) {
    case 'pilot': return { label: '引航', icon: Navigation, color: 'blue' };
    case 'tugboat': return { label: '拖轮', icon: Ship, color: 'sky' };
    case 'berth': return { label: '泊位', icon: Anchor, color: 'emerald' };
    case 'crane': return { label: '岸桥', icon: Users, color: 'orange' };
    default: return { label: type, icon: Ship, color: 'slate' };
  }
};

const getResourceStatusColor = (status: string) => {
  switch (status) {
    case 'assigned': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'en_route': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'standby': return 'bg-slate-50 text-slate-500 border-slate-100';
    case 'unavailable': return 'bg-rose-50 text-rose-600 border-rose-100';
    default: return 'bg-slate-50 text-slate-500 border-slate-100';
  }
};

export default function CollaborativeSchedulePanel() {
  const [expandedId, setExpandedId] = useState<string | null>('sched-001');
  const schedule = MOCK_COLLABORATIVE_SCHEDULE;

  const totalTimeSaved = schedule.reduce((sum, item) => sum + item.waitTimeSaved, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Users size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            船-港-引-拖 协同排班
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600 border border-emerald-100">
          <Clock size={10} />
          节省 {totalTimeSaved} min
        </div>
      </div>

      {/* 协同状态总览 */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {[
              { label: '引航站', status: '在线', color: 'emerald' },
              { label: '拖轮公司', status: '在线', color: 'emerald' },
              { label: '码头中控', status: '在线', color: 'emerald' },
              { label: '船代', status: '在线', color: 'emerald' },
            ].map((node, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full bg-${node.color}-500 animate-pulse`} />
                <span className="text-[9px] font-black text-slate-600">{node.label}</span>
              </div>
            ))}
          </div>
          <div className="text-[9px] font-bold text-indigo-500">
            四方数据实时同步
          </div>
        </div>
      </div>

      {/* 排班列表 */}
      <div className="space-y-3">
        {schedule.map((item) => {
          const config = getScheduleStatusConfig(item.status);
          const StatusIcon = config.icon;
          const isExpanded = expandedId === item.id;

          return (
            <motion.div
              key={item.id}
              layout
              className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                item.status === 'auto_optimized' ? 'border-violet-200' :
                item.status === 'conflict' ? 'border-rose-200' : 'border-slate-100'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-${config.color}-50 text-${config.color}-600`}>
                      <StatusIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">{item.shipName}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                        预计到港: {item.predictedETA.split(' ')[1]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-black bg-${config.color}-50 text-${config.color}-600 border border-${config.color}-100`}>
                      {config.label}
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* 时间轴简览 */}
                <div className="mt-3 flex items-center gap-2 text-[9px] font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">引航 {item.pilotBoardingTime}</span>
                  <ArrowRight size={10} className="text-slate-300" />
                  <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-600">拖轮 {item.tugReadyTime}</span>
                  <ArrowRight size={10} className="text-slate-300" />
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">泊位 {item.berthAvailableTime}</span>
                  <ArrowRight size={10} className="text-slate-300" />
                  <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600">岸桥 {item.craneReadyTime}</span>
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
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
                      {/* 优化说明 */}
                      {item.optimizationNote && (
                        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 flex gap-2">
                          <Zap size={12} className="shrink-0 text-violet-500 mt-0.5" />
                          <p className="text-[10px] font-bold text-violet-700 leading-relaxed">
                            {item.optimizationNote}
                          </p>
                        </div>
                      )}

                      {/* 资源分配详情 */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                          资源分配详情
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {item.resources.map((resource, i) => {
                            const resConfig = getResourceTypeConfig(resource.type);
                            const ResIcon = resConfig.icon;
                            return (
                              <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <ResIcon size={12} className={`text-${resConfig.color}-500`} />
                                  <span className="text-[9px] font-bold text-slate-400 w-8">{resConfig.label}</span>
                                  <span className="text-[10px] font-black text-slate-700">{resource.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {resource.eta && (
                                    <span className="text-[9px] font-bold text-slate-400">ETA {resource.eta}</span>
                                  )}
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${getResourceStatusColor(resource.status)}`}>
                                    {resource.status === 'assigned' ? '已派遣' :
                                     resource.status === 'en_route' ? '在途' :
                                     resource.status === 'standby' ? '待命' : '不可用'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 节省时间 */}
                      <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                        <span className="text-[10px] font-bold text-emerald-700">AI协同优化节省等待时间</span>
                        <span className="text-sm font-black text-emerald-600">{item.waitTimeSaved} 分钟</span>
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
