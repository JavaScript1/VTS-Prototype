import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronRight,
  Ruler,
  Settings,
  Sparkles,
  User,
  Video,
  Wrench,
  LogOut,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  HOME_ROUTE_MODE_OPTIONS,
  type HomeViewMode,
} from '../utils/viewModes';

type SidebarPosition = 'left' | 'right';

export type AppBottomBarProps = {
  showBars: boolean;
  mouseCoords: { lat: number; lng: number } | null;
  isControlPanelExpanded: boolean;
  isToolsExpanded: boolean;
  isAssistantOpen: boolean;
  showUserMenu: boolean;
  currentMode: HomeViewMode;
  sidebarPosition: SidebarPosition;
  onModeChange: (mode: HomeViewMode) => void;
  onToggleControlPanel: () => void;
  onToggleAssistant: () => void;
  onToggleTools: () => void;
  onToggleSidebarPosition: () => void;
  onOpenAdmin: () => void;
  onToggleUserMenu: () => void;
  onCloseUserMenu: () => void;
};

export default function AppBottomBar({
  showBars,
  mouseCoords,
  isControlPanelExpanded,
  isToolsExpanded,
  isAssistantOpen,
  showUserMenu,
  currentMode,
  sidebarPosition,
  onModeChange,
  onToggleControlPanel,
  onToggleAssistant,
  onToggleTools,
  onToggleSidebarPosition,
  onOpenAdmin,
  onToggleUserMenu,
  onCloseUserMenu,
}: AppBottomBarProps) {
  const toolItems = [
    { icon: ArrowLeft, label: '上一步' },
    { icon: ArrowRight, label: '下一步' },
    { icon: Ruler, label: '测距' },
    { icon: Camera, label: '截图' },
    { icon: Video, label: '录制' },
  ];

  return (
    <AnimatePresence>
      {showBars && (
        <motion.footer
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'var(--vts-bottombar-height)', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="z-[3000] flex shrink-0 items-center justify-between border-t border-white/10 bg-[#0a0a0a] px-4"
        >
          <div className="flex flex-1 items-center justify-start gap-2">
            {HOME_ROUTE_MODE_OPTIONS.map((option) => {
              const active = option.id === currentMode;
              return (
                <button
                  key={option.id}
                  onClick={() => onModeChange(option.id)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                    active
                      ? 'border-sky-500/40 bg-sky-500/15 text-sky-400 shadow-[0_0_18px_rgba(14,165,233,0.14)]'
                      : 'border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex items-center gap-8"><button onClick={onToggleAssistant} className={`flex items-center gap-2 rounded-full border px-3 py-1 transition-all ${isAssistantOpen ? "border-sky-500/50 bg-sky-500/20 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.2)]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white"}`}><Sparkles size={14} className={isAssistantOpen ? "animate-pulse" : ""} /><span className="text-[10px] font-black uppercase tracking-widest">智能助手</span></button>
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

            <div className="relative">
              <AnimatePresence>
                {isToolsExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full right-0 z-[5000] mb-2 flex items-center gap-1 rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-1.5 shadow-2xl backdrop-blur-xl"
                  >
                    {toolItems.map((item) => (
                      <button
                        key={item.label}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-sky-400"
                        title={item.label}
                      >
                        <item.icon size={16} />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={onToggleTools}
                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  isToolsExpanded ? 'text-sky-500' : 'text-white/40 hover:text-white'
                }`}
              >
                工具
                <Wrench
                  size={14}
                  className={`transition-transform duration-300 ${
                    isToolsExpanded ? 'rotate-[30deg]' : 'rotate-0'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-white"
            >
              设置
              <Settings size={14} />
            </button>

            <div className="relative">
              <button
                onClick={onToggleUserMenu}
                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  showUserMenu ? 'text-sky-500' : 'text-white/40 hover:text-white'
                }`}
              >
                账户
                <User size={14} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-[4000] cursor-pointer" onClick={onCloseUserMenu} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full right-0 z-[5000] mb-2 w-48 rounded-2xl border border-white/10 bg-[#05080d]/95 p-3 shadow-2xl backdrop-blur-xl"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-white/90">管理员</div>
                            <div className="text-[9px] text-white/40">在线</div>
                          </div>
                        </div>

                        <div className="mx-1 h-px bg-white/5" />

                        <div className="px-2 py-1">
                          <div className="mb-2 text-[9px] font-black uppercase tracking-widest text-white/25">
                            当前区域
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/60">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            外高桥区域
                          </div>
                        </div>

                        <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[10px] text-rose-400 transition-colors hover:bg-rose-500/10">
                          <LogOut size={14} />
                          退出登录
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
}
