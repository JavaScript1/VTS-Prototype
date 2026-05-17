import { type ShipPosition } from '../types';

export interface PatrolBoat extends ShipPosition {
  crew: number;
  fuel: number;
  readiness: 'ready' | 'busy' | 'maintenance';
}

export const MOCK_PATROL_BOATS: PatrolBoat[] = [
  {
    id: 'pb-1',
    name: '海巡 01',
    lat: 31.425,
    lng: 121.565,
    heading: 45,
    type: '大型巡逻船',
    speed: 18.5,
    destination: '警戒区 A',
    status: 'normal',
    mmsi: '413000101',
    callsign: 'B1234',
    crew: 12,
    fuel: 85,
    readiness: 'ready',
  },
  {
    id: 'pb-2',
    name: '海巡 012',
    lat: 31.35,
    lng: 121.48,
    heading: 120,
    type: '中型巡逻船',
    speed: 15.0,
    destination: '吴淞口',
    status: 'normal',
    mmsi: '413000112',
    callsign: 'B1212',
    crew: 6,
    fuel: 92,
    readiness: 'ready',
  },
  {
    id: 'pb-3',
    name: '海巡 168',
    lat: 31.45,
    lng: 121.62,
    heading: 210,
    type: '快速反应船',
    speed: 25.0,
    destination: '南槽',
    status: 'normal',
    mmsi: '413000168',
    callsign: 'B1168',
    crew: 4,
    fuel: 64,
    readiness: 'busy',
  },
];
