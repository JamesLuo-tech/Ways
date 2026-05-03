import { create } from 'zustand';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { mockTrackSessions } from '../mock-data';
import {
  TRACKER_LOCATION_TASK,
  buildPhotoInputs,
  buildTrackSession,
  clusterPhotos,
  dedupePhotos,
  mergeTrackPoints,
  preserveClusterTags,
  accumulateDistance,
} from '../tracker';
import type {
  PermissionState,
  PhotoCluster,
  PhotoImportSummary,
  TrackPhotoInput,
  TrackPoint,
  TrackerStatus,
  TrackReviewTag,
  TrackSession,
} from '../types';

interface TrackerState {
  status: TrackerStatus;
  error: string | null;
  currentSessionId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  totalDistanceMeters: number;
  points: TrackPoint[];
  lastSampleAt: string | null;
  photos: TrackPhotoInput[];
  clusters: PhotoCluster[];
  importSummary: PhotoImportSummary | null;
  sessions: TrackSession[];
  isImportingPhotos: boolean;
  locationPermission: PermissionState;
  backgroundPermission: PermissionState;
  mediaPermission: PermissionState;
  backgroundBoostEnabled: boolean;
  backgroundActive: boolean;
  initialize: () => Promise<void>;
  clearError: () => void;
  setBackgroundBoost: (enabled: boolean) => Promise<void>;
  appendLocations: (locations: Location.LocationObject[]) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  importPhotos: () => Promise<void>;
  importPhotosAsArchive: () => Promise<void>;
  toggleClusterTag: (clusterId: string, tag: TrackReviewTag) => void;
}

let foregroundSubscription: Location.LocationSubscription | null = null;

async function clearForegroundSubscription() {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }
}

async function clearBackgroundUpdates() {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(TRACKER_LOCATION_TASK);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(TRACKER_LOCATION_TASK);
    }
  } catch {
    // Ignore unsupported environments and teardown races.
  }
}

function syncSessionSnapshot(
  sessions: TrackSession[],
  currentSessionId: string | null,
  payload: Partial<TrackSession>,
) {
  if (!currentSessionId) return sessions;

  return sessions.map((session) =>
    session.id === currentSessionId ? { ...session, ...payload } : session,
  );
}

function normalizePhotoDate(value: string | null) {
  if (!value) return null;

  const normalized = value.replace(
    /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/,
    '$1-$2-$3T$4:$5:$6',
  );
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function inferPhotoArchiveRange(clusters: PhotoCluster[]) {
  const dates = clusters
    .flatMap((cluster) => [cluster.takenAtStart, cluster.takenAtEnd])
    .map(normalizePhotoDate)
    .filter((value): value is string => Boolean(value))
    .sort();
  const fallback = new Date().toISOString();

  return {
    startedAt: dates[0] ?? fallback,
    endedAt: dates.at(-1) ?? dates[0] ?? fallback,
  };
}

async function maybeEnableBackgroundTracking() {
  const state = useTrackerStore.getState();

  if (state.status !== 'recording' || !state.backgroundBoostEnabled) {
    await clearBackgroundUpdates();
    useTrackerStore.setState({ backgroundActive: false });
    return;
  }

  try {
    const isAvailable = await Location.isBackgroundLocationAvailableAsync();

    if (!isAvailable) {
      useTrackerStore.setState({
        backgroundPermission: 'denied',
        backgroundActive: false,
        error: '当前运行环境不支持后台记录，将继续使用前台记录。',
      });
      return;
    }

    const response = await Location.requestBackgroundPermissionsAsync();
    const backgroundPermission = response.status === 'granted' ? 'granted' : 'denied';

    useTrackerStore.setState({ backgroundPermission });

    if (backgroundPermission !== 'granted') {
      useTrackerStore.setState({
        backgroundActive: false,
        error: '后台定位权限被拒绝，将继续使用前台记录。',
      });
      return;
    }

    await Location.startLocationUpdatesAsync(TRACKER_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 20,
      deferredUpdatesDistance: 50,
      deferredUpdatesInterval: 30000,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.Fitness,
      foregroundService: {
        notificationTitle: 'Ways 正在记录这段路线',
        notificationBody: '当前旅程已启用后台定位记录。',
      },
    });

    useTrackerStore.setState({ backgroundActive: true });
  } catch (error) {
    useTrackerStore.setState({
      backgroundActive: false,
      error:
        error instanceof Error
          ? error.message
          : '开启后台记录失败，将继续使用前台记录。',
    });
  }
}

