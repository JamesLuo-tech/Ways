import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageHeader } from '../../components/ui/PageHeader';
import { fontWeight, palette, radius, spacing, typography, cardShadow } from '../../constants/theme';
import { getTrackerStatusLabel } from '../../lib/labels';
import { useTrackerStore } from '../../lib/store/trackerStore';
import { TRACK_REVIEW_TAGS } from '../../lib/types';

function formatDuration(startedAt: string | null, endedAt: string | null, now: number) {
  if (!startedAt) return '00:00';
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : now;
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDistance(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function statusLabel(s: ReturnType<typeof useTrackerStore.getState>['status']) {
  return getTrackerStatusLabel(s);
}

function permLabel(v: ReturnType<typeof useTrackerStore.getState>['locationPermission']) {
  if (v === 'granted') return '已授权';
  if (v === 'denied') return '已拒绝';
  return '—';
}

export default function TrackerScreen() {
  const insets = useSafeAreaInsets();
  const tracker = useTrackerStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => { useTrackerStore.getState().initialize(); }, []);

  useEffect(() => {
    if (tracker.status !== 'recording') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [tracker.status]);

  const duration = formatDuration(tracker.startedAt, tracker.endedAt, now);
  const canImport = tracker.currentSessionId !== null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        eyebrow="轨迹记录"
        title="尽量别打断你在路上"
        subtitle="开始后持续采样，结束后导入照片，把地点和标签一起收进这段行程。"
        accessory={
          <View style={[
            styles.statusBadge,
            tracker.status === 'recording' && styles.statusBadgeRecording,
            tracker.status === 'error' && styles.statusBadgeError,
          ]}>
            <View style={[
              styles.statusDot,
              tracker.status === 'recording' && { backgroundColor: palette.success },
              tracker.status === 'error' && { backgroundColor: palette.error },
            ]} />
            <Text style={styles.statusText}>{statusLabel(tracker.status)}</Text>
          </View>
        }
      />

      <View style={styles.heroCard}>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetricItem}>
            <Text style={styles.heroValue}>{duration}</Text>
            <Text style={styles.heroLabel}>时长</Text>
          </View>
          <View style={styles.heroMetricItem}>
            <Text style={styles.heroValue}>{formatDistance(tracker.totalDistanceMeters)}</Text>
            <Text style={styles.heroLabel}>距离</Text>
          </View>
          <View style={styles.heroMetricItem}>
            <Text style={styles.heroValue}>{tracker.points.length}</Text>
            <Text style={styles.heroLabel}>采样点</Text>
          </View>
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>后台增强</Text>
            <Text style={styles.toggleBody}>
              {tracker.backgroundActive
                ? '后台记录已开启。'
                : tracker.backgroundBoostEnabled
                  ? '当前环境支持时会自动切到后台记录。'
                  : '仅在前台记录。'}
            </Text>
          </View>
          <Switch
            value={tracker.backgroundBoostEnabled}
            onValueChange={tracker.setBackgroundBoost}
            trackColor={{ false: palette.bgWash, true: 'rgba(10, 132, 255, 0.30)' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Pressable
          style={[styles.ctaBtn, tracker.status === 'recording' && styles.ctaBtnStop]}
          onPress={tracker.status === 'recording' ? tracker.stopRecording : tracker.startRecording}
        >
          <Ionicons
            name={tracker.status === 'recording' ? 'stop-circle' : 'play-circle'}
            size={20}
            color="#FFF"
          />
          <Text style={styles.ctaBtnText}>
            {tracker.status === 'recording' ? '结束记录' : '开始记录'}
          </Text>
        </Pressable>
      </View>

      {tracker.error ? (
        <View style={styles.errorCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorTitle}>记录提醒</Text>
            <Text style={styles.errorBody}>{tracker.error}</Text>
          </View>
          <Pressable onPress={tracker.clearError} hitSlop={8}>
            <Ionicons name="close" size={18} color={palette.error} />
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>本次记录</Text>
      <View style={styles.infoCard}>
        <InfoRow label="开始时间" value={formatDateTime(tracker.startedAt)} />
        <InfoRow label="结束时间" value={formatDateTime(tracker.endedAt)} />
        <InfoRow label="最近采样" value={formatDateTime(tracker.lastSampleAt)} />
        <InfoRow label="权限状态" value={`定位 ${permLabel(tracker.locationPermission)} / 后台 ${permLabel(tracker.backgroundPermission)}`} last />
      </View>

      <Text style={styles.sectionLabel}>照片聚类</Text>
      <View style={styles.photoSection}>
        <View style={styles.photoHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>EXIF 导入</Text>
            <Text style={styles.photoBody}>从相册多选带地理信息的照片。</Text>
          </View>
          <Pressable
            style={[styles.pillBtn, (!canImport || tracker.isImportingPhotos) && { opacity: 0.4 }]}
            onPress={tracker.importPhotos}
            disabled={!canImport || tracker.isImportingPhotos}
          >
            <Ionicons name="images-outline" size={15} color={palette.accent} />
            <Text style={styles.pillBtnText}>{tracker.isImportingPhotos ? '导入中…' : '导入照片'}</Text>
          </Pressable>
        </View>

        {tracker.importSummary ? (
          <View style={styles.importNote}>
            <Text style={styles.importNoteText}>
              已选择 {tracker.importSummary.selectedCount} 张，导入 {tracker.importSummary.importedCount} 张，跳过 {tracker.importSummary.skippedNoLocation} 张无坐标照片。
            </Text>
          </View>
        ) : null}

        {tracker.clusters.length === 0 ? (
          <View style={styles.emptyInline}>
            <Ionicons name="image-outline" size={28} color={palette.textTertiary} />
            <Text style={styles.emptyInlineText}>
              {canImport ? '导入照片后，这里会自动生成地点簇。' : '先开始一次记录，再回来导入照片。'}
            </Text>
          </View>
        ) : (
          tracker.clusters.map((c) => (
            <View key={c.id} style={styles.clusterCard}>
              <Image source={{ uri: c.coverUri }} style={styles.clusterImage} />
              <View style={styles.clusterCopy}>
                <View style={styles.clusterHeader}>
                  <Text style={styles.clusterTitle}>地点簇 {c.id.replace('cluster-', '#')}</Text>
                  <Text style={styles.clusterCount}>{c.photoCount} 张照片</Text>
                </View>
                <Text style={styles.clusterMeta}>
                  {formatDateTime(c.takenAtStart)}{c.takenAtEnd ? ` — ${formatDateTime(c.takenAtEnd)}` : ''}
                </Text>
                <View style={styles.tagWrap}>
                  {TRACK_REVIEW_TAGS.map((tag) => {
                    const active = c.tags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        onPress={() => tracker.toggleClusterTag(c.id, tag)}
                        style={[styles.tagChip, active && styles.tagChipActive]}
                      >
                        <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                          #{tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <Text style={styles.sectionLabel}>历史记录</Text>
      <View style={styles.infoCard}>
        {tracker.sessions.length === 0 ? (
          <View style={styles.emptyInline}>
            <Ionicons name="time-outline" size={28} color={palette.textTertiary} />
            <Text style={styles.emptyInlineText}>
              结束一次记录后，它会自动归档到这里。
            </Text>
          </View>
        ) : (
          tracker.sessions.map((s, idx) => (
            <View key={s.id} style={[styles.historyRow, idx < tracker.sessions.length - 1 && styles.historyRowBorder]}>
              <View style={styles.historyIcon}>
                <Ionicons name="trail-sign-outline" size={16} color={palette.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{formatDateTime(s.startedAt)}</Text>
                <Text style={styles.historyMeta}>
                  {formatDuration(s.startedAt, s.endedAt, now)} · {formatDistance(s.distanceMeters)} · {s.pointCount} 个采样点
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.md },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.pill, backgroundColor: palette.bgCard, ...cardShadow,
  },
  statusBadgeRecording: { backgroundColor: 'rgba(52, 199, 89, 0.08)' },
  statusBadgeError: { backgroundColor: 'rgba(255, 69, 58, 0.08)' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.textTertiary },
  statusText: { color: palette.textPrimary, fontSize: typography.footnote, fontWeight: fontWeight.medium },

  /* Hero */
  heroCard: { backgroundColor: palette.bgCard, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.lg, ...cardShadow },
  heroMetrics: { flexDirection: 'row' },
  heroMetricItem: { flex: 1, alignItems: 'center' },
  heroValue: { color: palette.textPrimary, fontSize: typography.title2, fontWeight: fontWeight.bold, fontVariant: ['tabular-nums'] },
  heroLabel: { marginTop: 2, color: palette.textSecondary, fontSize: typography.caption },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleTitle: { color: palette.textPrimary, fontSize: typography.body, fontWeight: fontWeight.medium },
  toggleBody: { marginTop: 2, color: palette.textSecondary, fontSize: typography.footnote, lineHeight: 18 },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: 14, borderRadius: radius.md, backgroundColor: palette.accent,
  },
  ctaBtnStop: { backgroundColor: palette.error },
  ctaBtnText: { color: '#FFF', fontSize: typography.body, fontWeight: fontWeight.semibold },

  /* Error */
  errorCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: 'rgba(255, 69, 58, 0.06)' },
  errorTitle: { color: palette.error, fontSize: typography.subhead, fontWeight: fontWeight.semibold },
  errorBody: { marginTop: 2, color: palette.textSecondary, fontSize: typography.footnote, lineHeight: 18 },

  /* Section */
  sectionLabel: { marginTop: spacing.sm, color: palette.textSecondary, fontSize: typography.footnote, fontWeight: fontWeight.semibold, letterSpacing: 0.3 },

  /* Info card — grouped table */
  infoCard: { backgroundColor: palette.bgCard, borderRadius: radius.lg, overflow: 'hidden', ...cardShadow },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 14 },
  infoRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.separator },
  infoLabel: { color: palette.textPrimary, fontSize: typography.body },
  infoValue: { color: palette.textSecondary, fontSize: typography.body, textAlign: 'right', flexShrink: 1 },

  /* Photo section */
  photoSection: { backgroundColor: palette.bgCard, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, ...cardShadow },
  photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  photoTitle: { color: palette.textPrimary, fontSize: typography.body, fontWeight: fontWeight.semibold },
  photoBody: { marginTop: 2, color: palette.textSecondary, fontSize: typography.footnote },
  pillBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, backgroundColor: palette.accentSoft,
  },
  pillBtnText: { color: palette.accent, fontSize: typography.subhead, fontWeight: fontWeight.medium },
  importNote: { padding: spacing.md, borderRadius: radius.sm, backgroundColor: palette.bgWash },
  importNoteText: { color: palette.textSecondary, fontSize: typography.footnote, lineHeight: 18 },

  emptyInline: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyInlineText: { color: palette.textSecondary, fontSize: typography.subhead, textAlign: 'center', maxWidth: 260, lineHeight: 22 },

  clusterCard: { overflow: 'hidden', borderRadius: radius.md, backgroundColor: palette.bgWash },
  clusterImage: { width: '100%', height: 180, backgroundColor: palette.bgInset },
  clusterCopy: { padding: spacing.md, gap: spacing.sm },
  clusterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clusterTitle: { color: palette.textPrimary, fontSize: typography.body, fontWeight: fontWeight.semibold },
  clusterCount: { color: palette.accent, fontSize: typography.footnote, fontWeight: fontWeight.medium },
  clusterMeta: { color: palette.textSecondary, fontSize: typography.footnote },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: palette.bgCard },
  tagChipActive: { backgroundColor: palette.accent },
  tagChipText: { color: palette.textSecondary, fontSize: typography.footnote, fontWeight: fontWeight.medium },
  tagChipTextActive: { color: '#FFF' },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 14 },
  historyRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.separator },
  historyIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accentSoft },
  historyTitle: { color: palette.textPrimary, fontSize: typography.body },
  historyMeta: { marginTop: 2, color: palette.textSecondary, fontSize: typography.footnote, lineHeight: 18 },
});
