import React, { useMemo, useState } from 'react';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Search,
  BarChart3,
  Anchor,
  AlertCircle,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard
} from 'lucide-react';
import {
  Cell,
  ResponsiveContainer,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  LineChart,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
} from 'recharts';
import { Panel, SectionTitle, FilterSelect } from './SharedComponents';

// --- Types ---
type Jurisdiction = '外高桥' | '洋山' | '吴淞' | '宝山';
type SpecialArea = '圆圆沙警戒区' | '吴淞口警戒区' | '核心航道' | '锚地群';
type TimeRange = '最近24小时' | '自定义时间';

// --- Color Palette (Modern Cyber/Professional) ---
const COLORS = {
  primary: '#00f2ff',    // Electric Cyan
  secondary: '#7000ff',  // Deep Purple
  success: '#00ffa3',    // Emerald Green
  warning: '#ffe600',    // Bright Yellow/Gold
  danger: '#ff2e63',     // Vivid Pink/Red
  muted: 'rgba(255, 255, 255, 0.2)',
  chartBg: '#0a1018'
};

// --- Mock Data ---
const JURISDICTIONS: Jurisdiction[] = ['外高桥', '洋山', '吴淞', '宝山'];
const AREAS_BY_JURISDICTION: Record<Jurisdiction, string[]> = {
  '外高桥': ['圆圆沙警戒区', '吴淞口警戒区'],
  '洋山': ['核心航道', '锚地群'],
  '吴淞': ['核心航道'],
  '宝山': ['锚地群']
};

const VESSEL_TYPE_DATA = [
  { name: '集装箱船', value: 45, color: COLORS.primary },
  { name: '油船', value: 25, color: COLORS.danger },
  { name: '散货船', value: 15, color: COLORS.warning },
  { name: '其他', value: 15, color: COLORS.secondary },
];

const TREND_DATA = [
  { time: '00:00', warnings: 12, handled: 10, tide: 3.2 },
  { time: '04:00', warnings: 8, handled: 7, tide: 1.5 },
  { time: '08:00', warnings: 45, handled: 38, tide: 2.8 },
  { time: '12:00', warnings: 32, handled: 28, tide: 4.8 },
  { time: '16:00', warnings: 58, handled: 42, tide: 2.8 },
  { time: '20:00', warnings: 24, handled: 20, tide: 1.5 },
  { time: '23:59', warnings: 15, handled: 12, tide: 3.4 },
];

const COMPARISON_DATA = [
  { subject: '碰撞风险', A: 85, B: 65, fullMark: 100 },
  { subject: '区域流速', A: 70, B: 80, fullMark: 100 },
  { subject: '违规频率', A: 90, B: 45, fullMark: 100 },
  { subject: '靠泊压力', A: 65, B: 75, fullMark: 100 },
  { subject: '通航密度', A: 88, B: 70, fullMark: 100 },
];

// --- Main Component ---
export default function WarningKeyAreasTab() {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('外高桥');
  const [area, setArea] = useState<string>(AREAS_BY_JURISDICTION['外高桥'][0]);
  const [timeRange, setTimeRange] = useState<TimeRange>('最近24小时');

  const handleJurisdictionChange = (val: string) => {
    const j = val as Jurisdiction;
    setJurisdiction(j);
    setArea(AREAS_BY_JURISDICTION[j][0]);
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* 紧凑型 Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <FilterSelect 
            label="所属辖区" 
            value={jurisdiction} 
            options={JURISDICTIONS} 
            onChange={handleJurisdictionChange} 
          />
          <FilterSelect 
            label="监控区域" 
            value={area} 
            options={AREAS_BY_JURISDICTION[jurisdiction]} 
            onChange={setArea} 
          />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider text-white/30 ml-1">分析周期</span>
            <div className="flex bg-[#111823] rounded-lg p-0.5 border border-white/8">
              {(['最近24小时', '自定义时间'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                    timeRange === t 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {timeRange === '自定义时间' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/8 bg-[#111823] text-[10px] font-bold text-white/60">
              <Calendar size={12} className="text-sky-400" />
              <span>05-08 ~ 05-09</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="col-span-8 flex flex-col gap-3 min-h-0">
          {/* 紧凑型指标行 */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {[
              { label: '风险触发', value: '452', unit: '次', color: 'text-[#ff2e63]', icon: AlertCircle, trend: '+12%', up: true },
              { label: '瞬时流量', value: '1,284', unit: '艘', color: 'text-[#00f2ff]', icon: Activity, trend: '256/h', up: true },
              { label: '监管船舶', value: '53', unit: '艘', color: 'text-[#ffe600]', icon: Anchor, trend: '-3%', up: false },
              { label: '实时在航', value: '124', unit: '艘', color: 'text-white/90', icon: Users, trend: '稳定', up: null },
            ].map((item, i) => (
              <Panel key={i} className="px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{item.label}</span>
                  <item.icon size={11} className={item.color} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-black ${item.color}`}>{item.value}</span>
                  <span className="text-[8px] text-white/20 font-bold">{item.unit}</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {item.up === true ? <ArrowUpRight size={9} className="text-red-400/80" /> : item.up === false ? <ArrowDownRight size={9} className="text-green-400/80" /> : null}
                  <span className="text-[8px] text-white/20 font-medium">{item.trend}</span>
                </div>
              </Panel>
            ))}
          </div>

          <Panel className="flex-1 p-5 flex flex-col min-h-0">
            <SectionTitle title="预警触发与干预趋势" icon={<TrendingUp size={14} />} />
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="time" 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                    tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                    tick={{ fill: COLORS.muted, fontSize: 10 }} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                    tickLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                    tick={{ fill: COLORS.muted, fontSize: 10 }} 
                  />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: COLORS.muted, fontSize: 10 }} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: COLORS.chartBg, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '10px' }} 
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="warnings" 
                    name="预警次数" 
                    fill={COLORS.primary} 
                    radius={[2, 2, 0, 0]}
                    barSize={12}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="handled" 
                    name="干预次数" 
                    fill={COLORS.success} 
                    radius={[2, 2, 0, 0]}
                    barSize={8}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tide" 
                    name="潮汐高度(m)" 
                    stroke={COLORS.warning} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.warning, strokeWidth: 0 }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="col-span-4 flex flex-col gap-3 min-h-0">
          {/* 区域横向对比 */}
          <Panel className="p-5 flex flex-col shrink-0 h-[220px]">
            <SectionTitle title="区域风险指数对比" icon={<LayoutDashboard size={12} />} />
            <div className="flex-1 min-h-0 -mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={COMPARISON_DATA}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.muted, fontSize: 9 }} />
                  <Radar
                    name="当前区域"
                    dataKey="A"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="全区均值"
                    dataKey="B"
                    stroke={COLORS.secondary}
                    fill={COLORS.secondary}
                    fillOpacity={0.1}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 9 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="flex-1 p-5 flex flex-col min-h-0">
            <SectionTitle title="预警船舶类型分布" icon={<BarChart3 size={12} />} />
            <div className="flex-1 min-h-0 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={VESSEL_TYPE_DATA}
                  margin={{ left: -10, right: 20, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: COLORS.muted, fontSize: 10 }}
                    width={60}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: COLORS.chartBg, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" name="占比 (%)" radius={[0, 4, 4, 0]} barSize={10}>
                    {VESSEL_TYPE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4 pt-4 border-t border-white/5">
              {VESSEL_TYPE_DATA.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-[10px]">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-white/30 truncate flex-1">{item.name}</span>
                  <span className="text-white/70 font-black">{item.value}%</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
