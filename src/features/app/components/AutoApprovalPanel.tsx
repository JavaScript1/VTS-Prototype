/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 自动审批策略面板
 * 对应需求文档 1.2: 自动模式下的审批策略管理
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, CheckCircle, XCircle, Eye, Zap, 
  Settings, ToggleLeft, ToggleRight
} from 'lucide-react';
import { 
  MOCK_APPROVAL_RULES, MOCK_DUTY_STATUS,
  type AutoApprovalRule, type ApprovalRuleType 
} from '../utils/dutyModeData';

const getActionConfig = (action: ApprovalRuleType) => {
  switch (action) {
    case 'auto_approve': return { label: '自动批准', color: 'emerald', icon: CheckCircle };
    case 'auto_reject': return { label: '自动拒绝', color: 'rose', icon: XCircle };
    case 'require_review': return { label: '人工审核', color: 'amber', icon: Eye };
  }
};

export default function AutoApprovalPanel() {
  const [rules, setRules] = useState<AutoApprovalRule[]>(MOCK_APPROVAL_RULES);
  const status = MOCK_DUTY_STATUS;

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-violet-50 rounded-lg text-violet-600">
            <Shield size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            自动审批策略
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 text-[10px] font-black text-violet-600 border border-violet-100">
          <Settings size={10} />
          {rules.filter(r => r.enabled).length}/{rules.length} 启用
        </div>
      </div>

      {/* 运行统计 */}
      <div className="rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 p-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-black text-violet-600">{status.autoApprovals}</div>
            <div className="text-[8px] font-bold text-violet-500">自动批准</div>
          </div>
          <div>
            <div className="text-lg font-black text-amber-600">{status.pendingReviews}</div>
            <div className="text-[8px] font-bold text-amber-500">待审核</div>
          </div>
          <div>
            <div className="text-lg font-black text-blue-600">{status.humanOverrides}</div>
            <div className="text-[8px] font-bold text-blue-500">人工干预</div>
          </div>
          <div>
            <div className="text-lg font-black text-emerald-600">{status.aiLoad}%</div>
            <div className="text-[8px] font-bold text-emerald-500">AI负载</div>
          </div>
        </div>
      </div>

      {/* 规则列表 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center justify-between">
          <span>审批规则 (按优先级排序)</span>
          <button className="text-[9px] font-bold text-violet-500 hover:text-violet-700">+ 新建规则</button>
        </div>
        {rules.sort((a, b) => b.priority - a.priority).map((rule) => {
          const actionConfig = getActionConfig(rule.action);
          const ActionIcon = actionConfig.icon;

          return (
            <motion.div
              key={rule.id}
              whileHover={{ x: 2 }}
              className={`rounded-xl border p-3 transition-all ${
                rule.enabled ? 'border-slate-100 bg-white' : 'border-slate-50 bg-slate-50/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-800">{rule.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black bg-${actionConfig.color}-50 text-${actionConfig.color}-600 flex items-center gap-0.5`}>
                      <ActionIcon size={8} />
                      {actionConfig.label}
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">{rule.description}</p>
                </div>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="shrink-0 ml-2"
                >
                  {rule.enabled ? (
                    <ToggleRight size={20} className="text-violet-500" />
                  ) : (
                    <ToggleLeft size={20} className="text-slate-300" />
                  )}
                </button>
              </div>

              {/* 条件列表 */}
              <div className="mt-2 flex flex-wrap gap-1">
                {rule.conditions.map((cond, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-600">
                    {cond}
                  </span>
                ))}
              </div>

              {/* 底部统计 */}
              <div className="mt-2 flex items-center justify-between text-[8px] font-bold text-slate-400">
                <span>优先级: P{rule.priority}</span>
                <span className="flex items-center gap-1">
                  <Zap size={8} className="text-violet-400" />
                  今日触发 {rule.triggerCount} 次
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
