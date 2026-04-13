import React, { useState } from 'react';
import { 
  User, 
  Users, 
  Lock, 
  Map as MapIcon, 
  Activity, 
  BookOpen, 
  Volume2, 
  Monitor, 
  BarChart3, 
  Shield, 
  Presentation,
  X,
  Plus,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  History,
  Clock,
  MessageSquare,
  Play,
  Search,
  Filter,
  Check,
  Settings,
  Radio,
  AlertTriangle,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';

import { 
  MOCK_AREAS, 
  AREA_CATEGORIES, 
  AREA_TYPE_MAPPING, 
  MOCK_RISK_STATS, 
  MOCK_INTENT_STATS,
  MOCK_VESSEL_DYNAMICS
} from '../../mockData';

const VTS_CHART_TILE_URL = 'https://test.shipdt.com/vts/chart/{z}/{x}/{y}.png';
const VTS_CHART_TILE_ATTRIBUTION = '&copy; ShipDT';

interface AdminPanelProps {
  onClose: () => void;
  playbackData: any;
  setPlaybackData: (data: any) => void;
  setDynamicPlaybackSession: (data: any) => void;
  initialMenu?: string;
  initialStatsTab?: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onClose, 
  playbackData, 
  setPlaybackData,
  setDynamicPlaybackSession,
  initialMenu = '区域设置',
  initialStatsTab = '值班统计'
}) => {
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [activeSubTab, setActiveSubTab] = useState('值班区域');
  const [activeScenarioTab, setActiveScenarioTab] = useState('VHF船舶会话');
  const [activeStatsTab, setActiveStatsTab] = useState(initialStatsTab);
  const [statsTimeRange, setStatsTimeRange] = useState('今天');
  const [statsArea, setStatsArea] = useState('全部区域');
  const [showVhfDetails, setShowVhfDetails] = useState(false);
  const [selectedVhfSnippet, setSelectedVhfSnippet] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  const menus = [
    { name: '个人信息', icon: User },
    { name: '角色管理', icon: Users },
    { name: '权限管理', icon: Lock },
    { name: '账号管理', icon: User },
    { name: '区域设置', icon: MapIcon },
    { name: '船舶动态', icon: Activity },
    { name: '字典管理', icon: BookOpen },
    { name: '语音设置', icon: Volume2 },
    { name: '显示设置', icon: Monitor },
    { name: '业务统计', icon: BarChart3 },
    { name: '预警管理', icon: Shield },
    { name: '场景演示', icon: Presentation },
  ];

  const handleEdit = (area: any) => {
    setEditData({
      ...area,
      category: activeSubTab,
      fields: area.fields || {}
    });
    setIsEditing(true);
  };

  const handleCreate = () => {
    const category = activeSubTab;
    const defaultType = Object.keys(AREA_TYPE_MAPPING[category])[0];
    const defaultFields: Record<string, string> = {};
    AREA_TYPE_MAPPING[category][defaultType].forEach(f => {
      defaultFields[f] = '';
    });
    
    setEditData({ 
      name: '', 
      category, 
      type: defaultType,
      fields: defaultFields 
    });
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="fixed inset-0 z-[7000] bg-[#050a10] flex flex-col overflow-hidden"
      >
        <header className="h-12 border-b border-white/5 bg-[#0a101a] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">名称:</span>
              <input 
                type="text" 
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="bg-transparent text-xs text-white font-bold focus:outline-none w-48"
                placeholder="输入区域名称..."
              />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">类型:</span>
              <select 
                value={editData.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const newFields: Record<string, string> = {};
                  AREA_TYPE_MAPPING[editData.category][newType].forEach(f => {
                    newFields[f] = editData.fields[f] || '';
                  });
                  setEditData({ ...editData, type: newType, fields: newFields });
                }}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white font-bold focus:outline-none"
              >
                {Object.keys(AREA_TYPE_MAPPING[editData.category]).map(t => (
                  <option key={t} value={t} className="bg-[#111]">{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
            >
              取消
            </button>
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-sky-500/20 transition-all"
            >
              保存区域
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r border-white/5 bg-[#0a101a] flex flex-col shrink-0">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">属性配置</h3>
              <div className="space-y-4">
                {AREA_TYPE_MAPPING[editData.category][editData.type].map(field => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">{field}</label>
                    <input 
                      type="text"
                      value={editData.fields[field] || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        fields: { ...editData.fields, [field]: e.target.value }
                      })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500/50 focus:outline-none transition-all"
                      placeholder={`输入${field}...`}
                    />
                  </div>
                ))}
                {AREA_TYPE_MAPPING[editData.category][editData.type].length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">该类型无需额外属性</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">绘制说明</h3>
              <div className="space-y-3">
                {[
                  { step: 1, text: '在地图上点击开始绘制顶点' },
                  { step: 2, text: '依次点击确定区域边界' },
                  { step: 3, text: '双击或点击起始点完成闭合' },
                  { step: 4, text: '拖动顶点可微调形状' }
                ].map(item => (
                  <div key={item.step} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 shrink-0">{item.step}</span>
                    <p className="text-[11px] text-white/60 leading-relaxed pt-0.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 relative bg-[#050a10]">
            <MapContainer
              center={[31.40, 121.60]}
              zoom={12}
              className="h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                url={VTS_CHART_TILE_URL}
                attribution={VTS_CHART_TILE_ATTRIBUTION}
              />
              <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                <button className="w-10 h-10 bg-[#0a101a] border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all shadow-2xl">
                  <Plus size={20} />
                </button>
                <button className="w-10 h-10 bg-[#0a101a] border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all shadow-2xl">
                  <X size={20} />
                </button>
              </div>
            </MapContainer>
            <div className="absolute top-4 left-4 z-[1000] bg-[#0a101a]/90 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex items-center gap-4 shadow-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">正在绘制模式</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-3">
                <button className="text-[10px] font-bold text-white/40 hover:text-white transition-colors">撤销上一点</button>
                <button className="text-[10px] font-bold text-white/40 hover:text-white transition-colors">清除重绘</button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-[6000] bg-[#050a10] flex overflow-hidden"
    >
      {/* 侧边栏 */}
      <div className="w-64 border-r border-white/5 bg-[#0a101a] flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">后台管理系统</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Admin Control</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menus.map(menu => (
              <button
                key={menu.name}
                onClick={() => setActiveMenu(menu.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  activeMenu === menu.name 
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <menu.icon size={18} className={activeMenu === menu.name ? 'text-white' : 'group-hover:text-sky-400 transition-colors'} />
                <span className="text-xs font-bold">{menu.name}</span>
                {activeMenu === menu.name && (
                  <motion.div layoutId="activeMenu" className="ml-auto">
                    <ChevronRight size={14} />
                  </motion.div>
                )}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-white/5">
          <button 
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all border border-white/10"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">返回实时监控</span>
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050a10]">
        <header className="h-16 border-b border-white/5 bg-[#0a101a]/50 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{activeMenu}</h3>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <span>系统</span>
              <ChevronRight size={10} />
              <span className="text-white/60">{activeMenu}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">系统运行正常</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeMenu === '区域设置' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {AREA_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveSubTab(cat)}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeSubTab === cat 
                          ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                          : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Plus size={16} />
                  新增区域
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-[#0a101a] border border-white/5 rounded-3xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">区域名称</th>
                        <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">类型</th>
                        <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">状态</th>
                        <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">规则数</th>
                        <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">更新时间</th>
                        <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {MOCK_AREAS[activeSubTab].map(area => (
                        <React.Fragment key={area.id}>
                          <tr className="group hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
                                  <MapIcon size={14} />
                                </div>
                                <span className="text-xs font-bold text-white">{area.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{area.type}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                {area.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono font-bold text-white/60">{area.rules}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-mono text-white/30">{area.time}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleEdit(area)}
                                  className="p-2 hover:bg-sky-500/20 rounded-lg text-white/40 hover:text-sky-400 transition-all"
                                >
                                  <Settings size={14} />
                                </button>
                                <button 
                                  onClick={() => setExpandedRowId(expandedRowId === area.id ? null : area.id)}
                                  className={`p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all ${expandedRowId === area.id ? 'rotate-180 text-sky-400' : ''}`}
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          <AnimatePresence>
                            {expandedRowId === area.id && (
                              <tr>
                                <td colSpan={6} className="px-6 py-0 border-none">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="py-6 grid grid-cols-4 gap-6 border-t border-white/5">
                                      {Object.entries(area.fields).map(([key, value]) => (
                                        <div key={key} className="space-y-1">
                                          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{key}</span>
                                          <p className="text-xs font-bold text-white/70">{value as string}</p>
                                        </div>
                                      ))}
                                      {Object.keys(area.fields).length === 0 && (
                                        <div className="col-span-4 py-4 text-center">
                                          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">无详细属性信息</p>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeMenu === '船舶动态' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                    <input 
                      type="text" 
                      placeholder="搜索船舶名称/MMSI..."
                      className="w-80 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-sky-500/50 focus:outline-none transition-all"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all">
                    <Filter size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">高级筛选</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <span>共计</span>
                  <span className="text-sky-400 font-mono text-sm">1,248</span>
                  <span>艘在航船舶</span>
                </div>
              </div>

              <div className="bg-[#0a101a] border border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">船舶名称</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">MMSI</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">类型</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">状态</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">始发港</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">目的港</th>
                      <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {MOCK_VESSEL_DYNAMICS.map(vessel => (
                      <tr key={vessel.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
                              <Activity size={14} />
                            </div>
                            <span className="text-xs font-bold text-white">{vessel.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-white/60">{vessel.mmsi}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">{vessel.type}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                            vessel.status === '正在作业' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                            vessel.status === '正在航行' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {vessel.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-white/60">{vessel.origin}</td>
                        <td className="px-6 py-4 text-xs text-white/60">{vessel.destination}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setPlaybackData(vessel)}
                            className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-sky-500/20 transition-all"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMenu === '场景演示' && (
            <div className="space-y-6">
              <div className="flex gap-2">
                {['VHF船舶会话', '历史轨迹分析', '风险演练'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveScenarioTab(tab)}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeScenarioTab === tab 
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                        : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeScenarioTab === 'VHF船舶会话' && (
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { id: 1, title: '吴淞口警戒区划江申请', vessel: '远洋 99', time: '10:05:22', lat: 30.125, lng: 122.460, snippets: [
                      { sender: '远洋 99', content: '吴淞中心，远洋99申请由北向南划江。', time: '10:05:22' },
                      { sender: '吴淞中心', content: '远洋99，收到，请注意避让主航道进港船舶。', time: '10:05:35' }
                    ]},
                    { id: 2, title: '圆圆沙锚地起锚报告', vessel: '海丰 77', time: '11:12:45', lat: 30.142, lng: 122.485, snippets: [
                      { sender: '海丰 77', content: '吴淞交管，海丰77圆圆沙锚地起锚。', time: '11:12:45' },
                      { sender: '吴淞交管', content: '海丰77，收到，注意航道动态。', time: '11:12:58' }
                    ]},
                    { id: 3, title: '南槽航道异常停泊询问', vessel: '顺风 6', time: '13:20:15', lat: 30.110, lng: 122.430, snippets: [
                      { sender: '吴淞中心', content: '顺风6，你船目前航速为0，请报告动态。', time: '13:20:15' },
                      { sender: '顺风 6', content: '吴淞中心，我船主机故障，正在尝试抢修。', time: '13:20:42' }
                    ]},
                    { id: 4, title: '长江口进港报备', vessel: '中远海运', time: '14:45:30', lat: 30.155, lng: 122.510, snippets: [
                      { sender: '中远海运', content: '吴淞交管，中远海运进港报备。', time: '14:45:30' },
                      { sender: '吴淞交管', content: '中远海运，收到，按预定航路进港。', time: '14:45:55' }
                    ]}
                  ].map(scenario => (
                    <motion.div
                      key={scenario.id}
                      whileHover={{ y: -4 }}
                      className="bg-[#0a101a] border border-white/5 rounded-3xl overflow-hidden group cursor-pointer"
                      onClick={() => {
                        setSelectedVhfSnippet(scenario);
                        setShowVhfDetails(true);
                      }}
                    >
                      <div className="h-40 bg-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a101a] to-transparent z-10" />
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-2 py-1 bg-sky-500/20 border border-sky-500/30 rounded-lg">
                          <Radio size={12} className="text-sky-400 animate-pulse" />
                          <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">VHF 实时录音</span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                          <Activity size={80} className="text-sky-500" />
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <h4 className="text-sm font-black text-white mb-1 group-hover:text-sky-400 transition-colors">{scenario.title}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{scenario.vessel}</span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <span className="text-[10px] font-mono text-white/30">{scenario.time}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {scenario.snippets.map((s, idx) => (
                            <div key={idx} className="flex gap-2 text-[11px] leading-relaxed">
                              <span className="font-black text-white/30 shrink-0 uppercase">{s.sender}:</span>
                              <span className="text-white/60 line-clamp-1">{s.content}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">点击查看详情</span>
                          <ChevronRight size={14} className="text-white/20 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMenu === '业务统计' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {['船舶风险统计', '意图统计', '值班统计'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveStatsTab(tab)}
                      className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeStatsTab === tab 
                          ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                          : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                    <Clock size={14} className="text-white/40" />
                    <select 
                      value={statsTimeRange}
                      onChange={(e) => setStatsTimeRange(e.target.value)}
                      className="bg-transparent text-[10px] font-black text-white uppercase tracking-widest focus:outline-none"
                    >
                      <option className="bg-[#111]">今天</option>
                      <option className="bg-[#111]">最近7天</option>
                      <option className="bg-[#111]">最近30天</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                    <MapIcon size={14} className="text-white/40" />
                    <select 
                      value={statsArea}
                      onChange={(e) => setStatsArea(e.target.value)}
                      className="bg-transparent text-[10px] font-black text-white uppercase tracking-widest focus:outline-none"
                    >
                      <option className="bg-[#111]">全部区域</option>
                      <option className="bg-[#111]">吴淞口</option>
                      <option className="bg-[#111]">圆圆沙</option>
                      <option className="bg-[#111]">南槽</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: '总预警数', value: '1,428', change: '+12.5%', icon: Shield, color: 'sky' },
                  { label: '高风险目标', value: '42', change: '-5.2%', icon: AlertTriangle, color: 'red' },
                  { label: '意图识别数', value: '8,592', change: '+24.1%', icon: Activity, color: 'emerald' },
                  { label: '值班处理率', value: '98.5%', change: '+0.2%', icon: Check, color: 'indigo' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-[#0a101a] border border-white/5 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                        <stat.icon size={20} />
                      </div>
                      <span className={`text-[10px] font-black ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <h4 className="text-2xl font-black text-white tracking-tight">{stat.value}</h4>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-[#0a101a] border border-white/5 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">趋势分析</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sky-500" />
                        <span className="text-[10px] font-bold text-white/40 uppercase">本期</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <span className="text-[10px] font-bold text-white/40 uppercase">上期</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: '00:00', value: 400, prev: 300 },
                        { name: '04:00', value: 300, prev: 400 },
                        { name: '08:00', value: 900, prev: 600 },
                        { name: '12:00', value: 1200, prev: 800 },
                        { name: '16:00', value: 1500, prev: 1100 },
                        { name: '20:00', value: 1100, prev: 900 },
                        { name: '23:59', value: 600, prev: 500 },
                      ]}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#ffffff20', fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0a101a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        <Area type="monotone" dataKey="prev" stroke="#ffffff10" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#0a101a] border border-white/5 rounded-3xl p-8">
                  <h4 className="text-sm font-black text-white uppercase tracking-widest mb-8">风险类型分布</h4>
                  <div className="space-y-6">
                    {[
                      { label: '超速航行', count: 428, color: 'sky' },
                      { label: '偏离航道', count: 312, color: 'emerald' },
                      { label: '非法锚泊', count: 185, color: 'amber' },
                      { label: '碰撞风险', count: 94, color: 'red' },
                      { label: '其他', count: 45, color: 'indigo' },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-white/60">{item.label}</span>
                          <span className="text-white">{item.count}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.count / 428) * 100}%` }}
                            className={`h-full bg-${item.color}-500 rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* VHF 详情 Modal */}
        <AnimatePresence>
          {showVhfDetails && selectedVhfSnippet && (
            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowVhfDetails(false)}
                className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex"
              >
                <div className="w-1/2 flex flex-col border-r border-white/10">
                  <div className="p-8 border-b border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                          <Radio size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">{selectedVhfSnippet.title}</h3>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">VHF Communication Details</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest block mb-1">目标船舶</span>
                        <span className="text-sm font-bold text-white">{selectedVhfSnippet.vessel}</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest block mb-1">通话时间</span>
                        <span className="text-sm font-mono font-bold text-sky-400">{selectedVhfSnippet.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                    <div className="space-y-4">
                      {selectedVhfSnippet.snippets.map((chat: any, idx: number) => (
                        <div key={idx} className={`flex flex-col gap-2 ${chat.sender.includes('中心') || chat.sender.includes('交管') ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{chat.sender}</span>
                            <span className="text-[10px] font-mono text-white/20">{chat.time}</span>
                          </div>
                          <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                            chat.sender.includes('中心') || chat.sender.includes('交管')
                              ? 'bg-sky-500 text-white rounded-tr-none shadow-lg shadow-sky-500/20'
                              : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none'
                          }`}>
                            {chat.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 bg-white/5 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                        <Pause size={20} />
                      </button>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">录音长度</span>
                        <span className="text-sm font-mono font-bold text-white">00:45</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowVhfDetails(false)}
                      className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all"
                    >
                      关闭详情
                    </button>
                  </div>
                </div>

                <div className="w-1/2 relative bg-[#050505]">
                  <div className="absolute inset-0 z-0">
                    <div className="absolute top-6 left-6 z-10 flex items-center gap-3 px-4 py-2 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
                      <History size={16} className="text-sky-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">历史轨迹同步回放</span>
                    </div>

                    <div className="h-full w-full">
                      <MapContainer
                        center={[selectedVhfSnippet.lat, selectedVhfSnippet.lng]}
                        zoom={14}
                        className="h-full w-full"
                        zoomControl={false}
                      >
                        <TileLayer
                          url={VTS_CHART_TILE_URL}
                          attribution={VTS_CHART_TILE_ATTRIBUTION}
                        />
                        <Polyline 
                          positions={[
                            [selectedVhfSnippet.lat - 0.005, selectedVhfSnippet.lng - 0.01],
                            [selectedVhfSnippet.lat - 0.002, selectedVhfSnippet.lng - 0.004],
                            [selectedVhfSnippet.lat, selectedVhfSnippet.lng],
                            [selectedVhfSnippet.lat + 0.002, selectedVhfSnippet.lng + 0.005],
                            [selectedVhfSnippet.lat + 0.004, selectedVhfSnippet.lng + 0.01],
                            [selectedVhfSnippet.lat + 0.007, selectedVhfSnippet.lng + 0.015]
                          ]}
                          color="#0ea5e9"
                          weight={3}
                          opacity={0.6}
                          dashArray="10, 10"
                        />
                        <Marker 
                          position={[selectedVhfSnippet.lat, selectedVhfSnippet.lng]}
                          icon={L.divIcon({
                            className: 'custom-div-icon',
                            html: `
                              <div class="relative">
                                <div class="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-sky-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.8)] border-2 border-white animate-pulse"></div>
                                <div class="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-sky-500/20 rounded-full animate-ping"></div>
                              </div>
                            `,
                            iconSize: [0, 0]
                          })}
                        />
                      </MapContainer>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 z-[4001] bg-[#050505]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl">
                      <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform">
                          <Play size={18} fill="currentColor" />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-white/60">轨迹回放进度</span>
                            <span className="text-[10px] font-mono text-white/40">10:05:22 / 10:06:35</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(selectedVhfSnippet.id / 4) * 100}%` }}
                              className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {playbackData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed top-24 right-6 w-96 z-[8000] pointer-events-auto"
            >
              <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-gradient-to-r from-sky-500/10 to-transparent">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sky-500 rounded-xl text-white shadow-lg shadow-sky-500/20">
                        <History size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">历史回放定位</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Playback Mode</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPlaybackData(null)}
                      className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">目标船舶</span>
                      <span className="text-xs font-bold text-white">{playbackData.name}</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-1">定位时间</span>
                      <span className="text-xs font-mono font-bold text-sky-400">{playbackData.startTime}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {playbackData.events && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-sky-400" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">船舶上下文事件 (最近)</span>
                      </div>
                      <div className="relative pl-4 space-y-6 before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                        {playbackData.events.map((item: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className={`absolute -left-[15px] top-1.5 w-2 h-2 rounded-full border-2 border-[#111] ${
                              item.type === 'risk' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                              item.type === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                            }`} />
                            
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-mono text-white/30">{item.time}</span>
                              <div className={`text-xs p-2 rounded-lg border ${
                                item.type === 'risk' ? 'bg-red-500/10 border-red-500/20 text-red-200' :
                                item.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10 text-amber-200/80' :
                                'bg-white/5 border-white/5 text-white/70'
                              }`}>
                                {item.desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white/5 border-t border-white/10 flex gap-3">
                  <button 
                    onClick={() => setDynamicPlaybackSession(playbackData)}
                    className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    <Play size={14} /> 开始动态回放
                  </button>
                  <button 
                    onClick={() => setPlaybackData(null)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold rounded-xl border border-white/10 transition-all"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
