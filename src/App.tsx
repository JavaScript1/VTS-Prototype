/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  ShieldAlert, 
  Settings, 
  User, 
  ChevronRight, 
  ChevronLeft,
  Map as MapIcon,
  Radio,
  AlertTriangle,
  Info,
  Maximize2,
  Clock,
  Filter,
  LocateFixed,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents, Polygon, Polyline } from 'react-leaflet';
import L from 'leaflet';

// 地图状态持久化组件
const MapStatePersister = () => {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      localStorage.setItem('vts-map-center', JSON.stringify([center.lat, center.lng]));
    },
    zoomend: (e) => {
      const map = e.target;
      localStorage.setItem('vts-map-zoom', map.getZoom().toString());
    },
  });
  return null;
};

// 模拟船舶位置数据 (以吴淞口5号锚地为中心分布)
const SHIP_POSITIONS = [...Array(40)].map((_, i) => ({
  id: i,
  lat: 31.40 + Math.random() * 0.1,
  lng: 121.52 + Math.random() * 0.15,
  name: `船舶 ${1000 + i}`,
  type: Math.random() > 0.5 ? '货轮' : '油轮',
  status: Math.random() > 0.8 ? 'warning' : 'normal'
}));

// --- 类型定义 ---

type SidebarTab = 'vhf' | 'intent' | 'warning';

interface VHFMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  date: string;
  duration: string;
  isVTS: boolean;
}

interface Alert {
  id: string;
  type: string;
  summary: string;
  time: string;
  level: 'high' | 'medium' | 'low';
}

// --- 模拟数据 ---

const MOCK_VHF_MESSAGES: VHFMessage[] = [
  { id: '1', sender: '运兴96', content: '吴淞控制中心[运兴96]。', time: '16:32:34', date: '2025-12-17', duration: '1.99s', isVTS: false },
  { id: '2', sender: '交管_127705', content: '请讲。', time: '16:32:35', date: '2025-12-17', duration: '0.58s', isVTS: true },
  { id: '3', sender: '易航158', content: '在9号锚地这个锚这个位置可以锚泊吧。', time: '16:32:39', date: '2025-12-17', duration: '2.69s', isVTS: false },
  { id: '4', sender: '永发589', content: '吴淞交管吴淞交管，[永发589]。', time: '16:32:46', date: '2025-12-17', duration: '2.45s', isVTS: false },
  { id: '5', sender: '永发589', content: '，[永发589]呃，粮油码头。', time: '16:32:51', date: '2025-12-17', duration: '2.84s', isVTS: false },
  { id: '6', sender: '永发589', content: '苏个角粮油码头出口出口准备在圆圆沙啊，由南向北穿越走和塘上水。', time: '16:32:57', date: '2025-12-17', duration: '5.43s', isVTS: false },
  { id: '7', sender: '交管_30736', content: '开车了，好安全报。', time: '16:32:59', date: '2025-12-17', duration: '1.72s', isVTS: true },
  { id: '8', sender: 'spk_127707', content: '好的，那现在可以出港池吧。', time: '16:33:02', date: '2025-12-17', duration: '2.03s', isVTS: false },
  { id: '9', sender: '交管_114824', content: '可以可以。', time: '16:33:05', date: '2025-12-17', duration: '0.93s', isVTS: true },
];

const MOCK_ALERTS: Alert[] = [
  { id: 'a1', type: '进入禁航区', summary: '江海通8进入禁航区【测试禁航区1】', time: '1分钟 57秒前', level: 'high' },
  { id: 'a2', type: '进入禁锚区', summary: '新海安进入禁锚区【测试禁锚区2】', time: '1小时 38分钟 20秒前', level: 'high' },
  { id: 'a3', type: '超速警报', summary: '“星海”轮在航道内航速超过 12 节。', time: '5分钟前', level: 'medium' },
  { id: 'a4', type: '走锚风险', summary: '检测到“蓝波”轮可能存在走锚风险。', time: '12分钟前', level: 'low' },
];

const VESSEL_DISTRIBUTION = [
  { type: '货船', count: 625, color: '#0ea5e9' },
  { type: '未知', count: 179, color: '#64748b' },
  { type: '油船', count: 88, color: '#f59e0b' },
  { type: '拖船', count: 81, color: '#3b82f6' },
  { type: '疏浚/水下作业', count: 47, color: '#8b5cf6' },
  { type: '其他', count: 44, color: '#ec4899' },
  { type: '执法船', count: 25, color: '#ef4444' },
  { type: '污染控制船', count: 17, color: '#06b6d4' },
  { type: '航标', count: 13, color: '#eab308' },
];

