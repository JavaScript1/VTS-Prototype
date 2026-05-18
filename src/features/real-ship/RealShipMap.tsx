import { useEffect, useMemo, useRef } from 'react';
import loongship from 'loongship-web';
import { HOME_MAP_OVERLAY_BADGES, type HomeMapOverlayBadge } from '../../mockData';
import type { HomeShipDetail, HomeShipTrackPoint } from '../../types';
import {
  HOME_MAP_CENTER_STORAGE_KEY,
  HOME_MAP_DEFAULT_CENTER,
  HOME_MAP_ZOOM_STORAGE_KEY,
  VTS_CHART_TILE_URL,
} from '../map/constants';
import { SHIP_SHAPE_TEMPLATES } from './shipShapeTemplates';
import { useRealShips } from './useRealShips';

type RealShipMapProps = {
  playbackData: { vessel: any; event: any } | null;
  homeMapFocusTarget: [number, number] | null;
  selectedHomeShip: HomeShipDetail | null;
  selectedHomeShipTrackPoint: HomeShipTrackPoint | null;
  onMouseMove: (coords: { lat: number; lng: number } | null) => void;
  onSelectHomeShip: (shipId: string) => void;
  onSelectTrackPoint: (trackPointId: string) => void;
};

const DEFAULT_HOME_MAP_ZOOM = 11;
const MAP_TYPE_NAME = 'PROTO_HOME_STREET';

type LayerRef = {
  clearLayers?: () => void;
  remove?: () => void;
  addLayer?: (layer: any) => void;
};

const ensureMapConfig = () => {
  (loongship as any).Default.MAP_CONFIG[MAP_TYPE_NAME] = {
    url: VTS_CHART_TILE_URL,
    mapType: MAP_TYPE_NAME,
    'zh-CN': '海图',
    'en-US': 'STREET',
    crs: (loongship as any).CRS.EPSG3857,
    typeName: '海图',
    coordsType: 'WGS84',
    subdomains: [0, 3],
    zIndex: 1,
  };
};

const readPersistedMapCenter = (): [number, number] => {
  if (typeof window === 'undefined') {
    return HOME_MAP_DEFAULT_CENTER;
  }

  try {
    const raw = window.localStorage.getItem(HOME_MAP_CENTER_STORAGE_KEY);
    if (!raw) return HOME_MAP_DEFAULT_CENTER;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'number' &&
      typeof parsed[1] === 'number'
    ) {
      return [parsed[0], parsed[1]];
    }
  } catch {
    return HOME_MAP_DEFAULT_CENTER;
  }

  return HOME_MAP_DEFAULT_CENTER;
};

const readPersistedMapZoom = (): number => {
  if (typeof window === 'undefined') {
    return DEFAULT_HOME_MAP_ZOOM;
  }

  const raw = window.localStorage.getItem(HOME_MAP_ZOOM_STORAGE_KEY);
  const zoom = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(zoom) ? zoom : DEFAULT_HOME_MAP_ZOOM;
};

const createBadgeIcon = ({ label, kind }: Pick<HomeMapOverlayBadge, 'label' | 'kind'>) =>
  (loongship as any).divIcon({
    className: 'map-overlay-badge-icon',
    html: `
      <div class="map-overlay-badge map-overlay-badge--${kind}">
        <span class="map-overlay-badge__label">${label}</span>
        <span class="map-overlay-badge__pointer"></span>
        <span class="map-overlay-badge__dot"></span>
      </div>
    `,
    iconSize: [96, 48],
    iconAnchor: [18, 36],
  });

const createPlaybackIcon = (playbackData: any) => {
  const latestDialogue =
    playbackData?.event?.dialogue?.[playbackData.event.dialogue.length - 1];

  return (loongship as any).divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative -translate-x-1/2 -translate-y-[120%] min-w-[200px]">
        <div class="bg-[#0a0a0a]/90 backdrop-blur-md border border-sky-500/50 rounded-lg p-3 shadow-2xl ring-1 ring-white/10">
          <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
            <div class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
            <span class="text-[10px] font-black text-sky-400 uppercase tracking-widest">当前意图: ${playbackData.event.label}</span>
          </div>
          ${
            latestDialogue
              ? `
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-white/40 uppercase">${latestDialogue.sender}</span>
                <span class="text-[10px] font-mono text-white/20">${latestDialogue.time}</span>
              </div>
              <p class="text-[11px] text-white/90 leading-relaxed font-medium">"${latestDialogue.content}"</p>
            </div>
          `
              : `
            <p class="text-[10px] text-white/40 italic">暂无实时对话内容</p>
          `
          }
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-sky-500/50"></div>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const removeLayer = (layer: any) => {
  if (!layer) return;
  if (typeof layer.clearLayers === 'function') {
    layer.clearLayers();
  }
  if (typeof layer.remove === 'function') {
    layer.remove();
  }
};

