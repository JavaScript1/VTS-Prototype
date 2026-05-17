import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export const createAreaMarkerIcon = (name: string) =>
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

export const createPlaybackShipIcon = (name: string) =>
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

export const createCollisionShipIcon = (name: string, color: string, isPrimary = false) =>
  L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative">
        <div style="display:flex;align-items:center;justify-content:center;width:${isPrimary ? 34 : 28}px;height:${isPrimary ? 34 : 28}px;border-radius:9999px;border:2px solid white;background:${color};box-shadow:0 8px 18px rgba(15,23,42,0.18);">
          <svg viewBox="0 0 24 24" width="${isPrimary ? 16 : 14}" height="${isPrimary ? 16 : 14}" stroke="white" stroke-width="3" fill="none" style="transform: rotate(45deg)">
            <path d="M12 2L19 21L12 17L5 21L12 2Z" />
          </svg>
        </div>
        <div style="position:absolute;left:calc(100% + 8px);top:50%;transform:translateY(-50%);white-space:nowrap;border-radius:9999px;border:1px solid rgba(148,163,184,0.4);background:rgba(255,255,255,0.96);padding:5px 10px;font-size:11px;font-weight:800;color:#0f172a;box-shadow:0 8px 22px rgba(15,23,42,0.12);">
          ${name}
        </div>
      </div>
    `,
    iconSize: [isPrimary ? 120 : 112, 42],
    iconAnchor: [isPrimary ? 17 : 14, isPrimary ? 17 : 14],
  });

export function CollisionPlaybackMapController({
  polygon,
  severity,
}: {
  polygon: [number, number][];
  severity: 'observe' | 'warning' | 'critical';
}) {
  const map = useMap();

  useEffect(() => {
    const padding =
      severity === 'critical' ? [40, 40] : severity === 'warning' ? [80, 80] : [130, 130];
    map.flyToBounds(polygon, {
      paddingTopLeft: padding,
      paddingBottomRight: padding,
      duration: 0.8,
      maxZoom: severity === 'critical' ? 15 : severity === 'warning' ? 14 : 13,
    });
  }, [map, polygon, severity]);

  return null;
}

export function formatPlaybackTime(time: string, progress: number) {
  const parsed = new Date(time.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return time;
  const offsetMinutes = Math.round((progress / 100) * 18 - 9);
  parsed.setMinutes(parsed.getMinutes() + offsetMinutes);
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}