const ANCHORAGE_DATA = [
  { name: '南槽锚地', occupancy: 85, total: 14, current: 12, status: 'busy' },
  { name: '绿华山锚地', occupancy: 40, total: 10, current: 4, status: 'normal' },
  { name: '圆圆沙锚地', occupancy: 92, total: 20, current: 18, status: 'full' },
  { name: '宝山锚地', occupancy: 65, total: 12, current: 8, status: 'normal' },
];

interface IntentStep {
  label: string;
  status: 'completed' | 'active' | 'pending';
  action: string;
}

interface IntentItem {
  ship: string;
  past: string;
  current: string;
  destination: string;
  confidence: number;
  time: string;
  details: string;
  path: IntentStep[];
}

const INTENT_DATA: IntentItem[] = [
  {
    ship: '远洋99',
    past: '6号锚地申请起锚',
    current: '吴淞口由北向南划江',
    destination: '黄浦江',
    confidence: 92,
    time: '11:20',
    details: '该船已完成起锚，目前在主航道由北向南行驶至吴淞口附近，正准备划江进入黄浦江。',
    path: [
      { label: '6号锚地', status: 'completed', action: '申请起锚' },
      { label: '吴淞口', status: 'active', action: '由北向南划江' },
      { label: '黄浦江', status: 'pending', action: '目的地' }
    ]
  },
  {
    ship: '海丰国际',
    past: '圆圆沙锚地起锚',
    current: '南槽航道南下',
    destination: '外高桥码头',
    confidence: 85,
    time: '11:35',
    details: '该船已从圆圆沙锚地起锚，目前正进入南槽航道由北向南航行，预计前往外高桥码头靠泊。',
    path: [
      { label: '圆圆沙', status: 'completed', action: '已起锚' },
      { label: '南槽航道', status: 'active', action: '由北向南航行' },
      { label: '外高桥', status: 'pending', action: '靠泊' }
    ]
  }
];

// --- 组件 ---

