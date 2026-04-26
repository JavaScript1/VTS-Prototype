/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  englishName?: string;
  shipType: string;
  mmsi: string;
  callsign?: string;
  flag?: string;
  agent?: string;
  anchorTime?: string;
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

export interface ShipPosition {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  name: string;
  englishName?: string;
  mmsi: string;
  callsign?: string;
  type: string;
  speed: number;
  destination: string;
  status: 'normal' | 'warning' | 'risk' | 'caution';
}

export interface ShipSearchResult {
  id: string;
  name: string;
  mmsi: string;
  type: string;
  destination: string;
  status: ShipPosition['status'];
}

export interface VhfShipInfo {
  name: string;
  englishName?: string;
  shipType?: string;
  mmsi?: string;
  callSign?: string;
  imo?: string;
  flag?: string;
  destination?: string;
  lastPort?: string;
  speed?: string;
  hdg?: string;
  length?: string;
  width?: string;
  draft?: string;
  cargoType?: string;
}

export interface VhfSessionSummary {
  sessionId: string;
  shipName: string;
  operatorName: string;
  intent: string;
  sessionType: 'intent' | 'alert';
  messages: VHFMessage[];
  cards: any[]; // ConversationCard from vhfConversation.ts
  shipInfo?: VhfShipInfo;
  startedAt: number;
  latestAt: number;
  latestTime: string;
}

export interface HomeShipTrackPoint {
  id: string;
  label: string;
  time: string;
  coords: [number, number];
  note: string;
  kind: 'history' | 'current';
}

export interface HomeShipBusinessInfo {
  plannedBerth: string;
  movement: string;
  plannedTime: string;
  previousPort: string;
  nextPort: string;
  applicant: string;
  operator: string;
  teu: string;
  dischargeVolume: string;
  eta: string;
  departureTime: string;
}

export interface HomeShipCargoInfo {
  cargoName: string;
  cargoAmount: string;
  localHazardAmount: string;
  actualHazardAmount: string;
}

export interface HomeShipDynamicEvent {
  id: string;
  time: string;
  text: string;
  type: 'navigation' | 'safety' | 'business' | 'communication';
  level: 'info' | 'warning' | 'risk';
  trackPointId: string | null;
}

export interface HomeShipDetail {
  id: string;
  name: string;
  displayName: string;
  mmsi: string;
  type: string;
  status: ShipPosition['status'];
  destination: string;
  speed: number;
  heading: number;
  lat: number;
  lng: number;
  length: string;
  width: string;
  draft: string;
  cargo: string;
  callsign: string;
  imo: string;
  grossTonnage: string;
  statusBanner: string;
  route: {
    past: string;
    current: string;
    destination: string;
  };
  intentSummary: string;
  vhfSummary: string;
  riskSummary: string;
  businessInfo: HomeShipBusinessInfo;
  cargoInfo: HomeShipCargoInfo;
  dynamicEvents: HomeShipDynamicEvent[];
  track: HomeShipTrackPoint[];
}

export interface IntentStep {
  label: string;
  status: 'completed' | 'active' | 'pending';
  action: string;
}

export interface IntentTimelineEvent {
  time: string;
  tag: string;
  content: string;
  status: 'active' | 'completed' | 'initial';
}

export interface IntentRisk {
  level: '注意' | '警告' | '警报' | '紧急';
  text: string;
  action: string;
  counterparty?: string;
  location?: string;
  timeToEncounter?: string;
}

export interface IntentSituation {
  sog: string;
  hdg: string;
  cpa: string;
  tcpa: string;
  xtd: string;
  rot: string;
  trend: string;
}

export interface IntentRecommendation {
  action: string;
  priority: '立即' | '优先' | '关注';
}

export interface IntentItem {
  ship: string;
  englishName?: string;
  mmsi?: string;
  callSign?: string;
  imo?: string;
  flag?: string;
  agent?: string;
  anchorTime?: string;
  shipType: string;
  cargoType: string;
  length: string;
  width: string;
  draft: string;
  speed: string;
  past: string;
  current: string;
  destination: string;
  confidence: number;
  time: string;
  occurrenceTime: string;
  details: string;
  intentSummary: string;
  intentConfidence: number;
  intentEta: string;
  risks: IntentRisk[];
  situation: IntentSituation;
  recommendation: IntentRecommendation;
  path: IntentStep[];
  timeline: IntentTimelineEvent[];
}

// From mockData.ts
export type Coordinates = [number, number];

export interface MockArea {
  id: string;
  name: string;
  time: string;
  type: string;
  status: string;
  fields: Record<string, string>;
  rules?: string;
}

export type MockAreaMap = Record<string, MockArea[]>;

export interface RiskTimelineEvent {
  time: string;
  event: string;
  type: 'info' | 'warning' | 'risk';
}

export interface RiskSnapshot {
  image: string;
  location: string;
  actualSpeed: number;
  speedLimit: number;
}

export interface MockRiskStat {
  id: string;
  name: string;
  mmsi: string;
  type: string;
  length: number;
  width: number;
  cargo: string;
  draft: number;
  risk: string;
  speed: number;
  heading: number;
  wind: string;
  wave: string;
  visibility: string;
  time: string;
  coords: Coordinates;
  snapshot: RiskSnapshot;
  timeline: RiskTimelineEvent[];
  callsign?: string;
  destination?: string;
  riskScore?: number;
}

export interface MockIntentStat {
  id: string;
  name: string;
  mmsi: string;
  type: string;
  intent: string;
  confidence: number;
  time: string;
  status: string;
  cargo: string;
}

export interface VesselDialogueEntry {
  sender: string;
  content: string;
  time: string;
}

export interface VesselDynamicEvent {
  time: string;
  type: string;
  label: string;
  desc: string;
  status: string;
  coords?: Coordinates;
  dialogue?: VesselDialogueEntry[];
}

export interface MockVesselDynamic {
  id: string;
  name: string;
  mmsi: string;
  type: string;
  origin: string;
  status: string;
  startTime: string;
  endTime: string;
  destination: string;
  events: VesselDynamicEvent[];
}
