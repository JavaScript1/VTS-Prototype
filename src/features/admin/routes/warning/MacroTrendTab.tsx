import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  Download,
  AlertTriangle,
  Waves,
  Maximize2,
  Minimize2,
  Info,
  Map as MapIcon
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  VTS_CHART_TILE_URL, 
  VTS_CHART_TILE_ATTRIBUTION, 
  HOME_MAP_DEFAULT_CENTER 
} from '../../../map/constants';

// --- Types ---
type TimeRange = '24h' | '7d' | '30d' | '自定义';
type WarningType = '全部' | '碰撞预警' | '区域入侵' | '超速预警' | '走锚预警';

// --- Mock Data for Map Heatmap ---
const generateWarningLocations = () => {
  const locations = [];
  const baseLat = HOME_MAP_DEFAULT_CENTER[0];
  const baseLng = HOME_MAP_DEFAULT_CENTER[1];
  
  // Create clusters around specific areas
  const clusters = [
    { lat: baseLat, lng: baseLng, count: 120, radius: 0.05, intensity: 0.8 }, // 吴淞口
    { lat: baseLat + 0.12, lng: baseLng + 0.08, count: 80, radius: 0.04, intensity: 0.6 }, // 外高桥
    { lat: baseLat - 0.08, lng: baseLng - 0.05, count: 50, radius: 0.03, intensity: 0.5 }, // 核心航道
    { lat: baseLat + 0.05, lng: baseLng + 0.15, count: 40, radius: 0.06, intensity: 0.4 }, // 警戒区
  ];

  clusters.forEach(cluster => {
    for (let i = 0; i < cluster.count; i++) {
      locations.push({
        id: `w-${locations.length}`,
        lat: cluster.lat + (Math.random() - 0.5) * cluster.radius,
        lng: cluster.lng + (Math.random() - 0.5) * cluster.radius,
        intensity: Math.random() * cluster.intensity + 0.2,
        type: ['碰撞预警', '区域入侵', '超速预警', '走锚预警'][Math.floor(Math.random() * 4)],
        time: '2026-05-11 10:24:12'
      });
    }
  });

  // Add some random noise
  for (let i = 0; i < 50; i++) {
    locations.push({
      id: `noise-${i}`,
      lat: baseLat + (Math.random() - 0.5) * 0.4,
      lng: baseLng + (Math.random() - 0.5) * 0.4,
      intensity: Math.random() * 0.3,
      type: '常规监控',
      time: '2026-05-11 09:15:00'
    });
  }

  return locations;
};

const WARNING_LOCATIONS = generateWarningLocations();

// --- Sub-components ---
const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-[#15304b] bg-[radial-gradient(circle_at_top,_rgba(20,44,74,0.32),_rgba(10,15,24,0.96)_58%)] shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

function Dropdown({ 
  label, 
  value, 
  options, 
  onChange 
}: { 
  label: string; 
  value: string; 
  options: string[]; 
  onChange: (val: any) => void 
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-wider text-white/30 ml-1">{label}</span>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-36 rounded-lg border border-white/10 bg-[#111823] py-1.5 pl-3 pr-8 text-[11px] font-bold text-white outline-none transition-all focus:border-[#18c4ff]/50 hover:bg-[#1a222d]"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-[#0a1018]">{opt}</option>
          ))}
        </select>
        <ChevronDown size={10} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-white/60" />
      </div>
    </div>
  );
}

