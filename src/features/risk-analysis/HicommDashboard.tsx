/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HICOMM指挥中心看板
 * 对应需求文档 4.2: HICOMM指挥中心
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Monitor, TrendingUp, TrendingDown, Minus, AlertTriangle, 
  Bell, Ship, Anchor, Navigation, Radio, Users, Shield,
  CheckCircle, XCircle
} from 'lucide-react';
import { MOCK_HICOMM_DASHBOARD, type HicommDashboard as HicommDashboardType } from './riskEnhancedData';

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <TrendingUp size={10} />;
    case 'down': return <TrendingDown size={10} />;
    default: return <Minus size={10} />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'good': return 'emerald';
    case 'warning': return 'amber';
    case 'critical': return 'rose';
    default: return 'slate';
  }
};

const getAlertColor = (level: string) => {
  switch (level) {
    case 'critical': return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', dot: 'bg-rose-500' };
    case 'warning': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', dot: 'bg-amber-500' };
    default: return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-500' };
  }
};

export default function HicommDashboard() {
  const [dashboard] = useState<HicommDashboardType>(MOCK_HICOMM_DASHBOARD);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-900 rounded-lg text-white">
            <Monitor size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            HICOMM 指挥中心
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600 border border-emerald-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          全域在线
        </div>
      </div>

      {/* 核心指标网格 */}
      <div className="grid grid-cols-3 gap-2">
        {dashboard.metrics.map((metric) => {
          const color = getStatusColor(metric.status);
          return (
            <motion.div
              key={metric.id}
              whileHover={{ y: -2 }}
              className={`rounded-xl border border-${color}-100 bg-${color}-50/50 p-3 transition-all hover:shadow-md`}
            >
              <div className="text-[9px] font-bold text-slate-500 mb-1 truncate">{metric.label}</div>
              <div className={`text-lg font-black text-${color}-600 leading-none`}>
                {metric.value}{metric.unit && <span className="text-[9px] font-bold text-slate-400 ml-0.5">{metric.unit}</span>}
              </div>
              <div className={`flex items-center gap-1 mt-1.5 text-[9px] font-bold ${
                metric.trend === 'up' ? (metric.status === 'good' ? 'text-emerald-500' : 'text-rose-500') :
                metric.trend === 'down' ? (metric.status === 'good' ? 'text-emerald-500' : 'text-rose-500') :
                'text-slate-400'
              }`}>
                {getTrendIcon(metric.trend)}
                <span>{metric.trendValue}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 船舶交通概况 */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Ship size={14} className="text-sky-400" />
          <span className="text-[10px] font-black uppercase tracking-wider">船舶交通实时概况</span>
          <span className="ml-auto text-[9px] font-bold text-slate-400">总计 {dashboard.vesselTrafficSummary.total} 艘</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '进港', value: dashboard.vesselTrafficSummary.inbound, icon: Navigation, color: 'sky' },
            { label: '出港', value: dashboard.vesselTrafficSummary.outbound, icon: Navigation, color: 'emerald' },
            { label: '锚泊', value: dashboard.vesselTrafficSummary.anchored, icon: Anchor, color: 'amber' },
            { label: '靠泊', value: dashboard.vesselTrafficSummary.berthed, icon: Ship, color: 'violet' },
          ].map((item, i) => {
            const ItemIcon = item.icon;
            return (
              <div key={i} className="text-center">
                <ItemIcon size={14} className={`mx-auto text-${item.color}-400 mb-1 ${i === 1 ? 'rotate-180' : ''}`} />
                <div className="text-lg font-black">{item.value}</div>
                <div className="text-[8px] font-bold text-slate-500">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 资源状态 */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
          <Shield size={10} />
          资源状态
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '海巡艇', ...dashboard.resourceStatus.patrolVessels, icon: Ship },
            { label: '拖轮', ...dashboard.resourceStatus.tugboats, icon: Anchor },
            { label: '引航员', ...dashboard.resourceStatus.pilots, icon: Users },
            { label: 'VHF频道', ...dashboard.resourceStatus.vhfChannels, icon: Radio, isChannel: true },
          ].map((item, i) => {
            const ItemIcon = item.icon;
            const ratio = ('available' in item ? item.available : 0) / item.total;
            return (
              <div key={i} className="rounded-xl bg-white border border-slate-100 p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50">
                  <ItemIcon size={14} className="text-slate-600" />
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-bold text-slate-400">{item.label}</div>
                  <div className="text-xs font-black text-slate-800">
                    {'available' in item ? item.available : 0}/{item.total}
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${ratio > 0.5 ? 'bg-emerald-400' : ratio > 0.3 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${ratio * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 预警列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <Bell size={10} />
            实时预警 ({dashboard.alerts.length})
          </div>
        </div>
        <div className="space-y-1.5">
          {dashboard.alerts.map((alert) => {
            const colors = getAlertColor(alert.level);
            return (
              <div key={alert.id} className={`rounded-xl border ${colors.border} ${colors.bg} p-3`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${colors.dot} ${!alert.acknowledged ? 'animate-pulse' : ''}`} />
                    <span className={`text-[10px] font-black ${colors.text}`}>{alert.title}</span>
                    <span className="text-[8px] font-bold text-slate-400 bg-white/50 px-1.5 py-0.5 rounded">{alert.area}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-slate-400">{alert.timestamp}</span>
                    {alert.acknowledged ? 
                      <CheckCircle size={10} className="text-emerald-500" /> : 
                      <XCircle size={10} className="text-slate-300" />
                    }
                  </div>
                </div>
                <p className="mt-1 text-[9px] font-bold text-slate-600 leading-relaxed pl-4">
                  {alert.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
