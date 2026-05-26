/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ETA动态高精度预测面板
 * 对应需求文档 2.2: 动态ETA高精度预测与协同排班
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, TrendingUp, AlertTriangle, CheckCircle, 
  ChevronDown, Navigation, Wind, Waves, Activity
} from 'lucide-react';
import { MOCK_ETA_PREDICTIONS, type ETAPrediction, type ETAPredictionStatus } from './portNavData';

const getStatusConfig = (status: ETAPredictionStatus) => {
  switch (status) {
    case 'on_time': return { label: '准时', color: 'emerald', icon: CheckCircle };
    case 'early': return { label: '提前', color: 'blue', icon: TrendingUp };
    case 'delayed': return { label: '延误', color: 'amber', icon: Clock };
    case 'critical_delay': return { label: '严重延误', color: 'rose', icon: AlertTriangle };
  }
};

export default function ETAPredictionPanel() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const predictions = MOCK_ETA_PREDICTIONS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-violet-50 rounded-lg text-violet-600">
            <Navigation size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            AI动态ETA预测引擎
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 text-[10px] font-black text-violet-600 border border-violet-100">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          误差 &lt; 15min
        </div>
      </div>

      <div className="space-y-3">
        {predictions.map((pred) => {
          const config = getStatusConfig(pred.status);
          const StatusIcon = config.icon;
          const isExpanded = expandedId === pred.id;

          return (
            <motion.div
              key={pred.id}
              layout
              className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                pred.status === 'critical_delay' ? 'border-rose-200' :
                pred.status === 'delayed' ? 'border-amber-200' : 'border-slate-100'
              }`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : pred.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-${config.color}-50 text-${config.color}-600`}>
                      <StatusIcon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">{pred.shipName}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5">
                        MMSI: {pred.mmsi} · 距港 {pred.distanceToPort} nm
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-[10px] font-black px-2 py-0.5 rounded-md bg-${config.color}-50 text-${config.color}-600 border border-${config.color}-100`}>
                        {pred.deviationMinutes > 0 ? '+' : ''}{pred.deviationMinutes}min
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 mt-1">
                        置信度 {pred.confidence}%
                      </div>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={11} className="text-slate-400" />
                    原ETA: {pred.originalETA.split(' ')[1]}
                  </div>
                  <div className="text-slate-300">→</div>
                  <div className={`flex items-center gap-1.5 text-${config.color}-600 font-black`}>
                    <Activity size={11} />
                    预测: {pred.predictedETA.split(' ')[1]}
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-slate-400">
                    <Navigation size={10} />
                    {pred.currentSpeed} kn
                  </div>
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
                      {/* 环境因素 */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-sky-50 border border-sky-100 p-2.5 text-center">
                          <Wind size={12} className="mx-auto text-sky-500 mb-1" />
                          <div className="text-[9px] font-bold text-sky-700">{pred.weatherImpact}</div>
                        </div>
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5 text-center">
                          <Waves size={12} className="mx-auto text-blue-500 mb-1" />
                          <div className="text-[9px] font-bold text-blue-700">{pred.currentImpact}</div>
                        </div>
                        <div className="rounded-xl bg-orange-50 border border-orange-100 p-2.5 text-center">
                          <Activity size={12} className="mx-auto text-orange-500 mb-1" />
                          <div className="text-[9px] font-bold text-orange-700">拥堵 {pred.congestionIndex}%</div>
                        </div>
                      </div>

                      {/* 影响因素分析 */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider">影响因素分析</div>
                        {pred.factors.map((factor, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${
                              factor.impact > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {factor.impact > 0 ? '+' : ''}{factor.impact}'
                            </div>
                            <div className="flex-1">
                              <div className="text-[10px] font-black text-slate-700">{factor.name}</div>
                              <div className="text-[9px] font-bold text-slate-400">{factor.description}</div>
                            </div>
                          </div>
                        ))}
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
