/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BarChart3, Clock, Layers, Users, Zap, Map as MapIcon, ChevronRight } from 'lucide-react';
import { 
  MOCK_RISK_TIME_DISTRIBUTION, 
  MOCK_OPERATOR_EFFICIENCY, 
  MOCK_SERVICE_DIMENSIONS 
} from '../../../mock/riskDashboardData';

export default function RiskAnalysisDashboard() {
  const [dimension, setDimension] = useState<'operator' | 'service'>('service');
  const [timeRange, setTimeLeft] = useState([8, 18]); // 08:00 - 18:00

  return (
    <div className="flex flex-col h-full space-y-6 text-slate-800">
      {/* 1. Macro Trend Header */}
      <section>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <BarChart3 size={14} /> 宏观态势概览
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 mb-1">风险事件总数</div>
            <div className="text-2xl font-black text-slate-900">1,284 <span className="text-[10px] text-rose-500 font-medium">+12%</span></div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 mb-1">平均处理耗时</div>
            <div className="text-2xl font-black text-slate-900">4.2 min <span className="text-[10px] text-emerald-500 font-medium">-5%</span></div>
          </div>
        </div>
      </section>

      {/* 2. Space-Time Analysis (Heatmap & Timeline) */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-sky-500" /> 空间与时间聚类
          </h3>
          <div className="flex items-center gap-2 px-2 py-1 bg-sky-50 rounded-full">
            <MapIcon size={12} className="text-sky-600" />
            <span className="text-[10px] font-black text-sky-700">热力图已开启</span>
          </div>
        </div>
        
        {/* Time Distribution Chart (Mini) */}
        <div className="flex items-end gap-1 h-20 mb-4 px-2">
          {MOCK_RISK_TIME_DISTRIBUTION.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div 
                className="w-full bg-sky-100 rounded-t-sm transition-all group-hover:bg-sky-500" 
                style={{ height: `${(item.value / 600) * 100}%` }}
              />
              <span className="text-[8px] font-mono text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Timeline Slider Mock */}
        <div className="relative pt-4 pb-2">
          <div className="h-1 bg-slate-100 rounded-full w-full">
            <div className="absolute left-[33%] right-[25%] h-1 bg-sky-500 rounded-full">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-sky-500 rounded-full shadow-md cursor-pointer" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-sky-500 rounded-full shadow-md cursor-pointer" />
            </div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[9px] font-black text-slate-400">早高峰</span>
            <span className="text-[9px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">08:00 - 18:00</span>
            <span className="text-[9px] font-black text-slate-400">晚高峰</span>
          </div>
        </div>
      </section>

      {/* 3. Management Drill-down Switcher */}
      <section className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl mb-4 w-fit self-center">
          <button 
            onClick={() => setDimension('service')}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${dimension === 'service' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            服务维度
          </button>
          <button 
            onClick={() => setDimension('operator')}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${dimension === 'operator' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
          >
            值班员维度
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar-light pr-2 space-y-3">
          {dimension === 'service' ? (
            MOCK_SERVICE_DIMENSIONS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-sky-200 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-sky-500 transition-colors">
                      <Zap size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{item.category}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
                <div className="grid grid-cols-2 gap-6 pl-8">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">占比</div>
                    <div className="text-lg font-black text-slate-900">{item.ratio}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">处理效率</div>
                    <div className="text-lg font-black text-emerald-600">{item.efficiency}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            MOCK_OPERATOR_EFFICIENCY.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-sky-200 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-sky-500 transition-colors">
                      <Users size={14} />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{item.name}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </div>
                <div className="grid grid-cols-2 gap-6 pl-8">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">经办案例</div>
                    <div className="text-lg font-black text-slate-900">{item.cases}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">效率评分</div>
                    <div className="text-lg font-black text-emerald-600">{item.efficiency}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Retro/Playback Retrospective */}
      <div className="pt-2">
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
          <Clock size={14} /> 开启历史追溯播放
        </button>
      </div>

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
