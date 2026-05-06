/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  type Coordinates,
  type MockArea,
  type MockAreaMap,
  type MockRiskStat,
  type MockIntentStat,
  type MockVesselDynamic,
  type ShipPosition,
  type VHFMessage,
  type Alert,
  type IntentItem,
  type HomeShipDetail,
  type HomeShipTrackPoint,
  type HomeShipDynamicEvent,
  type VhfShipInfo,
} from './types';
import {
  HOME_MAP_LAT_OFFSET,
  HOME_MAP_LNG_OFFSET,
  shiftHomeMapCoordinates,
} from './features/map/constants';
import {
  type ConversationCard,
  type VhfMessage as AggregatedVhfMessage,
} from './utils/vhfConversation';

export const AREA_CATEGORIES = ['值班区域', '作业与停泊设施', '航道航行设施', '水域管控'] as const;

export const MOCK_RISK_STATS: MockRiskStat[] = [
  {
    id: '1',
    name: '远洋 123',
    mmsi: '413000001',
    callsign: 'YY123',
    type: '货轮',
    length: 190,
    width: 32,
    cargo: '铁矿石',
    draft: 11.2,
    risk: '超速航行',
    speed: 15.4,
    heading: 125,
    wind: '4级',
    wave: '0.8m',
    visibility: '8km',
    time: '2026-03-17 09:15:22',
    coords: [31.35, 121.55],
    destination: '上海',
    riskScore: 88,
    snapshot: {
      image: 'https://picsum.photos/seed/vessel1/400/225',
      location: '吴淞口警戒区 A12 浮标附近',
      actualSpeed: 14.2,
      speedLimit: 12.0,
    },
    timeline: [
      {time: '09:00:15', event: '进入吴淞口警戒区', type: 'info'},
      {time: '09:05:42', event: '航速持续上升 (12.5kn -> 14.2kn)', type: 'warning'},
      {time: '09:12:10', event: '接近航道限速区域', type: 'info'},
      {time: '09:15:22', event: '触发[超速航行]风险预警', type: 'risk'},
    ],
  },
  {
    id: '2',
    name: '海丰 77',
    mmsi: '413000002',
    callsign: 'HF77',
    type: '集装箱船',
    length: 145,
    width: 24,
    cargo: '日用品',
    draft: 8.5,
    risk: '偏离航道',
    speed: 12.1,
    heading: 210,
    wind: '5级',
    wave: '1.2m',
    visibility: '5km',
    time: '2026-03-17 10:02:45',
    coords: [31.38, 121.58],
    destination: '宁波',
    riskScore: 75,
    snapshot: {
      image: 'https://picsum.photos/seed/vessel2/400/225',
      location: '圆圆沙 12 号浮标南侧',
      actualSpeed: 12.1,
      speedLimit: 12.0,
    },
    timeline: [
      {time: '09:45:00', event: '通过圆圆沙报告线', type: 'info'},
      {time: '09:55:30', event: '航向发生异常偏转', type: 'warning'},
      {time: '10:02:45', event: '偏离主航道中心线 > 50m', type: 'risk'},
    ],
  },
  {
    id: '3',
    name: '振华 15',
    mmsi: '413000003',
    type: '工程船',
    length: 220,
    width: 45,
    cargo: '重型设备',
    draft: 9.8,
    risk: '非法锚泊',
    speed: 0.1,
    heading: 45,
    wind: '3级',
    wave: '0.5m',
    visibility: '10km',
    time: '2026-03-17 11:30:10',
    coords: [31.42, 121.62],
    snapshot: {
      image: 'https://picsum.photos/seed/vessel3/400/225',
      location: '非锚泊作业区 B5 区域',
      actualSpeed: 0.1,
      speedLimit: 0.5,
    },
    timeline: [
      {time: '11:10:00', event: '进入非锚泊作业区', type: 'info'},
      {time: '11:20:15', event: '航速降至 0.5kn 以下', type: 'warning'},
      {time: '11:30:10', event: '检测到锚泊行为', type: 'risk'},
    ],
  },
  {
    id: '4',
    name: '中海 99',
    mmsi: '413000004',
    type: '油轮',
    length: 250,
    width: 48,
    cargo: '原油',
    draft: 14.5,
    risk: '碰撞风险',
    speed: 10.5,
    heading: 180,
    wind: '6级',
    wave: '2.0m',
    visibility: '3km',
    time: '2026-03-17 12:45:33',
    coords: [31.45, 121.65],
    snapshot: {
      image: 'https://picsum.photos/seed/vessel4/400/225',
      location: '长江口深水航道 D3 浮标',
      actualSpeed: 10.5,
      speedLimit: 12.0,
    },
    timeline: [
      {time: '12:30:00', event: '能见度降至 3km 以下', type: 'warning'},
      {time: '12:40:15', event: '与前方船舶 DCPA < 0.2nm', type: 'warning'},
      {time: '12:45:33', event: '触发碰撞高风险预警', type: 'risk'},
    ],
  },
  {
    id: '5',
    name: '顺风 6',
    mmsi: '413000005',
    type: '散货船',
    length: 110,
    width: 18,
    cargo: '煤炭',
    draft: 6.2,
    risk: '异常停泊',
    speed: 0.0,
    heading: 90,
    wind: '4级',
    wave: '0.7m',
    visibility: '7km',
    time: '2026-03-17 13:20:15',
    coords: [31.48, 121.68],
    snapshot: {
      image: 'https://picsum.photos/seed/vessel5/400/225',
      location: '航道边缘水域 E1 浮标附近',
      actualSpeed: 0.0,
      speedLimit: 12.0,
    },
    timeline: [
      {time: '13:05:00', event: '进入航道边缘水域', type: 'info'},
      {time: '13:15:30', event: '主机疑似发生故障停航', type: 'warning'},
      {time: '13:20:15', event: '航道内异常停泊', type: 'risk'},
    ],
  },
];

export const MOCK_INTENT_STATS: MockIntentStat[] = [
  {id: '1', name: '远洋 99', mmsi: '413000099', type: '散货船', intent: '起锚', confidence: 92, time: '2026-03-19 11:20', status: '批准', cargo: '煤炭'},
  {id: '2', name: '海丰 77', mmsi: '413000002', type: '集装箱船', intent: '划江', confidence: 88, time: '2026-03-19 10:45', status: '回复等待', cargo: '日用品'},
  {id: '3', name: '中海 12', mmsi: '413000012', type: '油轮', intent: '靠泊', confidence: 95, time: '2026-03-19 09:30', status: '主动询问', cargo: '原油'},
  {id: '4', name: '东方 55', mmsi: '413000055', type: '客船', intent: '离泊', confidence: 85, time: '2026-03-19 08:15', status: '拒绝', cargo: '乘客'},
  {id: '5', name: '远洋 123', mmsi: '413000001', type: '货轮', intent: '进报告线', confidence: 90, time: '2026-03-19 07:50', status: '紧急干预', cargo: '铁矿石'},
];

