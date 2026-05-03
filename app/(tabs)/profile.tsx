import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardShadow, fontWeight, palette, radius, spacing, typography } from '../../constants/theme';
import { useTrackerStore } from '../../lib/store/trackerStore';
import type { Coordinate, FootprintJourney, TrackSession, WayTheme } from '../../lib/types';

type ProfileMode = 'archive' | 'timeline' | 'poster';

const PROFILE_META = {
  displayName: 'YI 的旅行档案',
  handle: 'ways.id/travel-archive',
  bio: '把周末短途、清晨咖啡线和慢节奏风景点，整理成能反复翻看的旅行档案。',
  homeBase: '杭州',
  tags: ['咖啡路线', '周末短途', '轻徒步', '机位收集'],
};

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ProfileMode>('archive');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

  const sessions = useTrackerStore((state) => state.sessions);
  const importPhotosAsArchive = useTrackerStore((state) => state.importPhotosAsArchive);
  const isImportingPhotos = useTrackerStore((state) => state.isImportingPhotos);
  const importSummary = useTrackerStore((state) => state.importSummary);
  const trackerError = useTrackerStore((state) => state.error);
  const journeys = useMemo(() => sessions.map(buildJourney), [sessions]);
  const selectedJourney = journeys.find((journey) => journey.id === selectedJourneyId) ?? journeys[0] ?? null;
  const columns = useMemo(() => splitIntoColumns(journeys), [journeys]);

  const totals = useMemo(() => {
    return {
      distanceKm: journeys.reduce((sum, journey) => sum + journey.distanceKm, 0),
      spotCount: journeys.reduce((sum, journey) => sum + journey.spotCount, 0),
      photoCount: journeys.reduce((sum, journey) => sum + journey.photoCount, 0),
    };
  }, [journeys]);

  const handleOpenPoster = (journeyId: string) => {
    setSelectedJourneyId(journeyId);
    setMode('poster');
  };

  const handleSharePoster = async () => {
    if (!selectedJourney) {
      Alert.alert('还没有档案', '先完成一次记录，再生成这里的海报。');
      return;
    }

    await Share.share({
      title: selectedJourney.title,
      message: buildShareCopy(selectedJourney),
    });
  };

  const handleShareProfile = async () => {
    await Share.share({
      title: PROFILE_META.displayName,
      message: [
        `${PROFILE_META.displayName}`,
        PROFILE_META.bio,
        `${journeys.length} 条旅行档案 / ${Math.round(totals.distanceKm)} km / ${totals.photoCount} 张照片`,
      ].join('\n'),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileHero}>
        <LinearGradient
          colors={['#FFF8F1', '#F7F1EB', '#FAF9F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />

        <View style={styles.heroTopRow}>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={['#C08457', '#E7C7A9', '#F6E7D5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarInitial}>Y</Text>
            </LinearGradient>
          </View>

          <View style={styles.heroActions}>
            <Pressable
              style={[styles.ghostButton, isImportingPhotos && styles.ghostButtonDisabled]}
              onPress={importPhotosAsArchive}
              disabled={isImportingPhotos}
            >
              <Ionicons name="images-outline" size={16} color={palette.textPrimary} />
              <Text style={styles.ghostButtonText}>{isImportingPhotos ? '导入中' : '导入照片'}</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => Alert.alert('资料编辑', '资料编辑页下一步再接。')}>
              <Ionicons name="create-outline" size={16} color={palette.textPrimary} />
              <Text style={styles.ghostButtonText}>编辑资料</Text>
            </Pressable>
            <Pressable style={styles.iconCircle} onPress={handleShareProfile}>
              <Ionicons name="share-social-outline" size={18} color={palette.textPrimary} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.profileName}>{PROFILE_META.displayName}</Text>
        <Text style={styles.profileHandle}>{PROFILE_META.handle}</Text>
        <Text style={styles.profileBio}>{PROFILE_META.bio}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="location-outline" size={14} color={palette.textSecondary} />
            <Text style={styles.metaPillText}>{PROFILE_META.homeBase}</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="albums-outline" size={14} color={palette.textSecondary} />
            <Text style={styles.metaPillText}>{journeys.length} 条档案</Text>
          </View>
        </View>

        <View style={styles.statsPanel}>
          <ProfileStat value={String(journeys.length)} label="档案" />
          <ProfileStat value={`${Math.round(totals.distanceKm)}`} label="公里" />
          <ProfileStat value={String(totals.spotCount)} label="地点簇" />
          <ProfileStat value={String(totals.photoCount)} label="照片" />
        </View>

        <View style={styles.profileTags}>
          {PROFILE_META.tags.map((tag) => (
            <View key={tag} style={styles.profileTag}>
              <Text style={styles.profileTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {importSummary || trackerError ? (
        <View style={styles.importBanner}>
          <Ionicons
            name={trackerError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={18}
            color={trackerError ? palette.error : palette.success}
          />
          <Text style={styles.importBannerText}>
            {trackerError
              ? trackerError
              : `已从照片生成档案草稿：导入 ${importSummary?.importedCount ?? 0} 张，跳过 ${importSummary?.skippedNoLocation ?? 0} 张无坐标照片。`}
          </Text>
        </View>
      ) : null}

      <View style={styles.modeTabs}>
        <ModeTab label="档案墙" icon="grid-outline" active={mode === 'archive'} onPress={() => setMode('archive')} />
        <ModeTab label="时间轴" icon="time-outline" active={mode === 'timeline'} onPress={() => setMode('timeline')} />
        <ModeTab label="海报" icon="image-outline" active={mode === 'poster'} onPress={() => setMode('poster')} />
      </View>

      {journeys.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="albums-outline" size={32} color={palette.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>还没有旅行档案</Text>
          <Text style={styles.emptyBody}>先完成一段记录，这里会像主页一样慢慢长出你的档案墙。</Text>
        </View>
      ) : null}

      {mode === 'archive' ? (
        <View style={styles.wall}>
          {columns.map((column, columnIndex) => (
            <View key={`column-${columnIndex}`} style={styles.wallColumn}>
              {column.map((journey, cardIndex) => (
                <ArchiveCard
                  key={journey.id}
                  journey={journey}
                  onPress={() => handleOpenPoster(journey.id)}
                  compact={(columnIndex + cardIndex) % 3 === 1}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {mode === 'timeline' ? (
        <View style={styles.timelineWrap}>
          {journeys.map((journey) => (
            <TimelineCard key={journey.id} journey={journey} onPoster={() => handleOpenPoster(journey.id)} />
          ))}
        </View>
      ) : null}

      {mode === 'poster' && selectedJourney ? (
        <View style={styles.posterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.posterPicker}
          >
            {journeys.map((journey) => {
              const active = journey.id === selectedJourney.id;
              return (
                <Pressable
                  key={journey.id}
                  onPress={() => setSelectedJourneyId(journey.id)}
                  style={[styles.posterChip, active && styles.posterChipActive]}
                >
                  <Text style={[styles.posterChipText, active && styles.posterChipTextActive]}>
                    {journey.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <PosterCard journey={selectedJourney} />

          <Pressable onPress={handleSharePoster} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={18} color={palette.accent} />
            <Text style={styles.shareBtnText}>分享这条档案</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function ProfileStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ModeTab({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.modeTab, active && styles.modeTabActive]}>
      <Ionicons name={icon} size={16} color={active ? palette.textPrimary : palette.textTertiary} />
      <Text style={[styles.modeTabLabel, active && styles.modeTabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function ArchiveCard({
  journey,
  onPress,
  compact,
}: {
  journey: FootprintJourney;
  onPress: () => void;
  compact: boolean;
}) {
  const cover = themeGradient(journey.theme);
  const routeColor = themeColor(journey.theme);

  return (
    <Pressable onPress={onPress} style={styles.archiveCard}>
      <LinearGradient
        colors={cover}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.archiveCover, compact && styles.archiveCoverCompact]}
      >
        <View style={styles.archiveCoverTop}>
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>
              {journey.archiveStatus === 'draft' ? '草稿' : journey.heroMetric}
            </Text>
          </View>
        </View>
        <View style={styles.archivePreviewWrap}>
          <RoutePreview points={journey.routePreview} color={routeColor} width={compact ? 120 : 144} height={compact ? 84 : 96} />
        </View>
      </LinearGradient>

      <View style={styles.archiveBody}>
        <Text style={styles.archiveTitle} numberOfLines={2}>
          {journey.title}
        </Text>
        <Text style={styles.archiveRegion}>{journey.region}</Text>
        <Text style={styles.archiveDate}>{formatDateRange(journey.startedAt, journey.endedAt)}</Text>

        <View style={styles.archiveMetaRow}>
          <Text style={styles.archiveMetaText}>{journey.distanceKm.toFixed(1)} km</Text>
          <Text style={styles.archiveMetaDot}>·</Text>
          <Text style={styles.archiveMetaText}>{journey.photoCount} 张照片</Text>
          {journey.sourceType === 'photo_import' ? (
            <>
              <Text style={styles.archiveMetaDot}>·</Text>
              <Text style={styles.archiveMetaText}>照片导入</Text>
            </>
          ) : null}
        </View>

        <View style={styles.archiveTags}>
          {journey.tags.slice(0, compact ? 2 : 3).map((tag) => (
            <View key={tag} style={styles.archiveTag}>
              <Text style={styles.archiveTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

function TimelineCard({ journey, onPoster }: { journey: FootprintJourney; onPoster: () => void }) {
  const color = themeColor(journey.theme);

  return (
    <View style={styles.timelineCard}>
      <View style={styles.timelineTop}>
        <View style={styles.timelineDateBadge}>
          <Text style={styles.timelineDateBadgeText}>{formatShortDate(journey.startedAt)}</Text>
        </View>
        <Pressable onPress={onPoster} style={styles.timelinePosterButton}>
          <Ionicons name="image-outline" size={15} color={palette.accent} />
          <Text style={styles.timelinePosterButtonText}>海报</Text>
        </Pressable>
      </View>

      <Text style={styles.timelineTitle}>{journey.title}</Text>
      <Text style={styles.timelineRegion}>{journey.region}</Text>

      <View style={styles.timelineBody}>
        <RoutePreview points={journey.routePreview} color={color} width={148} height={92} />
        <View style={styles.timelineMetrics}>
          <MetricRow label="距离" value={`${journey.distanceKm.toFixed(1)} km`} />
          <MetricRow label="时长" value={`${journey.durationHours.toFixed(1)} 小时`} />
          <MetricRow label="地点簇" value={String(journey.spotCount)} />
          <MetricRow label="照片" value={String(journey.photoCount)} />
        </View>
      </View>

      <View style={styles.timelineTagRow}>
        {journey.tags.map((tag) => (
          <View key={tag} style={styles.timelineTag}>
            <Text style={styles.timelineTagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PosterCard({ journey }: { journey: FootprintJourney }) {
  const color = themeColor(journey.theme);

  return (
    <View style={styles.posterCard}>
      <LinearGradient
        colors={['#1C1917', '#292524', '#44403C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Text style={styles.posterEyebrow}>WAYS TRAVEL ARCHIVE</Text>
      <Text style={styles.posterTitle}>{journey.title}</Text>
      <Text style={styles.posterRegion}>{journey.region}</Text>

      <View style={styles.posterPreview}>
        <RoutePreview points={journey.routePreview} color={color} width={250} height={116} poster />
      </View>

      <View style={styles.posterMetrics}>
        <PosterMetric label="距离" value={`${journey.distanceKm.toFixed(1)} km`} />
        <PosterMetric label="时长" value={`${journey.durationHours.toFixed(1)} 小时`} />
        <PosterMetric label="地点簇" value={String(journey.spotCount)} />
        <PosterMetric label="照片" value={String(journey.photoCount)} />
      </View>

      <View style={styles.posterTags}>
        {journey.tags.map((tag) => (
          <View key={tag} style={styles.posterTagChip}>
            <Text style={styles.posterTagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function PosterMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.posterMetricItem}>
      <Text style={styles.posterMetricValue}>{value}</Text>
      <Text style={styles.posterMetricLabel}>{label}</Text>
    </View>
  );
}

function RoutePreview({
  points,
  color,
  width,
  height,
  poster = false,
}: {
  points: Coordinate[];
  color: string;
  width: number;
  height: number;
  poster?: boolean;
}) {
  const normalized = normalizeRoute(points, width, height);

  return (
    <View style={[styles.previewCanvas, { width, height }, poster && styles.previewPoster]}>
      {normalized.slice(0, -1).map((point, index) => {
        const next = normalized[index + 1];
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        return (
          <View
            key={`segment-${index}`}
            style={[
              styles.previewSeg,
              {
                left: (point.x + next.x) / 2 - length / 2,
                top: (point.y + next.y) / 2 - 1.25,
                width: length,
                backgroundColor: color,
                opacity: poster ? 0.85 : 0.7,
                transform: [{ rotateZ: `${angle}rad` }],
              },
            ]}
          />
        );
      })}

      {normalized.map((point, index) => {
        const endpoint = index === 0 || index === normalized.length - 1;
        const size = endpoint ? 8 : 5;

        return (
          <View
            key={`point-${index}`}
            style={[
              styles.previewDot,
              {
                left: point.x - size / 2,
                top: point.y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function splitIntoColumns(items: FootprintJourney[]) {
  const left: FootprintJourney[] = [];
  const right: FootprintJourney[] = [];

  items.forEach((item, index) => {
    if (index % 2 === 0) {
      left.push(item);
    } else {
      right.push(item);
    }
  });

  return [left, right];
}

function normalizeRoute(points: Coordinate[], width: number, height: number) {
  const safe = points.length > 1 ? points : [[0, 0], [1, 1]];
  const lngs = safe.map((point) => point[0]);
  const lats = safe.map((point) => point[1]);
  const pad = 12;
  const spanLng = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.0001);
  const spanLat = Math.max(Math.max(...lats) - Math.min(...lats), 0.0001);
  const minLng = Math.min(...lngs);
  const minLat = Math.min(...lats);

  return safe.map(([lng, lat]) => ({
    x: pad + ((lng - minLng) / spanLng) * (width - pad * 2),
    y: height - pad - ((lat - minLat) / spanLat) * (height - pad * 2),
  }));
}

function buildJourney(session: TrackSession): FootprintJourney {
  const startedAt = new Date(session.startedAt);
  const durationHours = Math.max(
    0,
    (new Date(session.endedAt).getTime() - startedAt.getTime()) / 3600000,
  );

  return {
    id: session.id,
    title: inferJourneyTitle(session, startedAt),
    theme: inferJourneyTheme(session),
    region: inferJourneyRegion(session),
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    sourceType: session.sourceType,
    archiveStatus: session.archiveStatus,
    distanceKm: session.distanceMeters / 1000,
    durationHours,
    spotCount: session.clusterCount,
    photoCount: session.photoCount,
    tags: session.tags.length > 0 ? session.tags : ['待补标签'],
    routePreview: sampleRoutePreview(session.routePreview),
    heroMetric: session.clusterCount > 0 ? `${session.clusterCount} 个地点簇` : `${session.pointCount} 个采样点`,
  };
}

function inferJourneyTheme(session: TrackSession): WayTheme {
  if (session.id.includes('coffee') || session.id.includes('westlake')) return 'coffee';
  if (session.id.includes('brew') || session.id.includes('wine')) return 'wine';
  if (session.id.includes('ancient')) return 'ancient-town';
  if (session.id.includes('cycling')) return 'cycling';
  if (session.id.includes('camp')) return 'hiking';
  return 'custom';
}

function inferJourneyTitle(session: TrackSession, startedAt: Date) {
  if (session.id.includes('westlake')) return '西湖清晨咖啡档案';
  if (session.id.includes('brew')) return '莫干山精酿慢爬档案';
  if (session.id.includes('ancient')) return '古镇慢晃茶点档案';
  if (session.id.includes('cycling')) return '钱塘江傍晚骑行档案';
  if (session.id.includes('camp')) return '富阳山野轻露营档案';
  return `${MONTH_LABELS[startedAt.getUTCMonth()]}${startedAt.getUTCDate()}日路线档案`;
}

function inferJourneyRegion(session: TrackSession) {
  if (session.id.includes('westlake')) return '杭州 · 西湖';
  if (session.id.includes('brew')) return '德清 · 莫干山';
  if (session.id.includes('ancient')) return '嘉兴 · 乌镇片区';
  if (session.id.includes('cycling')) return '杭州 · 钱塘江边';
  if (session.id.includes('camp')) return '杭州 · 富阳山谷';

  if (session.centroid) {
    return `${session.centroid[1].toFixed(3)}, ${session.centroid[0].toFixed(3)}`;
  }

  return '位置待补全';
}

function sampleRoutePreview(points: Coordinate[], limit = 14) {
  if (points.length <= limit) return points;

  return Array.from({ length: limit }, (_, index) => {
    const targetIndex = Math.round((index / (limit - 1)) * (points.length - 1));
    return points[targetIndex];
  });
}

function themeColor(theme: WayTheme) {
  switch (theme) {
    case 'hiking':
      return '#2D6A4F';
    case 'wine':
      return '#9B2C2C';
    case 'coffee':
      return '#92400E';
    case 'ancient-town':
      return '#78716C';
    case 'cycling':
      return '#0A84FF';
    default:
      return '#D97706';
  }
}

function themeGradient(theme: WayTheme): [string, string, string] {
  switch (theme) {
    case 'hiking':
      return ['#DDEEDF', '#F2F7F0', '#FFFDF8'];
    case 'wine':
      return ['#F1D7D7', '#F8ECE6', '#FFFCF8'];
    case 'coffee':
      return ['#EFDCCB', '#F7EFE7', '#FFFCF8'];
    case 'ancient-town':
      return ['#E8E2DA', '#F4F0EA', '#FFFCF8'];
    case 'cycling':
      return ['#D9ECFF', '#F0F7FF', '#FFFCF8'];
    default:
      return ['#F6E6CF', '#FBF4EA', '#FFFCF8'];
  }
}

function formatDateRange(startedAt: string, endedAt: string) {
  const start = new Date(startedAt);
  const end = new Date(endedAt);

  return `${MONTH_LABELS[start.getUTCMonth()]} ${start.getUTCDate()} - ${MONTH_LABELS[end.getUTCMonth()]} ${end.getUTCDate()}`;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  return `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCDate()}日`;
}

function buildShareCopy(journey: FootprintJourney) {
  return [
    'Ways 旅行档案',
    `${journey.title} · ${journey.region}`,
    `${journey.distanceKm.toFixed(1)} km / ${journey.durationHours.toFixed(1)} 小时 / ${journey.spotCount} 个地点簇 / ${journey.photoCount} 张照片`,
    `亮点标签：${journey.tags.join(' · ')}`,
  ].join('\n');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },

  profileHero: {
    position: 'relative',
    overflow: 'hidden',
    padding: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    padding: 4,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#6B4F3A',
    fontSize: 28,
    fontWeight: fontWeight.bold,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.84)',
  },
  ghostButtonDisabled: {
    opacity: 0.58,
  },
  ghostButtonText: {
    color: palette.textPrimary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.84)',
  },
  profileName: {
    marginTop: spacing.md,
    color: palette.textPrimary,
    fontSize: typography.title1,
    fontWeight: fontWeight.bold,
  },
  profileHandle: {
    marginTop: 4,
    color: palette.textSecondary,
    fontSize: typography.footnote,
  },
  profileBio: {
    marginTop: spacing.sm,
    color: palette.textPrimary,
    fontSize: typography.subhead,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  metaPillText: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.medium,
  },
  statsPanel: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: palette.textPrimary,
    fontSize: typography.title2,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    marginTop: 2,
    color: palette.textSecondary,
    fontSize: typography.caption,
  },
  profileTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  profileTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: palette.bgWash,
  },
  profileTagText: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.medium,
  },

  modeTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  importBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  importBannerText: {
    flex: 1,
    color: palette.textSecondary,
    fontSize: typography.footnote,
    lineHeight: 18,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: palette.bgWash,
  },
  modeTabActive: {
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  modeTabLabel: {
    color: palette.textTertiary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.medium,
  },
  modeTabLabelActive: {
    color: palette.textPrimary,
    fontWeight: fontWeight.semibold,
  },

  wall: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  wallColumn: {
    flex: 1,
    gap: spacing.md,
  },
  archiveCard: {
    borderRadius: radius.xl,
    backgroundColor: palette.bgCard,
    overflow: 'hidden',
    ...cardShadow,
  },
  archiveCover: {
    minHeight: 176,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  archiveCoverCompact: {
    minHeight: 148,
  },
  archiveCoverTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  coverBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  coverBadgeText: {
    color: palette.textPrimary,
    fontSize: typography.caption,
    fontWeight: fontWeight.semibold,
  },
  archivePreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveBody: {
    padding: spacing.md,
  },
  archiveTitle: {
    color: palette.textPrimary,
    fontSize: typography.body,
    fontWeight: fontWeight.semibold,
    lineHeight: 22,
  },
  archiveRegion: {
    marginTop: 6,
    color: palette.textSecondary,
    fontSize: typography.footnote,
  },
  archiveDate: {
    marginTop: 4,
    color: palette.textTertiary,
    fontSize: typography.caption,
  },
  archiveMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  archiveMetaText: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
  },
  archiveMetaDot: {
    marginHorizontal: 6,
    color: palette.textTertiary,
    fontSize: typography.footnote,
  },
  archiveTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  archiveTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: palette.bgWash,
  },
  archiveTagText: {
    color: palette.textSecondary,
    fontSize: typography.caption,
  },

  timelineWrap: {
    gap: spacing.md,
  },
  timelineCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: palette.bgCard,
    gap: spacing.sm,
    ...cardShadow,
  },
  timelineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineDateBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: palette.bgWash,
  },
  timelineDateBadgeText: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.medium,
  },
  timelinePosterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelinePosterButtonText: {
    color: palette.accent,
    fontSize: typography.footnote,
    fontWeight: fontWeight.semibold,
  },
  timelineTitle: {
    color: palette.textPrimary,
    fontSize: typography.title3,
    fontWeight: fontWeight.semibold,
  },
  timelineRegion: {
    color: palette.textSecondary,
    fontSize: typography.subhead,
  },
  timelineBody: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  timelineMetrics: {
    flex: 1,
    gap: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
  },
  metricValue: {
    color: palette.textPrimary,
    fontSize: typography.subhead,
    fontWeight: fontWeight.medium,
    fontVariant: ['tabular-nums'],
  },
  timelineTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  timelineTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.bgWash,
  },
  timelineTagText: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
  },

  posterSection: {
    gap: spacing.md,
  },
  posterPicker: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  posterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.bgWash,
  },
  posterChipActive: {
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  posterChipText: {
    color: palette.textSecondary,
    fontSize: typography.footnote,
    fontWeight: fontWeight.medium,
  },
  posterChipTextActive: {
    color: palette.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  posterCard: {
    overflow: 'hidden',
    position: 'relative',
    padding: spacing.xl,
    borderRadius: radius.xxl,
    minHeight: 470,
  },
  posterEyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: typography.caption,
    letterSpacing: 1.2,
  },
  posterTitle: {
    marginTop: spacing.md,
    color: '#FFFFFF',
    fontSize: typography.title1,
    fontWeight: fontWeight.bold,
    lineHeight: 34,
  },
  posterRegion: {
    marginTop: spacing.xs,
    color: 'rgba(255,255,255,0.74)',
    fontSize: typography.subhead,
  },
  posterPreview: {
    marginTop: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  posterMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  posterMetricItem: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  posterMetricValue: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: fontWeight.semibold,
  },
  posterMetricLabel: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.62)',
    fontSize: typography.caption,
  },
  posterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  posterTagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  posterTagText: {
    color: '#FFFFFF',
    fontSize: typography.footnote,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: palette.bgCard,
    ...cardShadow,
  },
  shareBtnText: {
    color: palette.accent,
    fontSize: typography.subhead,
    fontWeight: fontWeight.semibold,
  },

  previewCanvas: {
    position: 'relative',
  },
  previewPoster: {
    opacity: 0.95,
  },
  previewSeg: {
    position: 'absolute',
    height: 2.5,
    borderRadius: 999,
  },
  previewDot: {
    position: 'absolute',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bgWash,
  },
  emptyTitle: {
    color: palette.textPrimary,
    fontSize: typography.title3,
    fontWeight: fontWeight.semibold,
  },
  emptyBody: {
    maxWidth: 280,
    color: palette.textSecondary,
    fontSize: typography.subhead,
    textAlign: 'center',
    lineHeight: 22,
  },
});
