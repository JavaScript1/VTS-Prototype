/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ShipDT chart tiles use /{z}/{y}/{x}.png instead of the common /{z}/{x}/{y}.png.
export const VTS_CHART_TILE_URL = 'https://test.shipdt.com/vts/chart/{z}/{y}/{x}.png';
export const VTS_CHART_TILE_ATTRIBUTION = '&copy; ShipDT';

export const HOME_MAP_DEFAULT_CENTER: [number, number] = [31.357522, 121.635475];
export const HOME_MAP_BASE_CENTER: [number, number] = [31.425, 121.565];

export const HOME_MAP_LAT_OFFSET = HOME_MAP_DEFAULT_CENTER[0] - HOME_MAP_BASE_CENTER[0];
export const HOME_MAP_LNG_OFFSET = HOME_MAP_DEFAULT_CENTER[1] - HOME_MAP_BASE_CENTER[1];

export const HOME_MAP_CENTER_STORAGE_KEY = 'vts-map-center-v5';
export const HOME_MAP_ZOOM_STORAGE_KEY = 'vts-map-zoom';

export const shiftHomeMapCoordinates = ([lat, lng]: [number, number]): [number, number] => [
  lat + HOME_MAP_LAT_OFFSET,
  lng + HOME_MAP_LNG_OFFSET,
];

export const WARNING_AREA_CATEGORY_META: Record<string, { center: [number, number]; zoom: number }> = {
  值班区域: { center: [31.305, 121.52], zoom: 10 },
  作业与停泊设施: { center: [31.285, 121.71], zoom: 11 },
  航道航行设施: { center: [31.325, 121.62], zoom: 11 },
  水域管控: { center: [31.345, 121.58], zoom: 11 },
};

export const WARNING_LINE_TYPES = new Set(['主航道', '辅助航道', '小型船舶航道', '航道分割线', '报告线', '导堤']);

export const WARNING_AREA_TYPE_COLORS: Record<string, string> = {
  值班台: '#38bdf8',
  码头: '#14b8a6',
  泊位: '#22c55e',
  锚地: '#f59e0b',
  主航道: '#06b6d4',
  辅助航道: '#0ea5e9',
  小型船舶航道: '#22d3ee',
  航道分割线: '#94a3b8',
  报告线: '#eab308',
  导堤: '#f97316',
  物标: '#818cf8',
  警戒区: '#f43f5e',
  禁锚区: '#fb7185',
  禁航区: '#ef4444',
  临时管控区: '#a855f7',
  '边坡100米水域': '#8b5cf6',
  浅水区: '#facc15',
  引航作业区: '#10b981',
  调头区: '#60a5fa',
};
