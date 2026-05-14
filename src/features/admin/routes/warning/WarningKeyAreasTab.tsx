import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
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
  LayoutDashboard,
  Waves,
  Pointer,
  Navigation
} from 'lucide-react';
import {
  Cell,
  ResponsiveContainer,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Line,
  LineChart,
  Legend as RechartsLegend,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { Panel, SectionTitle, FilterSelect } from './SharedComponents';

// --- Types ---
type Jurisdiction = '外高桥' | '洋山' | '吴淞' | '宝山';
type TimeRange = '最近24小时' | '自定义时间';

// --- Color Palette (Professional/Maritime) ---
const COLORS = {
  warning: '#FF6B6B',    // Sunset Coral (Warnings)
  handled: '#4ECDC4',    // Seafoam Teal (Interventions)
  tide: '#45B7D1',       // Sky Blue (Tide)
  bg: 'transparent',
  text: 'rgba(255, 255, 255, 0.4)',
  axis: 'rgba(255, 255, 255, 0.1)'
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
  { name: '集装箱船', value: 45, color: '#18c4ff' },
  { name: '油船', value: 25, color: '#ff5e85' },
  { name: '散货船', value: 15, color: '#ffb946' },
  { name: '危险品船', value: 10, color: '#7c3aed' },
  { name: '其他', value: 5, color: 'rgba(255,255,255,0.1)' },
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

// --- Sub-component: ECharts Trend ---
function TrendChart({ data }: { data: typeof TREND_DATA }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current);
    
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 16, 24, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        textStyle: { color: '#fff', fontSize: 11 },
        padding: [8, 12],
        axisPointer: { type: 'shadow' }
      },
      legend: {
        right: 0,
        top: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 10 },
        icon: 'rect'
      },
      grid: {
        left: '2%',
        right: '2%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.time),
        axisLine: { lineStyle: { color: COLORS.axis } },
        axisTick: { show: false },
        axisLabel: { color: COLORS.text, fontSize: 10 }
      },
      yAxis: [
        {
          type: 'value',
          name: '次数',
          nameTextStyle: { color: COLORS.text, fontSize: 9 },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: COLORS.axis, type: 'dashed' } },
          axisLabel: { color: COLORS.text, fontSize: 10 }
        },
        {
          type: 'value',
          name: '潮位(m)',
          nameTextStyle: { color: COLORS.text, fontSize: 9 },
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: COLORS.text, fontSize: 10 }
        }
      ],
      series: [
        {
          name: '预警',
          type: 'bar',
          data: data.map(item => item.warnings),
          barWidth: 12,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#FF7676' },
              { offset: 1, color: 'rgba(255, 118, 118, 0.2)' }
            ]),
            borderRadius: [2, 2, 0, 0]
          }
        },
        {
          name: '干预',
          type: 'bar',
          data: data.map(item => item.handled),
          barWidth: 12,
          barGap: '30%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#26E5D8' },
              { offset: 1, color: 'rgba(38, 229, 216, 0.1)' }
            ]),
            borderRadius: [2, 2, 0, 0]
          }
        },
        {
          name: '潮汐',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: data.map(item => item.tide),
          showSymbol: false,
          lineStyle: { width: 3, color: '#45B7D1', shadowBlur: 10, shadowColor: 'rgba(69, 183, 209, 0.5)' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(69, 183, 209, 0.2)' },
              { offset: 1, color: 'transparent' }
            ])
          }
        }
      ]
    };

    myChart.setOption(option);

    const handleResize = () => myChart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      myChart.dispose();
    };
  }, [data]);

  return <div ref={chartRef} className="w-full h-full" />;
}

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

  const { maxTide, minTide, maxTideTime, minTideTime } = useMemo(() => {
    const maxTidePoint = TREND_DATA.reduce((max, current) => (
      current.tide > max.tide ? current : max
    ), TREND_DATA[0]);
    const minTidePoint = TREND_DATA.reduce((min, current) => (
      current.tide < min.tide ? current : min
    ), TREND_DATA[0]);

    return {
      maxTide: maxTidePoint.tide.toFixed(2),
      minTide: minTidePoint.tide.toFixed(2),
      maxTideTime: maxTidePoint.time,
      minTideTime: minTidePoint.time,
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* 紧凑型 Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="ml-1 text-[9px] uppercase tracking-wider text-white/30">所属辖区</span>
            <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-[#151c27] p-0.5">
              {JURISDICTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => handleJurisdictionChange(item)}
                  className={`rounded-lg px-3 py-1 text-[10px] font-black transition-all ${
                    jurisdiction === item
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
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

        <div className="flex items-center gap-3 text-[10px] font-bold text-white/40">
          <Calendar size={12} className="text-sky-400" />
          <span>数据实时更新: 2026-05-14 14:30</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        <div className="col-span-12 flex flex-col gap-3 min-h-0">
          {/* 四大核心指标行 */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            {[
              { label: '累计预警次数', value: '1,284', unit: '次', color: 'text-[#FF7676]', icon: AlertCircle },
              { label: '指挥干预次数', value: '1,156', unit: '次', color: 'text-[#26E5D8]', icon: Pointer },
              { label: '时段最高潮位', value: maxTide, unit: 'm', time: maxTideTime, color: 'text-[#45B7D1]', icon: ArrowUpRight },
              { label: '时段最低潮位', value: minTide, unit: 'm', time: minTideTime, color: 'text-[#7C3AED]', icon: ArrowDownRight },
            ].map((item, i) => (
              <Panel key={i} className="px-4 py-3 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg bg-white/5 ${item.color}`}>
                    <item.icon size={14} />
                  </div>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black ${item.color}`}>{item.value}</span>
                  <span className="text-[10px] text-white/20 font-bold uppercase">{item.unit}</span>
                  {item.time && (
                    <div className="ml-3 flex items-baseline gap-1 text-[10px] font-medium">
                      <span className="text-white/25">时间</span>
                      <span className="text-white/55">{item.time}</span>
                    </div>
                  )}
                </div>
              </Panel>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
            {/* 左侧：预警、干预与潮汐综合趋势 (ECharts) */}
            <Panel className="col-span-8 p-6 flex flex-col min-h-0">
              <SectionTitle title="预警触发、干预与潮汐关联分析" icon={<TrendingUp size={16} />} />
              <div className="flex-1 min-h-0 mt-4">
                <TrendChart data={TREND_DATA} />
              </div>
            </Panel>

            {/* 右侧：预警船舶分布 */}
            <Panel className="col-span-4 p-6 flex flex-col min-h-0">
              <SectionTitle title="预警船舶类型分布" icon={<BarChart3 size={16} />} />
              <div className="flex-1 min-h-0 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={VESSEL_TYPE_DATA}
                    margin={{ left: -10, right: 30, top: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                      width={80}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{ backgroundColor: '#0a1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="value" name="占比 (%)" radius={[0, 4, 4, 0]} barSize={12}>
                      {VESSEL_TYPE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-6 pt-6 border-t border-white/5">
                {VESSEL_TYPE_DATA.map((item) => (
                  <div key={item.name} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                      <span className="text-[11px] text-white/40 group-hover:text-white/70 transition-colors">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/80 font-black">{item.value}%</span>
                      <ArrowUpRight size={10} className="text-white/20" />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
