import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Anchor, BarChart3, ChevronDown, ChevronRight, Clock, LayoutGrid, Ship } from 'lucide-react';

type AnchoragePanelProps = {
  anchorages: any[];
  selectedAnchorage: string | null;
  selectedExpiringShip: string | null;
  selectedOvertimeShip: string | null;
  hoveredShipType: string | null;
  hoveredDurationType: string | null;
  anchorageTypeViewMode: 'chart' | 'tags';
  currentTime: Date;
  onSelectAnchorage: (anchorageId: string | null, nextExpiringShipId: string | null) => void;
  onSelectExpiringShip: (shipId: string | null) => void;
  onSelectOvertimeShip: (shipId: string | null) => void;
  onHoveredShipTypeChange: (value: string | null) => void;
  onHoveredDurationTypeChange: (value: string | null) => void;
  onAnchorageTypeViewModeChange: (mode: 'chart' | 'tags') => void;
  getAnchorageTypeStats: (anchorageId: string) => Array<{ type: string; count: number }>;
  getAnchorageDurationStats: (anchorageId: string, occupied: number) => Array<{ type: string; count: number }>;
  getAnchorageAvailabilityRatio: (occupied: number, capacity: number) => number;
  formatAnchorageRemainingDuration: (expiryTime: string, currentTime: Date) => string;
  getAnchorageExpiryMeta: (expiryTime: string) => { date: string; time: string };
  chartColors: string[];
  MarqueeText: React.ComponentType<{ text: string; isHovered: boolean; className?: string }>;
};

