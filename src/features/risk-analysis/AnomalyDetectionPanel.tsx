/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 异常行为AI识别面板
 * 对应需求文档 4.3: 异常行为AI识别
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, AlertTriangle, ChevronDown, Zap, Activity, 
  Shield, Radio, Radar
} from 'lucide-react';
import { MOCK_ANOMALIES, type VesselAnomaly, type AnomalyType } from './riskEnhancedData';

const getAnomalyConfig = (type: AnomalyType) => {
  switch (type) {
    case 'deviation': return { label: '偏航', color: 'orange' };
    case 'speed_anomaly': return { label: '超速', color: 'amber' };
    case 'ais_manipulation': return { label: 'AIS篡改', color: 'rose' };
    case 'loitering': return { label: '徘徊', color: 'violet' };
    case 'dark_vessel': return { label: '暗船', color: 'slate' };
    case 'unsafe_overtaking': return { label: '不安全追越', color: 'red' };
  }
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'critical': return { label: '危急', color: 'rose' };
    case 'high': return { label: '高', color: 'orange' };
    case 'medium': return { label: '中', color: 'amber' };
    default: return { label: '低', color: 'slate' };
  }
};

export default function AnomalyDetectionPanel() {
  const [anomalies] = useState<VesselAnomaly[]>(MOCK_ANOMALIES);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
            <Eye size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            异常行为AI识别
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 text-[10px] font-black text-rose-600 border border-rose-100">
          <Activity size={10} className="animate-pulse" />
          {anomalies.length} 异常
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: '偏航', count: anomalies.filter(a => a.type === 'deviation').length, color: 'orange' },
          { label: '超速', count: anomalies.filter(a => a.type === 'speed_anomaly').length, color: 'amber' },
          { label: '暗船', count: anomalies.filter(a => a.type === 'dark_vessel').length, color: 'slate' },
          { label: '追越', count: anomalies.filter(a => a.type === 'unsafe_overtaking').length, color: 'red' },
        ].map((item, i) => (
          <div key={i} className={`rounded-lg bg-${item.color}-50 border border-${item.color}-100 p-2 text-center`}>
            <div className={`text-lg font-black text-${item.color}-600`}>{item.count}</div>
            <div className={`text-[8px] font-bold text-${item.color}-500`}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* 异常事件列表 */}
      <div className="space-y-2">
        {anomalies.map((anomaly) => {
          const typeConfig = getAnomalyConfig(anomaly.type);
          const severityConfig = getSeverityConfig(anomaly.severity);
          const isExpanded = expandedId === anomaly.id;

          return (
            <motion.div
              key={anomaly.id}
              className={`rounded-xl border transition-all ${
                anomaly.severity === 'critical' || anomaly.severity === 'high'
                  ? 'border-rose-200 bg-rose-50/30'
                  : 'border-slate-100 bg-white'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : anomaly.id)}
                className="w-full text-left p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full bg-${severityConfig.color}-500 ${
                      anomaly.severity === 'high' || anomaly.severity === 'critical' ? 'animate-pulse' : ''
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-800">{anomaly.vesselName || '未知'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black bg-${typeConfig.color}-50 text-${typeConfig.color}-600`}>
                          {typeConfig.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black bg-${severityConfig.color}-50 text-${severityConfig.color}-600`}>
                          {severityConfig.label}
                        </span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 mt-0.5">{anomaly.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400">{anomaly.detectedAt.split(' ')[1]}</span>
                    <ChevronDown size={12} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 pl-4">
                  <span className="text-[8px] font-bold text-slate-400">AI置信度:</span>
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                    <div className={`h-full rounded-full ${
                      anomaly.aiConfidence > 90 ? 'bg-emerald-400' : anomaly.aiConfidence > 70 ? 'bg-amber-400' : 'bg-rose-400'
                    }`} style={{ width: `${anomaly.aiConfidence}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-slate-600">{anomaly.aiConfidence}%</span>
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
                      {/* 建议行动 */}
                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Shield size={10} className="text-blue-600" />
                          <span className="text-[9px] font-black text-blue-700">AI建议行动</span>
                        </div>
                        <p className="text-[9px] font-bold text-blue-600">{anomaly.suggestedAction}</p>
                      </div>

                      {/* 证据链 */}
                      <div className="space-y-1">
                        <div className="text-[9px] font-black text-slate-500 flex items-center gap-1">
                          <Zap size={9} />
                          证据链 ({anomaly.evidence.length})
                        </div>
                        {anomaly.evidence.map((ev, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                            <div className="p-0.5 rounded bg-white border border-slate-200 mt-0.5">
                              {ev.source === 'AIS' ? <Activity size={8} className="text-emerald-500" /> :
                               ev.source === '雷达' ? <Radar size={8} className="text-violet-500" /> :
                               <Zap size={8} className="text-blue-500" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-slate-600">{ev.source}</span>
                                <span className="text-[8px] font-bold text-slate-400">{ev.timestamp}</span>
                              </div>
                              <p className="text-[8px] font-bold text-slate-500">{ev.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* MMSI */}
                      {anomaly.mmsi && (
                        <div className="text-[8px] font-bold text-slate-400">
                          MMSI: {anomaly.mmsi} | 位置: {anomaly.position[0].toFixed(3)}°N, {anomaly.position[1].toFixed(3)}°E
                        </div>
                      )}
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
