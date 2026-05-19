import { useState } from 'react';
import { Activity, ArrowLeft, BarChart3, BookOpen, Lock, Map as MapIcon, Monitor, Presentation, Settings, Shield, Ship, User, Users, Volume2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AREA_CATEGORIES, MOCK_AREAS } from '../../mockData';
import type { MockAreaMap } from '../../types';
import AreaSettingsRoute from './routes/AreaSettingsRoute';
import BusinessStatsRoute from './routes/BusinessStatsRoute';
import PlaceholderRoute from './routes/PlaceholderRoute';
import ScenarioDemoRoute from './routes/ScenarioDemoRoute';
import VesselDynamicsRoute from './routes/VesselDynamicsRoute';
import VesselSymbolConfigRoute from './routes/VesselSymbolConfigRoute';
import WarningManagementRoute from './routes/WarningManagementRoute';

export const ADMIN_ROUTE_ITEMS = [
  { name: '个人信息', path: '/admin/profile', icon: User },
  { name: '角色管理', path: '/admin/roles', icon: Users },
  { name: '权限管理', path: '/admin/permissions', icon: Lock },
  { name: '账号管理', path: '/admin/accounts', icon: User },
  { name: '区域设置', path: '/admin/areas', icon: MapIcon },
  { name: '船舶动态', path: '/admin/vessel-dynamics', icon: Activity },
  { name: '船舶符号', path: '/admin/vessel-symbols', icon: Ship },
  { name: '字典管理', path: '/admin/dictionaries', icon: BookOpen },
  { name: '语音设置', path: '/admin/voice', icon: Volume2 },
  { name: '显示设置', path: '/admin/display', icon: Monitor },
  { name: '业务统计', path: '/admin/business-stats', icon: BarChart3 },
  { name: '预警管理', path: '/admin/warnings', icon: Shield },
  { name: '场景演示', path: '/admin/scenario-demo', icon: Presentation },
] as const;

export const DEFAULT_ADMIN_ROUTE_PATH = '/admin/areas';

export type AdminRouteItem = (typeof ADMIN_ROUTE_ITEMS)[number];

export const getAdminRouteByPath = (pathname: string) =>
  ADMIN_ROUTE_ITEMS.find((item) => item.path === pathname) ?? null;

const getAdminRouteByName = (name: string) =>
  ADMIN_ROUTE_ITEMS.find((item) => item.name === name) ?? ADMIN_ROUTE_ITEMS[4];

type AdminPanelProps = {
  onClose: () => void;
  playbackData: any;
  setPlaybackData: (data: any) => void;
  setDynamicPlaybackSession: (data: any) => void;
  initialMenu?: string;
  initialStatsTab?: string;
  getRiskPlaybackSession: (item: any) => any;
};

type AdminRouteContentProps = {
  activeMenu: string;
  playbackData?: any;
  setPlaybackData: (data: any) => void;
  setDynamicPlaybackSession: (data: any) => void;
  initialStatsTab?: string;
  getRiskPlaybackSession: (item: any) => any;
};

export function AdminRouteContent({
  activeMenu,
  setPlaybackData,
  setDynamicPlaybackSession,
  initialStatsTab = '值班统计',
  getRiskPlaybackSession,
}: AdminRouteContentProps) {
  const [activeStatsTab, setActiveStatsTab] = useState(initialStatsTab);
  const [activeSubTab, setActiveSubTab] = useState(AREA_CATEGORIES[0]);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [areaConfig] = useState<MockAreaMap>(() =>
    Object.fromEntries(
      Object.entries(MOCK_AREAS).map(([category, areas]) => [
        category,
        areas.map((area) => ({ ...area, fields: { ...area.fields } })),
      ]),
    ) as MockAreaMap,
  );

  switch (activeMenu) {
    case '区域设置':
      return (
        <AreaSettingsRoute
          areaConfig={areaConfig}
          activeSubTab={activeSubTab}
          areaSearchQuery={areaSearchQuery}
          onActiveSubTabChange={setActiveSubTab}
          onAreaSearchQueryChange={setAreaSearchQuery}
        />
      );
    case '船舶动态':
      return <VesselDynamicsRoute onLocate={setPlaybackData} />;
    case '船舶符号':
      return <VesselSymbolConfigRoute />;
    case '业务统计':
      return <BusinessStatsRoute activeStatsTab={activeStatsTab} onActiveStatsTabChange={setActiveStatsTab} />;
    case '预警管理':
      return (
        <WarningManagementRoute
          setDynamicPlaybackSession={setDynamicPlaybackSession}
          getRiskPlaybackSession={getRiskPlaybackSession}
        />
      );
    case '场景演示':
      return <ScenarioDemoRoute setDynamicPlaybackSession={setDynamicPlaybackSession} getRiskPlaybackSession={getRiskPlaybackSession} />;
    case '个人信息':
    case '角色管理':
    case '权限管理':
    case '账号管理':
    case '字典管理':
    case '语音设置':
    case '显示设置':
    default:
      return <PlaceholderRoute title={activeMenu} description={`${activeMenu} 已迁移为独立后台路由结构，后续可在对应 route 文件中继续扩展业务内容。`} />;
  }
}

export default function AdminPanel({
  onClose,
  playbackData,
  setPlaybackData,
  setDynamicPlaybackSession,
  initialMenu = '区域设置',
  initialStatsTab = '值班统计',
  getRiskPlaybackSession,
}: AdminPanelProps) {
  const [activeMenu, setActiveMenu] = useState(getAdminRouteByName(initialMenu).name);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[6000] flex flex-col overflow-hidden bg-[#050a10]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-[#0a101a] px-4">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="flex items-center gap-2 rounded-full p-2 text-white/60 transition-all hover:bg-white/5 hover:text-white">
            <ArrowLeft size={18} />
            <span className="text-xs font-bold">返回地图</span>
          </button>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-2.5 text-sm font-black tracking-tight text-white/90">
              <div className="h-3.5 w-1 rounded-full bg-sky-500" />
              {activeMenu}
            </h2>
            <div className="text-[10px] font-mono text-white/20 pt-0.5">
              后台管理 / {activeMenu}
              {playbackData ? ' / 已选回放对象' : ''}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-auto min-w-[180px] shrink-0 flex-col border-r border-white/5 bg-[#0a101a]/50">
          <div className="mb-2 flex items-center gap-2 border-b border-white/5 p-4 text-white/80">
            <Settings size={16} className="text-sky-400" />
            <span className="text-sm font-black tracking-widest">后台管理系统</span>
          </div>
          <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-2">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/20">管理路由</div>
            {ADMIN_ROUTE_ITEMS.map((menu) => (
              <button
                key={menu.name}
                onClick={() => {
                  window.history.replaceState(null, '', menu.path);
                  setActiveMenu(menu.name);
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${activeMenu === menu.name ? 'border border-sky-500/20 bg-sky-500/10 text-sky-400' : 'text-white/40 hover:bg-white/5 hover:text-white/60'}`}
              >
                <menu.icon size={16} className={activeMenu === menu.name ? 'text-sky-400' : 'text-white/20 group-hover:text-white/40'} />
                <span className="text-xs font-medium">{menu.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#050a10] p-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <AdminRouteContent
                activeMenu={activeMenu}
                playbackData={playbackData}
                setPlaybackData={setPlaybackData}
                setDynamicPlaybackSession={setDynamicPlaybackSession}
                initialStatsTab={initialStatsTab}
                getRiskPlaybackSession={getRiskPlaybackSession}
              />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
}
