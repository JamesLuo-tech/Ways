import type { WayDetail, WayPreview } from '../../lib/types';

export interface MapExplorerProps {
  ways: WayPreview[];
  selectedWay: WayDetail | null;
  onSelectWay: (wayId: string) => void;
  onSpotPress: (spotId: string) => void;
  onSpotLongPress: (spotId: string) => void;
}
