import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { MOCK_AREAS } from '../../mockData';
import { VTS_CHART_TILE_ATTRIBUTION, VTS_CHART_TILE_URL } from '../../features/map/constants';
import type { MockArea } from '../../types';
import PlaybackAreaSelector from './playback/PlaybackAreaSelector';
import PlaybackStatusSidebar from './playback/PlaybackStatusSidebar';

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
        <div class="whitespace-nowrap rounded border border-white/20 bg-sky-500/80 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-lg backdrop-blur-md">
          ${name}
        </div>
        <div class="h-2 w-2 -mt-1 rotate-45 bg-sky-500 border-b border-r border-white/20"></div>
      </div>
    `,
    iconSize: [100, 40],
    iconAnchor: [50, 40],
  });

const createPlaybackShipIcon = (name: string) =>
  L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative">
        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-500 shadow-lg shadow-sky-500/50">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="3" fill="none" style="transform: rotate(45deg)">
            <path d="M12 2L19 21L12 17L5 21L12 2Z" />
          </svg>
        </div>
        <div class="absolute left-1/2 -top-8 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-black/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
          ${name}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

export default function DynamicPlaybackView({ session, onClose }: DynamicPlaybackViewProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
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

  const areaMapElements = useMemo(() => {
    const elements: AreaMapElement[] = [];
    Object.values(MOCK_AREAS)
      .flat()
      .forEach((area) => {
        if (!selectedAreas.has(area.id)) return;
        const center = session.event.coords;
        const offsetLat = (Math.random() - 0.5) * 0.04;
        const offsetLng = (Math.random() - 0.5) * 0.04;
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
      setProgress((prev) => Math.min(prev + 0.5 * playbackSpeed, 100));
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
      className="fixed inset-0 z-[9999] flex flex-col bg-[#0a0a0a]"
    >
      <div className="z-[10] flex h-20 flex-col border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex flex-1 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-white/60 transition-all hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                动态轨迹回放: {session.vessel.name}
              </h2>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                事件时间: {session.event.time} | 风险类型: {session.event.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-lg transition-all ${
                isPlaying
                  ? 'border border-amber-500/30 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30'
                  : 'bg-sky-500 text-white shadow-sky-500/20 hover:bg-sky-600'
              }`}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              <span className="uppercase tracking-widest">{isPlaying ? '暂停' : '播放'}</span>
            </button>

            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
              {[1, 2, 4, 8].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`rounded px-3 py-2 text-[11px] font-black transition-all ${
                    playbackSpeed === speed
                      ? 'bg-sky-500 text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {speed}X
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold transition-all hover:bg-white/10"
            >
              退出回放
            </button>
          </div>
        </div>

        <div className="flex h-8 items-center gap-4 border-t border-white/5 bg-white/[0.02] px-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            时间轴
          </span>
          <div className="relative h-1 flex-1 rounded-full bg-white/10">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
              style={{ width: `${progress}%` }}
            />
            {[0, 25, 50, 75, 100].map((point) => (
              <div
                key={point}
                className="absolute top-[-4px] h-3 w-px bg-white/20"
                style={{ left: `${point}%` }}
              >
                <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono text-white/20">
                  {point === 0 ? 'T-15m' : point === 50 ? 'T-0' : point === 100 ? 'T+15m' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <PlaybackAreaSelector
          areasByCategory={MOCK_AREAS}
          selectedAreas={selectedAreas}
          expandedCategories={expandedCategories}
          onToggleArea={toggleArea}
          onToggleCategory={toggleCategory}
          onToggleAllInCategory={toggleAllInCategory}
          onReset={() => setSelectedAreas(new Set())}
        />

        <div className="relative flex-1">
          <MapContainer center={session.event.coords} zoom={14} className="h-full w-full" zoomControl={false}>
            <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />

            {areaMapElements.map((element) => (
              <div key={element.id}>
                <Polygon
                  positions={element.bounds}
                  pathOptions={{
                    color: '#0ea5e9',
                    fillColor: '#0ea5e9',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '5, 5',
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
              pathOptions={{ color: '#38bdf8', weight: 3, opacity: 0.3, dashArray: '10, 10' }}
            />
            <Polyline
              positions={trajectory.slice(0, Math.floor((progress / 100) * (trajectory.length - 1)) + 1)}
              pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.8 }}
            />

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

            {currentPos && (
              <Marker
                position={currentPos}
                icon={createPlaybackShipIcon(session.vessel.name)}
              />
            )}
          </MapContainer>

          <div className="absolute bottom-8 left-1/2 z-[10] w-[80%] max-w-4xl -translate-x-1/2">
            <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur-xl">
              <button
                onClick={() => setIsPlaying((prev) => !prev)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
              </button>

              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-[11px] font-mono uppercase tracking-widest text-white/40">
                  <span>回放进度</span>
                  <span>{Math.floor(progress)}%</span>
                </div>
                <div className="group relative h-2 cursor-pointer overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-sky-500 transition-all duration-100" style={{ width: `${progress}%` }} />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(event) => setProgress(Number(event.target.value))}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-black uppercase tracking-widest text-sky-400">
                  实时航速
                </span>
                <span className="text-xl font-mono font-bold text-white">
                  {(12 + Math.sin(progress / 10) * 2).toFixed(1)}{' '}
                  <span className="text-xs text-white/40">KN</span>
                </span>
              </div>
            </div>
          </div>

          <PlaybackStatusSidebar
            session={session}
            progress={progress}
            currentPos={currentPos}
          />
        </div>
      </div>
    </motion.div>
  );
}
