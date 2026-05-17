/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
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
import { AdminPanel } from '../admin';
import DynamicPlaybackView from '../../components/Panels/DynamicPlaybackView';
import AppHomeWorkspace from './components/AppHomeWorkspace';
import AppModeRightRail from './components/AppModeRightRail';
import AppTopBar from './components/AppTopBar';
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
import { normalizeVhfShipName } from './utils/vhf';
import RiskAnalysisView from '../risk-analysis/RiskAnalysisView';

export default function AppView() {
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
  const [isAdminView, setIsAdminView] = useState(false);
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
    if (viewMode !== 'smart-duty' && !sidebarOpen) {
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
    if (viewMode === 'smart-duty') {
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
    viewMode === 'normal' ? null : (
      <AppModeRightRail
        mode={viewMode}
        currentTime={currentTime}
        selectedHomeShip={selectedHomeShip}
        onOpenPlayback={openRiskPlaybackByIndex}
        onSmartDutyMessagesChange={setSmartDutyMessages}
      />
    );

  const smartDutyAvatarOverlay =
    viewMode === 'smart-duty' ? (
      <div className="pointer-events-none absolute bottom-4 right-4 z-[410]">
        <MessagePushAvatar
          messages={smartDutyMessages}
          className="w-[170px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        />
      </div>
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
  };

  const mapProps = {
    playbackData,
    homeMapFocusTarget,
    selectedHomeShip,
    selectedHomeShipTrackPoint,
    onMouseMove: setMouseCoords,
    onSelectHomeShip: handleSelectHomeShip,
    onSelectTrackPoint: setSelectedHomeShipTrackPointId,
  };

  const bottomBarProps = {
    showBars,
    mouseCoords,
    isControlPanelExpanded,
    isToolsExpanded,
    sidebarPosition,
    onToggleControlPanel: () => setIsControlPanelExpanded((value) => !value),
    onToggleTools: () => setIsToolsExpanded((value) => !value),
    onToggleSidebarPosition: () =>
      setSidebarPosition((value) => (value === 'left' ? 'right' : 'left')),
  };

  return (
    <div className={`vts-home-shell flex h-screen w-screen flex-col overflow-hidden font-sans transition-colors duration-500 ${
      viewMode === 'risk-analysis' || viewMode === 'case-playback' || viewMode === 'emergency-rescue'
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

      <AnimatePresence>
        {isAdminView && (
          <AdminPanel
            onClose={() => setIsAdminView(false)}
            playbackData={playbackData}
            setPlaybackData={setPlaybackData}
            setDynamicPlaybackSession={setDynamicPlaybackSession}
            getRiskPlaybackSession={getRiskPlaybackSession}
          />
        )}
      </AnimatePresence>

      <AppTopBar
        showBars={showBars}
        showUserMenu={showUserMenu}
        currentMode={viewMode}
        onModeChange={setViewMode}
        onOpenAdmin={() => setIsAdminView(true)}
        onToggleUserMenu={() => setShowUserMenu((value) => !value)}
        onCloseUserMenu={() => setShowUserMenu(false)}
      />

      {viewMode === 'risk-analysis' ? (
        <RiskAnalysisView />
      ) : viewMode === 'case-playback' || viewMode === 'emergency-rescue' ? (
        <main className="flex-1 bg-slate-50" />
      ) : (
        <AppHomeWorkspace
          mode={viewMode}
          sidebarProps={sidebarProps}
          mapProps={mapProps}
          bottomBarProps={bottomBarProps}
          rightRail={rightRail}
          mapOverlay={smartDutyAvatarOverlay}
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
