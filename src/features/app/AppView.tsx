/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  ShieldAlert, 
  Settings, 
  User, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Check,
  Map as MapIcon,
  Radio,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  Maximize2,
  Clock,
  Filter,
  LocateFixed,
  List,
  LogOut,
  Layout,
  Users,
  Lock,
  BookOpen,
  Volume2,
  Monitor,
  BarChart3,
  Shield,
  Plus,
  ArrowLeft,
  Ship,
  Anchor,
  Activity,
  History,
  FileText,
  Play,
  Pause,
  MapPin,
  Wind,
  CloudSun,
  Compass,
  Presentation,
  X,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  LabelList
} from 'recharts';
import { MapContainer, TileLayer, Marker, CircleMarker, useMapEvents, Polygon, Polyline, Rectangle, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import {
  type SidebarTab,
  type VHFMessage,
  type Alert,
  type ShipPosition,
  type ShipSearchResult,
  type VhfShipInfo,
  type VhfSessionSummary,
  type HomeShipTrackPoint,
  type HomeShipBusinessInfo,
  type HomeShipCargoInfo,
  type HomeShipDynamicEvent,
  type HomeShipDetail,
  type IntentStep,
  type IntentTimelineEvent,
  type IntentRisk,
  type IntentSituation,
  type IntentRecommendation,
  type IntentItem,
  type MockAreaMap,
} from '../../types';
import {
  AREA_CATEGORIES,
  AREA_TYPE_MAPPING,
  MOCK_AREAS,
  MOCK_INTENT_STATS,
  MOCK_RISK_STATS,
  MOCK_VESSEL_DYNAMICS,
} from '../../mockData';
import {
  groupVhfMessages,
  type ConversationCard,
  type VhfMessage as AggregatedVhfMessage,
} from '../../utils/vhfConversation';
import { SidebarPanel } from '../sidebar';
import { HomeMapFocusController, MapStatePersister, MousePositionTracker, PlaybackMapController } from '../map';
import { HomeShipDetailPanel } from '../ship-detail';
import { VhfPanel } from '../vhf';
import { IntentListPanel } from '../intent';
import { WarningListPanel } from '../warning';
import { AnchoragePanel } from '../anchorage';

const MarqueeText = ({ text, isHovered, className }: { text: string; isHovered: boolean; className?: string }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    if (isHovered && containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const textWidth = textRef.current.offsetWidth;
      if (textWidth > containerWidth) {
        setShouldScroll(true);
        setScrollDistance(textWidth - containerWidth);
      }
    } else {
      setShouldScroll(false);
    }
  }, [isHovered, text]);

  // 使用更慢的固定速度 (像素/秒)
  const speed = 20; 
  const duration = shouldScroll ? scrollDistance / speed : 0;

  return (
    <div ref={containerRef} className="min-w-0 flex-1 overflow-hidden relative flex items-center">
      <motion.div
        animate={shouldScroll ? {
          x: -scrollDistance,
        } : { x: 0 }}
        transition={shouldScroll ? {
          duration: Math.max(duration, 1),
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
          repeatDelay: 1.5
        } : { duration: 0.3 }}
        className="whitespace-nowrap flex items-center"
      >
        <span ref={textRef} className={className}>
          {text}
        </span>
      </motion.div>
    </div>
  );
};

const VTS_CHART_TILE_URL = 'https://test.shipdt.com/vts/chart/{z}/{x}/{y}.png';
const VTS_CHART_TILE_ATTRIBUTION = '&copy; ShipDT';
const HOME_MAP_DEFAULT_CENTER: [number, number] = [31.316261, 121.723495];
const HOME_MAP_BASE_CENTER: [number, number] = [31.425, 121.565];
const HOME_MAP_CENTER_STORAGE_KEY = 'vts-map-center-v5';
const HOME_MAP_ZOOM_STORAGE_KEY = 'vts-map-zoom';
const HOME_MAP_LAT_OFFSET = HOME_MAP_DEFAULT_CENTER[0] - HOME_MAP_BASE_CENTER[0];
const HOME_MAP_LNG_OFFSET = HOME_MAP_DEFAULT_CENTER[1] - HOME_MAP_BASE_CENTER[1];

const shiftHomeMapCoordinates = ([lat, lng]: [number, number]): [number, number] => [
  lat + HOME_MAP_LAT_OFFSET,
  lng + HOME_MAP_LNG_OFFSET,
];

type WarningAreaFeature = {
  id: string;
  name: string;
  type: string;
  category: string;
  center: [number, number];
  polygon?: [number, number][];
  polyline?: [number, number][];
  color: string;
};

const WARNING_AREA_CATEGORY_META: Record<string, { center: [number, number]; zoom: number }> = {
  值班区域: { center: [31.305, 121.52], zoom: 10 },
  作业与停泊设施: { center: [31.285, 121.71], zoom: 11 },
  航道航行设施: { center: [31.325, 121.62], zoom: 11 },
  水域管控: { center: [31.345, 121.58], zoom: 11 },
};

const WARNING_LINE_TYPES = new Set(['主航道', '辅助航道', '小型船舶航道', '航道分割线', '报告线', '导堤']);

const WARNING_AREA_TYPE_COLORS: Record<string, string> = {
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

type RiskConfigAreaType = '全部' | '航道' | '锚地' | '泊位';

const getRiskConfigAreaType = ({
  type,
  category,
}: {
  type: string;
  category: string;
}): Exclude<RiskConfigAreaType, '全部'> | null => {
  if (type === '锚地') return '锚地';
  if (type === '泊位' || type === '码头') return '泊位';
  if (
    category === '航道航行设施' &&
    ['主航道', '辅助航道', '小型船舶航道', '航道分割线', '报告线', '导堤'].includes(type)
  ) {
    return '航道';
  }
  return null;
};

const readPersistedMapCenter = (): [number, number] => {
  try {
    const saved = localStorage.getItem(HOME_MAP_CENTER_STORAGE_KEY);
    if (!saved) {
      return HOME_MAP_DEFAULT_CENTER;
    }

    const parsed = JSON.parse(saved);
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'number' &&
      Number.isFinite(parsed[0]) &&
      typeof parsed[1] === 'number' &&
      Number.isFinite(parsed[1])
    ) {
      return [parsed[0], parsed[1]];
    }
  } catch {
    localStorage.removeItem(HOME_MAP_CENTER_STORAGE_KEY);
  }

  return HOME_MAP_DEFAULT_CENTER;
};

const readPersistedMapZoom = (): number => {
  const saved = localStorage.getItem(HOME_MAP_ZOOM_STORAGE_KEY);
  if (!saved) {
    return 13;
  }

  const parsed = Number.parseInt(saved, 10);
  return Number.isFinite(parsed) ? parsed : 13;
};

const parseAnchorageExpiryTime = (value: string): Date | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  return new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
    Number.parseInt(hour, 10),
    Number.parseInt(minute, 10),
  );
};

const formatRemainingDuration = (expiryTime: string, currentTime: Date): string => {
  const expiryDate = parseAnchorageExpiryTime(expiryTime);
  if (!expiryDate) return '剩余: 待确认';

  const diffMs = expiryDate.getTime() - currentTime.getTime();
  if (diffMs <= 0) return '剩余: 00:00';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `剩余: ${days}天${hours}小时`;
  }

  if (hours > 0) {
    return `剩余: ${hours}小时${minutes}分钟`;
  }

  return `剩余: ${minutes}分钟`;
};

const formatAnchorageRemainingDuration = (expiryTime: string, currentTime: Date) =>
  formatRemainingDuration(expiryTime, currentTime).replace(/ /g, '').replace(':', ': ');

const getAnchorageExpiryMeta = (expiryTime: string) => {
  const [date = '--', time = '--:--'] = expiryTime.split(' ');
  return {
    date,
    time,
  };
};

const ANCHORAGE_DURATION_BUCKETS = [
  { label: '小于1天', minDays: 0, maxDays: 1 },
  { label: '1-3天', minDays: 1, maxDays: 3 },
  { label: '3-5天', minDays: 3, maxDays: 5 },
  { label: '5-10天', minDays: 5, maxDays: 10 },
  { label: '大于10天', minDays: 10, maxDays: Number.POSITIVE_INFINITY },
] as const;

const getAnchorageDurationStats = (anchorageId: string, occupied: number) => {
  const safeOccupied = Math.max(occupied, 0);
  if (safeOccupied === 0) {
    return ANCHORAGE_DURATION_BUCKETS.map((bucket) => ({
      type: bucket.label,
      count: 0,
    }));
  }

  const weights = ANCHORAGE_DURATION_BUCKETS.map((bucket, index) => ({
    type: bucket.label,
    weight: (hashString(`${anchorageId}-${bucket.label}-${index}`) % 100) + 1,
  }));
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);

  const distributed = weights.map((item) => ({
    type: item.type,
    rawCount: (item.weight / totalWeight) * safeOccupied,
  }));

  const baseStats = distributed.map((item) => ({
    type: item.type,
    count: Math.floor(item.rawCount),
  }));

  let remaining = safeOccupied - baseStats.reduce((sum, item) => sum + item.count, 0);

  if (remaining > 0) {
    const remainders = distributed
      .map((item, index) => ({
        index,
        remainder: item.rawCount - Math.floor(item.rawCount),
      }))
      .sort((left, right) => right.remainder - left.remainder);

    for (let i = 0; i < remainders.length && remaining > 0; i += 1) {
      baseStats[remainders[i].index].count += 1;
      remaining -= 1;
    }
  }

  return baseStats;
};

const hashWarningAreaSeed = (value: string) =>
  Array.from(value).reduce((seed, char) => (seed * 33 + char.charCodeAt(0)) >>> 0, 5381);

const createRectPolygon = (center: [number, number], latRadius: number, lngRadius: number): [number, number][] => [
  [center[0] - latRadius, center[1] - lngRadius],
  [center[0] - latRadius, center[1] + lngRadius],
  [center[0] + latRadius, center[1] + lngRadius],
  [center[0] + latRadius, center[1] - lngRadius],
];

const createDiamondPolygon = (center: [number, number], latRadius: number, lngRadius: number): [number, number][] => [
  [center[0] - latRadius, center[1]],
  [center[0], center[1] + lngRadius],
  [center[0] + latRadius, center[1]],
  [center[0], center[1] - lngRadius],
];

const createWarningAreaFeature = (
  area: { id: string; name: string; type: string },
  category: string,
  index: number,
  total: number,
): WarningAreaFeature => {
  const seed = hashWarningAreaSeed(`${category}-${area.id}-${area.type}`);
  const color = WARNING_AREA_TYPE_COLORS[area.type] || '#38bdf8';
  const meta = WARNING_AREA_CATEGORY_META[category] || WARNING_AREA_CATEGORY_META.值班区域;

  if (category === '航道航行设施') {
    const progress = total <= 1 ? 0.5 : index / Math.max(total - 1, 1);
    const lat = meta.center[0] - 0.14 + progress * 0.24 + ((seed % 17) - 8) * 0.0007;
    const lng =
      meta.center[1] -
      0.11 +
      progress * 0.2 +
      Math.sin(progress * Math.PI * 3) * 0.028 +
      (((seed >> 5) % 11) - 5) * 0.0008;
    const center: [number, number] = [lat, lng];

    if (WARNING_LINE_TYPES.has(area.type)) {
      const segment: [number, number][] = [
        [lat - 0.012, lng - 0.018],
        [lat - 0.004, lng - 0.008],
        [lat + 0.006, lng + 0.01],
        [lat + 0.014, lng + 0.022],
      ];

      return {
        id: area.id,
        name: area.name,
        type: area.type,
        category,
        center,
        polyline: segment,
        color,
      };
    }

    return {
      id: area.id,
      name: area.name,
      type: area.type,
      category,
      center,
      polygon: createDiamondPolygon(center, 0.0036, 0.0036),
      color,
    };
  }

  const ringSize = category === '作业与停泊设施' ? 28 : category === '水域管控' ? 8 : 6;
  const ring = Math.floor(index / ringSize);
  const slot = index % ringSize;
  const angle = (slot / ringSize) * Math.PI * 2 + ((seed % 29) - 14) * 0.01;
  const radius =
    (category === '作业与停泊设施' ? 0.018 : 0.032) +
    ring * (category === '作业与停泊设施' ? 0.007 : 0.014) +
    (((seed >> 4) % 9) - 4) * 0.0009;
  const center: [number, number] = [
    meta.center[0] + Math.sin(angle) * radius,
    meta.center[1] + Math.cos(angle) * (radius * 1.28),
  ];

  const polygon =
    area.type === '锚地'
      ? createDiamondPolygon(center, 0.0075, 0.011)
      : category === '水域管控'
        ? createRectPolygon(center, 0.007, 0.012)
        : createRectPolygon(center, 0.0036, 0.0065);

  return {
    id: area.id,
    name: area.name,
    type: area.type,
    category,
    center,
    polygon,
    color,
  };
};

const WarningAreaBoxSelector = ({
  enabled,
  onSelect,
}: {
  enabled: boolean;
  onSelect: (bounds: L.LatLngBounds) => void;
}) => {
  const [start, setStart] = useState<L.LatLng | null>(null);
  const [current, setCurrent] = useState<L.LatLng | null>(null);
  const map = useMapEvents({
    mousedown(e) {
      const shouldStart = enabled || Boolean((e.originalEvent as MouseEvent | undefined)?.shiftKey);
      if (!shouldStart) return;
      map.dragging.disable();
      setStart(e.latlng);
      setCurrent(e.latlng);
    },
    mousemove(e) {
      if (!start) return;
      setCurrent(e.latlng);
    },
    mouseup(e) {
      if (!start) return;
      const nextPoint = current || e.latlng;
      const bounds = L.latLngBounds(start, nextPoint);
      onSelect(bounds);
      setStart(null);
      setCurrent(null);
      map.dragging.enable();
    },
  });

  useEffect(() => {
    if (!enabled && !start) {
      map.dragging.enable();
    }
  }, [enabled, map, start]);

  if (!start || !current) return null;

  return (
    <Rectangle
      bounds={L.latLngBounds(start, current)}
      pathOptions={{
        color: '#38bdf8',
        weight: 1,
        dashArray: '6 6',
        fillColor: '#0ea5e9',
        fillOpacity: 0.14,
      }}
    />
  );
};

// 模拟船舶位置数据 (以吴淞口5号锚地为中心分布)
const SHIP_POSITIONS: ShipPosition[] = ([
  {id: 'ship-001', lat: 31.4382, lng: 121.5618, heading: 32, name: '远洋 123', englishName: 'OCEAN PIONEER 123', callsign: 'BARD1', mmsi: '413000001', type: '货轮', speed: 12.4, destination: '外高桥码头', status: 'normal'},
  {id: 'ship-002', lat: 31.4315, lng: 121.5742, heading: 218, name: '海丰 77', englishName: 'HAI FENG 77', callsign: 'VRGT5', mmsi: '413000002', type: '集装箱船', speed: 9.8, destination: '圆圆沙锚地', status: 'warning'},
  {id: 'ship-003', lat: 31.4236, lng: 121.5484, heading: 84, name: '振华 15', englishName: 'ZHEN HUA 15', callsign: 'BHKS3', mmsi: '413000003', type: '工程船', speed: 4.1, destination: '作业区 B5', status: 'caution'},
  {id: 'ship-004', lat: 31.4461, lng: 121.5865, heading: 305, name: '中海 99', englishName: 'COSCO 99', callsign: 'BUIO9', mmsi: '413000004', type: '油轮', speed: 11.7, destination: '长江口航道', status: 'warning'},
  {id: 'ship-005', lat: 31.4178, lng: 121.5341, heading: 146, name: '顺风 6', englishName: 'SHUN FENG 6', callsign: 'BSFG6', mmsi: '413000005', type: '散货船', speed: 6.3, destination: '吴淞口锚地', status: 'normal'},
  {id: 'ship-006', lat: 31.4544, lng: 121.5522, heading: 12, name: '东方 55', englishName: 'DONG FANG 55', callsign: 'BDOO5', mmsi: '413000055', type: '客船', speed: 14.2, destination: '黄浦江', status: 'normal'},
  {id: 'ship-007', lat: 31.4096, lng: 121.5828, heading: 262, name: '江海通 8', englishName: 'JIANG HAI TONG 8', callsign: 'BHT8', mmsi: '413000008', type: '散货船', speed: 7.1, destination: '宝山作业区', status: 'caution'},
  {id: 'ship-008', lat: 31.4408, lng: 121.5294, heading: 118, name: '新海安', englishName: 'XIN HAI AN', callsign: 'XHA10', mmsi: '413000010', type: '集装箱船', speed: 10.5, destination: '南槽航道', status: 'normal'},
  {id: 'ship-009', lat: 31.4289, lng: 121.5948, heading: 191, name: '星海', englishName: 'XING HAI', callsign: 'XH12', mmsi: '413000012', type: '油轮', speed: 5.9, destination: '1号禁锚区外侧', status: 'warning'},
  {id: 'ship-010', lat: 31.4612, lng: 121.5686, heading: 56, name: '蓝波', englishName: 'LAN BO', callsign: 'LB15', mmsi: '413000015', type: '拖船', speed: 8.4, destination: '吴淞口警戒区', status: 'normal'},
  {id: 'ship-011', lat: 31.4145, lng: 121.5634, heading: 332, name: '运兴 96', englishName: 'YUN XING 96', callsign: 'YX96', mmsi: '413000096', type: '货船', speed: 9.2, destination: '黄浦江', status: 'normal'},
  {id: 'ship-012', lat: 31.4347, lng: 121.5449, heading: 274, name: '远洋 99', englishName: 'OCEAN PIONEER 99', callsign: 'BYYP9', mmsi: '413000099', type: '散货船', speed: 13.1, destination: '6号锚地', status: 'caution'},
] satisfies ShipPosition[]).map((ship): ShipPosition => ({
  ...ship,
  lat: ship.lat + HOME_MAP_LAT_OFFSET,
  lng: ship.lng + HOME_MAP_LNG_OFFSET,
}));

type HomeMapOverlayBadge = {
  id: string;
  label: string;
  kind: 'intent' | 'warning';
  position: [number, number];
  detail: string;
};

const HOME_MAP_OVERLAY_BADGES: HomeMapOverlayBadge[] = ([
  {
    id: 'intent-anchor',
    label: '起锚',
    kind: 'intent',
    position: [31.4371, 121.5307],
    detail: '意图表达: 6 号锚地起锚后沿主航道进入下游通行序列。',
  },
  {
    id: 'warning-01',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4406, 121.5584],
    detail: '预警表达: 主航道上持续低速，已触发自动提醒。',
  },
  {
    id: 'warning-02',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4314, 121.5558],
    detail: '预警表达: 航道中心线附近滞航，建议值班持续跟踪。',
  },
  {
    id: 'warning-03',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4148, 121.5691],
    detail: '预警表达: 贴近码头前沿航道，低速停滞时间持续拉长。',
  },
  {
    id: 'warning-04',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4132, 121.5866],
    detail: '预警表达: 南侧航道边缘滞航，建议结合 VHF 进一步确认。',
  },
  {
    id: 'warning-05',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4097, 121.5989],
    detail: '预警表达: 航道末端持续低速，已进入低效通行观察名单。',
  },
] satisfies HomeMapOverlayBadge[]).map((badge): HomeMapOverlayBadge => ({
  ...badge,
  position: shiftHomeMapCoordinates(badge.position),
}));

