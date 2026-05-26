/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 执法辅助数据层 - 违章AI识别、证据链、跨部门派单、卷宗生成
 * 对应需求文档第5章：执法辅助需求 (Law Enforcement)
 */

// ============================================================
// 5.1 违章AI识别引擎
// ============================================================

export type ViolationType = 'speeding' | 'wrong_channel' | 'no_report' | 'ais_off' | 'unsafe_overtaking' | 'anchor_violation' | 'pollution' | 'overload';
export type ViolationStatus = 'detected' | 'confirmed' | 'dispatched' | 'closed';

export interface ViolationRecord {
  id: string;
  type: ViolationType;
  vesselName: string;
  mmsi: string;
  imo?: string;
  position: [number, number];
  detectedAt: string;
  status: ViolationStatus;
  aiConfidence: number;
  description: string;
  regulation: string; // 违反的法规条款
  evidence: EvidenceItem[];
  penalty?: string;
}

export interface EvidenceItem {
  id: string;
  type: 'ais_track' | 'radar_track' | 'vhf_recording' | 'cctv_snapshot' | 'satellite_image' | 'witness' | 'log_entry';
  source: string;
  timestamp: string;
  description: string;
  hash?: string; // 区块链存证哈希
  verified: boolean;
}

export const VIOLATION_TYPE_CONFIG: Record<ViolationType, { label: string; color: string }> = {
  speeding: { label: '超速航行', color: 'amber' },
  wrong_channel: { label: '违规占道', color: 'orange' },
  no_report: { label: '未按规定报告', color: 'blue' },
  ais_off: { label: 'AIS关闭', color: 'slate' },
  unsafe_overtaking: { label: '不安全追越', color: 'red' },
  anchor_violation: { label: '违规锚泊', color: 'violet' },
  pollution: { label: '排污违规', color: 'emerald' },
  overload: { label: '超载', color: 'rose' },
};

export const MOCK_VIOLATIONS: ViolationRecord[] = [
  {
    id: 'vio-001',
    type: 'speeding',
    vesselName: '闽通达7',
    mmsi: '413000077',
    imo: '9876543',
    position: [31.358, 121.640],
    detectedAt: '2026-05-26 09:22:10',
    status: 'confirmed',
    aiConfidence: 99.2,
    description: '在限速10节区域以14.2节航行，超速42%',
    regulation: '《内河交通安全管理条例》第二十一条',
    evidence: [
      { id: 'ev-001', type: 'ais_track', source: 'AIS基站', timestamp: '09:22:10', description: 'AIS记录SOG=14.2kn，COG=185°', hash: '0x7a3f...e2c1', verified: true },
      { id: 'ev-002', type: 'radar_track', source: '雷达站#3', timestamp: '09:22:15', description: '雷达确认目标速度14.1kn', hash: '0x8b4e...f3d2', verified: true },
      { id: 'ev-003', type: 'cctv_snapshot', source: 'CCTV-吴淞口#2', timestamp: '09:22:20', description: '视频截图确认船舶身份', verified: true },
    ],
    penalty: '警告+罚款2000元',
  },
  {
    id: 'vio-002',
    type: 'ais_off',
    vesselName: '不明渔船',
    mmsi: '',
    position: [31.350, 121.660],
    detectedAt: '2026-05-26 09:18:00',
    status: 'dispatched',
    aiConfidence: 88.5,
    description: '雷达持续跟踪15分钟无AIS信号，疑似故意关闭AIS设备',
    regulation: '《船舶自动识别系统管理规定》第八条',
    evidence: [
      { id: 'ev-004', type: 'radar_track', source: '雷达站#2', timestamp: '09:03:00-09:18:00', description: '连续15分钟雷达跟踪，无AIS匹配', hash: '0x9c5f...a4e3', verified: true },
      { id: 'ev-005', type: 'cctv_snapshot', source: 'CCTV-外高桥#1', timestamp: '09:15:30', description: '远距离截图，船型特征匹配小型渔船', verified: false },
    ],
  },
  {
    id: 'vio-003',
    type: 'unsafe_overtaking',
    vesselName: '江海通12',
    mmsi: '413000012',
    imo: '9654321',
    position: [31.362, 121.632],
    detectedAt: '2026-05-26 09:25:05',
    status: 'detected',
    aiConfidence: 92.0,
    description: '在窄段航道内追越，与被追越船横距仅85m，远低于安全标准200m',
    regulation: '《中华人民共和国内河避碰规则》第十五条',
    evidence: [
      { id: 'ev-006', type: 'ais_track', source: 'AIS基站', timestamp: '09:25:05', description: '两船AIS数据计算横距85m', hash: '0xab6g...b5f4', verified: true },
      { id: 'ev-007', type: 'radar_track', source: '雷达站#3', timestamp: '09:25:08', description: '雷达确认两目标最近距离约80m', verified: true },
    ],
  },
  {
    id: 'vio-004',
    type: 'no_report',
    vesselName: '浙海运15',
    mmsi: '413000015',
    position: [31.370, 121.615],
    detectedAt: '2026-05-26 08:45:00',
    status: 'closed',
    aiConfidence: 95.0,
    description: '进入VTS报告区域后未按规定在VHF Ch14进行动态报告',
    regulation: '《船舶交通管理系统安全监督管理规则》第十二条',
    evidence: [
      { id: 'ev-008', type: 'ais_track', source: 'AIS基站', timestamp: '08:45:00', description: 'AIS显示船舶已进入报告线', verified: true },
      { id: 'ev-009', type: 'vhf_recording', source: 'VHF Ch14录音', timestamp: '08:45:00-09:00:00', description: '15分钟内未收到该船报告', hash: '0xcd8h...c6g5', verified: true },
    ],
    penalty: '警告',
  },
];

