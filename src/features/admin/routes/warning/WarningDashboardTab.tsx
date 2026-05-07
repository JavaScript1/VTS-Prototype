import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
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

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="h-4 w-1 rounded-full bg-[#18c4ff]" />
      <h3 className="text-sm font-black text-white">{title}</h3>
    </div>
  );
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[28px] border border-[#15304b] bg-[radial-gradient(circle_at_top,_rgba(20,44,74,0.32),_rgba(10,15,24,0.96)_58%)] shadow-[0_10px_30px_rgba(0,0,0,0.28)] ${className}`}
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
  const [analysisTab, setAnalysisTab] = useState<'昨日分析' | '月度分析' | '年度分析'>('昨日分析');

  const summary = useMemo(() => {
    const avgScore = Math.round(
      risks.reduce((sum, item) => sum + (item.riskScore ?? 0), 0) / Math.max(risks.length, 1),
    );
    return {
      totalCount: 1936,
      highRiskCount: risks.filter((item) => (item.riskScore ?? 0) >= 80).length,
      avgScore,
      enabledRules: warningRules.filter((rule) => rule.enabled).length,
    };
  }, [risks, warningRules]);

  const shipTypeData = SHIP_TYPE_DATA;
  const alertLevelData = ALERT_LEVEL_DATA;
  const riskDimensionData = RISK_DIMENSION_DATA;
  const highRiskAreaData = HIGH_RISK_AREA_DATA;
  const totalAlertLevelValue = alertLevelData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-[#151c27] p-1">
          {(['昨日分析', '月度分析', '年度分析'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setAnalysisTab(item)}
              className={`rounded-lg px-4 py-2 text-[12px] font-bold transition-all ${
                analysisTab === item
                  ? 'bg-[#18bfff] text-white shadow-[0_0_18px_rgba(24,191,255,0.35)]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="rounded-full border border-[#1b5074] bg-[#0d2537] px-4 py-2 text-[11px] text-white/78">
          统计周期: 2026-05-06 00:00:00 至 2026-05-06 23:59:59
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-4 w-1 rounded-full bg-[#18c4ff]" />
        <h2 className="text-[15px] font-black text-white">昨日风险态势分析报告</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2.2fr_1.1fr]">
        <Panel className="p-6">
          <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
            <div className="flex flex-col justify-center">
              <div className="text-[13px] text-white/42">昨日数量总览</div>
              <div className="mt-3 text-6xl font-black tracking-tight text-white">
                {summary.totalCount.toLocaleString()}
              </div>
              <div className="mt-2 text-[12px] text-white/35">总计预警触发次数</div>
            </div>

            <div>
              <SectionTitle title="预警趋势" />
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={TREND_DATA} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
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
              <div className="mt-2 flex justify-end gap-5 text-[11px] text-white/36">
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

        <Panel className="p-5">
          <SectionTitle title="风险维度分布" />
          <div className="h-[210px]">
            <DistributionList items={riskDimensionData} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="p-5">
          <SectionTitle title="风险船舶的类型分布" />
          <div className="grid gap-4 lg:grid-cols-[190px_1fr]">
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shipTypeData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={74}
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
            <div className="custom-scrollbar max-h-[210px] space-y-3 overflow-y-auto pr-2">
              {shipTypeData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-4 text-[12px]">
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

        <Panel className="p-5">
          <SectionTitle title="预警等级占比" />
          <div className="grid gap-4 lg:grid-cols-[190px_1fr]">
            <div className="relative h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertLevelData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={74}
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
                <div className="text-[11px] text-white/28">警告</div>
                <div className="mt-1 text-2xl font-black text-white/30">
                  {alertLevelData[2].value}
                </div>
              </div>
            </div>
            <div className="space-y-4 pt-2">
              {alertLevelData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-[12px]">
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
              <div className="pt-4 text-[12px] text-white/18">总计 {totalAlertLevelValue} 次</div>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle title="高频风险区域" />
          <div className="h-[210px]">
            <DistributionList items={highRiskAreaData} />
          </div>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionTitle title="高风险关注名单" />
        <WarningDashboardFocusList items={FOCUS_LIST} />
      </Panel>
    </div>
  );
}
