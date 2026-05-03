import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { palette, radius, spacing, typography, fontWeight, cardShadow } from '../constants/theme';
import { getHeatBucketLabel, getSpotCategoryLabel } from '../lib/labels';
import type { SpotDetail, SpotPreview, WayReference } from '../lib/types';
import { TagBubble } from './ui/TagBubble';

interface SpotSheetProps {
  spot: SpotDetail | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  isCollected: boolean;
  isInDraft: boolean;
  onToggleWishlist: (spot: SpotPreview) => void;
  onAddToDraft: (spot: SpotPreview) => void;
}

const SNAP_POINTS = ['68%'];

export function SpotSheet({
  spot,
  isOpen,
  isLoading,
  onClose,
  isCollected,
  isInDraft,
  onToggleWishlist,
  onAddToDraft,
}: SpotSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveOwnerId(null);
  }, [spot?.id]);

  const contents = Array.isArray(spot?.contents) ? spot.contents : [];
  const relatedWays = Array.isArray(spot?.relatedWays) ? spot.relatedWays : [];
  const activeContent = contents[0] ?? null;
  const activeOwnerIdSafe = activeOwnerId ?? activeContent?.owner.id ?? null;
  const ownerContents = contents.filter((content) => content.owner.id === activeOwnerIdSafe);
  const activeOwner = ownerContents[0]?.owner ?? null;
  const ownerArchives = uniqueBy(ownerContents.map((content) => content.archive), (archive) => archive.id);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SNAP_POINTS}
      enablePanDownToClose
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      onClose={onClose}
      style={styles.sheet}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.accent} />
            <Text style={styles.loadingText}>正在加载点位内容…</Text>
          </View>
        ) : null}

        {spot ? (
          <>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{spot.name}</Text>
                <Text style={styles.category}>{getSpotCategoryLabel(spot.category)}</Text>
                <Text style={styles.subtitle}>
                  {contents.length} 条内容 · {relatedWays.length} 条相关路线
                </Text>
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  onPress={() =>
                    onToggleWishlist({
                      id: spot.id,
                      name: spot.name,
                      coordinate: spot.coordinate,
                      category: spot.category,
                    })
                  }
                  style={styles.iconBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name={isCollected ? 'heart' : 'heart-outline'}
                    size={22}
                    color={isCollected ? palette.heart : palette.textTertiary}
                  />
                </Pressable>
                <Pressable
                  onPress={() =>
                    onAddToDraft({
                      id: spot.id,
                      name: spot.name,
                      coordinate: spot.coordinate,
                      category: spot.category,
                    })
                  }
                  style={[styles.primaryBtn, isInDraft && styles.primaryBtnMuted]}
                >
                  <Ionicons
                    name={isInDraft ? 'checkmark-circle' : 'git-branch-outline'}
                    size={15}
                    color={palette.textOnAccent}
                  />
                  <Text style={styles.primaryBtnText}>{isInDraft ? '已在路线稿' : '加入路线稿'}</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.sectionLabel}>标签点评</Text>
            <View style={styles.tagWrap}>
              {spot.tags.map((tag) => (
                <TagBubble key={tag} label={tag} selected />
              ))}
            </View>

            <Text style={styles.sectionLabel}>地点照片</Text>
            <FlatList
              horizontal
              data={contents}
              keyExtractor={(item) => item.id}
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={314}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contentRail}
              renderItem={({ item }) => (
                <View style={styles.contentCard}>
                  <Pressable
                    onPress={() => setActiveOwnerId(item.owner.id)}
                    style={styles.ownerOverlay}
                  >
                    <Image source={{ uri: item.owner.avatarUrl }} style={styles.avatar} />
                    <View style={styles.ownerCopy}>
                      <Text style={styles.ownerNameLight}>{item.owner.displayName}</Text>
                      <Text style={styles.ownerMetaLight}>
                        {item.owner.homeBase} · {formatCapturedAt(item.capturedAt)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#FFF" />
                  </Pressable>

                  <Image source={{ uri: item.coverAssetUrl }} style={styles.contentImage} />

                  <View style={styles.locationOverlay}>
                    <Ionicons name="location" size={15} color="#FFF" />
                    <Text style={styles.locationOverlayText}>{spot.name}</Text>
                  </View>

                  <View style={styles.contentCaption}>
                    <Text style={styles.archiveTitle}>{item.archive.title}</Text>
                    <Text style={styles.archiveMeta}>
                      {item.archive.regionName} · {item.archive.stats.distanceKm.toFixed(1)} km
                    </Text>
                    <View style={styles.tagWrapCompact}>
                      {item.tags.slice(0, 3).map((tag) => (
                        <TagBubble key={`${item.id}-${tag}`} label={tag} selected />
                      ))}
                    </View>
                  </View>

                  <View style={styles.inlineActions}>
                    <Pressable
                      onPress={() =>
                        onToggleWishlist({
                          id: spot.id,
                          name: spot.name,
                          coordinate: spot.coordinate,
                          category: spot.category,
                        })
                      }
                      style={styles.inlineActionBtn}
                    >
                      <Ionicons
                        name={isCollected ? 'heart' : 'heart-outline'}
                        size={16}
                        color={isCollected ? palette.heart : palette.accent}
                      />
                      <Text style={styles.inlineActionText}>
                        {isCollected ? '已收进灵感池' : '收进灵感池'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        onAddToDraft({
                          id: spot.id,
                          name: spot.name,
                          coordinate: spot.coordinate,
                          category: spot.category,
                        })
                      }
                      style={styles.inlineActionBtn}
                    >
                      <Ionicons name="git-branch-outline" size={16} color={palette.accent} />
                      <Text style={styles.inlineActionText}>
                        {isInDraft ? '路线稿已包含' : '加入路线稿'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />

            {contents.length === 0 ? (
              <View style={styles.emptyContentState}>
                <Text style={styles.emptyContentTitle}>这个点位还没有内容卡</Text>
                <Text style={styles.emptyContentBody}>当前先保留标签和快速收藏，等内容数据接入后会显示 Spot 内容流。</Text>
              </View>
            ) : null}

            {activeOwner && ownerArchives.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>博主主页预览</Text>
                <View style={styles.profileCard}>
                  <View style={styles.profileHeader}>
                    <Image source={{ uri: activeOwner.avatarUrl }} style={styles.profileAvatar} />
                    <View style={styles.profileCopy}>
                      <Text style={styles.profileName}>{activeOwner.displayName}</Text>
                      <Text style={styles.profileBio}>{activeOwner.bio}</Text>
                      <Text style={styles.profileMeta}>
                        {activeOwner.homeBase} · {activeOwner.stats.archiveCount} 个档案 · {activeOwner.stats.photoCount} 张照片
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.profileSectionTitle}>这个博主在相关路线里还去过</Text>
                  {ownerArchives.map((archive) => (
                    <View key={archive.id} style={styles.archiveCard}>
                      <Text style={styles.archiveCardTitle}>{archive.title}</Text>
                      <Text style={styles.archiveCardMeta}>
                        {archive.regionName} · {archive.stats.spotCount} 个点位 · {archive.stats.photoCount} 张照片
                      </Text>
                      <View style={styles.stopList}>
                        {(archive.stops ?? []).map((stop) => (
                          <View key={`${archive.id}-${stop.id}`} style={styles.stopRow}>
                            <View style={styles.stopSequence}>
                              <Text style={styles.stopSequenceText}>{stop.sequence}</Text>
                            </View>
                            <View style={styles.stopCopy}>
                              <Text style={styles.stopName}>{stop.name}</Text>
                              <Text style={styles.stopMeta}>
                                {stop.region
                                  ? [stop.region.city, stop.region.area].filter(Boolean).join(' · ')
                                  : getSpotCategoryLabel(stop.category)}
                              </Text>
                            </View>
                            <Pressable
                              onPress={() => onToggleWishlist(stop)}
                              style={styles.stopIconBtn}
                              hitSlop={6}
                            >
                              <Ionicons name="heart-outline" size={18} color={palette.accent} />
                            </Pressable>
                            <Pressable
                              onPress={() => onAddToDraft(stop)}
                              style={styles.stopIconBtn}
                              hitSlop={6}
                            >
                              <Ionicons name="add-circle-outline" size={19} color={palette.accent} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}

                  <View style={styles.relatedWayWrap}>
                    {relatedWays.map((way) => (
                      <WayBadge key={way.id} way={way} />
                    ))}
                  </View>
                </View>
              </>
            ) : null}
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>先选一个点位</Text>
            <Text style={styles.emptyBody}>点击地图上的 Spot，这里会显示内容卡和博主主页预览。</Text>
          </View>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

function WayBadge({ way }: { way: WayReference }) {
  return (
    <View style={styles.wayBadge}>
      <Text style={styles.wayBadgeTitle}>{way.name}</Text>
      <Text style={styles.wayBadgeMeta}>{getHeatBucketLabel(way.heatBucket)}</Text>
    </View>
  );
}

function formatCapturedAt(value: string) {
  const date = new Date(value);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(getKey(item), item);
  });
  return Array.from(map.values());
}

const styles = StyleSheet.create({
  sheet: { ...cardShadow },
  background: { backgroundColor: palette.bgElevated, borderRadius: radius.xxl },
  handle: { width: 36, height: 5, backgroundColor: palette.bgInset, borderRadius: 3 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  loading: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  loadingText: { color: palette.textSecondary, fontSize: typography.subhead },
  header: { gap: spacing.md },
  headerCopy: { gap: 2 },
  title: { color: palette.textPrimary, fontSize: typography.title3, fontWeight: fontWeight.semibold },
  category: { color: palette.textSecondary, fontSize: typography.footnote },
  subtitle: { color: palette.textSecondary, fontSize: typography.subhead, marginTop: spacing.xs },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: palette.bgWash,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
  },
  primaryBtnMuted: {
    backgroundColor: palette.accentMuted,
  },
  primaryBtnText: {
    color: palette.textOnAccent,
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    color: palette.textSecondary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  contentRail: { paddingTop: spacing.sm, paddingRight: spacing.lg },
  emptyContentState: {
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: palette.bgCard,
    borderWidth: 1,
    borderColor: palette.bgWash,
  },
  emptyContentTitle: {
    color: palette.textPrimary,
    fontSize: typography.body,
    fontWeight: fontWeight.semibold,
  },
  emptyContentBody: {
    marginTop: spacing.xs,
    color: palette.textSecondary,
    fontSize: typography.footnote,
    lineHeight: 18,
  },
  contentCard: {
    position: 'relative',
    width: 300,
    marginRight: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: palette.bgCard,
    overflow: 'hidden',
    ...cardShadow,
  },
  contentImage: {
    width: '100%',
    aspectRatio: 0.92,
    backgroundColor: palette.bgWash,
  },
  ownerRow: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ownerOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28, 25, 23, 0.42)',
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.bgWash },
  ownerCopy: { flex: 1 },
  ownerName: { color: palette.textPrimary, fontSize: typography.subhead, fontWeight: fontWeight.semibold },
  ownerMeta: { marginTop: 2, color: palette.textSecondary, fontSize: typography.footnote },
  ownerNameLight: { color: '#FFF', fontSize: typography.subhead, fontWeight: fontWeight.semibold },
  ownerMetaLight: { marginTop: 2, color: 'rgba(255,255,255,0.78)', fontSize: typography.footnote },
  locationOverlay: {
    position: 'absolute',
    left: spacing.md,
    bottom: 126,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 240,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(28, 25, 23, 0.58)',
  },
  locationOverlayText: {
    color: '#FFF',
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },
  contentCaption: {
    padding: spacing.md,
  },
  archiveTitle: { color: palette.textPrimary, fontSize: typography.body, fontWeight: fontWeight.semibold },
  archiveMeta: { marginTop: 4, color: palette.textSecondary, fontSize: typography.footnote },
  tagWrapCompact: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  inlineActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  inlineActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: palette.bgWash,
  },
  inlineActionText: {
    color: palette.textPrimary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.medium,
  },
  profileCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  profileHeader: { flexDirection: 'row', gap: spacing.md },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.bgWash },
  profileCopy: { flex: 1 },
  profileName: { color: palette.textPrimary, fontSize: typography.body, fontWeight: fontWeight.semibold },
  profileBio: { marginTop: 4, color: palette.textSecondary, fontSize: typography.footnote, lineHeight: 18 },
  profileMeta: { marginTop: 6, color: palette.textTertiary, fontSize: typography.caption },
  profileSectionTitle: {
    marginTop: spacing.lg,
    color: palette.textPrimary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },
  archiveCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.bgWash,
  },
  archiveCardTitle: { color: palette.textPrimary, fontSize: typography.subhead, fontWeight: fontWeight.semibold },
  archiveCardMeta: { marginTop: 4, color: palette.textSecondary, fontSize: typography.footnote },
  stopList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: palette.bgCard,
  },
  stopSequence: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
  },
  stopSequenceText: {
    color: palette.accent,
    fontSize: typography.caption,
    fontWeight: fontWeight.semibold,
  },
  stopCopy: { flex: 1 },
  stopName: { color: palette.textPrimary, fontSize: typography.footnote, fontWeight: fontWeight.semibold },
  stopMeta: { marginTop: 2, color: palette.textSecondary, fontSize: typography.caption },
  stopIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: palette.accentSoft,
  },
  relatedWayWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  wayBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: palette.bgWash,
  },
  wayBadgeTitle: { color: palette.textPrimary, fontSize: typography.footnote, fontWeight: fontWeight.semibold },
  wayBadgeMeta: { marginTop: 2, color: palette.textSecondary, fontSize: typography.caption },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyTitle: { color: palette.textPrimary, fontSize: typography.title3, fontWeight: fontWeight.semibold },
  emptyBody: { marginTop: spacing.sm, color: palette.textSecondary, fontSize: typography.subhead, textAlign: 'center' },
});