// ============================================================
// 5.2 跨部门协同派单
// ============================================================

export type Department = 'vts' | 'maritime_police' | 'coast_guard' | 'port_authority' | 'environmental' | 'customs' | 'fishery';
export type DispatchStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';

export interface DispatchOrder {
  id: string;
  violationId: string;
  fromDepartment: Department;
  toDepartment: Department;
  title: string;
  description: string;
  priority: 'urgent' | 'normal' | 'low';
  status: DispatchStatus;
  createdAt: string;
  deadline: string;
  assignee?: string;
  notes?: string;
}

export const DEPARTMENT_CONFIG: Record<Department, { label: string; color: string }> = {
  vts: { label: 'VTS中心', color: 'blue' },
  maritime_police: { label: '海事执法', color: 'indigo' },
  coast_guard: { label: '海警', color: 'slate' },
  port_authority: { label: '港务局', color: 'emerald' },
  environmental: { label: '环保部门', color: 'green' },
  customs: { label: '海关', color: 'amber' },
  fishery: { label: '渔政', color: 'cyan' },
};

export const MOCK_DISPATCHES: DispatchOrder[] = [
  {
    id: 'disp-001',
    violationId: 'vio-001',
    fromDepartment: 'vts',
    toDepartment: 'maritime_police',
    title: '超速违章处置 - 闽通达7',
    description: '请海事执法大队对"闽通达7"超速42%违章行为进行现场执法，AI已锁定证据链。',
    priority: 'normal',
    status: 'accepted',
    createdAt: '2026-05-26 09:23:00',
    deadline: '2026-05-26 12:00:00',
    assignee: '张执法员',
  },
  {
    id: 'disp-002',
    violationId: 'vio-002',
    fromDepartment: 'vts',
    toDepartment: 'coast_guard',
    title: '暗船核查 - 不明渔船',
    description: '请海警前往核实不明目标身份，该船疑似故意关闭AIS设备逃避监管。',
    priority: 'urgent',
    status: 'in_progress',
    createdAt: '2026-05-26 09:19:00',
    deadline: '2026-05-26 10:00:00',
    assignee: '海警巡逻艇#2',
    notes: '已出动，预计15分钟到达',
  },
  {
    id: 'disp-003',
    violationId: 'vio-003',
    fromDepartment: 'vts',
    toDepartment: 'maritime_police',
    title: '不安全追越处置 - 江海通12',
    description: '请对"江海通12"不安全追越行为进行调查取证。',
    priority: 'normal',
    status: 'pending',
    createdAt: '2026-05-26 09:26:00',
    deadline: '2026-05-26 14:00:00',
  },
];

