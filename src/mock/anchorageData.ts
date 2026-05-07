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
      { type: '油船', count: 4 },
    ],
    expiringShips: [
      { id: 'es1', name: '远洋 123', englishName: 'Ocean Pioneer 123', mmsi: '413000001', type: '货轮', expiryTime: '2026-04-15 18:00', details: { length: 190, width: 32, draft: 11.2, cargo: '铁矿石', destination: '上海', agent: '中远海运', callSign: 'BARD1', flag: '中国', anchorTime: '2026-04-13 10:00', lastPort: '舟山', nextPort: '上海', anchorPurpose: '待泊' } },
      { id: 'es2', name: '海丰 77', englishName: 'Hai Feng 77', mmsi: '413000002', type: '集装箱船', expiryTime: '2026-04-15 21:30', details: { length: 145, width: 24, draft: 8.5, cargo: '日用品', destination: '宁波', agent: '海丰国际', callSign: 'VRGT5', flag: '中国香港', anchorTime: '2026-04-13 14:00', lastPort: '上海', nextPort: '宁波', anchorPurpose: '装卸' } },
      { id: 'es3', name: '振华 15', englishName: 'Zhen Hua 15', mmsi: '413000003', type: '工程船', expiryTime: '2026-04-16 09:00', details: { length: 220, width: 45, draft: 9.8, cargo: '重型设备', destination: '舟山', agent: '振华重工', callSign: 'BHKS3', flag: '中国', anchorTime: '2026-04-14 08:30', lastPort: '长兴', nextPort: '舟山', anchorPurpose: '待命' } },
    ],
    overtimeShips: [
      { id: 'ot1', name: '华东 18', englishName: 'Hua Dong 18', mmsi: '413000101', type: '散货船', expiryTime: '2026-04-14 13:45', overtimeDuration: '超时 2h15m', details: { length: 170, width: 29, draft: 9.1, cargo: '钢材', destination: '张家港', agent: '华东航运', callSign: 'BZXC1', flag: '中国', anchorTime: '2026-04-12 16:00', lastPort: '泰州', nextPort: '张家港', anchorPurpose: '待港' } },
      { id: 'ot2', name: '中海 203', englishName: 'COSCO 203', mmsi: '413000102', type: '油船', expiryTime: '2026-04-14 14:55', overtimeDuration: '超时 1h05m', details: { length: 210, width: 35, draft: 12.4, cargo: '成品油', destination: '洋山', agent: '中海油', callSign: 'BUIO2', flag: '中国', anchorTime: '2026-04-12 12:00', lastPort: '南京', nextPort: '洋山', anchorPurpose: '受油' } },
    ],
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
      { type: '工程船', count: 3 },
    ],
    expiringShips: [
      { id: 'es4', name: '中海 99', englishName: 'COSCO 99', mmsi: '413000004', type: '油轮', expiryTime: '2026-04-15 17:15', details: { length: 250, width: 48, draft: 14.5, cargo: '原油', destination: '大连', agent: '中海油', callSign: 'BUIO9', flag: '中国', anchorTime: '2026-04-13 11:15', lastPort: '宁波', nextPort: '大连', anchorPurpose: '过境' } },
      { id: 'es5', name: '顺风 6', englishName: 'Shun Feng 6', mmsi: '413000005', type: '散货船', expiryTime: '2026-04-16 10:45', details: { length: 110, width: 18, draft: 6.2, cargo: '煤炭', destination: '天津', agent: '顺风航运', callSign: 'BSFG6', flag: '中国', anchorTime: '2026-04-14 06:45', lastPort: '常熟', nextPort: '天津', anchorPurpose: '避风' } },
    ],
    overtimeShips: [
      { id: 'ot3', name: '盛港 12', englishName: 'Sheng Gang 12', mmsi: '413000103', type: '工程船', expiryTime: '2026-04-14 12:20', overtimeDuration: '超时 3h40m', details: { length: 160, width: 30, draft: 7.2, cargo: '设备', destination: '南通', agent: '盛港海工', callSign: 'BSGH2', flag: '中国', anchorTime: '2026-04-12 14:00', lastPort: '上海', nextPort: '南通', anchorPurpose: '作业' } },
    ],
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
      { type: '其他', count: 3 },
    ],
    expiringShips: [
      { id: 'es6', name: '东方 55', englishName: 'Dong Fang 55', mmsi: '413000055', type: '客船', expiryTime: '2026-04-16 18:00', details: { length: 120, width: 20, draft: 5.5, cargo: '乘客', destination: '青岛', agent: '东方海外', callSign: 'BDOO5', flag: '中国', anchorTime: '2026-04-14 18:00', lastPort: '上海', nextPort: '青岛', anchorPurpose: '游览' } },
    ],
    overtimeShips: [],
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
      { type: '集装箱船', count: 6 },
    ],
    expiringShips: [
      { id: 'es7', name: '远洋 99', englishName: 'Ocean Pioneer 99', mmsi: '413000099', type: '散货船', expiryTime: '2026-04-16 20:30', details: { length: 185, width: 32, draft: 10.5, cargo: '煤炭', destination: '广州', agent: '中远海运', callSign: 'BYYP9', flag: '中国', anchorTime: '2026-04-14 20:30', lastPort: '温州', nextPort: '广州', anchorPurpose: '避风' } },
    ],
    overtimeShips: [
      { id: 'ot4', name: '远海 72', englishName: 'Yuan Hai 72', mmsi: '413000104', type: '散货船', expiryTime: '2026-04-14 11:40', overtimeDuration: '超时 4h20m', details: { length: 198, width: 33, draft: 10.8, cargo: '矿砂', destination: '北仑', agent: '远海航运', callSign: 'BYHH7', flag: '中国', anchorTime: '2026-04-12 10:00', lastPort: '连云港', nextPort: '北仑', anchorPurpose: '待港' } },
      { id: 'ot5', name: '海景 88', englishName: 'Hai Jing 88', mmsi: '413000105', type: '油船', expiryTime: '2026-04-14 13:55', overtimeDuration: '超时 2h05m', details: { length: 230, width: 38, draft: 12.9, cargo: '原油', destination: '南沙', agent: '海景能源', callSign: 'BHJJ8', flag: '中国', anchorTime: '2026-04-12 14:00', lastPort: '南京', nextPort: '南沙', anchorPurpose: '受油' } },
      { id: 'ot6', name: '华舰 36', englishName: 'Hua Jian 36', mmsi: '413000106', type: '工程船', expiryTime: '2026-04-14 10:50', overtimeDuration: '超时 5h10m', details: { length: 175, width: 28, draft: 8.1, cargo: '施工设备', destination: '舟山', agent: '华舰工程', callSign: 'BHJJ3', flag: '中国', anchorTime: '2026-04-12 08:00', lastPort: '上海', nextPort: '舟山', anchorPurpose: '作业' } },
    ],
  },
];

