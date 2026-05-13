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
} from 'recharts';
import { Panel, SectionTitle, FilterSelect } from './SharedComponents';

// --- Types ---
type Jurisdiction = '外高桥' | '洋山' | '吴淞' | '宝山';
type SpecialArea = '圆圆沙警戒区' | '吴淞口警戒区' | '核心航道' | '锚地群';
type TimeRange = '最近24小时' | '自定义时间';

// --- Mock Data ---
const JURISDICTIONS: Jurisdiction[] = ['外高桥', '洋山', '吴淞', '宝山'];
const AREAS_BY_JURISDICTION: Record<Jurisdiction, string[]> = {
  '外高桥': ['圆圆沙警戒区', '吴淞口警戒区'],
  '洋山': ['核心航道', '锚地群'],
  '吴淞': ['核心航道'],
  '宝山': ['锚地群']
};

const VESSEL_TYPE_DATA = [
  { name: '集装箱船', value: 45, color: '#18c4ff' },
  { name: '油船', value: 25, color: '#ff5e85' },
  { name: '散货船', value: 15, color: '#ffb946' },
  { name: '其他', value: 15, color: '#7c3aed' },
];

const KEY_VESSEL_DATA = [
  { name: '危险品船', value: 12, color: '#ff5e85' },
  { name: '油船', value: 28, color: '#ffb946' },
  { name: '客船', value: 8, color: '#18c4ff' },
  { name: '游轮', value: 5, color: '#17d68d' },
];

const TREND_DATA = [
  { time: '00:00', warnings: 12, flow: 124 },
  { time: '04:00', warnings: 8, flow: 98 },
  { time: '08:00', warnings: 45, flow: 256 },
  { time: '12:00', warnings: 32, flow: 210 },
  { time: '16:00', warnings: 58, flow: 288 },
  { time: '20:00', warnings: 24, flow: 156 },
  { time: '23:59', warnings: 15, flow: 110 },
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
          <button className="flex items-center gap-2 rounded-lg bg-[#18c4ff] px-4 py-1.5 text-[10px] font-black text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 active:scale-95">
            <Search size={12} />
            执行分析
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="col-span-8 flex flex-col gap-3 min-h-0">
          {/* 紧凑型指标行 */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {[
              { label: '风险触发', value: '452', unit: '次', color: 'text-[#ff5e85]', icon: AlertCircle, trend: '+12%', up: true },
              { label: '瞬时流量', value: '1,284', unit: '艘', color: 'text-sky-400', icon: Activity, trend: '256/h', up: true },
              { label: '监管船舶', value: '53', unit: '艘', color: 'text-amber-400', icon: Anchor, trend: '-3%', up: false },
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
            <SectionTitle title="预警触发与交通流量趋势" icon={<TrendingUp size={14} />} />
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '10px' }} 
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="warnings" 
                    name="预警次数" 
                    stroke="#ff5e85" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 4, fill: '#ff5e85', strokeWidth: 0 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="flow" 
                    name="交通流量" 
                    stroke="#18c4ff" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 4, fill: '#18c4ff', strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="col-span-4 flex flex-col gap-3 min-h-0">
          {/* 区域横向对比 - 空间聚焦表达增强 */}
          <Panel className="p-5 flex flex-col shrink-0 h-[220px]">
            <SectionTitle title="区域风险指数对比" icon={<LayoutDashboard size={12} />} />
            <div className="flex-1 min-h-0 -mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={COMPARISON_DATA}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                  <Radar
                    name="当前区域"
                    dataKey="A"
                    stroke="#18c4ff"
                    fill="#18c4ff"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="全区均值"
                    dataKey="B"
                    stroke="#ffb946"
                    fill="#ffb946"
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
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    width={60}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: '#0a1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
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
