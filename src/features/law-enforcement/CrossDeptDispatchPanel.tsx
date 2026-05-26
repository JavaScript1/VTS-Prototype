/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 跨部门协同派单面板
 * 对应需求文档 5.2: 跨部门协同派单
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Send, Users, Clock, CheckCircle, AlertTriangle,
  ArrowRight, Shield
} from 'lucide-react';
import { 
  MOCK_DISPATCHES, DEPARTMENT_CONFIG,
  type DispatchOrder, type DispatchStatus 
} from './lawEnforcementData';

const getDispatchStatusConfig = (status: DispatchStatus) => {
  switch (status) {
    case 'pending': return { label: '待接收', color: 'amber', icon: Clock };
    case 'accepted': return { label: '已接收', color: 'blue', icon: CheckCircle };
    case 'in_progress': return { label: '执行中', color: 'indigo', icon: Shield };
    case 'completed': return { label: '已完成', color: 'emerald', icon: CheckCircle };
    case 'rejected': return { label: '已退回', color: 'rose', icon: AlertTriangle };
  }
};

export default function CrossDeptDispatchPanel() {
  const [dispatches] = useState<DispatchOrder[]>(MOCK_DISPATCHES);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-violet-50 rounded-lg text-violet-600">
            <Send size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            跨部门协同派单
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 text-[10px] font-black text-violet-600 border border-violet-100">
          <Users size={10} />
          {dispatches.length} 工单
        </div>
      </div>

      {/* 部门协同网络 */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">协同部门网络</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(DEPARTMENT_CONFIG).map(([key, config]) => {
            const hasActive = dispatches.some(d => d.toDepartment === key && d.status !== 'completed');
            return (
              <div key={key} className={`px-3 py-1.5 rounded-lg border text-[9px] font-black ${
                hasActive 
                  ? `bg-${config.color}-500/20 border-${config.color}-500/40 text-${config.color}-300` 
                  : 'bg-slate-700/50 border-slate-600 text-slate-500'
              }`}>
                {config.label}
                {hasActive && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 派单列表 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
          活跃工单
        </div>
        {dispatches.map((dispatch) => {
          const statusConfig = getDispatchStatusConfig(dispatch.status);
          const StatusIcon = statusConfig.icon;
          const fromDept = DEPARTMENT_CONFIG[dispatch.fromDepartment];
          const toDept = DEPARTMENT_CONFIG[dispatch.toDepartment];

          return (
            <motion.div
              key={dispatch.id}
              whileHover={{ x: 2 }}
              className={`rounded-xl border p-3 transition-all ${
                dispatch.priority === 'urgent' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 bg-white'
              }`}
            >
              {/* 标题行 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-800">{dispatch.title}</span>
                    {dispatch.priority === 'urgent' && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-100 text-rose-600">紧急</span>
                    )}
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-${statusConfig.color}-50 text-${statusConfig.color}-600`}>
                  <StatusIcon size={8} />
                  {statusConfig.label}
                </div>
              </div>

              {/* 部门流转 */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black bg-${fromDept.color}-50 text-${fromDept.color}-600`}>
                  {fromDept.label}
                </span>
                <ArrowRight size={10} className="text-slate-300" />
                <span className={`px-2 py-0.5 rounded text-[8px] font-black bg-${toDept.color}-50 text-${toDept.color}-600`}>
                  {toDept.label}
                </span>
                {dispatch.assignee && (
                  <span className="text-[8px] font-bold text-slate-400 ml-auto">
                    {dispatch.assignee}
                  </span>
                )}
              </div>

              {/* 描述 */}
              <p className="text-[9px] font-bold text-slate-500 leading-relaxed">{dispatch.description}</p>

              {/* 备注 */}
              {dispatch.notes && (
                <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 px-2 py-1">
                  <p className="text-[8px] font-bold text-blue-600">{dispatch.notes}</p>
                </div>
              )}

              {/* 时间信息 */}
              <div className="mt-2 flex items-center justify-between text-[8px] font-bold text-slate-400">
                <span>创建: {dispatch.createdAt.split(' ')[1]}</span>
                <span>截止: {dispatch.deadline.split(' ')[1]}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 新建派单按钮 */}
      <button className="w-full py-3 rounded-xl bg-violet-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-violet-600 transition-colors flex items-center justify-center gap-2">
        <Send size={12} />
        新建跨部门派单
      </button>
    </div>
  );
}
