/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 应急处置数据层 - 漂移预测、搜救方案、多源险情关联
 * 对应需求文档第3章：应急处置需求 (Emergency Response)
 */

// ============================================================
// 3.1 数字化MRCC多源险情关联
// ============================================================

export type IncidentSource = 'vhf' | 'ais' | 'radar' | 'cctv' | 'report' | 'satellite';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentType = 'collision' | 'grounding' | 'fire' | 'sinking' | 'man_overboard' | 'oil_spill' | 'machinery_failure' | 'drift';

export interface IncidentReport {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  source: IncidentSource;
  timestamp: string;
  position: [number, number];
  vesselName?: string;
  mmsi?: string;
  relatedIncidents: string[];
  confidence: number;
  verified: boolean;
}

export interface CorrelatedIncidentGroup {
  groupId: string;
  primaryIncident: IncidentReport;
  relatedIncidents: IncidentReport[];
  correlationScore: number;
  aiSummary: string;
  recommendedAction: string;
}

export const MOCK_INCIDENTS: IncidentReport[] = [
  {
    id: 'inc-001',
    type: 'machinery_failure',
    severity: 'high',
    title: '主机故障 - 失控漂流',
    description: '"永安海68"报告主机突然停车，船舶失控漂流中，当前位于吴淞口主航道北侧',
    source: 'vhf',
    timestamp: '2026-05-26 09:15:32',
    position: [31.362, 121.628],
    vesselName: '永安海68',
    mmsi: '413000068',
    relatedIncidents: ['inc-002', 'inc-003'],
    confidence: 98,
    verified: true,
  },
  {
    id: 'inc-002',
    type: 'drift',
    severity: 'high',
    title: 'AIS异常 - 航速骤降',
    description: 'AIS检测到"永安海68"航速从12节骤降至0.2节，航向不稳定，疑似失控',
    source: 'ais',
    timestamp: '2026-05-26 09:15:28',
    position: [31.362, 121.628],
    vesselName: '永安海68',
    mmsi: '413000068',
    relatedIncidents: ['inc-001'],
    confidence: 95,
    verified: true,
  },
  {
    id: 'inc-003',
    type: 'drift',
    severity: 'medium',
    title: '雷达异常轨迹',
    description: '雷达跟踪显示目标偏离航道，运动轨迹不规则',
    source: 'radar',
    timestamp: '2026-05-26 09:15:45',
    position: [31.363, 121.627],
    vesselName: '永安海68',
    mmsi: '413000068',
    relatedIncidents: ['inc-001', 'inc-002'],
    confidence: 88,
    verified: true,
  },
  {
    id: 'inc-004',
    type: 'collision',
    severity: 'critical',
    title: '碰撞风险预警',
    description: '漂流船"永安海68"与下行船"江海通12"存在碰撞风险，CPA=0.08nm，TCPA=8min',
    source: 'ais',
    timestamp: '2026-05-26 09:16:10',
    position: [31.364, 121.626],
    vesselName: '江海通12',
    mmsi: '413000012',
    relatedIncidents: ['inc-001'],
    confidence: 92,
    verified: false,
  },
];

export const MOCK_CORRELATED_GROUPS: CorrelatedIncidentGroup[] = [
  {
    groupId: 'grp-001',
    primaryIncident: MOCK_INCIDENTS[0],
    relatedIncidents: [MOCK_INCIDENTS[1], MOCK_INCIDENTS[2], MOCK_INCIDENTS[3]],
    correlationScore: 96.5,
    aiSummary: 'AI关联分析：VHF报告、AIS异常、雷达轨迹三源数据高度一致，确认"永安海68"主机故障失控漂流。当前漂流方向威胁主航道下行船舶安全，已触发碰撞风险预警。',
    recommendedAction: '立即启动应急响应：1) VHF广播航行警告 2) 派遣最近拖轮前往控制 3) 通知下行船舶避让 4) 启动漂移预测模型',
  },
];

// ============================================================
// 3.2 漂移预测模型
// ============================================================

export interface DriftPredictionPoint {
  time: string; // 相对时间 (min)
  position: [number, number];
  confidence: number; // 置信度百分比
  speed: number; // 漂移速度 (kn)
  heading: number; // 漂移方向 (度)
}

