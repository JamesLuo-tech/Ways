import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpotSheet } from '../../components/SpotSheet';
import { WayCard } from '../../components/cards/WayCard';
import { MapExplorer } from '../../components/map/MapExplorer';
import { PageHeader } from '../../components/ui/PageHeader';
import { palette, spacing, radius, typography, fontWeight, cardShadow } from '../../constants/theme';
import { getHeatBucketLabel } from '../../lib/labels';
import { usePlanStore } from '../../lib/store/planStore';
import { useSpotStore } from '../../lib/store/spotStore';
import { useWayStore } from '../../lib/store/wayStore';
import { useWishlistStore } from '../../lib/store/wishlistStore';
import type { HeatBucket, SpotPreview, WishlistItem } from '../../lib/types';

type ExploreFilter = 'all' | HeatBucket;

const FILTER_OPTIONS: { value: ExploreFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'hot', label: '热门路线' },
  { value: 'emerging', label: '新发现' },
  { value: 'classic', label: '经典路线' },
  { value: 'editorial', label: '编辑精选' },
];

export default function ExploreScreen() {
  const { ways, selectedWay, selectedWayId, isLoading, error, loadWays, selectWay } = useWayStore();
  const { selectedSpot, isSheetOpen, isLoading: isSpotLoading, openSpot, closeSpot } = useSpotStore();
  const wishlist = useWishlistStore();
  const plan = usePlanStore();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadWays();
  }, [loadWays]);

  const filteredWays = useMemo(
    () => (activeFilter === 'all' ? ways : ways.filter((way) => way.heatBucket === activeFilter)),
    [activeFilter, ways],
  );

  useEffect(() => {
    if (filteredWays.length === 0) {
      return;
    }

    const selectedStillVisible = filteredWays.some((way) => way.id === selectedWayId);
    if (!selectedStillVisible) {
      void selectWay(filteredWays[0].id);
    }
  }, [filteredWays, selectWay, selectedWayId]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timer = setTimeout(() => setStatusMessage(null), 2200);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const handleToggleWishlist = (spot: SpotPreview) => {
    if (wishlist.has(spot.id)) {
      wishlist.remove(spot.id);
      setStatusMessage(`${spot.name} 已从灵感池移除`);
      return;
    }

    wishlist.add(spot);
    setStatusMessage(`${spot.name} 已收进灵感池`);
  };

  const handleAddToDraft = (spot: SpotPreview) => {
    const item = toWishlistItem(spot);
    wishlist.add(spot);

    if (!plan.draft) {
      plan.startRoute('custom');
    }

    plan.addSpot(item);
    setStatusMessage(`${spot.name} 已加入路线稿`);
  };

  const handleSpotLongPress = async (spotId: string) => {
    const spot = selectedWay?.spots.find((item) => item.id === spotId);
    if (spot) {
      handleAddToDraft(spot);
      return;
    }

    await openSpot(spotId);
    setStatusMessage('已打开节点，点按内容卡可加入路线稿');
  };

  return (
    <View style={styles.container}>
      <MapExplorer
        ways={filteredWays}
        selectedWay={selectedWay && filteredWays.some((way) => way.id === selectedWay.id) ? selectedWay : null}
        onSelectWay={(wayId) => void selectWay(wayId)}
        onSpotPress={(spotId) => void openSpot(spotId)}
        onSpotLongPress={(spotId) => void handleSpotLongPress(spotId)}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <PageHeader
          eyebrow="地图探索"
          title="先选路线，再看节点内容"
          subtitle="路线是主入口；点开 Spot 看内容卡，收藏或直接加入路线稿。"
          accessory={
            selectedWay ? (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{getHeatBucketLabel(selectedWay.heatBucket)}</Text>
              </View>
            ) : null
          }
        />

        <FlatList
          horizontal
          data={FILTER_OPTIONS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRail}
          renderItem={({ item }) => {
            const active = activeFilter === item.value;
            return (
              <Pressable
                onPress={() => setActiveFilter(item.value)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingPill}>
          <ActivityIndicator color={palette.accent} size="small" />
          <Text style={styles.loadingText}>正在整理路线…</Text>
        </View>
      ) : null}

      {error ? (
        <Pressable onPress={() => void loadWays()} style={styles.errorBanner}>
          <Text style={styles.errorTitle}>路线加载失败</Text>
          <Text style={styles.errorBody}>{error}，点按这里重试</Text>
        </Pressable>
      ) : null}

      {statusMessage ? (
        <View style={styles.statusToast}>
          <Text style={styles.statusToastText}>{statusMessage}</Text>
        </View>
      ) : null}

      <View style={styles.cardRail}>
        {filteredWays.length > 0 ? (
          <FlatList
            data={filteredWays}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRailContent}
            snapToAlignment="start"
            decelerationRate="fast"
            renderItem={({ item }) => (
              <WayCard
                way={item}
                selected={item.id === selectedWayId}
                onPress={() => void selectWay(item.id)}
              />
            )}
          />
        ) : (
          <View style={styles.emptyFilterCard}>
            <Text style={styles.emptyFilterTitle}>这个筛选暂时没有路线</Text>
            <Text style={styles.emptyFilterBody}>换到“全部”或“编辑精选”，继续看路线和节点内容。</Text>
          </View>
        )}
      </View>

      <SpotSheet
        spot={selectedSpot}
        isOpen={isSheetOpen}
        isLoading={isSpotLoading}
        onClose={closeSpot}
        isCollected={selectedSpot ? wishlist.has(selectedSpot.id) : false}
        isInDraft={selectedSpot ? plan.draft?.spots.some((item) => item.spotId === selectedSpot.id) ?? false : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToDraft={handleAddToDraft}
      />
    </View>
  );
}

function toWishlistItem(spot: SpotPreview): WishlistItem {
  return {
    spotId: spot.id,
    name: spot.name,
    coordinate: spot.coordinate,
    category: spot.category,
    region: spot.region,
    addedAt: new Date().toISOString(),
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  headerBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.accentSoft,
  },
  headerBadgeText: {
    color: palette.accent,
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },
  filterRail: {
    paddingTop: spacing.md,
    paddingRight: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 254, 250, 0.86)',
    ...cardShadow,
  },
  filterChipActive: {
    backgroundColor: palette.textPrimary,
  },
  filterChipText: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },
  filterChipTextActive: {
    color: palette.textOnAccent,
  },
  loadingPill: {
    position: 'absolute',
    top: 174,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
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
  errorBanner: {
    position: 'absolute',
    top: 174,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
  },
  errorTitle: {
    color: palette.error,
    fontWeight: fontWeight.semibold,
    fontSize: typography.subhead,
  },
  errorBody: {
    marginTop: spacing.xs,
    color: palette.textSecondary,
    fontSize: typography.footnote,
  },
  statusToast: {
    position: 'absolute',
    top: 174,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28, 25, 23, 0.84)',
  },
  statusToastText: {
    color: palette.textOnAccent,
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },
  cardRail: {
    position: 'absolute',
    bottom: 108,
    left: 0,
    right: 0,
  },
  cardRailContent: {
    paddingHorizontal: spacing.lg,
  },
  emptyFilterCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  emptyFilterTitle: {
    color: palette.textPrimary,
    fontSize: typography.body,
    fontWeight: fontWeight.semibold,
  },
  emptyFilterBody: {
    marginTop: spacing.xs,
    color: palette.textSecondary,
    fontSize: typography.footnote,
  },
});
