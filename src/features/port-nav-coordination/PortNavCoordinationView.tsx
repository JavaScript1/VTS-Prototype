import React, { useState } from 'react';
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
  ArrowRightLeft
} from 'lucide-react';
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

// Payload from the request
const PORT_DATA = {
  "efficiency_metrics": {
    "title": "港口综合效率分析",
    "metrics": [
      { "id": "current_util_rate", "label": "原计划泊位利用率", "value": "45%", "status": "normal" },
      { "id": "optimized_util_rate", "label": "动态规划后利用率", "value": "92%", "status": "success" },
      { "id": "congestion_risk", "label": "港口拥堵风险", "value": "LOW", "status": "success" },
      { "id": "saved_hours", "label": "挽回闲置工时", "value": "12小时", "status": "highlight" }
    ]
  },
  "plan_coordination_timeline": {
    "title": "靠泊计划与作业流水线链式动态调整",
    "timeline_events": [
      {
        "event_id": "evt_01",
        "ship_name": "中远海运/V2026 (延误原船)",
        "action_type": "POSTPONE",
        "action_label": "计划后移",
        "original_window": "08:00 - 20:00",
        "optimized_window": "20:00 - 次日08:00",
        "badge_color": "#FF4D4F",
        "conflict_alert": "检测到12小时空窗风险，已自动触发以下替代挂靠链"
      },
      {
        "event_id": "evt_02",
        "ship_name": "第一临时挂靠船 (替代船A)",
        "action_type": "INSERT_AD_HOC",
        "action_label": "错峰嵌入",
        "optimized_window": "08:00 - 14:00",
        "badge_color": "#52C41A",
        "operation_duration": "作业耗时6小时",
        "coordination_memo": "利用前半段空窗。通知引航站于07:00前到位，实现‘船到即靠’。"
      },
      {
        "event_id": "evt_03",
        "ship_name": "第二临时挂靠船 (替代船B)",
        "action_type": "INSERT_AD_HOC",
        "action_label": "接力嵌入",
        "optimized_window": "14:00 - 20:00",
        "badge_color": "#FAAD14",
        "operation_duration": "作业耗时6小时",
        "coordination_memo": "接力替代船A。完成作业后清爽泊位，完美衔接原延误船靠泊。"
      }
    ]
  },
  "resource_allocation_commands": {
    "title": "码头作业计划联动指令",
    "commands": [
      {
        "resource_type": "QUAY_CRANE",
        "label": "岸桥调度",
        "instruction": "原定于08:00服务原船的3部岸桥，动态流转至【替代船A】；14:00无缝切换至【替代船B】。资源利用率提升100%。"
      },
      {
        "resource_type": "YARD_TRUCK",
        "label": "堆场与集卡",
        "instruction": "配合重规划顺序，即时置顶【替代船A/B】的集装箱翻场序列，集卡作业线提前2小时向新进港靠泊船舶倾斜。"
      }
    ]
  },
  "native_map_layers": {
    "map_theme_hint": "LIGHT_COMPATIBLE",
    "berth_layer": {
      "berth_id": "Berth_01",
      "geometry_type": "Polygon",
      "coords": [[31.378, 121.598], [31.380, 121.600], [31.375, 121.602]] as [number, number][],
      "interactive_state": "DYNAMIC_REPLANNING",
      "style": {
        "color": "#1890FF",
        "fillColor": "#E6F7FF",
        "fillOpacity": 0.6,
        "weight": 2,
        "dashArray": "none"
      },
      "popup_html": "<div class='light-popup'><h5>1号泊位 (智能重规划中)</h5><p>通过错峰插入2艘船舶，泊位今日利用率由45%提升至92%。</p></div>"
    },
    "vessel_markers": [
      {
        "vessel_id": "vsl_delayed_01",
        "name": "延误原船",
        "current_coords": [31.352, 121.615] as [number, number],
        "status": "DELAYED",
        "ui_style": { "icon": "#FF4D4F", "is_pulsing": false },
        "popover_text": "状态：外海延误中 | 预计 20:00 抵港"
      },
      {
        "vessel_id": "vsl_backup_01",
        "name": "替代船A",
        "current_coords": [31.360, 121.630] as [number, number],
        "status": "MOVING_IN",
        "ui_style": { "icon": "#52C41A", "is_pulsing": true },
        "popover_text": "状态：执行临时挂靠 | 正在引航进港 (08:00 靠泊)"
      },
      {
        "vessel_id": "vsl_backup_02",
        "name": "替代船B",
        "current_coords": [31.365, 121.640] as [number, number],
        "status": "WAITING",
        "ui_style": { "icon": "#FAAD14", "is_pulsing": false },
        "popover_text": "状态：接力准备中 | 锚地待命 (14:00 靠泊)"
      }
    ],
    "guiding_lines": [
      {
        "line_id": "route_a",
        "path": [[31.360, 121.630], [31.378, 121.598]] as [number, number][],
        "style": { "color": "#52C41A", "weight": 3, "dashArray": "4, 4" }
      },
      {
        "line_id": "route_b",
        "path": [[31.365, 121.640], [31.378, 121.598]] as [number, number][],
        "style": { "color": "#FAAD14", "weight": 2, "dashArray": "6, 6" }
      }
    ]
  },
  "workflow_action_flow": {
    "button_action": "EXECUTE_CHAIN_RESCHEDULE",
    "button_text": "一键下达多计划协同指令",
    "impact_departments": ["码头中控", "引航站", "船代", "理货公司"]
  }
};

