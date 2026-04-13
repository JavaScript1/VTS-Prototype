export type SidebarTab = 'ship' | 'vhf' | 'intent' | 'warning' | 'anchorage' | 'risk';

export interface VHFMessage {
  id: string;
  sessionId: string;
  sessionIntent?: string;
  sessionType?: 'intent' | 'alert';
  sender: string;
  content: string;
  time: string;
  date: string;
  duration: string;
  isVTS: boolean;
}

export interface Alert {
  id: string;
  ship: string;
  shipType: string;
  mmsi: string;
  callsign: string;
  destination: string;
  cargo: string;
  riskScore: number;
  length: string;
  width: string;
  draft: string;
  speed: string;
  type: string;
  summary: string;
  time: string;
  coords: [number, number];
  level: 'emergency' | 'alarm' | 'warning' | 'caution';
  timeline: {
    time: string;
    event: string;
    type: 'info' | 'warning' | 'risk';
  }[];
}
