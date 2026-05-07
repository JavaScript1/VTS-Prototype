import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type AnchorageShipCardProps = {
  ship: any;
  expanded: boolean;
  statusText: string;
  statusClassName: string;
  variant: 'expiring' | 'overtime';
  primaryActionLabel: string;
  onToggle: () => void;
};

const VARIANT_STYLES = {
  expiring: {
    expanded: 'border-[#5c4a2f] bg-[#252A33] p-2',
    collapsed: 'border-white/6 bg-[#1A1D23] px-2 py-1.5 hover:border-[#FF9F43]/30',
    action: 'bg-[#3D2616] text-[#FF9F43] hover:bg-[#4D321D]',
  },
  overtime: {
    expanded: 'border-[#5a2a32] bg-[#252A33] p-2',
    collapsed: 'border-white/6 bg-[#1A1D23] px-2 py-1.5 hover:border-[#FF4D4D]/30',
    action: 'bg-[#3D1D1D] text-[#FF4D4D] hover:bg-[#4D2222]',
  },
} as const;

function ShipDetailGrid({ ship }: { ship: any }) {
  return (
    <div className="space-y-1 px-1 py-0.5">
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

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase tracking-tighter text-white/20">船籍</span>
          <span className="truncate text-[10px] leading-tight text-white/80">{ship.details?.flag || '--'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] uppercase tracking-tighter text-white/20">尺度 (L×W)</span>
          <span className="text-[10px] leading-tight text-white/80">
            {ship.details?.length}×{ship.details?.width}m
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] uppercase tracking-tighter text-white/20">吃水</span>
          <span className="text-[10px] leading-tight text-white/80">{ship.details?.draft}m</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase tracking-tighter text-white/20">航程</span>
          <div className="flex items-center gap-1 text-[10px] leading-tight text-white/80">
            <span className="max-w-[32px] truncate">{ship.details?.lastPort || '--'}</span>
            <span className="text-white/20">→</span>
            <span className="max-w-[32px] truncate">{ship.details?.destination || '--'}</span>
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
  );
}

export default function AnchorageShipCard({
  ship,
  expanded,
  statusText,
  statusClassName,
  variant,
  primaryActionLabel,
  onToggle,
}: AnchorageShipCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className="group/ship">
      <div
        className={`rounded-lg border transition-all ${
          expanded ? styles.expanded : styles.collapsed
        }`}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 overflow-hidden"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-center overflow-hidden">
                  <span className="flex min-w-0 items-center gap-1 overflow-hidden text-[11px] font-bold text-white/90">
                    <span className="truncate">{ship.name}</span>
                    {ship.englishName && (
                      <span className="truncate text-[10px] font-medium opacity-40">
                        ({ship.englishName})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-x-2 whitespace-nowrap">
                  <span className="shrink-0 text-[8px] font-normal uppercase tracking-wider text-white/40">
                    {ship.type}
                  </span>
                  <span className="text-[10px] font-normal leading-none text-white/28">
                    锚泊: {ship.details?.anchorTime || '--'}
                  </span>
                </div>
                <div className={`text-[10px] font-medium leading-none ${statusClassName}`}>
                  {statusText}
                </div>
              </div>
            </div>

            <div
              className={`flex flex-col gap-1 transition-opacity ${
                expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={(event) => event.stopPropagation()}
                className="whitespace-nowrap rounded-md bg-[#30343d] px-1.5 py-1 text-[10px] font-black leading-none text-white/45 transition-colors hover:text-white/80"
              >
                忽略
              </button>
              <button
                type="button"
                onClick={(event) => event.stopPropagation()}
                className={`whitespace-nowrap rounded-md px-1.5 py-1 text-[10px] font-black leading-none transition-colors ${styles.action}`}
              >
                {primaryActionLabel}
              </button>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
              className="rounded-lg p-0.5 text-white/20 transition-colors hover:bg-white/5"
            >
              <ChevronRight
                size={10}
                className={`transition-transform ${expanded ? 'rotate-90 text-white/55' : ''}`}
              />
            </button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/5 pt-2"
              >
                <ShipDetailGrid ship={ship} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
