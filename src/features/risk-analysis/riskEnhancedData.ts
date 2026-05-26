/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 风险态势增强数据层 - 风险场模型、HICOMM看板、异常行为识别
 * 对应需求文档第4章：风险态势需求 (Risk Situation Awareness)
 */

// ============================================================
// 4.1 主动风险场模型
// ============================================================

export type RiskFieldLevel = 'extreme' | 'high' | 'moderate' | 'low' | 'safe';
export type RiskFactorType = 'traffic_density' | 'weather' | 'visibility' | 'channel_width' | 'vessel_behavior' | 'historical';

export interface RiskFieldCell {
  id: string;
  center: [number, number];
  level: RiskFieldLevel;
  score: number; // 0-100
  factors: RiskFactor[];
  predictedTrend: 'rising' | 'stable' | 'falling';
  timeToNextLevel: number; // 分钟
}

export interface RiskFactor {
  type: RiskFactorType;
  weight: number; // 0-1
  value: number; // 0-100
  description: string;
}

export interface RiskFieldSnapshot {
  timestamp: string;
  overallRiskIndex: number; // 0-100
  cells: RiskFieldCell[];
  hotspots: RiskHotspot[];
  blackSegments: BlackSegment[];
  blackPeriods: BlackPeriod[];
}

export interface RiskHotspot {
  id: string;
  name: string;
  center: [number, number];
  radius: number; // nm
  riskScore: number;
  trend: 'rising' | 'stable' | 'falling';
  topRisk: string;
  vesselCount: number;
}

export interface BlackSegment {
  id: string;
  name: string;
  path: [number, number][];
  riskScore: number;
  incidentHistory: number; // 历史事故数
  description: string;
}

export interface BlackPeriod {
  id: string;
  timeRange: string;
  riskMultiplier: number;
  reason: string;
}

export const MOCK_RISK_FIELD: RiskFieldSnapshot = {
  timestamp: '2026-05-26 09:30:00',
  overallRiskIndex: 68,
  cells: [
    {
      id: 'cell-001',
      center: [31.365, 121.620],
      level: 'high',
      score: 82,
      factors: [
        { type: 'traffic_density', weight: 0.35, value: 90, description: '当前航道船舶密度极高' },
        { type: 'weather', weight: 0.2, value: 65, description: 'NE风15节，能见度良好' },
        { type: 'vessel_behavior', weight: 0.25, value: 85, description: '检测到2艘船舶偏航' },
        { type: 'historical', weight: 0.2, value: 78, description: '该区域历史事故率偏高' },
      ],
      predictedTrend: 'rising',
      timeToNextLevel: 15,
    },
    {
      id: 'cell-002',
      center: [31.355, 121.635],
      level: 'moderate',
      score: 55,
      factors: [
        { type: 'traffic_density', weight: 0.35, value: 60, description: '正常通行密度' },
        { type: 'channel_width', weight: 0.25, value: 70, description: '航道窄段，操纵空间有限' },
        { type: 'weather', weight: 0.2, value: 40, description: '天气条件良好' },
        { type: 'historical', weight: 0.2, value: 45, description: '历史事故率中等' },
      ],
      predictedTrend: 'stable',
      timeToNextLevel: 45,
    },
    {
      id: 'cell-003',
      center: [31.345, 121.650],
      level: 'low',
      score: 28,
      factors: [
        { type: 'traffic_density', weight: 0.35, value: 25, description: '船舶稀少' },
        { type: 'weather', weight: 0.2, value: 30, description: '天气良好' },
        { type: 'visibility', weight: 0.25, value: 20, description: '能见度>10nm' },
        { type: 'historical', weight: 0.2, value: 35, description: '历史安全记录良好' },
      ],
      predictedTrend: 'stable',
      timeToNextLevel: 120,
    },
  ],
  hotspots: [
    {
      id: 'hs-001',
      name: '吴淞口交汇区',
      center: [31.365, 121.620],
      radius: 1.5,
      riskScore: 82,
      trend: 'rising',
      topRisk: '船舶交汇密度过高，存在碰撞风险',
      vesselCount: 18,
    },
    {
      id: 'hs-002',
      name: '北槽深水航道入口',
      center: [31.340, 121.680],
      radius: 1.0,
      riskScore: 65,
      trend: 'stable',
      topRisk: '大型船舶通行，小型船需注意避让',
      vesselCount: 8,
    },
    {
      id: 'hs-003',
      name: '外高桥港区',
      center: [31.355, 121.590],
      radius: 0.8,
      riskScore: 45,
      trend: 'falling',
      topRisk: '靠离泊作业频繁',
      vesselCount: 12,
    },
  ],
  blackSegments: [
    {
      id: 'bs-001',
      name: '吴淞口主航道S弯段',
      path: [[31.370, 121.615], [31.365, 121.620], [31.360, 121.625], [31.355, 121.630]],
      riskScore: 88,
      incidentHistory: 23,
      description: '航道弯曲，视线受阻，历史碰撞事故高发区',
    },
    {
      id: 'bs-002',
      name: '宝山钢铁码头前沿',
      path: [[31.380, 121.600], [31.375, 121.605], [31.370, 121.610]],
      riskScore: 72,
      incidentHistory: 15,
      description: '大型散货船靠离泊频繁，横流影响明显',
    },
  ],
  blackPeriods: [
    { id: 'bp-001', timeRange: '06:00-08:00', riskMultiplier: 1.8, reason: '早高峰进港潮，船舶密度骤增' },
    { id: 'bp-002', timeRange: '17:00-19:00', riskMultiplier: 1.6, reason: '晚高峰出港潮叠加潮汐转换' },
    { id: 'bp-003', timeRange: '02:00-04:00', riskMultiplier: 1.4, reason: '夜间值班薄弱时段，能见度下降' },
  ],
};

