import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  Filter, 
  Download,
  AlertTriangle,
  Waves,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';

// --- Types ---
type TimeRange = '24h' | '7d' | '30d' | '自定义';
type WarningType = '全部' | '碰撞预警' | '区域入侵' | '超速预警' | '走锚预警';

// --- Mock Data for Heatmap ---
// Generate a grid of points for the heatmap
const generateHeatmapData = () => {
  const data = [];
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 30; x++) {
      // Create some "hot spots"
      const intensity = Math.floor(
        Math.random() * 20 + 
        (Math.sin(x / 3) * Math.cos(y / 2) * 50 + 50) * 
        (Math.random() > 0.8 ? 1.5 : 0.5)
      );
      data.push({ x, y, intensity });
    }
  }
  return data;
};

const HEATMAP_DATA = generateHeatmapData();

// --- Sub-components ---
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
export default function MacroTrendTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [warningType, setWarningType] = useState<WarningType>('全部');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Intensity color mapping
  const getIntensityColor = (intensity: number) => {
    if (intensity > 80) return 'rgba(239, 68, 68, 0.8)'; // Red
    if (intensity > 60) return 'rgba(249, 115, 22, 0.7)'; // Orange
    if (intensity > 40) return 'rgba(234, 179, 8, 0.6)'; // Yellow
    if (intensity > 20) return 'rgba(14, 165, 233, 0.4)'; // Blue
    return 'rgba(14, 165, 233, 0.1)'; // Faint Blue
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <Dropdown 
            label="预警类型" 
            value={warningType} 
            options={['全部', '碰撞预警', '区域入侵', '超速预警', '走锚预警']} 
            onChange={setWarningType} 
          />
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider text-white/30 ml-1">时间维度</span>
            <div className="flex bg-[#111823] rounded-lg p-0.5 border border-white/10">
              {([
                { id: '24h', label: '24小时' },
                { id: '7d', label: '7天' },
                { id: '30d', label: '30天' },
                { id: '自定义', label: '自定义' }
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeRange(t.id)}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                    timeRange === t.id 
                      ? 'bg-sky-500 text-white shadow-sm' 
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {timeRange === '自定义' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-[#111823] text-[10px] text-white/60">
              <Calendar size={12} />
              <span>2026-04-11 ~ 2026-05-11</span>
            </div>
          )}
          <button className="flex items-center gap-2 rounded-lg bg-[#18c4ff] px-4 py-1.5 text-[11px] font-black text-white shadow-md transition-all hover:bg-[#35ccff] active:scale-95">
            <Search size={12} />
            生成热力图
          </button>
        </div>
      </div>

      {/* Main Heatmap Area */}
      <Panel className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/10 text-amber-500">
              <AlertTriangle size={14} />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">全辖区预警热力分布态势</h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-white/40">
              <Waves size={10} />
              <span>基于当前筛选条件下的聚合分析</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
              <Download size={14} />
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-[#02060a] p-8 min-h-0">
          {/* Heatmap Grid Simulation */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ 
                 backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', 
                 backgroundSize: '24px 24px' 
               }} 
          />
          
          <div className="w-full h-full relative grid grid-cols-[repeat(30,1fr)] grid-rows-[repeat(20,1fr)] gap-1">
            {HEATMAP_DATA.map((point, i) => (
              <div 
                key={i}
                className="rounded-sm transition-all duration-700 hover:scale-150 hover:z-10 hover:shadow-xl cursor-crosshair group relative"
                style={{ 
                  backgroundColor: getIntensityColor(point.intensity),
                  filter: `blur(${12 - (point.intensity / 10)}px)`,
                  opacity: point.intensity / 100 + 0.1
                }}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="bg-[#0f172a] border border-white/10 rounded px-2 py-1 shadow-2xl whitespace-nowrap">
                    <div className="text-[10px] font-black text-white">预警密度: {point.intensity}</div>
                    <div className="text-[8px] text-white/40">坐标: {point.x}, {point.y}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
            <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">密度图例</div>
            <div className="flex flex-col gap-1.5">
              {[
                { label: '高危区域', color: 'bg-red-500' },
                { label: '预警频发', color: 'bg-orange-500' },
                { label: '中度风险', color: 'bg-yellow-500' },
                { label: '常规监控', color: 'bg-sky-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`h-1.5 w-3 rounded-full ${item.color}`} />
                  <span className="text-[9px] text-white/60">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map Overlay Simulation */}
          <div className="absolute top-6 left-6 p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/5 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <Info size={10} className="text-sky-400" />
              <span className="text-[9px] font-bold text-white/80">热力态势说明</span>
            </div>
            <p className="text-[8px] leading-relaxed text-white/40 max-w-[180px]">
              当前热力图基于历史预警触发现场坐标进行空间聚合分析。红色区域代表在选定时间内预警密度极高的重点监管水域，建议加强巡航。
            </p>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center gap-6 p-4 bg-white/[0.02] border-t border-white/5 overflow-x-auto shrink-0">
          {[
            { label: '最高密度中心', value: '吴淞口警戒区' },
            { label: '平均预警密度', value: '12.4 次/km²' },
            { label: '密度环比增长', value: '+8.2%', color: 'text-red-400' },
            { label: '分析覆盖点位', value: '12,482 个' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-0.5 min-w-fit">
              <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{stat.label}</span>
              <span className={`text-[12px] font-black ${stat.color || 'text-white'}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
