/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 值班模式状态面板
 * 对应需求文档 1.3: 模式切换与运行状态监控
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, Sparkles, LayoutGrid, Activity, Clock,
  User, Zap, Radio, Shield, TrendingUp
} from 'lucide-react';
import { MOCK_DUTY_STATUS, type DutyModeStatus } from '../utils/dutyModeData';

const MODE_CONFIG = {
  normal: { label: '标准模式', icon: LayoutGrid, color: 'slate', description: '人工主导，AI仅提供信息展示' },
  'smart-duty': { label: '辅助模式', icon: Sparkles, color: 'blue', description: 'AI辅助分析+人工决策审批' },
  auto: { label: '自动模式', icon: Bot, color: 'violet', description: 'AI全自动执行+人工监督干预' },
};

export default function DutyModeStatusPanel() {
  const [status] = useState<DutyModeStatus>(MOCK_DUTY_STATUS);
  const modeConfig = MODE_CONFIG[status.mode];
  const ModeIcon = modeConfig.icon;

  return (
    <div className="space-y-4">
      {/* 当前模式卡片 */}
      <div className={`rounded-2xl bg-gradient-to-br from-${modeConfig.color}-500 to-${modeConfig.color}-700 p-4 text-white shadow-lg`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/20">
              <ModeIcon size={18} />
            </div>
            <div>
              <div className="text-sm font-black">{modeConfig.label}</div>
              <div className="text-[10px] font-bold text-white/70">{modeConfig.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-[9px] font-black">
            <Activity size={10} className="animate-pulse" />
            运行中
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/10 p-2.5">
            <div className="flex items-center gap-1.5 text-white/60 text-[8px] font-bold">
              <Clock size={9} />
              运行时长
            </div>
            <div className="text-lg font-black mt-0.5">
              {(() => {
                const [h, m] = status.activeSince.split(':').map(Number);
                const now = new Date();
                const diff = now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
                return `${Math.floor(diff / 60)}h ${diff % 60}m`;
              })()}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-2.5">
            <div className="flex items-center gap-1.5 text-white/60 text-[8px] font-bold">
              <User size={9} />
              值班员
            </div>
            <div className="text-sm font-black mt-0.5">{status.operator}</div>
          </div>
        </div>
      </div>

      {/* 运行指标 */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'AI负载', value: `${status.aiLoad}%`, icon: TrendingUp, color: 'violet' },
          { label: 'VHF处理', value: status.vhfProcessed.toString(), icon: Radio, color: 'sky' },
          { label: '自动审批', value: status.autoApprovals.toString(), icon: Shield, color: 'emerald' },
          { label: '人工干预', value: status.humanOverrides.toString(), icon: Zap, color: 'amber' },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-xl border border-${metric.color}-100 bg-${metric.color}-50/50 p-3`}>
            <div className="flex items-center justify-between">
              <metric.icon size={14} className={`text-${metric.color}-500`} />
              <span className={`text-xl font-black text-${metric.color}-600`}>{metric.value}</span>
            </div>
            <div className={`text-[9px] font-bold text-${metric.color}-500 mt-1`}>{metric.label}</div>
          </div>
        ))}
      </div>

      {/* 模式切换按钮组 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider">快速切换</div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(MODE_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = status.mode === key;
            return (
              <button
                key={key}
                className={`rounded-xl border p-3 text-center transition-all ${
                  isActive
                    ? `border-${config.color}-200 bg-${config.color}-50 ring-1 ring-${config.color}-200`
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <Icon size={16} className={`mx-auto ${isActive ? `text-${config.color}-600` : 'text-slate-400'}`} />
                <div className={`text-[8px] font-black mt-1 ${isActive ? `text-${config.color}-600` : 'text-slate-500'}`}>
                  {config.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
