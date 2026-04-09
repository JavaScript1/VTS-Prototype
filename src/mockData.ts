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

export interface PlaybackSessionLike {
  vessel: {
    name: string;
  };
  event: {
    coords: Coordinates;
    time: string;
    label: string;
  };
}

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
