/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  ChevronRight, 
  Maximize2, 
  Radio, 
  LocateFixed, 
  AlertTriangle, 
  Anchor 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SidebarTab } from '../../types';

interface SidebarPanelProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  isOpen: boolean;
  onToggle: () => void;
  position?: 'left' | 'right';
  showBars: boolean;
  onToggleBars: () => void;
  children: React.ReactNode;
}

const SidebarPanel = ({ 
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  position = 'left',
  showBars,
  onToggleBars,
  children
}: SidebarPanelProps) => {
  const tabs = [
    { id: 'vhf' as const, icon: Radio, label: 'VHF' },
    { id: 'intent' as const, icon: LocateFixed, label: '意图' },
    { id: 'warning' as const, icon: AlertTriangle, label: '预警' },
    { id: 'anchorage' as const, icon: Anchor, label: '锚地' },
  ];

  const isLeft = position === 'left';
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const isFullscreenView = !showBars;

  return (
    <div className={`flex h-full z-[3000] ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* 导航侧轨 */}
      <div className={`w-12 h-full bg-[#050505] border-${isLeft ? 'r' : 'l'} border-white/10 flex flex-col items-center py-4 gap-4`}>
        {/* 可展开的搜索按钮 */}
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setIsSearchExpanded(true)}
          onMouseLeave={() => setIsSearchExpanded(false)}
        >
          <button className={`p-2 rounded-lg transition-all ${isSearchExpanded ? 'text-sky-400 bg-sky-500/10' : 'text-white/30 hover:text-white/60'}`}>
            <Search size={18} />
          </button>
          <AnimatePresence>
            {isSearchExpanded && (
              <motion.div
                initial={{ width: 0, opacity: 0, x: isLeft ? -10 : 10 }}
                animate={{ width: 200, opacity: 1, x: 0 }}
                exit={{ width: 0, opacity: 0, x: isLeft ? -10 : 10 }}
                className={`absolute ${isLeft ? 'left-full ml-2' : 'right-full mr-2'} z-[4000]`}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="搜索船名/MMSI..." 
                    className="w-full bg-[#0a0a0a] border border-sky-500/30 rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-sky-500 shadow-2xl"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 全屏按钮：仅控制顶部/底部栏 */}
        <button 
          onClick={onToggleBars}
          className={`group relative p-2 rounded-xl transition-all duration-300 ${
            isFullscreenView
              ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
              : 'bg-white/5 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
          } hover:scale-105 active:scale-95`}
          title={isFullscreenView ? "退出全屏监控" : "进入全屏监控"}
        >
          <div className={`absolute inset-0 rounded-xl border transition-colors duration-300 ${
            isFullscreenView ? 'border-sky-500/30' : 'border-white/10'
          }`} />
          <Maximize2 
            size={18} 
            className={`transition-transform duration-500 ${isFullscreenView ? 'rotate-180' : 'rotate-0'}`} 
          />
        </button>

        <div className="w-8 h-px bg-white/10 my-2" />
        
        <div className="flex-1 flex flex-col gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id && isOpen;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (activeTab === tab.id && isOpen) {
                    onToggle();
                    return;
                  }
                  onTabChange(tab.id);
                  if (!isOpen) onToggle();
                }}
                className={`p-2 rounded-lg transition-all relative group ${
                  isActive ? 'text-sky-400 bg-sky-500/10' : 'text-white/30 hover:text-white/60'
                }`}
              >
                <tab.icon size={20} />
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-500 rounded-full`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`h-full bg-[#0a0a0a]/95 backdrop-blur-xl border-${isLeft ? 'r' : 'l'} border-white/10 overflow-hidden shadow-2xl relative`}
          >
            {/* 高光蒙层 */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="w-[320px] h-full relative z-10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarPanel;
