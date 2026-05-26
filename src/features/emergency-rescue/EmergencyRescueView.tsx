/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  Droplets, 
  ShieldAlert, 
  Ship, 
  Box, 
  Activity, 
  MapPin, 
  Phone, 
  Navigation, 
  AlertTriangle,
  ChevronRight,
  Play
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

import DriftPredictionPanel from './DriftPredictionPanel';
import RescuePlanPanel from './RescuePlanPanel';
import IncidentCorrelationPanel from './IncidentCorrelationPanel';

type EmergencyMode = 'typhoon' | 'oil-spill';
type EmergencyTab = 'scenario' | 'drift' | 'rescue' | 'correlation';

interface Resource {
  id: string;
  type: 'supply' | 'ship' | 'medical';
  name: string;
  status: 'available' | 'busy' | 'offline';
  coords: [number, number];
  contact: string;
  idCode: string;
}

const RESOURCES: Resource[] = [
  { id: '1', type: 'supply', name: '物资储备 A 库', status: 'available', coords: [31.35, 121.65], contact: '138-0000-1111', idCode: 'SUP-001' },
  { id: '2', type: 'ship', name: '海巡 01 轮', status: 'available', coords: [31.32, 121.62], contact: '139-1111-2222', idCode: 'SHIP-082' },
  { id: '3', type: 'medical', name: '医疗救援直升机', status: 'busy', coords: [31.38, 121.68], contact: '135-2222-3333', idCode: 'MED-009' },
  { id: '4', type: 'supply', name: '应急油毡仓库', status: 'available', coords: [31.34, 121.58], contact: '137-3333-4444', idCode: 'SUP-005' },
  { id: '5', type: 'ship', name: '专业清污船 B', status: 'available', coords: [31.36, 121.72], contact: '136-4444-5555', idCode: 'SHIP-112' },
];

