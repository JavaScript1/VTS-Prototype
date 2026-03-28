import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

const SystemSuggestionPanel: React.FC = () => (
  <motion.div 
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[2000] w-[280px] bg-[#051a10]/90 backdrop-blur-md border border-emerald-500/30 rounded-lg overflow-hidden shadow-2xl"
  >
    <div className="bg-emerald-900/80 px-3 py-2 flex items-center justify-between border-b border-emerald-500/20">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-white tracking-wide uppercase">系统建议</span>
      </div>
      <Settings size={14} className="text-white/40 hover:text-white cursor-pointer transition-colors" />
    </div>
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">意图优化:</span>
        <span className="text-xs text-emerald-400 font-black">💡 船舶分流建议</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest shrink-0">建议:</span>
        <span className="text-xs text-white/90 font-medium leading-relaxed">'海巡 01' 前往 B2 区协助引导</span>
      </div>
      <div className="flex gap-2 pt-2">
        <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded shadow-lg shadow-emerald-500/20 transition-all">应用建议</button>
        <button className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest py-2 rounded transition-all">忽略</button>
      </div>
    </div>
  </motion.div>
);

export default SystemSuggestionPanel;
