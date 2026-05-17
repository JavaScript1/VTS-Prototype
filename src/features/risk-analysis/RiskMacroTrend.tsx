import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Flame,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { Circle, CircleMarker, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VTS_CHART_TILE_ATTRIBUTION, VTS_CHART_TILE_URL, HOME_MAP_DEFAULT_CENTER } from '../map/constants';
import { FilterSelect, Panel } from './RiskSharedComponents';
import {
  HOTSPOT_CONFIGS,
  JURISDICTION_OPTIONS,
  PLAYBACK_FRAMES,
  PLAYBACK_SPEED_OPTIONS,
  WARNING_TYPE_OPTIONS,
  type Jurisdiction,
  type TimeRange,
  type WarningType,
} from './riskMacroTrendData';

const PLAYBACK_STEP_MS = 1200;

const getHeatColor = (intensity: number) => {
  if (intensity > 0.78) return '#ef4444';
  if (intensity > 0.62) return '#f97316';
  if (intensity > 0.45) return '#eab308';
  return '#0ea5e9';
};

const getHeatLevel = (intensity: number) => {
  if (intensity > 0.78) return '极高';
  if (intensity > 0.62) return '高';
  if (intensity > 0.45) return '中';
  return '低';
};

const createHotspotIcon = ({
  label,
  count,
  color,
  active,
}: {
  label: string;
  count: number;
  color: string;
  active: boolean;
}) =>
  L.divIcon({
    className: 'warning-heat-hotspot-light',
    html: `
      <div style="display:flex;flex-direction:column;gap:4px;transform:translate(-50%,-50%);">
        <div style="align-self:flex-start;padding:4px 8px;border-radius:9999px;background:rgba(255,255,255,0.96);border:1px solid ${
          active ? 'rgba(14,165,233,0.35)' : 'rgba(0,0,0,0.1)'
        };color:#1e293b;font-size:10px;font-weight:800;white-space:nowrap;box-shadow:${
          active ? '0 12px 32px rgba(14,165,233,0.18)' : '0 8px 24px rgba(0,0,0,0.1)'
        };">
          ${active ? '实时回溯 · ' : ''}${label}
        </div>
        <div style="display:flex;align-items:center;gap:6px;align-self:flex-start;padding:4px 8px;border-radius:10px;background:rgba(255,255,255,0.88);border:1px solid rgba(0,0,0,0.06);white-space:nowrap;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${color};box-shadow:0 0 8px ${color};"></span>
          <span style="color:#475569;font-size:10px;font-weight:700;">${count} 起</span>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

type RiskMacroTrendProps = {
  showToolbar?: boolean;
  showTopRanking?: boolean;
  showLegend?: boolean;
  showTimeline?: boolean;
};

export default function RiskMacroTrend({
  showToolbar = true,
  showTopRanking = true,
  showLegend = true,
  showTimeline = true,
}: RiskMacroTrendProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [warningType, setWarningType] = useState<WarningType>('全部');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('全部');
  const [isPlaying, setIsPlaying] = useState(true);
  const [frameIndex, setFrameIndex] = useState(PLAYBACK_FRAMES.length - 3);
  const [playbackSpeed, setPlaybackSpeed] =
    useState<(typeof PLAYBACK_SPEED_OPTIONS)[number]>(1);

  const currentFrame = PLAYBACK_FRAMES[frameIndex];
  const playbackProgress =
    PLAYBACK_FRAMES.length > 1 ? (frameIndex / (PLAYBACK_FRAMES.length - 1)) * 100 : 0;

  useEffect(() => {
    if (!isPlaying) return undefined;

    const timer = window.setInterval(() => {
      setFrameIndex((prev) => (prev >= PLAYBACK_FRAMES.length - 1 ? 0 : prev + 1));
    }, PLAYBACK_STEP_MS / playbackSpeed);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const visibleHotspots = useMemo(() => {
    if (jurisdiction === '全部') return HOTSPOT_CONFIGS;
    return HOTSPOT_CONFIGS.filter((hotspot) => hotspot.jurisdiction === jurisdiction);
  }, [jurisdiction]);

  const filteredLocations = useMemo(() => {
    const visibleHotspotIds = new Set(visibleHotspots.map((hotspot) => hotspot.id));

    return currentFrame.locations.filter((location) => {
      const matchesJurisdiction =
        location.hotspotId === 'noise'
          ? jurisdiction === '全部'
          : visibleHotspotIds.has(location.hotspotId);
      const matchesType = warningType === '全部' || location.type === warningType;
      return matchesJurisdiction && matchesType;
    });
  }, [currentFrame.locations, jurisdiction, visibleHotspots, warningType]);

  const hotspotSummaries = useMemo(() => {
    return visibleHotspots
      .map((hotspot) => {
        const events = filteredLocations.filter((item) => item.hotspotId === hotspot.id);
        const totalWeight = events.reduce((sum, item) => sum + item.eventWeight, 0);
        const weightedIntensity = events.reduce(
          (sum, item) => sum + item.intensity * item.eventWeight,
          0,
        );
        const avgIntensity = totalWeight ? weightedIntensity / totalWeight : 0;

        return {
          ...hotspot,
          eventCount: Math.round(totalWeight),
          avgIntensity,
          heatLevel: getHeatLevel(avgIntensity),
        };
      })
      .filter((hotspot) => hotspot.eventCount > 0)
      .sort((a, b) => b.eventCount - a.eventCount);
  }, [filteredLocations, visibleHotspots]);

  const activeFocusHotspotId = useMemo(() => {
    const visibleIds = new Set(visibleHotspots.map((hotspot) => hotspot.id));
    return visibleIds.has(currentFrame.focusHotspotId)
      ? currentFrame.focusHotspotId
      : hotspotSummaries[0]?.id ?? null;
  }, [currentFrame.focusHotspotId, hotspotSummaries, visibleHotspots]);

  const highlightedHotspot = hotspotSummaries.find((item) => item.id === activeFocusHotspotId);

  const jumpFrame = (nextIndex: number) => {
    setFrameIndex(Math.max(0, Math.min(PLAYBACK_FRAMES.length - 1, nextIndex)));
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3">
      {showToolbar ? (
        <div className="shrink-0 rounded-xl border border-slate-200 bg-white/80 p-2.5 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-0.5">
                {JURISDICTION_OPTIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => setJurisdiction(item)}
                    className={`rounded-lg px-3 py-1 text-[10px] font-black transition-all ${
                      jurisdiction === item
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <FilterSelect
                value={warningType}
                options={WARNING_TYPE_OPTIONS}
                onChange={(value) => setWarningType(value as WarningType)}
              />

              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                {([
                  { id: '24h', label: '24小时' },
                  { id: '自定义', label: '自定义' },
                ] as const).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTimeRange(item.id)}
                    className={`rounded-md px-3 py-1 text-[10px] font-black transition-all ${
                      timeRange === item.id
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {timeRange === '自定义' ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-500">
                <Calendar size={12} className="text-sky-500" />
                <span>04-11 ~ 05-11</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative min-h-0 flex-1">
          {showTopRanking ? (
            <div className="absolute left-6 top-4 z-[1000] w-[240px]">
              <Panel className="border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-red-100 text-red-500">
                      <Flame size={12} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                      TOP 风险区域
                    </span>
                  </div>
                  <span className="text-[8px] font-bold text-sky-500">{currentFrame.timeLabel}</span>
                </div>

                <div className="space-y-3">
                  {hotspotSummaries.slice(0, 4).map((hotspot, index) => {
                    const maxCount = hotspotSummaries[0]?.eventCount || 1;
                    const percentage = (hotspot.eventCount / maxCount) * 100;
                    const active = hotspot.id === activeFocusHotspotId;

                    return (
                      <div key={hotspot.id} className="space-y-1.5 transition-all">
                        <div className="flex items-center justify-between gap-3 text-[10px]">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="w-3 font-mono font-black italic text-slate-300">
                              0{index + 1}
                            </span>
                            <span
                              className={`truncate font-bold transition-colors ${
                                active ? 'text-slate-900' : 'text-slate-600'
                              }`}
                            >
                              {hotspot.name}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span className="font-black text-slate-900">{hotspot.eventCount}</span>
                            {hotspot.trend === 'up' ? (
                              <ArrowUpRight size={10} className="text-red-500" />
                            ) : (
                              <ArrowDownRight size={10} className="text-emerald-500" />
                            )}
                          </div>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full shadow-sm transition-all duration-700 ${
                              active
                                ? 'bg-gradient-to-r from-sky-400 to-sky-600'
                                : 'bg-gradient-to-r from-slate-300 to-slate-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </div>
          ) : null}

          <MapContainer
            center={HOME_MAP_DEFAULT_CENTER}
            zoom={11}
            className="h-full w-full grayscale-[0.16] brightness-[1.04]"
            zoomControl={false}
          >
            <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />

            {hotspotSummaries.map((hotspot) => {
              const heatColor = getHeatColor(hotspot.avgIntensity);
              const active = hotspot.id === activeFocusHotspotId;

              return (
                <Fragment key={hotspot.id}>
                  <Circle
                    key={`${hotspot.id}-outer`}
                    center={hotspot.center}
                    radius={1700 + hotspot.avgIntensity * 4200}
                    pathOptions={{
                      stroke: false,
                      fillColor: heatColor,
                      fillOpacity: active ? 0.14 : 0.09,
                    }}
                  />
                  <Circle
                    key={`${hotspot.id}-inner`}
                    center={hotspot.center}
                    radius={420 + hotspot.avgIntensity * 1200}
                    pathOptions={{
                      stroke: false,
                      fillColor: heatColor,
                      fillOpacity: active ? 0.22 : 0.15,
                    }}
                  />
                  <Marker
                    key={`${hotspot.id}-marker`}
                    position={hotspot.center}
                    icon={createHotspotIcon({
                      label: hotspot.name,
                      count: hotspot.eventCount,
                      color: heatColor,
                      active,
                    })}
                  >
                    <Tooltip
                      direction="top"
                      offset={[0, -24]}
                      opacity={1}
                      className="custom-map-popup-light"
                    >
                      <div className="min-w-[170px] rounded-lg border border-slate-100 bg-white p-2 shadow-xl">
                        <div className="text-[10px] font-black text-sky-600">{hotspot.name}</div>
                        <div className="mt-1 text-[9px] text-slate-500">{hotspot.focus}</div>
                        <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
                          <span>预警 {hotspot.eventCount} 起</span>
                          <span>热度 {hotspot.heatLevel}</span>
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                </Fragment>
              );
            })}

            {filteredLocations.map((location) => (
              <CircleMarker
                key={location.id}
                center={[location.lat, location.lng]}
                radius={2 + location.intensity * 4}
                pathOptions={{
                  fillColor: getHeatColor(location.intensity),
                  color: 'transparent',
                  fillOpacity: location.hotspotId === activeFocusHotspotId ? 0.28 : 0.16,
                  stroke: false,
                }}
              />
            ))}
          </MapContainer>

          {showTimeline ? (
            <div className="absolute bottom-6 left-1/2 z-[1000] w-[640px] -translate-x-1/2">
              <div className="rounded-2xl border border-slate-200 bg-white/92 p-3 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => jumpFrame(frameIndex - 1)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                      <SkipBack size={14} />
                    </button>
                    <button
                      onClick={() => setIsPlaying((value) => !value)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                    >
                      {isPlaying ? (
                        <Pause size={16} fill="currentColor" />
                      ) : (
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={() => jumpFrame(frameIndex + 1)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                    >
                      <SkipForward size={14} />
                    </button>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>回放时间轴</span>
                      <span className="text-sky-600">{currentFrame.timeLabel}</span>
                    </div>
                    <div className="relative">
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="absolute left-0 top-0 h-1.5 rounded-full bg-sky-500 shadow-sm"
                          style={{ width: `${playbackProgress}%` }}
                        />
                        <div
                          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-sky-500 bg-white shadow-lg"
                          style={{ left: `calc(${playbackProgress}% - 6px)` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={PLAYBACK_FRAMES.length - 1}
                        step={1}
                        value={frameIndex}
                        onChange={(event) => jumpFrame(Number(event.target.value))}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {PLAYBACK_SPEED_OPTIONS.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition-all ${
                          playbackSpeed === speed
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showLegend ? (
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur-md">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                风险热力图例
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: '极高风险', color: 'bg-red-500' },
                  { label: '预警频发', color: 'bg-orange-500' },
                  { label: '中度波动', color: 'bg-yellow-500' },
                  { label: '常规密度', color: 'bg-sky-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`h-2 w-4 rounded-full ${item.color} shadow-sm`} />
                    <span className="text-[9px] text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
              {highlightedHotspot ? (
                <div className="mt-2 rounded-lg bg-slate-50 p-2 text-[9px] leading-4 text-slate-500">
                  <div className="font-bold text-slate-700">{highlightedHotspot.name}</div>
                  <div className="mt-1">{highlightedHotspot.focus}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
