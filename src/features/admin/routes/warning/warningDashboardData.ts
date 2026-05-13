export type DashboardDistributionItem = {
  name: string;
  value: number;
  trend: 'up' | 'down';
};

export type FocusListItem = {
  name: string;
  englishName: string;
  ids: string;
  flag: string;
  shipType: string;
  tags: string[];
  count: number;
};

export const SHIP_TYPE_COLORS = [
  '#20b8ff',
  '#7c87ff',
  '#ffa62b',
  '#ff4f86',
  '#c7d2e3',
  '#13d8c4',
  '#9f7aea',
];

export const ALERT_LEVEL_COLORS = ['#ff4f86', '#ff7a4d', '#f6c343', '#4cc6ff'];

export const TREND_DATA = [
  { hour: '00', warning: 64, handled: 1 },
  { hour: '01', warning: 52, handled: 1 },
  { hour: '02', warning: 46, handled: 1 },
  { hour: '03', warning: 63, handled: 1 },
  { hour: '04', warning: 55, handled: 1 },
  { hour: '05', warning: 79, handled: 1 },
  { hour: '06', warning: 61, handled: 1 },
  { hour: '07', warning: 83, handled: 1 },
  { hour: '08', warning: 146, handled: 1 },
  { hour: '09', warning: 149, handled: 1 },
  { hour: '10', warning: 160, handled: 1 },
  { hour: '11', warning: 98, handled: 1 },
  { hour: '12', warning: 108, handled: 1 },
  { hour: '13', warning: 85, handled: 1 },
  { hour: '14', warning: 102, handled: 1 },
  { hour: '15', warning: 91, handled: 1 },
  { hour: '16', warning: 65, handled: 1 },
  { hour: '17', warning: 64, handled: 1 },
  { hour: '18', warning: 71, handled: 1 },
  { hour: '19', warning: 63, handled: 1 },
  { hour: '20', warning: 56, handled: 1 },
  { hour: '21', warning: 70, handled: 1 },
  { hour: '22', warning: 65, handled: 1 },
  { hour: '23', warning: 82, handled: 1 },
];

export const SHIP_TYPE_DATA = [
  { name: '货船', value: 1428 },
  { name: '执法船', value: 144 },
  { name: '油船', value: 109 },
  { name: '客船', value: 106 },
  { name: '从事疏浚或水下作业的船舶', value: 52 },
  { name: '其他', value: 31 },
  { name: '不可用(默认)', value: 24 },
];

export const ALERT_LEVEL_DATA = [
  { name: '紧急', value: 0 },
  { name: '警报', value: 601 },
  { name: '警告', value: 1323 },
  { name: '注意', value: 12 },
];

export const RISK_DIMENSION_DATA: DashboardDistributionItem[] = [
  { name: '航道内偏航', value: 1087, trend: 'down' },
  { name: '反航道航行', value: 594, trend: 'down' },
  { name: '非掉头区掉头', value: 224, trend: 'up' },
  { name: '航道内滞航', value: 12, trend: 'down' },
  { name: '进入特定区域', value: 12, trend: 'up' },
  { name: '越锚区出锚', value: 5, trend: 'down' },
];

export const HIGH_RISK_AREA_DATA: DashboardDistributionItem[] = [
  { name: '宝山航道出口（68-66）', value: 540, trend: 'down' },
  { name: '宝山南航道（A84-A80）', value: 330, trend: 'down' },
  { name: '外高桥航道出口', value: 118, trend: 'up' },
  { name: '外高桥航道出口（深水）', value: 104, trend: 'up' },
  { name: '外高桥航道进口', value: 86, trend: 'up' },
  { name: '营迹江下卡航道出口（105下游）', value: 81, trend: 'up' },
];

export const FOCUS_LIST: FocusListItem[] = [
  {
    name: '海巡1667',
    englishName: 'HAIXUN1667',
    ids: '413044650 / 0 / BOD09',
    flag: '中国',
    shipType: '执法船',
    tags: ['反航道航行', '航道内偏航', '+1'],
    count: 47,
  },
  {
    name: '南通江东9号',
    englishName: 'NANTONGJIANGDONG9HAO',
    ids: '413862827 / 0 / CEIX',
    flag: '中国',
    shipType: '客船',
    tags: ['反航道航行', '航道内偏航', '+1'],
    count: 33,
  },
  {
    name: '海巡1666',
    englishName: 'HAI XUN 1666',
    ids: '413044640 / 0 / BSLH',
    flag: '中国',
    shipType: '执法船',
    tags: ['反航道航行', '航道内偏航', '+1'],
    count: 27,
  },
  {
    name: '海巡01060',
    englishName: 'HAIXUN01060',
    ids: '413246190 / 0 / LC',
    flag: '中国',
    shipType: '执法船',
    tags: ['反航道航行', '航道内偏航', '+1'],
    count: 21,
  },
  {
    name: '-',
    englishName: '(218)',
    ids: '412218218 / 0 / 0',
    flag: '中国',
    shipType: '执法船',
    tags: ['反航道航行', '航道内偏航', '+1'],
    count: 18,
  },
  {
    name: '海巡1665',
    englishName: 'HAIXUN1665',
    ids: '413044630 / 0 / BSLA',
    flag: '中国',
    shipType: '执法船',
    tags: ['航道内偏航', '进入特定区域', '+1'],
    count: 16,
  },
  {
    name: '沪港拖7',
    englishName: 'HUGANGTUO7',
    ids: '413888127 / 0 / HG07',
    flag: '中国',
    shipType: '拖轮',
    tags: ['航道内滞航', '反航道航行', '+1'],
    count: 14,
  },
  {
    name: '盛东引航1',
    englishName: 'SHENGDONGYINHANG1',
    ids: '413555001 / 0 / SDYH1',
    flag: '中国',
    shipType: '引航船',
    tags: ['进入特定区域', '航道内偏航', '+1'],
    count: 13,
  },
  {
    name: '润发8',
    englishName: 'RUNFA8',
    ids: '413776008 / 0 / RF08',
    flag: '中国',
    shipType: '货船',
    tags: ['反航道航行', '航道内偏航', '+1'],
    count: 11,
  },
];

export function buildPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages] as const;
  }
  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis-start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }
  return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages] as const;
}
