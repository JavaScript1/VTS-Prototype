import type { MockArea } from '../../../../types';
import {
  WARNING_AREA_CATEGORY_META,
  WARNING_AREA_TYPE_COLORS,
  WARNING_LINE_TYPES,
} from '../../../map/constants';

export type RiskConfigAreaType = '全部' | '航道' | '锚地' | '泊位' | '警戒区';

export type WarningAreaRecord = MockArea & {
  category: string;
};

export type WarningAreaFeature = {
  id: string;
  name: string;
  type: string;
  category: string;
  center: [number, number];
  polygon?: [number, number][];
  polyline?: [number, number][];
  color: string;
};

export const getRiskConfigAreaType = ({
  type,
  category,
}: {
  type: string;
  category: string;
}): Exclude<RiskConfigAreaType, '全部'> | null => {
  if (type === '锚地') return '锚地';
  if (type === '泊位' || type === '码头') return '泊位';
  if (type === '警戒区') return '警戒区';
  if (category === '航道航行设施' && WARNING_LINE_TYPES.has(type)) {
    return '航道';
  }
  return null;
};

const hashWarningAreaSeed = (value: string) =>
  Array.from(value).reduce((seed, char) => (seed * 33 + char.charCodeAt(0)) >>> 0, 5381);

const createRectPolygon = (
  center: [number, number],
  latRadius: number,
  lngRadius: number,
): [number, number][] => [
  [center[0] - latRadius, center[1] - lngRadius],
  [center[0] - latRadius, center[1] + lngRadius],
  [center[0] + latRadius, center[1] + lngRadius],
  [center[0] + latRadius, center[1] - lngRadius],
];

const createDiamondPolygon = (
  center: [number, number],
  latRadius: number,
  lngRadius: number,
): [number, number][] => [
  [center[0] - latRadius, center[1]],
  [center[0], center[1] + lngRadius],
  [center[0] + latRadius, center[1]],
  [center[0], center[1] - lngRadius],
];

export const createWarningAreaFeature = (
  area: Pick<WarningAreaRecord, 'id' | 'name' | 'type'>,
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
      return {
        id: area.id,
        name: area.name,
        type: area.type,
        category,
        center,
        polyline: [
          [lat - 0.012, lng - 0.018],
          [lat - 0.004, lng - 0.008],
          [lat + 0.006, lng + 0.01],
          [lat + 0.014, lng + 0.022],
        ],
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

export const getRiskLevel = (score?: number) => {
  if ((score ?? 0) >= 85) return '紧急';
  if ((score ?? 0) >= 75) return '警报';
  if ((score ?? 0) >= 60) return '警告';
  return '注意';
};

export const getRiskStatus = (score?: number) => ((score ?? 0) >= 80 ? '报警中' : '已关闭');
