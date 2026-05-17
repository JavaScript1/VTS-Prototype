import { Fragment, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer } from 'react-leaflet';
import { MOCK_AREAS } from '../../mockData';
import { VTS_CHART_TILE_ATTRIBUTION, VTS_CHART_TILE_URL } from '../../features/map/constants';
import type { MockArea } from '../../types';
import PlaybackInfoSidebar from './playback/PlaybackInfoSidebar';
import { getCollisionPlaybackState, isCollisionPlayback } from './playback/collisionPlayback';
import {
  CollisionPlaybackMapController,
  createAreaMarkerIcon,
  createCollisionShipIcon,
  createPlaybackShipIcon,
  formatPlaybackTime,
} from './playback/PlaybackMapHelpers';

export interface PlaybackSessionLike {
  vessel: any;
  event: any;
}

interface DynamicPlaybackViewProps {
  session: PlaybackSessionLike;
  onClose: () => void;
  embedded?: boolean;
}

interface AreaMapElement {
  id: string;
  name: string;
  type: string;
  center: [number, number];
  bounds: [number, number][];
}

export default function DynamicPlaybackView({
  session,
  onClose,
  embedded = false,
}: DynamicPlaybackViewProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(
    () => new Set(Object.values(MOCK_AREAS).flat().slice(0, 12).map((area) => area.id)),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(MOCK_AREAS)),
  );
  const [blinkOn, setBlinkOn] = useState(true);

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
  const collisionPlayback = useMemo(
    () =>
      isCollisionPlayback(session.event.label)
        ? getCollisionPlaybackState(session.event.coords, session.vessel.name, progress)
        : null,
    [progress, session.event.coords, session.event.label, session.vessel.name],
  );
  const showAreaOverlays = !collisionPlayback;

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

  useEffect(() => {
    if (!collisionPlayback || collisionPlayback.severity === 'observe') {
      setBlinkOn(true);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setBlinkOn((prev) => !prev);
    }, 420);

    return () => window.clearInterval(timer);
  }, [collisionPlayback?.severity]);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
    setBlinkOn(true);
  }, [session.event.label, session.event.time, session.vessel.name]);

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
      className={
        embedded
          ? 'absolute inset-0 z-[20] flex flex-col overflow-hidden rounded-[28px] bg-white'
          : 'fixed inset-0 z-[9999] flex flex-col bg-black'
      }
    >
      <div
        className={`px-4 py-3 ${
          embedded ? 'border-b border-slate-200 bg-white' : 'border-b border-white/8 bg-black'
        }`}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            {!embedded ? (
              <button
                onClick={onClose}
                className="mt-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/72 transition-all hover:bg-white/[0.08] hover:text-white"
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <div>
              <h2 className={`text-[24px] font-bold ${embedded ? 'text-slate-900' : 'text-white'}`}>
                动态轨迹回放: {session.vessel.name}
              </h2>
              <div className={`mt-1 text-[12px] ${embedded ? 'text-slate-400' : 'text-white/40'}`}>
                事件时间: {session.event.time}
                <span className={`mx-3 ${embedded ? 'text-slate-200' : 'text-white/18'}`}>|</span>
                风险类型: {session.event.label}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-bold transition-all ${
                embedded
                  ? 'bg-sky-500 text-white shadow-sm hover:bg-sky-600'
                  : 'bg-[#18bfff] text-white shadow-[0_8px_24px_rgba(24,191,255,0.22)] hover:bg-[#33c8ff]'
              }`}
            >
              {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              {isPlaying ? '暂停' : '播放'}
            </button>

            <div
              className={`flex items-center gap-1 rounded-xl p-1 ${
                embedded ? 'border border-slate-200 bg-slate-50' : 'bg-[#111]'
              }`}
            >
              {[1, 2, 4, 8].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`rounded-lg px-4 py-2 text-[12px] font-bold transition-all ${
                    playbackSpeed === speed
                      ? embedded
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'bg-[#167dff] text-white'
                      : embedded
                        ? 'text-slate-400 hover:text-slate-800'
                        : 'text-white/42 hover:text-white/76'
                  }`}
                >
                  {speed}X
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`mt-3 flex items-center gap-4 pt-3 ${
            embedded ? 'border-t border-slate-200' : 'border-t border-white/6'
          }`}
        >
          <span className={`shrink-0 text-[12px] ${embedded ? 'text-slate-500' : 'text-white/42'}`}>
            时间轴
          </span>
          <div className="relative flex-1">
            <div className={`h-[2px] rounded-full ${embedded ? 'bg-slate-200' : 'bg-white/10'}`} />
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
              className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border bg-[#18bfff] ${
                embedded
                  ? 'border-sky-500 shadow-sm'
                  : 'border-[#56d3ff] shadow-[0_0_14px_rgba(24,191,255,0.45)]'
              }`}
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
          <span className={`shrink-0 text-[12px] ${embedded ? 'text-slate-500' : 'text-white/34'}`}>
            {displayTime}
          </span>
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
          embedded={embedded}
          showAreaSelector={showAreaOverlays}
        />

        <div className={`relative flex-1 ${embedded ? 'bg-slate-100' : 'bg-[#111]'}`}>
          {session.vessel.isImageScenario ? (
            <div className="flex h-full w-full items-center justify-center p-8">
              <div
                className={`relative h-full w-full overflow-hidden rounded-2xl ${
                  embedded ? 'border border-slate-200 bg-white shadow-sm' : 'border border-white/10 shadow-2xl'
                }`}
              >
                <img
                  src={session.vessel.image}
                  alt={session.vessel.name}
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold backdrop-blur-md ${
                        embedded
                          ? 'border border-sky-200 bg-white/90 text-sky-600'
                          : 'border border-sky-500/30 bg-sky-500/20 text-sky-400'
                      }`}
                    >
                      场景快照
                    </div>
                    <div className="text-sm font-medium text-white/90">
                      指挥中心应急视频会商画面
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <MapContainer
              key={`${session.vessel.name}-${session.event.label}-${embedded ? 'embedded' : 'full'}`}
              center={session.event.coords}
              zoom={14}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />

              {collisionPlayback ? (
                <CollisionPlaybackMapController
                  polygon={collisionPlayback.alertPolygon}
                  severity={collisionPlayback.severity}
                />
              ) : null}

              {showAreaOverlays
                ? areaMapElements.map((element) => (
                    <Fragment key={element.id}>
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
                    </Fragment>
                  ))
                : null}

              {collisionPlayback ? (
                <>
                  {collisionPlayback.vessels.map((vessel) => (
                    <Fragment key={vessel.id}>
                      <Polyline
                        positions={vessel.track}
                        pathOptions={{ color: vessel.color, weight: 2, opacity: 0.22, dashArray: '5 8' }}
                      />
                      <Polyline
                        positions={vessel.traveled}
                        pathOptions={{ color: vessel.color, weight: vessel.isPrimary ? 4 : 3, opacity: 0.95 }}
                      />
                      <Marker
                        position={vessel.current}
                        icon={createCollisionShipIcon(vessel.name, vessel.color, vessel.isPrimary)}
                      />
                    </Fragment>
                  ))}

                  {collisionPlayback.severity !== 'observe' ? (
                    <Polygon
                      positions={collisionPlayback.alertPolygon}
                      pathOptions={{
                        color: '#ef4444',
                        weight: 3,
                        opacity: collisionPlayback.severity === 'critical' ? (blinkOn ? 1 : 0.2) : 0.75,
                        fillColor: '#ef4444',
                        fillOpacity: collisionPlayback.severity === 'critical' ? 0.08 : 0.04,
                        dashArray: '10 8',
                      }}
                    >
                      <Popup>
                        <div className="p-2 text-xs font-bold text-red-500">
                          {collisionPlayback.severity === 'critical' ? '碰撞预警已触发' : '碰撞紧迫局面形成'}
                        </div>
                      </Popup>
                    </Polygon>
                  ) : null}
                </>
              ) : (
                <>
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

                  {currentPos ? (
                    <Marker
                      position={currentPos}
                      icon={createPlaybackShipIcon(session.vessel.name)}
                    />
                  ) : null}
                </>
              )}
            </MapContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
}