export const AREA_TYPE_MAPPING: Record<string, Record<string, string[]>> = {
  值班区域: {
    值班台: [],
  },
  作业与停泊设施: {
    码头: ['靠泊等级', '靠泊尺度', '船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深'],
    泊位: ['靠泊等级', '靠泊尺度', '船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深'],
    锚地: ['靠泊等级', '靠泊尺度', '船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深'],
  },
  航道航行设施: {
    主航道: ['船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速', '航道方向'],
    辅助航道: ['船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速', '航道方向'],
    小型船舶航道: ['船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速', '航道方向'],
    航道分割线: [],
    报告线: [],
    导堤: ['船舶类型限制', '船舶尺度限制', '最大水深', '最小水深'],
    物标: [],
  },
  水域管控: {
    警戒区: ['船舶类型限制', '船舶尺度限制', '最高限速', '最低限速'],
    禁锚区: ['船舶类型限制', '船舶尺度限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    禁航区: ['船舶类型限制', '船舶尺度限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    临时管控区: ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速', '有效期'],
    '边坡100米水域': ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    浅水区: ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    引航作业区: ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速'],
    调头区: ['船舶类型限制', '船舶尺度限制', '船舶吨位限制', '最大水深', '最小水深', '最高限速', '最低限速'],
  },
};

const createAreaTime = (offset: number) => {
  const base = new Date(Date.UTC(2026, 2, 5, 1, 0, 0));
  base.setUTCMinutes(base.getUTCMinutes() + offset * 7);
  return base.toISOString().slice(0, 19).replace('T', ' ');
};

const createArea = (
  id: string,
  name: string,
  type: string,
  fields: Record<string, string> = {},
  status = '正常',
  offset = 0,
): MockArea => ({
  id,
  name,
  time: createAreaTime(offset),
  type,
  status,
  fields,
});

const DUTY_AREAS: MockArea[] = [
  createArea('1', '外高桥值班台', '值班台', {}, '正常', 1),
  createArea('2', '黄浦江值班台', '值班台', {}, '正常', 2),
  createArea('3', '宝山值班台', '值班台', {}, '正常', 3),
  createArea('4', '长江口值班台', '值班台', {}, '正常', 4),
  createArea('5', '北槽值班台', '值班台', {}, '正常', 5),
  createArea('6', '南槽值班台', '值班台', {}, '正常', 6),
];

const FACILITY_CORE_AREAS: MockArea[] = [
  createArea('7', '机场建材码头', '码头', { 靠泊等级: '3万吨级', 最大水深: '11m', 最小水深: '8m' }, '正常', 7),
  createArea('8', '白龙港码头', '码头', { 靠泊等级: '5万吨级', 最大水深: '15m', 最小水深: '11m' }, '正常', 8),
  createArea('9', '黎明灰库码头', '码头', { 靠泊等级: '2万吨级', 最大水深: '9m', 最小水深: '7m' }, '正常', 9),
  createArea('facility-1', '浦航码头', '码头', { 靠泊等级: '5万吨级', 最大水深: '13m', 最小水深: '10m' }, '正常', 10),
  createArea('facility-2', '五号沟LNG码头', '码头', { 靠泊等级: '10万吨级', 最大水深: '17m', 最小水深: '13m' }, '正常', 11),
  createArea('facility-3', '良友码头', '码头', { 靠泊等级: '3万吨级', 最大水深: '10m', 最小水深: '8m' }, '正常', 12),
  createArea('facility-4', '极地码头', '码头', { 靠泊等级: '4万吨级', 最大水深: '12m', 最小水深: '9m' }, '正常', 13),
  createArea('facility-5', '五号沟海事公务码头', '码头', { 靠泊等级: '公务专用', 最大水深: '8m', 最小水深: '6m' }, '正常', 14),
  createArea('facility-6', '外六期海通码头', '码头', { 靠泊等级: '7万吨级', 最大水深: '15m', 最小水深: '12m' }, '正常', 15),
  createArea('facility-7', '外六期集装箱码头', '码头', { 靠泊等级: '10万吨级', 最大水深: '16m', 最小水深: '13m' }, '正常', 16),
];

const FACILITY_GENERATED_AREAS: MockArea[] = Array.from({ length: 385 }, (_, index) => {
  const seq = index + 1;
  const mod = seq % 3;

  if (mod === 0) {
    return createArea(
      `facility-g-${seq}`,
      `吴淞口${seq}号锚地`,
      '锚地',
      { 船舶吨位限制: `${5 + (seq % 8)}万吨`, 最大水深: `${10 + (seq % 9)}m`, 最小水深: `${6 + (seq % 4)}m` },
      '正常',
      17 + index,
    );
  }

  if (mod === 1) {
    return createArea(
      `facility-g-${seq}`,
      `外高桥${seq}号泊位`,
      '泊位',
      { 靠泊尺度: `${180 + (seq % 6) * 30}m`, 船舶类型限制: seq % 2 === 0 ? '集装箱船' : '散货船' },
      '正常',
      17 + index,
    );
  }

  return createArea(
    `facility-g-${seq}`,
    `罗泾${seq}号码头`,
    '码头',
    { 靠泊等级: `${2 + (seq % 6)}万吨级`, 最大水深: `${9 + (seq % 7)}m`, 最小水深: `${7 + (seq % 4)}m` },
    '正常',
    17 + index,
  );
});

const NAVIGATION_BASE_NAMES = ['101号灯浮', '103号灯浮', '106号灯浮'];
const NAVIGATION_EXTRA_NUMBERS = [
  107, 108, 110, 114, 121, 131, 133, 136, 140, 146, 150, 154, 158, 162, 166, 170, 176, 180, 184, 188,
  192, 196, 201, 205, 210, 214, 218, 222, 226, 230, 234, 238, 242, 246, 250, 254, 258, 262, 266, 270,
  274, 278, 282, 286, 290, 294, 298, 302, 306, 310, 314, 318, 322, 326, 330, 334, 338, 342, 346, 350,
  354, 358, 362, 366, 370, 374, 378, 382, 386, 390, 394, 398, 402, 406, 410, 414, 418, 422, 426, 430,
  434, 438, 442, 446, 450, 454, 458, 462, 466, 470, 474, 478, 482, 486, 490, 494, 498, 502, 506, 510,
  514, 518, 522, 526, 530, 534, 538, 542, 546, 550, 554, 558, 562, 566, 570, 574, 578, 582, 586, 590,
  594, 598, 602, 606, 610, 614, 618, 622, 626, 630, 634, 638, 642, 646, 650, 654, 658, 662, 666, 670,
  674, 678, 682, 686, 690, 694, 698, 702, 706, 710, 714, 718, 722, 726, 730, 734, 738, 742, 746, 750,
  754, 758, 762,
];

const NAVIGATION_AREAS: MockArea[] = [
  createArea('10', NAVIGATION_BASE_NAMES[0], '物标', {}, '正常', 500),
  createArea('11', NAVIGATION_BASE_NAMES[1], '物标', {}, '正常', 501),
  createArea('12', NAVIGATION_BASE_NAMES[2], '物标', {}, '正常', 502),
  ...NAVIGATION_EXTRA_NUMBERS.map((num, index) =>
    createArea(`navigation-${num}`, `${num}号灯浮`, '物标', {}, '正常', 503 + index),
  ),
];

const WATER_CONTROL_AREAS: MockArea[] = [
  createArea('13', '吴淞口警戒区', '警戒区', { 最高限速: '8节', 船舶类型限制: '危险品船除外' }, '正常', 900),
  createArea('14', '圆圆沙警戒区', '警戒区', { 最高限速: '8节', 船舶类型限制: '大型船舶重点监控' }, '正常', 901),
  createArea('15', '圆圆沙禁航区', '禁航区', { 最高限速: '0节' }, '正常', 902),
  createArea('water-1', '蕴藻浜警戒区', '警戒区', { 最高限速: '10节' }, '正常', 903),
  createArea('water-2', '禁航区', '禁航区', { 最高限速: '0节' }, '正常', 904),
  createArea('water-3', '吃水大于3米禁止进入', '浅水区', { 最大水深: '3m', 最小水深: '1.5m' }, '正常', 905),
  createArea('water-4', '吃水大于7米禁止进入', '浅水区', { 最大水深: '7m', 最小水深: '4m' }, '正常', 906),
  createArea('water-5', '长江上海段（1号）禁锚区', '禁锚区', { 最大水深: '25m' }, '正常', 907),
  createArea('water-6', '2号禁锚区', '禁锚区', { 最大水深: '22m' }, '正常', 908),
  createArea('water-7', '3号禁锚区', '禁锚区', { 最大水深: '20m' }, '正常', 909),
  createArea('water-8', '长江口临时管控区', '临时管控区', { 有效期: '2026-03-01 至 2026-12-31' }, '正常', 910),
  createArea('water-9', '青草沙取水口保护区', '引航作业区', { 最高限速: '6节' }, '正常', 911),
];

export const MOCK_AREAS: MockAreaMap = {
  值班区域: DUTY_AREAS,
  作业与停泊设施: [...FACILITY_CORE_AREAS, ...FACILITY_GENERATED_AREAS],
  航道航行设施: NAVIGATION_AREAS,
  水域管控: WATER_CONTROL_AREAS,
};

export const MOCK_VESSEL_DYNAMICS: MockVesselDynamic[] = [
  {
    id: 'vd1',
    name: '远洋99',
    mmsi: '413123456',
    type: '货轮',
    origin: '宁波',
    status: '正在作业',
    startTime: '2026-03-15 08:30',
    endTime: '',
    destination: '黄浦江',
    events: [
      {time: '08:30', type: 'action', label: '进入辖区', desc: '船舶进入吴淞口警戒区', status: 'completed', coords: [31.4, 121.5]},
      {
        time: '08:45',
        type: 'comm',
        label: '申请划江',
        desc: '向值班员申请由北向南划江',
        status: 'completed',
        coords: [31.38, 121.52],
        dialogue: [
          {sender: '远洋99', content: '吴淞VTS，远洋99申请由北向南划江。', time: '08:45:10'},
          {sender: '吴淞VTS', content: '远洋99，吴淞VTS，同意划江，请注意避让主航道进港船舶。', time: '08:45:30'},
        ],
      },
      {time: '08:50', type: 'action', label: '开始划江', desc: '开始穿越主航道', status: 'completed', coords: [31.37, 121.53]},
      {time: '09:10', type: 'risk', label: '违规行为', desc: '未按规定航路行驶，偏离航道0.2海里', status: 'warning', coords: [31.35, 121.55]},
      {time: '09:25', type: 'action', label: '抵达锚地', desc: '进入6号锚地等待潮汐', status: 'current', coords: [31.32, 121.58]},
      {time: '10:30', type: 'pending', label: '预计靠泊', desc: '预计前往粮油码头靠泊', status: 'pending'},
    ],
  },
  {
    id: 'vd2',
    name: '海丰国际',
    mmsi: '413789012',
    type: '集装箱船',
    origin: '釜山',
    status: '正在航行',
    startTime: '2026-03-15 09:00',
    endTime: '2026-03-15 11:30',
    destination: '外高桥码头',
    events: [
      {time: '09:00', type: 'action', label: '起锚', desc: '从圆圆沙锚地起锚', status: 'completed', coords: [31.3, 121.65]},
      {time: '09:15', type: 'comm', label: '报告动态', desc: '报告进入南槽航道', status: 'completed', coords: [31.28, 121.68]},
      {time: '09:40', type: 'action', label: '通过报告线', desc: '通过吴淞口报告线', status: 'completed', coords: [31.25, 121.72]},
      {time: '10:15', type: 'action', label: '接近码头', desc: '正在接近外高桥码头', status: 'current', coords: [31.22, 121.75]},
    ],
  },
  {
    id: 'vd3',
    name: '中远海运',
    mmsi: '413456789',
    type: '油轮',
    origin: '新加坡',
    status: '等待中',
    startTime: '2026-03-15 07:30',
    endTime: '',
    destination: '罗泾泊位',
    events: [
      {time: '07:30', type: 'action', label: '进入辖区', desc: '进入长江口区域', status: 'completed', coords: [31.5, 121.4]},
      {
        time: '08:00',
        type: 'comm',
        label: '申请靠泊',
        desc: '申请罗泾泊位靠泊',
        status: 'completed',
        coords: [31.48, 121.42],
        dialogue: [
          {sender: '中远海运', content: '吴淞中心，中远海运申请罗泾泊位靠泊。', time: '08:00:05'},
          {sender: '吴淞中心', content: '中远海运，收到，请在锚地等待进一步指令。', time: '08:00:25'},
        ],
      },
      {
        time: '08:10',
        type: 'comm',
        label: '指令接收',
        desc: '值班员指令：泊位占用，前往泊位外等待',
        status: 'completed',
        coords: [31.45, 121.45],
        dialogue: [
          {sender: '吴淞中心', content: '中远海运，罗泾泊位目前有船作业，请前往指定水域锚泊等待。', time: '08:10:15'},
          {sender: '中远海运', content: '收到，前往指定水域锚泊。', time: '08:10:40'},
        ],
      },
      {time: '08:30', type: 'action', label: '锚泊等待', desc: '在指定水域抛锚等待', status: 'current', coords: [31.42, 121.48]},
    ],
  },
];

// --- Added from AppView.tsx ---

export const SHIP_POSITIONS: ShipPosition[] = ([
  {id: 'ship-001', lat: 31.4382, lng: 121.5618, heading: 32, name: '远洋 123', englishName: 'OCEAN PIONEER 123', callsign: 'BARD1', mmsi: '413000001', type: '货轮', speed: 12.4, destination: '外高桥码头', status: 'normal'},
  {id: 'ship-002', lat: 31.4315, lng: 121.5742, heading: 218, name: '海丰 77', englishName: 'HAI FENG 77', callsign: 'VRGT5', mmsi: '413000002', type: '集装箱船', speed: 9.8, destination: '圆圆沙锚地', status: 'warning'},
  {id: 'ship-003', lat: 31.4236, lng: 121.5484, heading: 84, name: '振华 15', englishName: 'ZHEN HUA 15', callsign: 'BHKS3', mmsi: '413000003', type: '工程船', speed: 4.1, destination: '作业区 B5', status: 'caution'},
  {id: 'ship-004', lat: 31.4461, lng: 121.5865, heading: 305, name: '中海 99', englishName: 'COSCO 99', callsign: 'BUIO9', mmsi: '413000004', type: '油轮', speed: 11.7, destination: '长江口航道', status: 'warning'},
  {id: 'ship-005', lat: 31.4178, lng: 121.5341, heading: 146, name: '顺风 6', englishName: 'SHUN FENG 6', callsign: 'BSFG6', mmsi: '413000005', type: '散货船', speed: 6.3, destination: '吴淞口锚地', status: 'normal'},
  {id: 'ship-006', lat: 31.4544, lng: 121.5522, heading: 12, name: '东方 55', englishName: 'DONG FANG 55', callsign: 'BDOO5', mmsi: '413000055', type: '客船', speed: 14.2, destination: '黄浦江', status: 'normal'},
  {id: 'ship-007', lat: 31.4096, lng: 121.5828, heading: 262, name: '江海通 8', englishName: 'JIANG HAI TONG 8', callsign: 'BHT8', mmsi: '413000008', type: '散货船', speed: 7.1, destination: '宝山作业区', status: 'caution'},
  {id: 'ship-008', lat: 31.4408, lng: 121.5294, heading: 118, name: '新海安', englishName: 'XIN HAI AN', callsign: 'XHA10', mmsi: '413000010', type: '集装箱船', speed: 10.5, destination: '南槽航道', status: 'normal'},
  {id: 'ship-009', lat: 31.4289, lng: 121.5948, heading: 191, name: '星海', englishName: 'XING HAI', callsign: 'XH12', mmsi: '413000012', type: '油轮', speed: 5.9, destination: '1号禁锚区外侧', status: 'warning'},
  {id: 'ship-010', lat: 31.4612, lng: 121.5686, heading: 56, name: '蓝波', englishName: 'LAN BO', callsign: 'LB15', mmsi: '413000015', type: '拖船', speed: 8.4, destination: '吴淞口警戒区', status: 'normal'},
  {id: 'ship-011', lat: 31.4145, lng: 121.5634, heading: 332, name: '运兴 96', englishName: 'YUN XING 96', callsign: 'YX96', mmsi: '413000096', type: '货船', speed: 9.2, destination: '黄浦江', status: 'normal'},
  {id: 'ship-012', lat: 31.4347, lng: 121.5449, heading: 274, name: '远洋 99', englishName: 'OCEAN PIONEER 99', callsign: 'BYYP9', mmsi: '413000099', type: '散货船', speed: 13.1, destination: '6号锚地', status: 'caution'},
] satisfies ShipPosition[]).map((ship): ShipPosition => ({
  ...ship,
  lat: ship.lat + HOME_MAP_LAT_OFFSET,
  lng: ship.lng + HOME_MAP_LNG_OFFSET,
}));

export interface HomeMapOverlayBadge {
  id: string;
  label: string;
  kind: 'intent' | 'warning';
  position: [number, number];
  detail: string;
}

export const HOME_MAP_OVERLAY_BADGES: HomeMapOverlayBadge[] = ([
  {
    id: 'intent-anchor',
    label: '起锚',
    kind: 'intent',
    position: [31.4371, 121.5307],
    detail: '意图表达: 6 号锚地起锚后沿主航道进入下游通行序列。',
  },
  {
    id: 'warning-01',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4406, 121.5584],
    detail: '预警表达: 主航道上持续低速，已触发自动提醒。',
  },
  {
    id: 'warning-02',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4314, 121.5558],
    detail: '预警表达: 航道中心线附近滞航，建议值班持续跟踪。',
  },
  {
    id: 'warning-03',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4148, 121.5691],
    detail: '预警表达: 贴近码头前沿航道，低速停滞时间持续拉长。',
  },
  {
    id: 'warning-04',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4132, 121.5866],
    detail: '预警表达: 南侧航道边缘滞航，建议结合 VHF 进一步确认。',
  },
  {
    id: 'warning-05',
    label: '航道内滞航',
    kind: 'warning',
    position: [31.4097, 121.5989],
    detail: '预警表达: 航道末端持续低速，已进入低效通行观察名单。',
  },
] satisfies HomeMapOverlayBadge[]).map((badge): HomeMapOverlayBadge => ({
  ...badge,
  position: shiftHomeMapCoordinates(badge.position),
}));

