/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  type IntentItem,
  type ShipSearchResult,
  type SidebarTab,
  type VHFMessage,
} from '../../types';
import {
  INTENT_DATA,
  MOCK_ALERTS,
  MOCK_RISK_STATS,
  MOCK_VHF_MESSAGES_RAW,
  SHIP_POSITIONS,
} from '../../mockData';
import {
  ADMIN_ROUTE_ITEMS,
  AdminRouteContent,
  DEFAULT_ADMIN_ROUTE_PATH,
  getAdminRouteByPath,
  type AdminRouteItem,
} from '../admin';
import DynamicPlaybackView from '../../components/Panels/DynamicPlaybackView';
import AppHomeWorkspace from './components/AppHomeWorkspace';
import AppModeRightRail from './components/AppModeRightRail';
import MessagePushAvatar from './components/MessagePushAvatar';
import MessagePushPanel from './components/MessagePushPanel';
import type { MessageFeedItem } from './components/messagePushConfig';
import {
  buildHomeShipDetails,
  buildVhfSessions,
  buildVhfShipInfoLookup,
} from './utils/homeViewData';
import { getRiskPlaybackSession, type AppPlaybackSession } from './utils/playback';
import { type HomeViewMode } from './utils/viewModes';
import RiskAnalysisView from '../risk-analysis/RiskAnalysisView';
import LawEnforcementView from '../law-enforcement/LawEnforcementView';
import EmergencyRescueView from '../emergency-rescue/EmergencyRescueView';
import PortNavCoordinationView from '../port-nav-coordination/PortNavCoordinationView';
import AssistantDialog from './components/AssistantDialog';

type AppRoute =
  | { type: 'home' }
  | { type: 'risk-analysis' }
  | { type: 'law-enforcement' }
  | { type: 'emergency-rescue' }
  | { type: 'port-nav-coordination' }
  | { type: 'admin'; item: AdminRouteItem }
  | { type: 'not-found' };

const getAppRouteFromPath = (pathname: string): AppRoute => {
  if (pathname === '/' || pathname === '/home') return { type: 'home' };
  if (pathname === '/risk-analysis') return { type: 'risk-analysis' };
  if (pathname === '/law-enforcement') return { type: 'law-enforcement' };
  if (pathname === '/emergency-rescue') return { type: 'emergency-rescue' };
  if (pathname === '/port-nav-coordination') return { type: 'port-nav-coordination' };
  if (pathname === '/admin') return { type: 'admin', item: getAdminRouteByPath(DEFAULT_ADMIN_ROUTE_PATH) ?? ADMIN_ROUTE_ITEMS[4] };
  if (pathname.startsWith('/admin/')) {
    const adminRoute = getAdminRouteByPath(pathname);
    return adminRoute ? { type: 'admin', item: adminRoute } : { type: 'not-found' };
  }

  return { type: 'not-found' };
};

const getCurrentPathname = () => (typeof window === 'undefined' ? '/' : window.location.pathname);

