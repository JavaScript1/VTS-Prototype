/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Search, Maximize2, Radio, LocateFixed, AlertTriangle, Anchor, Ship, X, Settings, User, LayoutGrid, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ShipSearchResult, SidebarTab } from '../../types';
import { HOME_VIEW_MODE_OPTIONS, type HomeViewMode } from '../../features/app/utils/viewModes';

type SidebarPanelProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  isOpen: boolean;
  onToggle: () => void;
  position?: 'left' | 'right';
  showBars: boolean;
  onToggleBars: () => void;
  shipSearchQuery: string;
  onShipSearchQueryChange: (value: string) => void;
  shipSearchResults: ShipSearchResult[];
  onShipSearchSelect: (shipId: string) => void;
  currentMode: HomeViewMode;
  onModeChange: (mode: HomeViewMode) => void;
  onOpenAdmin: () => void;
  onToggleUserMenu: () => void;
  onCloseUserMenu: () => void;
  showUserMenu: boolean;
  children: React.ReactNode;
};

export default function SidebarPanel({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  position = 'left',
  showBars,
  onToggleBars,
  shipSearchQuery,
  onShipSearchQueryChange,
  shipSearchResults,
  onShipSearchSelect,
  currentMode,
  onModeChange,
  onOpenAdmin,
  onToggleUserMenu,
  onCloseUserMenu,
  showUserMenu,
  children,
}: SidebarPanelProps) {
  const tabs = [
    { id: 'ship' as const, icon: Ship, label: '船舶' },
    { id: 'vhf' as const, icon: Radio, label: 'VHF' },
    { id: 'intent' as const, icon: LocateFixed, label: '意图' },
    { id: 'warning' as const, icon: AlertTriangle, label: '预警' },
    { id: 'anchorage' as const, icon: Anchor, label: '锚地' },
  ];

  const isLeft = position === 'left';
  const isFullscreenView = !showBars;
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isModeHovered, setIsModeHovered] = useState(false);
  const modeHoverTimeoutRef = useRef<number | null>(null);

  const handleRailShipSelect = (shipId: string) => {
    onShipSearchSelect(shipId);
    setIsSearchExpanded(false);
  };

  const handleModeMouseEnter = () => {
    if (modeHoverTimeoutRef.current) window.clearTimeout(modeHoverTimeoutRef.current);
    setIsModeHovered(true);
  };

  const handleModeMouseLeave = () => {
    modeHoverTimeoutRef.current = window.setTimeout(() => {
      setIsModeHovered(false);
    }, 300);
  };

  return (
    <div className={`z-[3000] flex h-full ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className={`flex h-full flex-col items-center bg-[#050505] border-${isLeft ? 'r' : 'l'} border-white/10`}
        style={{
          width: 'var(--vts-sidebar-rail-width)',
          gap: 'var(--vts-sidebar-gap)',
          paddingTop: 'var(--vts-sidebar-padding-y)',
          paddingBottom: 'var(--vts-sidebar-padding-y)',
        }}
      >
        <div className='relative'>
          <button
            onClick={() => setIsSearchExpanded((prev) => !prev)}
            className={`rounded-xl p-2.5 transition-all ${isSearchExpanded ? 'bg-sky-500/10 text-sky-400' : 'text-white/30 hover:text-white/60'}`}
            title='搜索船舶'
          >
            <Search size={20} />
          </button>
          <AnimatePresence>
            {isSearchExpanded && (
              <>
                <div className='fixed inset-0 z-40 cursor-pointer' onClick={() => setIsSearchExpanded(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute z-50 w-72 space-y-3 rounded-2xl border border-white/10 bg-[#05080d]/95 p-4 shadow-2xl backdrop-blur-xl ${isLeft ? 'left-full ml-3' : 'right-full mr-3'}`}
                >
                  <div className='flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-white/40'>
                    搜索历史
                    <button
                      onClick={() => setIsSearchExpanded(false)}
                      className='text-white/40 hover:text-white'
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-white/30' size={14} />
                    <input
                      type='text'
                      value={shipSearchQuery}
                      onChange={(e) => onShipSearchQueryChange(e.target.value)}
                      placeholder='输入船名 / MMSI...'
                      className='w-full rounded-lg border border-white/15 bg-[#0a0a0a] py-2 pl-9 pr-3 text-[12px] text-white placeholder:text-white/30 focus:border-sky-500/40 focus:outline-none'
                    />
                  </div>
                  {shipSearchQuery.trim().length === 0 && (
                    <div className='text-[10px] text-white/35'>
                      输入关键字或点击下方结果可快速跳转到船舶详情。
                    </div>
                  )}
                  <div className='custom-scrollbar max-h-48 overflow-y-auto rounded-xl border border-white/5 bg-white/[0.02]'>
                    {shipSearchResults.length > 0 ? (
                      shipSearchResults.slice(0, 6).map((ship) => (
                        <button
                          key={ship.id}
                          onClick={() => handleRailShipSelect(ship.id)}
                          className='flex w-full items-center justify-between gap-3 border-b border-white/5 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-white/[0.04]'
                        >
                          <div className='min-w-0'>
                            <div className='truncate text-[11px] font-semibold text-white'>{ship.name}</div>
                            <div className='mt-0.5 text-[10px] text-white/35'>{ship.mmsi} · {ship.type}</div>
                          </div>
                          <span className='truncate text-[10px] text-sky-300/80'>{ship.destination}</span>
                        </button>
                      ))
                    ) : (
                      <div className='px-3 py-3 text-center text-[10px] text-white/35'>未匹配到船舶，请继续输入关键字。</div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onToggleBars}
          className={`group relative rounded-xl p-2.5 transition-all duration-300 hover:scale-105 active:scale-95 ${
            isFullscreenView
              ? 'bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
              : 'bg-white/5 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
          }`}
          title={isFullscreenView ? '退出全屏监控' : '进入全屏监控'}
        >
          <div className={`absolute inset-0 rounded-xl border transition-colors duration-300 ${isFullscreenView ? 'border-sky-500/30' : 'border-white/10'}`} />
          <Maximize2 size={20} className={`transition-transform duration-500 ${isFullscreenView ? 'rotate-180' : 'rotate-0'}`} />
        </button>

        <div className='my-2 h-px w-[60%] bg-white/10' />

        <div className='flex flex-1 flex-col justify-start gap-5'>
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
                className={`group relative rounded-xl p-2.5 transition-all ${isActive ? 'bg-sky-500/10 text-sky-400' : 'text-white/30 hover:text-white/60'}`}
              >
                <tab.icon size={22} />
                {isActive && (
                  <motion.div
                    layoutId='activeTab'
                    className={`absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sky-500 ${isLeft ? 'left-0' : 'right-0'}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className='my-2 h-px w-[60%] bg-white/10' />

        <div className='flex flex-col gap-4 pb-2'>
          <div 
            className='relative'
            onMouseEnter={handleModeMouseEnter}
            onMouseLeave={handleModeMouseLeave}
          >
            <button
              className={`rounded-xl p-2.5 transition-all ${isModeHovered ? 'bg-sky-500/10 text-sky-400' : 'text-white/30 hover:text-white/60'}`}
              title='切换模式'
            >
              <LayoutGrid size={22} />
            </button>
            <AnimatePresence>
              {isModeHovered && (
                <motion.div
                  initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLeft ? -20 : 20 }}
                  className={`absolute bottom-0 z-50 w-48 space-y-1 rounded-2xl border border-white/10 bg-[#05080d]/95 p-2 shadow-2xl backdrop-blur-xl ${isLeft ? 'left-full ml-3' : 'right-full mr-3'}`}
                >
                  <div className='px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30'>模式切换</div>
                  {HOME_VIEW_MODE_OPTIONS.map((option) => {
                    const active = option.id === currentMode;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          onModeChange(option.id);
                          setIsModeHovered(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold transition-all ${
                          active
                            ? 'bg-sky-500/20 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {option.label}
                        {active && <div className='h-1.5 w-1.5 rounded-full bg-sky-500' />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onOpenAdmin}
            className='rounded-xl p-2.5 text-white/30 transition-all hover:bg-white/5 hover:text-white'
            title='后台设置'
          >
            <Settings size={22} />
          </button>

          <div className='relative'>
            <button
              onClick={onToggleUserMenu}
              className={`rounded-xl p-2.5 transition-all ${showUserMenu ? 'bg-sky-500/10 text-sky-400' : 'text-white/30 hover:text-white/60'}`}
              title='个人中心'
            >
              <User size={22} />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div className='fixed inset-0 z-40 cursor-pointer' onClick={onCloseUserMenu} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={`absolute bottom-0 z-50 w-48 rounded-2xl border border-white/10 bg-[#05080d]/95 p-3 shadow-2xl backdrop-blur-xl ${isLeft ? 'left-full ml-3' : 'right-full mr-3'}`}
                  >
                    <div className='space-y-3'>
                      <div className='flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400'>
                          <User size={16} />
                        </div>
                        <div>
                          <div className='text-[11px] font-bold text-white/90'>管理员</div>
                          <div className='text-[9px] text-white/40'>在线</div>
                        </div>
                      </div>

                      <div className='mx-1 h-px bg-white/5' />

                      <div className='px-2 py-1'>
                        <div className='mb-2 text-[9px] font-black uppercase tracking-widest text-white/25'>当前区域</div>
                        <div className='flex items-center gap-2 text-[10px] text-white/60'>
                          <div className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                          外高桥区域
                        </div>
                      </div>

                      <button className='flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[10px] text-rose-400 transition-colors hover:bg-rose-500/10'>
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
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'var(--vts-sidebar-panel-width)', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`flex flex-col overflow-hidden transition-colors duration-500 h-full border-${isLeft ? 'r' : 'l'} border-white/10 ${
              activeTab === 'vhf' || activeTab === 'ship'
                ? 'bg-[#0a0a0a]/90 backdrop-blur-md'
                : 'bg-transparent backdrop-blur-none'
            }`}
          >
            <div className='min-h-0 flex-1'>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}