export const ANCHORAGE_TYPE_LABELS = [
  '不可用(默认)', '地效翼船(WIG)', '渔船', '工作船', '工作船（船长＞200m或船宽＞25m）', '从事疏浚或水下作业的船舶', '潜水工作船', '军用船舶',
  '帆船', '游乐船', '已预留', '高速船 (HSC)', '引航船', '救助船', '拖船', '航标', '污染控制船', '执法船', '备用-本地船只',
  '医疗运输船', '根据《无线电规则》第18号决议的非战斗舰', '客船', '货船', '油船', '其他',
];

export const ANCHORAGE_TYPE_CHART_COLORS = ['#47d77d', '#55b7ff', '#f6b73c', '#ff6666', '#a567ff', '#6f86ff', '#ff63c8', '#8e9aac'];

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
    return ANCHORAGE_DURATION_BUCKETS.map((bucket) => ({ type: bucket.label, count: 0 }));
  }

  const weights = ANCHORAGE_DURATION_BUCKETS.map((bucket, index) => ({
    type: bucket.label,
    weight: (hashStringMock(`${anchorageId}-${bucket.label}-${index}`) % 100) + 1,
  }));
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const distributed = weights.map((item) => ({ type: item.type, rawCount: (item.weight / totalWeight) * safeOccupied }));
  const baseStats = distributed.map((item) => ({ type: item.type, count: Math.floor(item.rawCount) }));

  let remaining = safeOccupied - baseStats.reduce((sum, item) => sum + item.count, 0);
  if (remaining > 0) {
    const remainders = distributed
      .map((item, index) => ({ index, remainder: item.rawCount - Math.floor(item.rawCount) }))
      .sort((left, right) => right.remainder - left.remainder);

    for (let i = 0; i < remainders.length && remaining > 0; i += 1) {
      baseStats[remainders[i].index].count += 1;
      remaining -= 1;
    }
  }

  return baseStats;
};
