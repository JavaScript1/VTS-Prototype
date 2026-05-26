/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AI搜救方案智能生成面板
 * 对应需求文档 3.3: 搜救方案智能生成
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Clock, CheckCircle, AlertTriangle, 
  Radio, Ship, ChevronDown, Zap, Users, Target
} from 'lucide-react';
import { MOCK_RESCUE_PLAN, type RescuePlan, type RescuePhase } from './emergencyData';

const getPhaseConfig = (phase: RescuePhase) => {
  switch (phase) {
    case 'alert': return { label: '警戒阶段', color: 'amber' };
    case 'uncertainty': return { label: '不确定阶段', color: 'orange' };
    case 'distress': return { label: '遇险阶段', color: 'rose' };
    case 'sar_operation': return { label: '搜救作业', color: 'blue' };
    case 'resolved': return { label: '已解决', color: 'emerald' };
  }
};

const getActionStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return <CheckCircle size={12} className="text-emerald-500" />;
    case 'in_progress': return <Clock size={12} className="text-blue-500 animate-pulse" />;
    default: return <AlertTriangle size={12} className="text-slate-300" />;
  }
};

export default function RescuePlanPanel() {
  const [plan] = useState<RescuePlan>(MOCK_RESCUE_PLAN);
  const [showComms, setShowComms] = useState(false);
  const phaseConfig = getPhaseConfig(plan.phase);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
            <Shield size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            AI搜救方案
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-${phaseConfig.color}-50 text-[10px] font-black text-${phaseConfig.color}-600 border border-${phaseConfig.color}-100`}>
          <Zap size={10} />
          置信度 {plan.aiConfidence}%
        </div>
      </div>

      {/* 方案摘要 */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-800">{plan.title}</span>
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black bg-${phaseConfig.color}-100 text-${phaseConfig.color}-700`}>
            {phaseConfig.label}
          </span>
        </div>
        <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
          {plan.summary}
        </p>
        <div className="mt-3 flex items-center gap-4 text-[9px] font-bold text-slate-500">
          <span>生成时间: {plan.generatedAt.split(' ')[1]}</span>
          <span>预计解决: {plan.estimatedResolutionTime}min</span>
        </div>
      </div>

      {/* 行动清单 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <Target size={10} />
          应急行动清单
        </div>
        <div className="space-y-1.5">
          {plan.actions.map((action) => (
            <motion.div
              key={action.id}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border transition-all ${
                action.status === 'completed' ? 'bg-emerald-50/50 border-emerald-100' :
                action.status === 'in_progress' ? 'bg-blue-50/50 border-blue-100' :
                'bg-white border-slate-100'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {getActionStatusIcon(action.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">P{action.priority}</span>
                  <span className={`text-[10px] font-bold ${action.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {action.action}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-slate-400">
                  <span>{action.responsible}</span>
                  <span>· {action.deadline}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 救援资源 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <Ship size={10} />
          调派资源
        </div>
        <div className="grid grid-cols-2 gap-2">
          {plan.resources.map((resource) => (
            <div key={resource.id} className={`rounded-xl border p-3 ${
              resource.status === 'en_route' ? 'bg-blue-50 border-blue-100' :
              resource.status === 'on_scene' ? 'bg-emerald-50 border-emerald-100' :
              resource.status === 'dispatched' ? 'bg-amber-50 border-amber-100' :
              'bg-slate-50 border-slate-100'
            }`}>
              <div className="text-[10px] font-black text-slate-800">{resource.name}</div>
              <div className="text-[9px] font-bold text-slate-500 mt-0.5">{resource.capability}</div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                  resource.status === 'en_route' ? 'bg-blue-100 text-blue-600' :
                  resource.status === 'dispatched' ? 'bg-amber-100 text-amber-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {resource.status === 'en_route' ? '在途' :
                   resource.status === 'dispatched' ? '已派遣' :
                   resource.status === 'on_scene' ? '到场' : '待命'}
                </span>
                <span className="text-[9px] font-black text-slate-600">ETA {resource.eta}min</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 通信方案 */}
      <div className="space-y-2">
        <button
          onClick={() => setShowComms(!showComms)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <Radio size={10} />
            通信方案 ({plan.communicationPlan.length})
          </div>
          <ChevronDown size={12} className={`text-slate-400 transition-transform ${showComms ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showComms && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-1.5"
            >
              {plan.communicationPlan.map((step, i) => (
                <div key={i} className={`rounded-lg border px-3 py-2 ${
                  step.priority === 'immediate' ? 'border-rose-200 bg-rose-50' :
                  step.priority === 'urgent' ? 'border-amber-200 bg-amber-50' :
                  'border-slate-100 bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                      step.priority === 'immediate' ? 'bg-rose-100 text-rose-600' :
                      step.priority === 'urgent' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {step.priority === 'immediate' ? '立即' : step.priority === 'urgent' ? '紧急' : '常规'}
                    </span>
                    <span className="text-[9px] font-black text-slate-600">{step.channel}</span>
                    <span className="text-[9px] font-bold text-slate-400">→ {step.target}</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-600 leading-relaxed italic">
                    "{step.message}"
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 天气窗口 */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={12} className="text-amber-600" />
          <span className="text-[10px] font-black text-amber-700">气象窗口提醒</span>
        </div>
        <p className="text-[9px] font-bold text-amber-600 leading-relaxed">
          {plan.weatherWindow}
        </p>
      </div>
    </div>
  );
}