export default function RealShipMap({
  playbackData,
  homeMapFocusTarget,
  selectedHomeShip,
  selectedHomeShipTrackPoint,
  onMouseMove,
  onSelectHomeShip,
  onSelectTrackPoint,
}: RealShipMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const shipLayerRef = useRef<any>(null);
  const badgeLayerRef = useRef<LayerRef | null>(null);
  const trackLayerRef = useRef<LayerRef | null>(null);
  const playbackLayerRef = useRef<any>(null);
  const lastFocusKeyRef = useRef<string | null>(null);
  const { error, ships } = useRealShips();

  useEffect(() => {
    ensureMapConfig();
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = (loongship as any).mapView(containerRef.current, {
      center: readPersistedMapCenter(),
      zoom: readPersistedMapZoom(),
      mapType: MAP_TYPE_NAME,
      mouseLatlng: false,
      zoomChange: false,
      mapChange: false,
      fullscreen: false,
      weatherSetup: false,
      distance: false,
      closePopupOnClick: false,
      rotate: true,
      bearing: -30,
      rotateControl: false,
      scale: false,
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      window.localStorage.setItem(
        HOME_MAP_CENTER_STORAGE_KEY,
        JSON.stringify([center.lat, center.lng]),
      );
    });

    map.on('zoomend', () => {
      window.localStorage.setItem(HOME_MAP_ZOOM_STORAGE_KEY, String(map.getZoom()));
    });

    map.on('mousemove', (event: any) => {
      if (event?.latlng) {
        onMouseMove({ lat: event.latlng.lat, lng: event.latlng.lng });
      }
    });

    map.on('mouseout', () => {
      onMouseMove(null);
    });

    shipLayerRef.current = (loongship as any).shipCanvasLayer([], {
      predictionLine: {
        show: true,
        timeMinutes: 1,
      },
      lod: {
        enable: false,
      },
      blink: {
        frequency: 2,
      },
      shapeTemplates: SHIP_SHAPE_TEMPLATES,
    });
    shipLayerRef.current.addTo(map);
    mapRef.current = map;

    return () => {
      removeLayer(playbackLayerRef.current);
      removeLayer(trackLayerRef.current);
      removeLayer(badgeLayerRef.current);
      removeLayer(shipLayerRef.current);
      map.remove();
      mapRef.current = null;
      shipLayerRef.current = null;
    };
  }, [onMouseMove]);

  useEffect(() => {
    if (error) {
      console.error('[real-ship] failed to load area ship list:', error);
    }
  }, [error]);

  useEffect(() => {
    shipLayerRef.current?.updateShips?.(ships);
  }, [ships]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    removeLayer(badgeLayerRef.current);
    const badgeLayer = (loongship as any).layerGroup();

    HOME_MAP_OVERLAY_BADGES.forEach((badge: HomeMapOverlayBadge) => {
      const marker = (loongship as any).marker(badge.position, {
        icon: createBadgeIcon(badge),
        zIndexOffset: badge.kind === 'warning' ? 600 : 520,
      });
      marker.bindPopup(`
        <div class="min-w-[160px] p-1">
          <div class="text-[12px] font-semibold ${
            badge.kind === 'warning' ? 'text-red-500' : 'text-amber-500'
          }">
            ${badge.label}
          </div>
          <div class="mt-1 text-[11px] text-slate-500">${badge.detail}</div>
        </div>
      `);
      badgeLayer.addLayer(marker);
    });

    badgeLayer.addTo(map);
    badgeLayerRef.current = badgeLayer;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    removeLayer(trackLayerRef.current);
    if (!selectedHomeShip) {
      trackLayerRef.current = null;
      return;
    }

    const trackLayer = (loongship as any).layerGroup();
    const polyline = (loongship as any).polyline(
      selectedHomeShip.track.map((point) => point.coords),
      {
        color: '#38bdf8',
        weight: 2.5,
        opacity: 0.85,
        dashArray: '6 8',
      },
    );
    trackLayer.addLayer(polyline);

    selectedHomeShip.track.forEach((point) => {
      const active = selectedHomeShipTrackPoint?.id === point.id;
      const marker = (loongship as any).circleMarker(point.coords, {
        radius: active ? 6 : point.kind === 'current' ? 5 : 3,
        fillColor: active
          ? '#38bdf8'
          : point.kind === 'current'
            ? '#22c55e'
            : '#94a3b8',
        color: active ? '#ffffff' : '#0f172a',
        weight: active ? 2 : 1,
        opacity: 1,
        fillOpacity: active ? 1 : 0.9,
      });
      marker.on('click', () => {
        onSelectHomeShip(selectedHomeShip.id);
        onSelectTrackPoint(point.id);
      });
      marker.bindPopup(`
        <div class="min-w-[160px] p-1">
          <div class="text-[12px] font-semibold text-sky-500">${selectedHomeShip.name}</div>
          <div class="mt-1 text-[11px] text-slate-600">${point.label} · ${point.time}</div>
          <div class="mt-1 text-[11px] text-slate-500">${point.note}</div>
        </div>
      `);
      trackLayer.addLayer(marker);
    });

    trackLayer.addTo(map);
    trackLayerRef.current = trackLayer;
  }, [onSelectHomeShip, onSelectTrackPoint, selectedHomeShip, selectedHomeShipTrackPoint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    removeLayer(playbackLayerRef.current);
    playbackLayerRef.current = null;

    if (!playbackData?.event?.coords) {
      return;
    }

    map.setView(playbackData.event.coords, 14, {
      animate: true,
      duration: 1,
    });

    const marker = (loongship as any).marker(playbackData.event.coords, {
      icon: createPlaybackIcon(playbackData),
    });
    marker.addTo(map);
    playbackLayerRef.current = marker;
  }, [playbackData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !homeMapFocusTarget) return;

    const focusKey = `${homeMapFocusTarget[0]}:${homeMapFocusTarget[1]}`;
    if (lastFocusKeyRef.current === focusKey) {
      return;
    }

    lastFocusKeyRef.current = focusKey;
    map.flyTo(homeMapFocusTarget, Math.max(map.getZoom(), 14), {
      animate: true,
      duration: 0.8,
    });
  }, [homeMapFocusTarget]);

  const overlay = useMemo(
    () => <div className="absolute left-4 top-4 z-[1500] flex flex-col gap-4" />,
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a0a]">
      <div ref={containerRef} className="h-full w-full" />
      {overlay}
    </div>
  );
}