export interface DriftPrediction {
  id: string;
  vesselName: string;
  startPosition: [number, number];
  startTime: string;
  windSpeed: number; // m/s
  windDirection: number; // 度
  currentSpeed: number; // kn
  currentDirection: number; // 度
  vesselDraft: number; // 吃水 (m)
  vesselDisplacement: number; // 排水量 (吨)
  predictedPath: DriftPredictionPoint[];
  uncertaintyRadius: number[]; // 每个时间点的不确定性半径 (nm)
  podArea: [number, number][]; // 概率分布区域 (PoD polygon)
  modelType: 'leeway' | 'monte_carlo' | 'hybrid';
  lastUpdated: string;
}

export const MOCK_DRIFT_PREDICTION: DriftPrediction = {
  id: 'drift-001',
  vesselName: '永安海68',
  startPosition: [31.362, 121.628],
  startTime: '2026-05-26 09:15',
  windSpeed: 8.5,
  windDirection: 45, // NE
  currentSpeed: 1.2,
  currentDirection: 180, // S
  vesselDraft: 8.5,
  vesselDisplacement: 15000,
  predictedPath: [
    { time: '0', position: [31.362, 121.628], confidence: 100, speed: 0.2, heading: 200 },
    { time: '10', position: [31.360, 121.627], confidence: 95, speed: 0.8, heading: 205 },
    { time: '20', position: [31.357, 121.625], confidence: 88, speed: 1.1, heading: 210 },
    { time: '30', position: [31.354, 121.623], confidence: 82, speed: 1.3, heading: 215 },
    { time: '45', position: [31.349, 121.620], confidence: 75, speed: 1.4, heading: 218 },
    { time: '60', position: [31.344, 121.617], confidence: 68, speed: 1.5, heading: 220 },
    { time: '90', position: [31.335, 121.612], confidence: 55, speed: 1.5, heading: 222 },
    { time: '120', position: [31.326, 121.607], confidence: 42, speed: 1.4, heading: 225 },
  ],
  uncertaintyRadius: [0, 0.05, 0.12, 0.2, 0.35, 0.5, 0.8, 1.2],
  podArea: [
    [31.370, 121.635],
    [31.365, 121.640],
    [31.355, 121.635],
    [31.340, 121.625],
    [31.320, 121.600],
    [31.325, 121.595],
    [31.345, 121.610],
    [31.358, 121.620],
  ],
  modelType: 'hybrid',
  lastUpdated: '2026-05-26 09:16:30',
};

// ============================================================
// 3.3 搜救方案智能生成
// ============================================================

export type SearchPatternType = 'expanding_square' | 'sector' | 'parallel_track' | 'creeping_line';
export type RescueResourceType = 'patrol_vessel' | 'tugboat' | 'helicopter' | 'lifeboat' | 'diving_team';
export type RescuePhase = 'alert' | 'uncertainty' | 'distress' | 'sar_operation' | 'resolved';

export interface RescueResource {
  id: string;
  type: RescueResourceType;
  name: string;
  position: [number, number];
  eta: number; // 分钟
  capability: string;
  status: 'dispatched' | 'en_route' | 'on_scene' | 'standby';
}

export interface SearchArea {
  id: string;
  pattern: SearchPatternType;
  center: [number, number];
  radius: number; // nm
  assignedTo: string;
  coverage: number; // 百分比
  priority: number;
}

export interface RescuePlan {
  id: string;
  incidentId: string;
  phase: RescuePhase;
  title: string;
  generatedAt: string;
  aiConfidence: number;
  summary: string;
  actions: RescueAction[];
  resources: RescueResource[];
  searchAreas: SearchArea[];
  communicationPlan: CommunicationStep[];
  estimatedResolutionTime: number; // 分钟
  weatherWindow: string;
}

