import type { HomeShipDetail, HomeShipTrackPoint } from '../../../types';
import { RealShipMap } from '../../real-ship';

type AppHomeMapProps = {
  playbackData: { vessel: any; event: any } | null;
  homeMapFocusTarget: [number, number] | null;
  selectedHomeShip: HomeShipDetail | null;
  selectedHomeShipTrackPoint: HomeShipTrackPoint | null;
  onMouseMove: (coords: { lat: number; lng: number } | null) => void;
  onSelectHomeShip: (shipId: string) => void;
  onSelectTrackPoint: (trackPointId: string) => void;
};

export default function AppHomeMap({
  playbackData,
  homeMapFocusTarget,
  selectedHomeShip,
  selectedHomeShipTrackPoint,
  onMouseMove,
  onSelectHomeShip,
  onSelectTrackPoint,
}: AppHomeMapProps) {
  return (
    <RealShipMap
      playbackData={playbackData}
      homeMapFocusTarget={homeMapFocusTarget}
      selectedHomeShip={selectedHomeShip}
      selectedHomeShipTrackPoint={selectedHomeShipTrackPoint}
      onMouseMove={onMouseMove}
      onSelectHomeShip={onSelectHomeShip}
      onSelectTrackPoint={onSelectTrackPoint}
    />
  );
}