export const MOCK_VHF_MESSAGES_RAW: VHFMessage[] = [
  { id: '1', sessionId: 's1', sessionIntent: '呼叫应答', sessionType: 'intent', sender: '运兴96', content: '吴淞控制中心[运兴96]。', time: '16:32:34', date: '2025-12-17', duration: '1.99s', isVTS: false },
  { id: '2', sessionId: 's1', sessionIntent: '呼叫应答', sessionType: 'intent', sender: '交管_127705', content: '请讲。', time: '16:32:35', date: '2025-12-17', duration: '0.58s', isVTS: true },
  { id: '3', sessionId: 's2', sessionIntent: '锚地咨询', sessionType: 'intent', sender: '易航158', content: '在9号锚地这个锚这个位置可以锚泊吧。', time: '16:32:39', date: '2025-12-17', duration: '2.69s', isVTS: false },
  { id: '4', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '永发589', content: '吴淞交管吴淞交管，[永发589]。', time: '16:32:46', date: '2025-12-17', duration: '2.45s', isVTS: false },
  { id: '5', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '永发589', content: '，[永发589]呃，粮油码头。', time: '16:32:51', date: '2025-12-17', duration: '2.84s', isVTS: false },
  { id: '6', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '永发589', content: '苏个角粮油码头出口出口准备在圆圆沙啊，由南向北穿越走和塘上水。', time: '16:32:57', date: '2025-12-17', duration: '5.43s', isVTS: false },
  { id: '7', sessionId: 's3', sessionIntent: '动态报备', sessionType: 'intent', sender: '交管_30736', content: '开车了，好安全报。', time: '16:32:59', date: '2025-12-17', duration: '1.72s', isVTS: true },
  { id: '8', sessionId: 's4', sessionIntent: '出港咨询', sessionType: 'intent', sender: 'spk_127707', content: '好的，那现在可以出港池吧。', time: '16:33:02', date: '2025-12-17', duration: '2.03s', isVTS: false },
  { id: '9', sessionId: 's4', sessionIntent: '出港咨询', sessionType: 'intent', sender: '交管_114824', content: '可以可以。', time: '16:33:05', date: '2025-12-17', duration: '0.93s', isVTS: true },
  { id: '10', sessionId: 's5', sessionIntent: '进入禁航区', sessionType: 'alert', sender: '海丰国际', content: '吴淞交管，我船目前航向偏离，正在尝试修正。', time: '16:33:10', date: '2025-12-17', duration: '3.12s', isVTS: false },
  { id: '11', sessionId: 's5', sessionIntent: '进入禁航区', sessionType: 'alert', sender: '交管_127705', content: '请立即向左修正航向，避开圆圆沙禁航区。', time: '16:33:15', date: '2025-12-17', duration: '2.45s', isVTS: true },
];

