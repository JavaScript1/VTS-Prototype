/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  type HomeShipDetail,
  type IntentItem,
  type ShipSearchResult,
  type SidebarTab,
  type VHFMessage,
  type VhfSessionSummary,
  type VhfShipInfo,
} from '../../types';
import {
  INTENT_DATA,
  MOCK_ALERTS,
  MOCK_RISK_STATS,
  MOCK_VHF_MESSAGES_RAW,
  SHIP_POSITIONS,
} from '../../mockData';
import { groupVhfMessages } from '../../utils/vhfConversation';
import { AdminPanel } from '../admin';
import DynamicPlaybackView from '../../components/Panels/DynamicPlaybackView';
import AppBottomBar from './components/AppBottomBar';
import AppHomeMap from './components/AppHomeMap';
import AppSidebar from './components/AppSidebar';
import AppTopBar from './components/AppTopBar';
import {
  createHomeShipDynamicEvents,
  createHomeShipTrack,
  getHomeShipEnglishName,
  getHomeShipMovement,
  getHomeShipOperator,
} from './utils/homeShips';
import { getRiskPlaybackSession, type AppPlaybackSession } from './utils/playback';
import {
  mergeVhfShipInfo,
  normalizeLegacyVhfMessage,
  normalizeVhfShipName,
  parseLegacyVhfTimestamp,
} from './utils/vhf';

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
  const [playbackData, setPlaybackData] = useState<AppPlaybackSession | null>(null);
  const [dynamicPlaybackSession, setDynamicPlaybackSession] =
    useState<AppPlaybackSession | null>(null);
  const [vhfMessages] = useState<VHFMessage[]>(MOCK_VHF_MESSAGES_RAW);
  const [selectedVhfSessionId, setSelectedVhfSessionId] = useState<string | null>(null);

  const vhfShipInfoLookup = useMemo(() => {
    const lookup = new Map<string, VhfShipInfo>();
    const upsert = (name: string, next: Partial<VhfShipInfo>) => {
      if (!name) return;
      const key = normalizeVhfShipName(name);
      lookup.set(key, mergeVhfShipInfo(lookup.get(key), { name, ...next }));
    };

    SHIP_POSITIONS.forEach((ship) => {
      upsert(ship.name, {
        shipType: ship.type,
        mmsi: ship.mmsi,
        callSign: ship.callsign,
        englishName: ship.englishName,
        destination: ship.destination,
        speed: `${ship.speed.toFixed(1)}kn`,
      });
    });

    INTENT_DATA.forEach((item) => {
      upsert(item.ship, {
        shipType: item.shipType,
        englishName: item.englishName,
        mmsi: item.mmsi,
        callSign: item.callSign,
        imo: item.imo,
        flag: item.flag,
        lastPort: item.past,
        cargoType: item.cargoType,
        length: item.length,
        width: item.width,
        draft: item.draft,
        speed: item.speed,
        destination: item.destination,
        hdg: item.situation?.hdg,
      });
    });

    MOCK_RISK_STATS.forEach((item) => {
      upsert(item.name, {
        shipType: item.type,
        mmsi: item.mmsi,
        cargoType: item.cargo,
        length: item.length ? `${item.length}m` : undefined,
        width: item.width ? `${item.width}m` : undefined,
        draft: item.draft ? `${item.draft}m` : undefined,
        speed: item.speed !== undefined ? `${item.speed.toFixed(1)}kn` : undefined,
        destination: item.destination,
      });
    });

    return lookup;
  }, []);

  const vhfSessions = useMemo<VhfSessionSummary[]>(() => {
    const groupedSessions = new Map<string, VHFMessage[]>();

    vhfMessages.forEach((message) => {
      if (!groupedSessions.has(message.sessionId)) {
        groupedSessions.set(message.sessionId, []);
      }
      groupedSessions.get(message.sessionId)?.push(message);
    });

    return [...groupedSessions.entries()]
      .map(([sessionId, sessionMessages]) => {
        const messages = [...sessionMessages].sort(
          (a, b) => parseLegacyVhfTimestamp(a) - parseLegacyVhfTimestamp(b),
        );
        const cards = groupVhfMessages(messages.map(normalizeLegacyVhfMessage));
        const shipMessage = messages.find((message) => !message.isVTS);
        const latestMessage = messages[messages.length - 1];
        const firstMessage = messages[0];
        const shipName = shipMessage?.sender || latestMessage?.sender || '未知船舶';

        return {
          sessionId,
          shipName,
          operatorName: messages.find((message) => message.isVTS)?.sender || '值班员',
          intent: latestMessage?.sessionIntent || shipMessage?.sessionIntent || '待识别',
          sessionType: latestMessage?.sessionType || shipMessage?.sessionType || 'intent',
          messages,
          cards,
          shipInfo: vhfShipInfoLookup.get(normalizeVhfShipName(shipName)),
          startedAt: firstMessage ? parseLegacyVhfTimestamp(firstMessage) : 0,
          latestAt: latestMessage ? parseLegacyVhfTimestamp(latestMessage) : 0,
          latestTime: latestMessage ? `${latestMessage.date} ${latestMessage.time}` : '',
        };
      })
      .sort((a, b) => b.latestAt - a.latestAt);
  }, [vhfMessages, vhfShipInfoLookup]);

  const activeVhfSession = useMemo(
    () => vhfSessions.find((session) => session.sessionId === selectedVhfSessionId) ?? vhfSessions[0] ?? null,
    [selectedVhfSessionId, vhfSessions],
  );

  const waitingVhfSessions = useMemo(
    () => vhfSessions.filter((session) => session.sessionId !== activeVhfSession?.sessionId),
    [activeVhfSession?.sessionId, vhfSessions],
  );

  const homeShipDetails = useMemo<HomeShipDetail[]>(
    () =>
      SHIP_POSITIONS.map((ship) => {
        const shipKey = normalizeVhfShipName(ship.name);
        const intent = INTENT_DATA.find((item) => normalizeVhfShipName(item.ship) === shipKey);
        const riskStat = MOCK_RISK_STATS.find(
          (item) => item.mmsi === ship.mmsi || normalizeVhfShipName(item.name) === shipKey,
        );
        const alert = MOCK_ALERTS.find(
          (item) => item.mmsi === ship.mmsi || normalizeVhfShipName(item.ship) === shipKey,
        );
        const session = vhfSessions.find((item) => normalizeVhfShipName(item.shipName) === shipKey);
        const info = vhfShipInfoLookup.get(shipKey);
        const route = {
          past: intent?.past || '上游航段',
          current: intent?.current || ship.destination,
          destination: intent?.destination || ship.destination,
        };
        const track = createHomeShipTrack(ship, route);
        const movement = getHomeShipMovement(route.destination);
        const operator = getHomeShipOperator(route.destination);
        const cargoName = info?.cargoType || riskStat?.cargo || alert?.cargo || '普通货物';
        const isContainerShip = (info?.shipType || riskStat?.type || ship.type).includes('集装箱');
        const isHazardous =
          ship.type.includes('油') || cargoName.includes('油') || cargoName.includes('危险');
        const grossTonnage = `${Math.max(800, Math.round(ship.speed * 260 + ship.heading * 7))}`;
        const dynamicEvents = createHomeShipDynamicEvents({
          shipId: ship.id,
          route,
          intent,
          track,
        });

        return {
          id: ship.id,
          name: ship.name,
          displayName: `${getHomeShipEnglishName(ship.name)} / ${ship.name}`,
          mmsi: ship.mmsi,
          type: info?.shipType || riskStat?.type || ship.type,
          status: ship.status,
          destination: ship.destination,
          speed: ship.speed,
          heading: ship.heading,
          lat: ship.lat,
          lng: ship.lng,
          length: info?.length || (riskStat ? `${riskStat.length}m` : '--'),
          width: info?.width || (riskStat ? `${riskStat.width}m` : '--'),
          draft: info?.draft || (riskStat ? `${riskStat.draft}m` : '--'),
          cargo: cargoName,
          callsign: riskStat?.callsign || alert?.callsign || `VTS${ship.mmsi.slice(-4)}`,
          imo: `${9700000 + Number(ship.mmsi.slice(-4))}`,
          grossTonnage,
          statusBanner:
            ship.status === 'warning'
              ? '10分钟前申请锚地'
              : ship.status === 'caution'
                ? '15分钟前提交进港申请'
                : '当前动态正常',
          route,
          intentSummary:
            intent?.intentSummary ||
            `当前前往 ${route.destination}，保持 ${ship.heading}° 航向，持续沿推荐航路航行。`,
          vhfSummary: session
            ? `${session.intent} · 最近通话 ${session.latestTime.split(' ').pop()}`
            : '暂无实时 VHF 对话',
          riskSummary:
            riskStat?.risk || alert?.type || (ship.status === 'warning' ? '重点关注' : '常规监控'),
          businessInfo: {
            plannedBerth: route.destination,
            movement,
            plannedTime: intent?.intentEta || '待调度确认',
            previousPort: route.past,
            nextPort: route.destination,
            applicant: session?.operatorName || '值班员',
            operator,
            teu: isContainerShip ? `${Math.max(220, Math.round(ship.speed * 36))}` : '--',
            dischargeVolume: isContainerShip
              ? `${Math.max(120, Math.round(ship.speed * 18))}`
              : `${Math.max(300, Math.round(ship.speed * 42))}吨`,
            eta: intent?.occurrenceTime || '待更新',
            departureTime: session?.latestTime || intent?.occurrenceTime || '待更新',
          },
          cargoInfo: {
            cargoName,
            cargoAmount: isContainerShip
              ? `${Math.max(260, Math.round(ship.speed * 40))}TEU`
              : `${Math.max(500, Math.round(ship.speed * 55))}吨`,
            localHazardAmount: isHazardous ? `${Math.max(20, Math.round(ship.speed * 4))}吨` : '--',
            actualHazardAmount: isHazardous
              ? `${Math.max(80, Math.round(ship.speed * 8))}吨`
              : '--',
          },
          dynamicEvents,
          track,
        };
      }),
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
    if (!sidebarOpen) {
      setSidebarOpen(true);
    }
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

  return (
    <div className="vts-home-shell flex h-screen w-screen flex-col overflow-hidden bg-[#0a0a0a] font-sans text-white">
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
        onOpenAdmin={() => setIsAdminView(true)}
        onToggleUserMenu={() => setShowUserMenu((value) => !value)}
        onCloseUserMenu={() => setShowUserMenu(false)}
      />

      <main
        className={`relative flex flex-1 overflow-hidden ${
          sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        <AppSidebar
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          sidebarPosition={sidebarPosition}
          showBars={showBars}
          shipSearchQuery={shipSearchQuery}
          shipSearchResults={shipSearchResults}
          selectedHomeShip={selectedHomeShip}
          selectedIntent={selectedIntent}
          editingIntentIndex={editingIntentIndex}
          selectedAlert={selectedAlert}
          selectedAnchorage={selectedAnchorage}
          selectedExpiringShip={selectedExpiringShip}
          selectedOvertimeShip={selectedOvertimeShip}
          hoveredShipType={hoveredShipType}
          hoveredDurationType={hoveredDurationType}
          anchorageTypeViewMode={anchorageTypeViewMode}
          vhfViewMode={vhfViewMode}
          saabLinkageEnabled={saabLinkageEnabled}
          selectedStation={selectedStation}
          currentTime={currentTime}
          intents={intents}
          intentFilter={intentFilter}
          vhfMessages={vhfMessages}
          activeVhfSession={activeVhfSession}
          waitingVhfSessions={waitingVhfSessions}
          onTabChange={setActiveTab}
          onToggleSidebar={() => setSidebarOpen((value) => !value)}
          onToggleBars={() => setShowBars((value) => !value)}
          onShipSearchQueryChange={setShipSearchQuery}
          onShipSearchSelect={handleSelectHomeShip}
          onSelectTrackPoint={setSelectedHomeShipTrackPointId}
          onToggleSaabLinkage={() => setSaabLinkageEnabled((value) => !value)}
          onSelectedStationChange={setSelectedStation}
          onViewModeChange={setVhfViewMode}
          onSelectSession={setSelectedVhfSessionId}
          onIntentFilterChange={setIntentFilter}
          onToggleIntent={(index) => setSelectedIntent(selectedIntent === index ? null : index)}
          onCloseIntent={() => setSelectedIntent(null)}
          onToggleAlert={(alertId) =>
            setSelectedAlert(selectedAlert === alertId ? null : alertId)
          }
          onCloseAlert={() => setSelectedAlert(null)}
          onSelectAnchorage={(anchorageId, nextExpiringShipId) => {
            setSelectedAnchorage(anchorageId);
            setSelectedExpiringShip(nextExpiringShipId);
            setSelectedOvertimeShip(null);
          }}
          onSelectExpiringShip={setSelectedExpiringShip}
          onSelectOvertimeShip={setSelectedOvertimeShip}
          onHoveredShipTypeChange={setHoveredShipType}
          onHoveredDurationTypeChange={setHoveredDurationType}
          onAnchorageTypeViewModeChange={setAnchorageTypeViewMode}
        />

        <AppHomeMap
          playbackData={playbackData}
          homeMapFocusTarget={homeMapFocusTarget}
          selectedHomeShip={selectedHomeShip}
          selectedHomeShipTrackPoint={selectedHomeShipTrackPoint}
          onMouseMove={setMouseCoords}
          onSelectHomeShip={handleSelectHomeShip}
          onSelectTrackPoint={setSelectedHomeShipTrackPointId}
        />
      </main>

      <AppBottomBar
        showBars={showBars}
        mouseCoords={mouseCoords}
        isControlPanelExpanded={isControlPanelExpanded}
        isToolsExpanded={isToolsExpanded}
        sidebarPosition={sidebarPosition}
        onToggleControlPanel={() => setIsControlPanelExpanded((value) => !value)}
        onToggleTools={() => setIsToolsExpanded((value) => !value)}
        onToggleSidebarPosition={() =>
          setSidebarPosition((value) => (value === 'left' ? 'right' : 'left'))
        }
      />

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
