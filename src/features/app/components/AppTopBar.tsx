import { Settings, User, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type AppTopBarProps = {
  showBars: boolean;
  showUserMenu: boolean;
  onOpenAdmin: () => void;
  onToggleUserMenu: () => void;
  onCloseUserMenu: () => void;
};

export default function AppTopBar({
  showBars,
  showUserMenu,
  onOpenAdmin,
  onToggleUserMenu,
  onCloseUserMenu,
}: AppTopBarProps) {
  return (
    <AnimatePresence>
      {showBars && (
        <motion.header
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'var(--vts-topbar-height)', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="z-[3000] flex shrink-0 items-center justify-between border-b border-white/10 bg-[#0a0a0a] px-4"
        >
          <div className="flex items-center gap-4" />

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
            <div className="relative">
              <div className="h-3 w-1.5 rounded-full bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.6)]" />
              <div className="absolute inset-0 animate-pulse bg-sky-400 opacity-50 blur-sm" />
            </div>
            <h1 className="text-base font-black uppercase tracking-[0.24em] text-white/90">
              VTS智能辅助系统
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Settings size={20} />
            </button>

            <div className="relative">
              <button
                onClick={onToggleUserMenu}
                className={`relative rounded-full p-2 transition-all ${
                  showUserMenu
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <User size={20} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-pointer"
                      onClick={onCloseUserMenu}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-3 shadow-2xl backdrop-blur-xl"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white/90">管理员</div>
                            <div className="text-[10px] text-white/40">在线</div>
                          </div>
                        </div>

                        <div className="mx-1 h-px bg-white/5" />

                        <div className="px-2 py-1">
                          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                            当前区域
                          </div>
                          <div className="flex items-center gap-2 text-xs text-white/70">
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