export const MOCK_ANCHORAGES = [
  { 
    id: 'a1', 
    name: '6号锚地', 
    capacity: 20, 
    occupied: 18, 
    expiringCount: 3, 
    overtimeCount: 2,
    status: '拥挤',
    shipTypes: [
      { type: '散货船', count: 8 },
      { type: '集装箱船', count: 6 },
      { type: '油船', count: 4 }
    ],
    expiringShips: [
      { id: 'es1', name: '远洋 123', englishName: 'Ocean Pioneer 123', mmsi: '413000001', type: '货轮', expiryTime: '2026-04-15 18:00', details: { length: 190, width: 32, draft: 11.2, cargo: '铁矿石', destination: '上海', agent: '中远海运', callSign: 'BARD1', flag: '中国', anchorTime: '2026-04-13 10:00', lastPort: '舟山', nextPort: '上海', anchorPurpose: '待泊' } },
      { id: 'es2', name: '海丰 77', englishName: 'Hai Feng 77', mmsi: '413000002', type: '集装箱船', expiryTime: '2026-04-15 21:30', details: { length: 145, width: 24, draft: 8.5, cargo: '日用品', destination: '宁波', agent: '海丰国际', callSign: 'VRGT5', flag: '中国香港', anchorTime: '2026-04-13 14:00', lastPort: '上海', nextPort: '宁波', anchorPurpose: '装卸' } },
      { id: 'es3', name: '振华 15', englishName: 'Zhen Hua 15', mmsi: '413000003', type: '工程船', expiryTime: '2026-04-16 09:00', details: { length: 220, width: 45, draft: 9.8, cargo: '重型设备', destination: '舟山', agent: '振华重工', callSign: 'BHKS3', flag: '中国', anchorTime: '2026-04-14 08:30', lastPort: '长兴', nextPort: '舟山', anchorPurpose: '待命' } }
    ],
    overtimeShips: [
      { id: 'ot1', name: '华东 18', englishName: 'Hua Dong 18', mmsi: '413000101', type: '散货船', expiryTime: '2026-04-14 13:45', overtimeDuration: '超时 2h15m', details: { length: 170, width: 29, draft: 9.1, cargo: '钢材', destination: '张家港', agent: '华东航运', callSign: 'BZXC1', flag: '中国', anchorTime: '2026-04-12 16:00', lastPort: '泰州', nextPort: '张家港', anchorPurpose: '待港' } },
      { id: 'ot2', name: '中海 203', englishName: 'COSCO 203', mmsi: '413000102', type: '油船', expiryTime: '2026-04-14 14:55', overtimeDuration: '超时 1h05m', details: { length: 210, width: 35, draft: 12.4, cargo: '成品油', destination: '洋山', agent: '中海油', callSign: 'BUIO2', flag: '中国', anchorTime: '2026-04-12 12:00', lastPort: '南京', nextPort: '洋山', anchorPurpose: '受油' } }
    ]
  },
  { 
    id: 'a2', 
    name: '圆圆沙锚地', 
    capacity: 15, 
    occupied: 12, 
    expiringCount: 5, 
    overtimeCount: 1,
    status: '正常',
    shipTypes: [
      { type: '散货船', count: 5 },
      { type: '杂货船', count: 4 },
      { type: '工程船', count: 3 }
    ],
    expiringShips: [
      { id: 'es4', name: '中海 99', englishName: 'COSCO 99', mmsi: '413000004', type: '油轮', expiryTime: '2026-04-15 17:15', details: { length: 250, width: 48, draft: 14.5, cargo: '原油', destination: '大连', agent: '中海油', callSign: 'BUIO9', flag: '中国', anchorTime: '2026-04-13 11:15', lastPort: '宁波', nextPort: '大连', anchorPurpose: '过境' } },
      { id: 'es5', name: '顺风 6', englishName: 'Shun Feng 6', mmsi: '413000005', type: '散货船', expiryTime: '2026-04-16 10:45', details: { length: 110, width: 18, draft: 6.2, cargo: '煤炭', destination: '天津', agent: '顺风航运', callSign: 'BSFG6', flag: '中国', anchorTime: '2026-04-14 06:45', lastPort: '常熟', nextPort: '天津', anchorPurpose: '避风' } }
    ],
    overtimeShips: [
      { id: 'ot3', name: '盛港 12', englishName: 'Sheng Gang 12', mmsi: '413000103', type: '工程船', expiryTime: '2026-04-14 12:20', overtimeDuration: '超时 3h40m', details: { length: 160, width: 30, draft: 7.2, cargo: '设备', destination: '南通', agent: '盛港海工', callSign: 'BSGH2', flag: '中国', anchorTime: '2026-04-12 14:00', lastPort: '上海', nextPort: '南通', anchorPurpose: '作业' } }
    ]
  },
  { 
    id: 'a3', 
    name: '10号锚地', 
    capacity: 25, 
    occupied: 10, 
    expiringCount: 1, 
    overtimeCount: 0,
    status: '空闲',
    shipTypes: [
      { type: '集装箱船', count: 4 },
      { type: '油船', count: 3 },
      { type: '其他', count: 3 }
    ],
    expiringShips: [
      { id: 'es6', name: '东方 55', englishName: 'Dong Fang 55', mmsi: '413000055', type: '客船', expiryTime: '2026-04-16 18:00', details: { length: 120, width: 20, draft: 5.5, cargo: '乘客', destination: '青岛', agent: '东方海外', callSign: 'BDOO5', flag: '中国', anchorTime: '2026-04-14 18:00', lastPort: '上海', nextPort: '青岛', anchorPurpose: '游览' } }
    ],
    overtimeShips: []
  },
  { 
    id: 'a4', 
    name: '绿华山锚地', 
    capacity: 30, 
    occupied: 28, 
    expiringCount: 8, 
    overtimeCount: 3,
    status: '拥挤',
    shipTypes: [
      { type: '散货船', count: 12 },
      { type: '油船', count: 10 },
      { type: '集装箱船', count: 6 }
    ],
    expiringShips: [
      { id: 'es7', name: '远洋 99', englishName: 'Ocean Pioneer 99', mmsi: '413000099', type: '散货船', expiryTime: '2026-04-16 20:30', details: { length: 185, width: 32, draft: 10.5, cargo: '煤炭', destination: '广州', agent: '中远海运', callSign: 'BYYP9', flag: '中国', anchorTime: '2026-04-14 20:30', lastPort: '温州', nextPort: '广州', anchorPurpose: '避风' } }
    ],
    overtimeShips: [
      { id: 'ot4', name: '远海 72', englishName: 'Yuan Hai 72', mmsi: '413000104', type: '散货船', expiryTime: '2026-04-14 11:40', overtimeDuration: '超时 4h20m', details: { length: 198, width: 33, draft: 10.8, cargo: '矿砂', destination: '北仑', agent: '远海航运', callSign: 'BYHH7', flag: '中国', anchorTime: '2026-04-12 10:00', lastPort: '连云港', nextPort: '北仑', anchorPurpose: '待港' } },
      { id: 'ot5', name: '海景 88', englishName: 'Hai Jing 88', mmsi: '413000105', type: '油船', expiryTime: '2026-04-14 13:55', overtimeDuration: '超时 2h05m', details: { length: 230, width: 38, draft: 12.9, cargo: '原油', destination: '南沙', agent: '海景能源', callSign: 'BHJJ8', flag: '中国', anchorTime: '2026-04-12 14:00', lastPort: '南京', nextPort: '南沙', anchorPurpose: '受油' } },
      { id: 'ot6', name: '华舰 36', englishName: 'Hua Jian 36', mmsi: '413000106', type: '工程船', expiryTime: '2026-04-14 10:50', overtimeDuration: '超时 5h10m', details: { length: 175, width: 28, draft: 8.1, cargo: '施工设备', destination: '舟山', agent: '华舰工程', callSign: 'BHJJ3', flag: '中国', anchorTime: '2026-04-12 08:00', lastPort: '上海', nextPort: '舟山', anchorPurpose: '作业' } }
    ]
  },
];