export default function AnchoragePanel({
  anchorages,
  selectedAnchorage,
  selectedExpiringShip,
  selectedOvertimeShip,
  hoveredShipType,
  hoveredDurationType,
  anchorageTypeViewMode,
  currentTime,
  onSelectAnchorage,
  onSelectExpiringShip,
  onSelectOvertimeShip,
  onHoveredShipTypeChange,
  onHoveredDurationTypeChange,
  onAnchorageTypeViewModeChange,
  getAnchorageTypeStats,
  getAnchorageDurationStats,
  getAnchorageAvailabilityRatio,
  formatAnchorageRemainingDuration,
  getAnchorageExpiryMeta,
  chartColors,
  MarqueeText,
}: AnchoragePanelProps) {
  React.useEffect(() => {
    if (hoveredShipType) {
      const el = document.querySelector(`[data-ship-type="${hoveredShipType}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [hoveredShipType]);

  React.useEffect(() => {
    if (hoveredDurationType) {
      const el = document.querySelector(`[data-duration-type="${hoveredDurationType}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [hoveredDurationType]);

  return (
    <div className="flex h-full flex-col space-y-2 p-3">
      <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto pr-1">
        {anchorages.map((item) => {
          const typeStats = getAnchorageTypeStats(item.id).slice(0, 10);
          const chartStats = typeStats.slice(0, 8);
          const chartTotal = chartStats.reduce((sum, ship) => sum + ship.count, 0);
          const durationStats = getAnchorageDurationStats(item.id, item.occupied);
          const durationChartStats = durationStats.slice(0, 5);
          const durationChartTotal = durationChartStats.reduce((sum, bucket) => sum + bucket.count, 0);
          const availabilityPercent = Math.round(getAnchorageAvailabilityRatio(item.occupied, item.capacity) * 100);

          const chartGradient = chartStats.length
            ? `conic-gradient(${chartStats.map((ship, idx) => {
                const isHovered = hoveredShipType === ship.type;
                const baseColor = chartColors[idx % chartColors.length];
                const color = hoveredShipType && !isHovered ? `${baseColor}33` : baseColor;
                const start = chartStats.slice(0, idx).reduce((sum, current) => sum + current.count, 0);
                const end = start + ship.count;
                const startPct = (start / chartTotal) * 100;
                const endPct = (end / chartTotal) * 100;
                return `${color} ${startPct}% ${endPct}%`;
              }).join(', ')})`
            : 'conic-gradient(#223043 0% 100%)';
          const durationChartGradient = durationChartStats.length
            ? `conic-gradient(${durationChartStats.map((bucket, idx) => {
                const isHovered = hoveredDurationType === bucket.type;
                const baseColor = chartColors[idx % chartColors.length];
                const color = hoveredDurationType && !isHovered ? `${baseColor}33` : baseColor;
                const start = durationChartStats.slice(0, idx).reduce((sum, current) => sum + current.count, 0);
                const end = start + bucket.count;
                const startPct = durationChartTotal > 0 ? (start / durationChartTotal) * 100 : 0;
                const endPct = durationChartTotal > 0 ? (end / durationChartTotal) * 100 : 0;
                return `${color} ${startPct}% ${endPct}%`;
              }).join(', ')})`
            : 'conic-gradient(#223043 0% 100%)';

          return (
            <motion.div
              key={item.id}
              layout
              className={`group overflow-hidden rounded-xl border bg-[#0F1115] shadow-2xl transition-all ${
                selectedAnchorage === item.id ? 'border-white/10' : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div
                onClick={() =>
                  onSelectAnchorage(
                    selectedAnchorage === item.id ? null : item.id,
                    selectedAnchorage === item.id ? null : item.expiringShips?.[0]?.id ?? null,
                  )
                }
                className="cursor-pointer border-b border-white/5 px-3 py-1.5 transition-all hover:bg-white/[0.02]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#1D3D26]">
                      <Anchor size={16} className="text-[#4DFF88]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-bold leading-none tracking-tight text-white">{item.name}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-[3px] w-[54px] overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-[#4DFF88]" style={{ width: `${Math.max(availabilityPercent, availabilityPercent > 0 ? 8 : 0)}%` }} />
                        </div>
                        <div className="shrink-0 text-[10px] font-bold leading-none text-white/65">{availabilityPercent}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {item.expiringCount > 0 && (
                      <span className="shrink-0 rounded-full border border-[#FF9F43]/20 bg-[#3D2616] px-1.5 py-1 text-[10px] font-bold leading-none text-[#FF9F43]">
                        临期 {item.expiringCount}
                      </span>
                    )}
                    {item.overtimeCount > 0 && (
                      <span className="shrink-0 rounded-full border border-[#FF4D4D]/20 bg-[#3D1D1D] px-1.5 py-1 text-[10px] font-bold leading-none text-[#FF4D4D]">
                        超时 {item.overtimeCount}
                      </span>
                    )}
                    <ChevronRight size={12} className={`shrink-0 text-white/35 transition-transform duration-300 ${selectedAnchorage === item.id ? 'rotate-90 text-white/65' : ''}`} />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {selectedAnchorage === item.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="space-y-2 px-3 py-1.5">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">船舶类型分布</div>
                          <div className="flex rounded-lg border border-white/5 bg-[#1A1D23] p-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAnchorageTypeViewModeChange('chart');
                              }}
                              className={`flex h-5 w-5 items-center justify-center rounded-md transition-colors ${
                                anchorageTypeViewMode === 'chart' ? 'bg-[#252A33] text-[#4DABFF]' : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <BarChart3 size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAnchorageTypeViewModeChange('tags');
                              }}
                              className={`flex h-5 w-5 items-center justify-center rounded-md transition-colors ${
                                anchorageTypeViewMode === 'tags' ? 'bg-[#252A33] text-[#4DABFF]' : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              <LayoutGrid size={10} />
                            </button>
                          </div>
                        </div>
                        {anchorageTypeViewMode === 'chart' ? (
                          <div className="relative flex h-[128px] items-center gap-2 overflow-hidden px-1">
                            <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
                              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                                <AnimatePresence mode="wait">
                                  <motion.div key={hoveredShipType || 'total'} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex w-[50px] flex-col items-center justify-center">
                                    {hoveredShipType && (
                                      <span className="mb-0.5 w-full truncate text-center font-medium leading-tight text-[#4DABFF]/60" style={{ fontSize: hoveredShipType.length > 5 ? '7px' : '9px' }}>
                                        {hoveredShipType}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold leading-tight text-[#4DABFF]">
                                      {hoveredShipType ? `${chartStats.find((s) => s.type === hoveredShipType)?.count ?? 0}艘` : `${chartTotal}艘`}
                                    </span>
                                  </motion.div>
                                </AnimatePresence>
                              </div>
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                whileHover={{ scale: 1.05 }}
                                onMouseMove={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = e.clientX - rect.left - rect.width / 2;
                                  const y = e.clientY - rect.top - rect.height / 2;
                                  const angle = (Math.atan2(y, x) * 180) / Math.PI + 450;
                                  let currentAngle = 0;
                                  for (const ship of chartStats) {
                                    const sweep = (ship.count / chartTotal) * 360;
                                    if (angle % 360 >= currentAngle && angle % 360 < currentAngle + sweep) {
                                      onHoveredShipTypeChange(ship.type);
                                      return;
                                    }
                                    currentAngle += sweep;
                                  }
                                }}
                                onMouseLeave={() => onHoveredShipTypeChange(null)}
                                className="relative flex h-[88px] w-[88px] cursor-pointer items-center justify-center rounded-full shadow-[0_0_20px_rgba(77,171,255,0.1)]"
                                style={{ background: chartGradient }}
                              >
                                <div className="flex h-[56px] w-[56px] flex-col items-center justify-center rounded-full bg-[#1A1D23] shadow-inner" />
                              </motion.div>
                            </div>
                            <div className="custom-scrollbar grid h-[88px] flex-1 grid-cols-1 gap-y-1 overflow-x-hidden overflow-y-auto pr-1">
                              {chartStats.map((ship, idx) => {
                                const ratio = chartTotal > 0 ? Math.round((ship.count / chartTotal) * 100) : 0;
                                return (
                                  <motion.div
                                    key={`${ship.type}-${idx}-chart`}
                                    data-ship-type={ship.type}
                                    initial={{ x: 10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onMouseEnter={() => onHoveredShipTypeChange(ship.type)}
                                    onMouseLeave={() => onHoveredShipTypeChange(null)}
                                    className={`flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 transition-all hover:bg-white/5 ${hoveredShipType === ship.type ? 'bg-white/5 ring-1 ring-white/10' : ''}`}
                                  >
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                                    <MarqueeText text={ship.type} isHovered={hoveredShipType === ship.type} className="text-[10px] leading-none text-gray-400" />
                                    <span className="text-[10px] font-bold text-[#4DABFF]">{ratio}%</span>
                                    <span className="ml-1 text-[10px] text-gray-600">{ship.count}艘</span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 overflow-x-hidden">
                            {typeStats.map((ship, idx) => (
                              <motion.div key={`${ship.type}-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }} className="flex items-center gap-1 rounded-full border border-white/5 bg-[#1A1D23] px-2 py-1 text-[10px] leading-none text-gray-300">
                                <Ship size={11} className="text-[#4DABFF]" />
                                <span>{ship.type}</span>
                                <span className="font-bold text-[#4DABFF]">{ship.count}艘</span>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 border-t border-white/5 py-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">船舶锚泊分布</div>
                        <div className="flex items-center gap-2 px-1">
                          <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
                            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                              <AnimatePresence mode="wait">
                                <motion.div key={hoveredDurationType || 'total'} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex w-[50px] flex-col items-center justify-center">
                                  {hoveredDurationType && (
                                    <span className="mb-0.5 w-full truncate text-center font-medium leading-tight text-[#4DABFF]/60" style={{ fontSize: hoveredDurationType.length > 5 ? '7px' : '9px' }}>
                                      {hoveredDurationType}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold leading-tight text-[#4DABFF]">
                                    {hoveredDurationType ? `${durationChartStats.find((b) => b.type === hoveredDurationType)?.count ?? 0}艘` : `${durationChartTotal}艘`}
                                  </span>
                                </motion.div>
                              </AnimatePresence>
                            </div>
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
                              animate={{ scale: 1, opacity: 1, rotate: 0 }}
                              whileHover={{ scale: 1.05 }}
                              onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left - rect.width / 2;
                                const y = e.clientY - rect.top - rect.height / 2;
                                const angle = (Math.atan2(y, x) * 180) / Math.PI + 450;
                                let currentAngle = 0;
                                for (const bucket of durationChartStats) {
                                  const sweep = (bucket.count / durationChartTotal) * 360;
                                  if (angle % 360 >= currentAngle && angle % 360 < currentAngle + sweep) {
                                    onHoveredDurationTypeChange(bucket.type);
                                    return;
                                  }
                                  currentAngle += sweep;
                                }
                              }}
                              onMouseLeave={() => onHoveredDurationTypeChange(null)}
                              className="relative flex h-[88px] w-[88px] cursor-pointer items-center justify-center rounded-full shadow-[0_0_15px_rgba(77,171,255,0.1)]"
                              style={{ background: durationChartGradient }}
                            >
                              <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#1A1D23] shadow-inner" />
                            </motion.div>
                          </div>
                          <div className="grid flex-1 grid-cols-1 gap-y-1">
                            {durationChartStats.map((bucket, idx) => {
                              const ratio = durationChartTotal > 0 ? Math.round((bucket.count / durationChartTotal) * 100) : 0;
                              return (
                                <motion.div key={`${bucket.type}-${idx}-legend`} data-duration-type={bucket.type} onMouseEnter={() => onHoveredDurationTypeChange(bucket.type)} onMouseLeave={() => onHoveredDurationTypeChange(null)} className={`flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 transition-all hover:bg-white/5 ${hoveredDurationType === bucket.type ? 'bg-white/5 ring-1 ring-white/10' : ''}`}>
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                                  <span className="min-w-0 flex-1 truncate text-[10px] leading-none text-gray-400">{bucket.type}</span>
                                  <span className="text-[10px] font-bold text-[#4DABFF]">{ratio}%</span>
                                  <span className="ml-1 text-[10px] text-gray-600">{bucket.count}艘</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {item.expiringCount > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold leading-none text-[#f7a52c]">{item.expiringCount} 艘锚泊临期</span>
                            <div className="text-[10px] font-bold leading-none text-[#4DABFF]">限时 48H</div>
                          </div>
                          <div className="space-y-1">
                            {item.expiringShips?.map((ship: any) => {
                              const expiryMeta = getAnchorageExpiryMeta(ship.expiryTime);
                              const isExpanded = selectedExpiringShip === ship.id;
                              return (
                                <div key={ship.id} className="group/ship">
                                  <div className={`rounded-lg border transition-all ${isExpanded ? 'border-[#5c4a2f] bg-[#252A33] p-2' : 'border-white/6 bg-[#1A1D23] px-2 py-1.5 hover:border-[#FF9F43]/30'}`}>
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2">
                                        <div onClick={(e) => { e.stopPropagation(); onSelectExpiringShip(isExpanded ? null : ship.id); }} className="flex flex-1 cursor-pointer items-center gap-2 min-w-0 overflow-hidden">
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center gap-1.5 mb-1 min-w-0 overflow-hidden">
                                                <span className="shrink-0 rounded bg-white/5 border border-white/5 px-1.5 py-0.5 text-[9px] font-normal uppercase tracking-wider text-white/60">{ship.type}</span>
                                                <span className="flex items-center gap-1 rounded bg-white/5 border border-white/5 px-1.5 py-0.5 text-[10px] font-bold text-white/80 min-w-0 overflow-hidden">
                                                  <span className="truncate">{ship.name}</span>
                                                  {ship.englishName && <span className="text-[9px] font-medium opacity-40 truncate">({ship.englishName})</span>}
                                                </span>
                                              </div>
                                              <div className="mt-1 text-[10px] leading-none text-white/28">锚泊: {ship.details?.anchorTime || '--'}</div>
                                              <div className="mt-1 text-[10px] font-medium leading-none text-[#f7a52c]">{formatAnchorageRemainingDuration(ship.expiryTime, currentTime)}</div>
                                            </div>                                        </div>
                                        <div className={`flex flex-col gap-1 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                          <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-md bg-[#30343d] px-1.5 py-1 text-[10px] font-black leading-none text-white/45 transition-colors hover:text-white/80 whitespace-nowrap">忽略</button>
                                          <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-md bg-[#3D2616] px-1.5 py-1 text-[10px] font-black leading-none text-[#FF9F43] transition-colors hover:bg-[#4D321D] whitespace-nowrap">提醒</button>
                                        </div>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); onSelectExpiringShip(isExpanded ? null : ship.id); }} className="rounded-lg p-0.5 text-white/20 transition-colors hover:bg-white/5">
                                          <ChevronRight size={10} className={`transition-transform ${isExpanded ? 'rotate-90 text-white/55' : ''}`} />
                                        </button>
                                      </div>

                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-white/5 pt-2"
                                          >
                                            <div className="space-y-1 py-0.5 px-1">
                                              {/* 第一行：身份标识 (MMSI | 呼号 | IMO) */}
                                              <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">MMSI</span>
                                                  <span className="font-mono text-[10px] leading-tight text-white/80">{ship.mmsi || '--'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">呼号</span>
                                                  <span className="font-mono text-[10px] leading-tight text-white/80">{ship.details?.callSign || '--'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">IMO</span>
                                                  <span className="font-mono text-[10px] leading-tight text-white/80">{ship.details?.imo || '--'}</span>
                                                </div>
                                              </div>

                                              {/* 第二行：物理规格 (船籍 | 尺度 | 吃水) */}
                                              <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">船籍</span>
                                                  <span className="truncate text-[10px] leading-tight text-white/80">{ship.details?.flag || '--'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">尺度 (L×W)</span>
                                                  <span className="text-[10px] leading-tight text-white/80">{ship.details?.length}×{ship.details?.width}m</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">吃水</span>
                                                  <span className="text-[10px] leading-tight text-white/80">{ship.details?.draft}m</span>
                                                </div>
                                              </div>

                                              {/* 第三行：航行与业务 (航程 | 货物 | 载重) */}
                                              <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">航程</span>
                                                  <div className="flex items-center gap-1 text-[10px] leading-tight text-white/80">
                                                    <span className="truncate max-w-[32px]">{ship.details?.lastPort || '--'}</span>
                                                    <span className="text-white/20">→</span>
                                                    <span className="truncate max-w-[32px]">{ship.details?.destination || '--'}</span>
                                                  </div>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">货物</span>
                                                  <span className="truncate text-[10px] leading-tight text-white/80">{ship.details?.cargo || '--'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">载重 (DWT)</span>
                                                  <span className="truncate text-[10px] leading-tight text-white/80">{ship.details?.dwt || '--'}t</span>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {item.overtimeCount > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold leading-none text-[#ff4d4d]">{item.overtimeCount} 艘锚泊超时</span>
                            <div className="text-[10px] font-bold leading-none text-[#4DABFF]">实时监测</div>
                          </div>
                          <div className="space-y-1">
                            {item.overtimeShips?.map((ship: any) => {
                              const isExpanded = selectedOvertimeShip === ship.id;
                              return (
                                <div key={ship.id} className="group/ship">
                                  <div className={`rounded-lg border transition-all ${isExpanded ? 'border-[#5a2a32] bg-[#252A33] p-2' : 'border-white/6 bg-[#1A1D23] px-2 py-1.5 hover:border-[#FF4D4D]/30'}`}>
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2">
                                        <div onClick={(e) => { e.stopPropagation(); onSelectOvertimeShip(isExpanded ? null : ship.id); }} className="flex flex-1 cursor-pointer items-center gap-2 min-w-0 overflow-hidden">
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 mb-1 min-w-0 overflow-hidden">
                                              <span className="shrink-0 rounded bg-white/5 border border-white/5 px-1.5 py-0.5 text-[9px] font-normal uppercase tracking-wider text-white/60">{ship.type}</span>
                                              <span className="flex items-center gap-1 rounded bg-white/5 border border-white/5 px-1.5 py-0.5 text-[10px] font-bold text-white/80 min-w-0 overflow-hidden">
                                                <span className="truncate">{ship.name}</span>
                                                {ship.englishName && <span className="text-[9px] font-medium opacity-40 truncate">({ship.englishName})</span>}
                                              </span>
                                            </div>
                                            <div className="mt-1 text-[10px] leading-none text-white/28">锚泊: {ship.details?.anchorTime || '--'}</div>
                                            <div className="mt-1 text-[10px] font-medium leading-none text-[#ff6269]">超时: {ship.overtimeDuration.replace('超时 ', '')}</div>
                                          </div>
                                        </div>
                                        <div className={`flex flex-col gap-1 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                          <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-md bg-[#30343d] px-1.5 py-1 text-[10px] font-black leading-none text-white/45 transition-colors hover:text-white/80 whitespace-nowrap">忽略</button>
                                          <button type="button" onClick={(e) => e.stopPropagation()} className="rounded-md bg-[#3D1D1D] px-1.5 py-1 text-[10px] font-black leading-none text-[#FF4D4D] transition-colors hover:bg-[#4D2222] whitespace-nowrap">驱离</button>
                                        </div>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); onSelectOvertimeShip(isExpanded ? null : ship.id); }} className="rounded-lg p-0.5 text-white/20 transition-colors hover:bg-white/5">
                                          <ChevronRight size={10} className={`transition-transform ${isExpanded ? 'rotate-90 text-white/55' : ''}`} />
                                        </button>
                                      </div>

                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden border-t border-white/5 pt-2"
                                          >
                                            <div className="space-y-1 py-0.5 px-1">
                                              {/* 第一行：身份标识 (MMSI | 呼号 | IMO) */}
                                              <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">MMSI</span>
                                                  <span className="font-mono text-[10px] leading-tight text-white/80">{ship.mmsi || '--'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">呼号</span>
                                                  <span className="font-mono text-[10px] leading-tight text-white/80">{ship.details?.callSign || '--'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">IMO</span>
                                                  <span className="font-mono text-[10px] leading-tight text-white/80">{ship.details?.imo || '--'}</span>
                                                </div>
                                              </div>

                                              {/* 第二行：物理规格 (船籍 | 尺度 | 吃水) */}
                                              <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">船籍</span>
                                                  <span className="truncate text-[10px] leading-tight text-white/80">{ship.details?.flag || '--'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">尺度 (L×W)</span>
                                                  <span className="text-[10px] leading-tight text-white/80">{ship.details?.length}×{ship.details?.width}m</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">吃水</span>
                                                  <span className="text-[10px] leading-tight text-white/80">{ship.details?.draft}m</span>
                                                </div>
                                              </div>

                                              {/* 第三行：航行与业务 (航程 | 货物 | 载重) */}
                                              <div className="grid grid-cols-3 gap-2">
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">航程</span>
                                                  <div className="flex items-center gap-1 text-[10px] leading-tight text-white/80">
                                                    <span className="truncate max-w-[32px]">{ship.details?.lastPort || '--'}</span>
                                                    <span className="text-white/20">→</span>
                                                    <span className="truncate max-w-[32px]">{ship.details?.destination || '--'}</span>
                                                  </div>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">货物</span>
                                                  <span className="truncate text-[10px] leading-tight text-white/80">{ship.details?.cargo || '--'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] uppercase tracking-tighter text-white/20">载重 (DWT)</span>
                                                  <span className="truncate text-[10px] leading-tight text-white/80">{ship.details?.dwt || '--'}t</span>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-center pb-2 pt-2">
                        <button onClick={(e) => { e.stopPropagation(); onSelectAnchorage(null, null); }} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-500/60 transition-colors hover:text-sky-400">
                          收起详情 <ChevronDown size={8} className="rotate-180" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
