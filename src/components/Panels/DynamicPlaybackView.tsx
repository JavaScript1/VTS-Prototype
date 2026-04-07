import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Pause, 
  Play, 
  Map as MapIcon, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Activity, 
  MessageSquare 
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Popup, Marker, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import {
  MOCK_AREAS,
  type MockArea,
  type PlaybackSessionLike,
} from '../../mockData';

interface DynamicPlaybackViewProps {
  session: PlaybackSessionLike;
  onClose: () => void;
}

interface AreaMapElement {
  id: string;
  name: string;
  type: string;
  center: [number, number];
  bounds: [number, number][];
}

const DynamicPlaybackView: React.FC<DynamicPlaybackViewProps> = ({ 
  session, 
  onClose 
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(MOCK_AREAS)));
  
  // 生成模拟轨迹数据 (基于原始坐标点)
  const trajectory = useMemo(() => {
    const center = session.event.coords;
    const points: [number, number][] = [];
    const steps = 100;
    
    // 模拟一段带有转弯的轨迹
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const lat = center[0] - 0.02 + 0.04 * t + Math.sin(t * 5) * 0.005;
      const lng = center[1] - 0.02 + 0.04 * t + Math.cos(t * 5) * 0.005;
      points.push([lat, lng]);
    }
    return points;
  }, [session]);

  const currentPos = trajectory[Math.floor((progress / 100) * (trajectory.length - 1))];

  useEffect(() => {
    let interval: any;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5 * playbackSpeed, 100));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, progress]);

  const toggleArea = (id: string) => {
    const newSelected = new Set(selectedAreas);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAreas(newSelected);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleAllInCategory = (_category: string, areas: MockArea[]) => {
    const newSelected = new Set(selectedAreas);
    const allSelected = areas.every(a => selectedAreas.has(a.id));
    
    areas.forEach(a => {
      if (allSelected) {
        newSelected.delete(a.id);
      } else {
        newSelected.add(a.id);
      }
    });
    setSelectedAreas(newSelected);
  };

  // 为选中的区域生成模拟地图元素
  const areaMapElements = useMemo(() => {
    const elements: AreaMapElement[] = [];
    Object.values(MOCK_AREAS).flat().forEach(area => {
      if (selectedAreas.has(area.id)) {
        // 随机生成一个中心点附近的区域
        const center = session.event.coords;
        const offsetLat = (Math.random() - 0.5) * 0.04;
        const offsetLng = (Math.random() - 0.5) * 0.04;
        const areaCenter: [number, number] = [center[0] + offsetLat, center[1] + offsetLng];
        
        elements.push({
          id: area.id,
          name: area.name,
          type: area.type,
          center: areaCenter,
          // 模拟一个多边形
          bounds: [
            [areaCenter[0] - 0.005, areaCenter[1] - 0.005],
            [areaCenter[0] + 0.005, areaCenter[1] - 0.005],
            [areaCenter[0] + 0.005, areaCenter[1] + 0.005],
            [areaCenter[0] - 0.005, areaCenter[1] + 0.005],
          ] as [number, number][]
        });
      }
    });
    return elements;
  }, [selectedAreas, session.event.coords]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col"
    >
      {/* 顶部控制栏 */}
      <div className="h-20 bg-black/80 backdrop-blur-xl border-b border-white/10 flex flex-col z-[10]">
        <div className="flex-1 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">动态轨迹回放: {session.vessel.name}</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                事件时间: {session.event.time} | 风险类型: {session.event.label}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg ${
                isPlaying 
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30' 
                  : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20'
              }`}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              <span className="uppercase tracking-widest">{isPlaying ? '暂停' : '播放'}</span>
            </button>

            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              {[1, 2, 4, 8].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-1 text-[10px] font-black rounded transition-all ${
                    playbackSpeed === speed ? 'bg-sky-500 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {speed}X
                </button>
              ))}
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all"
            >
              退出回放
            </button>
          </div>
        </div>

        {/* 顶部时间轴 */}
        <div className="h-8 px-6 flex items-center gap-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">时间轴</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full relative">
            <div 
              className="absolute top-0 left-0 h-full bg-sky-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
              style={{ width: `${progress}%` }}
            />
            {/* 时间刻度 */}
            {[0, 25, 50, 75, 100].map(p => (
              <div 
                key={p} 
                className="absolute top-[-4px] w-px h-3 bg-white/20"
                style={{ left: `${p}%` }}
              >
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/20 whitespace-nowrap">
                  {p === 0 ? 'T-15m' : p === 50 ? 'T-0' : p === 100 ? 'T+15m' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧区域面板 - 树形结构 */}
        <div className="w-64 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col z-[10]">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon size={16} className="text-sky-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">辖区管理面板</h3>
            </div>
            <span className="text-[9px] font-bold text-sky-400/60 uppercase tracking-widest bg-sky-500/10 px-1.5 py-0.5 rounded">
              已选 {selectedAreas.size}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <div className="space-y-1">
              {Object.entries(MOCK_AREAS).map(([category, areas]) => {
                const isExpanded = expandedCategories.has(category);
                const allSelected = areas.every(a => selectedAreas.has(a.id));
                const someSelected = areas.some(a => selectedAreas.has(a.id)) && !allSelected;

                return (
                  <div key={category} className="space-y-0.5">
                    {/* 分类节点 */}
                    <div className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg transition-all group">
                      <button 
                        onClick={() => toggleCategory(category)}
                        className="p-0.5 hover:bg-white/10 rounded text-white/40 transition-all"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <div 
                        onClick={() => toggleAllInCategory(category, areas)}
                        className="flex-1 flex items-center gap-2 cursor-pointer"
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                          allSelected ? 'bg-sky-500 border-sky-500' : someSelected ? 'bg-sky-500/40 border-sky-500/60' : 'border-white/20'
                        }`}>
                          {allSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                          {someSelected && <div className="w-1.5 h-0.5 bg-white rounded-full" />}
                        </div>
                        <span className="text-[11px] font-bold text-white/60 group-hover:text-white transition-colors">{category}</span>
                      </div>
                    </div>

                    {/* 子区域列表 */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-6 space-y-0.5"
                        >
                          {areas.map(area => (
                            <div 
                              key={area.id}
                              onClick={() => toggleArea(area.id)}
                              className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer group transition-all"
                            >
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                selectedAreas.has(area.id) ? 'bg-sky-500 border-sky-500' : 'border-white/20'
                              }`}>
                                {selectedAreas.has(area.id) && <Check size={10} className="text-white" strokeWidth={4} />}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[11px] transition-colors ${selectedAreas.has(area.id) ? 'text-white font-bold' : 'text-white/40 group-hover:text-white/60'}`}>
                                  {area.name}
                                </span>
                                <span className="text-[8px] text-white/20">{area.type}</span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-white/10 bg-white/[0.02]">
            <button 
              onClick={() => setSelectedAreas(new Set())}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/40 hover:text-white text-[10px] font-bold transition-all"
            >
              重置选择
            </button>
          </div>
        </div>

        {/* 地图区域 */}
        <div className="flex-1 relative">
          <MapContainer 
            center={session.event.coords} 
            zoom={14} 
            className="h-full w-full"
            zoomControl={false}
          >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri'
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          />
          
          {/* 渲染选中的辖区 */}
          {areaMapElements.map(element => (
            <React.Fragment key={element.id}>
              <Polygon 
                positions={element.bounds}
                pathOptions={{ 
                  color: '#0ea5e9', 
                  fillColor: '#0ea5e9', 
                  fillOpacity: 0.2, 
                  weight: 2,
                  dashArray: '5, 5'
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="text-xs font-bold text-sky-500 mb-1">{element.name}</h4>
                    <p className="text-[10px] text-gray-500">类型: {element.type}</p>
                  </div>
                </Popup>
              </Polygon>
              <Marker 
                position={element.center}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div class="flex flex-col items-center">
                      <div class="px-2 py-1 bg-sky-500/80 backdrop-blur-md border border-white/20 rounded text-[9px] font-bold text-white whitespace-nowrap shadow-lg">
                        ${element.name}
                      </div>
                      <div class="w-2 h-2 bg-sky-500 rotate-45 -mt-1 border-r border-b border-white/20"></div>
                    </div>
                  `,
                  iconSize: [100, 40],
                  iconAnchor: [50, 40]
                })}
              />
            </React.Fragment>
          ))}
          
          {/* 完整轨迹线 */}
          <Polyline 
            positions={trajectory} 
            pathOptions={{ color: '#38bdf8', weight: 3, opacity: 0.3, dashArray: '10, 10' }} 
          />
          
          {/* 已走过的轨迹线 */}
          <Polyline 
            positions={trajectory.slice(0, Math.floor((progress / 100) * (trajectory.length - 1)) + 1)} 
            pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.8 }} 
          />

          {/* 风险点标记 */}
          <CircleMarker 
            center={session.event.coords} 
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.4 }} 
            radius={15}
          >
            <Popup>
              <div className="p-2 text-xs font-bold text-red-500">
                风险触发点: {session.event.label}
              </div>
            </Popup>
          </CircleMarker>

          {/* 当前船舶位置 */}
          {currentPos && (
            <Marker 
              position={currentPos}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `
                  <div class="relative">
                    <div class="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-sky-500/50">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="3" fill="none" style="transform: rotate(45deg)">
                        <path d="M12 2L19 21L12 17L5 21L12 2Z" />
                      </svg>
                    </div>
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[9px] font-bold text-white whitespace-nowrap">
                      ${session.vessel.name}
                    </div>
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            />
          )}
        </MapContainer>

        {/* 底部进度条 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[80%] max-w-4xl z-[10]">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-6 shadow-2xl">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-sky-500 hover:bg-sky-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-sky-500/20"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest">
                <span>回放进度</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden relative group cursor-pointer">
                <div 
                  className="h-full bg-sky-500 transition-all duration-100" 
                  style={{ width: `${progress}%` }}
                />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={progress}
                  onChange={(e) => setProgress(parseFloat(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">实时航速</span>
              <span className="text-xl font-mono font-bold text-white">
                {(12 + Math.sin(progress / 10) * 2).toFixed(1)} <span className="text-xs text-white/40">KN</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧事件面板 */}
        <div className="absolute top-24 right-8 w-72 z-[10] space-y-4">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-sky-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">实时状态监控</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase">当前经度</span>
                <span className="text-[10px] font-mono text-white/80">{currentPos?.[1].toFixed(5)}°E</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase">当前纬度</span>
                <span className="text-[10px] font-mono text-white/80">{currentPos?.[0].toFixed(5)}°N</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase">预警状态</span>
                <span className={`text-[10px] font-bold uppercase ${progress > 80 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {progress > 80 ? '风险触发' : '正常航行'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-sky-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">历史通讯记录</h4>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {session.event.dialogue.map((chat: any, idx: number) => (
                <div key={idx} className={`space-y-0.5 ${progress < (idx + 1) * 20 ? 'opacity-20' : 'opacity-100 transition-opacity duration-500'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-white/30 uppercase">{chat.sender}</span>
                    <span className="text-[8px] font-mono text-white/20">{chat.time.split(' ')[1]}</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed bg-white/5 p-1 rounded-lg border border-white/5">
                    {chat.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DynamicPlaybackView;
