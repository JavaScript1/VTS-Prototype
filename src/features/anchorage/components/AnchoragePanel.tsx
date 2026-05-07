import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Anchor, ChevronDown, ChevronRight } from 'lucide-react';
import AnchorageShipCard from './AnchorageShipCard';
import {
  createChartGradient,
  DurationDistribution,
  ShipTypeDistribution,
} from './AnchorageDistributions';

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
  chartColors,
  MarqueeText,
}: AnchoragePanelProps) {
  React.useEffect(() => {
    if (!hoveredShipType) return;
    const element = document.querySelector(`[data-ship-type="${hoveredShipType}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [hoveredShipType]);

  React.useEffect(() => {
    if (!hoveredDurationType) return;
    const element = document.querySelector(`[data-duration-type="${hoveredDurationType}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
          const availabilityPercent = Math.round(
            getAnchorageAvailabilityRatio(item.occupied, item.capacity) * 100,
          );
          const chartGradient = createChartGradient(
            chartStats,
            chartTotal,
            hoveredShipType,
            chartColors,
          );
          const durationChartGradient = createChartGradient(
            durationChartStats,
            durationChartTotal,
            hoveredDurationType,
            chartColors,
          );

          return (
            <motion.div
              key={item.id}
              layout
              className={`group overflow-hidden rounded-xl border bg-[#0F1115] shadow-2xl transition-all ${
                selectedAnchorage === item.id
                  ? 'border-white/10'
                  : 'border-white/5 hover:border-white/10'
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
                      <div className="truncate text-[11px] font-bold leading-none tracking-tight text-white">
                        {item.name}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-[3px] w-[54px] overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-[#4DFF88]"
                            style={{
                              width: `${Math.max(
                                availabilityPercent,
                                availabilityPercent > 0 ? 8 : 0,
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="shrink-0 text-[10px] font-bold leading-none text-white/65">
                          {availabilityPercent}%
                        </div>
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
                    <ChevronRight
                      size={12}
                      className={`shrink-0 text-white/35 transition-transform duration-300 ${
                        selectedAnchorage === item.id ? 'rotate-90 text-white/65' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {selectedAnchorage === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 px-3 py-1.5">
                      <ShipTypeDistribution
                        typeStats={typeStats}
                        chartStats={chartStats}
                        chartTotal={chartTotal}
                        chartGradient={chartGradient}
                        hoveredShipType={hoveredShipType}
                        anchorageTypeViewMode={anchorageTypeViewMode}
                        chartColors={chartColors}
                        MarqueeText={MarqueeText}
                        onHoveredShipTypeChange={onHoveredShipTypeChange}
                        onAnchorageTypeViewModeChange={onAnchorageTypeViewModeChange}
                      />

                      <DurationDistribution
                        durationChartStats={durationChartStats}
                        durationChartTotal={durationChartTotal}
                        durationChartGradient={durationChartGradient}
                        hoveredDurationType={hoveredDurationType}
                        chartColors={chartColors}
                        onHoveredDurationTypeChange={onHoveredDurationTypeChange}
                      />

                      {item.expiringCount > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold leading-none text-[#f7a52c]">
                              {item.expiringCount} 艘锚泊临期
                            </span>
                            <div className="text-[10px] font-bold leading-none text-[#4DABFF]">
                              限时 48H
                            </div>
                          </div>
                          <div className="space-y-1">
                            {item.expiringShips?.map((ship: any) => {
                              return (
                                <AnchorageShipCard
                                  key={ship.id}
                                  ship={ship}
                                  expanded={selectedExpiringShip === ship.id}
                                  statusText={formatAnchorageRemainingDuration(
                                    ship.expiryTime,
                                    currentTime,
                                  )}
                                  statusClassName="text-[#f7a52c]"
                                  variant="expiring"
                                  primaryActionLabel="提醒"
                                  onToggle={() =>
                                    onSelectExpiringShip(
                                      selectedExpiringShip === ship.id ? null : ship.id,
                                    )
                                  }
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {item.overtimeCount > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold leading-none text-[#ff4d4d]">
                              {item.overtimeCount} 艘锚泊超时
                            </span>
                            <div className="text-[10px] font-bold leading-none text-[#4DABFF]">
                              实时监测
                            </div>
                          </div>
                          <div className="space-y-1">
                            {item.overtimeShips?.map((ship: any) => (
                              <AnchorageShipCard
                                key={ship.id}
                                ship={ship}
                                expanded={selectedOvertimeShip === ship.id}
                                statusText={`超时: ${ship.overtimeDuration.replace('超时 ', '')}`}
                                statusClassName="text-[#ff6269]"
                                variant="overtime"
                                primaryActionLabel="驱离"
                                onToggle={() =>
                                  onSelectOvertimeShip(
                                    selectedOvertimeShip === ship.id ? null : ship.id,
                                  )
                                }
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-center pb-2 pt-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectAnchorage(null, null);
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-500/60 transition-colors hover:text-sky-400"
                        >
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
