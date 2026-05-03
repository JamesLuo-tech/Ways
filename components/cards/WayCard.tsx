import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { wayThemeStyles } from '../../constants/map-styles';
import { palette, radius, spacing, typography, fontWeight, cardShadow } from '../../constants/theme';
import { getHeatBucketLabel, getWayThemeLabel } from '../../lib/labels';
import type { WayPreview } from '../../lib/types';

interface WayCardProps {
  way: WayPreview;
  selected: boolean;
  onPress: () => void;
}

function formatDistance(d: number) { return `${(d / 1000).toFixed(1)} km`; }
function formatDuration(d: number) {
  const h = Math.floor(d / 3600);
  const m = Math.round((d % 3600) / 60);
  return h > 0 ? `${h}小时${m}分` : `${m}分`;
}

export function WayCard({ way, selected, onPress }: WayCardProps) {
  const theme = wayThemeStyles[way.theme];

  return (
    <Pressable onPress={onPress} style={[styles.frame, selected && styles.frameSelected]}>
      <ImageBackground source={{ uri: way.coverPhoto }} imageStyle={styles.image} style={styles.imageWrap}>
        <View style={styles.scrim} />

        {/* Theme pill */}
        <View style={styles.themePill}>
          <View style={[styles.themeDot, { backgroundColor: theme.color }]} />
          <Text style={styles.themeLabel}>{getWayThemeLabel(way.theme)}</Text>
        </View>

        <View style={styles.heatPill}>
          <Text style={styles.heatLabel}>{getHeatBucketLabel(way.heatBucket)}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{way.name}</Text>
          <Text style={styles.meta}>
            {formatDistance(way.distance)}  ·  {formatDuration(way.duration)}  ·  {way.spotCount} 个点位
          </Text>
          <Text style={styles.supportingMeta}>
            {way.contentCount} 条内容  ·  {way.savedCountLabel}
          </Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 300,
    height: 184,
    marginRight: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  frameSelected: {
    transform: [{ translateY: -3 }],
    borderWidth: 2.5,
    borderColor: palette.accent,
  },
  imageWrap: { flex: 1 },
  image: { borderRadius: radius.xl },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: radius.xl,
  },
  themePill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 254, 250, 0.92)',
  },
  themeDot: { width: 7, height: 7, borderRadius: 4 },
  themeLabel: {
    color: palette.textPrimary,
    fontSize: typography.caption,
    fontWeight: fontWeight.semibold,
    textTransform: 'capitalize',
  },
  heatPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28, 25, 23, 0.64)',
  },
  heatLabel: {
    color: '#FFF',
    fontSize: typography.caption,
    fontWeight: fontWeight.semibold,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  title: {
    color: '#FFF',
    fontSize: typography.body,
    fontWeight: fontWeight.semibold,
  },
  meta: {
    marginTop: 3,
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: typography.footnote,
  },
  supportingMeta: {
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: typography.caption,
    fontWeight: fontWeight.medium,
  },
});
