import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  Clock, 
  Ship, 
  ArrowRight,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Zap,
  GripVertical,
  Layers,
  Container,
  Activity,
  Cpu,
  ArrowRightLeft,
  Box,
  Anchor,
  Navigation,
  Wind,
  Settings2,
  Bell,
  CheckCircle2,
  Info,
  FileText,
  Users
} from 'lucide-react';
import ETAPredictionPanel from './ETAPredictionPanel';
import ManifestParsingPanel from './ManifestParsingPanel';
import CollaborativeSchedulePanel from './CollaborativeSchedulePanel';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  Polyline, 
  Marker, 
  Tooltip,
  ZoomControl,
  Popup
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- Types & Data ---

const DATA = {
  "efficiency_metrics": {
    "title": "港口综合效率分析",
    "metrics": [
      { "id": "current_util_rate", "label": "原计划泊位利用率", "value": "45%", "status": "WARN" },
      { "id": "optimized_util_rate", "label": "动态规划后利用率", "value": "92%", "status": "SUCCESS" },
      { "id": "congestion_risk", "label": "港口拥堵风险", "value": "LOW", "status": "SUCCESS" },
      { "id": "saved_hours", "label": "挽回闲置工时", "value": "12小时", "status": "HIGHLIGHT" }
    ]
  },
  "plan_coordination_timeline": {
    "title": "靠泊计划与作业流水线链式动态调整",
    "timeline_events": [
      {
        "event_id": "evt_01",
        "ship_name": "中远海运/V2026",
        "action_type": "POSTPONE",
        "action_label": "计划后移",
        "original_window": "08:00 - 20:00",
        "optimized_window": "20:00 - 次日08:00",
        "conflict_alert": "检测到12小时空窗风险，已自动触发多船错峰接力链。"
      },
      {
        "event_id": "evt_02",
        "ship_name": "第一临时挂靠船 (替代船A)",
        "action_type": "INSERT_AD_HOC",
        "action_label": "错峰嵌入",
        "optimized_window": "08:00 - 14:00",
        "coordination_memo": "利用前半段空窗。联动引航站安排07:00引航员登轮，确保船到即靠，释放岸桥效能。"
      },
      {
        "event_id": "evt_03",
        "ship_name": "第二临时挂靠船 (替代船B)",
        "action_type": "INSERT_AD_HOC",
        "action_label": "接力嵌入",
        "optimized_window": "14:00 - 20:00",
        "coordination_memo": "接力替代船A。计划于14:00进港，完成作业后立即离泊清爽，完美衔接原延误船靠泊。"
      }
    ]
  },
  "resource_allocation_commands": {
    "title": "码头作业计划联动指令",
    "commands": [
      { "resource_type": "QUAY_CRANE", "label": "岸桥调度", "instruction": "原1号泊位3部岸桥动态切换：08:00-14:00服务替代船A，14:00-20:00服务替代船B。" },
      { "resource_type": "YARD_TRUCK", "label": "堆场集卡", "instruction": "堆场系统（CY）即时将替代船A/B的出口箱置顶翻场序列，集卡线提前2小时向新进港靠泊船舶倾斜。" }
    ]
  },
  "native_map_features": {
    "berths": [
      {
        "berth_id": "Berth_01",
        "name": "吴淞码头 1号泊位",
        "status": "REPLANNING_ACTIVE",
        "polygon_coords": [[31.378, 121.598], [31.380, 121.600], [31.375, 121.602], [31.373, 121.600]] as [number, number][],
        "associated_cranes": [
          { "crane_id": "QC_01", "status": "WORKING_AD_HOC", "coords": [31.378, 121.598] as [number, number] },
          { "crane_id": "QC_02", "status": "WORKING_AD_HOC", "coords": [31.379, 121.599] as [number, number] }
        ]
      }
    ],
    "vessels": [
      {
        "vessel_id": "vsl_delayed_01",
        "name": "中远海运/V2026",
        "status": "DELAYED",
        "coords": [31.352, 121.615] as [number, number],
        "heading": 125,
        "length": 366,
        "width": 51,
        "popup_msg": "延误原船 | 预计 20:00 抵港"
      },
      {
        "vessel_id": "vsl_backup_01",
        "name": "替代船A",
        "status": "MOVING_INBOUND",
        "coords": [31.360, 121.630] as [number, number],
        "heading": 305,
        "length": 200,
        "width": 32,
        "popup_msg": "第一临时挂靠船 | 正在通过核心航道 | 预计 08:00 靠泊"
      },
      {
        "vessel_id": "vsl_backup_02",
        "name": "替代船B",
        "status": "ANCHORED_WAITING",
        "coords": [31.365, 121.640] as [number, number],
        "heading": 90,
        "length": 240,
        "width": 38,
        "popup_msg": "第二临时挂靠船 | 锚地接力中 | 预计 14:00 靠泊"
      }
    ],
    "channels_and_routes": [
      {
        "route_id": "channel_main_line",
        "type": "RECOMMENDED_FAIRWAY",
        "status": "DYNAMIC_GUIDING",
        "path_coords": [[31.365, 121.640], [31.360, 121.630], [31.378, 121.598]] as [number, number][],
        "description": "错峰进港绿色引导通道"
      }
    ],
    "navigation_buoys": [
      { "buoy_id": "B_01", "type": "FAIRWAY_BUOY", "status": "GUIDING_ACTIVE", "coords": [31.362, 121.632] as [number, number] },
      { "buoy_id": "B_02", "type": "BERTHING_BUOY", "status": "ALERT_ACTIVE", "coords": [31.372, 121.605] as [number, number] }
    ]
  },
  "workflow_action_flow": {
    "button_text": "一键下达多计划协同指令",
    "impact_departments": ["码头中控", "引航站", "船代", "理货公司"]
  }
};