const TyphoonIcon = L.divIcon({
  html: `<div class="animate-spin-slow"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-red-500"><path d="M12 2C13.84 2 15.63 2.5 17.16 3.44C18.69 4.38 19.89 5.73 20.6 7.33C21.31 8.93 21.5 10.71 21.14 12.41C20.78 14.11 19.89 15.65 18.59 16.84C17.29 18.03 15.62 18.8 13.81 19.06C12 19.32 10.15 19.06 8.5 18.31C6.85 17.56 5.48 16.36 4.58 14.86C3.68 13.36 3.3 11.64 3.5 10C3.7 8.36 4.47 6.84 5.68 5.71C6.89 4.58 8.48 3.91 10.16 3.79C11.84 3.67 13.52 4.11 14.95 5.05L12 12H19.5C19.5 10.01 18.71 8.11 17.3 6.7C15.89 5.29 13.99 4.5 12 4.5V2Z" fill="currentColor"/></svg></div>`,
  className: '',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const ResourceIcon = (type: string, color: string) => L.divIcon({
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-${color}-500 text-white shadow-lg border-2 border-white">
    ${type === 'supply' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>' : 
      type === 'ship' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.2.94 4.19 2.44 5.51"/><path d="M19 13V7c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v6"/><path d="M12 10V2"/></svg>' : 
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'}
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const MapAutoCenter = ({ coords }: { coords: [number, number] }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView(coords, 12, { animate: true });
  }, [coords, map]);
  return null;
};

export default function EmergencyRescueView() {
  const [mode, setMode] = useState<EmergencyMode>('typhoon');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [activeTab, setActiveTab] = useState<EmergencyTab>('scenario');

  const theme = mode === 'typhoon' ? 'sky' : 'slate';
  const isTyphoon = mode === 'typhoon';

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="z-10 w-[340px] shrink-0 border-r border-slate-200 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2 rounded-lg bg-${theme}-500 text-white`}>
              <ShieldAlert size={20} />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">应急处置中心</h1>
          </div>
          <p className="text-xs text-slate-400 font-medium">EMERGENCY RESPONSE CONTROL CENTER</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex p-1 bg-slate-100 mx-6 mt-4 rounded-xl border border-slate-200">
          <button
            onClick={() => setMode('typhoon')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isTyphoon ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Wind size={16} />
            防台应急
          </button>
          <button
            onClick={() => setMode('oil-spill')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              !isTyphoon ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Droplets size={16} />
            溢油处置
          </button>
        </div>

        {/* Function Tabs */}
        <div className="flex border-b border-slate-100 mx-4 mt-3">
          {[
            { id: 'scenario' as EmergencyTab, label: '态势' },
            { id: 'correlation' as EmergencyTab, label: '险情关联' },
            { id: 'drift' as EmergencyTab, label: '漂移预测' },
            { id: 'rescue' as EmergencyTab, label: '搜救方案' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
          {activeTab === 'drift' && <DriftPredictionPanel />}
          {activeTab === 'rescue' && <RescuePlanPanel />}
          {activeTab === 'correlation' && <IncidentCorrelationPanel />}
          {activeTab === 'scenario' && (
          <>
          {/* Scenario Statistics */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-wider">态势统计</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isTyphoon ? 'bg-sky-100 text-sky-600' : 'bg-slate-200 text-slate-600'}`}>
                {isTyphoon ? 'III级响应' : '一般事故'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] text-slate-400 font-bold mb-1">受影响船舶</div>
                <div className="text-xl font-black text-slate-800">128</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] text-slate-400 font-bold mb-1">预计到达</div>
                <div className="text-xl font-black text-slate-800">4.5h</div>
              </div>
            </div>
          </div>

          {/* Recommended Resources */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-wider">推荐资源</h3>
              <button className="text-[11px] font-bold text-sky-600 hover:underline">查看全部</button>
            </div>
            <div className="space-y-3">
              {RESOURCES.slice(0, 3).map((res) => (
                <div 
                  key={res.id} 
                  onClick={() => setSelectedResource(res)}
                  className="group flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-sky-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    res.type === 'supply' ? 'bg-amber-50 text-amber-600' : 
                    res.type === 'ship' ? 'bg-sky-50 text-sky-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {res.type === 'supply' ? <Box size={20} /> : res.type === 'ship' ? <Ship size={20} /> : <Activity size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{res.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${res.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="text-[11px] text-slate-400 font-medium">{res.status === 'available' ? '就绪' : '执行中'}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-sky-500" />
                </div>
              ))}
            </div>
          </div>
          </>
          )}
        </div>

        {/* Start Emergency Plan Button */}
        <div className="p-6 border-t border-slate-100">
          <button className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-white font-black text-sm shadow-lg transform transition-all active:scale-95 ${
            isTyphoon ? 'bg-sky-500 hover:bg-sky-600 shadow-sky-200' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'
          }`}>
            <Play size={18} fill="currentColor" />
            开启应急响应预案
          </button>
        </div>
      </aside>

      {/* Map Content */}
      <main className="flex-1 relative">
        <MapContainer
          center={[31.357522, 121.635475]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <MapAutoCenter coords={isTyphoon ? [31.32, 121.68] : [31.35, 121.55]} />

          {/* Typhoon Elements */}
          {isTyphoon && (
            <>
              <Marker position={[31.32, 121.68]} icon={TyphoonIcon} />
              <Circle 
                center={[31.32, 121.68]} 
                radius={8000} 
                pathOptions={{ color: 'red', dashArray: '8, 8', weight: 2, fillColor: 'red', fillOpacity: 0.05 }} 
              />
              <Circle 
                center={[31.32, 121.68]} 
                radius={15000} 
                pathOptions={{ color: 'red', dashArray: '8, 8', weight: 1.5, fillColor: 'red', fillOpacity: 0.03 }} 
              />
            </>
          )}

          {/* Oil Spill Elements */}
          {!isTyphoon && (
            <Circle 
              center={[31.35, 121.55]} 
              radius={4000} 
              pathOptions={{ color: '#334155', weight: 0, fillColor: '#0f172a', fillOpacity: 0.4 }} 
            />
          )}

          {/* Resource Markers */}
          {RESOURCES.map((res) => (
            <Marker 
              key={res.id} 
              position={res.coords} 
              icon={ResourceIcon(res.type, res.type === 'supply' ? 'amber' : res.type === 'ship' ? 'sky' : 'red')}
              eventHandlers={{
                click: () => setSelectedResource(res),
              }}
            />
          ))}
        </MapContainer>

        {/* Floating Bottom Card */}
        <AnimatePresence>
          {selectedResource && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
              <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.95 }}
                className="w-[520px] bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto"
              >
                <div className="flex h-full">
                  {/* Left Column - Category Icon */}
                  <div className={`w-[120px] shrink-0 flex items-center justify-center relative overflow-hidden bg-gradient-to-b ${
                    selectedResource.type === 'supply' ? 'from-amber-50 to-amber-100' : 
                    selectedResource.type === 'ship' ? 'from-sky-50 to-sky-100' : 'from-red-50 to-red-100'
                  }`}>
                    <div className={`absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,var(--tw-gradient-from),transparent_70%)]`} />
                    <div className={`p-5 rounded-2xl ${
                      selectedResource.type === 'supply' ? 'bg-amber-500 shadow-amber-200' : 
                      selectedResource.type === 'ship' ? 'bg-sky-500 shadow-sky-200' : 'bg-red-500 shadow-red-200'
                    } text-white shadow-lg z-10`}>
                      {selectedResource.type === 'supply' ? <Box size={40} /> : selectedResource.type === 'ship' ? <Ship size={40} /> : <Activity size={40} />}
                    </div>
                  </div>

                  {/* Right Column - Info */}
                  <div className="flex-1 p-6 relative">
                    <button 
                      onClick={() => setSelectedResource(null)}
                      className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>

                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-black text-slate-800">{selectedResource.name}</h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedResource.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {selectedResource.status === 'available' ? '就绪可用' : '任务中'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mb-5">ID: {selectedResource.idCode}</div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400"><MapPin size={14} /></div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">地理坐标</div>
                          <div className="text-xs font-bold text-slate-700">{selectedResource.coords[0].toFixed(4)}, {selectedResource.coords[1].toFixed(4)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400"><Phone size={14} /></div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">联系电话</div>
                          <div className="text-xs font-bold text-slate-700">{selectedResource.contact}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span className="text-[11px] font-medium">响应级别: 立即出动</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50">
                      查看详情
                    </button>
                    <button className={`px-4 py-2 rounded-lg text-white text-[12px] font-bold flex items-center gap-2 shadow-sm ${
                      selectedResource.type === 'supply' ? 'bg-amber-500' : 
                      selectedResource.type === 'ship' ? 'bg-sky-500' : 'bg-red-500'
                    }`}>
                      <Navigation size={14} />
                      立即调度
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .animate-spin-slow {
              animation: spin 8s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `,
        }}
      />
    </div>
  );
}
