import {
  ANCHORAGE_TYPE_CHART_COLORS,
  MOCK_ALERTS,
  MOCK_ANCHORAGES,
  getAnchorageDurationStats,
  getAnchorageTypeStats,
} from '../../../mockData';
import type {
  HomeShipDetail,
  IntentItem,
  ShipSearchResult,
  SidebarTab,
  VHFMessage,
  VhfSessionSummary,
} from '../../../types';
import { SidebarPanel } from '../../sidebar';
import { HomeShipDetailPanel } from '../../ship-detail';
import { VhfPanel } from '../../vhf';
import { IntentListPanel } from '../../intent';
import { WarningListPanel } from '../../warning';
import { AnchoragePanel } from '../../anchorage';
import MarqueeText from './MarqueeText';
import {
  formatAnchorageRemainingDuration,
  getAnchorageAvailabilityRatio,
} from '../utils/anchorage';
import { getCompactIntentLine, getCompactRiskLines } from '../utils/intent';
import type { HomeViewMode } from '../utils/viewModes';

type SidebarPosition = 'left' | 'right';

export type AppSidebarProps = {
  activeTab: SidebarTab;
  sidebarOpen: boolean;
  sidebarPosition: SidebarPosition;
  showBars: boolean;
  shipSearchQuery: string;
  shipSearchResults: ShipSearchResult[];
  selectedHomeShip: HomeShipDetail | null;
  selectedIntent: number | null;
  editingIntentIndex: number | null;
  selectedAlert: string | null;
  selectedAnchorage: string | null;
  selectedExpiringShip: string | null;
  selectedOvertimeShip: string | null;
  hoveredShipType: string | null;
  hoveredDurationType: string | null;
  anchorageTypeViewMode: 'chart' | 'tags';
  vhfViewMode: 'list' | 'flow';
  saabLinkageEnabled: boolean;
  selectedStation: string;
  currentTime: Date;
  intents: IntentItem[];
  intentFilter: string;
  vhfMessages: VHFMessage[];
  activeVhfSession: VhfSessionSummary | null;
  waitingVhfSessions: VhfSessionSummary[];
  onTabChange: (tab: SidebarTab) => void;
  onToggleSidebar: () => void;
  onToggleBars: () => void;
  onShipSearchQueryChange: (value: string) => void;
  onShipSearchSelect: (shipId: string) => void;
  onSelectTrackPoint: (trackPointId: string | null) => void;
  onToggleSaabLinkage: () => void;
  onSelectedStationChange: (station: string) => void;
  onViewModeChange: (mode: 'list' | 'flow') => void;
  onSelectSession: (sessionId: string | null) => void;
  onIntentFilterChange: (value: string) => void;
  onToggleIntent: (index: number) => void;
  onCloseIntent: () => void;
  onToggleAlert: (alertId: string) => void;
  onCloseAlert: () => void;
  onSelectAnchorage: (anchorageId: string | null, nextExpiringShipId: string | null) => void;
  onSelectExpiringShip: (shipId: string | null) => void;
  onSelectOvertimeShip: (shipId: string | null) => void;
  onHoveredShipTypeChange: (value: string | null) => void;
  onHoveredDurationTypeChange: (value: string | null) => void;
  onAnchorageTypeViewModeChange: (mode: 'chart' | 'tags') => void;
  currentMode: HomeViewMode;
  onModeChange: (mode: HomeViewMode) => void;
  onOpenAdmin: () => void;
  onToggleUserMenu: () => void;
  onCloseUserMenu: () => void;
  showUserMenu: boolean;
};

