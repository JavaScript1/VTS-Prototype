import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import * as L from 'leaflet';
import { HOME_MAP_OVERLAY_BADGES, SHIP_POSITIONS, type HomeMapOverlayBadge } from '../../../mockData';
import type { HomeShipDetail, HomeShipTrackPoint, ShipPosition } from '../../../types';
import {
  HomeMapFocusController,
  MapStatePersister,
  MousePositionTracker,
  PlaybackMapController,
} from '../../map';
import {
  HOME_MAP_CENTER_STORAGE_KEY,
  HOME_MAP_DEFAULT_CENTER,
  HOME_MAP_ZOOM_STORAGE_KEY,
  VTS_CHART_TILE_ATTRIBUTION,
  VTS_CHART_TILE_URL,
} from '../../map/constants';
import LawEnforcementPanel from './LawEnforcementPanel';
import type { HomeViewMode } from '../utils/viewModes';

export type AppHomeMapProps = {
  mode: HomeViewMode;
  playbackData: { vessel: any; event: any } | null;
  homeMapFocusTarget: [number, number] | null;
  selectedHomeShip: HomeShipDetail | null;
  selectedHomeShipTrackPoint: HomeShipTrackPoint | null;
  onMouseMove: (coords: { lat: number; lng: number } | null) => void;
  onSelectHomeShip: (shipId: string) => void;
  onSelectTrackPoint: (trackPointId: string) => void;
  onModeChange?: (mode: HomeViewMode) => void;
};

const DEFAULT_HOME_MAP_ZOOM = 11;

const createShipIcon = (ship: ShipPosition, isSelected = false) =>
  L.divIcon({
    className: 'ship-marker-icon',
    html: `
      <div class="ship-marker ${isSelected ? 'ship-marker--selected' : ''} ship-marker--${ship.status}" style="--ship-rotation:${ship.heading}deg">
        <div class="ship-marker__halo"></div>
        <div class="ship-marker__vector"></div>
        <div class="ship-marker__body">
          <span class="ship-marker__bridge"></span>
        </div>
        <div class="ship-marker__trail"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const createHomeMapBadgeIcon = ({
  label,
  kind,
}: Pick<HomeMapOverlayBadge, 'label' | 'kind'>) =>
  L.divIcon({
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

export default function AppHomeMap({
  mode,
  playbackData,
  homeMapFocusTarget,
  selectedHomeShip,
  selectedHomeShipTrackPoint,
  onMouseMove,
  onSelectHomeShip,
  onSelectTrackPoint,
  onModeChange,
}: AppHomeMapProps) {
  return (
    <div className="relative flex-1 overflow-hidden bg-[#0a0a0a]">
      <MapContainer
        center={readPersistedMapCenter()}
        zoom={readPersistedMapZoom()}
        className="h-full w-full"
        zoomControl={false}
      >
        <MapStatePersister
          centerStorageKey={HOME_MAP_CENTER_STORAGE_KEY}
          zoomStorageKey={HOME_MAP_ZOOM_STORAGE_KEY}
        />
        <MousePositionTracker onMouseMove={onMouseMove} />
        <PlaybackMapController playbackData={playbackData} />
        <HomeMapFocusController target={homeMapFocusTarget} />
        <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />

        {HOME_MAP_OVERLAY_BADGES.map((badge) => (
          <Marker
            key={badge.id}
            position={badge.position}
            icon={createHomeMapBadgeIcon(badge)}
            zIndexOffset={badge.kind === 'warning' ? 600 : 520}
          >
            <Popup>
              <div className="min-w-[160px] p-1">
                <div
                  className={`text-[12px] font-semibold ${
                    badge.kind === 'warning' ? 'text-red-500' : 'text-amber-500'
                  }`}
                >
                  {badge.label}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">{badge.detail}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {selectedHomeShip && (
          <>
            <Polyline
              positions={selectedHomeShip.track.map((point) => point.coords)}
              pathOptions={{
                color: '#38bdf8',
                weight: 2.5,
                opacity: 0.85,
                dashArray: '6 8',
              }}
            />
            {selectedHomeShip.track.map((point) => {
              const active = selectedHomeShipTrackPoint?.id === point.id;
              return (
                <CircleMarker
                  key={point.id}
                  center={point.coords}
                  radius={active ? 6 : point.kind === 'current' ? 5 : 3}
                  pathOptions={{
                    fillColor: active ? '#38bdf8' : point.kind === 'current' ? '#22c55e' : '#94a3b8',
                    color: active ? '#ffffff' : '#0f172a',
                    weight: active ? 2 : 1,
                    opacity: 1,
                    fillOpacity: active ? 1 : 0.9,
                  }}
                  eventHandlers={{
                    click: () => {
                      onSelectHomeShip(selectedHomeShip.id);
                      onSelectTrackPoint(point.id);
                    },
                  }}
                >
                  <Popup>
                    <div className="min-w-[160px] p-1">
                      <div className="text-[12px] font-semibold text-sky-500">
                        {selectedHomeShip.name}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600">
                        {point.label} · {point.time}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">{point.note}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </>
        )}

        {SHIP_POSITIONS.map((ship) => (
          <Marker
            key={ship.id}
            position={[ship.lat, ship.lng]}
            icon={createShipIcon(ship, selectedHomeShip?.id === ship.id)}
            zIndexOffset={selectedHomeShip?.id === ship.id ? 900 : 320}
            eventHandlers={{ click: () => onSelectHomeShip(ship.id) }}
          >
            <Popup>
              <div className="min-w-[160px] p-1">
                <div className="text-[12px] font-semibold text-sky-500">{ship.name}</div>
                <div className="mt-1 text-[11px] text-slate-600">
                  {ship.type} · {ship.mmsi}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  航速 {ship.speed.toFixed(1)} kn · 目的地 {ship.destination}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute left-4 top-4 z-[1500] flex flex-col gap-4">
        {(mode === 'normal' || mode === 'smart-duty') && (
          <LawEnforcementPanel onEnterSystem={() => onModeChange?.('case-playback')} />
        )}
      </div>
    </div>
  );
}
