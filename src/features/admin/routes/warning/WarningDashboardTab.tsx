import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarRange, Check, Download, MapPinned } from 'lucide-react';
import {
  Area,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MockRiskStat } from '../../../../types';
import type { WarningRule } from '../../../../mockData';
import WarningDashboardFocusList from './WarningDashboardFocusList';
import {
  ALERT_LEVEL_COLORS,
  ALERT_LEVEL_DATA,
  FOCUS_LIST,
  HIGH_RISK_AREA_DATA,
  RISK_DIMENSION_DATA,
  SHIP_TYPE_COLORS,
  SHIP_TYPE_DATA,
  TREND_DATA,
} from './warningDashboardData';
import { Panel, SectionTitle } from './SharedComponents';

type WarningDashboardTabProps = {
  risks: MockRiskStat[];
  warningRules: WarningRule[];
};

type Jurisdiction = '外高桥' | '洋山' | '吴淞' | '宝山';

const JURISDICTION_OPTIONS: Jurisdiction[] = ['外高桥', '洋山', '吴淞', '宝山'];

const JURISDICTION_TOTAL_WEIGHT: Record<Jurisdiction, number> = {
  外高桥: 0.33,
  洋山: 0.18,
  吴淞: 0.27,
  宝山: 0.22,
};

const TREND_JURISDICTION_WEIGHT: Record<Jurisdiction, number[]> = {
  外高桥: [0.28, 0.28, 0.27, 0.29, 0.3, 0.31, 0.29, 0.3, 0.38, 0.37, 0.35, 0.34, 0.35, 0.33, 0.34, 0.33, 0.32, 0.31, 0.32, 0.31, 0.31, 0.32, 0.31, 0.32],
  洋山: [0.17, 0.16, 0.16, 0.17, 0.18, 0.18, 0.17, 0.18, 0.14, 0.14, 0.15, 0.17, 0.16, 0.17, 0.17, 0.16, 0.17, 0.18, 0.18, 0.18, 0.17, 0.18, 0.17, 0.18],
  吴淞: [0.31, 0.3, 0.29, 0.31, 0.3, 0.29, 0.31, 0.31, 0.28, 0.28, 0.29, 0.27, 0.28, 0.29, 0.28, 0.29, 0.3, 0.29, 0.29, 0.28, 0.29, 0.28, 0.29, 0.28],
  宝山: [0.24, 0.26, 0.28, 0.23, 0.22, 0.22, 0.23, 0.21, 0.2, 0.21, 0.21, 0.22, 0.21, 0.21, 0.21, 0.22, 0.21, 0.22, 0.21, 0.23, 0.23, 0.22, 0.23, 0.22],
};

const RISK_DIMENSION_JURISDICTION_WEIGHT: Record<string, Partial<Record<Jurisdiction, number>>> = {
  航道内偏航: { 外高桥: 0.26, 洋山: 0.14, 吴淞: 0.22, 宝山: 0.38 },
  反航道航行: { 外高桥: 0.24, 洋山: 0.13, 吴淞: 0.34, 宝山: 0.29 },
  潮汐因素: { 外高桥: 0.25, 洋山: 0.35, 吴淞: 0.2, 宝山: 0.2 },
  非掉头区掉头: { 外高桥: 0.15, 洋山: 0.11, 吴淞: 0.31, 宝山: 0.43 },
  航道内滞航: { 外高桥: 0.36, 洋山: 0.15, 吴淞: 0.18, 宝山: 0.31 },
  进入特定区域: { 外高桥: 0.41, 洋山: 0.17, 吴淞: 0.28, 宝山: 0.14 },
  越锚区出锚: { 外高桥: 0.1, 洋山: 0.18, 吴淞: 0.12, 宝山: 0.6 },
};

const HIGH_RISK_AREA_JURISDICTION_MAP: Record<string, Jurisdiction> = {
  '宝山航道出口（68-66）': '宝山',
  '宝山南航道（A84-A80）': '宝山',
  外高桥航道出口: '外高桥',
  '外高桥航道出口（深水）': '外高桥',
  外高桥航道进口: '外高桥',
  '营迹江下卡航道出口（105下游）': '吴淞',
};

