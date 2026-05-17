import { HOME_MAP_DEFAULT_CENTER } from '../map/constants';

export type TimeRange = '24h' | '自定义';
export type WarningType = '全部' | '碰撞预警' | '区域入侵' | '超速预警' | '走锚预警';
export type Jurisdiction = '全部' | '外高桥' | '洋山' | '吴淞' | '宝山';

export type HotspotConfig = {
  id: string;
  name: string;
  jurisdiction: Exclude<Jurisdiction, '全部'>;
  center: [number, number];
  spread: number;
  weight: number;
  focus: string;
  trend: 'up' | 'down';
  warningMix: Exclude<WarningType, '全部'>[];
};

export type WarningLocation = {
  id: string;
  lat: number;
  lng: number;
  intensity: number;
  hotspotId: string;
  hotspotName: string;
  type: WarningType | '常规监控';
  time: string;
  eventWeight: number;
};

export type PlaybackFrame = {
  id: string;
  timeLabel: string;
  focusHotspotId: string;
  locations: WarningLocation[];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const JURISDICTION_OPTIONS: Jurisdiction[] = ['全部', '外高桥', '洋山', '吴淞', '宝山'];
export const WARNING_TYPE_OPTIONS: WarningType[] = [
  '全部',
  '碰撞预警',
  '区域入侵',
  '超速预警',
  '走锚预警',
];
export const PLAYBACK_SPEED_OPTIONS = [0.5, 1, 2, 4] as const;

export const HOTSPOT_CONFIGS: HotspotConfig[] = [
  {
    id: 'wusongkou',
    name: '吴淞口警戒带',
    jurisdiction: '吴淞',
    center: [HOME_MAP_DEFAULT_CENTER[0], HOME_MAP_DEFAULT_CENTER[1]],
    spread: 0.05,
    weight: 0.84,
    focus: '碰撞 / 交汇风险高发',
    trend: 'up',
    warningMix: ['碰撞预警', '区域入侵', '超速预警'],
  },
  {
    id: 'waigaoqiao',
    name: '外高桥作业水域',
    jurisdiction: '外高桥',
    center: [HOME_MAP_DEFAULT_CENTER[0] + 0.12, HOME_MAP_DEFAULT_CENTER[1] + 0.08],
    spread: 0.04,
    weight: 0.72,
    focus: '区域入侵 / 靠离泊扰动',
    trend: 'down',
    warningMix: ['区域入侵', '超速预警', '走锚预警'],
  },
  {
    id: 'beicao',
    name: '北槽核心航道',
    jurisdiction: '宝山',
    center: [HOME_MAP_DEFAULT_CENTER[0] - 0.08, HOME_MAP_DEFAULT_CENTER[1] - 0.05],
    spread: 0.03,
    weight: 0.58,
    focus: '超速 / 航道压缩风险',
    trend: 'up',
    warningMix: ['超速预警', '碰撞预警', '区域入侵'],
  },
  {
    id: 'jingjie',
    name: '东侧警戒区',
    jurisdiction: '洋山',
    center: [HOME_MAP_DEFAULT_CENTER[0] + 0.05, HOME_MAP_DEFAULT_CENTER[1] + 0.15],
    spread: 0.06,
    weight: 0.46,
    focus: '边界试探 / 走锚告警',
    trend: 'up',
    warningMix: ['走锚预警', '区域入侵', '碰撞预警'],
  },
];

const HOTSPOT_COUNT_SERIES: Record<string, number[]> = {
  wusongkou: [82, 88, 94, 101, 108, 115, 120, 116, 110, 104, 98, 90],
  waigaoqiao: [54, 59, 63, 71, 76, 80, 78, 74, 70, 66, 61, 57],
  beicao: [28, 31, 35, 40, 44, 50, 48, 45, 41, 38, 34, 31],
  jingjie: [24, 28, 31, 35, 38, 40, 39, 37, 34, 32, 29, 26],
};

const FRAME_TIME_LABELS = [
  '2026-05-11 08:15:00',
  '2026-05-11 08:45:00',
  '2026-05-11 09:15:00',
  '2026-05-11 09:45:00',
  '2026-05-11 10:15:00',
  '2026-05-11 10:45:00',
  '2026-05-11 11:15:00',
  '2026-05-11 11:45:00',
  '2026-05-11 12:15:00',
  '2026-05-11 12:45:00',
  '2026-05-11 13:15:00',
  '2026-05-11 13:45:00',
];

const FRAME_FOCUS_SEQUENCE = [
  'beicao',
  'wusongkou',
  'waigaoqiao',
  'wusongkou',
  'jingjie',
  'waigaoqiao',
  'wusongkou',
  'jingjie',
  'beicao',
  'wusongkou',
  'waigaoqiao',
  'jingjie',
];

function buildHotspotPoints(
  hotspot: HotspotConfig,
  frameIndex: number,
  eventCount: number,
): WarningLocation[] {
  const visualCount = clamp(Math.round(eventCount / 4), 10, 34);
  const pointWeight = eventCount / visualCount;

  return Array.from({ length: visualCount }, (_, pointIndex) => {
    const angle =
      ((pointIndex / visualCount) * Math.PI * 2 + frameIndex * 0.42 + hotspot.weight) % (Math.PI * 2);
    const radiusFactor = 0.28 + (((pointIndex * 17 + frameIndex * 11) % 100) / 100) * 0.72;
    const lat = hotspot.center[0] + Math.sin(angle) * hotspot.spread * radiusFactor;
    const lng = hotspot.center[1] + Math.cos(angle) * hotspot.spread * radiusFactor * 1.15;
    const intensity = clamp(
      0.32 + hotspot.weight * 0.52 + Math.sin(frameIndex * 0.55 + pointIndex) * 0.12,
      0.18,
      0.98,
    );

    return {
      id: `${hotspot.id}-${frameIndex}-${pointIndex}`,
      lat,
      lng,
      intensity,
      hotspotId: hotspot.id,
      hotspotName: hotspot.name,
      type: hotspot.warningMix[(pointIndex + frameIndex) % hotspot.warningMix.length],
      time: FRAME_TIME_LABELS[frameIndex],
      eventWeight: pointWeight,
    };
  });
}

function buildNoisePoints(frameIndex: number): WarningLocation[] {
  return Array.from({ length: 28 }, (_, pointIndex) => {
    const lat = HOME_MAP_DEFAULT_CENTER[0] - 0.12 + ((pointIndex * 19 + frameIndex * 7) % 100) / 220;
    const lng = HOME_MAP_DEFAULT_CENTER[1] - 0.22 + ((pointIndex * 13 + frameIndex * 9) % 100) / 150;

    return {
      id: `noise-${frameIndex}-${pointIndex}`,
      lat,
      lng,
      intensity: 0.18 + ((pointIndex + frameIndex) % 5) * 0.04,
      hotspotId: 'noise',
      hotspotName: '离散监测点',
      type: '常规监控',
      time: FRAME_TIME_LABELS[frameIndex],
      eventWeight: 1,
    };
  });
}

export const PLAYBACK_FRAMES: PlaybackFrame[] = FRAME_TIME_LABELS.map((timeLabel, frameIndex) => {
  const locations = HOTSPOT_CONFIGS.flatMap((hotspot) =>
    buildHotspotPoints(hotspot, frameIndex, HOTSPOT_COUNT_SERIES[hotspot.id][frameIndex]),
  );

  return {
    id: `frame-${frameIndex}`,
    timeLabel,
    focusHotspotId: FRAME_FOCUS_SEQUENCE[frameIndex],
    locations: [...locations, ...buildNoisePoints(frameIndex)],
  };
});
