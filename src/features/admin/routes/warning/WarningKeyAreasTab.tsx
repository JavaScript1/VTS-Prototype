import React, { useMemo, useState } from 'react';
import { 
  Shield, 
  TrendingUp, 
  Users, 
  ChevronDown, 
  Search,
  PieChart as PieChartIcon,
  BarChart3,
  Anchor,
  AlertCircle,
  Calendar,
  Activity
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  LineChart,
  Legend,
} from 'recharts';

// --- Types ---
type Jurisdiction = '外高桥' | '洋山' | '吴淞' | '宝山';
type SpecialArea = '圆圆沙警戒区' | '吴淞口警戒区' | '核心航道' | '锚地群';
type TimeRange = '最近24小时' | '自定义时间';

// --- Mock Data ---
const JURISDICTIONS: Jurisdiction[] = ['外高桥', '洋山', '吴淞', '宝山'];
const AREAS_BY_JURISDICTION: Record<Jurisdiction, SpecialArea[]> = {
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

// --- Sub-components ---
function SectionTitle({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <div className="h-3 w-1 rounded-full bg-[#18c4ff]" />
      {icon && <span className="text-white/60">{icon}</span>}
      <h3 className="text-[12px] font-black text-white">{title}</h3>
    </div>
  );
}

const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-[#15304b] bg-[radial-gradient(circle_at_top,_rgba(20,44,74,0.32),_rgba(10,15,24,0.96)_58%)] shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

function Dropdown({ 
  label, 
  value, 
  options, 
  onChange 
}: { 
  label: string; 
  value: string; 
  options: string[]; 
  onChange: (val: any) => void 
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-wider text-white/30 ml-1">{label}</span>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-36 rounded-lg border border-white/10 bg-[#111823] py-1.5 pl-3 pr-8 text-[11px] font-bold text-white outline-none transition-all focus:border-[#18c4ff]/50 hover:bg-[#1a222d]"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-[#0a1018]">{opt}</option>
          ))}
        </select>
        <ChevronDown size={10} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-white/60" />
      </div>
    </div>
  );
}

// --- Main Component ---
export default function WarningKeyAreasTab() {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('外高桥');
  const [area, setArea] = useState<string>(AREAS_BY_JURISDICTION['外高桥'][0]);
  const [timeRange, setTimeRange] = useState<TimeRange>('最近24小时');

  const handleJurisdictionChange = (val: Jurisdiction) => {
    setJurisdiction(val);
    setArea(AREAS_BY_JURISDICTION[val][0]);
  };

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-hidden">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <Dropdown 
            label="所属辖区" 
            value={jurisdiction} 
            options={JURISDICTIONS} 
            onChange={handleJurisdictionChange} 
          />
          <Dropdown 
            label="监控区域" 
            value={area} 
            options={AREAS_BY_JURISDICTION[jurisdiction]} 
            onChange={setArea} 
          />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider text-white/30 ml-1">时间维度</span>
            <div className="flex bg-[#111823] rounded-lg p-0.5 border border-white/10">
              {(['最近24小时', '自定义时间'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    timeRange === t 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {timeRange === '自定义时间' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#111823] text-[10px] text-white/60">
              <Calendar size={12} />
              <span>2026-05-08 ~ 2026-05-09</span>
            </div>
          )}
          <button className="flex items-center gap-2 rounded-lg bg-[#18c4ff] px-4 py-1.5 text-[11px] font-black text-white shadow-md transition-all hover:bg-[#35ccff] active:scale-95">
            <Search size={12} />
            执行分析
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left: Stats & Trends */}
        <div className="col-span-8 flex flex-col gap-3 min-h-0">
          {/* Top Stats Row - Now inside 8-col layout */}
          <div className="grid grid-cols-4 gap-2.5 shrink-0">
            {[
              { label: '碰撞预警触发', value: '452', unit: '次', color: 'text-red-400', icon: AlertCircle, sub: '较昨日 +12%' },
              { label: '区域交通流量', value: '1,284', unit: '艘', color: 'text-sky-400', icon: Activity, sub: '峰值 256 艘/h' },
              { label: '重点监管船舶', value: '53', unit: '艘', color: 'text-amber-400', icon: Anchor, sub: '危化品/油轮/客运' },
              { label: '在航船舶总数', value: '124', unit: '艘', color: 'text-white', icon: Users, sub: '当前区域实时' },
            ].map((item, i) => (
              <Panel key={i} className="px-4 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="text-[10px] text-white/40 font-bold">{item.label}</div>
                  <item.icon size={13} className={item.color} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-black ${item.color}`}>{item.value}</span>
                  <span className="text-[9px] text-white/20 font-bold">{item.unit}</span>
                </div>
                <div className="text-[9px] text-white/25 mt-0.5">{item.sub}</div>
              </Panel>
            ))}
          </div>

          <Panel className="flex-1 p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <SectionTitle title="预警触发与流量综合态势" icon={<TrendingUp size={14} />} />
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle" 
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '10px' }} 
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="warnings" 
                    name="预警次数" 
                    stroke="#ff5e85" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#ff5e85', strokeWidth: 0 }} 
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="flow" 
                    name="交通流量" 
                    stroke="#18c4ff" 
                    strokeWidth={3} 
                    dot={{ r: 3, fill: '#18c4ff', strokeWidth: 0 }} 
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Right: Distributions */}
        <div className="col-span-4 flex flex-col gap-3 min-h-0">
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
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    width={60}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#0a1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="value" name="占比 (%)" radius={[0, 4, 4, 0]} barSize={12}>
                    {VESSEL_TYPE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/5">
              {VESSEL_TYPE_DATA.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-[10px]">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-white/40 truncate">{item.name}</span>
                  <span className="text-white/80 font-bold ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="flex-1 p-5 flex flex-col min-h-0">
            <SectionTitle title="重点船舶监管详情" icon={<Shield size={12} />} />
            <div className="space-y-3 mt-3 overflow-y-auto pr-1 custom-scrollbar">
              {KEY_VESSEL_DATA.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/60">{item.name}</span>
                    <span className="text-white font-black">{item.value} 艘</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(item.value / 30) * 100}%`, backgroundColor: item.color }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] text-white/30">
                <span>重点船舶总占比</span>
                <span className="text-amber-400 font-black text-[12px]">42.7%</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