// ============================================================
// 4.2 HICOMM指挥中心看板
// ============================================================

export interface HicommMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  status: 'good' | 'warning' | 'critical';
}

export interface HicommAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  area: string;
}

export interface HicommDashboard {
  metrics: HicommMetric[];
  alerts: HicommAlert[];
  vesselTrafficSummary: {
    inbound: number;
    outbound: number;
    anchored: number;
    berthed: number;
    total: number;
  };
  resourceStatus: {
    patrolVessels: { total: number; available: number };
    tugboats: { total: number; available: number };
    pilots: { total: number; available: number };
    vhfChannels: { total: number; active: number };
  };
}

export const MOCK_HICOMM_DASHBOARD: HicommDashboard = {
  metrics: [
    { id: 'hm-001', label: '辖区实时风险指数', value: 68, unit: '/100', trend: 'up', trendValue: '+5', status: 'warning' },
    { id: 'hm-002', label: '在港船舶总数', value: 342, trend: 'up', trendValue: '+12', status: 'good' },
    { id: 'hm-003', label: '活跃预警数', value: 7, trend: 'up', trendValue: '+2', status: 'warning' },
    { id: 'hm-004', label: '平均响应时间', value: '45s', trend: 'down', trendValue: '-8s', status: 'good' },
    { id: 'hm-005', label: '今日通行量', value: 186, unit: '艘次', trend: 'stable', trendValue: '0', status: 'good' },
    { id: 'hm-006', label: 'AI干预次数', value: 23, unit: '次', trend: 'up', trendValue: '+5', status: 'good' },
  ],
  alerts: [
    { id: 'ha-001', level: 'critical', title: '碰撞风险预警', description: '吴淞口交汇区检测到高密度船舶交汇，CPA<0.2nm事件2起', timestamp: '09:28', acknowledged: false, area: '吴淞口' },
    { id: 'ha-002', level: 'warning', title: '偏航预警', description: '"永安海68"偏离推荐航道0.3nm，已自动发送纠偏建议', timestamp: '09:25', acknowledged: true, area: '主航道' },
    { id: 'ha-003', level: 'warning', title: '气象预警', description: '预计2小时后风力增强至7级，建议限制小型船舶通行', timestamp: '09:20', acknowledged: false, area: '全辖区' },
    { id: 'ha-004', level: 'info', title: '引航调度提醒', description: '10:00有3艘大型船舶集中进港，引航员资源紧张', timestamp: '09:15', acknowledged: true, area: '引航区' },
  ],
  vesselTrafficSummary: {
    inbound: 28,
    outbound: 22,
    anchored: 45,
    berthed: 186,
    total: 342,
  },
  resourceStatus: {
    patrolVessels: { total: 8, available: 5 },
    tugboats: { total: 12, available: 7 },
    pilots: { total: 24, available: 8 },
    vhfChannels: { total: 16, active: 12 },
  },
};

