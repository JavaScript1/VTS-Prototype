import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, LayoutGrid, Ship } from 'lucide-react';

export type DistributionItem = { type: string; count: number };

export function createChartGradient(
  items: DistributionItem[],
  total: number,
  hoveredType: string | null,
  chartColors: string[],
) {
  if (!items.length) {
    return 'conic-gradient(#223043 0% 100%)';
  }

  return `conic-gradient(${items
    .map((item, index) => {
      const isHovered = hoveredType === item.type;
      const baseColor = chartColors[index % chartColors.length];
      const color = hoveredType && !isHovered ? `${baseColor}33` : baseColor;
      const start = items.slice(0, index).reduce((sum, current) => sum + current.count, 0);
      const end = start + item.count;
      const startPct = total > 0 ? (start / total) * 100 : 0;
      const endPct = total > 0 ? (end / total) * 100 : 0;
      return `${color} ${startPct}% ${endPct}%`;
    })
    .join(', ')})`;
}

function getHoveredItem(
  event: React.MouseEvent<HTMLDivElement>,
  items: DistributionItem[],
  total: number,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  const angle = (Math.atan2(y, x) * 180) / Math.PI + 450;
  let currentAngle = 0;

  for (const item of items) {
    const sweep = total > 0 ? (item.count / total) * 360 : 0;
    if (angle % 360 >= currentAngle && angle % 360 < currentAngle + sweep) {
      return item.type;
    }
    currentAngle += sweep;
  }

  return null;
}