export const MOCK_ALERTS: Alert[] = [
  { 
    id: 'a1', 
    ship: '江海通8',
    englishName: 'Jiang Hai Tong 8',
    shipType: '散货船',
    mmsi: '413000008',
    callsign: 'BHT8',
    flag: '中国',
    agent: '江海通',
    anchorTime: '2026-03-18 14:20',
    destination: '上海',
    cargo: '铁矿石',
    riskScore: 85,
    length: '156m',
    width: '28m',
    draft: '8.5m',
    speed: '10.2kn',
    type: '进入禁航区', 
    summary: '该船偏离预定航线，进入禁航区【测试禁航区1】', 
    time: '11:42', 
    coords: [31.35, 121.55],
    level: 'emergency',
    timeline: [
      { time: '11:25:10', event: '进入吴淞口警戒区', type: 'info' },
      { time: '11:32:45', event: '航向偏离预定航线 > 15°', type: 'warning' },
      { time: '11:38:20', event: '接近禁航区边界', type: 'warning' },
      { time: '11:42:05', event: '触发[进入禁航区]风险预警', type: 'risk' }
    ]
  },
  { 
    id: 'a2', 
    ship: '新海安',
    englishName: 'Xin Hai An',
    shipType: '集装箱船',
    mmsi: '413000010',
    callsign: 'XHA10',
    flag: '中国',
    agent: '中远海运',
    anchorTime: '2026-03-19 08:30',
    destination: '宁波',
    cargo: '日用品',
    riskScore: 72,
    length: '230m',
    width: '36m',
    draft: '12.0m',
    speed: '4.5kn',
    type: '进入禁锚区', 
    summary: '该船在禁锚区【测试禁锚区2】内减速，疑似准备抛锚', 
    time: '11:38', 
    coords: [31.38, 121.58],
    level: 'alarm',
    timeline: [
      { time: '11:15:00', event: '通过圆圆沙报告线', type: 'info' },
      { time: '11:25:30', event: '进入禁锚区水域', type: 'info' },
      { time: '11:32:15', event: '航速降至 5kn 以下', type: 'warning' },
      { time: '11:38:10', event: '检测 wood 抛锚准备行为', type: 'risk' }
    ]
  },
  { 
    id: 'a3', 
    ship: '星海',
    englishName: 'Xing Hai',
    shipType: '油船',
    mmsi: '413000012',
    callsign: 'XH12',
    flag: '中国',
    agent: '新诚航运',
    anchorTime: '2026-03-18 20:15',
    destination: '舟山',
    cargo: '原油',
    riskScore: 65,
    length: '190m',
    width: '32m',
    draft: '11.5m',
    speed: '13.8kn',
    type: '超速警报', 
    summary: '该船在航道内航速超过 12 节限制', 
    time: '11:25', 
    coords: [31.42, 121.62],
    level: 'warning',
    timeline: [
      { time: '11:05:00', event: '进入吴淞主航道', type: 'info' },
      { time: '11:12:30', event: '航速持续上升 (11.5kn -> 12.8kn)', type: 'warning' },
      { time: '11:20:15', event: '超过航道限速阈值', type: 'warning' },
      { time: '11:25:00', event: '触发[超速航行]风险预警', type: 'risk' }
    ]
  },
  { 
    id: 'a4', 
    ship: '蓝波',
    englishName: 'Blue Wave',
    shipType: '拖船',
    mmsi: '413000015',
    destination: '南通',
    cargo: '无',
    riskScore: 45,
    length: '45m',
    width: '12m',
    draft: '4.5m',
    speed: '1.2kn',
    type: '走锚风险', 
    summary: '检测到该船在锚地内位置发生异常偏移，可能存在走锚风险', 
    time: '11:12', 
    coords: [31.45, 121.65],
    level: 'caution',
    timeline: [
      { time: '10:45:00', event: '进入南槽锚地', type: 'info' },
      { time: '11:00:15', event: '检测到位置持续漂移', type: 'warning' },
      { time: '11:08:30', event: '偏离锚位半径 > 50m', type: 'warning' },
      { time: '11:12:10', event: '触发[走锚风险]预警', type: 'risk' }
    ]
  },
];