export default function AppSidebar({
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
  onTabChange,
  onToggleSidebar,
  onToggleBars,
  onShipSearchQueryChange,
  onShipSearchSelect,
  onSelectTrackPoint,
  onToggleSaabLinkage,
  onSelectedStationChange,
  onViewModeChange,
  onSelectSession,
  onIntentFilterChange,
  onToggleIntent,
  onCloseIntent,
  onToggleAlert,
  onCloseAlert,
  onSelectAnchorage,
  onSelectExpiringShip,
  onSelectOvertimeShip,
  onHoveredShipTypeChange,
  onHoveredDurationTypeChange,
  onAnchorageTypeViewModeChange,
  currentMode,
  onModeChange,
  onOpenAdmin,
  onToggleUserMenu,
  onCloseUserMenu,
  showUserMenu,
}: AppSidebarProps) {
  return (
    <SidebarPanel
      activeTab={activeTab}
      onTabChange={onTabChange}
      isOpen={sidebarOpen}
      onToggle={onToggleSidebar}
      position={sidebarPosition}
      showBars={showBars}
      onToggleBars={onToggleBars}
      shipSearchQuery={shipSearchQuery}
      onShipSearchQueryChange={onShipSearchQueryChange}
      shipSearchResults={shipSearchResults}
      onShipSearchSelect={onShipSearchSelect}
      currentMode={currentMode}
      onModeChange={onModeChange}
      onOpenAdmin={onOpenAdmin}
      onToggleUserMenu={onToggleUserMenu}
      onCloseUserMenu={onCloseUserMenu}
      showUserMenu={showUserMenu}
    >
      {activeTab === 'ship' && (
        <div className='flex h-full min-h-0 flex-col'>
          <div className='custom-scrollbar flex-1 overflow-y-auto'>
            <HomeShipDetailPanel
              ship={selectedHomeShip}
              onSelectTrackPoint={onSelectTrackPoint}
            />
          </div>
        </div>
      )}

      {activeTab === 'vhf' && (
        <VhfPanel
          saabLinkageEnabled={saabLinkageEnabled}
          selectedStation={selectedStation}
          vhfViewMode={vhfViewMode}
          vhfMessages={vhfMessages}
          activeVhfSession={activeVhfSession}
          waitingVhfSessions={waitingVhfSessions}
          onToggleSaabLinkage={onToggleSaabLinkage}
          onSelectedStationChange={onSelectedStationChange}
          onViewModeChange={onViewModeChange}
          onSelectSession={onSelectSession}
        />
      )}

      {activeTab === 'intent' && (
        <IntentListPanel
          intents={intents}
          intentFilter={intentFilter}
          selectedIntent={selectedIntent}
          editingIntentIndex={editingIntentIndex}
          onIntentFilterChange={onIntentFilterChange}
          onToggleIntent={onToggleIntent}
          onCloseIntent={onCloseIntent}
          getCompactIntentLine={getCompactIntentLine}
          getCompactRiskLines={getCompactRiskLines}
        />
      )}

      {activeTab === 'warning' && (
        <WarningListPanel
          alerts={MOCK_ALERTS}
          selectedAlert={selectedAlert}
          onToggleAlert={onToggleAlert}
          onCloseAlert={onCloseAlert}
        />
      )}

      {activeTab === 'anchorage' && (
        <AnchoragePanel
          anchorages={MOCK_ANCHORAGES}
          selectedAnchorage={selectedAnchorage}
          selectedExpiringShip={selectedExpiringShip}
          selectedOvertimeShip={selectedOvertimeShip}
          hoveredShipType={hoveredShipType}
          hoveredDurationType={hoveredDurationType}
          anchorageTypeViewMode={anchorageTypeViewMode}
          currentTime={currentTime}
          onSelectAnchorage={onSelectAnchorage}
          onSelectExpiringShip={onSelectExpiringShip}
          onSelectOvertimeShip={onSelectOvertimeShip}
          onHoveredShipTypeChange={onHoveredShipTypeChange}
          onHoveredDurationTypeChange={onHoveredDurationTypeChange}
          onAnchorageTypeViewModeChange={onAnchorageTypeViewModeChange}
          getAnchorageTypeStats={getAnchorageTypeStats}
          getAnchorageDurationStats={getAnchorageDurationStats}
          getAnchorageAvailabilityRatio={getAnchorageAvailabilityRatio}
          formatAnchorageRemainingDuration={formatAnchorageRemainingDuration}
          chartColors={ANCHORAGE_TYPE_CHART_COLORS}
          MarqueeText={MarqueeText}
        />
      )}
    </SidebarPanel>
  );
}