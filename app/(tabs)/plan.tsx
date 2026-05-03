import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageHeader } from '../../components/ui/PageHeader';
import { palette, spacing, radius, typography, fontWeight, cardShadow } from '../../constants/theme';
import { getSpotCategoryLabel } from '../../lib/labels';
import { usePlanStore } from '../../lib/store/planStore';
import { useWishlistStore } from '../../lib/store/wishlistStore';
import type { WishlistItem, WayTheme } from '../../lib/types';
import { openExternalNav } from '../../lib/navigation';

type PlanMode = 'wishlist' | 'builder';
type WishlistGroup = {
  id: string;
  province: string;
  city: string;
  area: string;
  items: WishlistItem[];
  categorySummary: string;
};

const THEME_OPTIONS: { value: WayTheme; label: string; icon: string }[] = [
  { value: 'hiking', label: '徒步', icon: 'walk' },
  { value: 'wine', label: '酒庄', icon: 'wine' },
  { value: 'coffee', label: '咖啡', icon: 'cafe' },
  { value: 'ancient-town', label: '古镇', icon: 'business' },
  { value: 'cycling', label: '骑行', icon: 'bicycle' },
  { value: 'custom', label: '自定义', icon: 'create' },
];

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<PlanMode>('wishlist');

  const wishlist = useWishlistStore();
  const plan = usePlanStore();
  const wishlistGroups = buildWishlistGroups(wishlist.items);

  const handleAddToDraft = useCallback(
    (item: WishlistItem) => {
      if (!plan.draft) plan.startRoute();
      plan.addSpot(item);
      setMode('builder');
    },
    [plan],
  );

  const handleRemoveFromWishlist = useCallback(
    (spotId: string) => wishlist.remove(spotId),
    [wishlist],
  );

  const handleAddGroupToDraft = useCallback(
    (items: WishlistItem[]) => {
      if (!plan.draft) plan.startRoute();
      items.forEach((item) => plan.addSpot(item));
      setMode('builder');
    },
    [plan],
  );

  const handleMoveUp = useCallback(
    (index: number) => { if (index > 0) plan.reorderSpots(index, index - 1); },
    [plan],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (plan.draft && index < plan.draft.spots.length - 1)
        plan.reorderSpots(index, index + 1);
    },
    [plan],
  );

  const handleExportNav = useCallback(() => {
    if (!plan.draft || plan.draft.spots.length < 2) {
      Alert.alert('至少需要两个点位', '先把两个以上的点位加入路线，再开始导航。');
      return;
    }
    openExternalNav(plan.draft.spots.map((s) => s.coordinate));
  }, [plan.draft]);

  const canNavigate = plan.draft && plan.draft.spots.length >= 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <PageHeader
        eyebrow="路线规划"
        title="先收进灵感池，再连点成线"
        subtitle="把想去的 Spot 收起来，调整顺序后直接外跳到地图导航。"
        accessory={
          canNavigate ? (
            <Pressable onPress={handleExportNav} style={styles.accentBtn}>
              <Ionicons name="navigate" size={15} color={palette.textOnAccent} />
              <Text style={styles.accentBtnText}>去导航</Text>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.modeTabs}>
        {(['wishlist', 'builder'] as const).map((tab) => {
          const active = mode === tab;
          const label = tab === 'wishlist'
            ? `灵感池 ${wishlist.items.length}`
            : `路线稿 ${plan.draft?.spots.length ?? 0}`;
          return (
            <Pressable
              key={tab}
              onPress={() => setMode(tab)}
              style={[styles.modeTab, active && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabLabel, active && styles.modeTabLabelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'wishlist' ? (
        wishlist.items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="heart-outline" size={32} color={palette.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>灵感池还是空的</Text>
            <Text style={styles.emptyBody}>
              先去探索页看看路线和 Spot，点一下爱心就会收进这里。
            </Text>
          </View>
        ) : (
          <FlatList
            data={wishlistGroups}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={(
              <View style={styles.groupIntro}>
                <Text style={styles.groupIntroTitle}>自动归类</Text>
                <Text style={styles.groupIntroBody}>
                  当前先按坐标把收藏点聚成省份 / 城市 / 地区小组，方便整组整理成路线稿。
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <WishlistGroupCard
                group={item}
                draftSpotIds={new Set(plan.draft?.spots.map((spot) => spot.spotId) ?? [])}
                onAddGroup={() => handleAddGroupToDraft(item.items)}
                onAddItem={handleAddToDraft}
                onRemoveItem={handleRemoveFromWishlist}
              />
            )}
          />
        )
      ) : null}

      {mode === 'builder' ? (
        plan.draft === null ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="map-outline" size={32} color={palette.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>还没有路线稿</Text>
            <Text style={styles.emptyBody}>
              回到灵感池把点位加进来，路线就会自动开始成形。
            </Text>
            <Pressable
              onPress={() => { plan.startRoute(); setMode('wishlist'); }}
              style={styles.textBtn}
            >
              <Text style={styles.textBtnLabel}>去灵感池</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.builderWrap}>
            <TextInput
              style={styles.routeNameInput}
              value={plan.draft.name}
              onChangeText={plan.setName}
              placeholder="给这条路线起个名字"
              placeholderTextColor={palette.textTertiary}
            />

            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((t) => {
                const active = plan.draft!.theme === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => plan.setTheme(t.value)}
                    style={[styles.themeChip, active && styles.themeChipActive]}
                  >
                    <Ionicons
                      name={t.icon as any}
                      size={16}
                      color={active ? palette.accent : palette.textTertiary}
                    />
                    <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {plan.draft.spots.length === 0 ? (
              <View style={styles.builderEmpty}>
                <Text style={styles.builderEmptyText}>
                  先从灵感池加入点位，路线才会开始连起来
                </Text>
              </View>
            ) : (
              <FlatList
                data={plan.draft.spots}
                keyExtractor={(item) => item.spotId}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                  <RouteSpotCard
                    item={item}
                    index={index}
                    total={plan.draft!.spots.length}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    onRemove={() => plan.removeSpot(item.spotId)}
                  />
                )}
              />
            )}

            <View style={styles.builderActions}>
              <Pressable onPress={plan.clearDraft}>
                <Text style={styles.destructiveText}>清空路线</Text>
              </Pressable>
              <Pressable onPress={() => setMode('wishlist')} style={styles.textBtn}>
                <Text style={styles.textBtnLabel}>继续加点</Text>
              </Pressable>
            </View>
          </View>
        )
      ) : null}
    </View>
  );
}

/* ─── Wishlist Card ── */

function WishlistCard({
  item, isInDraft, onAdd, onRemove,
}: {
  item: WishlistItem; isInDraft: boolean; onAdd: () => void; onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.categoryDot, { backgroundColor: categoryColor(item.category) }]} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardMeta}>{getSpotCategoryLabel(item.category)}</Text>
      </View>
      <Pressable onPress={onAdd} style={styles.iconBtn} hitSlop={8}>
        <Ionicons
          name={isInDraft ? 'checkmark-circle' : 'add-circle-outline'}
          size={22}
          color={isInDraft ? palette.success : palette.accent}
        />
      </Pressable>
      <Pressable onPress={onRemove} style={styles.iconBtn} hitSlop={8}>
        <Ionicons name="close-circle-outline" size={22} color={palette.textTertiary} />
      </Pressable>
    </View>
  );
}

