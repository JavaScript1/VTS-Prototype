import { motion } from 'motion/react';
import { AlertTriangle, Settings } from 'lucide-react';

export const IntentConflictPanel = ({
  onOpenPlayback,
}: {
  onOpenPlayback: () => void;
}) => (
  <motion.div
    initial={{ x: 20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    className="absolute right-10 top-10 z-[2000] w-[320px] overflow-hidden rounded-lg border border-red-500/30 bg-[#1a0505]/90 shadow-2xl backdrop-blur-md"
  >
    <div className="flex items-center justify-between border-b border-red-500/20 bg-red-900/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-400" />
        <span className="text-sm font-black uppercase tracking-wide text-white">意图冲突识别 (Intent Conflict)</span>
      </div>
      <AlertTriangle size={16} className="animate-pulse text-red-500" />
    </div>
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">识别意图:</span>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="text-xs font-black text-white">非法锚泊行为</span>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-white/40">依据:</span>
        <span className="text-xs font-medium leading-relaxed text-white/80">CPA 0.02nm, 舵角偏离大, 前速 0.1 kn</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <button className="rounded bg-sky-500/20 py-2 text-[10px] font-black uppercase tracking-widest text-sky-400 transition-all hover:bg-sky-500/30 border border-sky-500/30">发送 VHF 警告</button>
        <button className="rounded bg-orange-500/20 py-2 text-[10px] font-black uppercase tracking-widest text-orange-400 transition-all hover:bg-orange-500/30 border border-orange-500/30">标记为误报</button>
        <button
          onClick={onOpenPlayback}
          className="rounded border border-white/10 bg-white/5 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10"
        >
          查看监控回放
        </button>
      </div>
    </div>
  </motion.div>
);

export const CrewApplicationPanel = () => (
  <motion.div
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    className="absolute left-10 top-[45%] z-[2000] w-[300px] overflow-hidden rounded-lg border border-sky-500/30 bg-[#05101a]/90 shadow-2xl backdrop-blur-md"
  >
    <div className="flex items-center justify-between border-b border-sky-500/20 bg-sky-900/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black uppercase tracking-wide text-white">船员申请流</span>
      </div>
      <Settings size={14} className="cursor-pointer text-white/40 transition-colors hover:text-white" />
    </div>
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-white/40">申请事件:</span>
        <span className="text-xs font-black text-white">⚓ 靠泊 粮油码头 A2泊位</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-white/40">冲突检测:</span>
        <span className="text-xs font-black text-sky-400">无冲突 (泊位空闲, 水深满足)</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <button className="rounded bg-sky-500 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400">批准排期</button>
        <button className="rounded border border-red-500/30 bg-red-500/20 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/30">驳回申请</button>
        <button className="rounded border border-white/10 bg-white/5 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10">指派拖轮</button>
      </div>
    </div>
  </motion.div>
);

export const SystemSuggestionPanel = () => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="absolute bottom-10 left-1/2 z-[2000] w-[280px] -translate-x-1/2 overflow-hidden rounded-lg border border-emerald-500/30 bg-[#051a10]/90 shadow-2xl backdrop-blur-md"
  >
    <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-900/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black uppercase tracking-wide text-white">系统建议</span>
      </div>
      <Settings size={14} className="cursor-pointer text-white/40 transition-colors hover:text-white" />
    </div>
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">意图优化:</span>
        <span className="text-xs font-black text-emerald-400">💡 船舶分流建议</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-white/40">建议:</span>
        <span className="text-xs font-medium leading-relaxed text-white/90">'海巡 01' 前往 B2 区协助引导</span>
      </div>
      <div className="flex gap-2 pt-2">
        <button className="flex-1 rounded bg-emerald-500 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400">应用建议</button>
        <button className="rounded border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10">忽略</button>
      </div>
    </div>
  </motion.div>
);
