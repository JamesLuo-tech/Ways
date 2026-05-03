import Mapbox from '@rnmapbox/maps';

import { wayThemeStyles } from '../../constants/map-styles';
import type { Coordinate, WayTheme } from '../../lib/types';
import { sanitizeCoordinates } from './geo';

interface WayLineProps {
  id: string;
  coordinates: Coordinate[];
  theme: WayTheme;
  selected: boolean;
}

export function WayLineNative({ id, coordinates, theme, selected }: WayLineProps) {
  const style = wayThemeStyles[theme];
  const validCoordinates = sanitizeCoordinates(coordinates);

  if (validCoordinates.length < 2) {
    return null;
  }

  const feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: validCoordinates,
    },
  } as const;

  return (
    <Mapbox.ShapeSource id={`${id}-source`} shape={feature}>
      <Mapbox.LineLayer
        id={`${id}-glow`}
        style={{
          lineColor: style.glowColor,
          lineWidth: selected ? 9 : 6,
          lineBlur: 1.4,
          lineOpacity: selected ? 0.35 : 0.2,
          lineDasharray: style.dashArray,
        }}
      />
      <Mapbox.LineLayer
        id={`${id}-line`}
        style={{
          lineColor: style.color,
          lineWidth: selected ? 5 : 3,
          lineOpacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
          lineDasharray: style.dashArray,
        }}
      />
    </Mapbox.ShapeSource>
  );
}
