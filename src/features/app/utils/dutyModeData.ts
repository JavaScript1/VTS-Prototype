/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 三种值班模式增强数据层
 * 对应需求文档第1章：三种交互/值班模式
 * - 常规模式（人工主导）
 * - 辅助模式（AI辅助+人工决策）
 * - 自动模式（AI全自动+人工监督）
 */

// ============================================================
// 1.1 VHF智能助理 - 语音识别与意图理解
// ============================================================

export type VhfIntentType = 'berthing' | 'departure' | 'anchoring' | 'transit' | 'emergency' | 'query' | 'report';

export interface VhfRecognitionResult {
  id: string;
  timestamp: string;
  channel: number;
  rawTranscript: string; // 原始语音转文字
  language: 'zh' | 'en';
  vesselName?: string;
  mmsi?: string;
  intent: VhfIntentType;
  confidence: number;
  extractedParams: Record<string, string>;
  suggestedResponse?: string;
  autoApproved?: boolean;
}

export const VHF_INTENT_CONFIG: Record<VhfIntentType, { label: string; color: string }> = {
  berthing: { label: '靠泊申请', color: 'blue' },
  departure: { label: '离泊申请', color: 'indigo' },
  anchoring: { label: '锚泊申请', color: 'violet' },
  transit: { label: '通过申请', color: 'emerald' },
  emergency: { label: '紧急通信', color: 'rose' },
  query: { label: '信息查询', color: 'amber' },
  report: { label: '动态报告', color: 'slate' },
};

export const MOCK_VHF_RECOGNITIONS: VhfRecognitionResult[] = [
  {
    id: 'vhf-001',
    timestamp: '09:22:15',
    channel: 14,
    rawTranscript: '上海VTS上海VTS，这里是COSCO SHIPPING TAURUS，我船MMSI 413456789，请求靠泊外高桥二期5号泊位，预计30分钟后到达。',
    language: 'zh',
    vesselName: 'COSCO SHIPPING TAURUS',
    mmsi: '413456789',
    intent: 'berthing',
    confidence: 97.5,
    extractedParams: {
      destination: '外高桥二期5号泊位',
      eta: '30分钟',
      action: '靠泊',
    },
    suggestedResponse: 'COSCO SHIPPING TAURUS，上海VTS收到。批准您靠泊外高桥二期5号泊位，请保持VHF Ch14守听，注意避让出港船舶。',
    autoApproved: false,
  },
  {
    id: 'vhf-002',
    timestamp: '09:18:30',
    channel: 14,
    rawTranscript: 'Shanghai VTS, this is MAERSK SEALAND, MMSI 219012345, requesting permission to depart from Yangshan Terminal berth 7.',
    language: 'en',
    vesselName: 'MAERSK SEALAND',
    mmsi: '219012345',
    intent: 'departure',
    confidence: 95.2,
    extractedParams: {
      origin: 'Yangshan Terminal berth 7',
      action: 'departure',
    },
    suggestedResponse: 'MAERSK SEALAND, Shanghai VTS. Permission granted to depart berth 7. Maintain VHF Ch14 watch. Report when passing reporting line.',
    autoApproved: true,
  },
  {
    id: 'vhf-003',
    timestamp: '09:15:00',
    channel: 16,
    rawTranscript: 'MAYDAY MAYDAY MAYDAY，这里是浙海运28号，我船在31度22分北121度38分东位置发生碰撞，船体进水，请求紧急救援！',
    language: 'zh',
    vesselName: '浙海运28号',
    intent: 'emergency',
    confidence: 99.8,
    extractedParams: {
      position: '31°22\'N 121°38\'E',
      situation: '碰撞/进水',
      urgency: 'MAYDAY',
    },
    suggestedResponse: '浙海运28号，上海VTS收到您的遇险呼叫。已启动应急响应程序。请报告船上人数和伤亡情况。搜救力量正在调配中。',
    autoApproved: false,
  },
  {
    id: 'vhf-004',
    timestamp: '09:12:45',
    channel: 14,
    rawTranscript: '上海VTS，闽通达7号报告，我船已通过吴淞口报告线，航向185，航速10节，目的港洋山港。',
    language: 'zh',
    vesselName: '闽通达7号',
    mmsi: '413000077',
    intent: 'report',
    confidence: 96.0,
    extractedParams: {
      position: '吴淞口报告线',
      course: '185°',
      speed: '10节',
      destination: '洋山港',
    },
    suggestedResponse: '闽通达7号，上海VTS收到。航行注意安全，保持守听。',
    autoApproved: true,
  },
];

// ============================================================
// 1.2 自动审批策略
// ============================================================

export type ApprovalRuleType = 'auto_approve' | 'auto_reject' | 'require_review';

export interface AutoApprovalRule {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  action: ApprovalRuleType;
  priority: number;
  enabled: boolean;
  triggerCount: number; // 今日触发次数
}

export const MOCK_APPROVAL_RULES: AutoApprovalRule[] = [
  {
    id: 'rule-001',
    name: '常规靠泊自动批准',
    description: '对于信用良好、无违章记录的船舶，在非高峰时段的常规靠泊申请自动批准',
    conditions: ['船舶信用评分 ≥ 85', '非高峰时段(22:00-06:00)', '目标泊位空闲', '无近30天违章记录'],
    action: 'auto_approve',
    priority: 1,
    enabled: true,
    triggerCount: 8,
  },
  {
    id: 'rule-002',
    name: '危险品船舶人工审核',
    description: '所有危险品运输船舶的进出港申请必须人工审核',
    conditions: ['船舶类型=危险品运输', '或载有IMO危险品'],
    action: 'require_review',
    priority: 10,
    enabled: true,
    triggerCount: 2,
  },
  {
    id: 'rule-003',
    name: '恶劣天气自动拒绝',
    description: '当风力≥8级或能见度<500m时，自动拒绝所有进出港申请',
    conditions: ['风力 ≥ 8级', '或能见度 < 500m', '或浪高 > 3m'],
    action: 'auto_reject',
    priority: 100,
    enabled: true,
    triggerCount: 0,
  },
  {
    id: 'rule-004',
    name: '锚泊申请快速批准',
    description: '指定锚地有空位时，锚泊申请自动批准并分配锚位',
    conditions: ['目标锚地有空位', '船舶吃水满足锚地要求', '无交通冲突'],
    action: 'auto_approve',
    priority: 2,
    enabled: true,
    triggerCount: 5,
  },
  {
    id: 'rule-005',
    name: '超大型船舶人工审核',
    description: 'LOA≥300m或吃水≥14m的超大型船舶必须人工审核',
    conditions: ['LOA ≥ 300m', '或吃水 ≥ 14m', '或载重吨 ≥ 100000DWT'],
    action: 'require_review',
    priority: 8,
    enabled: true,
    triggerCount: 1,
  },
];

// ============================================================
// 1.3 模式切换状态
// ============================================================

export interface DutyModeStatus {
  mode: 'normal' | 'smart-duty' | 'auto';
  activeSince: string;
  operator: string;
  aiLoad: number; // AI负载百分比
  humanOverrides: number; // 人工干预次数
  autoApprovals: number; // 自动审批次数
  pendingReviews: number; // 待审核数
  vhfProcessed: number; // VHF处理数
}

export const MOCK_DUTY_STATUS: DutyModeStatus = {
  mode: 'auto',
  activeSince: '08:00:00',
  operator: '张值班长',
  aiLoad: 78,
  humanOverrides: 3,
  autoApprovals: 15,
  pendingReviews: 2,
  vhfProcessed: 42,
};
