import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type SidebarPosition = 'left' | 'right';

type AppBottomBarProps = {
  showBars: boolean;
  mouseCoords: { lat: number; lng: number } | null;
  isControlPanelExpanded: boolean;
  sidebarPosition: SidebarPosition;
  onToggleControlPanel: () => void;
  onToggleSidebarPosition: () => void;
};

export default function AppBottomBar({
  showBars,
  mouseCoords,
  isControlPanelExpanded,
  sidebarPosition,
  onToggleControlPanel,
  onToggleSidebarPosition,
}: AppBottomBarProps) {
  return (
    <AnimatePresence>
      {showBars && (
        <motion.footer
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'var(--vts-bottombar-height)', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="z-[3000] flex shrink-0 items-center justify-between border-t border-white/10 bg-[#0a0a0a] px-4"
        >
          <div className="flex-1" />

          <div className="relative flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                比例尺
              </span>
              <div className="relative h-1 w-16 overflow-hidden rounded-full bg-white/10">
                <div className="absolute bottom-0 left-0 top-0 w-1/2 bg-white/30" />
              </div>
              <span className="text-[10px] font-mono text-white/50">2.5 NM</span>
            </div>

            <div className="flex items-center gap-4 border-l border-white/5 pl-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  经度
                </span>
                <span className="w-[80px] text-[10px] font-mono text-sky-400">
                  {mouseCoords ? mouseCoords.lng.toFixed(6) : '---.------'}°E
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  纬度
                </span>
                <span className="w-[80px] text-[10px] font-mono text-sky-400">
                  {mouseCoords ? mouseCoords.lat.toFixed(6) : '--.------'}°N
                </span>
              </div>
            </div>

            <AnimatePresence>
              {isControlPanelExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 z-[5000] mb-2 w-64 rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-4 shadow-2xl backdrop-blur-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/70">
                        面板位置 (左/右)
                      </span>
                      <button
                        onClick={onToggleSidebarPosition}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 transition-all hover:bg-white/10"
                      >
                        <span
                          className={`text-[10px] font-bold ${
                            sidebarPosition === 'left' ? 'text-sky-400' : 'text-white/30'
                          }`}
                        >
                          左
                        </span>
                        <div className="h-2 w-px bg-white/10" />
                        <span
                          className={`text-[10px] font-bold ${
                            sidebarPosition === 'right' ? 'text-sky-400' : 'text-white/30'
                          }`}
                        >
                          右
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={onToggleControlPanel}
              className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                isControlPanelExpanded ? 'text-sky-500' : 'text-white/40 hover:text-white'
              }`}
            >
              展开控制面板
              <ChevronRight
                size={12}
                className={`transition-transform duration-300 ${
                  isControlPanelExpanded ? 'rotate-[90deg]' : 'rotate-[-90deg]'
                }`}
              />
            </button>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
}
