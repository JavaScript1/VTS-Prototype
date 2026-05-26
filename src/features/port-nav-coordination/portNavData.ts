/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 港航协同数据层 - ETA预测、舱单解析、协同排班
 * 对应需求文档第2章：港航协同需求 (Port & Shipping Collaboration)
 */

// ============================================================
// 2.1 数字化舱单多模态解析与申报
// ============================================================

export type ManifestStatus = 'pending' | 'parsing' | 'parsed' | 'verified' | 'error';
export type ManifestSource = 'email' | 'fax' | 'pdf' | 'api';

export interface ManifestItem {
  id: string;
  shipName: string;
  callSign: string;
  imo: string;
  eta: string;
  source: ManifestSource;
  status: ManifestStatus;
  confidence: number; // OCR解析置信度 (0-100)
  hazardousCargo: boolean;
  cargoSummary: string;
  parsedFields: ManifestParsedField[];
  submittedAt: string;
  parsedAt?: string;
}

export interface ManifestParsedField {
  fieldName: string;
  value: string;
  confidence: number;
  source: 'ocr' | 'nlp' | 'manual';
}

export const MOCK_MANIFESTS: ManifestItem[] = [
  {
    id: 'mf-001',
    shipName: '中远海运/V2026',
    callSign: 'VRGT5',
    imo: '9876543',
    eta: '2026-05-26 20:00',
    source: 'pdf',
    status: 'verified',
    confidence: 98.2,
    hazardousCargo: false,
    cargoSummary: '集装箱 2,400 TEU (日用品、电子产品)',
    parsedFields: [
      { fieldName: '船名', value: '中远海运/V2026', confidence: 99.5, source: 'ocr' },
      { fieldName: '呼号', value: 'VRGT5', confidence: 99.1, source: 'ocr' },
      { fieldName: 'IMO编号', value: '9876543', confidence: 98.8, source: 'ocr' },
      { fieldName: 'ETA', value: '2026-05-26 20:00', confidence: 97.5, source: 'nlp' },
      { fieldName: '危险货物', value: '无', confidence: 99.0, source: 'ocr' },
      { fieldName: '载货量', value: '2,400 TEU', confidence: 96.8, source: 'ocr' },
    ],
    submittedAt: '2026-05-25 14:30',
    parsedAt: '2026-05-25 14:30:04',
  },
  {
    id: 'mf-002',
    shipName: 'EVER GLORY',
    callSign: 'BKFR2',
    imo: '9234567',
    eta: '2026-05-26 08:00',
    source: 'fax',
    status: 'parsed',
    confidence: 94.6,
    hazardousCargo: true,
    cargoSummary: 'LPG 液化石油气 12,000 m³',
    parsedFields: [
      { fieldName: '船名', value: 'EVER GLORY', confidence: 96.2, source: 'ocr' },
      { fieldName: '呼号', value: 'BKFR2', confidence: 93.1, source: 'ocr' },
      { fieldName: 'IMO编号', value: '9234567', confidence: 97.8, source: 'ocr' },
      { fieldName: 'ETA', value: '2026-05-26 08:00', confidence: 91.5, source: 'nlp' },
      { fieldName: '危险货物', value: 'LPG Class 2.1', confidence: 95.0, source: 'ocr' },
      { fieldName: '载货量', value: '12,000 m³', confidence: 94.2, source: 'ocr' },
    ],
    submittedAt: '2026-05-25 09:15',
    parsedAt: '2026-05-25 09:15:06',
  },
  {
    id: 'mf-003',
    shipName: '永发589',
    callSign: 'BSFG6',
    imo: '8765432',
    eta: '2026-05-26 14:00',
    source: 'email',
    status: 'pending',
    confidence: 0,
    hazardousCargo: false,
    cargoSummary: '散货 (煤炭) 25,000 吨',
    parsedFields: [],
    submittedAt: '2026-05-26 06:45',
  },
];

// ============================================================
// 2.2 动态ETA高精度预测与协同排班
// ============================================================

export type ETAPredictionStatus = 'on_time' | 'early' | 'delayed' | 'critical_delay';

