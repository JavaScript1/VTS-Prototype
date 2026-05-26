/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 主动风险场模型面板
 * 对应需求文档 4.1: 主动风险场模型
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, AlertTriangle, TrendingUp, TrendingDown, 
  Minus, Clock, MapPin, Zap, Shield
} from 'lucide-react';
import { MOCK_RISK_FIELD, type RiskFieldSnapshot, type RiskFieldLevel } from './riskEnhancedData';

const getLevelConfig = (level: RiskFieldLevel) => {
  switch (level) {
    case 'extreme': return { label: '极高', color: 'rose', bg: 'bg-rose-500' };
    case 'high': return { label: '高', color: 'orange', bg: 'bg-orange-500' };
    case 'moderate': return { label: '中等', color: 'amber', bg: 'bg-amber-500' };
    case 'low': return { label: '低', color: 'emerald', bg: 'bg-emerald-500' };
    case 'safe': return { label: '安全', color: 'sky', bg: 'bg-sky-500' };
  }
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'rising': return <TrendingUp size={10} className="text-rose-500" />;
    case 'falling': return <TrendingDown size={10} className="text-emerald-500" />;
    default: return <Minus size={10} className="text-slate-400" />;
  }
};

export default function RiskFieldPanel() {
  const [field] = useState<RiskFieldSnapshot>(MOCK_RISK_FIELD);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
            <Activity size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            主动风险场模型
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 text-[10px] font-black text-orange-600 border border-orange-100">
          <Zap size={10} />
          实时计算
        </div>
      </div>

      {/* 全局风险指数 */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">辖区综合风险指数</span>
          <span className="text-[9px] font-bold text-slate-500">{field.timestamp.split(' ')[1]}</span>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-5xl font-black text-amber-400">{field.overallRiskIndex}</div>
          <div className="pb-2">
            <div className="text-[10px] font-bold text-slate-400">/100</div>
            <div className="flex items-center gap-1 text-amber-400 text-[10px] font-black mt-1">
              <TrendingUp size={12} />
              上升趋势
            </div>
          </div>
        </div>
        <div className="mt-3 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${field.overallRiskIndex}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
          />
        </div>
        <div className="flex justify-between mt-1 text-[8px] font-bold text-slate-500">
          <span>安全</span>
          <span>中等</span>
          <span>高风险</span>
          <span>极高</span>
        </div>
      </div>

      {/* 热点区域 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <MapPin size={10} />
          风险热点区域
        </div>
        <div className="space-y-2">
          {field.hotspots.map((hotspot) => (
            <motion.div
              key={hotspot.id}
              whileHover={{ x: 2 }}
              className={`rounded-xl border p-3 transition-all ${
                hotspot.riskScore > 70 ? 'border-rose-200 bg-rose-50/50' :
                hotspot.riskScore > 50 ? 'border-amber-200 bg-amber-50/50' :
                'border-slate-100 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    hotspot.riskScore > 70 ? 'bg-rose-500' :
                    hotspot.riskScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  } ${hotspot.trend === 'rising' ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black text-slate-800">{hotspot.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(hotspot.trend)}
                  <span className={`text-xs font-black ${
                    hotspot.riskScore > 70 ? 'text-rose-600' :
                    hotspot.riskScore > 50 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>{hotspot.riskScore}</span>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[9px] font-bold text-slate-500">
                <span>{hotspot.topRisk}</span>
                <span>{hotspot.vesselCount}艘船</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 黑航段 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle size={10} />
          黑航段识别
        </div>
        <div className="space-y-2">
          {field.blackSegments.map((segment) => (
            <div key={segment.id} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-slate-800">{segment.name}</span>
                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  风险 {segment.riskScore}
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-500">{segment.description}</p>
              <div className="mt-1.5 text-[8px] font-bold text-slate-400">
                历史事故: {segment.incidentHistory} 起
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 黑时段 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <Clock size={10} />
          黑时段预警
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {field.blackPeriods.map((period) => (
            <div key={period.id} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-700 font-mono">{period.timeRange}</span>
                <span className="text-[9px] font-bold text-slate-500">{period.reason}</span>
              </div>
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                period.riskMultiplier > 1.5 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
              }`}>
                x{period.riskMultiplier}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 风险场网格状态 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <Shield size={10} />
          风险场网格
        </div>
        <div className="space-y-1.5">
          {field.cells.map((cell) => {
            const levelConfig = getLevelConfig(cell.level);
            return (
              <div key={cell.id} className="rounded-xl border border-slate-100 bg-white p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${levelConfig.bg}`} />
                    <span className={`text-[9px] font-black text-${levelConfig.color}-600`}>{levelConfig.label}风险</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(cell.predictedTrend)}
                    <span className="text-xs font-black text-slate-700">{cell.score}/100</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {cell.factors.map((factor, i) => (
                    <div key={i} className="text-center">
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-0.5">
                        <div className={`h-full rounded-full ${
                          factor.value > 70 ? 'bg-rose-400' : factor.value > 40 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} style={{ width: `${factor.value}%` }} />
                      </div>
                      <span className="text-[7px] font-bold text-slate-400">{factor.type.split('_')[0]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 text-[8px] font-bold text-slate-400">
                  预计 {cell.timeToNextLevel}min 后风险等级变化
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