function WishlistGroupCard({
  group,
  draftSpotIds,
  onAddGroup,
  onAddItem,
  onRemoveItem,
}: {
  group: WishlistGroup;
  draftSpotIds: Set<string>;
  onAddGroup: () => void;
  onAddItem: (item: WishlistItem) => void;
  onRemoveItem: (spotId: string) => void;
}) {
  const inDraftCount = group.items.filter((item) => draftSpotIds.has(item.spotId)).length;
  const canAddGroup = inDraftCount < group.items.length;

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupHeaderInfo}>
          <Text style={styles.groupTitle}>
            {group.province} · {group.city} · {group.area}
          </Text>
          <Text style={styles.groupMeta}>
            {group.items.length} 个收藏 · {group.categorySummary}
          </Text>
        </View>

        <Pressable
          onPress={onAddGroup}
          disabled={!canAddGroup}
          style={[styles.groupAction, !canAddGroup && styles.groupActionDisabled]}
        >
          <Text style={[styles.groupActionText, !canAddGroup && styles.groupActionTextDisabled]}>
            {canAddGroup ? '整组加入路线' : '已全部加入'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.groupItems}>
        {group.items.map((item) => (
          <WishlistCard
            key={item.spotId}
            item={item}
            isInDraft={draftSpotIds.has(item.spotId)}
            onAdd={() => onAddItem(item)}
            onRemove={() => onRemoveItem(item.spotId)}
          />
        ))}
      </View>
    </View>
  );
}

/* ─── Route Spot Card ── */

