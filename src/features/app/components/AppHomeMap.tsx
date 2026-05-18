import RealShipMap from '../../real-ship/RealShipMap';
import type { HomeShipDetail, HomeShipTrackPoint } from '../../../types';
import type { HomeViewMode } from '../utils/viewModes';
import type { MessageFeedItem } from './messagePushConfig';

export type AppHomeMapProps = {
  mode?: HomeViewMode;
  playbackData: { vessel: any; event: any } | null;
  homeMapFocusTarget: [number, number] | null;
  selectedHomeShip: HomeShipDetail | null;
  selectedHomeShipTrackPoint: HomeShipTrackPoint | null;
  smartDutyMessages?: MessageFeedItem[];
  onMouseMove: (coords: { lat: number; lng: number } | null) => void;
  onSelectHomeShip: (shipId: string) => void;
  onSelectTrackPoint: (trackPointId: string) => void;
  onModeChange?: (mode: HomeViewMode) => void;
};

export default function AppHomeMap({
  mode,
  playbackData,
  homeMapFocusTarget,
  selectedHomeShip,
  selectedHomeShipTrackPoint,
  smartDutyMessages,
  onMouseMove,
  onSelectHomeShip,
  onSelectTrackPoint,
  onModeChange,
}: AppHomeMapProps) {
  return (
    <div className="relative flex-1 overflow-hidden bg-[#0a0a0a]">
      <RealShipMap
        mode={mode}
        playbackData={playbackData}
        homeMapFocusTarget={homeMapFocusTarget}
        selectedHomeShip={selectedHomeShip}
        selectedHomeShipTrackPoint={selectedHomeShipTrackPoint}
        smartDutyMessages={smartDutyMessages}
        onMouseMove={onMouseMove}
        onSelectHomeShip={onSelectHomeShip}
        onSelectTrackPoint={onSelectTrackPoint}
      />
    </div>
  );
}