if (!TaskManager.isTaskDefined(TRACKER_LOCATION_TASK)) {
  TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(
    TRACKER_LOCATION_TASK,
    async ({ data, error }) => {
      if (error) {
        useTrackerStore.setState({
          error: error.message,
          status: 'error',
          backgroundActive: false,
        });
        return;
      }

      const locations = data?.locations ?? [];
      if (locations.length > 0) {
        useTrackerStore.getState().appendLocations(locations);
      }
    },
  );
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  status: 'idle',
  error: null,
  currentSessionId: null,
  startedAt: null,
  endedAt: null,
  totalDistanceMeters: 0,
  points: [],
  lastSampleAt: null,
  photos: [],
  clusters: [],
  importSummary: null,
  sessions: mockTrackSessions,
  isImportingPhotos: false,
  locationPermission: 'unknown',
  backgroundPermission: 'unknown',
  mediaPermission: 'unknown',
  backgroundBoostEnabled: true,
  backgroundActive: false,

  initialize: async () => {
    try {
      const [foreground, background, media, backgroundActive] = await Promise.all([
        Location.getForegroundPermissionsAsync().catch(() => null),
        Location.getBackgroundPermissionsAsync().catch(() => null),
        ImagePicker.getMediaLibraryPermissionsAsync().catch(() => null),
        TaskManager.isTaskRegisteredAsync(TRACKER_LOCATION_TASK).catch(() => false),
      ]);

      set({
        locationPermission: foreground?.status === 'granted' ? 'granted' : foreground ? 'denied' : 'unknown',
        backgroundPermission:
          background?.status === 'granted' ? 'granted' : background ? 'denied' : 'unknown',
        mediaPermission: media?.status === 'granted' ? 'granted' : media ? 'denied' : 'unknown',
        backgroundActive,
      });
    } catch {
      // Best-effort hydration only.
    }
  },

  clearError: () => set({ error: null, status: get().status === 'error' ? 'idle' : get().status }),

  setBackgroundBoost: async (enabled) => {
    set({ backgroundBoostEnabled: enabled });

    if (!enabled) {
      await clearBackgroundUpdates();
      set({ backgroundActive: false });
      return;
    }

    if (get().status === 'recording') {
      await maybeEnableBackgroundTracking();
    }
  },

  appendLocations: (locations) =>
    set((state) => {
      const points = mergeTrackPoints(state.points, locations);
      const lastPoint = points.at(-1);

      return {
        points,
        lastSampleAt: lastPoint?.timestamp ?? state.lastSampleAt,
        totalDistanceMeters: accumulateDistance(points),
      };
    }),

  startRecording: async () => {
    set({ error: null });

    const hasServicesEnabled = await Location.hasServicesEnabledAsync().catch(() => false);
    if (!hasServicesEnabled) {
      set({
        status: 'error',
        error: '当前设备没有开启定位服务。',
      });
      return;
    }

    const foreground = await Location.requestForegroundPermissionsAsync().catch(() => null);
    const locationPermission =
      foreground?.status === 'granted' ? 'granted' : foreground ? 'denied' : 'unknown';
    set({ locationPermission });

    if (locationPermission !== 'granted') {
      set({
        status: 'error',
        error: '开始记录前需要先授予定位权限。',
      });
      return;
    }

    await clearForegroundSubscription();
    await clearBackgroundUpdates();

    const sessionId = `track-${Date.now()}`;
    const startedAt = new Date().toISOString();

    set({
      status: 'recording',
      currentSessionId: sessionId,
      startedAt,
      endedAt: null,
      points: [],
      lastSampleAt: null,
      totalDistanceMeters: 0,
      photos: [],
      clusters: [],
      importSummary: null,
      backgroundActive: false,
    });

    try {
      foregroundSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 10,
          timeInterval: 5000,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          get().appendLocations([location]);
        },
        (reason) => {
          set({ status: 'error', error: reason, backgroundActive: false });
        },
      );

      if (get().backgroundBoostEnabled) {
        await maybeEnableBackgroundTracking();
      }
    } catch (error) {
      await clearForegroundSubscription();
      await clearBackgroundUpdates();

      set({
        status: 'error',
        backgroundActive: false,
        error: error instanceof Error ? error.message : '开始定位记录失败。',
      });
    }
  },

  stopRecording: async () => {
    await clearForegroundSubscription();
    await clearBackgroundUpdates();

    set((state) => {
      if (!state.currentSessionId || !state.startedAt) {
        return {
          status: 'idle',
          backgroundActive: false,
        };
      }

      const endedAt = new Date().toISOString();
      const session = buildTrackSession({
        sessionId: state.currentSessionId,
        startedAt: state.startedAt,
        endedAt,
        points: state.points,
        clusters: state.clusters,
      });

      return {
        status: 'stopped',
        endedAt,
        backgroundActive: false,
        sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)],
      };
    });
  },

  importPhotos: async () => {
    const state = get();

    if (!state.currentSessionId) {
      set({
        status: state.status === 'error' ? 'error' : state.status,
        error: '请先开始一次记录，再为这段旅程导入照片。',
      });
      return;
    }

    set({ isImportingPhotos: true, error: null });

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const mediaPermission = permission.status === 'granted' ? 'granted' : 'denied';
      set({ mediaPermission });

      if (mediaPermission !== 'granted') {
        set({
          isImportingPhotos: false,
          error: '导入照片前需要先授予相册权限。',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        exif: true,
        mediaTypes: ['images'],
        quality: 0.7,
        selectionLimit: 20,
      });

      if (result.canceled || !result.assets) {
        set({ isImportingPhotos: false });
        return;
      }

      const { imported, skippedNoLocation } = buildPhotoInputs(
        result.assets.filter((asset) => asset.type === 'image' || asset.type === undefined),
      );

      set((currentState) => {
        const photos = dedupePhotos([...currentState.photos, ...imported]);
        const clusters = preserveClusterTags(clusterPhotos(photos), currentState.clusters);
        const importSummary = {
          selectedCount: result.assets.length,
          importedCount: imported.length,
          skippedNoLocation,
        };

        return {
          isImportingPhotos: false,
          photos,
          clusters,
          importSummary,
          sessions: syncSessionSnapshot(
            currentState.sessions,
            currentState.currentSessionId,
            {
              clusterCount: clusters.length,
              photoCount: photos.length,
              tags: Array.from(new Set(clusters.flatMap((cluster) => cluster.tags))),
              centroid:
                clusters.length > 0
                  ? [
                      clusters.reduce((sum, cluster) => sum + cluster.centroid[0], 0) / clusters.length,
                      clusters.reduce((sum, cluster) => sum + cluster.centroid[1], 0) / clusters.length,
                    ]
                  : null,
            },
          ),
        };
      });
    } catch (error) {
      set({
        isImportingPhotos: false,
        error: error instanceof Error ? error.message : '导入照片失败。',
      });
    }
  },

  importPhotosAsArchive: async () => {
    set({ isImportingPhotos: true, error: null });

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const mediaPermission = permission.status === 'granted' ? 'granted' : 'denied';
      set({ mediaPermission });

      if (mediaPermission !== 'granted') {
        set({
          isImportingPhotos: false,
          error: '导入照片前需要先授予相册权限。',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        exif: true,
        mediaTypes: ['images'],
        quality: 0.7,
        selectionLimit: 40,
      });

      if (result.canceled || !result.assets) {
        set({ isImportingPhotos: false });
        return;
      }

      const { imported, skippedNoLocation } = buildPhotoInputs(
        result.assets.filter((asset) => asset.type === 'image' || asset.type === undefined),
      );
      const photos = dedupePhotos(imported);
      const clusters = clusterPhotos(photos);
      const importSummary = {
        selectedCount: result.assets.length,
        importedCount: photos.length,
        skippedNoLocation,
      };

      if (photos.length === 0) {
        set({
          isImportingPhotos: false,
          importSummary,
          error: '这次选择的照片没有可用位置信息，未生成档案草稿。',
        });
        return;
      }

      const sessionId = `photo-archive-${Date.now()}`;
      const { startedAt, endedAt } = inferPhotoArchiveRange(clusters);
      const session = {
        ...buildTrackSession({
          sessionId,
          startedAt,
          endedAt,
          points: [],
          clusters,
        }),
        sourceType: 'photo_import' as const,
        archiveStatus: 'draft' as const,
      };

      set((state) => ({
        status: 'stopped',
        currentSessionId: sessionId,
        startedAt,
        endedAt,
        points: [],
        lastSampleAt: null,
        totalDistanceMeters: 0,
        photos,
        clusters,
        importSummary,
        isImportingPhotos: false,
        sessions: [session, ...state.sessions.filter((item) => item.id !== session.id)],
      }));
    } catch (error) {
      set({
        isImportingPhotos: false,
        error: error instanceof Error ? error.message : '导入照片失败。',
      });
    }
  },

  toggleClusterTag: (clusterId, tag) =>
    set((state) => {
      const clusters = state.clusters.map((cluster) => {
        if (cluster.id !== clusterId) return cluster;

        const tags = cluster.tags.includes(tag)
          ? cluster.tags.filter((item) => item !== tag)
          : [...cluster.tags, tag];

        return { ...cluster, tags };
      });

      return {
        clusters,
        sessions: syncSessionSnapshot(
          state.sessions,
          state.currentSessionId,
          {
            tags: Array.from(new Set(clusters.flatMap((cluster) => cluster.tags))),
          },
        ),
      };
    }),
}));