export type WarningRule = {
  id: string;
  name: string;
  category: '单船风险' | '多船风险' | '船与环境风险' | '碰撞风险';
  trigger: string;
  enabled: boolean;
  severity: '注意' | '警告' | '警报' | '紧急';
  responseLevel: '自动提醒' | '值班确认' | '联动处置';
  description: string;
  descriptions?: string[];
  effectiveAreaIds: string[];
};

export const INITIAL_WARNING_RULES: WarningRule[] = [
  {
    id: 'wr-1',
    name: '进入禁航区',
    category: '船与环境风险',
    trigger: '敏感区域进出',
    enabled: true,
    severity: '紧急',
    responseLevel: '联动处置',
    description: '当船舶进入禁航区、警戒封控区等限制水域时触发高等级预警。',
    descriptions: ['识别船舶进入禁航区行为', '识别船舶进入警戒封控区行为'],
    effectiveAreaIds: ['1', '13', '15'],
  },
  {
    id: 'wr-2',
    name: '禁锚区抛锚',
    category: '单船风险',
    trigger: '敏感区域进出',
    enabled: true,
    severity: '警报',
    responseLevel: '值班确认',
    description: '在禁锚区内识别出减速、驻留、抛锚等行为时触发。',
    effectiveAreaIds: ['9', '14'],
  },
  {
    id: 'wr-3',
    name: '走锚',
    category: '单船风险',
    trigger: '异常行为',
    enabled: false,
    severity: '警告',
    responseLevel: '值班确认',
    description: '对锚泊船位移、漂移速度异常等特征进行识别。',
    effectiveAreaIds: ['9', '14'],
  },
  {
    id: 'wr-4',
    name: '非锚地水域锚泊',
    category: '单船风险',
    trigger: '单船事件',
    enabled: false,
    severity: '警告',
    responseLevel: '自动提醒',
    description: '对非授权锚泊水域内的异常停船、抛锚行为进行提醒。',
    effectiveAreaIds: ['2', '12'],
  },
  {
    id: 'wr-5',
    name: '航道内偏航',
    category: '单船风险',
    trigger: '异常行为',
    enabled: false,
    severity: '警告',
    responseLevel: '值班确认',
    description: '船舶航向、航迹偏离航道中心线超过阈值时触发。',
    effectiveAreaIds: ['10', '11'],
  },
  {
    id: 'wr-6',
    name: '非掉头区掉头',
    category: '单船风险',
    trigger: '异常行为',
    enabled: false,
    severity: '警告',
    responseLevel: '自动提醒',
    description: '监测船舶在非指定掉头区域内进行大幅转向或掉头操作。',
    effectiveAreaIds: ['10', '12'],
  },
  {
    id: 'wr-7',
    name: '反航道航行',
    category: '单船风险',
    trigger: '异常行为',
    enabled: false,
    severity: '警报',
    responseLevel: '联动处置',
    description: '识别船舶沿航道逆向行驶的高风险动态。',
    effectiveAreaIds: ['10', '11', '12'],
  },
  {
    id: 'wr-8',
    name: '航道内超速',
    category: '单船风险',
    trigger: '异常行为',
    enabled: true,
    severity: '警告',
    responseLevel: '自动提醒',
    description: '对超出航道限速阈值的行为进行持续监测与提醒。',
    effectiveAreaIds: ['10', '11', '12'],
  },
  {
    id: 'wr-9',
    name: '搁浅',
    category: '船与环境风险',
    trigger: '异常行为',
    enabled: false,
    severity: '紧急',
    responseLevel: '联动处置',
    description: '结合水深、吃水与航速变化识别可能的搁浅事件。',
    effectiveAreaIds: ['13', '15'],
  },
  {
    id: 'wr-10',
    name: '进入特定区域',
    category: '单船风险',
    trigger: '异常行为',
    enabled: true,
    severity: '警告',
    responseLevel: '值班确认',
    description: '对重点保护、施工、演练等指定区域的进入行为进行监测。',
    effectiveAreaIds: ['13', '14', '8'],
  },
  {
    id: 'wr-11',
    name: '航道内滞航',
    category: '单船风险',
    trigger: '异常行为',
    enabled: true,
    severity: '注意',
    responseLevel: '自动提醒',
    description: '对航道内长时间低速 or 停滞状态进行识别。',
    effectiveAreaIds: ['10', '11'],
  },
  {
    id: 'wr-12',
    name: '多船碰撞',
    category: '碰撞风险',
    trigger: '异常行为',
    enabled: false,
    severity: '紧急',
    responseLevel: '联动处置',
    description: '结合 CPA、TCPA 与多船会遇态势识别碰撞风险。',
    effectiveAreaIds: ['1', '10', '11', '13'],
  },
  {
    id: 'wr-13',
    name: '多船会遇紧迫局面',
    category: '多船风险',
    trigger: '异常行为',
    enabled: true,
    severity: '注意',
    responseLevel: '值班确认',
    description: '在重点监管水域内，对多船构成的紧迫局面进行识别与预警。',
    effectiveAreaIds: ['1', '10', '11'],
  },
];