function RouteSpotCard({
  item, index, total, onMoveUp, onMoveDown, onRemove,
}: {
  item: WishlistItem; index: number; total: number;
  onMoveUp: () => void; onMoveDown: () => void; onRemove: () => void;
}) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <View style={styles.routeCard}>
      {/* Timeline */}
      <View style={styles.timeline}>
        {!isFirst && <View style={styles.timelineLineTop} />}
        <View style={styles.timelineDot}>
          <Text style={styles.timelineNum}>{index + 1}</Text>
        </View>
        {!isLast && <View style={styles.timelineLineBottom} />}
      </View>

      <View style={styles.routeCardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardMeta}>{getSpotCategoryLabel(item.category)}</Text>
      </View>

      <View style={styles.reorderBtns}>
        <Pressable onPress={onMoveUp} disabled={isFirst} style={styles.iconBtn} hitSlop={4}>
          <Ionicons name="chevron-up" size={18} color={isFirst ? palette.textTertiary : palette.textSecondary} />
        </Pressable>
        <Pressable onPress={onMoveDown} disabled={isLast} style={styles.iconBtn} hitSlop={4}>
          <Ionicons name="chevron-down" size={18} color={isLast ? palette.textTertiary : palette.textSecondary} />
        </Pressable>
        <Pressable onPress={onRemove} style={styles.iconBtn} hitSlop={4}>
          <Ionicons name="close" size={16} color={palette.error} />
        </Pressable>
      </View>
    </View>
  );
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    scenic: '#2D6A4F',
    food: '#D97706',
    camp: '#7C3AED',
    viewpoint: '#0A84FF',
    culture: '#9B2C2C',
    other: palette.textTertiary,
  };
  return map[cat] ?? palette.textTertiary;
}

