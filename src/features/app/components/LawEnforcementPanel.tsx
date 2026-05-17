/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  ShieldCheck, 
  Navigation, 
  Users, 
  BellRing, 
  ChevronRight, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LawEnforcementPanelProps {
  className?: string;
  onEnterSystem?: () => void;
}

const FORCES = [
  { id: '1', name: '海巡 01', status: '巡航中', type: '大型巡逻船', position: '吴淞口警戒区', crew: 12, fuel: 85 },
  { id: '2', name: '海巡 012', status: '待命', type: '中型巡逻船', position: '宝山海事基地', crew: 6, fuel: 92 },
  { id: '3', name: '海巡 168', status: '执行中', type: '快速反应船', position: '圆圆沙 12 号浮', crew: 4, fuel: 64 },
];

export default function LawEnforcementPanel({ className = '', onEnterSystem }: LawEnforcementPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 shadow-2xl backdrop-blur-xl transition-all ${
          isOpen 
            ? 'border-rose-500/50 bg-rose-500/20 text-rose-400' 
            : 'border-white/10 bg-[#111111]/90 text-white/80 hover:bg-white/5 hover:text-white'
        }`}
      >
        <ShieldCheck size={18} className={isOpen ? 'animate-pulse' : ''} />
        <span className="text-xs font-black tracking-widest uppercase">执法指挥</span>
        <div className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-black text-rose-400">
          3
        </div>
      </button>

      {/* Expanded Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 top-full mt-3 w-[320px] overflow-hidden rounded-3xl border border-white/10 bg-[#060606]/95 p-5 shadow-[0_32px_64px_rgba(0,0,0,0.6)] backdrop-blur-2xl ring-1 ring-white/5"
          >
            {/* Header Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between text-white/30">
                  <span className="text-[10px] font-black uppercase tracking-tighter">在位资源</span>
                  <Navigation size={12} />
                </div>
                <div className="mt-2 text-xl font-black text-white">12 / 15</div>
                <div className="mt-1 text-[9px] font-bold text-emerald-400">运行率 80%</div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between text-white/30">
                  <span className="text-[10px] font-black uppercase tracking-tighter">应急待命</span>
                  <BellRing size={12} />
                </div>
                <div className="mt-2 text-xl font-black text-white">4 组</div>
                <div className="mt-1 text-[9px] font-bold text-rose-400">响应等级 1</div>
              </div>
            </div>

            {/* List Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">重点执法单元</h3>
                <button className="text-[9px] font-bold text-sky-400 hover:text-sky-300">查看地图全部</button>
              </div>

              <div className="space-y-2">
                {FORCES.map((force) => (
                  <div 
                    key={force.id}
                    className="group relative flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.05]"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      force.status === '巡航中' ? 'border-sky-500/20 bg-sky-500/10 text-sky-400' :
                      force.status === '执行中' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                      'border-white/10 bg-white/5 text-white/30'
                    }`}>
                      <Navigation size={18} className={force.status === '执行中' ? 'animate-pulse' : ''} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-xs font-black text-white">{force.name}</span>
                        <span className={`text-[9px] font-black ${
                          force.status === '巡航中' ? 'text-sky-400' :
                          force.status === '执行中' ? 'text-amber-400' :
                          'text-white/40'
                        }`}>{force.status}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[9px] text-white/40 font-bold">
                        <span className="truncate">{force.position}</span>
                      </div>
                      
                      {/* Mini Stats Bar */}
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Users size={8} className="text-white/20" />
                          <span className="text-[8px] text-white/30">{force.crew}</span>
                        </div>
                        <div className="flex-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${force.fuel < 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${force.fuel}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                      <ChevronRight size={14} className="text-white/20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-col gap-2">
              <button 
                onClick={onEnterSystem}
                className="flex items-center justify-between rounded-xl bg-rose-500 px-4 py-2 text-[11px] font-black text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 active:scale-95"
              >
                <span>进入执法指挥系统</span>
                <ArrowRight size={14} />
              </button>
              <button className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black text-white/60 transition-all hover:bg-white/10 hover:text-white">
                <span>全域态势概览</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