// --- Style Resolvers ---

const resolveStyle = (status: string) => {
  switch (status) {
    case 'SUCCESS': return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', map: '#10b981' };
    case 'WARN': return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', map: '#f59e0b' };
    case 'DELAYED': return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', map: '#f43f5e' };
    case 'HIGHLIGHT': return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', map: '#3b82f6' };
    case 'ACTIVE': return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', map: '#10b981' };
    case 'INSERT_AD_HOC': return { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', map: '#6366f1' };
    case 'REPLANNING_ACTIVE': return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', map: '#3b82f6' };
    case 'WORKING_AD_HOC': return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', map: '#10b981' };
    case 'MOVING_INBOUND': return { text: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', map: '#0ea5e9' };
    case 'ANCHORED_WAITING': return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', map: '#f97316' };
    case 'GUIDING_ACTIVE': return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', map: '#10b981' };
    case 'ALERT_ACTIVE': return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', map: '#f43f5e' };
    default: return { text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', map: '#64748b' };
  }
};

const resolveHexColor = (status: string) => resolveStyle(status).map;

// --- Custom Icons ---

const createShipIcon = (status: string, heading: number) => {
  const color = resolveHexColor(status);
  return L.divIcon({
    className: 'custom-ship-marker',
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V8L12 2Z" fill="${color}" fill-opacity="0.9" stroke="white" stroke-width="1.5"/>
          <path d="M8 10H16V18H8V10Z" fill="white" fill-opacity="0.3"/>
          <path d="M12 2L12 6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createCraneIcon = (status: string) => {
  const color = resolveHexColor(status);
  return L.divIcon({
    className: 'custom-crane-marker',
    html: `
      <div class="flex items-center justify-center w-6 h-6 bg-white rounded-md shadow-sm border border-slate-200">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 8V21H3V8"></path>
          <path d="M1 3H23V8H1V3Z"></path>
          <path d="M10 12H14"></path>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createBuoyIcon = (status: string) => {
  const color = resolveHexColor(status);
  const isPulsing = status === 'ALERT_ACTIVE';
  return L.divIcon({
    className: 'custom-buoy-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${isPulsing ? `<div class="absolute w-6 h-6 rounded-full opacity-40 animate-ping" style="background-color: ${color}"></div>` : ''}
        <div class="w-3 h-3 rounded-full border-2 border-white shadow-sm" style="background-color: ${color}"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// --- Main Component ---

type PortNavTab = 'coordination' | 'eta' | 'manifest' | 'schedule';

export default function PortNavCoordinationView() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<PortNavTab>('coordination');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 text-slate-800 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        .leaflet-container { background: #f1f5f9 !important; }
        .glass-panel {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
      `}} />

      {/* Sidebar Navigation */}
      <aside className="flex w-[440px] shrink-0 flex-col border-r border-slate-200 bg-white shadow-2xl z-20">
        {/* Header */}
        <div className="flex h-20 items-center gap-4 border-b border-slate-100 px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 text-white">
            <Cpu size={26} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">港航一体化协同调度平台</h1>
            <p className="text-[10px] font-bold text-indigo-500 tracking-[0.2em] uppercase leading-none mt-1">Spatiotemporal Dynamic Planning Engine</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors">
              <Settings2 size={18} />
            </button>
            <button className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-4 pt-2 bg-white sticky top-0 z-10">
          {[
            { id: 'coordination' as PortNavTab, label: '协同调度', icon: Cpu },
            { id: 'eta' as PortNavTab, label: 'ETA预测', icon: Navigation },
            { id: 'manifest' as PortNavTab, label: '舱单解析', icon: FileText },
            { id: 'schedule' as PortNavTab, label: '协同排班', icon: Users },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <TabIcon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          {activeTab === 'eta' && <ETAPredictionPanel />}
          {activeTab === 'manifest' && <ManifestParsingPanel />}
          {activeTab === 'schedule' && <CollaborativeSchedulePanel />}
          {activeTab === 'coordination' && (
          <>
          {/* Efficiency Dashboard */}
          <motion.section 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <TrendingUp size={16} />
                </div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{DATA.efficiency_metrics.title}</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-black text-emerald-600 border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                AI实时优化中
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {DATA.efficiency_metrics.metrics.map((item) => {
                const style = resolveStyle(item.status);
                return (
                  <motion.div 
                    key={item.id} 
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    className={`rounded-2xl border ${style.border} ${style.bg} p-4 shadow-sm transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                      <div className={`p-1 rounded-md ${style.bg} ${style.text}`}>
                        {item.status === 'SUCCESS' ? <Zap size={10} /> : item.status === 'HIGHLIGHT' ? <Activity size={10} /> : <AlertCircle size={10} />}
                      </div>
                    </div>
                    <div className={`text-2xl font-black tracking-tight ${style.text}`}>
                      {item.value}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Timeline Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Activity size={16} />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{DATA.plan_coordination_timeline.title}</h3>
            </div>

            <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {DATA.plan_coordination_timeline.timeline_events.map((event, idx) => {
                const isPostpone = event.action_type === 'POSTPONE';
                const style = resolveStyle(isPostpone ? 'DELAYED' : 'INSERT_AD_HOC');
                return (
                  <motion.div 
                    key={event.event_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    className="relative pl-10 group"
                  >
                    <div className={`absolute left-0 top-1.5 h-6 w-6 rounded-full bg-white border-2 ${isPostpone ? 'border-rose-500' : 'border-indigo-500'} shadow-sm z-10 flex items-center justify-center transition-transform group-hover:scale-110`}>
                      {isPostpone ? <Clock size={12} className="text-rose-500" /> : <Navigation size={12} className="text-indigo-500" />}
                    </div>
                    
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-default">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{event.ship_name}</h4>
                          <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${style.bg} ${style.text} border ${style.border}`}>
                            {event.action_label}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                          {event.original_window ? (
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                              <span className="text-slate-400 line-through decoration-slate-300">{event.original_window}</span>
                              <ArrowRight size={12} className="text-slate-300" />
                              <span className="text-indigo-600">{event.optimized_window}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-700">
                              <Clock size={12} className="text-slate-400" />
                              作业时段: {event.optimized_window}
                            </div>
                          )}
                        </div>

                        {event.conflict_alert && (
                          <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 flex gap-3">
                            <div className="shrink-0 text-rose-500 mt-0.5">
                              <AlertCircle size={14} />
                            </div>
                            <p className="text-[10px] font-bold text-rose-700 leading-relaxed italic">{event.conflict_alert}</p>
                          </div>
                        )}

                        {event.coordination_memo && (
                          <div className="flex gap-3 px-3 py-2.5 bg-indigo-50/30 rounded-xl border border-indigo-100/30">
                            <Info size={14} className="shrink-0 text-indigo-400 mt-0.5" />
                            <p className="text-[10px] text-indigo-700/80 leading-relaxed font-bold">
                              {event.coordination_memo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Resource Allocation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                <Layers size={16} />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{DATA.resource_allocation_commands.title}</h3>
            </div>
            
            <div className="space-y-4">
              {DATA.resource_allocation_commands.commands.map((cmd, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 4 }}
                  className="rounded-2xl border border-slate-100 bg-white p-5 flex gap-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-inner ${
                    cmd.resource_type === 'QUAY_CRANE' ? 'bg-sky-50 text-sky-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {cmd.resource_type === 'QUAY_CRANE' ? <BarChart3 size={24} /> : <Container size={24} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{cmd.label}</h4>
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold italic">
                      {cmd.instruction}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Action Footer */}
          <div className="pt-4 sticky bottom-0 bg-white pb-2">
            <motion.button 
              onClick={() => {
                setIsExecuting(true);
                setTimeout(() => setIsExecuting(false), 3000);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isExecuting}
              className={`w-full group relative flex flex-col items-center justify-center gap-1 rounded-2xl py-5 transition-all overflow-hidden ${
                isExecuting 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 hover:bg-indigo-700'
              }`}
            >
              <div className="flex items-center gap-3 text-xs font-black tracking-[0.1em] uppercase">
                {isExecuting ? '协同调度指令执行中...' : DATA.workflow_action_flow.button_text}
                {!isExecuting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
              </div>
              {isExecuting && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-full bg-white"
                  />
                </div>
              )}
            </motion.button>
            <div className="mt-5 flex flex-wrap justify-center gap-2 px-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">影响部门:</span>
              {DATA.workflow_action_flow.impact_departments.map(dept => (
                <span key={dept} className="text-[9px] font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  {dept}
                </span>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      </aside>

      {/* Main Map View */}
      <main className="flex-1 relative">
        <MapContainer 
          center={[31.365, 121.615]} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          
          <ZoomControl position="bottomright" />

          {/* Berths */}
          {DATA.native_map_features.berths.map(berth => (
            <React.Fragment key={berth.berth_id}>
              <Polygon
                positions={berth.polygon_coords}
                pathOptions={{
                  color: resolveHexColor(berth.status),
                  fillColor: resolveHexColor(berth.status),
                  fillOpacity: 0.15,
                  weight: 3,
                  dashArray: '8, 8'
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1">
                    <h5 className="text-xs font-black text-slate-900 mb-1">{berth.name}</h5>
                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      智能重规划激活
                    </div>
                  </div>
                </Popup>
              </Polygon>

              {/* Associated Cranes */}
              {berth.associated_cranes.map(crane => (
                <Marker 
                  key={crane.crane_id} 
                  position={crane.coords} 
                  icon={createCraneIcon(crane.status)}
                >
                  <Tooltip direction="top" offset={[0, -5]} className="custom-tooltip">
                    <span className="text-[9px] font-black uppercase tracking-tighter">岸桥: {crane.crane_id}</span>
                  </Tooltip>
                </Marker>
              ))}
            </React.Fragment>
          ))}

          {/* Channels & Routes */}
          {DATA.native_map_features.channels_and_routes.map(route => (
            <Polyline
              key={route.route_id}
              positions={route.path_coords}
              pathOptions={{
                color: resolveHexColor(route.status),
                weight: 4,
                dashArray: route.type === 'RECOMMENDED_FAIRWAY' ? '12, 12' : undefined,
                opacity: 0.6,
                lineCap: 'round'
              }}
            >
              <Tooltip sticky>
                <span className="text-[10px] font-black text-indigo-600 uppercase">{route.description}</span>
              </Tooltip>
            </Polyline>
          ))}

          {/* Navigation Buoys */}
          {DATA.native_map_features.navigation_buoys.map(buoy => (
            <Marker 
              key={buoy.buoy_id} 
              position={buoy.coords} 
              icon={createBuoyIcon(buoy.status)}
            >
              <Tooltip direction="right" className="custom-tooltip">
                <span className="text-[9px] font-black">助航标: {buoy.buoy_id}</span>
              </Tooltip>
            </Marker>
          ))}

          {/* Vessels */}
          {DATA.native_map_features.vessels.map(vessel => (
            <Marker
              key={vessel.vessel_id}
              position={vessel.coords}
              icon={createShipIcon(vessel.status, vessel.heading)}
            >
              <Popup>
                <div className="w-52 p-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900">{vessel.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black ${resolveStyle(vessel.status).bg} ${resolveStyle(vessel.status).text}`}>
                      {vessel.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-[10px] font-bold text-slate-500 mb-2">
                    <div className="flex justify-between"><span>长度:</span> <span className="text-slate-700">{vessel.length}m</span></div>
                    <div className="flex justify-between"><span>宽度:</span> <span className="text-slate-700">{vessel.width}m</span></div>
                    <div className="flex justify-between"><span>航向:</span> <span className="text-slate-700">{vessel.heading}°</span></div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 text-[10px] font-black text-slate-800 leading-tight">
                    {vessel.popup_msg}
                  </div>
                </div>
              </Popup>
              <Tooltip direction="top" offset={[0, -15]} opacity={1}>
                <div className="px-2 py-1">
                  <div className="text-[10px] font-black text-slate-900">{vessel.name}</div>
                  <div className="text-[8px] font-bold text-slate-400 leading-none">Vessel Dynamics</div>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Controls & Info */}
        <div className="absolute top-8 right-8 z-[400] flex flex-col gap-4">
          <div className="glass-panel rounded-3xl p-5 shadow-2xl min-w-[240px]">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-200/50 pb-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">系统时空映射层</span>
            </div>
            
            <div className="space-y-4">
              {[
                { label: '延误原船', status: 'DELAYED', icon: <Ship size={12} /> },
                { label: '动态引航通道', status: 'GUIDING_ACTIVE', icon: <Navigation size={12} /> },
                { label: '重规划泊位', status: 'REPLANNING_ACTIVE', icon: <Anchor size={12} /> },
                { label: '错峰嵌入船舶', status: 'INSERT_AD_HOC', icon: <Zap size={12} /> },
              ].map((item, i) => {
                const style = resolveStyle(item.status);
                return (
                  <div key={i} className="flex items-center justify-between group cursor-help">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${style.bg} ${style.text} transition-transform group-hover:scale-110`}>
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">{item.label}</span>
                    </div>
                    <div className="h-1.5 w-6 rounded-full bg-slate-100">
                      <div className={`h-full w-2/3 rounded-full ${style.text.replace('text-', 'bg-')} shadow-sm`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel rounded-2xl px-5 py-3 shadow-xl flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">当前风速</span>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                <Wind size={12} className="text-sky-500" />
                4.2 m/s
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">潮汐高度</span>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                <Activity size={12} className="text-indigo-500" />
                +1.24 m
              </div>
            </div>
          </div>
        </div>

        {/* Perspective Badge */}
        <div className="absolute bottom-8 left-8 z-[400]">
          <div className="glass-panel px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-200/50">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                <ShieldCheck size={22} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">安全状态认证</div>
                <div className="text-[8px] font-bold text-emerald-600 uppercase">Secure Environment</div>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">协同节点</span>
                <span className="text-sm font-black text-slate-800 tracking-tighter">08 API Connect</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">优化迭代</span>
                <span className="text-sm font-black text-slate-800 tracking-tighter">v4.2.0-DP</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
