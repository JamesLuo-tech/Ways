import { useEffect, useRef } from 'react';

import Mapbox from '@rnmapbox/maps';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MAPBOX_STYLE_URL } from '../../constants/map-styles';
import { palette, spacing, radius, typography, fontWeight, cardShadow } from '../../constants/theme';
import { getFirstValidCoordinate, getRouteBounds, isValidCoordinate } from './geo';
import type { MapExplorerProps } from './MapExplorer.types';
import { SpotMarker } from './SpotMarker';
import { WayLine } from './WayLine';

const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (mapboxAccessToken) {
  Mapbox.setAccessToken(mapboxAccessToken);
}

export function MapExplorerNative({
  ways,
  selectedWay,
  onSelectWay,
  onSpotPress,
  onSpotLongPress,
}: MapExplorerProps) {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const center = getFirstValidCoordinate(selectedWay?.previewPolyline, ways[0]?.previewPolyline);

  useEffect(() => {
    if (!selectedWay || !mapboxAccessToken) {
      return;
    }

    const bounds = getRouteBounds(selectedWay.previewPolyline);
    if (!bounds) {
      return;
    }

    const [southWest, northEast] = bounds;

    if (southWest[0] === northEast[0] && southWest[1] === northEast[1]) {
      cameraRef.current?.moveTo(southWest, 900);
      cameraRef.current?.zoomTo(13.5, 900);
      return;
    }

    cameraRef.current?.fitBounds(northEast, southWest, [120, 48, 220, 48], 900);
  }, [selectedWay]);

  if (!mapboxAccessToken) {
    return (
      <MapFallbackPanel ways={ways} selectedWayId={selectedWay?.id ?? null} onSelectWay={onSelectWay} />
    );
  }

  return (
    <Mapbox.MapView style={StyleSheet.absoluteFill} styleURL={MAPBOX_STYLE_URL} compassEnabled={false}>
      <Mapbox.Camera
        ref={cameraRef}
        centerCoordinate={center}
        zoomLevel={11.5}
        animationMode="easeTo"
        animationDuration={1200}
      />
      {ways.map((way) => (
        <WayLine
          key={way.id}
          id={way.id}
          coordinates={way.previewPolyline}
          theme={way.theme}
          selected={way.id === selectedWay?.id}
        />
      ))}
      {selectedWay?.spots
        .filter((spot) => isValidCoordinate(spot.coordinate))
        .map((spot, index) => (
          <SpotMarker
            key={spot.id}
            spot={spot}
            sequence={index + 1}
            onPress={() => onSpotPress(spot.id)}
            onLongPress={() => onSpotLongPress(spot.id)}
          />
        ))}
    </Mapbox.MapView>
  );
}

export { MapExplorerNative as MapExplorer };

function MapFallbackPanel({
  ways,
  selectedWayId,
  onSelectWay,
}: {
  ways: MapExplorerProps['ways'];
  selectedWayId: string | null;
  onSelectWay: MapExplorerProps['onSelectWay'];
}) {
  return (
    <View style={styles.fallback}>
      <View style={styles.fallbackContent}>
        <Text style={styles.badge}>地图预览</Text>
        <Text style={styles.title}>补上 Mapbox token 后可切到真地图</Text>
        <Text style={styles.body}>
          设置 `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` 后，这里会显示真实地图、路线锚点和 Spot 节点。
        </Text>
        <View style={styles.wayList}>
          {ways.map((way) => (
            <Pressable
              key={way.id}
              onPress={() => onSelectWay(way.id)}
              style={[styles.wayItem, way.id === selectedWayId && styles.wayItemSelected]}
            >
              <View
                style={[
                  styles.wayDot,
                  { backgroundColor: way.id === selectedWayId ? palette.accent : palette.textTertiary },
                ]}
              />
              <Text style={styles.wayLabel}>{way.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, backgroundColor: palette.bg },
  fallbackContent: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: 140 },
  badge: {
    color: palette.accent,
    fontSize: typography.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
  },
  title: {
    marginTop: spacing.sm,
    color: palette.textPrimary,
    fontSize: typography.title2,
    fontWeight: fontWeight.bold,
  },
  body: { marginTop: spacing.sm, color: palette.textSecondary, fontSize: typography.subhead, lineHeight: 22 },
  wayList: { marginTop: spacing.lg, gap: spacing.sm },
  wayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  wayItemSelected: { borderWidth: 2, borderColor: palette.accent },
  wayDot: { width: 8, height: 8, borderRadius: 4 },
  wayLabel: { color: palette.textPrimary, fontSize: typography.body },
});
