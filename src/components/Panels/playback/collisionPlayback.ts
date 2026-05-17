export type CollisionSeverity = 'observe' | 'warning' | 'critical';

export type CollisionPlaybackVessel = {
  id: string;
  name: string;
  color: string;
  isPrimary?: boolean;
  track: [number, number][];
};

export type CollisionPlaybackState = {
  severity: CollisionSeverity;
  vessels: Array<
    CollisionPlaybackVessel & {
      current: [number, number];
      traveled: [number, number][];
    }
  >;
  alertPolygon: [number, number][];
};

const COLLISION_KEYWORD = '碰撞';

export function isCollisionPlayback(label: string) {
  return label.includes(COLLISION_KEYWORD);
}

function interpolatePath(track: [number, number][], progress: number) {
  const scaled = Math.max(0, Math.min(1, progress / 100)) * (track.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(track.length - 1, index + 1);
  const ratio = scaled - index;
  const currentPoint = track[index];
  const nextPoint = track[nextIndex];

  return [
    currentPoint[0] + (nextPoint[0] - currentPoint[0]) * ratio,
    currentPoint[1] + (nextPoint[1] - currentPoint[1]) * ratio,
  ] as [number, number];
}

function buildBoundingPolygon(points: [number, number][], padding = 0.0045) {
  const lats = points.map((point) => point[0]);
  const lngs = points.map((point) => point[1]);
  const minLat = Math.min(...lats) - padding;
  const maxLat = Math.max(...lats) + padding;
  const minLng = Math.min(...lngs) - padding * 1.2;
  const maxLng = Math.max(...lngs) + padding * 1.2;

  return [
    [minLat, minLng],
    [maxLat, minLng],
    [maxLat, maxLng],
    [minLat, maxLng],
  ] as [number, number][];
}

function getPointDistance(a: [number, number], b: [number, number]) {
  const latDistance = a[0] - b[0];
  const lngDistance = a[1] - b[1];
  return Math.sqrt(latDistance * latDistance + lngDistance * lngDistance);
}

function getCollisionSeverity(points: [number, number][]): CollisionSeverity {
  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < points.length; compareIndex += 1) {
      minDistance = Math.min(minDistance, getPointDistance(points[index], points[compareIndex]));
    }
  }

  if (minDistance <= 0.0065) return 'critical';
  if (minDistance <= 0.0135) return 'warning';
  return 'observe';
}

export function getCollisionPlaybackState(
  center: [number, number],
  primaryName: string,
  progress: number,
): CollisionPlaybackState {
  const baseLat = center[0];
  const baseLng = center[1];

  const vessels: CollisionPlaybackVessel[] = [
    {
      id: 'primary',
      name: primaryName,
      color: '#0ea5e9',
      isPrimary: true,
      track: [
        [baseLat - 0.018, baseLng - 0.046],
        [baseLat - 0.009, baseLng - 0.024],
        [baseLat - 0.003, baseLng - 0.008],
        [baseLat + 0.004, baseLng + 0.008],
        [baseLat + 0.011, baseLng + 0.028],
        [baseLat + 0.018, baseLng + 0.046],
      ],
    },
    {
      id: 'cross-1',
      name: '海盛 218',
      color: '#f97316',
      track: [
        [baseLat + 0.022, baseLng + 0.044],
        [baseLat + 0.014, baseLng + 0.026],
        [baseLat + 0.006, baseLng + 0.012],
        [baseLat - 0.002, baseLng - 0.004],
        [baseLat - 0.01, baseLng - 0.022],
        [baseLat - 0.016, baseLng - 0.038],
      ],
    },
    {
      id: 'cross-2',
      name: '港安拖 6',
      color: '#ef4444',
      track: [
        [baseLat - 0.024, baseLng + 0.012],
        [baseLat - 0.014, baseLng + 0.008],
        [baseLat - 0.006, baseLng + 0.004],
        [baseLat + 0.004, baseLng - 0.002],
        [baseLat + 0.016, baseLng - 0.008],
        [baseLat + 0.028, baseLng - 0.014],
      ],
    },
  ];

  const resolved = vessels.map((vessel) => {
    const current = interpolatePath(vessel.track, progress);
    const traveledCount = Math.max(2, Math.floor((progress / 100) * (vessel.track.length - 1)) + 1);
    const traveled = [...vessel.track.slice(0, traveledCount), current];

    return {
      ...vessel,
      current,
      traveled,
    };
  });

  const currentPositions = resolved.map((vessel) => vessel.current);

  return {
    severity: getCollisionSeverity(currentPositions),
    vessels: resolved,
    alertPolygon: buildBoundingPolygon(currentPositions),
  };
}
