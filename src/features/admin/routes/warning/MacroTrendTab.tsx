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
  Map as MapIcon,
  Flame
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  VTS_CHART_TILE_URL, 
  VTS_CHART_TILE_ATTRIBUTION, 
  HOME_MAP_DEFAULT_CENTER 
} from '../../../map/constants';

// --- Types ---
type TimeRange = '24h' | '7d' | '30d' | '自定义';
type WarningType = '全部' | '碰撞预警' | '区域入侵' | '超速预警' | '走锚预警';
type Jurisdiction = '全部' | '外高桥' | '洋山' | '吴淞' | '宝山';

type HotspotConfig = {
  id: string;
  name: string;
  jurisdiction: Exclude<Jurisdiction, '全部'>;
  center: [number, number];
  count: number;
  spread: number;
  weight: number;
  focus: string;
};

type WarningLocation = {
  id: string;
  lat: number;
  lng: number;
  intensity: number;
  hotspotId: string;
  hotspotName: string;
  type: WarningType | '常规监控';
  time: string;
};

const HOTSPOT_CONFIGS: HotspotConfig[] = [
  {
    id: 'wusongkou',
    name: '吴淞口警戒带',
    jurisdiction: '吴淞',
    center: [HOME_MAP_DEFAULT_CENTER[0], HOME_MAP_DEFAULT_CENTER[1]],
    count: 120,
    spread: 0.05,
    weight: 0.84,
    focus: '碰撞 / 交汇风险高发',
  },
  {
    id: 'waigaoqiao',
    name: '外高桥作业水域',
    jurisdiction: '外高桥',
    center: [HOME_MAP_DEFAULT_CENTER[0] + 0.12, HOME_MAP_DEFAULT_CENTER[1] + 0.08],
    count: 80,
    spread: 0.04,
    weight: 0.7,
    focus: '区域入侵 / 靠离泊扰动',
  },
  {
    id: 'beicao',
    name: '北槽核心航道',
    jurisdiction: '宝山',
    center: [HOME_MAP_DEFAULT_CENTER[0] - 0.08, HOME_MAP_DEFAULT_CENTER[1] - 0.05],
    count: 50,
    spread: 0.03,
    weight: 0.56,
    focus: '超速 / 航道压缩风险',
  },
  {
    id: 'jingjie',
    name: '东侧警戒区',
    jurisdiction: '洋山',
    center: [HOME_MAP_DEFAULT_CENTER[0] + 0.05, HOME_MAP_DEFAULT_CENTER[1] + 0.15],
    count: 40,
    spread: 0.06,
    weight: 0.46,
    focus: '边界试探 / 走锚告警',
  },
];

const WARNING_TYPES: WarningType[] = ['碰撞预警', '区域入侵', '超速预警', '走锚预警'];