// --- Main Component ---
export default function MacroTrendTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [warningType, setWarningType] = useState<WarningType>('全部');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter locations based on type
  const filteredLocations = useMemo(() => {
    if (warningType === '全部') return WARNING_LOCATIONS;
    return WARNING_LOCATIONS.filter(loc => loc.type === warningType);
  }, [warningType]);

  const getHeatColor = (intensity: number) => {
    if (intensity > 0.8) return '#ef4444'; // Red
    if (intensity > 0.6) return '#f97316'; // Orange
    if (intensity > 0.4) return '#eab308'; // Yellow
    return '#38bdf8'; // Sky Blue
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <Dropdown 
            label="预警类型" 
            value={warningType} 
            options={['全部', '碰撞预警', '区域入侵', '超速预警', '走锚预警']} 
            onChange={setWarningType} 
          />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider text-white/30 ml-1">时间维度</span>
            <div className="flex bg-[#111823] rounded-lg p-0.5 border border-white/10">
              {([
                { id: '24h', label: '24小时' },
                { id: '7d', label: '7天' },
                { id: '30d', label: '30天' },
                { id: '自定义', label: '自定义' }
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    timeRange === t.id 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {timeRange === '自定义' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#111823] text-[10px] text-white/60">
              <Calendar size={12} />
              <span>2026-04-11 ~ 2026-05-11</span>
            </div>
          )}
          <button className="flex items-center gap-2 rounded-lg bg-[#18c4ff] px-4 py-1.5 text-[11px] font-black text-white shadow-md transition-all hover:bg-[#35ccff] active:scale-95">
            <Search size={12} />
            执行聚合分析
          </button>
        </div>
      </div>

      {/* Main Map Heatmap Area */}
      <Panel className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/10 text-amber-500">
              <AlertTriangle size={14} />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">全辖区预警热力分布态势 (GIS版)</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/40">
              <MapIcon size={10} />
              <span>基于实际坐标的空间聚合分析</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
              <Download size={14} />
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        <div className="flex-1 relative min-h-0">
          <MapContainer
            center={HOME_MAP_DEFAULT_CENTER}
            zoom={11}
            className="h-full w-full grayscale-[0.8] brightness-[0.7] contrast-[1.2]"
            zoomControl={false}
          >
            <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />
            
            {/* Heatmap simulation using many semi-transparent circles */}
            {filteredLocations.map((loc) => (
              <CircleMarker
                key={loc.id}
                center={[loc.lat, loc.lng]}
                radius={8 + loc.intensity * 20}
                pathOptions={{
                  fillColor: getHeatColor(loc.intensity),
                  color: 'transparent',
                  fillOpacity: 0.1,
                  stroke: false
                }}
              >
                <Popup className="custom-map-popup">
                  <div className="p-2 min-w-[120px]">
                    <div className="text-[10px] font-black text-sky-400 mb-1">{loc.type}</div>
                    <div className="text-[9px] text-white/60">{loc.time}</div>
                    <div className="mt-1 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-amber-500" />
                      <span className="text-[9px] text-white/40">风险指数: {(loc.intensity * 10).toFixed(1)}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">预警密度图例</div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: '极高风险', color: 'bg-red-500' },
                { label: '预警频发', color: 'bg-orange-500' },
                { label: '中度波动', color: 'bg-yellow-500' },
                { label: '常规密度', color: 'bg-sky-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`h-1.5 w-3 rounded-full ${item.color}`} />
                  <span className="text-[9px] text-white/60">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Overlay */}
          <div className="absolute top-6 left-6 z-[1000] p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/5 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <Info size={10} className="text-sky-400" />
              <span className="text-[9px] font-bold text-white/80">空间态势分析</span>
            </div>
            <p className="text-[8px] leading-relaxed text-white/40 max-w-[180px]">
              当前热力图集成了GIS地理信息，通过对全辖区预警事件的经纬度进行聚类分析得出。高亮区域表明在该时间段内发生了密集的违规或风险事件。
            </p>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center gap-6 p-4 bg-white/[0.02] border-t border-white/5 overflow-x-auto shrink-0">
          {[
            { label: '重点分析区域', value: '吴淞口/北槽航道' },
            { label: '分析样本总数', value: `${filteredLocations.length} 处` },
            { label: '空间聚合度', value: '84.2%', color: 'text-sky-400' },
            { label: '地理分布偏差', value: '±2.4m' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-0.5 min-w-fit">
              <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{stat.label}</span>
              <span className={`text-[12px] font-black ${stat.color || 'text-white'}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
