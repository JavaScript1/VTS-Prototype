import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  Download,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Map as MapIcon,
  Flame,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MapContainer, TileLayer, Circle, CircleMarker, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  VTS_CHART_TILE_URL, 
  VTS_CHART_TILE_ATTRIBUTION, 
  HOME_MAP_DEFAULT_CENTER 
} from '../../../map/constants';
import { Panel, FilterSelect } from './SharedComponents';

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
  trend: 'up' | 'down';
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
    trend: 'up'
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
    trend: 'down'
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
    trend: 'up'
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
    trend: 'up'
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

// --- Main Component ---
export default function MacroTrendTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [warningType, setWarningType] = useState<WarningType>('全部');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('全部');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(35);

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
      {/* 紧凑型 Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <FilterSelect
            label="管理辖区"
            value={jurisdiction}
            options={['全部', '外高桥', '洋山', '吴淞', '宝山']}
            onChange={setJurisdiction}
          />
          <FilterSelect 
            label="预警统计类型" 
            value={warningType} 
            options={['全部', '碰撞预警', '区域入侵', '超速预警', '走锚预警']} 
            onChange={setWarningType} 
          />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider text-white/30 ml-1">统计回溯</span>
            <div className="flex bg-[#111823] rounded-lg p-0.5 border border-white/8">
              {([
                { id: '24h', label: '24小时' },
                { id: '7d', label: '7天' },
                { id: '30d', label: '30天' },
                { id: '自定义', label: '自定义' }
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                    timeRange === t.id 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {timeRange === '自定义' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/8 bg-[#111823] text-[10px] font-bold text-white/60">
              <Calendar size={12} className="text-sky-400" />
              <span>04-11 ~ 05-11</span>
            </div>
          )}
        </div>
      </div>

      <Panel className="relative flex-1 overflow-hidden flex min-h-0 flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/10 text-amber-500">
              <AlertTriangle size={14} />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">全辖区风险热力拓扑呈现</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-[9px] font-bold text-white/30">
              <MapIcon size={10} />
              <span>空间分布统计</span>
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
          {/* 合并后的 TOP 风险区域统计图面板 */}
          <div className="absolute left-6 top-4 z-[1000] w-[240px]">
            <Panel className="border-white/10 bg-[#07111b]/85 p-3 backdrop-blur-md shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-red-500/20 text-red-400">
                    <Flame size={12} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/90">TOP 风险区域</span>
                </div>
                <span className="text-[8px] font-bold text-white/20">实时回溯</span>
              </div>
              
              <div className="space-y-3">
                {hotspotSummaries.slice(0, 4).map((hotspot, index) => {
                  const maxCount = hotspotSummaries[0]?.eventCount || 1;
                  const percentage = (hotspot.eventCount / maxCount) * 100;
                  
                  return (
                    <div key={hotspot.id} className="group space-y-1.5 transition-all">
                      <div className="flex items-center justify-between gap-3 text-[10px]">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="w-3 font-mono font-black italic text-white/20">0{index + 1}</span>
                          <span className="truncate font-bold text-white/70 group-hover:text-white transition-colors">
                            {hotspot.name}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="font-black text-white">{hotspot.eventCount}</span>
                          {hotspot.trend === 'up' ? (
                            <ArrowUpRight size={10} className="text-red-400/80" />
                          ) : (
                            <ArrowDownRight size={10} className="text-green-400/80" />
                          )}
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-sky-500/40 to-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.3)] transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
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

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(239,68,68,0.10),transparent_22%),linear-gradient(180deg,rgba(3,8,15,0.08),rgba(3,8,15,0.48))]" />

          {/* 时间轴播放器 - 地理与时间维度融合 */}
          <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2 w-[600px]">
            <div className="rounded-2xl border border-white/10 bg-black/60 p-3 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
                    <SkipBack size={14} />
                  </button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/40"
                  >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
                    <SkipForward size={14} />
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                    <span>回放时间轴</span>
                    <span className="text-sky-400">2026-05-11 12:45:00</span>
                  </div>
                  <div className="relative h-1.5 w-full rounded-full bg-white/10">
                    <div 
                      className="absolute h-full rounded-full bg-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                      style={{ width: `${playbackProgress}%` }}
                    />
                    <div 
                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-sky-500 bg-[#0a1018] shadow-lg"
                      style={{ left: `${playbackProgress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-[14px] font-black text-white">1x</span>
                  <span className="text-[8px] text-white/30 uppercase font-bold">倍速</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">风险热力图例</div>
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