export const INTENT_DATA: IntentItem[] = [
  {
    ship: '远洋99',
    englishName: 'Ocean Pioneer 99',
    mmsi: '413000099',
    callSign: 'BYYP9',
    imo: '9123456',
    flag: '中国',
    agent: '中远海运',
    shipType: '散货船',
    cargoType: '煤炭',
    length: '185m',
    width: '32m',
    draft: '10.5m',
    speed: '12.5kn',
    past: '6号锚地',
    current: '吴淞口',
    destination: '黄浦江',
    confidence: 92,
    time: '11:20',
    occurrenceTime: '2026-03-19 11:20',
    details: '该船已完成起锚，目前在主航道由北向南行驶至吴淞口附近，正准备划江进入黄浦江。',
    intentSummary: '前往黄浦江，正在减速进入吴淞口主航道。',
    intentConfidence: 92,
    intentEta: '预计 8 分钟后进入报告线',
    risks: [
      {
        level: '紧急',
        text: 'CPA 0.18nm：与“海丰77”会遇',
        action: '保持右侧通过',
        counterparty: '海丰77',
        location: '吴淞口主航道交汇点',
        timeToEncounter: '约 6 分钟后',
      },
      { level: '警告', text: '航道偏移 +86m：已偏离推荐航迹', action: '回归中心线' },
      { level: '警告', text: '前方交通密集：2 分钟内进入交汇水域', action: '避免加速' },
    ],
    situation: {
      sog: '9.8kn',
      hdg: '214°',
      cpa: '0.18nm',
      tcpa: '06:20',
      xtd: '+86m',
      rot: '1.8°/min',
      trend: 'DCPA ↓',
    },
    recommendation: {
      action: '减速至 8kn 以下，回归推荐航迹，重点关注左前方会遇船。',
      priority: '立即',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '6号锚地', status: 'completed', action: '申请起锚' },
      { label: '吴淞口', status: 'active', action: '由北向南划江' },
      { label: '黄浦江', status: 'pending', action: '目的地' }
    ],
    timeline: [
      { time: '11:05 UTC', tag: '实时监控', content: '保持航向 184.2。周边区域交通繁忙。系统自主响应等级设置为 2。', status: 'active' },
      { time: '10:42 UTC', tag: '航点通过', content: '第 4 扇区过渡完成。航速稳定在 12.5 节。推进效率 94%。', status: 'completed' },
      { time: '09:15 UTC', tag: '初始序列', content: '从锚地启动离港序列。所有子系统运行正常。', status: 'initial' }
    ]
  },
  {
    ship: '海丰国际',
    englishName: 'SITC INTERNATIONAL',
    mmsi: '413000002',
    callSign: 'VRGT5',
    imo: '9234567',
    flag: '中国香港',
    agent: '海丰国际',
    shipType: '集装箱船',
    cargoType: '日用品',
    length: '210m',
    width: '35m',
    draft: '11.2m',
    speed: '15.8kn',
    past: '圆圆沙',
    current: '南槽航道',
    destination: '外高桥',
    confidence: 85,
    time: '11:35',
    occurrenceTime: '2026-03-19 11:35',
    details: '该船已从圆圆沙锚地起锚，目前正进入南槽航道由北向南航行，预计前往外高桥码头靠泊。',
    intentSummary: '前往外高桥码头，正在南槽航道保持进港队形。',
    intentConfidence: 85,
    intentEta: '预计 12 分钟后进入靠泊引导区',
    risks: [
      {
        level: '警报',
        text: 'CPA 0.22nm：与“远洋99”存在交叉会遇',
        action: '保持右舷避让',
        counterparty: '远洋99',
        location: '南槽入口交叉口',
        timeToEncounter: '约 5 分钟后',
      },
      { level: '警告', text: '航速 15.8kn：高于当前建议进港航速', action: '减速至 12kn' },
      { level: '警告', text: '前方密度升高：南槽入口船流叠加', action: '保持纵向间距' },
    ],
    situation: {
      sog: '15.8kn',
      hdg: '196°',
      cpa: '0.22nm',
      tcpa: '04:50',
      xtd: '+34m',
      rot: '0.7°/min',
      trend: 'TCPA ↓',
    },
    recommendation: {
      action: '减速进入队列，保持南槽中心线，提前关注交叉来船。',
      priority: '立即',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '圆圆沙', status: 'completed', action: '已起锚' },
      { label: '南槽航道', status: 'active', action: '由北向南航行' },
      { label: '外高桥', status: 'pending', action: '靠泊' }
    ],
    timeline: [
      { time: '11:25 UTC', tag: '实时监控', content: '进入南槽航道。当前流量中等。系统状态稳定。', status: 'active' },
      { time: '10:55 UTC', tag: '航点通过', content: '圆圆沙报告线通过。航速 11.8 节。', status: 'completed' },
      { time: '09:45 UTC', tag: '初始序列', content: '圆圆沙锚地起锚序列启动。', status: 'initial' }
    ]
  },
  {
    ship: '中远海运',
    shipType: '集装箱船',
    cargoType: '电子产品',
    length: '366m',
    width: '51m',
    draft: '14.5m',
    speed: '4.2kn',
    past: '外高桥',
    current: '外高桥码头',
    destination: '洋山港',
    confidence: 95,
    time: '11:45',
    occurrenceTime: '2026-03-19 11:45',
    details: '该船正在外高桥码头进行离泊作业，预计离泊后经南槽航道前往洋山港。',
    intentSummary: '前往洋山港，当前处于外高桥码头离泊阶段。',
    intentConfidence: 95,
    intentEta: '预计 6 分钟后完成解缆离泊',
    risks: [
      {
        level: '警告',
        text: '港池机动空间有限：拖轮作业窗口较短',
        action: '保持低速离泊',
        counterparty: '沪港拖08',
        location: '外高桥港池出口',
        timeToEncounter: '约 9 分钟后',
      },
      { level: '警告', text: '艏向调整中：旋回余度不足', action: '优先校正船首方向' },
      { level: '注意', text: '后方交通可控：无紧迫追越船', action: '按计划离泊' },
    ],
    situation: {
      sog: '4.2kn',
      hdg: '128°',
      cpa: '0.46nm',
      tcpa: '09:10',
      xtd: '+12m',
      rot: '2.2°/min',
      trend: 'ROT ↑',
    },
    recommendation: {
      action: '保持低速解缆，先完成艏向修正，再进入离港航道。',
      priority: '优先',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '外高桥', status: 'active', action: '离泊中' },
      { label: '南槽航道', status: 'pending', action: '航行' },
      { label: '洋山港', status: 'pending', action: '靠泊' }
    ],
    timeline: [
      { time: '11:40 UTC', tag: '实时监控', content: '解缆作业开始。拖轮已到位。', status: 'active' },
      { time: '11:30 UTC', tag: '离泊申请', content: 'VTS 批准离泊申请。', status: 'completed' }
    ]
  },
  {
    ship: '盛世油轮',
    shipType: '油船',
    cargoType: '原油',
    length: '245m',
    width: '42m',
    draft: '12.8m',
    speed: '2.5kn',
    past: '长江口',
    current: '10号锚地',
    destination: '10号锚地',
    confidence: 88,
    time: '11:52',
    occurrenceTime: '2026-03-19 11:52',
    details: '该船已抵达10号锚地，目前正在减速准备抛锚，等待后续进港指令。',
    intentSummary: '进入10号锚地，正在减速准备抛锚等待指令。',
    intentConfidence: 88,
    intentEta: '预计 5 分钟后完成抛锚动作',
    risks: [
      {
        level: '警告',
        text: '锚地内相邻船距收缩：左舷船间距不足',
        action: '限制横移',
        counterparty: '海巡21',
        location: '10号锚地西侧入锚点',
        timeToEncounter: '约 11 分钟后',
      },
      { level: '警告', text: '航速 2.5kn：抛锚前减速不足', action: '继续降至 1kn 以下' },
      { level: '注意', text: '风流可控：当前不影响锚泊', action: '维持艏向稳定' },
    ],
    situation: {
      sog: '2.5kn',
      hdg: '071°',
      cpa: '0.62nm',
      tcpa: '11:40',
      xtd: '+18m',
      rot: '0.5°/min',
      trend: 'SOG ↓',
    },
    recommendation: {
      action: '继续减速并限制横移，确认锚位后再执行抛锚。',
      priority: '优先',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '长江口', status: 'completed', action: '进港航行' },
      { label: '10号锚地', status: 'active', action: '准备抛锚' },
      { label: '10号锚地', status: 'pending', action: '锚泊' }
    ],
    timeline: [
      { time: '11:50 UTC', tag: '实时监控', content: '航速降至 3 节以下。准备抛锚。', status: 'active' },
      { time: '11:45 UTC', tag: '位置报告', content: '进入10号锚地水域。', status: 'completed' }
    ]
  },
  {
    ship: '东海拖01',
    shipType: '拖船',
    cargoType: '无',
    length: '45m',
    width: '12m',
    draft: '4.2m',
    speed: '8.5kn',
    past: '北槽',
    current: '主航道',
    destination: '南槽',
    confidence: 90,
    time: '12:05',
    occurrenceTime: '2026-03-19 12:05',
    details: '该船正在穿越主航道，从北槽前往南槽执行拖带任务，需注意避让主航道直航船舶。',
    intentSummary: '由北槽前往南槽，正在申请穿越主航道执行拖带任务。',
    intentConfidence: 90,
    intentEta: '预计 4 分钟后进入主航道中心带',
    risks: [
      {
        level: '紧急',
        text: '主航道直航船接近：TCPA 03:10',
        action: '延后穿越窗口',
        counterparty: '新海安',
        location: '3号浮北侧会遇点',
        timeToEncounter: '约 3 分钟后',
      },
      { level: '警告', text: '横穿角度偏大：穿越时间被拉长', action: '调整为快速直穿' },
      { level: '警告', text: '周边交通密集：拖带作业机动受限', action: '提前通报周边船舶' },
    ],
    situation: {
      sog: '8.5kn',
      hdg: '156°',
      cpa: '0.24nm',
      tcpa: '03:10',
      xtd: '+55m',
      rot: '1.1°/min',
      trend: 'CPA ↓',
    },
    recommendation: {
      action: '延后穿越，待主航道直航船通过后再快速直穿。',
      priority: '立即',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '北槽', status: 'completed', action: '航行' },
      { label: '主航道', status: 'active', action: '穿越主航道' },
      { label: '南槽', status: 'pending', action: '执行任务' }
    ],
    timeline: [
      { time: '12:00 UTC', tag: '实时监控', content: '开始穿越主航道. 已通报周边船舶。', status: 'active' },
      { time: '11:55 UTC', tag: '穿越申请', content: 'VTS 提醒注意避让进港大船。', status: 'completed' }
    ]
  },
  {
    ship: '运兴96',
    shipType: '货船',
    cargoType: '杂货',
    length: '96m',
    width: '16m',
    draft: '5.5m',
    speed: '9.2kn',
    past: '长江口',
    current: '吴淞口',
    destination: '黄浦江',
    confidence: 90,
    time: '16:32',
    occurrenceTime: '2025-12-17 16:32',
    details: '该船正在吴淞口水域航行，准备划江进入黄浦江。',
    intentSummary: '前往黄浦江，当前在吴淞口水域准备划江进入内港。',
    intentConfidence: 90,
    intentEta: '预计 7 分钟后进入黄浦江口门',
    risks: [
      {
        level: '警告',
        text: '交通流汇聚：吴淞口入口双向船流叠加',
        action: '保持现航向待机',
        counterparty: '蓝波',
        location: '吴淞口警戒线南侧',
        timeToEncounter: '约 8 分钟后',
      },
      { level: '警告', text: '航道偏移 +42m：接近航道右侧边界', action: '回归推荐航迹' },
      { level: '注意', text: 'CPA 0.41nm：当前会遇风险可控', action: '持续观察' },
    ],
    situation: {
      sog: '9.2kn',
      hdg: '172°',
      cpa: '0.41nm',
      tcpa: '08:35',
      xtd: '+42m',
      rot: '0.6°/min',
      trend: 'XTD ↑',
    },
    recommendation: {
      action: '保持当前航速，先回归中心线，再按窗口进入黄浦江。',
      priority: '优先',
    },
    anchorTime: '2026-03-18 10:30',
    path: [
      { label: '长江口', status: 'completed', action: '进港' },
      { label: '吴淞口', status: 'active', action: '划江' },
      { label: '黄浦江', status: 'pending', action: '靠泊' }
    ],
    timeline: [
      { time: '16:32 UTC', tag: '实时监控', content: '呼叫吴淞中心。', status: 'active' }
    ]
  }
];