const generateWarningLocations = () => {
  const locations: WarningLocation[] = [];

  HOTSPOT_CONFIGS.forEach((cluster, clusterIndex) => {
    for (let i = 0; i < cluster.count; i += 1) {
      locations.push({
        id: `w-${locations.length}`,
        lat: cluster.center[0] + (Math.random() - 0.5) * cluster.spread,
        lng: cluster.center[1] + (Math.random() - 0.5) * cluster.spread,
        intensity: Math.min(1, Math.random() * cluster.weight + 0.25),
        hotspotId: cluster.id,
        hotspotName: cluster.name,
        type: WARNING_TYPES[(clusterIndex + i) % WARNING_TYPES.length],
        time: '2026-05-11 10:24:12',
      });
    }
  });

  for (let i = 0; i < 50; i += 1) {
    locations.push({
      id: `noise-${i}`,
      lat: HOME_MAP_DEFAULT_CENTER[0] + (Math.random() - 0.5) * 0.4,
      lng: HOME_MAP_DEFAULT_CENTER[1] + (Math.random() - 0.5) * 0.4,
      intensity: Math.random() * 0.3,
      hotspotId: 'noise',
      hotspotName: '离散监测点',
      type: '常规监控',
      time: '2026-05-11 09:15:00',
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
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('全部');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const visibleHotspots = useMemo(() => {
    if (jurisdiction === '全部') return HOTSPOT_CONFIGS;
    return HOTSPOT_CONFIGS.filter((hotspot) => hotspot.jurisdiction === jurisdiction);
  }, [jurisdiction]);

  const filteredLocations = useMemo(() => {
    const visibleHotspotIds = new Set(visibleHotspots.map((hotspot) => hotspot.id));
    return WARNING_LOCATIONS.filter((loc) => {
      const matchesJurisdiction =
        loc.hotspotId === 'noise'
          ? jurisdiction === '全部'
          : visibleHotspotIds.has(loc.hotspotId);
      const matchesType = warningType === '全部' || loc.type === warningType;
      return matchesJurisdiction && matchesType;
    });
  }, [jurisdiction, visibleHotspots, warningType]);

  const hotspotSummaries = useMemo(() => {
    return visibleHotspots
      .map((hotspot) => {
        const events = filteredLocations.filter((item) => item.hotspotId === hotspot.id);
        const totalIntensity = events.reduce((sum, item) => sum + item.intensity, 0);
        const avgIntensity = events.length ? totalIntensity / events.length : 0;

        return {
          ...hotspot,
          eventCount: events.length,
          avgIntensity,
          heatLevel: avgIntensity > 0.78 ? '极高' : avgIntensity > 0.62 ? '高' : avgIntensity > 0.45 ? '中' : '低',
        };
      })
      .filter((hotspot) => hotspot.eventCount > 0)
      .sort((a, b) => b.avgIntensity - a.avgIntensity);
  }, [filteredLocations, visibleHotspots]);

  const totalIntensity = useMemo(
    () => filteredLocations.reduce((sum, item) => sum + item.intensity, 0),
    [filteredLocations],
  );

  const getHeatColor = (intensity: number) => {
    if (intensity > 0.78) return '#ef4444';
    if (intensity > 0.62) return '#f97316';
    if (intensity > 0.45) return '#eab308';
    return '#38bdf8';
  };

  const createHotspotIcon = (label: string, count: number, color: string) =>
    L.divIcon({
      className: 'warning-heat-hotspot',
      html: `
        <div style="display:flex;flex-direction:column;gap:4px;transform:translate(-50%,-50%);">
          <div style="align-self:flex-start;padding:4px 8px;border-radius:9999px;background:rgba(5,10,16,0.88);border:1px solid rgba(255,255,255,0.14);color:#fff;font-size:10px;font-weight:800;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,0.35);">
            ${label}
          </div>
          <div style="display:flex;align-items:center;gap:6px;align-self:flex-start;padding:4px 8px;border-radius:10px;background:rgba(5,10,16,0.82);border:1px solid rgba(255,255,255,0.1);white-space:nowrap;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${color};box-shadow:0 0 12px ${color};"></span>
            <span style="color:rgba(255,255,255,0.92);font-size:10px;font-weight:700;">${count} 起</span>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <Dropdown
            label="辖区"
            value={jurisdiction}
            options={['全部', '外高桥', '洋山', '吴淞', '宝山']}
            onChange={setJurisdiction}
          />
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
      <Panel className="relative flex-1 overflow-hidden flex min-h-0 flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/10 text-amber-500">
              <AlertTriangle size={14} />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">全辖区预警热力分布态势</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/40">
              <MapIcon size={10} />
              <span>地图底图 + 预警热力图叠加</span>
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
          <div className="absolute inset-x-6 top-4 z-[1000] flex gap-2 overflow-x-auto pb-2">
            {hotspotSummaries.slice(0, 4).map((hotspot, index) => (
              <div
                key={hotspot.id}
                className="min-w-fit rounded-xl border border-white/10 bg-[#07111b]/80 px-3 py-2 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                    <Flame size={10} />
                  </div>
                  <span className="text-[10px] font-black text-white">
                    TOP {index + 1} {hotspot.name}
                  </span>
                  <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[8px] font-bold text-sky-300">
                    {hotspot.jurisdiction}
                  </span>
                </div>
                <div className="mt-1 flex items-end gap-3">
                  <span className="text-[14px] font-black text-white">{hotspot.eventCount}</span>
                  <span className="text-[9px] text-white/45">起预警</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-orange-300">
                    热度 {hotspot.heatLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <MapContainer
            center={HOME_MAP_DEFAULT_CENTER}
            zoom={11}
            className="h-full w-full grayscale-[0.8] brightness-[0.7] contrast-[1.2]"
            zoomControl={false}
          >
            <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />

            {hotspotSummaries.map((hotspot) => {
              const heatColor = getHeatColor(hotspot.avgIntensity);
              return (
                <React.Fragment key={hotspot.id}>
                  <Circle
                    center={hotspot.center}
                    radius={1800 + hotspot.avgIntensity * 4200}
                    pathOptions={{
                      stroke: false,
                      fillColor: heatColor,
                      fillOpacity: 0.16,
                    }}
                  />
                  <Circle
                    center={hotspot.center}
                    radius={900 + hotspot.avgIntensity * 2400}
                    pathOptions={{
                      stroke: false,
                      fillColor: heatColor,
                      fillOpacity: 0.22,
                    }}
                  />
                  <Circle
                    center={hotspot.center}
                    radius={360 + hotspot.avgIntensity * 1200}
                    pathOptions={{
                      stroke: false,
                      fillColor: heatColor,
                      fillOpacity: 0.34,
                    }}
                  />
                  <Marker
                    position={hotspot.center}
                    icon={createHotspotIcon(hotspot.name, hotspot.eventCount, heatColor)}
                  >
                    <Tooltip direction="top" offset={[0, -24]} opacity={1} className="custom-map-popup">
                      <div className="min-w-[160px] p-2">
                        <div className="text-[10px] font-black text-sky-400">{hotspot.name}</div>
                        <div className="mt-1 text-[9px] text-white/70">{hotspot.focus}</div>
                        <div className="mt-2 flex items-center justify-between text-[9px] text-white/50">
                          <span>预警 {hotspot.eventCount} 起</span>
                          <span>热度 {hotspot.heatLevel}</span>
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                </React.Fragment>
              );
            })}

            {filteredLocations.map((loc) => (
              <CircleMarker
                key={loc.id}
                center={[loc.lat, loc.lng]}
                radius={2 + loc.intensity * 4}
                pathOptions={{
                  fillColor: getHeatColor(loc.intensity),
                  color: 'transparent',
                  fillOpacity: 0.16,
                  stroke: false
                }}
              />
            ))}
          </MapContainer>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(239,68,68,0.10),transparent_22%),radial-gradient(circle_at_66%_28%,rgba(249,115,22,0.10),transparent_18%),linear-gradient(180deg,rgba(3,8,15,0.08),rgba(3,8,15,0.28))]" />

          {/* Legend */}
          <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">预警热力图例</div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: '极高风险', color: 'bg-red-500' },
                { label: '预警频发', color: 'bg-orange-500' },
                { label: '中度波动', color: 'bg-yellow-500' },
                { label: '常规密度', color: 'bg-sky-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`h-2 w-4 rounded-full ${item.color} shadow-[0_0_12px_currentColor]`} />
                  <span className="text-[9px] text-white/60">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </Panel>
    </div>
  );
}