function buildWishlistGroups(items: WishlistItem[]): WishlistGroup[] {
  if (items.length === 0) return [];

  const bounds = items.reduce(
    (acc, item) => ({
      minLongitude: Math.min(acc.minLongitude, item.coordinate[0]),
      maxLongitude: Math.max(acc.maxLongitude, item.coordinate[0]),
      minLatitude: Math.min(acc.minLatitude, item.coordinate[1]),
      maxLatitude: Math.max(acc.maxLatitude, item.coordinate[1]),
    }),
    {
      minLongitude: Number.POSITIVE_INFINITY,
      maxLongitude: Number.NEGATIVE_INFINITY,
      minLatitude: Number.POSITIVE_INFINITY,
      maxLatitude: Number.NEGATIVE_INFINITY,
    },
  );

  const groups = new Map<string, WishlistItem[]>();

  items.forEach((item) => {
    const fallback = inferProvinceCity(item.coordinate);
    const province = item.region?.province ?? fallback.province;
    const city = item.region?.city ?? fallback.city;
    const area = item.region?.area ?? item.region?.district ?? buildWishlistTileKey(item.coordinate);
    const key = `${province}|${city}|${area}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });

  return Array.from(groups.entries())
    .map(([key, groupedItems]) => {
      const [province, city, areaKey] = key.split('|');
      const hasNamedArea = groupedItems.some((item) => item.region?.area || item.region?.district);

      return {
        id: key,
        province,
        city,
        area: hasNamedArea ? areaKey : buildWishlistAreaLabel(groupedItems, bounds),
        items: groupedItems.sort((left, right) => left.addedAt.localeCompare(right.addedAt)),
        categorySummary: summarizeWishlistCategories(groupedItems),
      };
    })
    .sort((left, right) => {
      if (right.items.length !== left.items.length) return right.items.length - left.items.length;
      return left.id.localeCompare(right.id);
    });
}

function inferProvinceCity([longitude, latitude]: WishlistItem['coordinate']) {
  if (longitude >= 118.0 && longitude <= 123.0 && latitude >= 29.0 && latitude <= 31.6) {
    return { province: '浙江', city: '杭州' };
  }

  if (longitude >= 120.8 && longitude <= 122.2 && latitude >= 30.6 && latitude <= 31.9) {
    return { province: '上海', city: '上海' };
  }

  if (longitude >= 118.8 && longitude <= 121.2 && latitude >= 31.0 && latitude <= 32.6) {
    return { province: '江苏', city: '苏州' };
  }

  return { province: '附近省份', city: '附近城市' };
}

function buildWishlistTileKey([longitude, latitude]: WishlistItem['coordinate']) {
  return `${Math.floor(longitude / 0.03)}:${Math.floor(latitude / 0.03)}`;
}

function buildWishlistAreaLabel(
  items: WishlistItem[],
  bounds: {
    minLongitude: number;
    maxLongitude: number;
    minLatitude: number;
    maxLatitude: number;
  },
) {
  if (items.length === 0) return '核心片区';

  const [sumLongitude, sumLatitude] = items.reduce(
    (acc, item) => [acc[0] + item.coordinate[0], acc[1] + item.coordinate[1]],
    [0, 0],
  );
  const centerLongitude = sumLongitude / items.length;
  const centerLatitude = sumLatitude / items.length;
  const longitudeSpan = bounds.maxLongitude - bounds.minLongitude;
  const latitudeSpan = bounds.maxLatitude - bounds.minLatitude;

  if (longitudeSpan < 0.02 && latitudeSpan < 0.02) {
    return '核心片区';
  }

  const horizontal =
    longitudeSpan < 0.02
      ? ''
      : centerLongitude < bounds.minLongitude + longitudeSpan / 3
        ? '西'
        : centerLongitude > bounds.maxLongitude - longitudeSpan / 3
          ? '东'
          : '';

  const vertical =
    latitudeSpan < 0.02
      ? ''
      : centerLatitude < bounds.minLatitude + latitudeSpan / 3
        ? '南'
        : centerLatitude > bounds.maxLatitude - latitudeSpan / 3
          ? '北'
          : '';

  if (!vertical && !horizontal) return '中片区';
  return `${vertical}${horizontal}片区`;
}

function summarizeWishlistCategories(items: WishlistItem[]) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      return left[0].localeCompare(right[0]);
    })
    .slice(0, 2)
    .map(([category, count]) => `${getSpotCategoryLabel(category as WishlistItem['category'])} ${count}`)
    .join(' / ');
}

/* ─── Styles ── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: spacing.lg,
  },
  accentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
  },
  accentBtnText: {
    color: palette.textOnAccent,
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },

  /* Mode tabs */
  modeTabs: {
    flexDirection: 'row',
    marginTop: spacing.md,
    backgroundColor: palette.bgWash,
    borderRadius: radius.md,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md - 2,
  },
  modeTabActive: {
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  modeTabLabel: {
    color: palette.textTertiary,
    fontSize: typography.subhead,
    fontWeight: fontWeight.medium,
  },
  modeTabLabelActive: {
    color: palette.textPrimary,
    fontWeight: fontWeight.semibold,
  },

  /* Empty */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bgWash,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: palette.textPrimary,
    fontSize: typography.title3,
    fontWeight: fontWeight.semibold,
  },
  emptyBody: {
    color: palette.textSecondary,
    fontSize: typography.subhead,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  textBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textBtnLabel: {
    color: palette.accent,
    fontSize: typography.body,
    fontWeight: fontWeight.semibold,
  },

  /* List */
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  groupIntro: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.bgWash,
  },
  groupIntroTitle: {
    color: palette.textPrimary,
    fontSize: typography.subhead,
    fontWeight: fontWeight.semibold,
  },
  groupIntroBody: {
    marginTop: spacing.xs,
    color: palette.textSecondary,
    fontSize: typography.footnote,
    lineHeight: 20,
  },
  groupCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  groupHeaderInfo: {
    flex: 1,
  },
  groupTitle: {
    color: palette.textPrimary,
    fontSize: typography.body,
    fontWeight: fontWeight.semibold,
  },
  groupMeta: {
    marginTop: 2,
    color: palette.textSecondary,
    fontSize: typography.footnote,
  },
  groupAction: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.accentSoft,
  },
  groupActionDisabled: {
    backgroundColor: palette.bgWash,
  },
  groupActionText: {
    color: palette.accent,
    fontSize: typography.caption,
    fontWeight: fontWeight.semibold,
  },
  groupActionTextDisabled: {
    color: palette.textTertiary,
  },
  groupItems: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  /* Wishlist card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.bg,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: palette.textPrimary,
    fontSize: typography.body,
    fontWeight: fontWeight.medium,
  },
  cardMeta: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
    marginTop: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Route builder */
  builderWrap: {
    flex: 1,
    marginTop: spacing.md,
  },
  routeNameInput: {
    fontSize: typography.body,
    fontWeight: fontWeight.semibold,
    color: palette.textPrimary,
    backgroundColor: palette.bgCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...cardShadow,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  themeChip: {
    minWidth: 58,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  themeChipActive: {
    backgroundColor: palette.accentSoft,
  },
  themeChipText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
    fontWeight: fontWeight.medium,
  },
  themeChipTextActive: {
    color: palette.accent,
  },
  builderEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  builderEmptyText: {
    color: palette.textTertiary,
    fontSize: typography.subhead,
    textAlign: 'center',
  },

  /* Route spot card */
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
  },
  timeline: {
    width: 36,
    alignItems: 'center',
  },
  timelineLineTop: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '50%',
    backgroundColor: palette.bgWash,
  },
  timelineLineBottom: {
    position: 'absolute',
    bottom: 0,
    width: 2,
    height: '50%',
    backgroundColor: palette.bgWash,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
    zIndex: 1,
  },
  timelineNum: {
    color: '#FFF',
    fontSize: typography.caption,
    fontWeight: fontWeight.bold,
  },
  routeCardBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  reorderBtns: {
    flexDirection: 'row',
  },

  /* Bottom */
  builderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  destructiveText: {
    color: palette.error,
    fontSize: typography.subhead,
    fontWeight: fontWeight.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