const createCustomIcon = (color: string, isPulsing: boolean) => {
  return L.divIcon({
    className: 'custom-ship-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${isPulsing ? `<div class="absolute w-8 h-8 rounded-full opacity-40 animate-marker-pulse" style="background-color: ${color}"></div>` : ''}
        <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-md" style="background-color: ${color}"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export default function PortNavCoordinationView() {
  const [isExecuting, setIsExecuting] = useState(false);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 text-slate-800">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marker-pulse {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-marker-pulse {
          animation: marker-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .leaflet-container {
          background: #f8fafc !important;
        }
        .light-popup h5 {
          margin: 0 0 4px 0;
          font-weight: 800;
          font-size: 13px;
          color: #1e293b;
        }
        .light-popup p {
          margin: 0;
          font-size: 11px;
          color: #64748b;
          line-height: 1.4;
        }
      `}} />

      {/* Sidebar */}
      <aside className="flex w-[420px] shrink-0 flex-col border-r border-slate-200 bg-white shadow-xl z-10">
        {/* Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20 text-white">
            <Cpu size={22} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">港航一体化智能调度</h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none">Smart Port-Nav Coordination</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          {/* Efficiency Dashboard */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">{PORT_DATA.efficiency_metrics.title}</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">实时计算</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PORT_DATA.efficiency_metrics.metrics.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 hover:shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{item.label}</span>
                    {item.status === 'success' && <Zap size={12} className="text-emerald-500" />}
                    {item.status === 'highlight' && <Activity size={12} className="text-amber-500" />}
                  </div>
                  <div className={`text-xl font-black ${
                    item.status === 'success' ? 'text-emerald-600' : 
                    item.status === 'highlight' ? 'text-amber-600' : 'text-slate-800'
                  }`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Activity size={16} className="text-blue-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">{PORT_DATA.plan_coordination_timeline.title}</h3>
            </div>

            <div className="space-y-3">
              {PORT_DATA.plan_coordination_timeline.timeline_events.map((event, idx) => (
                <div key={event.event_id} className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-px before:bg-slate-100 last:before:hidden">
                  <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white shadow-sm z-10" style={{ backgroundColor: event.badge_color }} />
                  
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black text-slate-900">{event.ship_name}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${event.badge_color}15`, color: event.badge_color }}>
                        {event.action_label}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {event.original_window && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <span className="line-through">{event.original_window}</span>
                          <ArrowRightLeft size={10} className="text-slate-300" />
                          <span className="text-slate-600">{event.optimized_window}</span>
                        </div>
                      )}
                      {!event.original_window && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                          <Clock size={10} className="text-slate-400" />
                          {event.optimized_window}
                        </div>
                      )}

                      {event.conflict_alert && (
                        <div className="mt-2 rounded-lg bg-red-50 border border-red-100 p-2 flex gap-2">
                          <AlertCircle size={12} className="text-red-500 mt-0.5" />
                          <p className="text-[9px] font-bold text-red-600 leading-tight">{event.conflict_alert}</p>
                        </div>
                      )}

                      {event.coordination_memo && (
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium bg-slate-50/80 p-2 rounded-lg italic">
                          {event.coordination_memo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Resource Commands */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <GripVertical size={16} className="text-slate-400" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">{PORT_DATA.resource_allocation_commands.title}</h3>
            </div>
            
            <div className="space-y-3">
              {PORT_DATA.resource_allocation_commands.commands.map((cmd, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 flex gap-4 shadow-sm">
                  <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${
                    cmd.resource_type === 'QUAY_CRANE' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {cmd.resource_type === 'QUAY_CRANE' ? <BarChart3 size={20} /> : <Container size={20} />}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-900 mb-1">{cmd.label}</h4>
                    <p className="text-[10px] text-slate-500 leading-normal font-medium">
                      {cmd.instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action Flow */}
          <div className="pt-2">
            <button 
              onClick={() => setIsExecuting(true)}
              disabled={isExecuting}
              className={`w-full group relative flex flex-col items-center justify-center gap-1 rounded-2xl py-4 transition-all overflow-hidden ${
                isExecuting 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-black tracking-tight">
                {isExecuting ? '协同指令已分发' : PORT_DATA.workflow_action_flow.button_text}
                {!isExecuting && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
              </div>
            </button>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 px-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">影响部门:</span>
              {PORT_DATA.workflow_action_flow.impact_departments.map(dept => (
                <span key={dept} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {dept}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content (Map) */}
      <main className="flex-1 relative bg-slate-50">
        <MapContainer 
          center={[31.365, 121.615]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          <ZoomControl position="bottomright" />

          {/* Berth Polygon */}
          <Polygon
            positions={PORT_DATA.native_map_layers.berth_layer.coords}
            pathOptions={{
              color: PORT_DATA.native_map_layers.berth_layer.style.color,
              fillColor: PORT_DATA.native_map_layers.berth_layer.style.fillColor,
              fillOpacity: PORT_DATA.native_map_layers.berth_layer.style.fillOpacity,
              weight: PORT_DATA.native_map_layers.berth_layer.style.weight,
              dashArray: PORT_DATA.native_map_layers.berth_layer.style.dashArray === 'none' ? undefined : PORT_DATA.native_map_layers.berth_layer.style.dashArray
            }}
          >
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: PORT_DATA.native_map_layers.berth_layer.popup_html }} />
            </Popup>
          </Polygon>

          {/* Ship Markers */}
          {PORT_DATA.native_map_layers.vessel_markers.map(vessel => (
            <Marker
              key={vessel.vessel_id}
              position={vessel.current_coords}
              icon={createCustomIcon(vessel.ui_style.icon, vessel.ui_style.is_pulsing)}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                <div className="text-[10px] font-bold px-1 text-slate-800">
                  <div className="border-b border-slate-100 pb-0.5 mb-0.5">{vessel.name}</div>
                  <div className="text-slate-500 font-medium">{vessel.popover_text.split('|')[0]}</div>
                </div>
              </Tooltip>
            </Marker>
          ))}

          {/* Guiding Lines */}
          {PORT_DATA.native_map_layers.guiding_lines.map(line => (
            <Polyline
              key={line.line_id}
              positions={line.path}
              pathOptions={{
                color: line.style.color,
                weight: line.style.weight,
                dashArray: line.style.dashArray
              }}
            />
          ))}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="absolute top-6 right-6 z-[400]">
          <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 p-4 shadow-xl min-w-[200px]">
            <div className="text-[10px] font-black text-slate-800 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">图层图例 / Legend</div>
            <div className="space-y-3">
              {[
                { label: '延误原船 (Delay)', color: 'bg-[#FF4D4F]' },
                { label: '替代船A (Priority)', color: 'bg-[#52C41A]' },
                { label: '替代船B (Backup)', color: 'bg-[#FAAD14]' },
                { label: '重规划泊位 (Berth 01)', color: 'border-2 border-slate-300' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                  <span className="text-[10px] font-bold text-slate-600">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400">规划引擎状态</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-emerald-600 uppercase">Active</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Status Bar */}
        <div className="absolute bottom-6 left-6 z-[400]">
          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl px-5 py-2.5 shadow-xl">
            <div className="flex items-center gap-2.5 border-r border-slate-200 pr-5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Network Secure</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><Ship size={14} className="text-slate-400" /> 监测中: 142</span>
              <span className="flex items-center gap-1.5"><Layers size={14} className="text-slate-400" /> 协同节点: 08</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