// ============================================================
// 4.3 异常行为AI识别
// ============================================================

export type AnomalyType = 'deviation' | 'speed_anomaly' | 'ais_manipulation' | 'loitering' | 'dark_vessel' | 'unsafe_overtaking';
export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface VesselAnomaly {
  id: string;
  vesselName: string;
  mmsi: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  position: [number, number];
  detectedAt: string;
  description: string;
  aiConfidence: number;
  suggestedAction: string;
  evidence: AnomalyEvidence[];
}

export interface AnomalyEvidence {
  source: string;
  description: string;
  timestamp: string;
}

export const MOCK_ANOMALIES: VesselAnomaly[] = [
  {
    id: 'anom-001',
    vesselName: '永安海68',
    mmsi: '413000068',
    type: 'deviation',
    severity: 'high',
    position: [31.363, 121.627],
    detectedAt: '2026-05-26 09:15',
    description: '偏离推荐航道0.3nm，航向不稳定，疑似失控',
    aiConfidence: 96,
    suggestedAction: 'VHF呼叫确认船舶状态，准备应急响应',
    evidence: [
      { source: 'AIS', description: '航速从12kn骤降至0.2kn', timestamp: '09:15:28' },
      { source: '雷达', description: '轨迹偏离航道中心线300m', timestamp: '09:15:45' },
      { source: 'AI模型', description: '行为模式匹配"主机故障"概率96%', timestamp: '09:15:50' },
    ],
  },
  {
    id: 'anom-002',
    vesselName: '闽通达7',
    mmsi: '413000077',
    type: 'speed_anomaly',
    severity: 'medium',
    position: [31.358, 121.640],
    detectedAt: '2026-05-26 09:22',
    description: '在限速区域超速航行，当前14.2kn (限速10kn)',
    aiConfidence: 99,
    suggestedAction: 'VHF警告减速，记录违章信息',
    evidence: [
      { source: 'AIS', description: '对地速度14.2kn，超出限速4.2kn', timestamp: '09:22:10' },
      { source: '雷达', description: '确认目标速度与AIS一致', timestamp: '09:22:15' },
    ],
  },
  {
    id: 'anom-003',
    vesselName: '不明目标',
    mmsi: '',
    type: 'dark_vessel',
    severity: 'high',
    position: [31.350, 121.660],
    detectedAt: '2026-05-26 09:18',
    description: '雷达检测到目标但无AIS信号，疑似关闭AIS的"暗船"',
    aiConfidence: 88,
    suggestedAction: '派遣海巡艇前往核实身份，启动CCTV跟踪',
    evidence: [
      { source: '雷达', description: '持续跟踪目标15分钟，无AIS匹配', timestamp: '09:18:00' },
      { source: 'AI模型', description: '目标运动特征匹配"小型渔船"概率72%', timestamp: '09:18:30' },
    ],
  },
  {
    id: 'anom-004',
    vesselName: '江海通12',
    mmsi: '413000012',
    type: 'unsafe_overtaking',
    severity: 'medium',
    position: [31.362, 121.632],
    detectedAt: '2026-05-26 09:25',
    description: '在窄段航道内进行不安全追越，与被追越船横距<100m',
    aiConfidence: 92,
    suggestedAction: 'VHF警告保持安全距离，记录违章',
    evidence: [
      { source: 'AIS', description: '两船横距仅85m，远低于安全标准', timestamp: '09:25:05' },
      { source: 'AI模型', description: '追越行为风险评分: 78/100', timestamp: '09:25:10' },
    ],
  },
];
