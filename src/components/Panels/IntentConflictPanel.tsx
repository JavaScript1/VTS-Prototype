import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

const IntentConflictPanel: React.FC = () => (
  <motion.div 
    initial={{ x: 20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    className="absolute top-10 right-10 z-[2000] w-[320px] bg-[#1a0505]/90 backdrop-blur-md border border-red-500/30 rounded-lg overflow-hidden shadow-2xl"
  >
    <div className="bg-red-900/80 px-3 py-2 flex items-center justify-between border-b border-red-500/20">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-400" />
        <span className="text-sm font-black text-white tracking-wide uppercase">意图冲突识别 (Intent Conflict)</span>
      </div>
      <AlertTriangle size={16} className="text-red-500 animate-pulse" />
    </div>
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">识别意图:</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="text-xs font-black text-white">非法锚泊行为</span>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0">依据:</span>
        <span className="text-xs text-white/80 font-medium leading-relaxed">CPA 0.02nm, 舵角偏离大, 前速 0.1 kn</span>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <button className="bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">发送 VHF 警告</button>
        <button className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">标记为误报</button>
        <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">查看监控回放</button>
      </div>
    </div>
  </motion.div>
);

export default IntentConflictPanel;