// ============================================================
// 5.3 智能卷宗生成
// ============================================================

export interface CaseFile {
  id: string;
  violationId: string;
  title: string;
  generatedAt: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  sections: CaseFileSection[];
  totalPages: number;
  aiGeneratedRatio: number; // AI生成内容占比
}

export interface CaseFileSection {
  id: string;
  title: string;
  content: string;
  pageCount: number;
  aiGenerated: boolean;
}

export const MOCK_CASE_FILES: CaseFile[] = [
  {
    id: 'case-001',
    violationId: 'vio-001',
    title: '"闽通达7"超速航行行政处罚卷宗',
    generatedAt: '2026-05-26 09:30:00',
    status: 'review',
    sections: [
      { id: 'sec-001', title: '案件基本信息', content: '当事人：闽通达7 (MMSI: 413000077)\n违法时间：2026年5月26日09:22\n违法地点：吴淞口主航道 (31.358°N, 121.640°E)\n违法事实：在限速10节区域以14.2节航行', pageCount: 1, aiGenerated: true },
      { id: 'sec-002', title: '证据材料清单', content: '1. AIS航迹数据 (已区块链存证)\n2. 雷达跟踪记录\n3. CCTV视频截图\n4. VTS值班日志摘录', pageCount: 2, aiGenerated: true },
      { id: 'sec-003', title: '法律依据', content: '《内河交通安全管理条例》第二十一条：船舶在内河航行，应当遵守航速规定。\n《中华人民共和国海上交通安全法》第九十条：违反限速规定的，处警告或罚款。', pageCount: 1, aiGenerated: true },
      { id: 'sec-004', title: '处罚建议', content: '根据违法事实和情节，建议给予警告并处罚款人民币2000元。', pageCount: 1, aiGenerated: true },
      { id: 'sec-005', title: '当事人陈述', content: '（待补充）', pageCount: 1, aiGenerated: false },
    ],
    totalPages: 6,
    aiGeneratedRatio: 83,
  },
  {
    id: 'case-002',
    violationId: 'vio-004',
    title: '"浙海运15"未按规定报告行政处罚卷宗',
    generatedAt: '2026-05-26 09:10:00',
    status: 'approved',
    sections: [
      { id: 'sec-006', title: '案件基本信息', content: '当事人：浙海运15 (MMSI: 413000015)\n违法事实：进入VTS报告区域后未按规定报告', pageCount: 1, aiGenerated: true },
      { id: 'sec-007', title: '证据材料清单', content: '1. AIS航迹数据\n2. VHF录音记录', pageCount: 1, aiGenerated: true },
      { id: 'sec-008', title: '处罚决定', content: '给予警告处罚', pageCount: 1, aiGenerated: true },
    ],
    totalPages: 3,
    aiGeneratedRatio: 90,
  },
];

// ============================================================
// 执法统计
// ============================================================

export interface LawEnforcementStats {
  todayViolations: number;
  aiDetectionRate: number; // 百分比
  avgProcessingTime: number; // 分钟
  crossDeptDispatch: number;
  caseFileGenerated: number;
  evidenceChainLocked: number;
}

export const LAW_ENFORCEMENT_STATS: LawEnforcementStats = {
  todayViolations: 12,
  aiDetectionRate: 94.5,
  avgProcessingTime: 8.5,
  crossDeptDispatch: 6,
  caseFileGenerated: 4,
  evidenceChainLocked: 18,
};