const createShipIcon = (ship: ShipPosition, isSelected = false) =>
  L.divIcon({
    className: 'ship-marker-icon',
    html: `
      <div class="ship-marker ${isSelected ? 'ship-marker--selected' : ''}" style="--ship-rotation:${ship.heading}deg">
        <div class="ship-marker__halo"></div>
        <div class="ship-marker__body">
          <span class="ship-marker__bridge"></span>
        </div>
        <div class="ship-marker__trail"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

const createHomeMapBadgeIcon = ({ label, kind }: Pick<HomeMapOverlayBadge, 'label' | 'kind'>) =>
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

// --- 模拟数据 ---

const MOCK_VHF_MESSAGES: VHFMessage[] = [
  { id: '1', sessionId: 's1', sessionIntent: '呼叫应答', sessionType: 'intent', sender: '运兴96', content: '吴淞控制中心[运兴96]。', time: '16:32:34', date: '2025-12-17', duration: '1.99s', isVTS: false },
  { id: '2', sessionId: 's1', sessionIntent: '呼叫应答', sessionType: 'intent', sender: '交管_127705', content: '请讲。', time: '16:32:35', date: '2025-12-17', duration: '0.58s', isVTS: true },
  { id: '3', sessionId: 's2', sessionIntent: '锚地咨询', sessionType: 'intent', sender: '易航158', content: '在9号锚地这个锚这个位置可以锚泊吧。', time: '16:32:39', date: '2025-12-17', duration: '2.69s', isVTS: false },
  { id: '4', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '永发589', content: '吴淞交管吴淞交管，[永发589]。', time: '16:32:46', date: '2025-12-17', duration: '2.45s', isVTS: false },
  { id: '5', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '永发589', content: '，[永发589]呃，粮油码头。', time: '16:32:51', date: '2025-12-17', duration: '2.84s', isVTS: false },
  { id: '6', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '永发589', content: '苏个角粮油码头出口出口准备在圆圆沙啊，由南向北穿越走和塘上水。', time: '16:32:57', date: '2025-12-17', duration: '5.43s', isVTS: false },
  { id: '7', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '交管_30736', content: '开车了，好安全报。', time: '16:32:59', date: '2025-12-17', duration: '1.72s', isVTS: true },
  { id: '8', sessionId: 's4', sessionIntent: '出港咨询', sessionType: 'intent', sender: 'spk_127707', content: '好的，那现在可以出港池吧。', time: '16:33:02', date: '2025-12-17', duration: '2.03s', isVTS: false },
  { id: '9', sessionId: 's4', sessionIntent: '出港咨询', sessionType: 'intent', sender: '交管_114824', content: '可以可以。', time: '16:33:05', date: '2025-12-17', duration: '0.93s', isVTS: true },
  { id: '10', sessionId: 's5', sessionIntent: '进入禁航区', sessionType: 'alert', sender: '海丰国际', content: '吴淞交管，我船目前航向偏离，正在尝试修正。', time: '16:33:10', date: '2025-12-17', duration: '3.12s', isVTS: false },
  { id: '11', sessionId: 's5', sessionIntent: '进入禁航区', sessionType: 'alert', sender: '交管_127705', content: '请立即向左修正航向，避开圆圆沙禁航区。', time: '16:33:15', date: '2025-12-17', duration: '2.45s', isVTS: true },
];

const MOCK_ANCHORAGES = [
  { 
    id: 'a1', 
    name: '6号锚地', 
    capacity: 20, 
    occupied: 18, 
    expiringCount: 3, 
    overtimeCount: 2,
    status: '拥挤',
    shipTypes: [
      { type: '散货船', count: 8 },
      { type: '集装箱船', count: 6 },
      { type: '油船', count: 4 }
    ],
    expiringShips: [
      { id: 'es1', name: '远洋 123', englishName: 'Ocean Pioneer 123', mmsi: '413000001', type: '货轮', expiryTime: '2026-04-15 18:00', details: { length: 190, width: 32, draft: 11.2, cargo: '铁矿石', destination: '上海', agent: '中远海运', callSign: 'BARD1', flag: '中国', anchorTime: '2026-04-13 10:00', lastPort: '舟山', nextPort: '上海', anchorPurpose: '待泊' } },
      { id: 'es2', name: '海丰 77', englishName: 'Hai Feng 77', mmsi: '413000002', type: '集装箱船', expiryTime: '2026-04-15 21:30', details: { length: 145, width: 24, draft: 8.5, cargo: '日用品', destination: '宁波', agent: '海丰国际', callSign: 'VRGT5', flag: '中国香港', anchorTime: '2026-04-13 14:00', lastPort: '上海', nextPort: '宁波', anchorPurpose: '装卸' } },
      { id: 'es3', name: '振华 15', englishName: 'Zhen Hua 15', mmsi: '413000003', type: '工程船', expiryTime: '2026-04-16 09:00', details: { length: 220, width: 45, draft: 9.8, cargo: '重型设备', destination: '舟山', agent: '振华重工', callSign: 'BHKS3', flag: '中国', anchorTime: '2026-04-14 08:30', lastPort: '长兴', nextPort: '舟山', anchorPurpose: '待命' } }
    ],
    overtimeShips: [
      { id: 'ot1', name: '华东 18', englishName: 'Hua Dong 18', mmsi: '413000101', type: '散货船', expiryTime: '2026-04-14 13:45', overtimeDuration: '超时 2h15m', details: { length: 170, width: 29, draft: 9.1, cargo: '钢材', destination: '张家港', agent: '华东航运', callSign: 'BZXC1', flag: '中国', anchorTime: '2026-04-12 16:00', lastPort: '泰州', nextPort: '张家港', anchorPurpose: '待港' } },
      { id: 'ot2', name: '中海 203', englishName: 'COSCO 203', mmsi: '413000102', type: '油船', expiryTime: '2026-04-14 14:55', overtimeDuration: '超时 1h05m', details: { length: 210, width: 35, draft: 12.4, cargo: '成品油', destination: '洋山', agent: '中海油', callSign: 'BUIO2', flag: '中国', anchorTime: '2026-04-12 12:00', lastPort: '南京', nextPort: '洋山', anchorPurpose: '受油' } }
    ]
  },
  { 
    id: 'a2', 
    name: '圆圆沙锚地', 
    capacity: 15, 
    occupied: 12, 
    expiringCount: 5, 
    overtimeCount: 1,
    status: '正常',
    shipTypes: [
      { type: '散货船', count: 5 },
      { type: '杂货船', count: 4 },
      { type: '工程船', count: 3 }
    ],
    expiringShips: [
      { id: 'es4', name: '中海 99', englishName: 'COSCO 99', mmsi: '413000004', type: '油轮', expiryTime: '2026-04-15 17:15', details: { length: 250, width: 48, draft: 14.5, cargo: '原油', destination: '大连', agent: '中海油', callSign: 'BUIO9', flag: '中国', anchorTime: '2026-04-13 11:15', lastPort: '宁波', nextPort: '大连', anchorPurpose: '过境' } },
      { id: 'es5', name: '顺风 6', englishName: 'Shun Feng 6', mmsi: '413000005', type: '散货船', expiryTime: '2026-04-16 10:45', details: { length: 110, width: 18, draft: 6.2, cargo: '煤炭', destination: '天津', agent: '顺风航运', callSign: 'BSFG6', flag: '中国', anchorTime: '2026-04-14 06:45', lastPort: '常熟', nextPort: '天津', anchorPurpose: '避风' } }
    ],
    overtimeShips: [
      { id: 'ot3', name: '盛港 12', englishName: 'Sheng Gang 12', mmsi: '413000103', type: '工程船', expiryTime: '2026-04-14 12:20', overtimeDuration: '超时 3h40m', details: { length: 160, width: 30, draft: 7.2, cargo: '设备', destination: '南通', agent: '盛港海工', callSign: 'BSGH2', flag: '中国', anchorTime: '2026-04-12 14:00', lastPort: '上海', nextPort: '南通', anchorPurpose: '作业' } }
    ]
  },
  { 
    id: 'a3', 
    name: '10号锚地', 
    capacity: 25, 
    occupied: 10, 
    expiringCount: 1, 
    overtimeCount: 0,
    status: '空闲',
    shipTypes: [
      { type: '集装箱船', count: 4 },
      { type: '油船', count: 3 },
      { type: '其他', count: 3 }
    ],
    expiringShips: [
      { id: 'es6', name: '东方 55', englishName: 'Dong Fang 55', mmsi: '413000055', type: '客船', expiryTime: '2026-04-16 18:00', details: { length: 120, width: 20, draft: 5.5, cargo: '乘客', destination: '青岛', agent: '东方海外', callSign: 'BDOO5', flag: '中国', anchorTime: '2026-04-14 18:00', lastPort: '上海', nextPort: '青岛', anchorPurpose: '游览' } }
    ],
    overtimeShips: []
  },
  { 
    id: 'a4', 
    name: '绿华山锚地', 
    capacity: 30, 
    occupied: 28, 
    expiringCount: 8, 
    overtimeCount: 3,
    status: '拥挤',
    shipTypes: [
      { type: '散货船', count: 12 },
      { type: '油船', count: 10 },
      { type: '集装箱船', count: 6 }
    ],
    expiringShips: [
      { id: 'es7', name: '远洋 99', englishName: 'Ocean Pioneer 99', mmsi: '413000099', type: '散货船', expiryTime: '2026-04-16 20:30', details: { length: 185, width: 32, draft: 10.5, cargo: '煤炭', destination: '广州', agent: '中远海运', callSign: 'BYYP9', flag: '中国', anchorTime: '2026-04-14 20:30', lastPort: '温州', nextPort: '广州', anchorPurpose: '避风' } }
    ],
    overtimeShips: [
      { id: 'ot4', name: '远海 72', englishName: 'Yuan Hai 72', mmsi: '413000104', type: '散货船', expiryTime: '2026-04-14 11:40', overtimeDuration: '超时 4h20m', details: { length: 198, width: 33, draft: 10.8, cargo: '矿砂', destination: '北仑', agent: '远海航运', callSign: 'BYHH7', flag: '中国', anchorTime: '2026-04-12 10:00', lastPort: '连云港', nextPort: '北仑', anchorPurpose: '待港' } },
      { id: 'ot5', name: '海景 88', englishName: 'Hai Jing 88', mmsi: '413000105', type: '油船', expiryTime: '2026-04-14 13:55', overtimeDuration: '超时 2h05m', details: { length: 230, width: 38, draft: 12.9, cargo: '原油', destination: '南沙', agent: '海景能源', callSign: 'BHJJ8', flag: '中国', anchorTime: '2026-04-12 14:00', lastPort: '南京', nextPort: '南沙', anchorPurpose: '受油' } },
      { id: 'ot6', name: '华舰 36', englishName: 'Hua Jian 36', mmsi: '413000106', type: '工程船', expiryTime: '2026-04-14 10:50', overtimeDuration: '超时 5h10m', details: { length: 175, width: 28, draft: 8.1, cargo: '施工设备', destination: '舟山', agent: '华舰工程', callSign: 'BHJJ3', flag: '中国', anchorTime: '2026-04-12 08:00', lastPort: '上海', nextPort: '舟山', anchorPurpose: '作业' } }
    ]
  },
];

const MOCK_ALERTS: Alert[] = [
  { 
    id: 'a1', 
    ship: '江海通8',
    englishName: 'Jiang Hai Tong 8',
    shipType: '散货船',
    mmsi: '413000008',
    callsign: 'BHT8',
    flag: '中国',
    agent: '江海通',
    anchorTime: '2026-03-18 14:20',
    destination: '上海',
    cargo: '铁矿石',
    riskScore: 85,
    length: '156m',
    width: '28m',
    draft: '8.5m',
    speed: '10.2kn',
    type: '进入禁航区', 
    summary: '该船偏离预定航线，进入禁航区【测试禁航区1】', 
    time: '11:42', 
    coords: [31.35, 121.55],
    level: 'emergency',
    timeline: [
      { time: '11:25:10', event: '进入吴淞口警戒区', type: 'info' },
      { time: '11:32:45', event: '航向偏离预定航线 > 15°', type: 'warning' },
      { time: '11:38:20', event: '接近禁航区边界', type: 'warning' },
      { time: '11:42:05', event: '触发[进入禁航区]风险预警', type: 'risk' }
    ]
  },
  { 
    id: 'a2', 
    ship: '新海安',
    englishName: 'Xin Hai An',
    shipType: '集装箱船',
    mmsi: '413000010',
    callsign: 'XHA10',
    flag: '中国',
    agent: '中远海运',
    anchorTime: '2026-03-19 08:30',
    destination: '宁波',
    cargo: '日用品',
    riskScore: 72,
    length: '230m',
    width: '36m',
    draft: '12.0m',
    speed: '4.5kn',
    type: '进入禁锚区', 
    summary: '该船在禁锚区【测试禁锚区2】内减速，疑似准备抛锚', 
    time: '11:38', 
    coords: [31.38, 121.58],
    level: 'alarm',
    timeline: [
      { time: '11:15:00', event: '通过圆圆沙报告线', type: 'info' },
      { time: '11:25:30', event: '进入禁锚区水域', type: 'info' },
      { time: '11:32:15', event: '航速降至 5kn 以下', type: 'warning' },
      { time: '11:38:10', event: '检测 wood 抛锚准备行为', type: 'risk' }
    ]
  },
  { 
    id: 'a3', 
    ship: '星海',
    englishName: 'Xing Hai',
    shipType: '油船',
    mmsi: '413000012',
    callsign: 'XH12',
    flag: '中国',
    agent: '新诚航运',
    anchorTime: '2026-03-18 20:15',
    destination: '舟山',
    cargo: '原油',
    riskScore: 65,
    length: '190m',
    width: '32m',
    draft: '11.5m',
    speed: '13.8kn',
    type: '超速警报', 
    summary: '该船在航道内航速超过 12 节限制', 
    time: '11:25', 
    coords: [31.42, 121.62],
    level: 'warning',
    timeline: [
      { time: '11:05:00', event: '进入吴淞主航道', type: 'info' },
      { time: '11:12:30', event: '航速持续上升 (11.5kn -> 12.8kn)', type: 'warning' },
      { time: '11:20:15', event: '超过航道限速阈值', type: 'warning' },
      { time: '11:25:00', event: '触发[超速航行]风险预警', type: 'risk' }
    ]
  },
  { 
    id: 'a4', 
    ship: '蓝波',
    englishName: 'Blue Wave',
    shipType: '拖船',
    mmsi: '413000015',
    destination: '南通',
    cargo: '无',
    riskScore: 45,
    length: '45m',
    width: '12m',
    draft: '4.5m',
    speed: '1.2kn',
    type: '走锚风险', 
    summary: '检测到该船在锚地内位置发生异常偏移，可能存在走锚风险', 
    time: '11:12', 
    coords: [31.45, 121.65],
    level: 'caution',
    timeline: [
      { time: '10:45:00', event: '进入南槽锚地', type: 'info' },
      { time: '11:00:15', event: '检测到位置持续漂移', type: 'warning' },
      { time: '11:08:30', event: '偏离锚位半径 > 50m', type: 'warning' },
      { time: '11:12:10', event: '触发[走锚风险]预警', type: 'risk' }
    ]
  },
];

const getRiskPlaybackSession = (item: typeof MOCK_RISK_STATS[number]) => {
  const weatherCondition =
    item.visibility.includes('3') || item.visibility.includes('5')
      ? '低能见度'
      : item.wind.includes('6')
        ? '大风影响'
        : '天气平稳';
  const dialogue = [
    {
      sender: item.name,
      content: `${item.name} 报告，发生区域 ${item.snapshot.location}，当前风险为「${item.risk}」。`,
      time: item.time.split(' ')[1] ?? item.time,
    },
    {
      sender: '吴淞交管',
      content: `收到，请重点关注「${item.risk}」并按指令修正动态。`,
      time: item.time.split(' ')[1] ?? item.time,
    },
  ];

  return {
    vessel: {
      name: item.name,
      mmsi: item.mmsi,
      type: item.type,
      callsign: item.callsign,
      destination: item.destination,
      speed: item.speed,
      draft: item.draft,
      length: item.length,
      width: item.width,
      cargo: item.cargo,
    },
    event: {
      coords: item.coords,
      time: item.time,
      label: item.risk,
      type: 'risk',
      desc: `${item.name} 于 ${item.time} 触发「${item.risk}」风险预警，发生区域 ${item.snapshot.location}。`,
      timeline: item.timeline.map((entry) => ({
        ...entry,
        desc: entry.event,
      })),
      dialogue,
      environment: [
        { label: '风险区域', value: item.snapshot.location },
        { label: '船首向', value: `${item.heading}°` },
        { label: '实际航速', value: `${item.speed.toFixed(1)} kn` },
        { label: '可视距离', value: item.visibility },
        { label: '交通密度', value: item.riskScore && item.riskScore >= 80 ? '高密度' : item.riskScore && item.riskScore >= 60 ? '中密度' : '常态' },
        { label: '管制状态', value: item.risk },
      ],
      weather: [
        { label: '风力', value: item.wind },
        { label: '浪高', value: item.wave },
        { label: '能见度', value: item.visibility },
      ],
    },
  };
};

type WarningRule = {
  id: string;
  name: string;
  category: '单船风险' | '多船风险' | '船与环境风险' | '碰撞风险';
  trigger: string;
  enabled: boolean;
  severity: '注意' | '警告' | '警报' | '紧急';
  responseLevel: '自动提醒' | '值班确认' | '联动处置';
  description: string;
  descriptions?: string[];
  effectiveAreaIds: string[];
};

const INITIAL_WARNING_RULES: WarningRule[] = [
  {
    id: 'wr-1',
    name: '进入禁航区',
    category: '船与环境风险',
    trigger: '敏感区域进出',
    enabled: true,
    severity: '紧急',
    responseLevel: '联动处置',
    description: '当船舶进入禁航区、警戒封控区等限制水域时触发高等级预警。',
    descriptions: ['识别船舶进入禁航区行为', '识别船舶进入警戒封控区行为'],
    effectiveAreaIds: ['1', '13', '15'],
  },
  {
    id: 'wr-2',
    name: '禁锚区抛锚',
    category: '单船风险',
    trigger: '敏感区域进出',
    enabled: true,
    severity: '警报',
    responseLevel: '值班确认',
    description: '在禁锚区内识别出减速、驻留、抛锚等行为时触发。',
    effectiveAreaIds: ['9', '14'],
  },
  {
    id: 'wr-3',
    name: '走锚',
    category: '单船风险',
    trigger: '异常行为',
    enabled: false,
    severity: '警告',
    responseLevel: '值班确认',
    description: '对锚泊船位移、漂移速度异常等特征进行识别。',
    effectiveAreaIds: ['9', '14'],
  },
  {
    id: 'wr-4',
    name: '非锚地水域锚泊',
    category: '单船风险',
    trigger: '单船事件',
    enabled: false,
    severity: '警告',
    responseLevel: '自动提醒',
    description: '对非授权锚泊水域内的异常停船、抛锚行为进行提醒。',
    effectiveAreaIds: ['2', '12'],
  },
  {
    id: 'wr-5',
    name: '航道内偏航',
    category: '单船风险',
    trigger: '异常行为',
    enabled: false,
    severity: '警告',
    responseLevel: '值班确认',
    description: '船舶航向、航迹偏离航道中心线超过阈值时触发。',
    effectiveAreaIds: ['10', '11'],
  },
  {
    id: 'wr-6',
    name: '非掉头区掉头',
    category: '单船风险',
    trigger: '异常行为',
    enabled: false,
    severity: '警告',
    responseLevel: '自动提醒',
    description: '监测船舶在非指定掉头区域内进行大幅转向或掉头操作。',
    effectiveAreaIds: ['10', '12'],
  },
  {
    id: 'wr-7',
    name: '反航道航行',
    category: '单船风险',
    trigger: '异常行为',
    enabled: false,
    severity: '警报',
    responseLevel: '联动处置',
    description: '识别船舶沿航道逆向行驶的高风险动态。',
    effectiveAreaIds: ['10', '11', '12'],
  },
  {
    id: 'wr-8',
    name: '航道内超速',
    category: '单船风险',
    trigger: '异常行为',
    enabled: true,
    severity: '警告',
    responseLevel: '自动提醒',
    description: '对超出航道限速阈值的行为进行持续监测与提醒。',
    effectiveAreaIds: ['10', '11', '12'],
  },
  {
    id: 'wr-9',
    name: '搁浅',
    category: '船与环境风险',
    trigger: '异常行为',
    enabled: false,
    severity: '紧急',
    responseLevel: '联动处置',
    description: '结合水深、吃水与航速变化识别可能的搁浅事件。',
    effectiveAreaIds: ['13', '15'],
  },
  {
    id: 'wr-10',
    name: '进入特定区域',
    category: '单船风险',
    trigger: '异常行为',
    enabled: true,
    severity: '警告',
    responseLevel: '值班确认',
    description: '对重点保护、施工、演练等指定区域的进入行为进行监测。',
    effectiveAreaIds: ['13', '14', '8'],
  },
  {
    id: 'wr-11',
    name: '航道内滞航',
    category: '单船风险',
    trigger: '异常行为',
    enabled: true,
    severity: '注意',
    responseLevel: '自动提醒',
    description: '对航道内长时间低速或停滞状态进行识别。',
    effectiveAreaIds: ['10', '11'],
  },
  {
    id: 'wr-12',
    name: '多船碰撞',
    category: '碰撞风险',
    trigger: '异常行为',
    enabled: false,
    severity: '紧急',
    responseLevel: '联动处置',
    description: '结合 CPA、TCPA 与多船会遇态势识别碰撞风险。',
    effectiveAreaIds: ['1', '10', '11', '13'],
  },
  {
    id: 'wr-13',
    name: '多船会遇紧迫局面',
    category: '多船风险',
    trigger: '异常行为',
    enabled: true,
    severity: '注意',
    responseLevel: '值班确认',
    description: '在重点监管水域内，对多船构成的紧迫局面进行识别与预警。',
    effectiveAreaIds: ['1', '10', '11'],
  },
];

const parseLegacyVhfTimestamp = (message: VHFMessage) => {
  const parsed = Date.parse(`${message.date}T${message.time}`);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getLegacyVhfRiskLevel = (message: VHFMessage): AggregatedVhfMessage['riskLevel'] =>
  message.sessionType === 'alert' ? 'high' : null;

const normalizeLegacyVhfMessage = (message: VHFMessage): AggregatedVhfMessage => ({
  id: message.id,
  speaker: message.sender,
  role: message.isVTS ? 'control' : 'ship',
  text: message.content,
  timestamp: parseLegacyVhfTimestamp(message),
  time: `${message.date} ${message.time}`,
  intent: message.sessionIntent,
  riskLevel: getLegacyVhfRiskLevel(message),
});

const getConversationCardTimeLabel = (card: ConversationCard) => {
  const start = card.messages[0]?.time;
  const end = card.messages[card.messages.length - 1]?.time;
  return start && end && start !== end ? `${start} - ${end}` : start || end;
};

const normalizeVhfShipName = (value: string) => value.replace(/[\s_-]+/g, '').toLowerCase();

const mergeVhfShipInfo = (
  current: VhfShipInfo | undefined,
  next: Partial<VhfShipInfo> & { name: string },
): VhfShipInfo => ({
  name: current?.name ?? next.name,
  englishName: next.englishName ?? current?.englishName,
  shipType: next.shipType ?? current?.shipType,
  mmsi: next.mmsi ?? current?.mmsi,
  callSign: next.callSign ?? current?.callSign,
  imo: next.imo ?? current?.imo,
  destination: next.destination ?? current?.destination,
  speed: next.speed ?? current?.speed,
  hdg: next.hdg ?? current?.hdg,
  length: next.length ?? current?.length,
  width: next.width ?? current?.width,
  draft: next.draft ?? current?.draft,
  cargoType: next.cargoType ?? current?.cargoType,
});

const createHomeShipTrack = (
  ship: ShipPosition,
  route: HomeShipDetail['route'],
): HomeShipTrackPoint[] => {
  const headingRadians = (ship.heading * Math.PI) / 180;
  const latStep = Math.cos(headingRadians) * 0.0068;
  const lngStep = Math.sin(headingRadians) * 0.0086;
  const offsets = [3.2, 2.2, 1.2, 0];
  const labels = [
    route.past || '上游航段',
    '进入辖区',
    route.current || '当前航段',
    '当前船位',
  ];
  const notes = [
    `从${route.past || '上游航段'}进入当前值班辖区`,
    '最近一次轨迹回放点，已完成航段切换',
    `正在沿 ${route.current || route.destination} 航行`,
    `当前航向 ${ship.heading}°，航速 ${ship.speed.toFixed(1)} kn`,
  ];
  const times = ['10:36', '10:52', '11:08', '11:20'];

  return offsets.map((offset, index) => ({
    id: `${ship.id}-track-${index}`,
    label: labels[index],
    time: times[index],
    coords: [ship.lat - latStep * offset, ship.lng - lngStep * offset],
    note: notes[index],
    kind: index === offsets.length - 1 ? 'current' : 'history',
  }));
};

const getHomeShipEnglishName = (name: string) => `MV ${name.replace(/\s+/g, '').toUpperCase()}`;

const getHomeShipMovement = (destination: string) => {
  if (destination.includes('锚地')) return '锚泊申请';
  if (destination.includes('码头') || destination.includes('港')) return '进港';
  return '出港';
};

const getHomeShipOperator = (destination: string) => {
  if (destination.includes('码头')) return `${destination}有限公司`;
  if (destination.includes('锚地')) return `${destination}调度中心`;
  return `${destination}港务公司`;
};

const createHomeShipDynamicEvents = ({
  shipId,
  route,
  intent,
  track,
}: {
  shipId: string;
  route: HomeShipDetail['route'];
  intent?: IntentItem;
  track: HomeShipTrackPoint[];
}): HomeShipDynamicEvent[] => {
  const fromTimeline: HomeShipDynamicEvent[] = (intent?.timeline || []).map((item, index) => ({
    id: `${shipId}-timeline-${index}`,
    time: item.time.replace(' UTC', ''),
    text: item.content,
    type: 'communication',
    level: 'info',
    trackPointId: track[Math.max(track.length - 1 - index, 0)]?.id ?? null,
  }));

  const baseDate = intent?.occurrenceTime?.split(' ')[0] || '2026-03-19';
  const fromTrack: HomeShipDynamicEvent[] = [...track].reverse().map((point, index) => ({
    id: `${shipId}-event-${index}`,
    time: `${baseDate} ${point.time}:12`,
    text: point.kind === 'current' 
      ? `正在沿 ${route.current} 航行`
      : point.label === '进入辖区'
        ? `进入值班辖区水域`
        : point.note,
    type: 'navigation',
    level: 'info',
    trackPointId: point.id,
  }));

  return [...fromTrack, ...fromTimeline].slice(0, 8).sort((a, b) => b.time.localeCompare(a.time));
};

const INTENT_DATA: IntentItem[] = [
  {
    ship: '远洋99',
    englishName: 'Ocean Pioneer 99',
    mmsi: '413000099',
    callSign: 'BYYP9',
    imo: '9123456',
    flag: '中国',
    agent: '中远海运',
    shipType: '散货船',
    cargoType: '煤炭',
    length: '185m',
    width: '32m',
    draft: '10.5m',
    speed: '12.5kn',
    past: '6号锚地',
    current: '吴淞口',
    destination: '黄浦江',
    confidence: 92,
    time: '11:20',
    occurrenceTime: '2026-03-19 11:20',
    details: '该船已完成起锚，目前在主航道由北向南行驶至吴淞口附近，正准备划江进入黄浦江。',
    intentSummary: '前往黄浦江，正在减速进入吴淞口主航道。',
    intentConfidence: 92,
    intentEta: '预计 8 分钟后进入报告线',
    risks: [
      {
        level: '紧急',
        text: 'CPA 0.18nm：与“海丰77”会遇',
        action: '保持右侧通过',
        counterparty: '海丰77',
        location: '吴淞口主航道交汇点',
        timeToEncounter: '约 6 分钟后',
      },
      { level: '警告', text: '航道偏移 +86m：已偏离推荐航迹', action: '回归中心线' },
      { level: '警告', text: '前方交通密集：2 分钟内进入交汇水域', action: '避免加速' },
    ],
    situation: {
      sog: '9.8kn',
      hdg: '214°',
      cpa: '0.18nm',
      tcpa: '06:20',
      xtd: '+86m',
      rot: '1.8°/min',
      trend: 'DCPA ↓',
    },
    recommendation: {
      action: '减速至 8kn 以下，回归推荐航迹，重点关注左前方会遇船。',
      priority: '立即',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '6号锚地', status: 'completed', action: '申请起锚' },
      { label: '吴淞口', status: 'active', action: '由北向南划江' },
      { label: '黄浦江', status: 'pending', action: '目的地' }
    ],
    timeline: [
      { time: '11:05 UTC', tag: '实时监控', content: '保持航向 184.2。周边区域交通繁忙。系统自主响应等级设置为 2。', status: 'active' },
      { time: '10:42 UTC', tag: '航点通过', content: '第 4 扇区过渡完成。航速稳定在 12.5 节。推进效率 94%。', status: 'completed' },
      { time: '09:15 UTC', tag: '初始序列', content: '从锚地启动离港序列。所有子系统运行正常。', status: 'initial' }
    ]
  },
  {
    ship: '海丰国际',
    englishName: 'SITC INTERNATIONAL',
    mmsi: '413000002',
    callSign: 'VRGT5',
    imo: '9234567',
    flag: '中国香港',
    agent: '海丰国际',
    shipType: '集装箱船',
    cargoType: '日用品',
    length: '210m',
    width: '35m',
    draft: '11.2m',
    speed: '15.8kn',
    past: '圆圆沙',
    current: '南槽航道',
    destination: '外高桥',
    confidence: 85,
    time: '11:35',
    occurrenceTime: '2026-03-19 11:35',
    details: '该船已从圆圆沙锚地起锚，目前正进入南槽航道由北向南航行，预计前往外高桥码头靠泊。',
    intentSummary: '前往外高桥码头，正在南槽航道保持进港队形。',
    intentConfidence: 85,
    intentEta: '预计 12 分钟后进入靠泊引导区',
    risks: [
      {
        level: '警报',
        text: 'CPA 0.22nm：与“远洋99”存在交叉会遇',
        action: '保持右舷避让',
        counterparty: '远洋99',
        location: '南槽入口交叉口',
        timeToEncounter: '约 5 分钟后',
      },
      { level: '警告', text: '航速 15.8kn：高于当前建议进港航速', action: '减速至 12kn' },
      { level: '警告', text: '前方密度升高：南槽入口船流叠加', action: '保持纵向间距' },
    ],
    situation: {
      sog: '15.8kn',
      hdg: '196°',
      cpa: '0.22nm',
      tcpa: '04:50',
      xtd: '+34m',
      rot: '0.7°/min',
      trend: 'TCPA ↓',
    },
    recommendation: {
      action: '减速进入队列，保持南槽中心线，提前关注交叉来船。',
      priority: '立即',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '圆圆沙', status: 'completed', action: '已起锚' },
      { label: '南槽航道', status: 'active', action: '由北向南航行' },
      { label: '外高桥', status: 'pending', action: '靠泊' }
    ],
    timeline: [
      { time: '11:25 UTC', tag: '实时监控', content: '进入南槽航道。当前流量中等。系统状态稳定。', status: 'active' },
      { time: '10:55 UTC', tag: '航点通过', content: '圆圆沙报告线通过。航速 11.8 节。', status: 'completed' },
      { time: '09:45 UTC', tag: '初始序列', content: '圆圆沙锚地起锚序列启动。', status: 'initial' }
    ]
  },
  {
    ship: '中远海运',
    shipType: '集装箱船',
    cargoType: '电子产品',
    length: '366m',
    width: '51m',
    draft: '14.5m',
    speed: '4.2kn',
    past: '外高桥',
    current: '外高桥码头',
    destination: '洋山港',
    confidence: 95,
    time: '11:45',
    occurrenceTime: '2026-03-19 11:45',
    details: '该船正在外高桥码头进行离泊作业，预计离泊后经南槽航道前往洋山港。',
    intentSummary: '前往洋山港，当前处于外高桥码头离泊阶段。',
    intentConfidence: 95,
    intentEta: '预计 6 分钟后完成解缆离泊',
    risks: [
      {
        level: '警告',
        text: '港池机动空间有限：拖轮作业窗口较短',
        action: '保持低速离泊',
        counterparty: '沪港拖08',
        location: '外高桥港池出口',
        timeToEncounter: '约 9 分钟后',
      },
      { level: '警告', text: '艏向调整中：旋回余度不足', action: '优先校正船首方向' },
      { level: '注意', text: '后方交通可控：无紧迫追越船', action: '按计划离泊' },
    ],
    situation: {
      sog: '4.2kn',
      hdg: '128°',
      cpa: '0.46nm',
      tcpa: '09:10',
      xtd: '+12m',
      rot: '2.2°/min',
      trend: 'ROT ↑',
    },
    recommendation: {
      action: '保持低速解缆，先完成艏向修正，再进入离港航道。',
      priority: '优先',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '外高桥', status: 'active', action: '离泊中' },
      { label: '南槽航道', status: 'pending', action: '航行' },
      { label: '洋山港', status: 'pending', action: '靠泊' }
    ],
    timeline: [
      { time: '11:40 UTC', tag: '实时监控', content: '解缆作业开始。拖轮已到位。', status: 'active' },
      { time: '11:30 UTC', tag: '离泊申请', content: 'VTS 批准离泊申请。', status: 'completed' }
    ]
  },
  {
    ship: '盛世油轮',
    shipType: '油船',
    cargoType: '原油',
    length: '245m',
    width: '42m',
    draft: '12.8m',
    speed: '2.5kn',
    past: '长江口',
    current: '10号锚地',
    destination: '10号锚地',
    confidence: 88,
    time: '11:52',
    occurrenceTime: '2026-03-19 11:52',
    details: '该船已抵达10号锚地，目前正在减速准备抛锚，等待后续进港指令。',
    intentSummary: '进入10号锚地，正在减速准备抛锚等待指令。',
    intentConfidence: 88,
    intentEta: '预计 5 分钟后完成抛锚动作',
    risks: [
      {
        level: '警告',
        text: '锚地内相邻船距收缩：左舷船间距不足',
        action: '限制横移',
        counterparty: '海巡21',
        location: '10号锚地西侧入锚点',
        timeToEncounter: '约 11 分钟后',
      },
      { level: '警告', text: '航速 2.5kn：抛锚前减速不足', action: '继续降至 1kn 以下' },
      { level: '注意', text: '风流可控：当前不影响锚泊', action: '维持艏向稳定' },
    ],
    situation: {
      sog: '2.5kn',
      hdg: '071°',
      cpa: '0.62nm',
      tcpa: '11:40',
      xtd: '+18m',
      rot: '0.5°/min',
      trend: 'SOG ↓',
    },
    recommendation: {
      action: '继续减速并限制横移，确认锚位后再执行抛锚。',
      priority: '优先',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '长江口', status: 'completed', action: '进港航行' },
      { label: '10号锚地', status: 'active', action: '准备抛锚' },
      { label: '10号锚地', status: 'pending', action: '锚泊' }
    ],
    timeline: [
      { time: '11:50 UTC', tag: '实时监控', content: '航速降至 3 节以下。准备抛锚。', status: 'active' },
      { time: '11:45 UTC', tag: '位置报告', content: '进入10号锚地水域。', status: 'completed' }
    ]
  },
  {
    ship: '东海拖01',
    shipType: '拖船',
    cargoType: '无',
    length: '45m',
    width: '12m',
    draft: '4.2m',
    speed: '8.5kn',
    past: '北槽',
    current: '主航道',
    destination: '南槽',
    confidence: 90,
    time: '12:05',
    occurrenceTime: '2026-03-19 12:05',
    details: '该船正在穿越主航道，从北槽前往南槽执行拖带任务，需注意避让主航道直航船舶。',
    intentSummary: '由北槽前往南槽，正在申请穿越主航道执行拖带任务。',
    intentConfidence: 90,
    intentEta: '预计 4 分钟后进入主航道中心带',
    risks: [
      {
        level: '紧急',
        text: '主航道直航船接近：TCPA 03:10',
        action: '延后穿越窗口',
        counterparty: '新海安',
        location: '3号浮北侧会遇点',
        timeToEncounter: '约 3 分钟后',
      },
      { level: '警告', text: '横穿角度偏大：穿越时间被拉长', action: '调整为快速直穿' },
      { level: '警告', text: '周边交通密集：拖带作业机动受限', action: '提前通报周边船舶' },
    ],
    situation: {
      sog: '8.5kn',
      hdg: '156°',
      cpa: '0.24nm',
      tcpa: '03:10',
      xtd: '+55m',
      rot: '1.1°/min',
      trend: 'CPA ↓',
    },
    recommendation: {
      action: '延后穿越，待主航道直航船通过后再快速直穿。',
      priority: '立即',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '北槽', status: 'completed', action: '航行' },
      { label: '主航道', status: 'active', action: '穿越主航道' },
      { label: '南槽', status: 'pending', action: '执行任务' }
    ],
    timeline: [
      { time: '12:00 UTC', tag: '实时监控', content: '开始穿越主航道。已通报周边船舶。', status: 'active' },
      { time: '11:55 UTC', tag: '穿越申请', content: 'VTS 提醒注意避让进港大船。', status: 'completed' }
    ]
  },
  {
    ship: '运兴96',
    shipType: '货船',
    cargoType: '杂货',
    length: '96m',
    width: '16m',
    draft: '5.5m',
    speed: '9.2kn',
    past: '长江口',
    current: '吴淞口',
    destination: '黄浦江',
    confidence: 90,
    time: '16:32',
    occurrenceTime: '2025-12-17 16:32',
    details: '该船正在吴淞口水域航行，准备划江进入黄浦江。',
    intentSummary: '前往黄浦江，当前在吴淞口水域准备划江进入内港。',
    intentConfidence: 90,
    intentEta: '预计 7 分钟后进入黄浦江口门',
    risks: [
      {
        level: '警告',
        text: '交通流汇聚：吴淞口入口双向船流叠加',
        action: '保持现航向待机',
        counterparty: '蓝波',
        location: '吴淞口警戒线南侧',
        timeToEncounter: '约 8 分钟后',
      },
      { level: '警告', text: '航道偏移 +42m：接近航道右侧边界', action: '回归推荐航迹' },
      { level: '注意', text: 'CPA 0.41nm：当前会遇风险可控', action: '持续观察' },
    ],
    situation: {
      sog: '9.2kn',
      hdg: '172°',
      cpa: '0.41nm',
      tcpa: '08:35',
      xtd: '+42m',
      rot: '0.6°/min',
      trend: 'XTD ↑',
    },
    recommendation: {
      action: '保持当前航速，先回归中心线，再按窗口进入黄浦江。',
      priority: '优先',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '长江口', status: 'completed', action: '进港' },
      { label: '吴淞口', status: 'active', action: '划江' },
      { label: '黄浦江', status: 'pending', action: '靠泊' }
    ],
    timeline: [
      { time: '16:32 UTC', tag: '实时监控', content: '呼叫吴淞中心。', status: 'active' }
    ]
  }
];

const getPrimaryIntentAction = (item: IntentItem) =>
  item.path.find((step) => step.status === 'active')?.action || '正常航行';

const getCompactIntentLine = (item: IntentItem) =>
  `${getPrimaryIntentAction(item)} → ${item.destination}（${item.intentConfidence}%）`;

const getCompactRiskLines = (item: IntentItem) => {
  const collisionRisk = item.risks[0];
  const tone = collisionRisk.level === '紧急' || collisionRisk.level === '警报' ? 'high' : 'medium';

  return [
    {
      tone,
      label: '风险：',
      text: `与${collisionRisk.counterparty || '目标船'}会遇｜CPA ${item.situation.cpa}`,
    },
    {
      tone,
      label: '会遇：',
      text: `${collisionRisk.location || item.current}｜${collisionRisk.timeToEncounter || `${item.situation.tcpa} 后`}`,
    },
  ];
};

const ANCHORAGE_TYPE_LABELS = [
  '不可用(默认)',
  '地效翼船(WIG)',
  '渔船',
  '工作船',
  '工作船（船长＞200m或船宽＞25m）',
  '从事疏浚或水下作业的船舶',
  '潜水工作船',
  '军用船舶',
  '帆船',
  '游乐船',
  '已预留',
  '高速船 (HSC)',
  '引航船',
  '救助船',
  '拖船',
  '航标',
  '污染控制船',
  '执法船',
  '备用-本地船只',
  '医疗运输船',
  '根据《无线电规则》第18号决议的非战斗舰',
  '客船',
  '货船',
  '油船',
  '其他',
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getAnchorageTypeStats = (anchorageId: string) =>
  ANCHORAGE_TYPE_LABELS.map((type, index) => ({
    type,
    count: (hashString(`${anchorageId}-${type}-${index}`) % 5) + 1,
  })).sort((left, right) => right.count - left.count);

const ANCHORAGE_TYPE_CHART_COLORS = [
  '#47d77d',
  '#55b7ff',
  '#f6b73c',
  '#ff6666',
  '#a567ff',
  '#6f86ff',
  '#ff63c8',
  '#8e9aac',
];

const getAnchorageAvailabilityRatio = (occupied: number, capacity: number) => {
  const safeCapacity = Math.max(capacity, 0);
  const safeOccupied = Math.min(Math.max(occupied, 0), safeCapacity);
  const remaining = Math.max(safeCapacity - safeOccupied, 0);
  return safeCapacity > 0 ? remaining / safeCapacity : 0;
};

// --- 后台管理组件 ---

const AdminPanel = ({ 
  onClose, 
  playbackData, 
  setPlaybackData,
  setDynamicPlaybackSession,
  initialMenu,
  initialStatsTab
}: { 
  onClose: () => void,
  playbackData: any,
  setPlaybackData: (data: any) => void,
  setDynamicPlaybackSession: (data: any) => void,
  initialMenu?: string,
  initialStatsTab?: string
}) => {
  const [activeMenu, setActiveMenu] = useState(initialMenu || '区域设置');
  const [activeSubTab, setActiveSubTab] = useState('值班区域');
  const [activeScenarioTab, setActiveScenarioTab] = useState('VHF船舶会话');
  const [activeStatsTab, setActiveStatsTab] = useState(initialStatsTab || '值班统计');
  const [activeWarningTab, setActiveWarningTab] = useState('实时预警');
  const [activeRiskAnalysisTab, setActiveRiskAnalysisTab] = useState('月度');
  const [statsTimeRange, setStatsTimeRange] = useState('今天');
  const [activeRiskLevel, setActiveRiskLevel] = useState<string | null>(null);
  const [riskStatusFilter, setRiskStatusFilter] = useState('全部');
  const [riskFalsePositiveFilter, setRiskFalsePositiveFilter] = useState('全部');
  const [customStartTime, setCustomStartTime] = useState('2026-04-20 00:00');
  const [customEndTime, setCustomEndTime] = useState('2026-04-20 23:59');
  const [statsArea, setStatsArea] = useState('全部区域');
  const [showVhfDetails, setShowVhfDetails] = useState(false);
  const [selectedVhfSnippet, setSelectedVhfSnippet] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [areaConfig, setAreaConfig] = useState<MockAreaMap>(() =>
    Object.fromEntries(
      Object.entries(MOCK_AREAS).map(([category, areas]) => [
        category,
        areas.map((area) => ({
          ...area,
          fields: { ...area.fields },
        })),
      ]),
    ) as MockAreaMap,
  );
  const [warningRules, setWarningRules] = useState(() => INITIAL_WARNING_RULES.map((rule) => ({ ...rule })));
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [areaTypeFilter, setAreaTypeFilter] = useState('全部类型');
  const [areaPageSize, setAreaPageSize] = useState(10);
  const [areaCurrentPage, setAreaCurrentPage] = useState(1);
  const warningAreaGroups = useMemo(
    () => AREA_CATEGORIES.map((category) => ({ category, areas: areaConfig[category] || [] })),
    [areaConfig],
  );
  const allWarningAreas = useMemo(
    () =>
      warningAreaGroups.flatMap(({ category, areas }) =>
        areas.map((area) => ({
          ...area,
          category,
        })),
      ),
    [warningAreaGroups],
  );
  const warningAreaLookup = useMemo(
    () =>
      new Map(
        allWarningAreas.map((area) => [area.id, area] as const),
      ),
    [allWarningAreas],
  );
  const activeAreaList = useMemo(() => areaConfig[activeSubTab] || [], [activeSubTab, areaConfig]);
  const activeAreaTypeOptions = useMemo(
    () => ['全部类型', ...new Set(activeAreaList.map((area) => area.type))],
    [activeAreaList],
  );
  const filteredAreaList = useMemo(() => {
    const keyword = areaSearchQuery.trim().toLowerCase();
    return activeAreaList.filter((area) => {
      const matchesKeyword =
        !keyword ||
        area.name.toLowerCase().includes(keyword) ||
        area.type.toLowerCase().includes(keyword);
      const matchesType = areaTypeFilter === '全部类型' || area.type === areaTypeFilter;
      return matchesKeyword && matchesType;
    });
  }, [activeAreaList, areaSearchQuery, areaTypeFilter]);
  const areaTotalPages = Math.max(1, Math.ceil(filteredAreaList.length / areaPageSize));
  const paginatedAreaList = useMemo(() => {
    const startIndex = (areaCurrentPage - 1) * areaPageSize;
    return filteredAreaList.slice(startIndex, startIndex + areaPageSize);
  }, [areaCurrentPage, areaPageSize, filteredAreaList]);
  const areaPageNumbers = useMemo(() => {
    if (areaTotalPages <= 7) {
      return Array.from({ length: areaTotalPages }, (_, index) => index + 1);
    }
    if (areaCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis-end', areaTotalPages];
    }
    if (areaCurrentPage >= areaTotalPages - 3) {
      return [1, 'ellipsis-start', areaTotalPages - 4, areaTotalPages - 3, areaTotalPages - 2, areaTotalPages - 1, areaTotalPages];
    }
    return [1, 'ellipsis-start', areaCurrentPage - 1, areaCurrentPage, areaCurrentPage + 1, 'ellipsis-end', areaTotalPages];
  }, [areaCurrentPage, areaTotalPages]);
  const [isWarningConfigOpen, setIsWarningConfigOpen] = useState(false);
  const [selectedWarningRuleId, setSelectedWarningRuleId] = useState(INITIAL_WARNING_RULES[0]?.id || '');
  const [warningAreaSearchQuery, setWarningAreaSearchQuery] = useState('');
  const deferredWarningAreaSearchQuery = useDeferredValue(warningAreaSearchQuery);
  const [selectedWarningAreaCategory, setSelectedWarningAreaCategory] = useState<string>(AREA_CATEGORIES[0]);
  const [selectedWarningAreaTypes, setSelectedWarningAreaTypes] = useState<string[]>([]);
  const [expandedWarningAreaCategories, setExpandedWarningAreaCategories] = useState<string[]>([AREA_CATEGORIES[0]]);
  const [isWarningAreaBoxSelectEnabled, setIsWarningAreaBoxSelectEnabled] = useState(false);
  const [selectedRiskConfigAreaType, setSelectedRiskConfigAreaType] = useState<RiskConfigAreaType>('全部');
  const selectedWarningRule = useMemo(
    () => warningRules.find((rule) => rule.id === selectedWarningRuleId) || warningRules[0] || null,
    [selectedWarningRuleId, warningRules],
  );
  const selectedWarningAreaIds = selectedWarningRule?.effectiveAreaIds || [];
  const selectedWarningAreaGroup = useMemo(
    () => warningAreaGroups.find((group) => group.category === selectedWarningAreaCategory) || warningAreaGroups[0],
    [selectedWarningAreaCategory, warningAreaGroups],
  );
  const warningAreaTypeOptions = useMemo(
    () => [...new Set((selectedWarningAreaGroup?.areas || []).map((area) => area.type))],
    [selectedWarningAreaGroup],
  );
  const filteredWarningAreas = useMemo(() => {
    const keyword = deferredWarningAreaSearchQuery.trim().toLowerCase();

    return (selectedWarningAreaGroup?.areas || []).filter((area) => {
      const matchesKeyword =
        !keyword ||
        area.name.toLowerCase().includes(keyword) ||
        area.type.toLowerCase().includes(keyword);
      const matchesRiskType =
        selectedRiskConfigAreaType === '全部' ||
        getRiskConfigAreaType({ type: area.type, category: selectedWarningAreaGroup.category }) === selectedRiskConfigAreaType;
      const matchesLayer = selectedWarningAreaTypes.length === 0 || selectedWarningAreaTypes.includes(area.type);

      return matchesKeyword && matchesRiskType && matchesLayer;
    });
  }, [
    deferredWarningAreaSearchQuery,
    selectedRiskConfigAreaType,
    selectedWarningAreaGroup,
    selectedWarningAreaTypes,
  ]);
  const warningMapFeatures = useMemo(
    () =>
      filteredWarningAreas.map((area, index) =>
        createWarningAreaFeature(area, selectedWarningAreaGroup.category, index, filteredWarningAreas.length),
      ),
    [filteredWarningAreas, selectedWarningAreaGroup],
  );
  const selectedWarningAreaGroupSelectedCount = useMemo(
    () => (selectedWarningAreaGroup?.areas || []).filter((area) => selectedWarningAreaIds.includes(area.id)).length,
    [selectedWarningAreaGroup, selectedWarningAreaIds],
  );
  const selectedWarningAreaPreview = useMemo(
    () => allWarningAreas.filter((area) => selectedWarningAreaIds.includes(area.id)).slice(0, 8),
    [allWarningAreas, selectedWarningAreaIds],
  );
  const selectedWarningAreaHiddenCount = Math.max(0, selectedWarningAreaIds.length - selectedWarningAreaPreview.length);
  const selectedWarningAreaTypeSummary = useMemo(() => {
    const counts = new Map<string, number>();
    allWarningAreas.forEach((area) => {
      if (!selectedWarningAreaIds.includes(area.id)) return;
      counts.set(area.type, (counts.get(area.type) || 0) + 1);
    });

    return Array.from(counts, ([type, count]) => ({ type, count }));
  }, [allWarningAreas, selectedWarningAreaIds]);
  const riskConfigAreaTypeStats = useMemo(
    () =>
      (['全部', '航道', '锚地', '泊位'] as RiskConfigAreaType[]).map((key) => {
        const areas =
          key === '全部'
            ? selectedWarningAreaGroup?.areas || []
            : (selectedWarningAreaGroup?.areas || []).filter(
                (area) => getRiskConfigAreaType({ type: area.type, category: selectedWarningAreaGroup.category }) === key,
              );

        return {
          key,
          label: key === '全部' ? '全部区域' : key,
          count: areas.length,
          selectedCount: areas.filter((area) => selectedWarningAreaIds.includes(area.id)).length,
        };
      }),
    [selectedWarningAreaGroup, selectedWarningAreaIds],
  );

  const menus = [
    { name: '个人信息', icon: User },
    { name: '角色管理', icon: Users },
    { name: '权限管理', icon: Lock },
    { name: '账号管理', icon: User },
    { name: '区域设置', icon: MapIcon },
    { name: '船舶动态', icon: Activity },
    { name: '字典管理', icon: BookOpen },
    { name: '语音设置', icon: Volume2 },
    { name: '显示设置', icon: Monitor },
    { name: '业务统计', icon: BarChart3 },
    { name: '预警管理', icon: Shield },
    { name: '场景演示', icon: Presentation },
  ];

  const handleEdit = (area: any) => {
    setEditData({
      ...area,
      category: activeSubTab,
      fields: area.fields || {}
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    const category = activeSubTab;
    const defaultType = Object.keys(AREA_TYPE_MAPPING[category])[0];
    const defaultFields: Record<string, string> = {};
    AREA_TYPE_MAPPING[category][defaultType].forEach(f => {
      defaultFields[f] = '';
    });
    
    setEditData({ 
      name: '', 
      category, 
      type: defaultType,
      fields: defaultFields 
    });
    setIsEditing(true);
  };

  const handleSaveArea = () => {
    if (!editData?.name?.trim() || !editData?.category || !editData?.type) {
      return;
    }

    const normalizedArea = {
      id: editData.id || `custom-${Date.now()}`,
      name: editData.name.trim(),
      time: editData.time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      type: editData.type,
      status: editData.status || '正常',
      fields: { ...(editData.fields || {}) },
    };

    setAreaConfig((current) => {
      const nextAreas = [...(current[editData.category] || [])];
      const existingIndex = nextAreas.findIndex((area) => area.id === normalizedArea.id);

      if (existingIndex >= 0) {
        nextAreas[existingIndex] = normalizedArea;
      } else {
        nextAreas.push(normalizedArea);
      }

      return {
        ...current,
        [editData.category]: nextAreas,
      };
    });
    setIsEditing(false);
  };

  const handleDeleteArea = (category: string, areaId: string) => {
    setAreaConfig((current) => ({
      ...current,
      [category]: (current[category] || []).filter((area) => area.id !== areaId),
    }));
    setWarningRules((current) =>
      current.map((rule) => ({
        ...rule,
        effectiveAreaIds: rule.effectiveAreaIds.filter((id) => id !== areaId),
      })),
    );
    if (editData?.id === areaId) {
      setIsEditing(false);
      setEditData(null);
    }
  };

  const toggleWarningRule = (ruleId: string) => {
    setWarningRules((current) =>
      current.map((rule) =>
        rule.id === ruleId
          ? { ...rule, enabled: !rule.enabled }
          : rule,
      ),
    );
  };

  const updateWarningRule = (ruleId: string, updater: (rule: WarningRule) => WarningRule) => {
    setWarningRules((current) => current.map((rule) => (rule.id === ruleId ? updater(rule) : rule)));
  };

  const openWarningRuleConfig = (ruleId: string) => {
    setSelectedWarningRuleId(ruleId);
    setIsWarningConfigOpen(true);
  };

  const resetWarningRuleConfig = (ruleId: string) => {
    const defaultRule = INITIAL_WARNING_RULES.find((rule) => rule.id === ruleId);
    if (!defaultRule) return;
    setWarningRules((current) => current.map((rule) => (rule.id === ruleId ? { ...defaultRule } : rule)));
  };

  const setWarningRuleAreaIds = (ruleId: string, areaIds: string[]) => {
    setWarningRules((current) =>
      current.map((rule) =>
        rule.id === ruleId
          ? { ...rule, effectiveAreaIds: Array.from(new Set(areaIds)) }
          : rule,
      ),
    );
  };

  const toggleWarningRuleArea = (ruleId: string, areaId: string) => {
    const rule = warningRules.find((item) => item.id === ruleId);
    if (!rule) return;
    const nextAreaIds = rule.effectiveAreaIds.includes(areaId)
      ? rule.effectiveAreaIds.filter((id) => id !== areaId)
      : [...rule.effectiveAreaIds, areaId];
    setWarningRuleAreaIds(ruleId, nextAreaIds);
  };

  const toggleWarningRuleAreaCategory = (ruleId: string, areaIds: string[]) => {
    const rule = warningRules.find((item) => item.id === ruleId);
    if (!rule) return;
    const allSelected = areaIds.length > 0 && areaIds.every((id) => rule.effectiveAreaIds.includes(id));
    const nextAreaIds = allSelected
      ? rule.effectiveAreaIds.filter((id) => !areaIds.includes(id))
      : [...rule.effectiveAreaIds, ...areaIds];
    setWarningRuleAreaIds(ruleId, nextAreaIds);
  };

  const clearWarningRuleAreas = (ruleId: string, areaIds?: string[]) => {
    const rule = warningRules.find((item) => item.id === ruleId);
    if (!rule) return;
    setWarningRuleAreaIds(
      ruleId,
      areaIds ? rule.effectiveAreaIds.filter((id) => !areaIds.includes(id)) : [],
    );
  };

  const invertWarningRuleAreas = (ruleId: string, areaIds: string[]) => {
    const rule = warningRules.find((item) => item.id === ruleId);
    if (!rule) return;
    const selected = new Set<string>(rule.effectiveAreaIds);
    areaIds.forEach((id) => {
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
    });
    setWarningRuleAreaIds(ruleId, Array.from(selected));
  };

  const handleSelectRiskConfigAreaType = (type: RiskConfigAreaType) => {
    setSelectedRiskConfigAreaType(type);
    if (type === '全部') {
      setSelectedWarningAreaTypes(warningAreaTypeOptions);
      return;
    }
    setSelectedWarningAreaTypes(
      warningAreaTypeOptions.filter((areaType) =>
        getRiskConfigAreaType({ type: areaType, category: selectedWarningAreaGroup.category }) === type,
      ),
    );
  };

  const handleToggleWarningAreaType = (type: string) => {
    setSelectedWarningAreaTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };

  const toggleExpandedWarningAreaCategory = (category: string) => {
    setExpandedWarningAreaCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handleSelectWarningAreasByBounds = (ruleId: string, bounds: L.LatLngBounds) => {
    const areaIds = warningMapFeatures
      .filter((feature) => bounds.contains(L.latLng(feature.center[0], feature.center[1])))
      .map((feature) => feature.id);
    if (areaIds.length === 0) return;
    toggleWarningRuleAreaCategory(ruleId, areaIds);
  };

  const handleToggleAreaStatus = (category: string, areaId: string) => {
    setAreaConfig((current) => ({
      ...current,
      [category]: (current[category] || []).map((area) =>
        area.id === areaId
          ? { ...area, status: area.status === '停用' ? '正常' : '停用' }
          : area,
      ),
    }));
  };

  useEffect(() => {
    setAreaCurrentPage(1);
  }, [activeSubTab, areaSearchQuery, areaTypeFilter, areaPageSize]);

  useEffect(() => {
    if (!activeAreaTypeOptions.includes(areaTypeFilter)) {
      setAreaTypeFilter('全部类型');
    }
  }, [activeAreaTypeOptions, areaTypeFilter]);

  useEffect(() => {
    if (areaCurrentPage > areaTotalPages) {
      setAreaCurrentPage(areaTotalPages);
    }
  }, [areaCurrentPage, areaTotalPages]);

  useEffect(() => {
    if (!warningAreaGroups.some((group) => group.category === selectedWarningAreaCategory)) {
      setSelectedWarningAreaCategory(warningAreaGroups[0]?.category || AREA_CATEGORIES[0]);
    }
  }, [selectedWarningAreaCategory, warningAreaGroups]);

  useEffect(() => {
    setSelectedWarningAreaTypes((current) => {
      const available = current.filter((type) => warningAreaTypeOptions.includes(type));
      return available.length > 0 ? available : warningAreaTypeOptions;
    });
  }, [warningAreaTypeOptions]);

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="fixed inset-0 z-[7000] bg-[#050a10] flex flex-col overflow-hidden"
      >
        <header className="h-12 border-b border-white/5 bg-[#0a101a] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">名称:</span>
              <input 
                type="text" 
                value={editData?.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="请输入区域名称" 
                className="bg-transparent border-none text-xs text-white focus:outline-none w-48"
              />
            </div>
            <div className="flex gap-2">
              <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all">绘制</button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all">重绘</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="bg-white/5 hover:bg-white/10 text-white/60 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              取消并返回
            </button>
            <button 
              onClick={handleSaveArea}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-sky-600/20"
            >
              保存并返回
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 relative bg-[#0a0a0a]">
            {/* 模拟地图视图 */}
            <MapContainer 
              center={[31.40, 121.52]} 
              zoom={13} 
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                url={VTS_CHART_TILE_URL}
                attribution={VTS_CHART_TILE_ATTRIBUTION}
              />
              <div className="absolute inset-0 pointer-events-none border-4 border-sky-500/20 z-[1000]" />
            </MapContainer>
            
            {editData?.type !== '值班台' && (
              <div className="absolute top-4 left-4 z-[1000] bg-[#0a101a]/90 backdrop-blur-md border border-white/10 rounded-xl p-4 w-72 shadow-2xl flex flex-col max-h-[calc(100%-2rem)]">
                <h3 className="text-sm font-black text-white/90 mb-4 flex items-center gap-2 shrink-0">
                  <div className="w-1 h-4 bg-sky-500 rounded-full" />
                  区域信息
                </h3>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">类型</label>
                    <select 
                      value={editData?.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const newFields: Record<string, string> = {};
                        AREA_TYPE_MAPPING[editData.category][newType].forEach(f => {
                          newFields[f] = '';
                        });
                        setEditData({ ...editData, type: newType, fields: newFields });
                      }}
                      className="w-full bg-[#1a202a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50 appearance-none cursor-pointer"
                    >
                      {Object.keys(AREA_TYPE_MAPPING[editData?.category] || {}).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-[10px] font-bold text-white/60 transition-all">点</button>
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-[10px] font-bold text-white/60 transition-all">线</button>
                    <button className="bg-sky-500/20 border border-sky-500/30 rounded-lg py-2 text-[10px] font-bold text-sky-400 transition-all">面</button>
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-[10px] font-bold text-white/60 transition-all">清空</button>
                  </div>
                  
                  {/* 动态字段映射 */}
                  {AREA_TYPE_MAPPING[editData?.category]?.[editData?.type]?.map(field => (
                    <div key={field}>
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-1.5">{field}</label>
                      <input 
                        type="text" 
                        value={editData?.fields?.[field] || ''}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          fields: { ...editData.fields, [field]: e.target.value } 
                        })}
                        placeholder={`请输入${field}`}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500/50" 
                      />
                    </div>
                  ))}

                  {AREA_TYPE_MAPPING[editData?.category]?.[editData?.type]?.length === 0 && (
                    <div className="py-8 text-center border border-dashed border-white/5 rounded-xl">
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">该类型无需额外参数</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[6000] bg-[#050a10] flex flex-col overflow-hidden"
    >
      {/* 顶部栏 */}
      <header className="h-12 border-b border-white/5 bg-[#0a101a] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-all flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            <span className="text-xs font-bold">返回地图</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <aside className="w-56 border-r border-white/5 bg-[#0a101a]/50 flex flex-col shrink-0">
          <div className="p-4 flex items-center gap-2 text-white/80 border-b border-white/5 mb-2">
            <Settings size={16} className="text-sky-400" />
            <span className="text-sm font-black tracking-widest">后台管理系统</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 custom-scrollbar">
            <div className="px-3 py-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">个人中心</div>
            {menus.map(menu => (
              <button
                key={menu.name}
                onClick={() => setActiveMenu(menu.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${activeMenu === menu.name ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
              >
                <menu.icon size={16} className={activeMenu === menu.name ? 'text-sky-400' : 'text-white/20 group-hover:text-white/40'} />
                <span className="text-xs font-medium">{menu.name}</span>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-white/5">
            <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-400/60 hover:text-red-400 transition-all">
              <LogOut size={14} /> 退出系统
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className={`flex-1 bg-[#050a10] overflow-y-auto ${activeMenu === '预警管理' || activeMenu === '区域设置' ? 'p-0' : 'p-6'}`}>
          {activeMenu !== '预警管理' && activeMenu !== '区域设置' && (
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight text-white/90 flex items-center gap-3">
                <div className="w-1 h-6 bg-sky-500 rounded-full" />
                {activeMenu}
                {activeMenu === '业务统计' && (
                  <div className="flex bg-white/5 rounded-lg p-0.5 ml-4">
                    {['值班统计', '意图统计'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveStatsTab(tab)}
                        className={`px-4 py-1.5 text-[11px] font-bold rounded-md transition-all whitespace-nowrap ${activeStatsTab === tab ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
              </h2>
              <div className="text-xs text-white/30 font-mono">
                后台管理 / {activeMenu}
              </div>
            </div>
          )}

          {activeMenu === '区域设置' && (
            <div className="h-full min-h-full bg-[#07111f] flex flex-col">
              <div className="h-12 border-b border-white/10 bg-[#101925] px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Layout size={14} className="text-white/70" />
                  <div className="w-1 h-4 rounded-full bg-sky-400" />
                  <span className="text-[15px] font-semibold text-white">区域设置</span>
                </div>
                <div className="flex items-center gap-4 text-white/70">
                  <button className="hover:text-white transition-colors">
                    <Search size={16} />
                  </button>
                  <button className="hover:text-white transition-colors">
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-5">
                <div className="flex items-center justify-end">
                  <button className="rounded bg-sky-500/10 px-4 py-2 text-[12px] font-semibold text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition-colors">
                    全图预览
                  </button>
                </div>

                <div className="mt-8 flex items-center justify-between gap-6">
                  <div className="flex rounded-xl bg-white/[0.06] p-1">
                    {AREA_CATEGORIES.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveSubTab(tab)}
                        className={`min-w-[120px] rounded-lg px-5 py-3 text-[13px] font-medium transition-all ${
                          activeSubTab === tab
                            ? 'bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.28)]'
                            : 'text-white/45 hover:text-white/70'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        value={areaSearchQuery}
                        onChange={(e) => setAreaSearchQuery(e.target.value)}
                        placeholder="搜索区域名称..."
                        className="h-10 w-52 rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-4 text-[12px] text-white placeholder:text-white/20 focus:outline-none focus:border-sky-500/40"
                      />
                    </div>
                    <select
                      value={areaTypeFilter}
                      onChange={(e) => setAreaTypeFilter(e.target.value)}
                      className="h-10 min-w-[120px] rounded-lg border border-white/10 bg-white/[0.03] px-4 text-[12px] text-white focus:outline-none focus:border-sky-500/40"
                    >
                      {activeAreaTypeOptions.map((type) => (
                        <option key={type} value={type} className="bg-[#111923] text-white">
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-1 rounded-full bg-sky-400" />
                    <span className="text-[14px] font-semibold text-white">数据列表</span>
                    <span className="text-[12px] text-white/35">共 {filteredAreaList.length} 条</span>
                  </div>
                  <button
                    onClick={handleCreate}
                    className="rounded-lg bg-sky-500/10 px-4 py-2 text-[12px] font-semibold text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> 新增区域
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.05]">
                        <th className="w-10 px-4 py-4"></th>
                        <th className="px-4 py-4 text-[11px] font-bold text-white/40">区域名称</th>
                        <th className="px-4 py-4 text-[11px] font-bold text-white/40">类型</th>
                        <th className="px-4 py-4 text-[11px] font-bold text-white/40">状态</th>
                        <th className="px-4 py-4 text-[11px] font-bold text-white/40">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAreaList.map((area) => {
                        const isEnabled = area.status !== '停用';
                        return (
                          <React.Fragment key={area.id}>
                            <tr
                              className={`border-b border-white/5 transition-colors ${expandedRowId === area.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.03]'}`}
                            >
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => setExpandedRowId(expandedRowId === area.id ? null : area.id)}
                                  className="text-white/30 hover:text-white transition-colors"
                                  aria-label={`展开 ${area.name}`}
                                >
                                  <ChevronRight size={14} className={`transition-transform ${expandedRowId === area.id ? 'rotate-90' : ''}`} />
                                </button>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                                  <span className="text-[13px] text-white/88">{area.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="inline-flex rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/45">
                                  {area.type}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => handleToggleAreaStatus(activeSubTab, area.id)}
                                  className={`relative h-5 w-9 rounded-full transition-all ${isEnabled ? 'bg-[#0d76e8]' : 'bg-white/20'}`}
                                  aria-label={`${area.name}${isEnabled ? '停用' : '启用'}`}
                                >
                                  <span
                                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${isEnabled ? 'left-[18px]' : 'left-0.5'}`}
                                  />
                                </button>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-4 text-[12px] font-semibold">
                                  <button
                                    onClick={() => setExpandedRowId(expandedRowId === area.id ? null : area.id)}
                                    className="text-sky-400 hover:text-sky-300 transition-colors"
                                  >
                                    查看
                                  </button>
                                  <button
                                    onClick={() => handleEdit(area)}
                                    className="text-sky-400 hover:text-sky-300 transition-colors"
                                  >
                                    修改
                                  </button>
                                  <button
                                    onClick={() => handleDeleteArea(activeSubTab, area.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    删除
                                  </button>
                                </div>
                              </td>
                            </tr>
                            <AnimatePresence>
                              {expandedRowId === area.id && (
                                <tr>
                                  <td colSpan={5} className="bg-black/20 p-0">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-6 py-5">
                                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                                          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">创建时间</div>
                                            <div className="mt-2 text-[12px] text-white/75">{area.time}</div>
                                          </div>
                                          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">当前状态</div>
                                            <div className="mt-2 text-[12px] text-white/75">{area.status}</div>
                                          </div>
                                          {Object.entries(area.fields || {}).slice(0, 6).map(([key, value]) => (
                                            <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                                              <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">{key}</div>
                                              <div className="mt-2 text-[12px] text-white/75">{value as string}</div>
                                            </div>
                                          ))}
                                          {Object.keys(area.fields || {}).length === 0 && (
                                            <div className="col-span-full rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[11px] text-white/30">
                                              该区域暂无额外业务属性配置
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3">
                  <div className="text-[12px] text-white/55">共 {filteredAreaList.length} 条</div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={areaPageSize}
                        onChange={(e) => setAreaPageSize(Number(e.target.value))}
                        className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[12px] text-white focus:outline-none"
                      >
                        {[10, 20, 50].map((size) => (
                          <option key={size} value={size} className="bg-[#111923] text-white">
                            {size}条/页
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setAreaCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={areaCurrentPage === 1}
                        className="h-8 w-8 rounded bg-white/[0.03] text-white/40 disabled:opacity-40"
                      >
                        <ChevronLeft size={14} className="mx-auto" />
                      </button>
                      {areaPageNumbers.map((page) =>
                        typeof page === 'number' ? (
                          <button
                            key={page}
                            onClick={() => setAreaCurrentPage(page)}
                            className={`h-8 min-w-8 rounded px-2 text-[12px] font-semibold transition-colors ${
                              areaCurrentPage === page ? 'bg-sky-500 text-white' : 'bg-white/[0.03] text-white/55 hover:text-white'
                            }`}
                          >
                            {page}
                          </button>
                        ) : (
                          <span key={page} className="px-1 text-white/30">...</span>
                        ),
                      )}
                      <button
                        onClick={() => setAreaCurrentPage((page) => Math.min(areaTotalPages, page + 1))}
                        disabled={areaCurrentPage === areaTotalPages}
                        className="h-8 w-8 rounded bg-white/[0.03] text-white/40 disabled:opacity-40"
                      >
                        <ChevronRight size={14} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === '船舶动态' && (
            <div className="space-y-4">
              {/* 顶部工具栏 */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                    <input 
                      type="text" 
                      placeholder="搜索船名/MMSI..." 
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <Filter size={14} /> 筛选
                  </button>
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <History size={14} /> 历史记录
                  </button>
                </div>
              </div>

              {/* 船舶动态列表 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="w-12 px-6 py-4"></th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">船舶信息</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">船舶类型</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">当前状态</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">来源</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">目的地</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">进入时间</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">离开时间</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_VESSEL_DYNAMICS.map((vessel) => (
                      <React.Fragment key={vessel.id}>
                        <tr 
                          className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer ${expandedRowId === vessel.id ? 'bg-white/[0.03]' : ''}`}
                          onClick={() => setExpandedRowId(expandedRowId === vessel.id ? null : vessel.id)}
                        >
                          <td className="px-6 py-4">
                            <ChevronRight size={14} className={`text-white/20 transition-transform ${expandedRowId === vessel.id ? 'rotate-90' : ''}`} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white/90">{vessel.name}</span>
                              <span className="text-[10px] text-white/30 font-mono">{vessel.mmsi}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-white/60">{vessel.type}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              vessel.status === '正在作业' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              vessel.status === '正在航行' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                              'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}>
                              {vessel.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-white/60">{vessel.origin || '未知'}</td>
                          <td className="px-6 py-4 text-xs text-white/60">{vessel.destination}</td>
                          <td className="px-6 py-4 text-xs text-white/40 font-mono">{vessel.startTime}</td>
                          <td className="px-6 py-4 text-xs text-white/40 font-mono">{vessel.endTime || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentEvent = vessel.events.find((ev: any) => ev.status === 'current') || vessel.events[vessel.events.length - 1];
                                setPlaybackData({ vessel, event: currentEvent });
                              }}
                              className="text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
                            >
                              定位
                            </button>
                          </td>
                        </tr>
                        <AnimatePresence>
                          {expandedRowId === vessel.id && (
                            <tr>
                              <td colSpan={9} className="bg-black/20 p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-8">
                                    <div className="flex items-center gap-3 mb-8">
                                      <div className="w-1 h-4 bg-sky-500 rounded-full" />
                                      <h4 className="text-xs font-black text-white/90 uppercase tracking-widest">船舶生命周期 (辖区内)</h4>
                                    </div>
                                    
                                    <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                                      {vessel.events.map((event, idx) => (
                                        <div key={idx} className="relative">
                                          {/* 时间轴圆点 */}
                                          <div className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-[#0a0a0a] z-10 ${
                                            event.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                            event.status === 'current' ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)] animate-pulse' :
                                            event.status === 'warning' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                            'bg-white/20'
                                          }`} />
                                          
                                          <div className="flex items-start gap-6">
                                            <div className="w-16 shrink-0 pt-0.5">
                                              <span className="text-[10px] font-mono font-bold text-white/30">{event.time}</span>
                                            </div>
                                            <div className={`flex-1 p-4 rounded-xl border transition-all ${
                                              event.status === 'warning' ? 'bg-red-500/5 border-red-500/20' :
                                              event.status === 'current' ? 'bg-sky-500/5 border-sky-500/20' :
                                              'bg-white/5 border-white/10'
                                            }`}>
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                  {event.type === 'comm' && <MessageSquare size={12} className="text-sky-400" />}
                                                  {event.type === 'risk' && <AlertTriangle size={12} className="text-red-400" />}
                                                  {event.type === 'action' && <Ship size={12} className="text-emerald-400" />}
                                                  <span className={`text-[11px] font-black uppercase tracking-wider ${
                                                    event.status === 'warning' ? 'text-red-400' :
                                                    event.status === 'current' ? 'text-sky-400' :
                                                    'text-white/80'
                                                  }`}>{event.label}</span>
                                                </div>
                                                {event.status === 'completed' && (
                                                  <div className="flex items-center gap-3">
                                                    <button 
                                                      onClick={() => setPlaybackData({ vessel, event })}
                                                      className="text-[9px] font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                                                    >
                                                      <Play size={10} /> 回放定位
                                                    </button>
                                                    <div className="text-[9px] font-bold text-emerald-500/50 uppercase tracking-widest">已完成</div>
                                                  </div>
                                                )}
                                                {event.status === 'current' && (
                                                  <div className="flex items-center gap-3">
                                                    <button 
                                                      onClick={() => setPlaybackData({ vessel, event })}
                                                      className="text-[9px] font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                                                    >
                                                      <MapPin size={10} /> 实时定位
                                                    </button>
                                                    <div className="text-[9px] font-bold text-sky-500 uppercase tracking-widest animate-pulse">进行中</div>
                                                  </div>
                                                )}
                                                {event.status === 'warning' && <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest">风险/违规</div>}
                                              </div>
                                              <p className="text-xs text-white/50 leading-relaxed">{event.desc}</p>
                                              
                                              {/* 对话细节 */}
                                              {event.dialogue && event.dialogue.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-1 h-3 bg-sky-500/50 rounded-full" />
                                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">语音/指令记录</span>
                                                  </div>
                                                  {event.dialogue.map((chat: any, cIdx: number) => (
                                                    <div key={cIdx} className="flex flex-col gap-1">
                                                      <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] font-black ${chat.sender.includes('VTS') || chat.sender.includes('中心') ? 'text-sky-400' : 'text-white/60'}`}>
                                                          {chat.sender}
                                                        </span>
                                                        <span className="text-[9px] font-mono text-white/20">{chat.time}</span>
                                                      </div>
                                                      <div className={`text-xs p-2 rounded-lg ${
                                                        chat.sender.includes('VTS') || chat.sender.includes('中心') 
                                                          ? 'bg-sky-500/10 text-sky-100/80 border border-sky-500/10' 
                                                          : 'bg-white/5 text-white/70 border border-white/5'
                                                      }`}>
                                                        {chat.content}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                
                <div className="p-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">共 {MOCK_VESSEL_DYNAMICS.length} 条记录</span>
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                    <button className="w-8 h-8 rounded-lg bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20">1</button>
                    <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronRight size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === '预警管理' && (
            <div className="h-full min-h-full bg-[#050a10] flex flex-col overflow-hidden">
              {/* 顶部二级导航 */}
              <div className="h-14 border-b border-white/5 bg-[#0a101a]/50 backdrop-blur-xl px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                      <Shield size={18} />
                    </div>
                    <span className="text-sm font-black text-white tracking-widest uppercase">预警与风险管理</span>
                  </div>
                  
                  <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                    {[
                      { id: '实时预警', label: '预警策略', icon: Settings },
                      { id: '风险列表', label: '风险列表', icon: List },
                      { id: '风险统计', label: '风险看板', icon: BarChart3 }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveWarningTab(tab.id)}
                        className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${
                          activeWarningTab === tab.id 
                            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                            : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                        }`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="flex items-center gap-4">
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <AnimatePresence mode="wait">
                  {activeWarningTab === '实时预警' ? (
                    <motion.div 
                      key="warning-rules"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* 规则管理列表 */}
                      <div className="bg-[#0a101a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-4 bg-sky-500 rounded-full" />
                              <h3 className="text-xs font-black text-white/90 uppercase tracking-widest whitespace-nowrap">预警触发规则配置</h3>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-wider">规则总数</span>
                                <span className="text-[12px] font-mono font-black text-sky-400">{warningRules.length}</span>
                              </div>
                              <div className="flex items-center gap-2 px-2.5 py-1 bg-white/[0.03] border border-white/5 rounded-lg">
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-wider">已激活</span>
                                <span className="text-[12px] font-mono font-black text-emerald-400">{warningRules.filter(r => r.enabled).length}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                              <input 
                                type="text" 
                                placeholder="搜索规则名称..." 
                                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-[11px] text-white focus:outline-none focus:border-sky-500/50 w-48 transition-all"
                              />
                            </div>
                          </div>                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">规则名称</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">预警类型</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">等级</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">生效区域</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">状态</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {warningRules.map(rule => {
                                const areaNames = rule.effectiveAreaIds
                                  .map((id) => warningAreaLookup.get(id)?.name)
                                  .filter(Boolean) as string[];
                                const areaSummary = areaNames.length > 2
                                  ? `${areaNames.slice(0, 1).join('、')}等${areaNames.length}个区域`
                                  : areaNames.join('、') || '未指定';

                                return (
                                  <tr key={rule.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                                          rule.enabled ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-white/5 border-white/10 text-white/20'
                                        }`}>
                                          <Shield size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-[12px] font-bold text-white/90">{rule.name}</span>
                                          <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{rule.category}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="text-[11px] text-white/60 font-medium">{rule.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                        rule.severity === '紧急' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        rule.severity === '警报' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                        rule.severity === '警告' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                        'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                      }`}>
                                        {rule.severity}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                                        {areaNames.length > 0 ? (
                                          <>
                                            {areaNames.slice(0, 2).map((name, idx) => (
                                              <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/60 whitespace-nowrap">
                                                {name}
                                              </span>
                                            ))}
                                            {areaNames.length > 2 && (
                                              <div className="relative group/tooltip">
                                                <span 
                                                  className="px-2 py-0.5 bg-sky-500/5 border border-sky-500/10 rounded-md text-[10px] text-sky-400 font-bold whitespace-nowrap cursor-help"
                                                >
                                                  +{areaNames.length - 2}
                                                </span>
                                                {/* 悬浮气泡框 */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#0a1420] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                                                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 border-b border-white/5 pb-1">全部生效区域</div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {areaNames.map((name, idx) => (
                                                      <span key={idx} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-white/70">
                                                        {name}
                                                      </span>
                                                    ))}
                                                  </div>
                                                  {/* 小三角 */}
                                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0a1420] z-10" />
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <span className="text-[11px] text-white/20">未指定</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <button 
                                        onClick={() => toggleWarningRule(rule.id)}
                                        className={`relative w-10 h-5 rounded-full transition-all duration-300 ${rule.enabled ? 'bg-sky-500' : 'bg-white/10'}`}
                                      >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${rule.enabled ? 'left-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'left-1'}`} />
                                      </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => openWarningRuleConfig(rule.id)}
                                          className="p-2 hover:bg-sky-500/20 rounded-lg text-white/40 hover:text-sky-400 transition-all"
                                          aria-label={`配置${rule.name}`}
                                        >
                                          <Settings size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  ) : activeWarningTab === '风险列表' ? (
                    <motion.div 
                      key="risk-list"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* 紧凑型单行筛选工具栏 */}
                      <div className="flex items-center justify-between bg-[#0a101a] border border-white/5 p-2.5 rounded-2xl shadow-xl">
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pr-4">
                          {/* 发生时间 */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.05] transition-all">
                            <Clock size={12} className="text-sky-400" />
                            <select 
                              value={statsTimeRange}
                              onChange={(e) => setStatsTimeRange(e.target.value)}
                              className="bg-transparent text-[11px] font-bold text-white/80 focus:outline-none cursor-pointer"
                            >
                              {['今天', '昨天', '自定义'].map(s => <option key={s} value={s} className="bg-[#0a1420]">{s}</option>)}
                            </select>
                            {statsTimeRange === '自定义' && (
                              <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-white/10 animate-in fade-in zoom-in-95">
                                <input 
                                  type="datetime-local" 
                                  value={customStartTime.replace(' ', 'T')}
                                  onChange={(e) => setCustomStartTime(e.target.value.replace('T', ' '))}
                                  className="bg-transparent border-none text-[10px] font-mono text-sky-400 focus:outline-none w-32"
                                />
                                <span className="text-white/20 text-[10px]">至</span>
                                <input 
                                  type="datetime-local" 
                                  value={customEndTime.replace(' ', 'T')}
                                  onChange={(e) => setCustomEndTime(e.target.value.replace('T', ' '))}
                                  className="bg-transparent border-none text-[10px] font-mono text-sky-400 focus:outline-none w-32"
                                />
                              </div>
                            )}
                          </div>

                          {/* 状态范围 */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.05] transition-all">
                            <Activity size={12} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap">状态</span>
                            <select 
                              value={riskStatusFilter}
                              onChange={(e) => setRiskStatusFilter(e.target.value)}
                              className="bg-transparent text-[11px] font-bold text-white/80 focus:outline-none cursor-pointer"
                            >
                              {['全部', '报警中', '已关闭'].map(s => <option key={s} value={s} className="bg-[#0a1420]">{s}</option>)}
                            </select>
                          </div>

                          {/* 是否误报 */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.05] transition-all">
                            <Filter size={12} className="text-rose-400" />
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap">误报</span>
                            <select 
                              value={riskFalsePositiveFilter}
                              onChange={(e) => setRiskFalsePositiveFilter(e.target.value)}
                              className="bg-transparent text-[11px] font-bold text-white/80 focus:outline-none cursor-pointer"
                            >
                              {['全部', '无效', '有效'].map(s => <option key={s} value={s} className="bg-[#0a1420]">{s}</option>)}
                            </select>
                          </div>

                          {/* 风险等级 */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.05] transition-all">
                            <ShieldAlert size={12} className="text-amber-400" />
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap">等级</span>
                            <select 
                              value={activeRiskLevel || '全部'}
                              onChange={(e) => setActiveRiskLevel(e.target.value === '全部' ? null : e.target.value)}
                              className="bg-transparent text-[11px] font-bold text-white/80 focus:outline-none cursor-pointer"
                            >
                              {['全部', '紧急', '警报', '警告', '注意'].map(l => <option key={l} value={l} className="bg-[#0a1420]">{l}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sky-400 transition-colors" />
                            <input 
                              type="text" 
                              placeholder="搜索船名/MMSI..." 
                              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[11px] text-white focus:outline-none focus:border-sky-500/50 w-40 hover:bg-white/[0.08] transition-all"
                            />
                          </div>
                          <button className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-2">
                            <FileText size={14} /> 导出报表
                          </button>
                        </div>
                      </div>

                      {/* 风险详情列表 */}
                      <div className="bg-[#0a101a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">触发时间</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">目标船舶</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">船舶类型</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">是否误报</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">风险等级</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">发生区域</th>                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">状态</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {MOCK_RISK_STATS.map(ship => (
                                <tr key={ship.id} className="group hover:bg-white/[0.02] transition-colors">
                                  <td className="px-6 py-4">
                                    <span className="text-[11px] font-mono text-white/40">{ship.time}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400/60">
                                        <Ship size={14} />
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="text-[12px] font-bold text-white/90">
                                          {ship.name} ({ (ship as any).nameEn || (ship as any).englishName || 'VESSEL NAME' })
                                        </div>
                                        <div className="text-[9px] text-white/20 font-mono">
                                          {ship.mmsi} / { (ship as any).imo || 'IMO9123456' } / { ship.callsign || 'CALLSIGN' }
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/60 whitespace-nowrap">
                                      { (ship as any).type || '油轮' }
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                      Number(ship.id) % 3 === 0
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}>
                                      {Number(ship.id) % 3 === 0 ? '是' : '否'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                                        ship.riskScore > 85 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        ship.riskScore > 65 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                        ship.riskScore > 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                        'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                      }`}>
                                        {ship.riskScore > 85 ? '紧急' : ship.riskScore > 65 ? '警报' : ship.riskScore > 40 ? '警告' : '注意'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-[11px] text-white/40">{ship.snapshot.location}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${ship.id.includes('1') ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                      <span className="text-[11px] text-white/60 font-medium">{ship.id.includes('1') ? '报警中' : '已关闭'}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={() => setDynamicPlaybackSession(getRiskPlaybackSession(ship))}
                                        className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-sky-500/20 transition-all"
                                      >
                                        回放
                                      </button>
                                      <button className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-rose-500/20 transition-all">
                                        无效
                                      </button>
                                      <button className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-all">
                                        有效
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="p-4 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">共 42 条风险预警记录</span>
                          <div className="flex gap-2">
                            <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                            <button className="w-8 h-8 rounded-lg bg-sky-500 text-white text-[10px] font-black">1</button>
                            <button className="w-8 h-8 rounded-lg bg-white/5 text-white/40 text-[10px] font-black hover:bg-white/10 transition-all">2</button>
                            <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronRight size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="risk-stats"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      {/* 风险看板顶部 - 增加分析维度切换 */}
                      <div className="flex items-center justify-between mb-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-6">
                          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                            {['昨日', '月度', '年度'].map(tab => (
                              <button
                                key={tab}
                                onClick={() => setActiveRiskAnalysisTab(tab)}
                                className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                                  activeRiskAnalysisTab === tab 
                                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                                    : 'text-white/30 hover:text-white/60'
                                }`}
                              >
                                {tab}分析
                              </button>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                            <Calendar size={14} className="text-sky-400" />
                            {activeRiskAnalysisTab !== '昨日' && (
                              <>
                                <select className="bg-transparent text-[11px] font-black text-white focus:outline-none cursor-pointer">
                                  <option className="bg-[#0a1420]">2026年</option>
                                  <option className="bg-[#0a1420]">2025年</option>
                                </select>
                                <div className="w-px h-3 bg-white/10 mx-1" />
                              </>
                            )}
                            {activeRiskAnalysisTab === '月度' && (
                              <select className="bg-transparent text-[11px] font-black text-white focus:outline-none cursor-pointer" defaultValue="04月">
                                {['01月', '02月', '03月', '04月', '05月', '06月', '07月', '08月', '09月', '10月', '11月', '12月'].map(m => (
                                  <option key={m} className="bg-[#0a1420]">{m}</option>
                                ))}
                              </select>
                            )}
                            {activeRiskAnalysisTab === '昨日' && (
                              <span className="text-[11px] font-black text-white">2026-04-19</span>
                            )}
                            {activeRiskAnalysisTab === '年度' && (
                              <span className="text-[11px] font-black text-white">全年度统计</span>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                          统计周期: {
                            activeRiskAnalysisTab === '昨日' ? '2026-04-19 至 2026-04-19' :
                            activeRiskAnalysisTab === '年度' ? '2026-01-01 至 2026-12-31' :
                            '2026-04-01 至 2026-04-30'
                          }
                        </div>
                      </div>

                      {/* 标题 */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-5 bg-sky-500 rounded-full shadow-[0_0_10px_#0ea5e9]" />
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">{activeRiskAnalysisTab}风险态势分析报告</h3>
                      </div>

                      <div className="grid grid-cols-12 gap-6">
                        {/* 左侧主要统计 */}
                        <div className="col-span-8 space-y-6">
                          {/* 风险次数大卡片 - 重构为左右结构 */}
                          <div className="bg-[#0a101a] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group h-[320px] flex gap-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            
                            {/* 左侧主要统计 */}
                            <div className="w-48 flex flex-col justify-center relative z-10 shrink-0">
                              <div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">{activeRiskAnalysisTab}数据概览</p>
                                <div className="space-y-1">
                                  <h2 className="text-6xl font-black text-white tracking-tighter">1,428</h2>
                                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">总计预警触发次数</p>
                                </div>
                              </div>
                            </div>

                            {/* 中间/右侧趋势图 */}
                            <div className="flex-1 flex flex-col relative z-10">
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-1 h-4 bg-sky-500 rounded-full" />
                                  <span className="text-xs font-black text-white/90 uppercase tracking-widest">预警趋势</span>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-sky-500 rounded-full" />
                                    <span className="text-[10px] font-bold text-white/40">预警次数</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-1 bg-emerald-500 rounded-full" />
                                    <span className="text-[10px] font-bold text-white/40">干预次数</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={[
                                    { time: '04-10', warning: 124, intervention: 118 },
                                    { time: '04-12', warning: 156, intervention: 142 },
                                    { time: '04-14', warning: 132, intervention: 128 },
                                    { time: '04-16', warning: 188, intervention: 176 },
                                    { time: '04-18', warning: 145, intervention: 139 },
                                    { time: '04-20', warning: 167, intervention: 162 },
                                  ]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis 
                                      dataKey="time" 
                                      axisLine={{ stroke: '#ffffff10' }} 
                                      tickLine={{ stroke: '#ffffff10' }} 
                                      tick={{fill: '#ffffff20', fontSize: 10, fontMono: true}} 
                                    />
                                    <YAxis 
                                      axisLine={{ stroke: '#ffffff10' }} 
                                      tickLine={{ stroke: '#ffffff10' }} 
                                      tick={{fill: '#ffffff20', fontSize: 10, fontMono: true}} 
                                    />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#0a101a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                                      itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="warning" 
                                      name="预警次数"
                                      stroke="#0ea5e9" 
                                      strokeWidth={4} 
                                      dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4, stroke: '#0a101a' }}
                                      activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="intervention" 
                                      name="干预次数"
                                      stroke="#10b981" 
                                      strokeWidth={4} 
                                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#0a101a' }}
                                      activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            {/* 风险船舶类型分布 */}
                            <div className="bg-[#0a101a] border border-white/5 rounded-3xl p-6 h-[320px] flex flex-col">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-4 bg-sky-500 rounded-full" />
                                <h4 className="text-xs font-black text-white/90 uppercase tracking-widest">风险船舶类型分布</h4>
                              </div>
                              <div className="flex-1 flex items-center">
                                <div className="w-[45%] h-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={[
                                          { name: '集装箱船', value: 45, count: 64, color: '#38bdf8' },
                                          { name: '散货船', value: 32, count: 45, color: '#818cf8' },
                                          { name: '油轮', value: 24, count: 34, color: '#fb923c' },
                                          { name: '工程船', value: 18, count: 26, color: '#f43f5e' },
                                          { name: '其他', value: 23, count: 33, color: '#94a3b8' },
                                        ]}
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                      >
                                        {[
                                          { color: '#38bdf8' },
                                          { color: '#818cf8' },
                                          { color: '#fb923c' },
                                          { color: '#f43f5e' },
                                          { color: '#94a3b8' },
                                        ].map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                      </Pie>
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: '#0a101a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="w-[55%] space-y-3 pl-6">
                                  {[
                                    { name: '集装箱船', value: 32, count: 45, color: '#38bdf8' },
                                    { name: '散货船', value: 25, count: 36, color: '#818cf8' },
                                    { name: '油轮', value: 18, count: 26, color: '#fb923c' },
                                    { name: '工程船', value: 15, count: 21, color: '#f43f5e' },
                                    { name: '其他', value: 10, count: 14, color: '#94a3b8' },
                                  ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between group cursor-default">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="text-[11px] font-bold text-white/40 group-hover:text-white/80 transition-colors truncate">{item.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[11px] font-mono font-bold text-white/60">{item.count}次</span>
                                        <span className="text-[10px] font-mono font-bold text-white/20">{item.value}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* 预警等级分布 */}
                            <div className="bg-[#0a101a] border border-white/5 rounded-3xl p-6 h-[320px] flex flex-col">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                <h4 className="text-xs font-black text-white/90 uppercase tracking-widest">预警等级占比</h4>
                              </div>
                              <div className="flex-1 flex items-center">
                                <div className="w-[45%] h-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={[
                                          { name: '紧急', value: 15, count: 21, color: '#f43f5e' },
                                          { name: '警报', value: 25, count: 36, color: '#fb923c' },
                                          { name: '警告', value: 35, count: 50, color: '#facc15' },
                                          { name: '注意', value: 25, count: 35, color: '#38bdf8' },
                                        ]}
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                      >
                                        {[
                                          { color: '#f43f5e' },
                                          { color: '#fb923c' },
                                          { color: '#facc15' },
                                          { color: '#38bdf8' },
                                        ].map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                      </Pie>
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: '#0a101a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="w-[55%] space-y-4 pl-6">
                                  {[
                                    { name: '紧急', value: 15, count: 21, color: '#f43f5e' },
                                    { name: '警报', value: 25, count: 36, color: '#fb923c' },
                                    { name: '警告', value: 35, count: 50, color: '#facc15' },
                                    { name: '注意', value: 25, count: 35, color: '#38bdf8' },
                                  ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between group cursor-default">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="text-[11px] font-bold text-white/40 group-hover:text-white/80 transition-colors truncate">{item.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[11px] font-mono font-bold text-white/60">{item.count}次</span>
                                        <span className="text-[10px] font-mono font-bold text-white/20">{item.value}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 右侧分布与列表 */}
                        <div className="col-span-4 space-y-6">
                          {/* 风险类型分布 */}
                          <div className="bg-[#0a101a] border border-white/5 rounded-3xl p-6 h-[320px] flex flex-col">
                            <h4 className="text-xs font-black text-white/90 uppercase tracking-widest mb-6">风险维度分布</h4>
                            <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                              {[
                                { label: '超速航行', count: 42, trend: 'up' },
                                { label: '偏离航道', count: 28, trend: 'down' },
                                { label: '非法锚泊', count: 18, trend: 'stable' },
                                { label: '碰撞风险', count: 9, trend: 'up' },
                                { label: '走锚预警', count: 3, trend: 'down' },
                              ].map((item, idx) => (
                                <div key={idx} className="space-y-2 group">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-white/60 group-hover:text-white/90 transition-colors">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-mono font-bold text-sky-400">{item.count} 次</span>
                                      {item.trend === 'up' ? <ChevronDown size={10} className="text-red-400 rotate-180" /> : 
                                       item.trend === 'down' ? <ChevronDown size={10} className="text-emerald-400" /> : 
                                       <div className="w-2 h-0.5 bg-white/20" />}
                                    </div>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(item.count / 42) * 100}%` }}
                                      className="h-full bg-sky-500/50 shadow-[0_0_8px_rgba(14,165,233,0.3)]"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 高风险区域排行 */}
                          <div className="bg-[#0a101a] border border-white/5 rounded-3xl p-6 h-[320px] flex flex-col">
                            <h4 className="text-xs font-black text-white/90 uppercase tracking-widest mb-6">高频风险区域</h4>
                            <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
                              {[
                                { name: '吴淞口警戒区', val: 124, trend: 'up' },
                                { name: '圆圆沙 12号浮', val: 98, trend: 'down' },
                                { name: '南槽 A2 泊位', val: 56, trend: 'stable' },
                                { name: '长江口深水航道', val: 42, trend: 'up' },
                              ].map((area, idx) => (
                                <div key={idx} className="space-y-2 group">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest w-4">{idx + 1}</span>
                                      <span className="text-[11px] font-bold text-white/60 group-hover:text-white/90 transition-colors">{area.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-mono font-bold text-sky-400">{area.val} 次</span>
                                      {area.trend === 'up' ? <ChevronDown size={10} className="text-red-400 rotate-180" /> : 
                                       area.trend === 'down' ? <ChevronDown size={10} className="text-emerald-400" /> : 
                                       <div className="w-2 h-0.5 bg-white/20" />}
                                    </div>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(area.val / 124) * 100}%` }}
                                      className="h-full bg-sky-500/50 shadow-[0_0_8px_rgba(14,165,233,0.3)]"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 底部关注列表 */}
                      <div className="bg-[#0a101a] border border-white/5 rounded-3xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-4 bg-red-500 rounded-full" />
                            <h3 className="text-xs font-black text-white/90 uppercase tracking-widest">高风险关注名单</h3>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-white/5">
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">船舶名称</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">船籍</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">船舶类型</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">高频预警类型</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">风险次数</th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">快速操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {MOCK_RISK_STATS.map(ship => (
                                <tr key={ship.id} className="group hover:bg-white/[0.02] transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                                        <Ship size={14} />
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="text-[12px] font-bold text-white/90">
                                          {ship.name} ({ (ship as any).nameEn || (ship as any).englishName || 'VESSEL NAME' })
                                        </div>
                                        <div className="text-[9px] text-white/20 font-mono">
                                          {ship.mmsi} / { (ship as any).imo || 'IMO9123456' } / { ship.callsign || 'CALLSIGN' }
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/60 whitespace-nowrap">
                                        { (ship as any).flag || '中国 (CHINA)' }
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/60 whitespace-nowrap">
                                      { (ship as any).type || '油轮' }
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                      {['超速', '偏航', '违停'].slice(0, 2).map((name, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/60 whitespace-nowrap">
                                          {name}
                                        </span>
                                      ))}
                                      {3 > 2 && (
                                        <div className="relative group/tooltip">
                                          <span className="px-2 py-0.5 bg-sky-500/5 border border-sky-500/10 rounded-md text-[10px] text-sky-400 font-bold whitespace-nowrap cursor-help">
                                            +1
                                          </span>
                                          {/* 悬浮气泡框 */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-[#0a1420] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none">
                                            <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 border-b border-white/5 pb-1">全部风险类型</div>
                                            <div className="flex flex-wrap gap-1">
                                              {['超速', '偏航', '违停'].map((name, idx) => (
                                                <span key={idx} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-white/70">
                                                  {name}
                                                </span>
                                              ))}
                                            </div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0a1420] z-10" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-[11px] font-mono font-bold text-sky-400">{(Number(ship.id) * 2 + 1)} 次</span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10 transition-all">核实</button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="p-4 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
                          <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">共 24 条高风险关注记录</span>
                          <div className="flex gap-2">
                            <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                            <button className="w-8 h-8 rounded-lg bg-sky-500 text-white text-[10px] font-black">1</button>
                            <button className="w-8 h-8 rounded-lg bg-white/5 text-white/40 text-[10px] font-black hover:bg-white/10 transition-all">2</button>
                            <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronRight size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {isWarningConfigOpen && selectedWarningRule && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="h-[min(860px,calc(100vh-64px))] w-[min(1100px,calc(100vw-96px))] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1118] shadow-2xl flex flex-col"
                    >
                      {/* Header */}
                      <div className="border-b border-white/10 px-8 py-6 shrink-0 bg-white/[0.02]">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                              <Shield size={24} className="text-sky-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-white tracking-tight">规则策略配置</span>
                                </div>                              <p className="mt-1 text-[13px] text-white/40">
                                自定义风险识别逻辑、预警响应等级以及地理生效范围
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => resetWarningRuleConfig(selectedWarningRule.id)}
                              className="px-4 py-2 rounded-xl border border-white/10 text-[12px] font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all"
                            >
                              恢复默认
                            </button>
                            <button
                              onClick={() => setIsWarningConfigOpen(false)}
                              className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/5 hover:text-white transition-all"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 overflow-hidden flex">
                        {/* Column 1: Basic Settings */}
                        <div className="w-[300px] border-r border-white/10 overflow-y-auto custom-scrollbar px-5 py-6 space-y-6 shrink-0 bg-white/[0.01]">
                          <section className="space-y-5">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">基础属性</span>
                            </div>
                            
                            <div className="space-y-3">
                              <label className="block space-y-1.5">
                                <span className="text-[10px] font-bold text-white/30 ml-1">设置名称</span>
                                <input
                                  type="text"
                                  value={selectedWarningRule.name}
                                  onChange={(e) => updateWarningRule(selectedWarningRule.id, (rule) => ({ ...rule, name: e.target.value }))}
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-white focus:outline-none focus:border-sky-500/50 transition-all"
                                  placeholder="规则名称"
                                />
                              </label>

                              <label className="block space-y-1.5">
                                <span className="text-[10px] font-bold text-white/30 ml-1">预警类型</span>
                                <div className="relative">
                                  <select
                                    value={selectedWarningRule.category}
                                    onChange={(e) => updateWarningRule(selectedWarningRule.id, (rule) => ({ ...rule, category: e.target.value as any }))}
                                    className="w-full rounded-lg border border-white/10 bg-[#121b26] px-3 py-2 text-[12px] text-white focus:outline-none focus:border-sky-500/50 appearance-none cursor-pointer"
                                  >
                                    {['单船风险', '多船风险', '船与环境风险', '碰撞风险'].map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                </div>
                              </label>

                              <label className="block space-y-1.5">
                                <span className="text-[10px] font-bold text-white/30 ml-1">预警等级</span>
                                <div className="relative">
                                  <select
                                    value={selectedWarningRule.severity}
                                    onChange={(e) => updateWarningRule(selectedWarningRule.id, (rule) => ({ ...rule, severity: e.target.value as any }))}
                                    className="w-full rounded-lg border border-white/10 bg-[#121b26] px-3 py-2 text-[12px] text-white focus:outline-none focus:border-sky-500/50 appearance-none cursor-pointer"
                                  >
                                    {['注意', '警告', '警报', '紧急'].map(level => (
                                      <option key={level} value={level}>{level}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                                </div>
                              </label>

                              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                                <div className="text-[12px] font-bold text-white">激活状态</div>
                                <button
                                  onClick={() => toggleWarningRule(selectedWarningRule.id)}
                                  className={`relative h-5 w-9 rounded-full transition-all ${selectedWarningRule.enabled ? 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]' : 'bg-white/10'}`}
                                >
                                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${selectedWarningRule.enabled ? 'left-[20px]' : 'left-0.5'}`} />
                                </button>
                              </div>

                              <div className="pt-4 border-t border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">规则描述逻辑</span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      updateWarningRule(selectedWarningRule.id, (rule) => ({
                                        ...rule,
                                        descriptions: [...(rule.descriptions || [rule.description]), '']
                                      }));
                                    }}
                                    className="p-1 rounded-md hover:bg-white/5 text-sky-400 transition-all"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                
                                <div className="space-y-2">
                                  {(selectedWarningRule.descriptions || [selectedWarningRule.description]).map((desc, idx) => (
                                    <div key={idx} className="group relative">
                                      <textarea
                                        value={desc}
                                        onChange={(e) => {
                                          const nextDescs = [...(selectedWarningRule.descriptions || [selectedWarningRule.description])];
                                          nextDescs[idx] = e.target.value;
                                          updateWarningRule(selectedWarningRule.id, (rule) => ({ ...rule, descriptions: nextDescs }));
                                        }}
                                        rows={2}
                                        className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] leading-relaxed text-white placeholder:text-white/10 focus:outline-none focus:border-sky-500/50 transition-all pr-8"
                                        placeholder={`描述逻辑项 ${idx + 1}...`}
                                      />
                                      {(selectedWarningRule.descriptions?.length || 1) > 1 && (
                                        <button 
                                          onClick={() => {
                                            const nextDescs = (selectedWarningRule.descriptions || []).filter((_, i) => i !== idx);
                                            updateWarningRule(selectedWarningRule.id, (rule) => ({ ...rule, descriptions: nextDescs }));
                                          }}
                                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-red-400/60 transition-all"
                                        >
                                          <X size={12} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </section>
                        </div>

                        {/* Column 2: Area List & Search */}
                        <div className="w-[300px] border-r border-white/10 flex flex-col shrink-0 bg-black/10">
                          <div className="p-5 space-y-4 border-b border-white/10 bg-white/[0.01]">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">选择生效区域</span>
                              <div className="text-[10px] text-sky-400 font-black font-mono">{selectedWarningRule.effectiveAreaIds.length} 选</div>
                            </div>
                            <div className="relative group">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-sky-400 transition-colors" />
                              <input
                                type="text"
                                placeholder="搜索区域名称"
                                value={warningAreaSearchQuery}
                                onChange={(e) => setWarningAreaSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 py-2 text-[12px] text-white focus:outline-none focus:border-sky-500/50 transition-all"
                              />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {['全部', '航道', '锚地', '泊位', '警戒区'].map(type => (
                                <button
                                  key={type}
                                  onClick={() => setSelectedRiskConfigAreaType(type as any)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${
                                    selectedRiskConfigAreaType === type 
                                    ? 'bg-white text-black' 
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                            {allWarningAreas
                              .filter((area) => {
                                const keyword = warningAreaSearchQuery.trim().toLowerCase();
                                const matchesSearch = !keyword || area.name.toLowerCase().includes(keyword);
                                const matchesType = selectedRiskConfigAreaType === '全部' || 
                                  (selectedRiskConfigAreaType === '航道' && WARNING_LINE_TYPES.has(area.type)) ||
                                  area.type === selectedRiskConfigAreaType ||
                                  (selectedRiskConfigAreaType === '泊位' && area.type === '码头');
                                return matchesSearch && matchesType;
                              }).map(area => {
                                const isSelected = selectedWarningRule.effectiveAreaIds.includes(area.id);
                                return (
                                  <button
                                    key={area.id}
                                    onClick={() => toggleWarningRuleArea(selectedWarningRule.id, area.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                                      isSelected 
                                      ? 'border-sky-500/30 bg-sky-500/10' 
                                      : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className={`text-[11px] font-bold truncate ${isSelected ? 'text-sky-300' : 'text-white/60'}`}>
                                        {area.name}
                                      </div>
                                      <div className="text-[9px] text-white/20 mt-0.5">{area.type}</div>
                                    </div>
                                    {isSelected && <Check size={10} className="text-sky-400 ml-1.5" strokeWidth={4} />}
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        {/* Column 3: Interactive Map */}
                        <div className="flex-1 relative bg-black/40">
                          <MapContainer
                            center={[31.43, 121.5]}
                            zoom={11}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            attributionControl={false}
                            preferCanvas
                          >
                            <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />
                            
                            {/* 渲染所有相关区域图形 */}
                            {warningMapFeatures.map((feature) => {
                              const checked = selectedWarningRule.effectiveAreaIds.includes(feature.id);
                              const pathOptions = feature.polyline
                                ? {
                                    color: checked ? '#38bdf8' : feature.color,
                                    weight: checked ? 5 : 2,
                                    opacity: checked ? 0.98 : 0.4,
                                  }
                                : {
                                    color: checked ? '#38bdf8' : feature.color,
                                    weight: 1.5,
                                    fillColor: checked ? '#0ea5e9' : feature.color,
                                    fillOpacity: checked ? 0.4 : 0.1,
                                    opacity: checked ? 0.95 : 0.3,
                                  };

                              if (feature.polyline) {
                                return (
                                  <Polyline
                                    key={feature.id}
                                    positions={feature.polyline}
                                    pathOptions={pathOptions}
                                    eventHandlers={{
                                      click: () => toggleWarningRuleArea(selectedWarningRule.id, feature.id),
                                    }}
                                  />
                                );
                              }

                              return (
                                <Polygon
                                  key={feature.id}
                                  positions={feature.polygon || []}
                                  pathOptions={pathOptions}
                                  eventHandlers={{
                                    click: () => toggleWarningRuleArea(selectedWarningRule.id, feature.id),
                                  }}
                                />
                              );
                            })}
                          </MapContainer>
                          
                          {/* Map Overlay info */}
                          <div className="absolute top-4 right-4 z-[1000] pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white/60">
                              点击地图区域图形可快速勾选
                            </div>
                          </div>

                          <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
                             <button 
                               onClick={() => clearWarningRuleAreas(selectedWarningRule.id)}
                               className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-[11px] font-bold text-white/60 hover:text-white transition-all"
                             >
                               清空全部区域
                             </button>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="border-t border-white/10 px-8 py-5 shrink-0 flex items-center justify-end gap-4 bg-white/[0.02]">
                        <button
                          onClick={() => setIsWarningConfigOpen(false)}
                          className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-white/40 hover:text-white transition-all"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => setIsWarningConfigOpen(false)}
                          className="px-10 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-[13px] font-black rounded-xl shadow-2xl shadow-sky-500/20 transition-all"
                        >
                          应用并保存配置
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeMenu === '场景演示' && (
            <div className="space-y-6">
              {/* 场景演示顶部页签 */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex bg-white/5 rounded-lg p-0.5">
                    {['VHF船舶会话', 'VHF船舶意图识别', 'VHF船舶风险预警'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveScenarioTab(tab)}
                        className={`px-6 py-1.5 text-xs font-bold rounded-md transition-all ${activeScenarioTab === tab ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 场景内容区域: 地图展示 */}
              <div className="h-[500px] rounded-3xl overflow-hidden border border-white/10 relative bg-[#0a0a0a]">
                <MapContainer 
                  center={[31.41, 121.52]} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer url={VTS_CHART_TILE_URL} attribution={VTS_CHART_TILE_ATTRIBUTION} />
                  
                  {/* VHF 会话模式：展示两个主体及其各自的气泡 */}
                  {activeScenarioTab === 'VHF船舶会话' ? (
                    <>
                      {/* 船舶：宝腾8 */}
                      <Marker 
                        position={[31.40, 121.50]}
                        icon={L.divIcon({
                          className: 'scenario-ship-icon',
                          html: `
                            <div class="relative">
                              <!-- 现代科技风格气泡 -->
                              <div class="absolute bottom-[50px] left-1/2 -translate-x-1/2 min-w-[200px] z-[2000]">
                                <div class="bg-[#0a0a0a]/95 backdrop-blur-xl border border-sky-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(14,165,233,0.2)] ring-1 ring-white/10">
                                  <div class="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                    <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span class="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">宝腾8 (VHF)</span>
                                  </div>
                                  <p class="text-[12px] font-bold text-white leading-tight">离泊后，由南向北划江上行！</p>
                                  <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-sky-500/50"></div>
                                </div>
                              </div>
                              <!-- 船舶符号 -->
                              <div class="w-[20px] h-[40px] bg-[#10b981] rounded-full border-2 border-black shadow-lg"></div>
                            </div>
                          `,
                          iconSize: [0, 0],
                          iconAnchor: [10, 20]
                        })}
                      />

                      {/* 交管中心 */}
                      <Marker 
                        position={[31.43, 121.55]}
                        icon={L.divIcon({
                          className: 'scenario-vts-icon',
                          html: `
                            <div class="relative">
                              <!-- 现代科技风格气泡 -->
                              <div class="absolute bottom-[50px] left-1/2 -translate-x-1/2 min-w-[200px] z-[2000]">
                                <div class="bg-[#0a0a0a]/95 backdrop-blur-xl border border-sky-600/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(14,165,233,0.2)] ring-1 ring-white/10">
                                  <div class="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                    <div class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                                    <span class="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">吴淞交管 (VHF)</span>
                                  </div>
                                  <p class="text-[12px] font-bold text-white leading-tight">收到，宝腾8。请注意避让进港大型船舶，保持VHF16频道守听。</p>
                                  <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-sky-600/50"></div>
                                </div>
                              </div>
                              <!-- 交管中心符号 -->
                              <div class="w-[30px] h-[30px] bg-sky-600 rounded-lg border-2 border-black flex items-center justify-center shadow-lg">
                                <div class="w-4 h-4 text-white">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                </div>
                              </div>
                            </div>
                          `,
                          iconSize: [0, 0],
                          iconAnchor: [15, 15]
                        })}
                      />
                    </>
                  ) : (
                    /* 其他模式：保持单船展示 */
                    <Marker 
                      position={[31.40, 121.50]}
                      icon={L.divIcon({
                        className: 'scenario-ship-icon',
                        html: `
                          <div class="relative">
                            <div class="absolute bottom-[45px] left-1/2 -translate-x-1/2 min-w-[200px] z-[2000]">
                              <div class="bg-[#0a0a0a]/95 backdrop-blur-xl border border-sky-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(14,165,233,0.2)] ring-1 ring-white/10">
                                <div class="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                  <div class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                                  <span class="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">识别结果</span>
                                </div>
                                
                                <div class="space-y-3">
                                  ${activeScenarioTab === 'VHF船舶意图识别' ? `
                                    <div class="flex flex-wrap gap-2">
                                      <div class="px-2 py-1 bg-sky-500/20 border border-sky-500/30 rounded text-[10px] font-bold text-sky-400">和泰188 (79%)</div>
                                      <div class="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-white/60">东海救118 (67%)</div>
                                    </div>
                                  ` : `
                                    <div class="flex items-center gap-2 text-red-400">
                                      <div class="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                                      <span class="text-[10px] font-black uppercase tracking-widest">高风险警报</span>
                                    </div>
                                    <div class="text-sm font-bold text-white leading-tight">异常偏离预定航线</div>
                                  `}
                                </div>
                                <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-sky-500/50"></div>
                              </div>
                            </div>
                            <div class="w-[24px] h-[48px] bg-[#10b981] rounded-full relative shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-white/20">
                              <div class="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-[#10b981] -translate-y-[2px]"></div>
                            </div>
                          </div>
                        `,
                        iconSize: [0, 0],
                        iconAnchor: [12, 24]
                      })}
                    />
                  )}
                </MapContainer>

                {/* 地图遮罩/装饰 */}
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-3xl"></div>
                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white/60 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    实时渲染引擎已就绪
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === '业务统计' && (
            <div className="space-y-6">
              {/* 统一筛选组件 */}
              <div className="flex items-center gap-4 bg-white/5 p-2.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                {/* 2. 时间范围 */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">时间范围</span>
                  <div className="flex bg-white/5 rounded-lg p-0.5">
                    {['今天', '昨天', '最近7天', '自定义'].map(range => (
                      <button
                        key={range}
                        onClick={() => setStatsTimeRange(range)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all whitespace-nowrap ${statsTimeRange === range ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-px h-4 bg-white/10 shrink-0"></div>

                {/* 3. 值班区域，改为下拉选择 */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">值班区域</span>
                  <select 
                    value={statsArea}
                    onChange={(e) => setStatsArea(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 min-w-[120px] cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {['全部区域', ...(areaConfig['值班区域'] || []).map(a => a.name)].map(area => (
                      <option key={area} value={area} className="bg-[#1a1c20] text-white">{area}</option>
                    ))}
                  </select>
                </div>

                {/* 4. 业务特定筛选 */}
                {activeStatsTab === '船舶风险统计' && (
                  <>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">风险行为</label>
                      <select className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 min-w-[100px] cursor-pointer hover:bg-white/10 transition-colors">
                        <option value="" className="bg-[#1a1c20] text-white">全部行为</option>
                        <option value="超速航行" className="bg-[#1a1c20] text-white">超速航行</option>
                        <option value="偏离航道" className="bg-[#1a1c20] text-white">偏离航道</option>
                        <option value="非法锚泊" className="bg-[#1a1c20] text-white">非法锚泊</option>
                        <option value="进入禁航区" className="bg-[#1a1c20] text-white">进入禁航区</option>
                        <option value="异常停泊" className="bg-[#1a1c20] text-white">异常停泊</option>
                      </select>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">MMSI</label>
                      <input 
                        type="text" 
                        placeholder="MMSI..." 
                        className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 w-24" 
                      />
                    </div>
                  </>
                )}

                {activeStatsTab === '意图统计' && (
                  <>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">意图种类</label>
                      <select className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 min-w-[100px] cursor-pointer hover:bg-white/10 transition-colors">
                        <option value="" className="bg-[#1a1c20] text-white">全部种类</option>
                        <option value="前往锚地" className="bg-[#1a1c20] text-white">前往锚地</option>
                        <option value="抛锚" className="bg-[#1a1c20] text-white">抛锚</option>
                        <option value="起锚" className="bg-[#1a1c20] text-white">起锚</option>
                        <option value="前往泊位" className="bg-[#1a1c20] text-white">前往泊位</option>
                        <option value="靠泊" className="bg-[#1a1c20] text-white">靠泊</option>
                        <option value="离泊" className="bg-[#1a1c20] text-white">离泊</option>
                        <option value="上引水" className="bg-[#1a1c20] text-white">上引水</option>
                        <option value="下引水" className="bg-[#1a1c20] text-white">下引水</option>
                      </select>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">意图状态</label>
                      <select className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 min-w-[100px] cursor-pointer hover:bg-white/10 transition-colors">
                        <option value="" className="bg-[#1a1c20] text-white">全部状态</option>
                        <option value="批准" className="bg-[#1a1c20] text-white">批准</option>
                        <option value="拒绝" className="bg-[#1a1c20] text-white">拒绝</option>
                        <option value="回复等待" className="bg-[#1a1c20] text-white">回复等待</option>
                      </select>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0"></div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">MMSI</label>
                      <input 
                        type="text" 
                        placeholder="MMSI..." 
                        className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-[11px] text-white/80 focus:outline-none focus:border-sky-500/50 w-24" 
                      />
                    </div>
                  </>
                )}

                <div className="flex-1"></div>

                <button className="shrink-0 px-6 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-sky-500/20">
                  查询
                </button>
              </div>

              {activeStatsTab === '值班统计' && (
                <div className="space-y-6">
                  {/* 核心指标卡片 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MessageSquare size={20} className="text-sky-400" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+12%</span>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">1,284</div>
                      <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest">对话次数</div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Activity size={20} className="text-blue-400" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+5%</span>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">456</div>
                      <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest">指挥次数</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Check size={20} className="text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+8%</span>
                      </div>
                      <div className="text-2xl font-black text-white mb-1">892</div>
                      <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest">回答次数</div>
                    </div>
                  </div>

                  {/* 详细统计图表占位 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-sm font-bold text-white/90">值班趋势分析</h3>
                        <p className="text-[11px] text-white/30 mt-1">过去 24 小时值班员交互数据趋势</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-white/10 rounded-md text-[10px] font-bold text-white/60 hover:text-white transition-colors">导出报告</button>
                        <button 
                          onClick={() => setShowVhfDetails(true)}
                          className="px-3 py-1 bg-sky-500 rounded-md text-[10px] font-bold text-white shadow-lg shadow-sky-500/20"
                        >
                          查看详情
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { time: '00:00', count: 45 },
                            { time: '02:00', count: 32 },
                            { time: '04:00', count: 28 },
                            { time: '06:00', count: 56 },
                            { time: '08:00', count: 124 },
                            { time: '10:00', count: 189 },
                            { time: '12:00', count: 145 },
                            { time: '14:00', count: 167 },
                            { time: '16:00', count: 210 },
                            { time: '18:00', count: 178 },
                            { time: '20:00', count: 134 },
                            { time: '22:00', count: 89 },
                          ]}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0a0a0a', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                            itemStyle={{ color: '#0ea5e9' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#0ea5e9" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                            name="对话次数"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeStatsTab === '意图统计' && (
                <div className="space-y-4">
                  {/* 数据表格 */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10">
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">船舶信息</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">识别意图</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">置信度</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">发生时间</th>
                            <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">当前状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_INTENT_STATS.map((item) => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white/90">{item.name}</span>
                                  <span className="text-[10px] text-white/30 font-mono">{item.mmsi}</span>
                                  <span className="text-[10px] text-sky-400/60">{item.type}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs text-white/60">{item.intent}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                                    <div 
                                      className="h-full bg-sky-500" 
                                      style={{ width: `${item.confidence}%` }} 
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-sky-400">{item.confidence}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[10px] text-white/40 font-mono">{item.time}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${
                                  item.status === '批准' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                  item.status === '拒绝' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                  item.status === '回复等待' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                  item.status === '主动询问' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                  'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">共 {MOCK_INTENT_STATS.length} 条记录</span>
                      <div className="flex gap-2">
                        <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronLeft size={16} /></button>
                        <button className="w-8 h-8 rounded-lg bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20">1</button>
                        <button className="p-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white transition-all"><ChevronRight size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu !== '区域设置' && activeMenu !== '预警管理' && activeMenu !== '船舶动态' && activeMenu !== '场景演示' && activeMenu !== '业务统计' && (
            <div className="h-[400px] flex flex-col items-center justify-center text-white/20 gap-4">
              <Layout size={64} />
              <span className="text-sm font-medium">功能开发中...</span>
            </div>
          )}
        </main>

        {/* VHF 对话详情弹窗 */}
        <AnimatePresence>
          {showVhfDetails && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowVhfDetails(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                {/* 弹窗头部 */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center">
                      <MessageSquare className="text-sky-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white">VHF 对话详情回放</h2>
                      <p className="text-xs text-white/30 mt-1">船舶：中远海运 123 (MMSI: 413123456) | 时间：2026-03-19 10:05</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowVhfDetails(false)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* 弹窗内容 */}
                <div className="flex-1 flex overflow-hidden">
                  {/* 左侧：对话历史 */}
                  <div className="w-1/2 border-r border-white/10 flex flex-col bg-[#050505]">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">对话记录</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                          <span className="text-[10px] text-white/40">VTS 中心</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] text-white/40">船舶</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {[
                        { id: 1, time: "10:05:22", sender: "VTS Center", isVts: true, text: "中远海运 123，这里是 VTS 中心，请报告您的当前航向。", lat: 30.123, lng: 122.456 },
                        { id: 2, time: "10:05:45", sender: "COSCO SHIPPING 123", isVts: false, text: "VTS 中心，我是中远海运 123，当前航向 095，航速 12 节。", lat: 30.125, lng: 122.460 },
                        { id: 3, time: "10:06:10", sender: "VTS Center", isVts: true, text: "收到，请保持当前航向，注意避让前方 2 海里处的渔船。", lat: 30.127, lng: 122.465 },
                        { id: 4, time: "10:06:35", sender: "COSCO SHIPPING 123", isVts: false, text: "收到，正在调整航向避让，谢谢提醒。", lat: 30.129, lng: 122.470 },
                      ].map((msg) => (
                        <motion.div
                          key={msg.id}
                          whileHover={{ x: 4 }}
                          onClick={() => setSelectedVhfSnippet(msg)}
                          className={`group cursor-pointer p-4 rounded-2xl transition-all ${selectedVhfSnippet?.id === msg.id ? 'bg-sky-500/10 border border-sky-500/30' : 'bg-white/5 border border-transparent hover:border-white/10'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${msg.isVts ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {msg.sender}
                            </span>
                            <span className="text-[10px] text-white/20 font-mono">{msg.time}</span>
                          </div>
                          <p className="text-sm text-white/80 leading-relaxed mb-3">{msg.text}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Volume2 size={14} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">点击播放音频</span>
                            </div>
                            {selectedVhfSnippet?.id === msg.id && (
                              <div className="flex items-center gap-1 text-emerald-400">
                                <MapPin size={12} />
                                <span className="text-[10px] font-bold">已同步轨迹位置</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* 右侧：历史轨迹地图 */}
                  <div className="w-1/2 relative bg-[#0a0a0a]">
                    <div className="absolute top-4 left-4 z-[4001] bg-[#050505]/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <History size={14} className="text-sky-400" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">历史轨迹回放</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] text-white/40">当前位置：{selectedVhfSnippet ? `${selectedVhfSnippet.lat.toFixed(3)}, ${selectedVhfSnippet.lng.toFixed(3)}` : '请选择对话片段'}</div>
                        <div className="text-[10px] text-white/40">轨迹点数：124 点</div>
                      </div>
                    </div>

                    <div className="h-full w-full">
                      <MapContainer
                        center={[30.125, 122.460]}
                        zoom={14}
                        className="h-full w-full"
                        zoomControl={false}
                      >
                        <TileLayer
                          url={VTS_CHART_TILE_URL}
                          attribution={VTS_CHART_TILE_ATTRIBUTION}
                        />
                        {/* 历史轨迹线 */}
                        <Polyline 
                          positions={[
                            [30.120, 122.450],
                            [30.123, 122.456],
                            [30.125, 122.460],
                            [30.127, 122.465],
                            [30.129, 122.470],
                            [30.132, 122.475]
                          ]}
                          color="#0ea5e9"
                          weight={3}
                          opacity={0.6}
                          dashArray="10, 10"
                        />
                        {/* 船舶当前位置标记 */}
                        {selectedVhfSnippet && (
                          <Marker 
                            position={[selectedVhfSnippet.lat, selectedVhfSnippet.lng]}
                            icon={L.divIcon({
                              className: 'custom-div-icon',
                              html: `
                                <div class="relative">
                                  <div class="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-sky-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.8)] border-2 border-white animate-pulse"></div>
                                  <div class="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-sky-500/20 rounded-full animate-ping"></div>
                                </div>
                              `,
                              iconSize: [0, 0]
                            })}
                          />
                        )}
                      </MapContainer>
                    </div>

                    {/* 底部播放控制 */}
                    <div className="absolute bottom-6 left-6 right-6 z-[4001] bg-[#050505]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl">
                      <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform">
                          <Play size={18} fill="currentColor" />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/60">轨迹回放进度</span>
                            <span className="text-[10px] font-mono text-white/40">10:05:22 / 10:06:35</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: selectedVhfSnippet ? `${(selectedVhfSnippet.id / 4) * 100}%` : '0%' }}
                              className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {playbackData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed top-24 right-6 w-96 z-[8000] pointer-events-auto"
            >
              <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* 头部 */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-sky-500/10 to-transparent">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sky-500 rounded-xl text-white shadow-lg shadow-sky-500/20">
                        <History size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">历史回放定位</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">历史数据回溯模式</p>                      </div>
                    </div>
                    <button 
                      onClick={() => setPlaybackData(null)}
                      className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">目标船舶</span>
                      <span className="text-xs font-bold text-white">{playbackData.vessel.name}</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">定位时间</span>
                      <span className="text-xs font-mono font-bold text-sky-400">{playbackData.event.time}</span>
                    </div>
                  </div>
                </div>

                {/* 内容 */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {/* 船舶上下文事件时间轴 */}
                  {playbackData.event.timeline && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-sky-400" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">船舶上下文事件 (最近)</span>
                      </div>
                      <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                        {playbackData.event.timeline.map((item: any, idx: number) => (
                          <div key={idx} className="relative">
                            {/* 时间轴圆点 */}
                            <div className={`absolute -left-[15px] top-1.5 w-2 h-2 rounded-full border-2 border-[#111] ${
                              item.type === 'risk' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                              item.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                            }`} />
                            
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-mono text-white/30">{item.time}</span>
                              <div className={`text-xs p-2 rounded-lg border ${
                                item.type === 'risk' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                                item.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10 text-amber-200/80' :
                                'bg-white/5 border-white/5 text-white/70'
                              }`}>
                                {item.event}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 环节细节 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-sky-400" />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">环节细节</span>
                    </div>
                    <div className={`p-4 rounded-2xl border ${
                      playbackData.event.type === 'risk' ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold ${
                          playbackData.event.type === 'risk' ? 'text-red-400' : 'text-sky-400'
                        }`}>{playbackData.event.label}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{playbackData.event.desc}</p>
                    </div>
                  </div>

                  {/* 对话记录 */}
                  {playbackData.event.dialogue && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-sky-400" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">当时对话记录</span>
                      </div>
                      <div className="space-y-2">
                        {playbackData.event.dialogue.map((chat: any, idx: number) => (
                          <div key={idx} className={`flex flex-col gap-0.5 ${chat.sender.includes('VTS') ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[9px] font-bold text-white/30 uppercase">{chat.sender}</span>
                              <span className="text-[9px] font-mono text-white/20">{chat.time}</span>
                            </div>
                            <div className={`text-xs p-1.5 rounded-2xl max-w-[90%] ${
                              chat.sender.includes('VTS') 
                                ? 'bg-sky-500 text-white rounded-tr-none shadow-lg shadow-sky-500/20' 
                                : 'bg-white/10 text-white/80 rounded-tl-none border border-white/10'
                            }`}>
                              {chat.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 底部操作 */}
                <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                  <button 
                    onClick={() => setDynamicPlaybackSession(playbackData)}
                    className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    <Play size={14} /> 开始动态回放
                  </button>
                  <button 
                    onClick={() => setPlaybackData(null)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold rounded-xl border border-white/10 transition-all"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// --- 动态回放视图组件 ---

const DynamicPlaybackView = ({ 
  session, 
  onClose 
}: { 
  session: any, 
  onClose: () => void 
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(MOCK_AREAS)));
  const playbackDialogue = session.event.dialogue || [];
  
  // 生成模拟轨迹数据 (基于原始坐标点)
  const trajectory = useMemo(() => {
    const center = session.event.coords;
    const points: [number, number][] = [];
    const steps = 100;
    
    // 模拟一段带有转弯的轨迹
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const lat = center[0] - 0.02 + 0.04 * t + Math.sin(t * 5) * 0.005;
      const lng = center[1] - 0.02 + 0.04 * t + Math.cos(t * 5) * 0.005;
      points.push([lat, lng]);
    }
    return points;
  }, [session]);

  const currentIndex = Math.floor((progress / 100) * (trajectory.length - 1));
  const currentPos = trajectory[currentIndex];
  
  const currentSpeed = 12.5 + Math.sin(progress / 10) * 2;
  const currentHeading = useMemo(() => {
    if (trajectory.length < 2) return 0;
    const p1 = currentIndex < trajectory.length - 1 ? trajectory[currentIndex] : trajectory[currentIndex - 1];
    const p2 = currentIndex < trajectory.length - 1 ? trajectory[currentIndex + 1] : trajectory[currentIndex];
    const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * (180 / Math.PI);
    return (angle + 360) % 360;
  }, [trajectory, currentIndex]);

  useEffect(() => {
    let interval: any;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5 * playbackSpeed, 100));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, progress]);

  const toggleArea = (id: string) => {
    const newSelected = new Set(selectedAreas);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAreas(newSelected);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleAllInCategory = (category: string, areas: any[]) => {
    const newSelected = new Set(selectedAreas);
    const allSelected = areas.every(a => selectedAreas.has(a.id));
    
    areas.forEach(a => {
      if (allSelected) {
        newSelected.delete(a.id);
      } else {
        newSelected.add(a.id);
      }
    });
    setSelectedAreas(newSelected);
  };

  // 为选中的区域生成模拟地图元素
  const areaMapElements = useMemo(() => {
    const elements: any[] = [];
    Object.values(MOCK_AREAS).flat().forEach(area => {
      if (selectedAreas.has(area.id)) {
        // 随机生成一个中心点附近的区域
        const center = session.event.coords;
        const offsetLat = (Math.random() - 0.5) * 0.04;
        const offsetLng = (Math.random() - 0.5) * 0.04;
        const areaCenter: [number, number] = [center[0] + offsetLat, center[1] + offsetLng];
        
        elements.push({
          id: area.id,
          name: area.name,
          type: area.type,
          center: areaCenter,
          // 模拟一个多边形
          bounds: [
            [areaCenter[0] - 0.005, areaCenter[1] - 0.005],
            [areaCenter[0] + 0.005, areaCenter[1] - 0.005],
            [areaCenter[0] + 0.005, areaCenter[1] + 0.005],
            [areaCenter[0] - 0.005, areaCenter[1] + 0.005],
          ] as [number, number][]
        });
      }
    });
    return elements;
  }, [selectedAreas, session.event.coords]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col"
    >
      {/* 顶部控制栏 */}
      <div className="h-20 bg-black/80 backdrop-blur-xl border-b border-white/10 flex flex-col z-[10]">
        <div className="flex-1 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">动态轨迹回放: {session.vessel.name}</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                事件时间: {session.event.time} | 风险类型: {session.event.label}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg ${
                isPlaying 
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30' 
                  : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20'
              }`}
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              <span className="uppercase tracking-widest">{isPlaying ? '暂停' : '播放'}</span>
            </button>

            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
              {[1, 2, 4, 8].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-1 text-[10px] font-black rounded transition-all ${
                    playbackSpeed === speed ? 'bg-sky-500 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {speed}X
                </button>
              ))}
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold transition-all"
            >
              退出回放
            </button>
          </div>
        </div>

        {/* 顶部时间轴 */}
        <div className="h-8 px-6 flex items-center gap-4 border-t border-white/5 bg-white/[0.02]">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">时间轴</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full relative">
            <div 
              className="absolute top-0 left-0 h-full bg-sky-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
              style={{ width: `${progress}%` }}
            />
            {/* 时间刻度 */}
            {[0, 25, 50, 75, 100].map(p => (
              <div 
                key={p} 
                className="absolute top-[-4px] w-px h-3 bg-white/20"
                style={{ left: `${p}%` }}
              >
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/20 whitespace-nowrap">
                  {p === 0 ? 'T-15m' : p === 50 ? 'T-0' : p === 100 ? 'T+15m' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧信息面板 */}
        <div className="w-80 bg-black/40 backdrop-blur-md border-r border-white/10 flex flex-col z-[10]">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <History size={16} className="text-sky-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">风险回放信息</h3>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">风险名称</span>
                <span className="text-[11px] font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">{session.event.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">风险类型</span>
                <span className="text-[11px] font-black text-sky-400 bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20 uppercase tracking-wider">{session.vessel.category || '单船风险'}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {/* 船舶信息 */}
            <section className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Ship size={14} className="text-sky-400" />
                <span className="text-[10px] font-black text-white/55 uppercase tracking-widest">船舶信息</span>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white">{session.vessel.name}</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    {session.vessel.englishName || "MOCK VESSEL NAME"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/5 bg-black/20 px-2.5 py-2">
                    <div className="text-[10px] font-black text-white/25 uppercase tracking-widest">长宽</div>
                    <div className="mt-1 text-[10px] font-semibold text-white/75 leading-snug">
                      {session.vessel.length && session.vessel.width 
                        ? `${session.vessel.length}m x ${session.vessel.width}m` 
                        : '299m x 48m'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/20 px-2.5 py-2">
                    <div className="text-[10px] font-black text-white/25 uppercase tracking-widest">吃水</div>
                    <div className="mt-1 text-[10px] font-semibold text-white/75 leading-snug">
                      {session.vessel.draft ? (typeof session.vessel.draft === 'number' ? `${session.vessel.draft}m` : session.vessel.draft) : '14.5m'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/20 px-2.5 py-2">
                    <div className="text-[10px] font-black text-white/25 uppercase tracking-widest">类型</div>
                    <div className="mt-1 text-[10px] font-semibold text-white/75 leading-snug">
                      {session.vessel.type || '货轮'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/20 px-2.5 py-2">
                    <div className="text-[10px] font-black text-white/25 uppercase tracking-widest">货物</div>
                    <div className="mt-1 text-[10px] font-semibold text-white/75 leading-snug">
                      {session.vessel.cargo || '原油'}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 动态信息 */}
            <section className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-white/55 uppercase tracking-widest">动态信息</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/5 bg-black/20 px-2.5 py-2">
                  <div className="text-[10px] font-black text-white/25 uppercase tracking-widest">航向</div>
                  <div className="mt-1 text-[10px] font-semibold text-white/75 leading-snug">
                    {currentHeading.toFixed(1)}°
                  </div>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/20 px-2.5 py-2">
                  <div className="text-[10px] font-black text-white/25 uppercase tracking-widest">航速</div>
                  <div className="mt-1 text-[10px] font-semibold text-white/75 leading-snug">
                    {currentSpeed.toFixed(1)} kn
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <CloudSun size={14} className="text-amber-400" />
                <span className="text-[10px] font-black text-white/55 uppercase tracking-widest">天气信息</span>
              </div>
              <div className="space-y-2">
                {(session.event.weather || []).map((item: any) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-2.5 py-2">
                    <span className="text-[10px] font-bold text-white/35">{item.label}</span>
                    <span className="text-[10px] font-semibold text-white/80 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapIcon size={14} className="text-sky-400" />
                  <span className="text-[10px] font-black text-white/55 uppercase tracking-wider">关联辖区</span>
                </div>
                <span className="text-[10px] font-bold text-sky-400/60 uppercase tracking-widest bg-sky-500/10 px-1.5 py-1 rounded">
                  已选 {selectedAreas.size}
                </span>
              </div>
              <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2">
                <div className="space-y-1">
                  {Object.entries(MOCK_AREAS).map(([category, areas]) => {
                    const isExpanded = expandedCategories.has(category);
                    const allSelected = areas.every(a => selectedAreas.has(a.id));
                    const someSelected = areas.some(a => selectedAreas.has(a.id)) && !allSelected;

                    return (
                      <div key={category} className="space-y-0.5">
                        <div className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg transition-all group">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="p-0.5 hover:bg-white/10 rounded text-white/40 transition-all"
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <div
                            onClick={() => toggleAllInCategory(category, areas)}
                            className="flex-1 flex items-center gap-2 cursor-pointer"
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                              allSelected ? 'bg-sky-500 border-sky-500' : someSelected ? 'bg-sky-500/40 border-sky-500/60' : 'border-white/20'
                            }`}>
                              {allSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                              {someSelected && <div className="w-1.5 h-0.5 bg-white rounded-full" />}
                            </div>
                            <span className="text-[11px] font-bold text-white/60 group-hover:text-white transition-colors">{category}</span>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden ml-6 space-y-0.5"
                            >
                              {areas.map(area => (
                                <div
                                  key={area.id}
                                  onClick={() => toggleArea(area.id)}
                                  className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer group transition-all"
                                >
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                    selectedAreas.has(area.id) ? 'bg-sky-500 border-sky-500' : 'border-white/20'
                                  }`}>
                                    {selectedAreas.has(area.id) && <Check size={10} className="text-white" strokeWidth={4} />}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className={`text-[11px] transition-colors ${selectedAreas.has(area.id) ? 'text-white font-bold' : 'text-white/40 group-hover:text-white/60'}`}>
                                      {area.name}
                                    </span>
                                    <span className="text-[10px] text-white/20">{area.type}</span>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                <button
                  onClick={() => setSelectedAreas(new Set())}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/40 hover:text-white text-[10px] font-bold transition-all"
                >
                  重置选择
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* 地图区域 */}
        <div className="flex-1 relative">
          <MapContainer 
            center={session.event.coords} 
            zoom={14} 
            className="h-full w-full"
            zoomControl={false}
          >
          <TileLayer
            url={VTS_CHART_TILE_URL}
            attribution={VTS_CHART_TILE_ATTRIBUTION}
          />
          
          {/* 渲染选中的辖区 */}
          {areaMapElements.map(element => (
            <React.Fragment key={element.id}>
              <Polygon 
                positions={element.bounds}
                pathOptions={{ 
                  color: '#0ea5e9', 
                  fillColor: '#0ea5e9', 
                  fillOpacity: 0.2, 
                  weight: 2,
                  dashArray: '5, 5'
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="text-xs font-bold text-sky-500 mb-1">{element.name}</h4>
                    <p className="text-[10px] text-gray-500">类型: {element.type}</p>
                  </div>
                </Popup>
              </Polygon>
              <Marker 
                position={element.center}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div class="flex flex-col items-center">
                      <div class="px-2 py-1 bg-sky-500/80 backdrop-blur-md border border-white/20 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-lg">
                        ${element.name}
                      </div>
                      <div class="w-2 h-2 bg-sky-500 rotate-45 -mt-1 border-r border-b border-white/20"></div>
                    </div>
                  `,
                  iconSize: [100, 40],
                  iconAnchor: [50, 40]
                })}
              />
            </React.Fragment>
          ))}
          
          {/* 完整轨迹线 */}
          <Polyline 
            positions={trajectory} 
            pathOptions={{ color: '#38bdf8', weight: 3, opacity: 0.3, dashArray: '10, 10' }} 
          />
          
          {/* 已走过的轨迹线 */}
          <Polyline 
            positions={trajectory.slice(0, Math.floor((progress / 100) * (trajectory.length - 1)) + 1)} 
            pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.8 }} 
          />

          {/* 风险点标记 */}
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

          {/* 当前船舶位置 */}
          {currentPos && (
            <Marker 
              position={currentPos}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `
                  <div class="relative">
                    <div class="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-sky-500/50">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="3" fill="none" style="transform: rotate(${currentHeading}deg)">
                        <path d="M12 2L19 21L12 17L5 21L12 2Z" />
                      </svg>
                    </div>
                    <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white whitespace-nowrap">
                      ${session.vessel.name}
                    </div>
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            />
          )}
        </MapContainer>

        {/* 底部进度条 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[80%] max-w-4xl z-[10]">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-6 shadow-2xl">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 bg-sky-500 hover:bg-sky-400 text-white rounded-full flex items-center justify-center transition-all shadow-lg shadow-sky-500/20"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase tracking-widest">
                <span>回放进度</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden relative group cursor-pointer">
                <div 
                  className="h-full bg-sky-500 transition-all duration-100" 
                  style={{ width: `${progress}%` }}
                />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={progress}
                  onChange={(e) => setProgress(parseFloat(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">实时航速</span>
              <span className="text-xl font-mono font-bold text-white">
                {currentSpeed.toFixed(1)} <span className="text-xs text-white/40">KN</span>
              </span>
            </div>
          </div>
        </div>

        {/* 右侧事件面板 */}
        <div className="absolute top-24 right-8 w-72 z-[10] space-y-4">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={16} className="text-sky-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">实时状态监控</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase">当前经度</span>
                <span className="text-[10px] font-mono text-white/80">{currentPos?.[1].toFixed(5)}°E</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase">当前纬度</span>
                <span className="text-[10px] font-mono text-white/80">{currentPos?.[0].toFixed(5)}°N</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 font-bold uppercase">预警状态</span>
                <span className={`text-[10px] font-bold uppercase ${progress > 80 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {progress > 80 ? '风险触发' : '正常航行'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-sky-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">历史通讯记录</h4>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {playbackDialogue.map((chat: any, idx: number) => (
                <div key={idx} className={`space-y-0.5 ${progress < (idx + 1) * 20 ? 'opacity-20' : 'opacity-100 transition-opacity duration-500'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/30 uppercase">{chat.sender}</span>
                    <span className="text-[10px] font-mono text-white/20">{chat.time.split(' ')[1]}</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed bg-white/5 p-1 rounded-lg border border-white/5">
                    {chat.content}
                  </p>
                </div>
              ))}
              {playbackDialogue.length === 0 && (
                <div className="rounded-lg border border-white/5 bg-white/5 px-2 py-3 text-[10px] text-white/35">
                  暂无关联通话记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );
};

export default function AppView() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [showBars, setShowBars] = useState(true);
  const [shipSearchQuery, setShipSearchQuery] = useState('');
  const [selectedHomeShipId, setSelectedHomeShipId] = useState<string | null>(SHIP_POSITIONS[0]?.id ?? null);
  const [selectedHomeShipTrackPointId, setSelectedHomeShipTrackPointId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('vhf');
  const [vhfViewMode, setVhfViewMode] = useState<'list' | 'flow'>('list');
  const [saabLinkageEnabled, setSaabLinkageEnabled] = useState(false);
  const [selectedStation, setSelectedStation] = useState('10号台');
  const [selectedIntent, setSelectedIntent] = useState<number | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [selectedAnchorage, setSelectedAnchorage] = useState<string | null>(null);
  const [hoveredShipType, setHoveredShipType] = useState<string | null>(null);
  const [hoveredDurationType, setHoveredDurationType] = useState<string | null>(null);
  const [selectedExpiringShip, setSelectedExpiringShip] = useState<string | null>(null);
  const [selectedOvertimeShip, setSelectedOvertimeShip] = useState<string | null>(null);
  const [anchorageTypeViewMode, setAnchorageTypeViewMode] = useState<'chart' | 'tags'>('chart');
  const [intents, setIntents] = useState<IntentItem[]>(INTENT_DATA);
  const [intentFilter, setIntentFilter] = useState('全部');
  const [editingIntentIndex, setEditingIntentIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ action: string; details: string }>({ action: '', details: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isControlPanelExpanded, setIsControlPanelExpanded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [initialAdminMenu, setInitialAdminMenu] = useState<string | undefined>(undefined);
  const [initialAdminStatsTab, setInitialAdminStatsTab] = useState<string | undefined>(undefined);
  const [playbackData, setPlaybackData] = useState<{ vessel: any, event: any } | null>(null);
  const [dynamicPlaybackSession, setDynamicPlaybackSession] = useState<{ vessel: any, event: any } | null>(null);
  const [vhfMessages, setVhfMessages] = useState<VHFMessage[]>(MOCK_VHF_MESSAGES);
  const [selectedVhfSessionId, setSelectedVhfSessionId] = useState<string | null>(null);
  const vhfShipInfoLookup = useMemo(() => {
    const lookup = new Map<string, VhfShipInfo>();
    const upsert = (name: string, next: Partial<VhfShipInfo>) => {
      if (!name) return;
      const key = normalizeVhfShipName(name);
      lookup.set(key, mergeVhfShipInfo(lookup.get(key), { name, ...next }));
    };

    SHIP_POSITIONS.forEach((ship) => {
      upsert(ship.name, {
        shipType: ship.type,
        mmsi: ship.mmsi,
        callSign: ship.callsign,
        englishName: ship.englishName,
        destination: ship.destination,
        speed: `${ship.speed.toFixed(1)}kn`,
      });
    });

    INTENT_DATA.forEach((item) => {
      upsert(item.ship, {
        shipType: item.shipType,
        englishName: item.englishName,
        mmsi: item.mmsi,
        callSign: item.callSign,
        imo: item.imo,
        flag: item.flag,
        lastPort: item.past,
        cargoType: item.cargoType,
        length: item.length,
        width: item.width,
        draft: item.draft,
        speed: item.speed,
        destination: item.destination,
        hdg: item.situation?.hdg,
      });
    });

    MOCK_RISK_STATS.forEach((item) => {
      upsert(item.name, {
        shipType: item.type,
        mmsi: item.mmsi,
        cargoType: item.cargo,
        length: `${item.length}m`,
        width: `${item.width}m`,
        draft: `${item.draft}m`,
        speed: `${item.speed.toFixed(1)}kn`,
        destination: item.destination,
      });
    });

    return lookup;
    }, []);

    // 监听锚地饼状图悬停，自动滚动右侧列表
    useEffect(() => {
    if (hoveredShipType && selectedAnchorage) {
      const container = document.getElementById(`anchorage-legend-${selectedAnchorage}`);
      const item = document.getElementById(`legend-item-${selectedAnchorage}-${hoveredShipType}`);
      if (container && item) {
        const containerRect = container.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        // 如果不在视口内，则滚动
        if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
          item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }
    }, [hoveredShipType, selectedAnchorage]);

    const vhfSessions = useMemo<VhfSessionSummary[]>(() => {
    const groupedSessions = new Map<string, VHFMessage[]>();

    vhfMessages.forEach((message) => {
      if (!groupedSessions.has(message.sessionId)) {
        groupedSessions.set(message.sessionId, []);
      }
      groupedSessions.get(message.sessionId)?.push(message);
    });

    return [...groupedSessions.entries()]
      .map(([sessionId, sessionMessages]) => {
        const messages = [...sessionMessages].sort((a, b) => parseLegacyVhfTimestamp(a) - parseLegacyVhfTimestamp(b));
        const cards = groupVhfMessages(messages.map(normalizeLegacyVhfMessage));
        const shipMessage = messages.find((message) => !message.isVTS);
        const latestMessage = messages[messages.length - 1];
        const firstMessage = messages[0];
        const shipName = shipMessage?.sender || latestMessage?.sender || '未知船舶';

        return {
          sessionId,
          shipName,
          operatorName: messages.find((message) => message.isVTS)?.sender || '值班员',
          intent: latestMessage?.sessionIntent || shipMessage?.sessionIntent || '待识别',
          sessionType: latestMessage?.sessionType || shipMessage?.sessionType || 'intent',
          messages,
          cards,
          shipInfo: vhfShipInfoLookup.get(normalizeVhfShipName(shipName)),
          startedAt: firstMessage ? parseLegacyVhfTimestamp(firstMessage) : 0,
          latestAt: latestMessage ? parseLegacyVhfTimestamp(latestMessage) : 0,
          latestTime: latestMessage ? `${latestMessage.date} ${latestMessage.time}` : '',
        };
      })
      .sort((a, b) => b.latestAt - a.latestAt);
  }, [vhfMessages, vhfShipInfoLookup]);
  const activeVhfSession = useMemo(
    () => vhfSessions.find((session) => session.sessionId === selectedVhfSessionId) ?? vhfSessions[0] ?? null,
    [selectedVhfSessionId, vhfSessions],
  );
  const waitingVhfSessions = useMemo(
    () => vhfSessions.filter((session) => session.sessionId !== activeVhfSession?.sessionId),
    [activeVhfSession?.sessionId, vhfSessions],
  );
  const homeShipDetails = useMemo<HomeShipDetail[]>(() =>
    SHIP_POSITIONS.map((ship) => {
      const shipKey = normalizeVhfShipName(ship.name);
      const intent = INTENT_DATA.find((item) => normalizeVhfShipName(item.ship) === shipKey);
      const riskStat = MOCK_RISK_STATS.find((item) => item.mmsi === ship.mmsi || normalizeVhfShipName(item.name) === shipKey);
      const alert = MOCK_ALERTS.find((item) => item.mmsi === ship.mmsi || normalizeVhfShipName(item.ship) === shipKey);
      const session = vhfSessions.find((item) => normalizeVhfShipName(item.shipName) === shipKey);
      const info = vhfShipInfoLookup.get(shipKey);
      const route = {
        past: intent?.past || '上游航段',
        current: intent?.current || ship.destination,
        destination: intent?.destination || ship.destination,
      };
      const track = createHomeShipTrack(ship, route);
      const movement = getHomeShipMovement(route.destination);
      const operator = getHomeShipOperator(route.destination);
      const cargoName = info?.cargoType || riskStat?.cargo || alert?.cargo || '普通货物';
      const isContainerShip = (info?.shipType || riskStat?.type || ship.type).includes('集装箱');
      const isHazardous = ship.type.includes('油') || cargoName.includes('油') || cargoName.includes('危险');
      const grossTonnage = `${Math.max(800, Math.round(ship.speed * 260 + ship.heading * 7))}`;
      const dynamicEvents = createHomeShipDynamicEvents({
        shipId: ship.id,
        route,
        intent,
        track,
      });

      return {
        id: ship.id,
        name: ship.name,
        displayName: `${getHomeShipEnglishName(ship.name)} / ${ship.name}`,
        mmsi: ship.mmsi,
        type: info?.shipType || riskStat?.type || ship.type,
        status: ship.status,
        destination: ship.destination,
        speed: ship.speed,
        heading: ship.heading,
        lat: ship.lat,
        lng: ship.lng,
        length: info?.length || (riskStat ? `${riskStat.length}m` : '--'),
        width: info?.width || (riskStat ? `${riskStat.width}m` : '--'),
        draft: info?.draft || (riskStat ? `${riskStat.draft}m` : '--'),
        cargo: cargoName,
        callsign: riskStat?.callsign || alert?.callsign || `VTS${ship.mmsi.slice(-4)}`,
        imo: `${9700000 + Number(ship.mmsi.slice(-4))}`,
        grossTonnage,
        statusBanner:
          ship.status === 'warning'
            ? '10分钟前申请锚地'
            : ship.status === 'caution'
              ? '15分钟前提交进港申请'
              : '当前动态正常',
        route,
        intentSummary:
          intent?.intentSummary ||
          `当前前往 ${route.destination}，保持 ${ship.heading}° 航向，持续沿推荐航路航行。`,
        vhfSummary: session
          ? `${session.intent} · 最近通话 ${session.latestTime.split(' ').pop()}`
          : '暂无实时 VHF 对话',
        riskSummary: riskStat?.risk || alert?.type || (ship.status === 'warning' ? '重点关注' : '常规监控'),
        businessInfo: {
          plannedBerth: route.destination,
          movement,
          plannedTime: intent?.intentEta || '待调度确认',
          previousPort: route.past,
          nextPort: route.destination,
          applicant: session?.operatorName || '值班员',
          operator,
          teu: isContainerShip ? `${Math.max(220, Math.round(ship.speed * 36))}` : '--',
          dischargeVolume: isContainerShip ? `${Math.max(120, Math.round(ship.speed * 18))}` : `${Math.max(300, Math.round(ship.speed * 42))}吨`,
          eta: intent?.occurrenceTime || '待更新',
          departureTime: session?.latestTime || intent?.occurrenceTime || '待更新',
        },
        cargoInfo: {
          cargoName,
          cargoAmount: isContainerShip ? `${Math.max(260, Math.round(ship.speed * 40))}TEU` : `${Math.max(500, Math.round(ship.speed * 55))}吨`,
          localHazardAmount: isHazardous ? `${Math.max(20, Math.round(ship.speed * 4))}吨` : '--',
          actualHazardAmount: isHazardous ? `${Math.max(80, Math.round(ship.speed * 8))}吨` : '--',
        },
        dynamicEvents,
        track,
      };
    }),
  [vhfSessions, vhfShipInfoLookup]);
  const selectedHomeShip = useMemo(
    () => homeShipDetails.find((ship) => ship.id === selectedHomeShipId) ?? homeShipDetails[0] ?? null,
    [homeShipDetails, selectedHomeShipId],
  );
  const selectedHomeShipTrackPoint = useMemo(() => {
    if (!selectedHomeShip) return null;
    return (
      selectedHomeShip.track.find((point) => point.id === selectedHomeShipTrackPointId) ??
      selectedHomeShip.track[selectedHomeShip.track.length - 1] ??
      null
    );
  }, [selectedHomeShip, selectedHomeShipTrackPointId]);
  const homeMapFocusTarget = useMemo<[number, number] | null>(() => {
    if (selectedHomeShipTrackPoint) return selectedHomeShipTrackPoint.coords;
    if (!selectedHomeShip) return null;
    return [selectedHomeShip.lat, selectedHomeShip.lng];
  }, [selectedHomeShip, selectedHomeShipTrackPoint]);
  const shipSearchResults = useMemo<ShipSearchResult[]>(() => {
    const keyword = shipSearchQuery.trim().toLowerCase();
    if (!keyword) return homeShipDetails;
    return homeShipDetails.filter((ship) =>
      ship.name.toLowerCase().includes(keyword) ||
      ship.mmsi.includes(keyword) ||
      ship.type.toLowerCase().includes(keyword) ||
      ship.destination.toLowerCase().includes(keyword),
    );
  }, [homeShipDetails, shipSearchQuery]);

  const handleSelectHomeShip = (shipId: string) => {
    setSelectedHomeShipId(shipId);
    setShipSearchQuery('');
    setActiveTab('ship');
    if (!sidebarOpen) {
      setSidebarOpen(true);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (window as any).setDynamicPlaybackSession = setDynamicPlaybackSession;
    return () => {
      delete (window as any).setDynamicPlaybackSession;
    };
  }, [setDynamicPlaybackSession]);

  useEffect(() => {
    if (vhfSessions.length === 0) {
      if (selectedVhfSessionId !== null) {
        setSelectedVhfSessionId(null);
      }
      return;
    }

    if (!selectedVhfSessionId || !vhfSessions.some((session) => session.sessionId === selectedVhfSessionId)) {
      setSelectedVhfSessionId(vhfSessions[0].sessionId);
    }
  }, [selectedVhfSessionId, vhfSessions]);

  useEffect(() => {
    if (!selectedHomeShip) return;
    setSelectedHomeShipTrackPointId(selectedHomeShip.track[selectedHomeShip.track.length - 1]?.id ?? null);
  }, [selectedHomeShipId, selectedHomeShip]);

  useEffect(() => {
    if (!selectedHomeShipId && homeShipDetails.length > 0) {
      setSelectedHomeShipId(homeShipDetails[0].id);
    }
  }, [homeShipDetails, selectedHomeShipId]);

  return (
    <div className="vts-home-shell h-screen w-screen overflow-hidden bg-[#0a0a0a] font-sans text-white flex flex-col">
      <AnimatePresence>
        {dynamicPlaybackSession && (
          <DynamicPlaybackView 
            session={dynamicPlaybackSession} 
            onClose={() => setDynamicPlaybackSession(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminView && (
          <AdminPanel
            onClose={() => {
              setIsAdminView(false);
              setInitialAdminMenu(undefined);
              setInitialAdminStatsTab(undefined);
            }}
            playbackData={playbackData}
            setPlaybackData={setPlaybackData}
            setDynamicPlaybackSession={setDynamicPlaybackSession}
            initialMenu={initialAdminMenu}
            initialStatsTab={initialAdminStatsTab}
          />
        )}
      </AnimatePresence>

      {/* --- 顶部导航栏 --- */}
      <AnimatePresence>
        {showBars && (
          <motion.header 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'var(--vts-topbar-height)', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 z-[3000] shrink-0"
          >
            <div className="flex items-center gap-4">
              {/* 搜索入口已移至侧轨 */}
            </div>

            {/* 中心标题 */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <div className="relative">
                <div className="w-1.5 h-3 bg-sky-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.6)]" />
                <div className="absolute inset-0 bg-sky-400 blur-sm opacity-50 animate-pulse" />
              </div>
              <h1 className="text-base font-black uppercase tracking-[0.24em] text-white/90">VTS智能辅助系统</h1>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsAdminView(true)}
                className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors"
              >
                <Settings size={20} />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`p-2 rounded-full transition-all relative ${showUserMenu ? 'bg-sky-500/20 text-sky-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  <User size={20} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40 cursor-pointer"
                        onClick={() => setShowUserMenu(false)}
                      />                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl z-50"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
                              <User size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white/90">管理员</div>
                              <div className="text-[10px] text-white/40">在线</div>
                            </div>
                          </div>
                          
                          <div className="h-px bg-white/5 mx-1" />
                          
                          <div className="px-2 py-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">当前区域</div>
                            <div className="flex items-center gap-2 text-xs text-white/70">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              外高桥区域
                            </div>
                          </div>

                          <button className="w-full flex items-center gap-2 px-2 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <LogOut size={14} />
                            退出登录
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* --- 主内容区 --- */}
      <main className={`flex-1 flex overflow-hidden relative ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* 统一侧边栏 */}
        <SidebarPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}          onToggle={() => setSidebarOpen(!sidebarOpen)}
          position={sidebarPosition}
          showBars={showBars}
          onToggleBars={() => setShowBars(!showBars)}
          shipSearchQuery={shipSearchQuery}
          onShipSearchQueryChange={setShipSearchQuery}
          shipSearchResults={shipSearchResults}
          onShipSearchSelect={handleSelectHomeShip}
        >
          {activeTab === 'ship' && (
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <HomeShipDetailPanel
                  ship={selectedHomeShip}
                  onSelectTrackPoint={setSelectedHomeShipTrackPointId}
                />
              </div>
            </div>
          )}
          {activeTab === 'vhf' && (
            <VhfPanel
              saabLinkageEnabled={saabLinkageEnabled}
              selectedStation={selectedStation}
              vhfViewMode={vhfViewMode}
              vhfMessages={vhfMessages}
              activeVhfSession={activeVhfSession}
              waitingVhfSessions={waitingVhfSessions}
              onToggleSaabLinkage={() => setSaabLinkageEnabled(!saabLinkageEnabled)}
              onSelectedStationChange={setSelectedStation}
              onViewModeChange={setVhfViewMode}
              onSelectSession={setSelectedVhfSessionId}
            />
          )}

          {activeTab === 'intent' && (
            <IntentListPanel
              intents={intents}
              intentFilter={intentFilter}
              selectedIntent={selectedIntent}
              editingIntentIndex={editingIntentIndex}
              onIntentFilterChange={setIntentFilter}
              onToggleIntent={(index) => setSelectedIntent(selectedIntent === index ? null : index)}
              onCloseIntent={() => setSelectedIntent(null)}
              getCompactIntentLine={getCompactIntentLine}
              getCompactRiskLines={getCompactRiskLines}
            />
          )}

          {activeTab === 'warning' && (
            <WarningListPanel
              alerts={MOCK_ALERTS}
              selectedAlert={selectedAlert}
              onToggleAlert={(alertId) => setSelectedAlert(selectedAlert === alertId ? null : alertId)}
              onCloseAlert={() => setSelectedAlert(null)}
            />
          )}

          {activeTab === 'anchorage' && (
            <AnchoragePanel
              anchorages={MOCK_ANCHORAGES}
              selectedAnchorage={selectedAnchorage}
              selectedExpiringShip={selectedExpiringShip}
              selectedOvertimeShip={selectedOvertimeShip}
              hoveredShipType={hoveredShipType}
              hoveredDurationType={hoveredDurationType}
              anchorageTypeViewMode={anchorageTypeViewMode}
              currentTime={currentTime}
              onSelectAnchorage={(anchorageId, nextExpiringShipId) => {
                setSelectedAnchorage(anchorageId);
                setSelectedExpiringShip(nextExpiringShipId);
                setSelectedOvertimeShip(null);
              }}
              onSelectExpiringShip={setSelectedExpiringShip}
              onSelectOvertimeShip={setSelectedOvertimeShip}
              onHoveredShipTypeChange={setHoveredShipType}
              onHoveredDurationTypeChange={setHoveredDurationType}
              onAnchorageTypeViewModeChange={setAnchorageTypeViewMode}
              getAnchorageTypeStats={getAnchorageTypeStats}
              getAnchorageDurationStats={getAnchorageDurationStats}
              getAnchorageAvailabilityRatio={getAnchorageAvailabilityRatio}
              formatAnchorageRemainingDuration={formatAnchorageRemainingDuration}
              getAnchorageExpiryMeta={getAnchorageExpiryMeta}
              chartColors={ANCHORAGE_TYPE_CHART_COLORS}
              MarqueeText={MarqueeText}
            />
          )}
        </SidebarPanel>

        {/* 中间：海图容器 */}
        <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
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
            <MousePositionTracker onMouseMove={setMouseCoords} />
            <PlaybackMapController playbackData={playbackData} />
            <HomeMapFocusController target={homeMapFocusTarget} />
            <TileLayer
              url={VTS_CHART_TILE_URL}
              attribution={VTS_CHART_TILE_ATTRIBUTION}
            />

            {HOME_MAP_OVERLAY_BADGES.map((badge) => (
              <Marker
                key={badge.id}
                position={badge.position}
                icon={createHomeMapBadgeIcon(badge)}
                zIndexOffset={badge.kind === 'warning' ? 600 : 520}
              >
                <Popup>
                  <div className="min-w-[160px] p-1">
                    <div className={`text-[12px] font-semibold ${badge.kind === 'warning' ? 'text-red-500' : 'text-amber-500'}`}>
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
                          handleSelectHomeShip(selectedHomeShip.id);
                          setSelectedHomeShipTrackPointId(point.id);
                        },
                      }}
                    >
                      <Popup>
                        <div className="min-w-[160px] p-1">
                          <div className="text-[12px] font-semibold text-sky-500">{selectedHomeShip.name}</div>
                          <div className="mt-1 text-[11px] text-slate-600">{point.label} · {point.time}</div>
                          <div className="mt-1 text-[11px] text-slate-500">{point.note}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </>
            )}

            {/* 船舶标记 */}
            {SHIP_POSITIONS.map((ship) => (
              <Marker
                key={ship.id}
                position={[ship.lat, ship.lng]}
                icon={createShipIcon(ship, selectedHomeShip?.id === ship.id)}
                zIndexOffset={selectedHomeShip?.id === ship.id ? 900 : 320}
                eventHandlers={{
                  click: () => {
                    handleSelectHomeShip(ship.id);
                  }
                }}
              >
                <Popup>
                  <div className="min-w-[160px] p-1">
                    <div className="text-[12px] font-semibold text-sky-500">{ship.name}</div>
                    <div className="mt-1 text-[11px] text-slate-600">{ship.type} · {ship.mmsi}</div>
                    <div className="mt-1 text-[11px] text-slate-500">航速 {ship.speed.toFixed(1)} kn · 目的地 {ship.destination}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* 地图控制叠加层 */}
          <div className="absolute top-4 left-4 flex flex-col gap-4 z-[1500]">
            {/* 这里可以放置地图控制按钮 */}
          </div>
        </div>
      </main>

      {/* --- 底部状态栏 --- */}
      <AnimatePresence>
        {showBars && (
          <motion.footer 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'var(--vts-bottombar-height)', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 z-[3000] shrink-0"
          >
            <div className="flex-1" />

            <div className="flex items-center gap-8 relative">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">比例尺</span>
                <div className="w-16 h-1 bg-white/10 relative rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-white/30" />
                </div>
                <span className="text-[10px] font-mono text-white/50">2.5 NM</span>
              </div>

              {/* 实时经纬度显示 */}
              <div className="flex items-center gap-4 border-l border-white/5 pl-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">经度</span>
                  <span className="text-[10px] font-mono text-sky-400 w-[80px]">
                    {mouseCoords ? mouseCoords.lng.toFixed(6) : '---.------'}°E
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">纬度</span>
                  <span className="text-[10px] font-mono text-sky-400 w-[80px]">
                    {mouseCoords ? mouseCoords.lat.toFixed(6) : '--.------'}°N
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {isControlPanelExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-2 w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl z-[5000]"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/70">面板位置 (左/右)</span>
                        <button 
                          onClick={() => setSidebarPosition(sidebarPosition === 'left' ? 'right' : 'left')}
                          className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 hover:bg-white/10 transition-all"
                        >
                          <span className={`text-[10px] font-bold ${sidebarPosition === 'left' ? 'text-sky-400' : 'text-white/30'}`}>左</span>
                          <div className="w-px h-2 bg-white/10" />
                          <span className={`text-[10px] font-bold ${sidebarPosition === 'right' ? 'text-sky-400' : 'text-white/30'}`}>右</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setIsControlPanelExpanded(!isControlPanelExpanded)}
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${isControlPanelExpanded ? 'text-sky-500' : 'text-white/40 hover:text-white'}`}
              >
                展开控制面板 <ChevronRight size={12} className={`transition-transform duration-300 ${isControlPanelExpanded ? 'rotate-[90deg]' : 'rotate-[-90deg]'}`} />
              </button>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* 全局滚动条样式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />

      {/* 辖区船舶分布 - 浮动面板 */}
      <AnimatePresence>
      </AnimatePresence>

      {/* 锚地态势 - 浮动面板 */}
      <AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