export const ANCHORAGE_TYPE_LABELS = [
  '不可用(默认)',
  '地效翼船(WIG)',
  '渔船',
  '工作船',
  '工作船（船长＞200m或船宽＞25m）',
  '从事疏浚或水下作业的船舶',
  '潜水工作船',
  '军用船舶',
  '帆船',
  '游乐船',
  '已预留',
  '高速船 (HSC)',
  '引航船',
  '救助船',
  '拖船',
  '航标',
  '污染控制船',
  '执法船',
  '备用-本地船只',
  '医疗运输船',
  '根据《无线电规则》第18号决议的非战斗舰',
  '客船',
  '货船',
  '油船',
  '其他',
];

export const ANCHORAGE_TYPE_CHART_COLORS = [
  '#47d77d',
  '#55b7ff',
  '#f6b73c',
  '#ff6666',
  '#a567ff',
  '#6f86ff',
  '#ff63c8',
  '#8e9aac',
];

export const hashStringMock = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getAnchorageTypeStats = (anchorageId: string) =>
  ANCHORAGE_TYPE_LABELS.map((type, index) => ({
    type,
    count: (hashStringMock(`${anchorageId}-${type}-${index}`) % 5) + 1,
  })).sort((left, right) => right.count - left.count);

export const ANCHORAGE_DURATION_BUCKETS = [
  { label: '小于1天', minDays: 0, maxDays: 1 },
  { label: '1-3天', minDays: 1, maxDays: 3 },
  { label: '3-5天', minDays: 3, maxDays: 5 },
  { label: '5-10天', minDays: 5, maxDays: 10 },
  { label: '大于10天', minDays: 10, maxDays: Number.POSITIVE_INFINITY },
] as const;

export const getAnchorageDurationStats = (anchorageId: string, occupied: number) => {
  const safeOccupied = Math.max(occupied, 0);
  if (safeOccupied === 0) {
    return ANCHORAGE_DURATION_BUCKETS.map((bucket) => ({
      type: bucket.label,
      count: 0,
    }));
  }

  const weights = ANCHORAGE_DURATION_BUCKETS.map((bucket, index) => ({
    type: bucket.label,
    weight: (hashStringMock(`${anchorageId}-${bucket.label}-${index}`) % 100) + 1,
  }));
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);

  const distributed = weights.map((item) => ({
    type: item.type,
    rawCount: (item.weight / totalWeight) * safeOccupied,
  }));

  const baseStats = distributed.map((item) => ({
    type: item.type,
    count: Math.floor(item.rawCount),
  }));

  let remaining = safeOccupied - baseStats.reduce((sum, item) => sum + item.count, 0);

  if (remaining > 0) {
    const remainders = distributed
      .map((item, index) => ({
        index,
        remainder: item.rawCount - Math.floor(item.rawCount),
      }))
      .sort((left, right) => right.remainder - left.remainder);

    for (let i = 0; i < remainders.length && remaining > 0; i += 1) {
      baseStats[remainders[i].index].count += 1;
      remaining -= 1;
    }
  }

  return baseStats;
};