const SHIP_TYPE_JURISDICTION_WEIGHT: Record<string, Partial<Record<Jurisdiction, number>>> = {
  货船: { 外高桥: 0.31, 洋山: 0.24, 吴淞: 0.2, 宝山: 0.25 },
  执法船: { 外高桥: 0.18, 洋山: 0.1, 吴淞: 0.47, 宝山: 0.25 },
  油船: { 外高桥: 0.34, 洋山: 0.18, 吴淞: 0.16, 宝山: 0.32 },
  客船: { 外高桥: 0.08, 洋山: 0.04, 吴淞: 0.58, 宝山: 0.3 },
  从事疏浚或水下作业的船舶: { 外高桥: 0.27, 洋山: 0.08, 吴淞: 0.19, 宝山: 0.46 },
  其他: { 外高桥: 0.25, 洋山: 0.17, 吴淞: 0.28, 宝山: 0.3 },
  '不可用(默认)': { 外高桥: 0.22, 洋山: 0.15, 吴淞: 0.31, 宝山: 0.32 },
};

const ALERT_LEVEL_JURISDICTION_WEIGHT: Record<string, Partial<Record<Jurisdiction, number>>> = {
  紧急: { 外高桥: 0.25, 洋山: 0.15, 吴淞: 0.3, 宝山: 0.3 },
  警报: { 外高桥: 0.29, 洋山: 0.17, 吴淞: 0.28, 宝山: 0.26 },
  警告: { 外高桥: 0.32, 洋山: 0.18, 吴淞: 0.24, 宝山: 0.26 },
  注意: { 外高桥: 0.25, 洋山: 0.12, 吴淞: 0.33, 宝山: 0.3 },
};

function roundBySelection(value: number, weight: number) {
  return Math.max(0, Math.round(value * weight));
}

