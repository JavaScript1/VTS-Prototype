import type { MockRiskStat } from '../../../../types';

export type FalsePositiveType = '是' | '否';
export type RiskStatusType = '报警中' | '已关闭';

export type DisplayRiskRow = MockRiskStat & {
  englishName: string;
  imo: string;
  falsePositive: FalsePositiveType;
  displayStatus: RiskStatusType;
};

export const PAGE_SIZE = 10;
export const TOTAL_RISK_RECORDS = 1672;

const RISK_ROW_SEEDS = [
  {
    name: '润兴集99',
    englishName: 'LU JI NING HUO 5188',
    mmsi: '413794756',
    callsign: '3332',
    imo: 'IMO5188',
    type: '货船',
    risk: '反航道航行',
    location: '黄浦江主航道进口（106-107下）',
    time: '2026-05-07 16:52:25',
    riskScore: 86,
    falsePositive: '否' as const,
    displayStatus: '报警中' as const,
  },
  {
    name: '润兴集99',
    englishName: 'LU JI NING HUO 5188',
    mmsi: '413794756',
    callsign: '3332',
    imo: 'IMO5188',
    type: '货船',
    risk: '航道内偏航',
    location: '黄浦江主航道进口（106-107下）',
    time: '2026-05-07 16:52:25',
    riskScore: 72,
    falsePositive: '否' as const,
    displayStatus: '报警中' as const,
  },
  {
    name: '宇昌盛5788',
    englishName: 'YUCHANGSHENG5788',
    mmsi: '413383535',
    callsign: 'DX',
    imo: 'IMO5788',
    type: '货船',
    risk: '航道内偏航',
    location: '宝山南航道（A84-A80）',
    time: '2026-05-07 16:50:45',
    riskScore: 74,
    falsePositive: '否' as const,
    displayStatus: '报警中' as const,
  },
  {
    name: '沪环运货5016',
    englishName: 'HUHUANYUNHUO5016',
    mmsi: '413966246',
    callsign: '00',
    imo: 'IMO5016',
    type: '货船',
    risk: '航道内偏航',
    location: '黄浦江主航道进口（106-107上）',
    time: '2026-05-07 16:50:39',
    riskScore: 71,
    falsePositive: '否' as const,
    displayStatus: '报警中' as const,
  },
  {
    name: '沪环运货5016',
    englishName: 'HUHUANYUNHUO5016',
    mmsi: '413966246',
    callsign: '00',
    imo: 'IMO5016',
    type: '货船',
    risk: '反航道航行',
    location: '黄浦江主航道进口（106-107上）',
    time: '2026-05-07 16:50:39',
    riskScore: 84,
    falsePositive: '否' as const,
    displayStatus: '报警中' as const,
  },
  {
    name: '腾兴002',
    englishName: 'TENG XING 002',
    mmsi: '413226390',
    callsign: 'TEST',
    imo: 'IMO0002',
    type: '货船',
    risk: '航道内偏航',
    location: '宝山北航道进口（79-85）',
    time: '2026-05-07 16:48:08',
    riskScore: 69,
    falsePositive: '否' as const,
    displayStatus: '已关闭' as const,
  },
  {
    name: '悦龙之星',
    englishName: 'YUELONGZHIXING',
    mmsi: '413844163',
    callsign: '0',
    imo: 'IMO2183',
    type: '货船',
    risk: '航道内偏航',
    location: '宝山南航道（A84-A80）',
    time: '2026-05-07 16:44:06',
    riskScore: 73,
    falsePositive: '否' as const,
    displayStatus: '报警中' as const,
  },
  {
    name: '和谐号',
    englishName: 'HEXIEHAO',
    mmsi: '413864279',
    callsign: 'E8',
    imo: 'IMO8888',
    type: '客船',
    risk: '航道内偏航',
    location: '宝山北航道出口深水（78-74）',
    time: '2026-05-07 16:43:44',
    riskScore: 70,
    falsePositive: '否' as const,
    displayStatus: '已关闭' as const,
  },
  {
    name: '沪航客45',
    englishName: 'HUHANGKE45',
    mmsi: '413763126',
    callsign: 'M',
    imo: 'IMO4545',
    type: '客船',
    risk: '航道内偏航',
    location: '黄浦江主航道进口（106-107上）',
    time: '2026-05-07 16:43:39',
    riskScore: 68,
    falsePositive: '否' as const,
    displayStatus: '已关闭' as const,
  },
  {
    name: '沪宝泥机8',
    englishName: 'HUBAONIJI8',
    mmsi: '413884064',
    callsign: '030',
    imo: 'IMO8008',
    type: '货船',
    risk: '航道内偏航',
    location: '外高桥航道出口',
    time: '2026-05-07 16:43:30',
    riskScore: 72,
    falsePositive: '否' as const,
    displayStatus: '报警中' as const,
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

export function buildDisplayRisks(risks: MockRiskStat[]) {
  return Array.from({ length: TOTAL_RISK_RECORDS }, (_, index) => {
    const seed = RISK_ROW_SEEDS[index % RISK_ROW_SEEDS.length];
    const source = risks[index % risks.length] || risks[0];
    const date = new Date(seed.time.replace(' ', 'T'));
    date.setMinutes(date.getMinutes() - Math.floor(index / RISK_ROW_SEEDS.length));

    return {
      ...source,
      id: `warning-risk-${index + 1}`,
      name: seed.name,
      mmsi: seed.mmsi,
      callsign: seed.callsign,
      type: seed.type,
      risk: seed.risk,
      time: date.toISOString().slice(0, 19).replace('T', ' '),
      riskScore: seed.riskScore,
      snapshot: {
        ...source.snapshot,
        location: seed.location,
      },
      englishName: seed.englishName,
      imo: seed.imo,
      falsePositive: seed.falsePositive,
      displayStatus: seed.displayStatus,
      destination: source.destination || '上海港',
    } satisfies DisplayRiskRow;
  });
}