export interface ETAPrediction {
  id: string;
  shipName: string;
  mmsi: string;
  originalETA: string;
  predictedETA: string;
  deviationMinutes: number; // 正数=延误，负数=提前
  status: ETAPredictionStatus;
  confidence: number;
  distanceToPort: number; // 海里
  currentSpeed: number; // 节
  weatherImpact: string;
  currentImpact: string;
  congestionIndex: number; // 0-100
  factors: ETAPredictionFactor[];
}

export interface ETAPredictionFactor {
  name: string;
  impact: number; // 分钟，正数=延误
  description: string;
}

export const MOCK_ETA_PREDICTIONS: ETAPrediction[] = [
  {
    id: 'eta-001',
    shipName: '中远海运/V2026',
    mmsi: '413000102',
    originalETA: '2026-05-26 18:00',
    predictedETA: '2026-05-26 20:15',
    deviationMinutes: 135,
    status: 'critical_delay',
    confidence: 94.2,
    distanceToPort: 42,
    currentSpeed: 11.2,
    weatherImpact: '逆风 NE 15kn，浪高 1.8m',
    currentImpact: '顺流 +0.5kn',
    congestionIndex: 72,
    factors: [
      { name: '气象影响', impact: 45, description: '东北风15节，浪高1.8m导致航速下降' },
      { name: '航道拥堵', impact: 60, description: '吴淞口主航道当前拥堵指数72%' },
      { name: '潮汐窗口', impact: 30, description: '需等待下一个高潮窗口通过浅水段' },
    ],
  },
  {
    id: 'eta-002',
    shipName: 'EVER GLORY',
    mmsi: '413000201',
    originalETA: '2026-05-26 08:00',
    predictedETA: '2026-05-26 07:45',
    deviationMinutes: -15,
    status: 'early',
    confidence: 96.8,
    distanceToPort: 18,
    currentSpeed: 14.5,
    weatherImpact: '顺风 SW 8kn',
    currentImpact: '顺流 +1.2kn',
    congestionIndex: 35,
    factors: [
      { name: '气象助力', impact: -10, description: '西南风8节，顺风助航' },
      { name: '流场助力', impact: -5, description: '涨潮顺流+1.2节' },
    ],
  },
  {
    id: 'eta-003',
    shipName: '永发589',
    mmsi: '413000005',
    originalETA: '2026-05-26 14:00',
    predictedETA: '2026-05-26 14:08',
    deviationMinutes: 8,
    status: 'on_time',
    confidence: 92.1,
    distanceToPort: 28,
    currentSpeed: 9.8,
    weatherImpact: '微风 E 5kn',
    currentImpact: '平流',
    congestionIndex: 45,
    factors: [
      { name: '航道通行', impact: 8, description: '前方有大型船舶通过，需短暂减速避让' },
    ],
  },
  {
    id: 'eta-004',
    shipName: 'MAERSK SEALAND',
    mmsi: '413000301',
    originalETA: '2026-05-26 22:30',
    predictedETA: '2026-05-26 23:10',
    deviationMinutes: 40,
    status: 'delayed',
    confidence: 88.5,
    distanceToPort: 65,
    currentSpeed: 12.8,
    weatherImpact: '侧风 N 12kn',
    currentImpact: '逆流 -0.8kn',
    congestionIndex: 55,
    factors: [
      { name: '逆流影响', impact: 20, description: '退潮逆流-0.8节' },
      { name: '侧风修正', impact: 15, description: '北风12节需持续修正航向' },
      { name: '航道调度', impact: 5, description: '需配合VTS指令调整进港顺序' },
    ],
  },
];

// ============================================================
// 协同排班 - "船-港-引-拖"四方联动
// ============================================================

export type ScheduleResourceType = 'pilot' | 'tugboat' | 'berth' | 'crane';
export type ScheduleStatus = 'confirmed' | 'tentative' | 'conflict' | 'auto_optimized';

export interface CollaborativeScheduleItem {
  id: string;
  shipName: string;
  predictedETA: string;
  pilotBoardingTime: string;
  tugReadyTime: string;
  berthAvailableTime: string;
  craneReadyTime: string;
  status: ScheduleStatus;
  optimizationNote?: string;
  waitTimeSaved: number; // 分钟
  resources: ScheduleResource[];
}

export interface ScheduleResource {
  type: ScheduleResourceType;
  name: string;
  status: 'assigned' | 'standby' | 'en_route' | 'unavailable';
  eta?: string;
}