export function ShipTypeDistribution({
  typeStats,
  chartStats,
  chartTotal,
  chartGradient,
  hoveredShipType,
  anchorageTypeViewMode,
  chartColors,
  MarqueeText,
  onHoveredShipTypeChange,
  onAnchorageTypeViewModeChange,
}: {
  typeStats: DistributionItem[];
  chartStats: DistributionItem[];
  chartTotal: number;
  chartGradient: string;
  hoveredShipType: string | null;
  anchorageTypeViewMode: 'chart' | 'tags';
  chartColors: string[];
  MarqueeText: React.ComponentType<{ text: string; isHovered: boolean; className?: string }>;
  onHoveredShipTypeChange: (value: string | null) => void;
  onAnchorageTypeViewModeChange: (mode: 'chart' | 'tags') => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">船舶类型分布</div>
        <div className="flex rounded-lg border border-white/5 bg-[#1A1D23] p-0.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAnchorageTypeViewModeChange('chart');
            }}
            className={`flex h-5 w-5 items-center justify-center rounded-md transition-colors ${
              anchorageTypeViewMode === 'chart'
                ? 'bg-[#252A33] text-[#4DABFF]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <BarChart3 size={10} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAnchorageTypeViewModeChange('tags');
            }}
            className={`flex h-5 w-5 items-center justify-center rounded-md transition-colors ${
              anchorageTypeViewMode === 'tags'
                ? 'bg-[#252A33] text-[#4DABFF]'
                : 'text-gray-500 hover:text-gray-300'
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
                <motion.div
                  key={hoveredShipType || 'total'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex w-[50px] flex-col items-center justify-center"
                >
                  {hoveredShipType && (
                    <span
                      className="mb-0.5 w-full truncate text-center font-medium leading-tight text-[#4DABFF]/60"
                      style={{ fontSize: hoveredShipType.length > 5 ? '7px' : '9px' }}
                    >
                      {hoveredShipType}
                    </span>
                  )}
                  <span className="text-[10px] font-bold leading-tight text-[#4DABFF]">
                    {hoveredShipType
                      ? `${chartStats.find((item) => item.type === hoveredShipType)?.count ?? 0}艘`
                      : `${chartTotal}艘`}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              whileHover={{ scale: 1.05 }}
              onMouseMove={(event) =>
                onHoveredShipTypeChange(getHoveredItem(event, chartStats, chartTotal))
              }
              onMouseLeave={() => onHoveredShipTypeChange(null)}
              className="relative flex h-[88px] w-[88px] cursor-pointer items-center justify-center rounded-full shadow-[0_0_20px_rgba(77,171,255,0.1)]"
              style={{ background: chartGradient }}
            >
              <div className="flex h-[56px] w-[56px] flex-col items-center justify-center rounded-full bg-[#1A1D23] shadow-inner" />
            </motion.div>
          </div>

          <div className="custom-scrollbar grid h-[88px] flex-1 grid-cols-1 gap-y-1 overflow-x-hidden overflow-y-auto pr-1">
            {chartStats.map((ship, index) => {
              const ratio = chartTotal > 0 ? Math.round((ship.count / chartTotal) * 100) : 0;
              return (
                <motion.div
                  key={`${ship.type}-${index}-chart`}
                  data-ship-type={ship.type}
                  initial={{ x: 10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => onHoveredShipTypeChange(ship.type)}
                  onMouseLeave={() => onHoveredShipTypeChange(null)}
                  className={`flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 transition-all hover:bg-white/5 ${
                    hoveredShipType === ship.type ? 'bg-white/5 ring-1 ring-white/10' : ''
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: chartColors[index % chartColors.length] }}
                  />
                  <MarqueeText
                    text={ship.type}
                    isHovered={hoveredShipType === ship.type}
                    className="text-[10px] leading-none text-gray-400"
                  />
                  <span className="text-[10px] font-bold text-[#4DABFF]">{ratio}%</span>
                  <span className="ml-1 text-[10px] text-gray-600">{ship.count}艘</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 overflow-x-hidden">
          {typeStats.map((ship, index) => (
            <motion.div
              key={`${ship.type}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-1 rounded-full border border-white/5 bg-[#1A1D23] px-2 py-1 text-[10px] leading-none text-gray-300"
            >
              <Ship size={11} className="text-[#4DABFF]" />
              <span>{ship.type}</span>
              <span className="font-bold text-[#4DABFF]">{ship.count}艘</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DurationDistribution({
  durationChartStats,
  durationChartTotal,
  durationChartGradient,
  hoveredDurationType,
  chartColors,
  onHoveredDurationTypeChange,
}: {
  durationChartStats: DistributionItem[];
  durationChartTotal: number;
  durationChartGradient: string;
  hoveredDurationType: string | null;
  chartColors: string[];
  onHoveredDurationTypeChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-1.5 border-t border-white/5 py-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">船舶锚泊分布</div>
      <div className="flex items-center gap-2 px-1">
        <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={hoveredDurationType || 'total'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex w-[50px] flex-col items-center justify-center"
              >
                {hoveredDurationType && (
                  <span
                    className="mb-0.5 w-full truncate text-center font-medium leading-tight text-[#4DABFF]/60"
                    style={{ fontSize: hoveredDurationType.length > 5 ? '7px' : '9px' }}
                  >
                    {hoveredDurationType}
                  </span>
                )}
                <span className="text-[10px] font-bold leading-tight text-[#4DABFF]">
                  {hoveredDurationType
                    ? `${durationChartStats.find((item) => item.type === hoveredDurationType)?.count ?? 0}艘`
                    : `${durationChartTotal}艘`}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            whileHover={{ scale: 1.05 }}
            onMouseMove={(event) =>
              onHoveredDurationTypeChange(
                getHoveredItem(event, durationChartStats, durationChartTotal),
              )
            }
            onMouseLeave={() => onHoveredDurationTypeChange(null)}
            className="relative flex h-[88px] w-[88px] cursor-pointer items-center justify-center rounded-full shadow-[0_0_15px_rgba(77,171,255,0.1)]"
            style={{ background: durationChartGradient }}
          >
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#1A1D23] shadow-inner" />
          </motion.div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-y-1">
          {durationChartStats.map((bucket, index) => {
            const ratio =
              durationChartTotal > 0 ? Math.round((bucket.count / durationChartTotal) * 100) : 0;
            return (
              <motion.div
                key={`${bucket.type}-${index}-legend`}
                data-duration-type={bucket.type}
                onMouseEnter={() => onHoveredDurationTypeChange(bucket.type)}
                onMouseLeave={() => onHoveredDurationTypeChange(null)}
                className={`flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 transition-all hover:bg-white/5 ${
                  hoveredDurationType === bucket.type ? 'bg-white/5 ring-1 ring-white/10' : ''
                }`}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-[10px] leading-none text-gray-400">
                  {bucket.type}
                </span>
                <span className="text-[10px] font-bold text-[#4DABFF]">{ratio}%</span>
                <span className="ml-1 text-[10px] text-gray-600">{bucket.count}艘</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
