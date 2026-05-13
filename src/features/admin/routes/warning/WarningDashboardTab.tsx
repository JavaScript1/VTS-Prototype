import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarRange, Check, Download, MapPinned } from 'lucide-react';
import {
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

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="h-3.5 w-1 rounded-full bg-[#18c4ff]" />
      <h3 className="text-[13px] font-black text-white">{title}</h3>
    </div>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[24px] border border-[#15304b] bg-[radial-gradient(circle_at_top,_rgba(20,44,74,0.32),_rgba(10,15,24,0.96)_58%)] shadow-[0_10px_30px_rgba(0,0,0,0.28)] ${className}`}
    >
      {children}
    </div>
  );
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
    <div className="custom-scrollbar space-y-4 overflow-y-auto pr-2">
      {items.map((item) => (
        <div key={item.name} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className="truncate text-white/72">{item.name}</span>
            <span className="flex items-center gap-1 font-bold text-[#18c4ff]">
              {item.value}
              {item.trend === 'up' ? (
                <ArrowUpRight size={12} className="text-[#ff5e85]" />
              ) : (
                <ArrowDownRight size={12} className="text-[#17d68d]" />
              )}
            </span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full"
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
  const [analysisTab, setAnalysisTab] = useState<'昨日分析' | '自定义时间'>('昨日分析');
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<Jurisdiction[]>(JURISDICTION_OPTIONS);
  const [customRange, setCustomRange] = useState({
    start: '2026-05-01T00:00',
    end: '2026-05-06T23:59',
  });

  const jurisdictionWeight = useMemo(() => {
    const weight = selectedJurisdictions.reduce((sum, item) => sum + JURISDICTION_TOTAL_WEIGHT[item], 0);
    return Math.min(weight, 1);
  }, [selectedJurisdictions]);

  const jurisdictionLabel = useMemo(() => {
    if (selectedJurisdictions.length === JURISDICTION_OPTIONS.length) return '全部辖区';
    return selectedJurisdictions.join('、');
  }, [selectedJurisdictions]);

  const periodLabel =
    analysisTab === '昨日分析'
      ? '2026-05-06 00:00:00 至 2026-05-06 23:59:59'
      : `${customRange.start.replace('T', ' ')}:00 至 ${customRange.end.replace('T', ' ')}:00`;

  const toggleJurisdiction = (target: Jurisdiction) => {
    setSelectedJurisdictions((current) => {
      if (current.includes(target)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== target);
      }
      return [...current, target];
    });
  };

  const handleExportReport = () => {
    const reportLines = [
      '风险看板导出报表',
      `分析模式: ${analysisTab}`,
      `统计周期: ${periodLabel}`,
      `辖区范围: ${jurisdictionLabel}`,
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
          handled: Math.max(0, roundBySelection(item.handled, weight)),
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
      <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-[#151c27] p-1">
            {(['昨日分析', '自定义时间'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setAnalysisTab(item)}
                className={`rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all ${
                  analysisTab === item
                    ? 'bg-[#18bfff] text-white shadow-[0_0_18px_rgba(24,191,255,0.35)]'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {analysisTab === '自定义时间' && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#1a3347] bg-[#0d1620] px-3 py-1.5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/55">
                <CalendarRange size={13} className="text-sky-400" />
                时间范围
              </div>
              <input
                type="datetime-local"
                value={customRange.start}
                onChange={(e) => setCustomRange((current) => ({ ...current, start: e.target.value }))}
                className="rounded-lg border border-white/10 bg-[#111823] px-3 py-1.5 text-[10px] font-medium text-white outline-none transition-all focus:border-sky-400/40"
              />
              <span className="text-[10px] text-white/35">至</span>
              <input
                type="datetime-local"
                value={customRange.end}
                onChange={(e) => setCustomRange((current) => ({ ...current, end: e.target.value }))}
                className="rounded-lg border border-white/10 bg-[#111823] px-3 py-1.5 text-[10px] font-medium text-white outline-none transition-all focus:border-sky-400/40"
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#1a3347] bg-[#0d1620] px-3 py-1.5">
            <div className="flex items-center gap-2 pr-1 text-[10px] font-bold text-white/55">
              <MapPinned size={13} className="text-sky-400" />
              辖区选择
            </div>
            <button
              onClick={() => setSelectedJurisdictions(JURISDICTION_OPTIONS)}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all ${
                selectedJurisdictions.length === JURISDICTION_OPTIONS.length
                  ? 'border-sky-400/50 bg-sky-500/20 text-sky-300'
                  : 'border-white/10 bg-white/[0.03] text-white/45 hover:text-white/70'
              }`}
            >
              全部
            </button>
            {JURISDICTION_OPTIONS.map((item) => {
              const active = selectedJurisdictions.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => toggleJurisdiction(item)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all ${
                    active
                      ? 'border-sky-400/50 bg-sky-500/15 text-sky-200'
                      : 'border-white/10 bg-white/[0.03] text-white/45 hover:text-white/70'
                  }`}
                >
                  {active && <Check size={11} />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1 text-right">
            <div className="text-[10px] font-bold text-sky-300/90">{jurisdictionLabel}</div>
            <div className="rounded-full border border-[#1b5074] bg-[#0d2537] px-4 py-1.5 text-[10px] text-white/78">
              统计周期: {periodLabel}
            </div>
          </div>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/12 px-3.5 py-1.5 text-[10px] font-bold text-sky-200 transition-all hover:bg-sky-500/18 hover:text-white"
          >
            <Download size={13} />
            导出报表
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-4 w-1 rounded-full bg-[#18c4ff]" />
        <h2 className="text-[14px] font-black text-white">昨日风险态势分析报告</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.2fr_1.1fr]">
        <Panel className="p-5">
          <div className="grid gap-5 lg:grid-cols-[160px_1fr]">
            <div className="flex flex-col justify-center">
              <div className="text-[12px] text-white/42">昨日数量总览</div>
              <div className="mt-2.5 text-5xl font-black tracking-tight text-white">
                {summary.totalCount.toLocaleString()}
              </div>
              <div className="mt-1.5 text-[11px] text-white/35">总计预警触发次数</div>
            </div>

            <div>
              <SectionTitle title="预警趋势" />
              <div className="h-[188px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#516173', fontSize: 11 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#516173', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a1018',
                        border: '1px solid rgba(69,116,158,0.35)',
                        borderRadius: '14px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="warning"
                      stroke="#18bfff"
                      strokeWidth={3}
                      dot={{ r: 2.5, stroke: '#18bfff', fill: '#18bfff' }}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="handled"
                      stroke="#17d6a2"
                      strokeWidth={2}
                      dot={{ r: 2, stroke: '#17d6a2', fill: '#17d6a2' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1.5 flex justify-end gap-4 text-[10px] text-white/36">
                <span className="flex items-center gap-2">
                  <span className="h-[3px] w-4 rounded-full bg-[#18bfff]" />
                  预警次数
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-[3px] w-4 rounded-full bg-[#17d6a2]" />
                  干预次数
                </span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="p-4.5">
          <SectionTitle title="风险维度分布" />
          <div className="h-[188px]">
            <DistributionList items={riskDimensionData} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="p-4.5">
          <SectionTitle title="风险船舶的类型分布" />
          <div className="grid gap-3 lg:grid-cols-[168px_1fr]">
            <div className="h-[188px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shipTypeData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={46}
                    outerRadius={66}
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {shipTypeData.map((entry, index) => (
                      <Cell key={entry.name} fill={SHIP_TYPE_COLORS[index % SHIP_TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="custom-scrollbar max-h-[188px] space-y-2.5 overflow-y-auto pr-2">
              {shipTypeData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-4 text-[11px]">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SHIP_TYPE_COLORS[index % SHIP_TYPE_COLORS.length] }}
                    />
                    <span className="truncate text-white/70">{item.name}</span>
                  </div>
                  <span className="shrink-0 text-white/82">{item.value}次</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-4.5">
          <SectionTitle title="预警等级占比" />
          <div className="grid gap-3 lg:grid-cols-[168px_1fr]">
            <div className="relative h-[188px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertLevelData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={46}
                    outerRadius={66}
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {alertLevelData.map((entry, index) => (
                      <Cell key={entry.name} fill={ALERT_LEVEL_COLORS[index % ALERT_LEVEL_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[10px] text-white/28">警告</div>
                <div className="mt-1 text-xl font-black text-white/30">
                  {alertLevelData[2]?.value ?? 0}
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-1">
              {alertLevelData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: ALERT_LEVEL_COLORS[index % ALERT_LEVEL_COLORS.length] }}
                    />
                    <span className="text-white/70">{item.name}</span>
                  </div>
                  <span className="text-white/82">{item.value}次</span>
                </div>
              ))}
              <div className="pt-3 text-[11px] text-white/18">总计 {totalAlertLevelValue} 次</div>
            </div>
          </div>
        </Panel>

        <Panel className="p-4.5">
          <SectionTitle title="高频风险区域" />
          <div className="h-[188px]">
            <DistributionList items={highRiskAreaData} />
          </div>
        </Panel>
      </div>

      <Panel className="p-4.5">
        <SectionTitle title="高风险关注名单" />
        <WarningDashboardFocusList items={FOCUS_LIST} />
      </Panel>
    </div>
  );
}