export interface RescueAction {
  id: string;
  priority: number;
  action: string;
  responsible: string;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CommunicationStep {
  channel: string;
  target: string;
  message: string;
  priority: 'immediate' | 'urgent' | 'routine';
}

export const MOCK_RESCUE_PLAN: RescuePlan = {
  id: 'plan-001',
  incidentId: 'grp-001',
  phase: 'distress',
  title: '永安海68主机故障应急救援方案',
  generatedAt: '2026-05-26 09:17:00',
  aiConfidence: 94.2,
  summary: 'AI综合分析：船舶主机故障导致失控漂流，当前风流条件下预计30分钟内漂入主航道中心，存在碰撞和搁浅双重风险。建议立即派遣拖轮控制船位，同时广播航行警告并疏导周边船舶。',
  actions: [
    { id: 'act-1', priority: 1, action: 'VHF Ch16 广播航行警告，通知所有船舶避让', responsible: 'VTS值班员', deadline: '立即', status: 'completed' },
    { id: 'act-2', priority: 2, action: '派遣"沪港拖01"前往控制漂流船位', responsible: '拖轮调度', deadline: '5分钟内', status: 'in_progress' },
    { id: 'act-3', priority: 3, action: '通知"江海通12"立即右转避让，保持安全距离', responsible: 'VTS值班员', deadline: '立即', status: 'completed' },
    { id: 'act-4', priority: 4, action: '启动漂移预测模型，持续更新预测轨迹', responsible: 'AI系统', deadline: '持续', status: 'in_progress' },
    { id: 'act-5', priority: 5, action: '通知海事局应急中心，准备升级响应等级', responsible: '值班主任', deadline: '10分钟内', status: 'pending' },
    { id: 'act-6', priority: 6, action: '协调引航站暂停该区域引航作业', responsible: '引航协调', deadline: '15分钟内', status: 'pending' },
  ],
  resources: [
    { id: 'res-1', type: 'tugboat', name: '沪港拖01', position: [31.355, 121.620], eta: 8, capability: '4000HP 全回转拖轮', status: 'en_route' },
    { id: 'res-2', type: 'patrol_vessel', name: '海巡01', position: [31.348, 121.635], eta: 12, capability: '巡逻警戒/交通管制', status: 'dispatched' },
    { id: 'res-3', type: 'tugboat', name: '沪港拖03', position: [31.370, 121.645], eta: 15, capability: '3200HP 备用拖轮', status: 'standby' },
    { id: 'res-4', type: 'helicopter', name: '救助直升机B-7136', position: [31.380, 121.680], eta: 20, capability: '空中侦察/人员转运', status: 'standby' },
  ],
  searchAreas: [
    { id: 'sa-1', pattern: 'sector', center: [31.362, 121.628], radius: 1.5, assignedTo: '海巡01', coverage: 0, priority: 1 },
  ],
  communicationPlan: [
    { channel: 'VHF Ch16', target: '所有船舶', message: '航行警告：吴淞口主航道北侧有失控船舶漂流，请所有船舶注意避让', priority: 'immediate' },
    { channel: 'VHF Ch14', target: '江海通12', message: '立即右转至航向090，保持与漂流船距离不少于0.5nm', priority: 'immediate' },
    { channel: '电话', target: '拖轮调度中心', message: '请"沪港拖01"立即前往31°21.7\'N 121°37.7\'E控制漂流船', priority: 'urgent' },
    { channel: 'VHF Ch08', target: '引航站', message: '暂停吴淞口区域引航作业，等待进一步通知', priority: 'urgent' },
  ],
  estimatedResolutionTime: 45,
  weatherWindow: '当前风力NE 8.5m/s，预计2小时后增强至12m/s，建议在风力增强前完成拖带作业',
};

// ============================================================
// 应急统计数据
// ============================================================

export interface EmergencyStats {
  avgResponseTime: number; // 秒
  incidentCorrelationAccuracy: number; // 百分比
  driftPredictionAccuracy: number; // 百分比
  rescuePlanGenerationTime: number; // 秒
  activeIncidents: number;
  resolvedToday: number;
}

export const EMERGENCY_STATS: EmergencyStats = {
  avgResponseTime: 45,
  incidentCorrelationAccuracy: 96.5,
  driftPredictionAccuracy: 92.8,
  rescuePlanGenerationTime: 3.2,
  activeIncidents: 2,
  resolvedToday: 5,
};
