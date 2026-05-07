import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_AREAS } from '../../mockData';
import { VTS_CHART_TILE_ATTRIBUTION, VTS_CHART_TILE_URL } from '../../features/map/constants';
import type { MockArea } from '../../types';
import PlaybackInfoSidebar from './playback/PlaybackInfoSidebar';

export interface PlaybackSessionLike {
  vessel: any;
  event: any;
}

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

const createAreaMarkerIcon = (name: string) =>
  L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="flex flex-col items-center">
        <div class="whitespace-nowrap rounded border border-white/20 bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#2f2f2f] shadow-lg backdrop-blur-md">
          ${name}
        </div>
      </div>
    `,
    iconSize: [120, 30],
    iconAnchor: [60, 30],
  });

const createPlaybackShipIcon = (name: string) =>
  L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative">
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#1bb7ff] shadow-lg shadow-[#1bb7ff]/40">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="3" fill="none" style="transform: rotate(45deg)">
            <path d="M12 2L19 21L12 17L5 21L12 2Z" />
          </svg>
        </div>
        <div class="absolute left-1/2 top-10 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-black/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          ${name}
        </div>
      </div>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 16],
  });

function formatPlaybackTime(time: string, progress: number) {
  const parsed = new Date(time.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return time;
  const offsetMinutes = Math.round((progress / 100) * 18 - 9);
  parsed.setMinutes(parsed.getMinutes() + offsetMinutes);
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

export default function DynamicPlaybackView({ session, onClose }: DynamicPlaybackViewProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(
    () => new Set(Object.values(MOCK_AREAS).flat().slice(0, 12).map((area) => area.id)),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(MOCK_AREAS)),
  );

  const trajectory = useMemo(() => {
    const center = session.event.coords;
    const points: [number, number][] = [];
    const steps = 100;

    for (let i = 0; i < steps; i += 1) {
      const t = i / steps;
      const lat = center[0] - 0.02 + 0.04 * t + Math.sin(t * 5) * 0.005;
      const lng = center[1] - 0.02 + 0.04 * t + Math.cos(t * 5) * 0.005;
      points.push([lat, lng]);
    }

    return points;
  }, [session]);

  const currentPos = trajectory[Math.floor((progress / 100) * (trajectory.length - 1))];
  const displayTime = formatPlaybackTime(session.event.time, progress);

  const areaMapElements = useMemo(() => {
    const elements: AreaMapElement[] = [];
    Object.values(MOCK_AREAS)
      .flat()
      .forEach((area, index) => {
        if (!selectedAreas.has(area.id)) return;
        const center = session.event.coords;
        const offsetLat = ((index % 4) - 1.5) * 0.01;
        const offsetLng = (Math.floor(index / 4) % 4 - 1.5) * 0.012;
        const areaCenter: [number, number] = [center[0] + offsetLat, center[1] + offsetLng];

        elements.push({
          id: area.id,
          name: area.name,
          type: area.type,
          center: areaCenter,
          bounds: [
            [areaCenter[0] - 0.005, areaCenter[1] - 0.005],
            [areaCenter[0] + 0.005, areaCenter[1] - 0.005],
            [areaCenter[0] + 0.005, areaCenter[1] + 0.005],
            [areaCenter[0] - 0.005, areaCenter[1] + 0.005],
          ],
        });
      });
    return elements;
  }, [selectedAreas, session.event.coords]);

  useEffect(() => {
    if (!isPlaying || progress >= 100) return undefined;
    const interval = window.setInterval(() => {
      setProgress((prev) => Math.min(prev + 0.15 * playbackSpeed, 100));
    }, 50);
    return () => window.clearInterval(interval);
  }, [isPlaying, playbackSpeed, progress]);

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleAllInCategory = (_category: string, areas: MockArea[]) => {
    setSelectedAreas((prev) => {
      const next = new Set(prev);
      const allSelected = areas.every((area) => prev.has(area.id));
      areas.forEach((area) => {
        if (allSelected) {
          next.delete(area.id);
        } else {
          next.add(area.id);
        }
      });
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-black"
    >
      <div className="border-b border-white/8 bg-black px-4 py-3">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            <button
              onClick={onClose}
              className="mt-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/72 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-[24px] font-bold text-white">动态轨迹回放: {session.vessel.name}</h2>
              <div className="mt-1 text-[12px] text-white/40">
                事件时间: {session.event.time}
                <span className="mx-3 text-white/18">|</span>
                风险类型: {session.event.label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl bg-[#18bfff] px-5 py-2 text-[13px] font-bold text-white shadow-[0_8px_24px_rgba(24,191,255,0.22)] transition-all hover:bg-[#33c8ff]"
            >
              {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {isPlaying ? '暂停' : '播放'}
            </button>

            <div className="flex items-center gap-1 rounded-xl bg-[#111] p-1">
              {[1, 2, 4, 8].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`rounded-lg px-4 py-2 text-[12px] font-bold transition-all ${
                    playbackSpeed === speed ? 'bg-[#167dff] text-white' : 'text-white/42 hover:text-white/76'
                  }`}
                >
                  {speed}X
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 border-t border-white/6 pt-3">
          <span className="shrink-0 text-[12px] text-white/42">时间轴</span>
          <div className="relative flex-1">
            <div className="h-[2px] rounded-full bg-white/10" />
            <div
              className="absolute left-0 top-0 h-[2px] rounded-full bg-[#18bfff]"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(event) => setProgress(Number(event.target.value))}
              className="absolute inset-0 h-4 w-full -translate-y-1/2 cursor-pointer opacity-0"
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-[#56d3ff] bg-[#18bfff] shadow-[0_0_14px_rgba(24,191,255,0.45)]"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <span className="shrink-0 text-[12px] text-white/34">{displayTime}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <PlaybackInfoSidebar
          session={session}
          areasByCategory={MOCK_AREAS}
          selectedAreas={selectedAreas}
          expandedCategories={expandedCategories}
          onToggleArea={toggleArea}
          onToggleCategory={toggleCategory}
          onToggleAllInCategory={toggleAllInCategory}
          onResetAreas={() => setSelectedAreas(new Set())}
        />

        <div className="relative flex-1">
          <MapContainer center={session.event.coords} zoom={14} className="h-full w-full" zoomControl={false}>
            <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />

            {areaMapElements.map((element) => (
              <div key={element.id}>
                <Polygon
                  positions={element.bounds}
                  pathOptions={{
                    color: '#00b7ff',
                    fillColor: '#00b7ff',
                    fillOpacity: 0.18,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="mb-1 text-xs font-bold text-sky-500">{element.name}</h4>
                      <p className="text-[11px] text-gray-500">类型: {element.type}</p>
                    </div>
                  </Popup>
                </Polygon>
                <Marker position={element.center} icon={createAreaMarkerIcon(element.name)} />
              </div>
            ))}

            <Polyline
              positions={trajectory}
              pathOptions={{ color: '#a76bff', weight: 3, opacity: 0.9 }}
            />
            <Polyline
              positions={trajectory.slice(0, Math.floor((progress / 100) * (trajectory.length - 1)) + 1)}
              pathOptions={{ color: '#1bb7ff', weight: 3.5, opacity: 1 }}
            />

            <CircleMarker
              center={session.event.coords}
              pathOptions={{ color: '#ff4b5c', fillColor: '#ff4b5c', fillOpacity: 0.95 }}
              radius={10}
            >
              <Popup>
                <div className="p-2 text-xs font-bold text-red-500">风险触发点: {session.event.label}</div>
              </Popup>
            </CircleMarker>

            {currentPos && (
              <Marker
                position={currentPos}
                icon={createPlaybackShipIcon(session.vessel.name)}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </motion.div>
  );
}
