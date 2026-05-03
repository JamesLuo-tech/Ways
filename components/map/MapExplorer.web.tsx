import 'mapbox-gl/dist/mapbox-gl.css';

import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MAPBOX_STYLE_URL } from '../../constants/map-styles';
import { palette, spacing, radius, typography, fontWeight, cardShadow } from '../../constants/theme';
import type { SpotPreview } from '../../lib/types';
import { getFirstValidCoordinate, getRouteBounds, isValidCoordinate } from './geo';
import type { MapExplorerProps } from './MapExplorer.types';

const mapboxAccessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

if (mapboxAccessToken) {
  mapboxgl.accessToken = mapboxAccessToken;
}

type WebMapInstance = any;
type WebMarkerInstance = any;

export function MapExplorerWeb({
  ways,
  selectedWay,
  onSelectWay,
  onSpotPress,
  onSpotLongPress,
}: MapExplorerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<WebMapInstance | null>(null);
  const markersRef = useRef<WebMarkerInstance[]>([]);
  const isReadyRef = useRef(false);
  const initialCenterRef = useRef(getFirstValidCoordinate(selectedWay?.previewPolyline, ways[0]?.previewPolyline));
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapboxAccessToken || !containerRef.current || mapRef.current) {
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE_URL,
      center: initialCenterRef.current,
      zoom: 11.5,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
      touchZoomRotate: false,
    });

    mapRef.current = map;

    const handleReady = () => {
      isReadyRef.current = true;
      setIsReady(true);
      setLoadError(null);
      map.resize();
    };

    const handleError = (event: MapboxRecoverableErrorEvent) => {
      if (isReadyRef.current || isRecoverableMapboxResourceError(event)) {
        return;
      }

      setLoadError(event.error?.message ?? 'Mapbox 地图加载失败');
    };

    map.on('style.load', handleReady);
    map.on('load', handleReady);
    map.on('error', handleError);

    return () => {
      clearMarkers(markersRef.current);
      markersRef.current = [];
      isReadyRef.current = false;
      map.off('style.load', handleReady);
      map.off('load', handleReady);
      map.off('error', handleError);
      map.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) {
      return;
    }

    clearMarkers(markersRef.current);
    markersRef.current = [];

    if (selectedWay) {
      markersRef.current = selectedWay.spots
        .filter((spot) => isValidCoordinate(spot.coordinate))
        .map((spot, index) =>
          createSpotMarker({
            map,
            spot,
            sequence: index + 1,
            onPress: () => onSpotPress(spot.id),
            onLongPress: () => onSpotLongPress(spot.id),
          }),
        );
    }

    return () => {
      clearMarkers(markersRef.current);
      markersRef.current = [];
    };
  }, [isReady, onSpotLongPress, onSpotPress, selectedWay]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || !selectedWay) {
      return;
    }

    const bounds = getRouteBounds(selectedWay.previewPolyline);
    if (!bounds) {
      return;
    }

    const [southWest, northEast] = bounds;
    if (southWest[0] === northEast[0] && southWest[1] === northEast[1]) {
      map.easeTo({ center: southWest, zoom: 13.5, duration: 900 });
      return;
    }

    map.fitBounds([southWest, northEast], {
      padding: { top: 120, right: 48, bottom: 220, left: 48 },
      duration: 900,
    });
  }, [isReady, selectedWay]);

  if (!mapboxAccessToken) {
    return <MapFallbackPanel ways={ways} selectedWayId={selectedWay?.id ?? null} onSelectWay={onSelectWay} />;
  }

  if (loadError) {
    return (
      <View style={styles.fallback}>
        <View style={styles.fallbackContent}>
          <Text style={styles.badge}>地图预览</Text>
          <Text style={styles.title}>Mapbox 地图加载失败</Text>
          <Text style={styles.body}>{loadError}</Text>
        </View>
      </View>
    );
  }

  return (
    <div ref={containerRef} style={mapContainerStyle}>
      {!isReady ? (
        <View style={styles.loadingPill}>
          <Text style={styles.loadingText}>正在加载地图与路线…</Text>
        </View>
      ) : null}
    </div>
  );
}

export { MapExplorerWeb as MapExplorer };

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

function createSpotMarker({
  map,
  spot,
  sequence,
  onPress,
  onLongPress,
}: {
  map: WebMapInstance;
  spot: SpotPreview;
  sequence: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '3px';
  wrapper.style.cursor = 'pointer';
  wrapper.style.pointerEvents = 'auto';

  const dot = document.createElement('div');
  dot.style.width = '18px';
  dot.style.height = '18px';
  dot.style.borderRadius = '999px';
  dot.style.border = `2px solid ${palette.accent}`;
  dot.style.background = palette.accent;
  dot.style.boxShadow = '0 4px 12px rgba(120, 100, 70, 0.20)';
  dot.style.display = 'flex';
  dot.style.alignItems = 'center';
  dot.style.justifyContent = 'center';
  dot.style.color = palette.textOnAccent;
  dot.style.fontSize = '10px';
  dot.style.fontWeight = fontWeight.bold;
  dot.textContent = String(sequence);

  const label = document.createElement('div');
  label.style.padding = '4px 8px';
  label.style.borderRadius = '8px';
  label.style.background = 'rgba(255, 254, 250, 0.96)';
  label.style.color = palette.textPrimary;
  label.style.fontSize = '12px';
  label.style.fontWeight = fontWeight.medium;
  label.style.boxShadow = '0 6px 18px rgba(120, 100, 70, 0.15)';
  label.style.whiteSpace = 'nowrap';
  label.textContent = spot.name;

  wrapper.appendChild(dot);
  wrapper.appendChild(label);
  wrapper.addEventListener('click', onPress);
  wrapper.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    onLongPress();
  });

  return new mapboxgl.Marker({ element: wrapper, anchor: 'bottom' }).setLngLat(spot.coordinate).addTo(map);
}

function clearMarkers(markers: WebMarkerInstance[]) {
  markers.forEach((marker) => marker.remove());
}

type MapboxRecoverableErrorEvent = {
  error?: {
    message?: string;
    url?: string;
  };
  resourceType?: string;
  sourceId?: string;
  tile?: unknown;
  url?: string;
};

function isRecoverableMapboxResourceError(event: MapboxRecoverableErrorEvent) {
  const url = event.error?.url ?? event.url ?? '';
  const resourceType = event.resourceType?.toLowerCase() ?? '';

  return (
    Boolean(event.sourceId || event.tile) ||
    resourceType === 'tile' ||
    url.includes('/v4/') ||
    url.includes('/map-sessions/') ||
    url.includes('events.mapbox.com')
  );
}

const mapContainerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  background: palette.bg,
};

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
  loadingPill: {
    position: 'absolute',
    top: 120,
    left: '50%',
    transform: [{ translateX: -90 }],
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  loadingText: {
    color: palette.textSecondary,
    fontSize: typography.subhead,
  },
});
