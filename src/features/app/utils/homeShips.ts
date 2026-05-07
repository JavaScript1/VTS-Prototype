import { type HomeShipDetail, type HomeShipDynamicEvent, type HomeShipTrackPoint, type IntentItem, type ShipPosition } from '../../../types';

export const createHomeShipTrack = (
  ship: ShipPosition,
  route: HomeShipDetail['route'],
): HomeShipTrackPoint[] => {
  const headingRadians = (ship.heading * Math.PI) / 180;
  const latStep = Math.cos(headingRadians) * 0.0068;
  const lngStep = Math.sin(headingRadians) * 0.0086;
  const offsets = [3.2, 2.2, 1.2, 0];
  const labels = [route.past || '上游航段', '进入辖区', route.current || '当前航段', '当前船位'];
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

export const getHomeShipEnglishName = (name: string) => `MV ${name.replace(/\s+/g, '').toUpperCase()}`;

export const getHomeShipMovement = (destination: string) => {
  if (destination.includes('锚地')) return '锚泊申请';
  if (destination.includes('码头') || destination.includes('港')) return '进港';
  return '出港';
};

export const getHomeShipOperator = (destination: string) => {
  if (destination.includes('码头')) return `${destination}有限公司`;
  if (destination.includes('锚地')) return `${destination}调度中心`;
  return `${destination}港务公司`;
};

export const createHomeShipDynamicEvents = ({
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
    text:
      point.kind === 'current'
        ? `正在沿 ${route.current} 航行`
        : point.label === '进入辖区'
          ? '进入值班辖区水域'
          : point.note,
    type: 'navigation',
    level: 'info',
    trackPointId: point.id,
  }));

  return [...fromTrack, ...fromTimeline].slice(0, 8).sort((a, b) => b.time.localeCompare(a.time));
};
