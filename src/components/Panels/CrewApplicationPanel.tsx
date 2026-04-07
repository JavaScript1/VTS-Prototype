import React from 'react';
import { motion } from 'motion/react';
import { Settings } from 'lucide-react';

const CrewApplicationPanel: React.FC = () => (
  <motion.div 
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    className="absolute top-[45%] left-10 z-[2000] w-[300px] bg-[#05101a]/90 backdrop-blur-md border border-sky-500/30 rounded-lg overflow-hidden shadow-2xl"
  >
    <div className="bg-sky-900/80 px-3 py-2 flex items-center justify-between border-b border-sky-500/20">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-white tracking-wide uppercase">船员申请流</span>
      </div>
      <Settings size={14} className="text-white/40 hover:text-white cursor-pointer transition-colors" />
    </div>
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0">申请事件:</span>
        <span className="text-xs text-white font-black">⚓ 靠泊 粮油码头 A2泊位</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0">冲突检测:</span>
        <span className="text-xs text-sky-400 font-black">无冲突 (泊位空闲, 水深满足)</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <button className="bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded shadow-lg shadow-sky-500/20 transition-all">批准排期</button>
        <button className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">驳回申请</button>
        <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">指派拖轮</button>
      </div>
    </div>
  </motion.div>
);

export default CrewApplicationPanel;
