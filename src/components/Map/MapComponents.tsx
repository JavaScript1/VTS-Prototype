/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useMapEvents, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';

// 地图状态持久化组件
export const MapStatePersister = () => {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      localStorage.setItem('vts-map-center', JSON.stringify([center.lat, center.lng]));
    },
    zoomend: (e) => {
      const map = e.target;
      localStorage.setItem('vts-map-zoom', map.getZoom().toString());
    },
  });
  return null;
};

// 鼠标位置追踪组件
export const MousePositionTracker = ({ onMouseMove }: { onMouseMove: (coords: { lat: number; lng: number }) => void }) => {
  useMapEvents({
    mousemove(e) {
      onMouseMove(e.latlng);
    },
  });
  return null;
};

// 历史回放地图控制组件
export const PlaybackMapController = ({ playbackData }: { playbackData: any }) => {
  const map = useMap();
  
  useEffect(() => {
    if (playbackData?.event?.coords) {
      map.setView(playbackData.event.coords, 14, {
        animate: true,
        duration: 1
      });
    }
  }, [playbackData, map]);

  if (!playbackData || !playbackData.event.coords) return null;

  const latestDialogue = playbackData.event.dialogue?.[playbackData.event.dialogue.length - 1];

  return (
    <Marker 
      position={playbackData.event.coords}
      icon={L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative -translate-x-1/2 -translate-y-[120%] min-w-[200px]">
            <div class="bg-[#0a0a0a]/90 backdrop-blur-md border border-sky-500/50 rounded-lg p-3 shadow-2xl ring-1 ring-white/10">
              <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <div class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                <span class="text-[10px] font-black text-sky-400 uppercase tracking-widest">当前意图: ${playbackData.event.label}</span>
              </div>
              
              ${latestDialogue ? `
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold text-white/40 uppercase">${latestDialogue.sender}</span>
                    <span class="text-[8px] font-mono text-white/20">${latestDialogue.time}</span>
                  </div>
                  <p class="text-[11px] text-white/90 leading-relaxed font-medium">"${latestDialogue.content}"</p>
                </div>
              ` : `
                <p class="text-[10px] text-white/40 italic">暂无实时对话内容</p>
              `}
              
              <!-- 箭头 -->
              <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-sky-500/50"></div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      })}
    />
  );
};