const SidebarPanel = ({ 
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  position = 'left',
  showBars,
  onToggleBars,
  children
}: { 
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  isOpen: boolean;
  onToggle: () => void;
  position?: 'left' | 'right';
  showBars: boolean;
  onToggleBars: () => void;
  children: React.ReactNode;
}) => {
  const tabs = [
    { id: 'vhf' as const, icon: Radio, label: 'VHF' },
    { id: 'intent' as const, icon: LocateFixed, label: '意图' },
    { id: 'warning' as const, icon: AlertTriangle, label: '预警' },
  ];

  const isLeft = position === 'left';

  return (
    <div className={`flex h-full z-[3000] ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Navigation Rail */}
      <div className={`w-12 h-full bg-[#050505] border-${isLeft ? 'r' : 'l'} border-white/10 flex flex-col items-center py-4 gap-4`}>
        {/* Top/Bottom Bars Toggle - Moved here */}
        <button 
          onClick={onToggleBars}
          className={`p-2 rounded-lg transition-all group relative ${
            !showBars ? 'text-sky-400 bg-sky-500/10' : 'text-white/30 hover:text-white/60'
          }`}
          title={showBars ? "进入全屏监控" : "退出全屏监控"}
        >
          <Maximize2 size={18} className={`transition-transform duration-500 ${!showBars ? 'rotate-180' : 'rotate-0'}`} />
          {!showBars && (
            <motion.div 
              layoutId="activeBars"
              className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-500 rounded-full`}
            />
          )}
        </button>

        {/* Redesigned Sidebar Toggle Button */}
        <button 
          onClick={onToggle}
          className={`group relative p-2 rounded-xl transition-all duration-300 ${
            isOpen 
              ? 'bg-white/5 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' 
              : 'bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
          } hover:scale-105 active:scale-95`}
        >
          <div className={`absolute inset-0 rounded-xl border transition-colors duration-300 ${
            isOpen ? 'border-white/10' : 'border-sky-500/30'
          }`} />
          <ChevronRight 
            size={18} 
            className={`transition-transform duration-500 ease-out ${
              isOpen 
                ? (isLeft ? 'rotate-180' : 'rotate-0') 
                : (isLeft ? 'rotate-0' : 'rotate-180')
            }`} 
          />
          {!isOpen && (
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          )}
        </button>

        <div className="w-8 h-px bg-white/10 my-2" />
        
        <div className="flex-1 flex flex-col gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                if (!isOpen) onToggle();
              }}
              className={`p-2 rounded-lg transition-all relative group ${
                activeTab === tab.id ? 'text-sky-400 bg-sky-500/10' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <tab.icon size={20} />
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 w-0.5 h-4 bg-sky-500 rounded-full`}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`h-full transition-colors duration-500 border-${isLeft ? 'r' : 'l'} border-white/10 flex flex-col overflow-hidden ${
              activeTab === 'vhf' 
                ? 'bg-[#0a0a0a]/90 backdrop-blur-md' 
                : 'bg-transparent backdrop-blur-none'
            }`}
          >

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 浮动面板组件 ---

const IntentConflictPanel = () => (
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

const CrewApplicationPanel = () => (
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

const SystemSuggestionPanel = () => (
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

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [showBars, setShowBars] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('vhf');
  const [selectedIntent, setSelectedIntent] = useState<number | null>(null);
  const [intents, setIntents] = useState<IntentItem[]>(INTENT_DATA);
  const [editingIntentIndex, setEditingIntentIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ action: string; details: string }>({ action: '', details: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isControlPanelExpanded, setIsControlPanelExpanded] = useState(false);
  const [showEncounterLines, setShowEncounterLines] = useState(true);
  const [showIntentTracking, setShowIntentTracking] = useState(true);
  const [showVesselDistribution, setShowVesselDistribution] = useState(false);
  const [showAnchorageSituation, setShowAnchorageSituation] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-white font-sans overflow-hidden flex flex-col">
      {/* --- 顶部导航栏 --- */}
      <AnimatePresence>
        {showBars && (
          <motion.header 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 56, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 z-[3000] shrink-0"
          >
            <div className="flex items-center gap-4">
              <div className="w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input 
                  type="text" 
                  placeholder="搜索船舶..." 
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:border-sky-500/50 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-white/5 rounded-full text-white/60 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`p-2 rounded-full transition-all relative ${showUserMenu ? 'bg-sky-500/20 text-sky-400' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  <User size={20} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl z-50"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
                              <User size={16} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white/90">管理员</div>
                              <div className="text-[10px] text-white/40">在线</div>
                            </div>
                          </div>
                          
                          <div className="h-px bg-white/5 mx-1" />
                          
                          <div className="px-2 py-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">当前区域</div>
                            <div className="flex items-center gap-2 text-xs text-white/70">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              外高桥区域
                            </div>
                          </div>

                          <button className="w-full flex items-center gap-2 px-2 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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

      {/* --- 主内容区 --- */}
      <main className={`flex-1 flex overflow-hidden relative ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* 统一侧边栏 */}
        <SidebarPanel 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          position={sidebarPosition}
          showBars={showBars}
          onToggleBars={() => setShowBars(!showBars)}
        >
          {activeTab === 'vhf' && (
            <div className="p-3 space-y-6">
              {MOCK_VHF_MESSAGES.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isVTS ? 'items-end' : 'items-start'}`}>
                  {/* Header */}
                  <div className={`flex items-center gap-2 mb-1.5 ${msg.isVTS ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-[11px] font-bold text-white/80">{msg.sender}</span>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${msg.isVTS ? 'bg-sky-600/40 text-sky-200' : 'bg-sky-900/40 text-sky-300'}`}>
                      <Radio size={10} className={msg.isVTS ? 'text-sky-300' : 'text-sky-400'} />
                      {msg.duration}
                    </div>
                    <span className="text-[10px] font-mono text-white/30">{msg.date} {msg.time}</span>
                    {msg.isVTS && (
                      <div className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center">
                        <User size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`flex items-center gap-2 ${msg.isVTS ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`max-w-[85%] p-2.5 rounded-lg text-xs leading-relaxed relative ${
                      msg.isVTS 
                        ? 'bg-sky-600/80 text-white border border-sky-500/30' 
                        : 'bg-white/5 text-white/90 border border-white/10'
                    }`}>
                      {msg.content}
                    </div>
                    <button className="p-1 text-sky-500/50 hover:text-sky-400 transition-colors">
                      <Settings size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'intent' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">意图识别列表</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                  <div className="w-1 h-1 rounded-full bg-sky-500 animate-pulse delay-75" />
                  <div className="w-1 h-1 rounded-full bg-sky-500 animate-pulse delay-150" />
                </div>
              </div>

              {intents.map((item, i) => (
                <motion.div 
                  key={i} 
                  layout
                  onClick={() => {
                    if (editingIntentIndex !== i) {
                      setSelectedIntent(selectedIntent === i ? null : i);
                    }
                  }}
                  className={`bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden ${
                    selectedIntent === i ? 'ring-1 ring-sky-500/50 bg-sky-500/5' : ''
                  }`}
                >
                  {selectedIntent === i && (
                    <motion.div 
                      layoutId="glow"
                      className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent pointer-events-none"
                    />
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white/90">{item.ship}</span>
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded text-[9px] font-bold text-sky-400">
                          <Clock size={10} />
                          {item.time}
                        </div>
                      </div>
                      {/* 当前意图高亮标签 */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">
                          当前意图: {item.path.find(p => p.status === 'active')?.action}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-sky-400">{item.confidence}%</span>
                      <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${item.confidence}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* 线性关系展示 */}
                  <div className="relative flex items-center justify-between px-2 mb-4">
                    {/* 连接线 */}
                    <div className="absolute top-1/2 left-6 right-6 h-[1px] bg-white/10 -translate-y-1/2 z-0" />
                    <div 
                      className="absolute top-1/2 left-6 h-[1px] bg-sky-500 -translate-y-1/2 z-0 transition-all duration-1000" 
                      style={{ width: 'calc(50% - 24px)' }} 
                    />

                    {item.path.map((step, idx) => (
                      <div key={idx} className="relative z-10 flex flex-col items-center gap-1">
                        <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                          step.status === 'completed' ? 'bg-sky-500 border-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]' :
                          step.status === 'active' ? 'bg-[#050505] border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.8)] scale-125' :
                          'bg-[#050505] border-white/20'
                        }`}>
                          {step.status === 'completed' && <div className="w-1 h-1 bg-white rounded-full" />}
                          {step.status === 'active' && <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${
                            step.status === 'active' ? 'text-sky-400 scale-110' : 'text-white/30'
                          }`}>
                            {step.label}
                          </span>
                          <div className={`px-1.5 py-0.5 rounded transition-all ${
                            step.status === 'active' ? 'bg-sky-500/20 border border-sky-500/30 mt-0.5' : ''
                          }`}>
                            <span className={`text-[8px] font-bold whitespace-nowrap transition-colors ${
                              step.status === 'active' ? 'text-white' : 'text-white/20'
                            }`}>
                              {step.action}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {selectedIntent === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                          <div className="flex items-center gap-2">
                            <Info size={12} className="text-sky-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">意图推演详情</span>
                          </div>
                          
                          {editingIntentIndex === i ? (
                            <div className="space-y-3 bg-white/5 p-3 rounded-lg border border-sky-500/30">
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">当前动作更正</label>
                                <input 
                                  autoFocus
                                  type="text"
                                  value={editForm.action}
                                  onChange={(e) => setEditForm({ ...editForm, action: e.target.value })}
                                  className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:border-sky-500 outline-none transition-colors"
                                  placeholder="输入新的动作描述..."
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">推演细节更正</label>
                                <textarea 
                                  value={editForm.details}
                                  onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                                  className="w-full bg-[#050505] border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:border-sky-500 outline-none transition-colors h-20 resize-none"
                                  placeholder="输入更准确的推演细节..."
                                />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newIntents = [...intents];
                                    const activeStepIndex = newIntents[i].path.findIndex(p => p.status === 'active');
                                    if (activeStepIndex !== -1) {
                                      newIntents[i].path[activeStepIndex].action = editForm.action;
                                    }
                                    newIntents[i].details = editForm.details;
                                    setIntents(newIntents);
                                    setEditingIntentIndex(null);
                                  }}
                                  className="flex-1 py-1.5 bg-sky-500 text-white text-[9px] font-black uppercase tracking-widest rounded hover:bg-sky-400 transition-colors"
                                >
                                  保存修改
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingIntentIndex(null);
                                  }}
                                  className="px-3 py-1.5 bg-white/5 text-white/50 text-[9px] font-black uppercase tracking-widest rounded hover:bg-white/10 transition-colors"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-[11px] leading-relaxed text-white/70 font-medium bg-white/5 p-3 rounded-lg border border-white/5">
                                {item.details}
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <button className="py-2 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20">
                                  确认意图
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingIntentIndex(i);
                                    const activeStep = item.path.find(p => p.status === 'active');
                                    setEditForm({
                                      action: activeStep?.action || '',
                                      details: item.details
                                    });
                                  }}
                                  className="py-2 bg-white/5 text-white/50 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                                >
                                  细节更正
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'warning' && (
            <div className="p-4 space-y-6">
              {/* 风险概览 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-red-500">2</div>
                  <div className="text-[8px] font-bold uppercase text-red-500/70">高风险</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-orange-500">1</div>
                  <div className="text-[8px] font-bold uppercase text-orange-500/70">中风险</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-blue-500">1</div>
                  <div className="text-[8px] font-bold uppercase text-blue-500/70">低风险</div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* 预警列表 */}
              <div className="space-y-4">

                
                {MOCK_ALERTS.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`relative pl-3 border-l-2 ${
                      alert.level === 'high' ? 'border-red-500' : 
                      alert.level === 'medium' ? 'border-orange-500' : 'border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase ${
                        alert.level === 'high' ? 'text-red-500' : 
                        alert.level === 'medium' ? 'text-orange-500' : 'text-blue-500'
                      }`}>{alert.type}</span>
                      <span className="text-[9px] font-mono text-white/30">{alert.time}</span>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed mb-2">{alert.summary}</p>
                    <div className="flex gap-2">
                      <button className="text-[9px] font-bold uppercase tracking-tighter text-sky-500 hover:underline">定位</button>
                      <button className="text-[9px] font-bold uppercase tracking-tighter text-white/30 hover:text-white">忽略</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SidebarPanel>

        {/* 中间：海图容器 */}
        <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
          <MapContainer 
            center={(() => {
              const saved = localStorage.getItem('vts-map-center');
              return saved ? JSON.parse(saved) : [31.425, 121.565];
            })()} 
            zoom={(() => {
              const saved = localStorage.getItem('vts-map-zoom');
              return saved ? parseInt(saved, 10) : 13;
            })()} 
            className="h-full w-full"
            zoomControl={false}
          >
            <MapStatePersister />
            {/* ESRI 卫星图层 */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
            
            {/* ESRI 边界与标注叠加层 - 确保在卫星图上能看到地名 */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri'
            />

            {/* OpenSeaMap 叠加层 (航标、灯塔、航道) */}
            <TileLayer
              url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
            />

            {/* 冲突船舶与 CPA 锥形区域 (参考图片) */}
            <CircleMarker
              center={[31.43, 121.58]}
              radius={8}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
              }}
            >
              <Popup>
                <div className="p-1 font-bold text-red-500">意图冲突: 非法锚泊</div>
              </Popup>
            </CircleMarker>
            <Polygon 
              positions={[
                [31.43, 121.58],
                [31.44, 121.59],
                [31.42, 121.60]
              ]}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#ef4444',
                weight: 1,
                opacity: 0.3,
                fillOpacity: 0.4
              }}
            />

            {/* 申请船舶与 路径规划 (参考图片) */}
            <CircleMarker
              center={[31.41, 121.55]}
              radius={6}
              pathOptions={{
                fillColor: '#0ea5e9',
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 1
              }}
            />
            <Polyline 
              positions={[
                [31.41, 121.55],
                [31.42, 121.54],
                [31.43, 121.53]
              ]}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                dashArray: '5, 10',
                opacity: 0.6
              }}
            />

            {/* 船舶标记 */}
            {SHIP_POSITIONS.map((ship) => (
              <CircleMarker
                key={ship.id}
                center={[ship.lat, ship.lng]}
                radius={ship.status === 'warning' ? 6 : 4}
                pathOptions={{
                  fillColor: ship.status === 'warning' ? '#ef4444' : '#22c55e',
                  color: ship.status === 'warning' ? '#ef4444' : '#22c55e',
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.8
                }}
              >
                <Popup>
                  <div className="p-1">
                    <div className="font-bold text-sm">{ship.name}</div>
                    <div className="text-xs text-gray-500">类型: {ship.type}</div>
                    <div className="text-xs text-gray-500">状态: {ship.status === 'warning' ? '异常' : '正常'}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          {/* 浮动标记: 南槽锚地 (参考图片) */}
          <div className="absolute top-[40%] left-[37%] z-[1500]">
            <div className="bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded shadow-lg font-black uppercase tracking-widest">
              南槽锚地
            </div>
          </div>

          {/* 浮动面板 */}
          <IntentConflictPanel />
          <CrewApplicationPanel />
          <SystemSuggestionPanel />

          {/* 地图控制叠加层 */}
          <div className="absolute top-4 left-4 flex flex-col gap-4 z-[1500]">
            {/* 这里可以放置地图控制按钮 */}
          </div>

          {/* 浮动标记: 前往泊位 */}
          <div className="absolute top-[45%] left-[38%] z-[1500]">
            <div className="relative group cursor-pointer">
              <div className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded shadow-lg flex items-center gap-1 font-bold">
                前往泊位
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-orange-500 absolute -bottom-1 left-1/2 -translate-x-1/2" />
              </div>
            </div>
          </div>

          {/* 警示弹窗: 进入禁锚区 (参考图片) */}
          <div className="absolute top-[48%] left-[52%] z-[1500]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-red-600/90 backdrop-blur-md border border-red-500 rounded-lg p-3 shadow-2xl w-48 relative"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">进入禁锚区</span>
                <button className="text-white/60 hover:text-white"><Settings size={10} /></button>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-white">恒力5【危险品满载】</div>
                <div className="text-[10px] text-white/80 leading-tight">恒力5进入禁锚区【测试禁锚区2】</div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-600/90 rotate-45 border-r border-b border-red-500" />
              
              {/* 标记点 */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute inset-0" />
                <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white relative z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* --- 底部状态栏 --- */}
      <AnimatePresence>
        {showBars && (
          <motion.footer 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 40, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between px-4 z-[3000] shrink-0"
          >
            <div className="flex items-center gap-6 flex-1 max-w-[400px]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowVesselDistribution(!showVesselDistribution)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${showVesselDistribution ? 'bg-sky-500/20 text-sky-400' : 'text-white/30 hover:text-white/50'}`}
                >
                  <div className={`w-1 h-1 rounded-full ${showVesselDistribution ? 'bg-sky-400 animate-pulse' : 'bg-white/20'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">船舶分布</span>
                </button>
                <button 
                  onClick={() => setShowAnchorageSituation(!showAnchorageSituation)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${showAnchorageSituation ? 'bg-blue-500/20 text-blue-400' : 'text-white/30 hover:text-white/50'}`}
                >
                  <div className={`w-1 h-1 rounded-full ${showAnchorageSituation ? 'bg-blue-400 animate-pulse' : 'bg-white/20'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">锚地态势</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-8 relative">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">比例尺</span>
                <div className="w-16 h-1 bg-white/10 relative rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-white/30" />
                </div>
                <span className="text-[10px] font-mono text-white/50">2.5 NM</span>
              </div>

              <div className="flex items-center gap-2 border-l border-white/5 pl-4">
                <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">数据同步: 0.2s</span>
              </div>

              <AnimatePresence>
                {isControlPanelExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full right-0 mb-2 w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl z-[5000]"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/70">船舶遇到线开关</span>
                        <button 
                          onClick={() => setShowEncounterLines(!showEncounterLines)}
                          className={`w-8 h-4 rounded-full transition-colors relative ${showEncounterLines ? 'bg-sky-500' : 'bg-white/10'}`}
                        >
                          <motion.div 
                            animate={{ x: showEncounterLines ? 16 : 2 }}
                            className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/70">意图跟踪开关</span>
                        <button 
                          onClick={() => setShowIntentTracking(!showIntentTracking)}
                          className={`w-8 h-4 rounded-full transition-colors relative ${showIntentTracking ? 'bg-sky-500' : 'bg-white/10'}`}
                        >
                          <motion.div 
                            animate={{ x: showIntentTracking ? 16 : 2 }}
                            className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>

                      <div className="h-px bg-white/5" />

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/70">面板位置 (左/右)</span>
                        <button 
                          onClick={() => setSidebarPosition(sidebarPosition === 'left' ? 'right' : 'left')}
                          className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 hover:bg-white/10 transition-all"
                        >
                          <span className={`text-[10px] font-bold ${sidebarPosition === 'left' ? 'text-sky-400' : 'text-white/30'}`}>左</span>
                          <div className="w-px h-2 bg-white/10" />
                          <span className={`text-[10px] font-bold ${sidebarPosition === 'right' ? 'text-sky-400' : 'text-white/30'}`}>右</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setIsControlPanelExpanded(!isControlPanelExpanded)}
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${isControlPanelExpanded ? 'text-sky-500' : 'text-white/40 hover:text-white'}`}
              >
                展开控制面板 <ChevronRight size={12} className={`transition-transform duration-300 ${isControlPanelExpanded ? 'rotate-[90deg]' : 'rotate-[-90deg]'}`} />
              </button>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* 全局滚动条样式 */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />

      {/* 辖区船舶分布 - 浮动面板 */}
      <AnimatePresence>
        {showVesselDistribution && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1,
              left: sidebarPosition === 'left' 
                ? (sidebarOpen ? 392 : 72) 
                : 24
            }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            className="fixed bottom-16 w-72 bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/20 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(14,165,233,0.1)] z-[4000]"
          >
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-4 bg-sky-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.6)]" />
                  <div className="absolute inset-0 bg-sky-400 blur-sm opacity-50 animate-pulse" />
                </div>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-white/90">辖区船舶分布</span>
              </div>
              <button 
                onClick={() => setShowVesselDistribution(false)} 
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {VESSEL_DISTRIBUTION.map((item, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-white/40 group-hover:text-white/70 transition-colors uppercase tracking-wider">{item.type}</span>
                    <span className="text-white font-mono tabular-nums">{item.count}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / 625) * 100}%` }}
                      transition={{ duration: 1.2, ease: "circOut", delay: idx * 0.08 }}
                      className="h-full rounded-full relative"
                      style={{ backgroundColor: item.color }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-end">
              <div className="space-y-0.5">
                <span className="text-[9px] text-white/20 uppercase font-black tracking-[0.3em]">Total Fleet</span>
                <div className="text-2xl font-mono text-sky-400 font-black leading-none tracking-tighter">1,157</div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-widest mb-1">Live Status</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1 h-3 bg-emerald-500/30 rounded-full overflow-hidden">
                      <motion.div 
                        animate={{ height: ['20%', '80%', '40%', '100%', '20%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-full bg-emerald-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 锚地态势 - 浮动面板 */}
      <AnimatePresence>
        {showAnchorageSituation && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1,
              left: sidebarPosition === 'left' 
                ? (sidebarOpen ? 704 : 384) 
                : 320
            }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150 }}
            className="fixed bottom-16 w-72 bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/20 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(59,130,246,0.1)] z-[4000]"
          >
            <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-2 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                  <div className="absolute inset-0 bg-blue-400 blur-sm opacity-50 animate-pulse" />
                </div>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-white/90">锚地态势概览</span>
              </div>
              <button 
                onClick={() => setShowAnchorageSituation(false)} 
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
              {ANCHORAGE_DATA.map((item, idx) => (
                <div key={idx} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-white/90 uppercase tracking-tight group-hover:text-sky-400 transition-colors">{item.name}</span>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest shadow-sm ${
                      item.status === 'full' ? 'bg-red-500 text-white' : 
                      item.status === 'busy' ? 'bg-orange-500 text-white' : 'bg-sky-500 text-white'
                    }`}>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                      {item.status === 'full' ? '饱和' : item.status === 'busy' ? '繁忙' : '空闲'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <div className="text-[9px] text-white/30 font-black uppercase tracking-widest">Occupancy</div>
                      <div className="text-sm font-mono text-white/90 font-bold">{item.occupancy}%</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-[9px] text-white/30 font-black uppercase tracking-widest">Vessels</div>
                      <div className="text-sm font-mono text-white/90 font-bold">{item.current}<span className="text-white/30 mx-0.5">/</span>{item.total}</div>
                    </div>
                  </div>
                  
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.occupancy}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={`h-full rounded-full relative ${
                        item.occupancy > 90 ? 'bg-red-500' : item.occupancy > 70 ? 'bg-orange-500' : 'bg-sky-500'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-50" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
