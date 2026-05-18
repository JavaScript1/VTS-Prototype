import { LogOut, Settings, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { HOME_VIEW_MODE_OPTIONS, type HomeViewMode } from '../utils/viewModes';

export type AppTopBarProps = {
  showBars: boolean;
  showUserMenu: boolean;
  currentMode: HomeViewMode;
  onModeChange: (mode: HomeViewMode) => void;
  onOpenAdmin: () => void;
  onToggleUserMenu: () => void;
  onCloseUserMenu: () => void;
};

export default function AppTopBar({
  showBars,
  showUserMenu,
  currentMode,
  onModeChange,
  onOpenAdmin,
  onToggleUserMenu,
  onCloseUserMenu,
}: AppTopBarProps) {
  const isLight =
    currentMode === 'risk-analysis' ||
    currentMode === 'case-playback' ||
    currentMode === 'emergency-rescue';
  const primaryModes = HOME_VIEW_MODE_OPTIONS.filter(
    (option) =>
      option.id === 'normal' || option.id === 'smart-duty' || option.id === 'auto',
  );
  const routeModes = HOME_VIEW_MODE_OPTIONS.filter(
    (option) =>
      option.id !== 'normal' && option.id !== 'smart-duty' && option.id !== 'auto',
  );

  return (
    <AnimatePresence>
      {showBars && (
        <motion.header
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'var(--vts-topbar-height)', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`z-[3000] flex shrink-0 items-center justify-between border-b px-4 py-0 transition-colors duration-500 ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900'
              : 'border-white/10 bg-[#0a0a0a] text-white'
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center">
            <div className="flex max-w-[calc(100vw-260px)] items-center gap-4 overflow-x-auto">
              <div
                className={`flex items-center gap-1 rounded-full border px-2 py-1 backdrop-blur-xl transition-colors ${
                  isLight ? 'border-slate-200 bg-slate-100/80' : 'border-white/10 bg-[#111111]/90'
                }`}
              >
                {primaryModes.map((option) => {
                  const active = option.id === currentMode;
                  return (
                    <button
                      key={option.id}
                      onClick={() => onModeChange(option.id)}
                      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.08em] transition-all ${
                        active
                          ? isLight
                            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-sky-500/20 text-sky-300 shadow-[0_0_18px_rgba(14,165,233,0.18)]'
                          : isLight
                            ? 'text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                            : 'text-white/55 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1">
                {routeModes.map((option) => {
                  const active = option.id === currentMode;
                  return (
                    <button
                      key={option.id}
                      onClick={() => onModeChange(option.id)}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold tracking-[0.08em] transition-all ${
                        active
                          ? isLight
                            ? 'bg-slate-100 text-slate-900'
                            : 'bg-white/5 text-white'
                          : isLight
                            ? 'text-slate-400 hover:text-slate-900'
                            : 'text-white/45 hover:text-white/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className={`rounded-full p-2 transition-colors ${
                isLight
                  ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings size={20} />
            </button>

            <div className="relative">
              <button
                onClick={onToggleUserMenu}
                className={`relative rounded-full p-2 transition-all ${
                  showUserMenu
                    ? isLight
                      ? 'bg-sky-100 text-sky-600'
                      : 'bg-sky-500/20 text-sky-400'
                    : isLight
                      ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <User size={20} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-pointer" onClick={onCloseUserMenu} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border p-3 shadow-2xl backdrop-blur-xl ${
                        isLight
                          ? 'border-slate-200 bg-white/95 shadow-slate-200/50'
                          : 'border-white/10 bg-[#0a0a0a]/95'
                      }`}
                    >
                      <div className="space-y-3">
                        <div
                          className={`flex items-center gap-3 rounded-lg border p-2 ${
                            isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-white/5'
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              isLight ? 'bg-sky-100 text-sky-600' : 'bg-sky-500/20 text-sky-400'
                            }`}
                          >
                            <User size={16} />
                          </div>
                          <div>
                            <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white/90'}`}>管理员</div>
                            <div className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-white/40'}`}>在线</div>
                          </div>
                        </div>

                        <div className={`mx-1 h-px ${isLight ? 'bg-slate-100' : 'bg-white/5'}`} />

                        <div className="px-2 py-1">
                          <div className={`mb-2 text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-300' : 'text-white/30'}`}>
                            当前区域
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            外高桥区域
                          </div>
                        </div>

                        <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10">
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
        </motion.header>
      )}
    </AnimatePresence>
  );
}