function DistributionList({
  items,
  accent = '#1ebcff',
}: {
  items: Array<{ name: string; value: number; trend: 'up' | 'down' }>;
  accent?: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="custom-scrollbar space-y-3.5 overflow-y-auto pr-2">
      {items.map((item) => (
        <div key={item.name} className="space-y-1.5 transition-all hover:translate-x-1">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="truncate text-white/60 font-medium">{item.name}</span>
            <span className="flex items-center gap-1 font-black text-[#18c4ff]">
              {item.value}
              {item.trend === 'up' ? (
                <ArrowUpRight size={11} className="text-[#ff5e85]" />
              ) : (
                <ArrowDownRight size={11} className="text-[#17d68d]" />
              )}
            </span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full shadow-[0_0_8px_rgba(24,191,255,0.4)]"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                background: accent,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WarningDashboardTab({
  risks,
  warningRules,
}: WarningDashboardTabProps) {
  const [activeJurisdiction, setActiveJurisdiction] = useState<Jurisdiction | '全辖区'>('全辖区');
  const [analysisTab, setAnalysisTab] = useState<'昨日分析' | '自定义时间'>('昨日分析');
  const [customRange, setCustomRange] = useState({
    start: '2026-05-01T00:00',
    end: '2026-05-06T23:59',
  });

  const selectedJurisdictions = useMemo(() => {
    if (activeJurisdiction === '全辖区') return JURISDICTION_OPTIONS;
    return [activeJurisdiction];
  }, [activeJurisdiction]);

  const jurisdictionWeight = useMemo(() => {
    const weight = selectedJurisdictions.reduce((sum, item) => sum + JURISDICTION_TOTAL_WEIGHT[item], 0);
    return Math.min(weight, 1);
  }, [selectedJurisdictions]);

  const periodLabel =
    analysisTab === '昨日分析'
      ? '2026-05-06'
      : `${customRange.start.split('T')[0]} ~ ${customRange.end.split('T')[0]}`;

  const handleExportReport = () => {
    const reportLines = [
      '风险看板导出报表',
      `分析模式: ${analysisTab}`,
      `统计周期: ${periodLabel}`,
      `辖区范围: ${activeJurisdiction}`,
      `预警总量: ${summary.totalCount}`,
      `高风险船舶: ${summary.highRiskCount}`,
      `平均风险分: ${summary.avgScore}`,
      `启用规则数: ${summary.enabledRules}`,
      '',
      '风险维度分布',
      ...riskDimensionData.map((item) => `${item.name}: ${item.value}`),
      '',
      '高频风险区域',
      ...highRiskAreaData.map((item) => `${item.name}: ${item.value}`),
    ];

    const blob = new Blob([`\ufeff${reportLines.join('\n')}`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `风险看板报表-${analysisTab}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summary = useMemo(() => {
    const avgScore = Math.round(
      risks.reduce((sum, item) => sum + (item.riskScore ?? 0), 0) / Math.max(risks.length, 1),
    );
    return {
      totalCount: roundBySelection(1936, jurisdictionWeight),
      highRiskCount: roundBySelection(
        risks.filter((item) => (item.riskScore ?? 0) >= 80).length,
        jurisdictionWeight,
      ),
      avgScore,
      enabledRules: warningRules.filter((rule) => rule.enabled).length,
    };
  }, [jurisdictionWeight, risks, warningRules]);

  const trendData = useMemo(
    () =>
      TREND_DATA.map((item, index) => {
        const weight = selectedJurisdictions.reduce(
          (sum, jurisdiction) => sum + TREND_JURISDICTION_WEIGHT[jurisdiction][index],
          0,
        );
        return {
          ...item,
          warning: roundBySelection(item.warning, weight),
          tide: item.tide,
        };
      }),
    [selectedJurisdictions],
  );

  const shipTypeData = useMemo(
    () =>
      SHIP_TYPE_DATA.map((item) => {
        const weight = selectedJurisdictions.reduce(
          (sum, jurisdiction) => sum + (SHIP_TYPE_JURISDICTION_WEIGHT[item.name]?.[jurisdiction] ?? 0),
          0,
        );
        return { ...item, value: roundBySelection(item.value, weight) };
      }).filter((item) => item.value > 0),
    [selectedJurisdictions],
  );

  const alertLevelData = useMemo(
    () =>
      ALERT_LEVEL_DATA.map((item) => {
        const weight = selectedJurisdictions.reduce(
          (sum, jurisdiction) => sum + (ALERT_LEVEL_JURISDICTION_WEIGHT[item.name]?.[jurisdiction] ?? 0),
          0,
        );
        return { ...item, value: roundBySelection(item.value, weight) };
      }),
    [selectedJurisdictions],
  );

  const riskDimensionData = useMemo(
    () =>
      RISK_DIMENSION_DATA.map((item) => {
        const weight = selectedJurisdictions.reduce(
          (sum, jurisdiction) => sum + (RISK_DIMENSION_JURISDICTION_WEIGHT[item.name]?.[jurisdiction] ?? 0),
          0,
        );
        return { ...item, value: roundBySelection(item.value, weight) };
      }).filter((item) => item.value > 0),
    [selectedJurisdictions],
  );

  const highRiskAreaData = useMemo(
    () =>
      HIGH_RISK_AREA_DATA.filter((item) =>
        selectedJurisdictions.includes(HIGH_RISK_AREA_JURISDICTION_MAP[item.name]),
      ),
    [selectedJurisdictions],
  );

  const totalAlertLevelValue = alertLevelData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-3.5">
      {/* 紧凑型筛选器头部 */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4">
          {/* 主辖区切换 - 响应用户需求 */}
          <div className="flex items-center gap-1 rounded-xl bg-[#151c27] p-0.5 border border-white/5">
            {(['全辖区', ...JURISDICTION_OPTIONS] as const).map((item) => (
              <button
                key={item}
                onClick={() => setActiveJurisdiction(item)}
                className={`rounded-lg px-3 py-1 text-[10px] font-black transition-all ${
                  activeJurisdiction === item
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-white/30 hover:text-white/60'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/5" />

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">周期:</span>
            <div className="flex bg-[#111823] rounded-lg p-0.5 border border-white/8">
              {(['昨日分析', '自定义时间'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setAnalysisTab(item)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-all ${
                    analysisTab === item
                      ? 'bg-white/10 text-sky-400'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  {item === '昨日分析' ? '昨日' : '自定义'}
                </button>
              ))}
            </div>
          </div>

          {analysisTab === '自定义时间' && (
            <div className="flex items-center gap-2 rounded-xl bg-[#111823] px-2 py-1 border border-white/8">
              <CalendarRange size={12} className="text-sky-400" />
              <input
                type="date"
                value={customRange.start.split('T')[0]}
                onChange={(e) => setCustomRange((current) => ({ ...current, start: e.target.value + 'T00:00' }))}
                className="bg-transparent text-[10px] font-bold text-white outline-none"
              />
              <span className="text-[10px] text-white/20">-</span>
              <input
                type="date"
                value={customRange.end.split('T')[0]}
                onChange={(e) => setCustomRange((current) => ({ ...current, end: e.target.value + 'T23:59' }))}
                className="bg-transparent text-[10px] font-bold text-white outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold leading-none">分析日期</span>
            <span className="text-[10px] font-black text-white/60">{periodLabel}</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-[10px] font-black text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95"
          >
            <Download size={12} />
            导出报告
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.2fr_1.1fr]">
        <Panel className="px-6 py-1 flex flex-col justify-center">
          <div className="grid gap-10 lg:grid-cols-[180px_1fr] items-center">
            <div className="flex flex-col justify-center py-1 space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">总预警次数</div>
                <div className="mt-0.5 text-3xl font-black tracking-tighter text-white">
                  {summary.totalCount.toLocaleString()}
                </div>
              </div>

              <div className="h-px bg-white/5 w-full" />

              <div className="space-y-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-white/20">潮汐统计维度</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">当前平均潮位</span>
                    <span className="font-bold text-sky-400">3.42m</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">潮位关联预警</span>
                    <span className="font-bold text-white/80">
                      {Math.round(summary.totalCount * 0.22).toLocaleString()} 次
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="py-1">
              <SectionTitle title="预警趋势分析" />
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ left: -25, right: -20, top: 5, bottom: 0 }}>
                    <XAxis
                      dataKey="hour"
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a1018',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '11px',
                      }}
                      itemStyle={{ padding: '2px 0' }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="warning"
                      name="预警次数"
                      stroke="#18bfff"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#18bfff' }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="handled"
                      name="干预次数"
                      stroke="#17d6a2"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="p-4 flex flex-col">
          <SectionTitle title="风险维度分布" />
          <div className="flex-1 overflow-hidden">
            <DistributionList items={riskDimensionData} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="p-4">
          <SectionTitle title="预警船舶类型" />
          <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shipTypeData}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    stroke="transparent"
                  >
                    {shipTypeData.map((entry, index) => (
                      <Cell 
                        key={entry.name} 
                        fill={SHIP_TYPE_COLORS[index % SHIP_TYPE_COLORS.length]}
                        className="transition-all hover:opacity-80 cursor-pointer" 
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="custom-scrollbar max-h-[140px] space-y-2.5 overflow-y-auto pr-1">
              {shipTypeData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-[11px] group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: SHIP_TYPE_COLORS[index % SHIP_TYPE_COLORS.length] }}
                    />
                    <span className="text-white/50 group-hover:text-white/80 transition-colors">{item.name}</span>
                  </div>
                  <span className="font-bold text-white/80">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle title="预警等级占比" />
          <div className="grid gap-4 lg:grid-cols-[120px_1fr]">
            <div className="relative h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertLevelData}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    stroke="transparent"
                  >
                    {alertLevelData.map((entry, index) => (
                      <Cell 
                        key={entry.name} 
                        fill={ALERT_LEVEL_COLORS[index % ALERT_LEVEL_COLORS.length]}
                        className="transition-all hover:opacity-80 cursor-pointer" 
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[18px] font-black text-white/80">{totalAlertLevelValue}</div>
                <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">总计</div>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {alertLevelData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-[11px] group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: ALERT_LEVEL_COLORS[index % ALERT_LEVEL_COLORS.length], color: ALERT_LEVEL_COLORS[index % ALERT_LEVEL_COLORS.length] }}
                    />
                    <span className="text-white/50 group-hover:text-white/80 transition-colors">{item.name}</span>
                  </div>
                  <span className="font-bold text-white/80">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-4">
          <SectionTitle title="高频风险区域排行" />
          <div className="h-[140px] flex flex-col">
            <DistributionList items={highRiskAreaData} />
          </div>
        </Panel>
      </div>

      <Panel className="p-4">
        <SectionTitle title="高风险关注名单 (当日)" />
        <WarningDashboardFocusList items={FOCUS_LIST} />
      </Panel>
    </div>
  );
}
