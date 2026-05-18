import { AnimatePresence, motion } from 'motion/react';
import type { HomeViewMode } from '../utils/viewModes';

export type AppTopBarProps = {
  showBars: boolean;
  currentMode: HomeViewMode;
};

export default function AppTopBar({
  showBars,
  currentMode,
}: AppTopBarProps) {
  const isLight =
    currentMode === 'risk-analysis' ||
    currentMode === 'case-playback' ||
    currentMode === 'emergency-rescue';

  return (
    <AnimatePresence>
      {showBars && (
        <motion.header
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'var(--vts-topbar-height)', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`z-[3000] flex shrink-0 items-center justify-between border-b px-6 py-0 transition-colors duration-500 ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900'
              : 'border-white/10 bg-[#0a0a0a] text-white'
          }`}
        >
          <div className='flex items-center gap-3'>
            <div className={`h-6 w-6 rounded-lg bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20`}>
               <div className='h-2.5 w-2.5 rounded-full bg-white animate-pulse' />
            </div>
            <div className='flex flex-col'>
              <span className='text-[13px] font-black tracking-[0.2em] uppercase'>VTS Prototype</span>
              <span className={`text-[9px] font-bold tracking-widest ${isLight ? 'text-slate-400' : 'text-white/30'}`}>INTELLIGENT MARITIME SYSTEM</span>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