export const MOCK_COLLABORATIVE_SCHEDULE: CollaborativeScheduleItem[] = [
  {
    id: 'sched-001',
    shipName: 'EVER GLORY',
    predictedETA: '2026-05-26 07:45',
    pilotBoardingTime: '07:30',
    tugReadyTime: '07:20',
    berthAvailableTime: '07:00',
    craneReadyTime: '07:45',
    status: 'confirmed',
    optimizationNote: 'AI已自动匹配最优引航员与拖轮组合，预计节省等待时间45分钟',
    waitTimeSaved: 45,
    resources: [
      { type: 'pilot', name: '引航员 张明', status: 'en_route', eta: '07:25' },
      { type: 'tugboat', name: '沪港拖01', status: 'assigned', eta: '07:18' },
      { type: 'tugboat', name: '沪港拖03', status: 'assigned', eta: '07:20' },
      { type: 'berth', name: '吴淞码头 1号泊位', status: 'standby' },
      { type: 'crane', name: 'QC-01/02/03', status: 'standby' },
    ],
  },
  {
    id: 'sched-002',
    shipName: '永发589',
    predictedETA: '2026-05-26 14:08',
    pilotBoardingTime: '13:50',
    tugReadyTime: '13:45',
    berthAvailableTime: '14:00',
    craneReadyTime: '14:15',
    status: 'confirmed',
    optimizationNote: '系统自动协调引航站排班，实现分钟级精准匹配',
    waitTimeSaved: 30,
    resources: [
      { type: 'pilot', name: '引航员 李伟', status: 'standby' },
      { type: 'tugboat', name: '沪港拖05', status: 'standby' },
      { type: 'berth', name: '外高桥码头 3号泊位', status: 'standby' },
      { type: 'crane', name: 'QC-05/06', status: 'standby' },
    ],
  },
  {
    id: 'sched-003',
    shipName: '中远海运/V2026',
    predictedETA: '2026-05-26 20:15',
    pilotBoardingTime: '20:00',
    tugReadyTime: '19:50',
    berthAvailableTime: '20:00',
    craneReadyTime: '20:30',
    status: 'auto_optimized',
    optimizationNote: '因延误触发自动重排：已插入替代船A/B填补空窗，原船延后靠泊，泊位利用率从45%提升至92%',
    waitTimeSaved: 120,
    resources: [
      { type: 'pilot', name: '引航员 王强', status: 'standby' },
      { type: 'tugboat', name: '沪港拖02', status: 'standby' },
      { type: 'tugboat', name: '沪港拖04', status: 'standby' },
      { type: 'berth', name: '吴淞码头 1号泊位', status: 'standby' },
      { type: 'crane', name: 'QC-01/02/03', status: 'standby' },
    ],
  },
  {
    id: 'sched-004',
    shipName: 'MAERSK SEALAND',
    predictedETA: '2026-05-26 23:10',
    pilotBoardingTime: '22:55',
    tugReadyTime: '22:45',
    berthAvailableTime: '23:00',
    craneReadyTime: '23:15',
    status: 'tentative',
    optimizationNote: '夜间靠泊，已预排夜班引航员与拖轮值班组',
    waitTimeSaved: 20,
    resources: [
      { type: 'pilot', name: '引航员 陈刚 (夜班)', status: 'standby' },
      { type: 'tugboat', name: '沪港拖06', status: 'standby' },
      { type: 'berth', name: '洋山港 2号泊位', status: 'standby' },
      { type: 'crane', name: 'QC-08/09', status: 'standby' },
    ],
  },
];

// ============================================================
// 港航协同统计数据
// ============================================================

export interface PortEfficiencyStats {
  avgWaitTimeReduction: number; // 百分比
  berthUtilization: number; // 百分比
  etaPredictionAccuracy: number; // 百分比
  manifestAutoParseRate: number; // 百分比
  dailyVesselThroughput: number;
  avgTurnaroundHours: number;
}

export const PORT_EFFICIENCY_STATS: PortEfficiencyStats = {
  avgWaitTimeReduction: 32,
  berthUtilization: 92,
  etaPredictionAccuracy: 94.5,
  manifestAutoParseRate: 96.8,
  dailyVesselThroughput: 48,
  avgTurnaroundHours: 18.5,
};
