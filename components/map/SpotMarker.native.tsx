import Mapbox from '@rnmapbox/maps';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography, fontWeight, cardShadow } from '../../constants/theme';
import type { SpotPreview } from '../../lib/types';
import { isValidCoordinate } from './geo';

interface SpotMarkerProps {
  spot: SpotPreview;
  onPress: () => void;
  onLongPress?: () => void;
  sequence?: number;
}

export function SpotMarkerNative({ spot, onPress, onLongPress, sequence }: SpotMarkerProps) {
  if (!isValidCoordinate(spot.coordinate)) {
    return null;
  }

  return (
    <Mapbox.PointAnnotation id={spot.id} coordinate={spot.coordinate} onSelected={onPress}>
      <Pressable onPress={onPress} onLongPress={onLongPress}>
        <View style={styles.container}>
          <View style={[styles.dot, sequence ? styles.dotActive : null]}>
            {sequence ? <Text style={styles.dotLabel}>{sequence}</Text> : null}
          </View>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>{spot.name}</Text>
          </View>
        </View>
      </Pressable>
    </Mapbox.PointAnnotation>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: palette.accent,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  dotActive: {
    backgroundColor: palette.accent,
  },
  dotLabel: {
    color: palette.textOnAccent,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  labelWrap: {
    marginTop: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 254, 250, 0.95)',
    ...cardShadow,
  },
  label: { color: palette.textPrimary, fontSize: typography.caption, fontWeight: fontWeight.medium },
});