const usePathname = () => {
  const [pathname, setPathname] = useState(getCurrentPathname);

  useEffect(() => {
    const handlePopState = () => setPathname(getCurrentPathname());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    setPathname(path);
  };

  return { pathname, navigate };
};

function RoutePageShell({
  title,
  children,
  onNavigateHome,
}: {
  title: string;
  children: ReactNode;
  onNavigateHome: () => void;
}) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="text-sm font-black text-slate-800">{title}</div>
        <button
          onClick={onNavigateHome}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-600 transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
        >
          返回主工作台
        </button>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function AdminRoutePageShell({
  activeItem,
  playbackData,
  setPlaybackData,
  setDynamicPlaybackSession,
  getRiskPlaybackSession,
  onNavigate,
}: {
  activeItem: AdminRouteItem;
  playbackData: AppPlaybackSession | null;
  setPlaybackData: (data: AppPlaybackSession | null) => void;
  setDynamicPlaybackSession: (data: AppPlaybackSession | null) => void;
  getRiskPlaybackSession: (item: any) => AppPlaybackSession;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#050a10] text-white">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-[#0a101a] px-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 rounded-full p-2 text-white/60 transition-all hover:bg-white/5 hover:text-white"
          >
            <span className="text-xs font-bold">返回主工作台</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-2.5 text-sm font-black tracking-tight text-white/90">
              <div className="h-3.5 w-1 rounded-full bg-sky-500" />
              {activeItem.name}
            </h2>
            <div className="pt-0.5 text-[10px] font-mono text-white/20">
              后台管理 / {activeItem.name}
              {playbackData ? ' / 已选回放对象' : ''}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-auto min-w-[180px] shrink-0 flex-col border-r border-white/5 bg-[#0a101a]/50">
          <div className="mb-2 flex items-center gap-2 border-b border-white/5 p-4 text-white/80">
            <div className="text-sm font-black tracking-widest">后台管理系统</div>
          </div>
          <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-2">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/20">管理路由</div>
            {ADMIN_ROUTE_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  activeItem.path === item.path
                    ? 'border border-sky-500/20 bg-sky-500/10 text-sky-400'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                }`}
              >
                <item.icon size={16} className={activeItem.path === item.path ? 'text-sky-400' : 'text-white/20 group-hover:text-white/40'} />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#050a10] p-3">
          <AdminRouteContent
            activeMenu={activeItem.name}
            playbackData={playbackData}
            setPlaybackData={setPlaybackData}
            setDynamicPlaybackSession={setDynamicPlaybackSession}
            getRiskPlaybackSession={getRiskPlaybackSession}
          />
        </main>
      </div>
    </div>
  );
}

export default function AppView() {
  const { pathname, navigate } = usePathname();
  const route = getAppRouteFromPath(pathname);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [showBars, setShowBars] = useState(true);
  const [shipSearchQuery, setShipSearchQuery] = useState('');
  const [selectedHomeShipId, setSelectedHomeShipId] = useState<string | null>(
    SHIP_POSITIONS[0]?.id ?? null,
  );
  const [selectedHomeShipTrackPointId, setSelectedHomeShipTrackPointId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<SidebarTab>('vhf');
  const [vhfViewMode, setVhfViewMode] = useState<'list' | 'flow'>('list');
  const [saabLinkageEnabled, setSaabLinkageEnabled] = useState(false);
  const [selectedStation, setSelectedStation] = useState('10号台');
  const [selectedIntent, setSelectedIntent] = useState<number | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [selectedAnchorage, setSelectedAnchorage] = useState<string | null>(null);
  const [hoveredShipType, setHoveredShipType] = useState<string | null>(null);
  const [hoveredDurationType, setHoveredDurationType] = useState<string | null>(null);
  const [selectedExpiringShip, setSelectedExpiringShip] = useState<string | null>(null);
  const [selectedOvertimeShip, setSelectedOvertimeShip] = useState<string | null>(null);
  const [anchorageTypeViewMode, setAnchorageTypeViewMode] = useState<'chart' | 'tags'>('chart');
  const [intents] = useState<IntentItem[]>(INTENT_DATA);
  const [intentFilter, setIntentFilter] = useState('全部');
  const [editingIntentIndex] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isControlPanelExpanded, setIsControlPanelExpanded] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [viewMode, setViewMode] = useState<HomeViewMode>('normal');
  const [playbackData, setPlaybackData] = useState<AppPlaybackSession | null>(null);
  const [dynamicPlaybackSession, setDynamicPlaybackSession] =
    useState<AppPlaybackSession | null>(null);
  const [smartDutyMessages, setSmartDutyMessages] = useState<MessageFeedItem[]>([]);
  const [vhfMessages] = useState<VHFMessage[]>(MOCK_VHF_MESSAGES_RAW);
  const [selectedVhfSessionId, setSelectedVhfSessionId] = useState<string | null>(null);

  const vhfShipInfoLookup = useMemo(() => buildVhfShipInfoLookup(), []);

  const vhfSessions = useMemo(
    () => buildVhfSessions(vhfMessages, vhfShipInfoLookup),
    [vhfMessages, vhfShipInfoLookup],
  );

  const activeVhfSession = useMemo(
    () => vhfSessions.find((session) => session.sessionId === selectedVhfSessionId) ?? vhfSessions[0] ?? null,
    [selectedVhfSessionId, vhfSessions],
  );

  const waitingVhfSessions = useMemo(
    () => vhfSessions.filter((session) => session.sessionId !== activeVhfSession?.sessionId),
    [activeVhfSession?.sessionId, vhfSessions],
  );

  const homeShipDetails = useMemo(
    () => buildHomeShipDetails(vhfSessions, vhfShipInfoLookup),
    [vhfSessions, vhfShipInfoLookup],
  );

  const selectedHomeShip = useMemo(
    () => homeShipDetails.find((ship) => ship.id === selectedHomeShipId) ?? homeShipDetails[0] ?? null,
    [homeShipDetails, selectedHomeShipId],
  );

  const selectedHomeShipTrackPoint = useMemo(() => {
    if (!selectedHomeShip) return null;
    return (
      selectedHomeShip.track.find((point) => point.id === selectedHomeShipTrackPointId) ??
      selectedHomeShip.track[selectedHomeShip.track.length - 1] ??
      null
    );
  }, [selectedHomeShip, selectedHomeShipTrackPointId]);

  const homeMapFocusTarget = useMemo<[number, number] | null>(() => {
    if (selectedHomeShipTrackPoint) return selectedHomeShipTrackPoint.coords;
    if (!selectedHomeShip) return null;
    return [selectedHomeShip.lat, selectedHomeShip.lng];
  }, [selectedHomeShip, selectedHomeShipTrackPoint]);

  const shipSearchResults = useMemo<ShipSearchResult[]>(() => {
    const keyword = shipSearchQuery.trim().toLowerCase();
    if (!keyword) return homeShipDetails;
    return homeShipDetails.filter(
      (ship) =>
        ship.name.toLowerCase().includes(keyword) ||
        ship.mmsi.includes(keyword) ||
        ship.type.toLowerCase().includes(keyword) ||
        ship.destination.toLowerCase().includes(keyword),
    );
  }, [homeShipDetails, shipSearchQuery]);

  const handleSelectHomeShip = (shipId: string) => {
    setSelectedHomeShipId(shipId);
    setShipSearchQuery('');
    setActiveTab('ship');
    if (viewMode !== 'smart-duty' && viewMode !== 'auto' && !sidebarOpen) {
      setSidebarOpen(true);
    }
  };

  const openRiskPlaybackByIndex = (index: number) => {
    const item = MOCK_RISK_STATS[index] ?? MOCK_RISK_STATS[0];
    if (!item) return;
    setDynamicPlaybackSession(getRiskPlaybackSession(item));
  };

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    (window as typeof window & { setDynamicPlaybackSession?: typeof setDynamicPlaybackSession }).setDynamicPlaybackSession =
      setDynamicPlaybackSession;
    return () => {
      delete (window as typeof window & { setDynamicPlaybackSession?: typeof setDynamicPlaybackSession })
        .setDynamicPlaybackSession;
    };
  }, []);

  useEffect(() => {
    if (vhfSessions.length === 0) {
      if (selectedVhfSessionId !== null) {
        setSelectedVhfSessionId(null);
      }
      return;
    }

    if (!selectedVhfSessionId || !vhfSessions.some((session) => session.sessionId === selectedVhfSessionId)) {
      setSelectedVhfSessionId(vhfSessions[0].sessionId);
    }
  }, [selectedVhfSessionId, vhfSessions]);

  useEffect(() => {
    if (!selectedHomeShip) return;
    setSelectedHomeShipTrackPointId(
      selectedHomeShip.track[selectedHomeShip.track.length - 1]?.id ?? null,
    );
  }, [selectedHomeShipId, selectedHomeShip]);

  useEffect(() => {
    if (!selectedHomeShipId && homeShipDetails.length > 0) {
      setSelectedHomeShipId(homeShipDetails[0].id);
    }
  }, [homeShipDetails, selectedHomeShipId]);

  useEffect(() => {
    if (viewMode === 'smart-duty' || viewMode === 'auto') {
      setSidebarPosition('left');
      setSidebarOpen(false);
      return;
    }

    setSmartDutyMessages([]);
    setSidebarOpen(true);
    setSidebarPosition('left');

    if (viewMode === 'risk-analysis' || viewMode === 'emergency-rescue') {
      setActiveTab('warning');
    }

    if (viewMode === 'case-playback') {
      setActiveTab('ship');
    }
  }, [viewMode]);

  const rightRail =
    viewMode === 'normal' || viewMode === 'auto' || viewMode === 'smart-duty' ? null : (
      <AppModeRightRail
        mode={viewMode}
        currentTime={currentTime}
        selectedHomeShip={selectedHomeShip}
        onOpenPlayback={openRiskPlaybackByIndex}
        onSmartDutyMessagesChange={setSmartDutyMessages}
      />
    );

  const smartDutyAvatarOverlay =
    viewMode === 'smart-duty' || viewMode === 'auto' ? (
      <>
        {viewMode === 'smart-duty' ? (
          <>
            <div className="pointer-events-none absolute right-4 top-4 z-[410]">
              <MessagePushPanel
                variant="floating"
                maxMessages={8}
                className="right-0 top-0 w-[380px]"
                onMessagesChange={setSmartDutyMessages}
              />
            </div>
            <div className="pointer-events-none absolute bottom-4 right-4 z-[410]">
              <MessagePushAvatar
                messages={smartDutyMessages}
                showBubble={false}
                className="w-[170px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              />
            </div>
          </>
        ) : (
          <div className="pointer-events-none absolute bottom-4 right-4 z-[410]">
            <MessagePushAvatar
              messages={smartDutyMessages}
              onMessagesChange={setSmartDutyMessages}
              showBubble
              messageMode="auto"
              className="w-[420px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            />
          </div>
        )}
      </>
    ) : null;

  const sidebarProps = {
    activeTab,
    sidebarOpen,
    sidebarPosition,
    showBars,
    shipSearchQuery,
    shipSearchResults,
    selectedHomeShip,
    selectedIntent,
    editingIntentIndex,
    selectedAlert,
    selectedAnchorage,
    selectedExpiringShip,
    selectedOvertimeShip,
    hoveredShipType,
    hoveredDurationType,
    anchorageTypeViewMode,
    vhfViewMode,
    saabLinkageEnabled,
    selectedStation,
    currentTime,
    intents,
    intentFilter,
    vhfMessages,
    activeVhfSession,
    waitingVhfSessions,
    onTabChange: setActiveTab,
    onToggleSidebar: () => setSidebarOpen((value) => !value),
    onToggleBars: () => setShowBars((value) => !value),
    onShipSearchQueryChange: setShipSearchQuery,
    onShipSearchSelect: handleSelectHomeShip,
    onSelectTrackPoint: setSelectedHomeShipTrackPointId,
    onToggleSaabLinkage: () => setSaabLinkageEnabled((value) => !value),
    onSelectedStationChange: setSelectedStation,
    onViewModeChange: setVhfViewMode,
    onSelectSession: setSelectedVhfSessionId,
    onIntentFilterChange: setIntentFilter,
    onToggleIntent: (index: number) => setSelectedIntent(selectedIntent === index ? null : index),
    onCloseIntent: () => setSelectedIntent(null),
    onToggleAlert: (alertId: string) =>
      setSelectedAlert(selectedAlert === alertId ? null : alertId),
    onCloseAlert: () => setSelectedAlert(null),
    onSelectAnchorage: (anchorageId: string | null, nextExpiringShipId: string | null) => {
      setSelectedAnchorage(anchorageId);
      setSelectedExpiringShip(nextExpiringShipId);
      setSelectedOvertimeShip(null);
    },
    onSelectExpiringShip: setSelectedExpiringShip,
    onSelectOvertimeShip: setSelectedOvertimeShip,
    onHoveredShipTypeChange: setHoveredShipType,
    onHoveredDurationTypeChange: setHoveredDurationType,
    onAnchorageTypeViewModeChange: setAnchorageTypeViewMode,
    currentMode: viewMode,
    onModeChange: setViewMode,
  };

  const mapProps = {
    playbackData,
    homeMapFocusTarget,
    selectedHomeShip,
    selectedHomeShipTrackPoint,
    smartDutyMessages, // Added
    onMouseMove: setMouseCoords,
    onSelectHomeShip: handleSelectHomeShip,
    onSelectTrackPoint: setSelectedHomeShipTrackPointId,
  };

  const bottomBarProps = {
    showBars,
    mouseCoords,
    isControlPanelExpanded,
    isAssistantOpen,
    onToggleAssistant: () => setIsAssistantOpen((value) => !value),
    isToolsExpanded,
    showUserMenu,
    currentMode: viewMode,
    sidebarPosition,
    onModeChange: setViewMode,
    onToggleControlPanel: () => setIsControlPanelExpanded((value) => !value),
    onToggleTools: () => setIsToolsExpanded((value) => !value),
    onToggleSidebarPosition: () =>
      setSidebarPosition((value) => (value === 'left' ? 'right' : 'left')),
    onOpenAdmin: () => navigate(DEFAULT_ADMIN_ROUTE_PATH),
    onToggleUserMenu: () => setShowUserMenu((value) => !value),
    onCloseUserMenu: () => setShowUserMenu(false),
  };

  if (route.type === 'risk-analysis') {
    return (
      <RoutePageShell title="风险态势" onNavigateHome={() => navigate('/')}>
        <RiskAnalysisView onOpenPlayback={openRiskPlaybackByIndex} />
      </RoutePageShell>
    );
  }

  if (route.type === 'law-enforcement') {
    return (
      <RoutePageShell title="执法辅助" onNavigateHome={() => navigate('/')}>
        <LawEnforcementView onOpenPlayback={openRiskPlaybackByIndex} />
      </RoutePageShell>
    );
  }

  if (route.type === 'emergency-rescue') {
    return (
      <RoutePageShell title="应急处置" onNavigateHome={() => navigate('/')}>
        <EmergencyRescueView />
      </RoutePageShell>
    );
  }

  if (route.type === 'port-nav-coordination') {
    return (
      <RoutePageShell title="港航协同" onNavigateHome={() => navigate('/')}>
        <PortNavCoordinationView />
      </RoutePageShell>
    );
  }

  if (route.type === 'admin') {
    return (
      <>
        <AnimatePresence>
          {dynamicPlaybackSession && (
            <DynamicPlaybackView
              session={dynamicPlaybackSession}
              onClose={() => setDynamicPlaybackSession(null)}
            />
          )}
        </AnimatePresence>
        <AdminRoutePageShell
          activeItem={route.item}
          playbackData={playbackData}
          setPlaybackData={setPlaybackData}
          setDynamicPlaybackSession={setDynamicPlaybackSession}
          getRiskPlaybackSession={getRiskPlaybackSession}
          onNavigate={navigate}
        />
      </>
    );
  }

  if (route.type === 'not-found') {
    return (
      <RoutePageShell title="页面不存在" onNavigateHome={() => navigate('/')}>
        <div className="flex h-full items-center justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="text-lg font-black text-slate-800">未找到对应路由</div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-xs font-black text-white transition-all hover:bg-sky-600"
            >
              返回首页
            </button>
          </div>
        </div>
      </RoutePageShell>
    );
  }

  return (
    <div className={`vts-home-shell flex h-screen w-screen flex-col overflow-hidden font-sans transition-colors duration-500 ${
      viewMode === 'risk-analysis' || viewMode === 'case-playback' || viewMode === 'emergency-rescue' || viewMode === 'port-nav-coordination'
        ? 'bg-slate-50 text-slate-900 vts-theme--light group/shell' 
        : 'bg-[#0a0a0a] text-white'
    }`}>
      <AnimatePresence>
        {dynamicPlaybackSession && (
          <DynamicPlaybackView
            session={dynamicPlaybackSession}
            onClose={() => setDynamicPlaybackSession(null)}
          />
        )}
      </AnimatePresence>

      <AssistantDialog isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />

      {viewMode === 'risk-analysis' ? (
        <RiskAnalysisView onOpenPlayback={openRiskPlaybackByIndex} />
      ) : viewMode === 'case-playback' ? (
        <LawEnforcementView onOpenPlayback={openRiskPlaybackByIndex} />
      ) : viewMode === 'emergency-rescue' ? (
        <EmergencyRescueView />
      ) : viewMode === 'port-nav-coordination' ? (
        <PortNavCoordinationView />
      ) : (
        <AppHomeWorkspace
          mode={viewMode}
          sidebarProps={sidebarProps}
          mapProps={mapProps}
          bottomBarProps={bottomBarProps}
          rightRail={rightRail}
          mapOverlay={smartDutyAvatarOverlay}
          onModeChange={setViewMode}
        />
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
          `,
        }}
      />
    </div>
  );
}
