/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 多源险情关联分析面板
 * 对应需求文档 3.1: 数字化MRCC多源险情关联
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, Radar, Camera, Satellite, FileText, 
  AlertTriangle, Link2, Zap, Activity, Shield
} from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_CORRELATED_GROUPS, type IncidentReport, type IncidentSource } from './emergencyData';

const getSourceConfig = (source: IncidentSource) => {
  switch (source) {
    case 'vhf': return { label: 'VHF', icon: Radio, color: 'blue' };
    case 'ais': return { label: 'AIS', icon: Activity, color: 'emerald' };
    case 'radar': return { label: '雷达', icon: Radar, color: 'violet' };
    case 'cctv': return { label: 'CCTV', icon: Camera, color: 'orange' };
    case 'report': return { label: '报告', icon: FileText, color: 'slate' };
    case 'satellite': return { label: '卫星', icon: Satellite, color: 'sky' };
  }
};

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'critical': return { label: '危急', color: 'rose', pulse: true };
    case 'high': return { label: '高', color: 'orange', pulse: true };
    case 'medium': return { label: '中', color: 'amber', pulse: false };
    case 'low': return { label: '低', color: 'slate', pulse: false };
    default: return { label: severity, color: 'slate', pulse: false };
  }
};

export default function IncidentCorrelationPanel() {
  const [selectedGroupId] = useState<string>('grp-001');
  const group = MOCK_CORRELATED_GROUPS.find(g => g.groupId === selectedGroupId);

  if (!group) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-violet-50 rounded-lg text-violet-600">
            <Link2 size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            多源险情AI关联
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-50 text-[10px] font-black text-violet-600 border border-violet-100">
          <Zap size={10} />
          关联度 {group.correlationScore}%
        </div>
      </div>

      {/* 数据源概览 */}
      <div className="grid grid-cols-3 gap-2">
        {(['vhf', 'ais', 'radar'] as IncidentSource[]).map((source) => {
          const config = getSourceConfig(source);
          const SourceIcon = config.icon;
          const count = MOCK_INCIDENTS.filter(i => i.source === source).length;
          return (
            <div key={source} className={`rounded-xl bg-${config.color}-50 border border-${config.color}-100 p-3 text-center`}>
              <SourceIcon size={16} className={`mx-auto text-${config.color}-500 mb-1`} />
              <div className="text-lg font-black text-slate-800">{count}</div>
              <div className={`text-[9px] font-bold text-${config.color}-600`}>{config.label}源</div>
            </div>
          );
        })}
      </div>

      {/* AI关联分析结果 */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={14} className="text-violet-600" />
          <span className="text-[10px] font-black text-violet-800 uppercase">AI关联分析</span>
        </div>
        <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
          {group.aiSummary}
        </p>
      </div>

      {/* 关联事件链 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
          事件关联链 ({1 + group.relatedIncidents.length} 条)
        </div>
        
        <div className="relative space-y-2 pl-4 before:absolute before:left-[7px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-rose-300 before:to-violet-300">
          {/* Primary incident */}
          <IncidentCard incident={group.primaryIncident} isPrimary />
          
          {/* Related incidents */}
          {group.relatedIncidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} isPrimary={false} />
          ))}
        </div>
      </div>

      {/* 推荐行动 */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={12} className="text-blue-600" />
          <span className="text-[10px] font-black text-blue-700">AI推荐行动</span>
        </div>
        <p className="text-[9px] font-bold text-blue-600 leading-relaxed">
          {group.recommendedAction}
        </p>
      </div>
    </div>
  );
}

function IncidentCard({ incident, isPrimary }: { incident: IncidentReport; isPrimary: boolean; key?: string }) {
  const sourceConfig = getSourceConfig(incident.source);
  const severityConfig = getSeverityConfig(incident.severity);
  const SourceIcon = sourceConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative rounded-xl border p-3 ${
        isPrimary ? 'bg-white border-rose-200 shadow-sm' : 'bg-white border-slate-100'
      }`}
    >
      <div className={`absolute -left-4 top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
        isPrimary ? 'bg-rose-500' : 'bg-violet-400'
      }`} />
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-md bg-${sourceConfig.color}-50`}>
            <SourceIcon size={10} className={`text-${sourceConfig.color}-500`} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-800">{incident.title}</div>
            <div className="text-[9px] font-bold text-slate-400">{incident.timestamp.split(' ')[1]}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black bg-${severityConfig.color}-50 text-${severityConfig.color}-600`}>
            {severityConfig.label}
          </span>
          {incident.verified && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-50 text-emerald-600">
              已验证
            </span>
          )}
        </div>
      </div>
      
      <p className="mt-1.5 text-[9px] font-bold text-slate-500 leading-relaxed">
        {incident.description}
      </p>
      
      <div className="mt-2 flex items-center gap-2 text-[8px] font-bold text-slate-400">
        <span>置信度: {incident.confidence}%</span>
        {incident.vesselName && <span>· {incident.vesselName}</span>}
      </div>
    </motion.div>
  );
}
