export type Coordinate = [longitude: number, latitude: number];

export const WAY_THEMES = ['hiking', 'wine', 'coffee', 'ancient-town', 'cycling', 'custom'] as const;
export type WayTheme = (typeof WAY_THEMES)[number];

export const SPOT_CATEGORIES = ['scenic', 'food', 'camp', 'viewpoint', 'culture', 'other'] as const;
export type SpotCategory = (typeof SPOT_CATEGORIES)[number];

export interface SpotRegion {
  province: string;
  city: string;
  district?: string;
  area?: string;
}

export interface SpotPreview {
  id: string;
  name: string;
  coordinate: Coordinate;
  category: SpotCategory;
  region?: SpotRegion;
}

export interface SpotPhoto {
  url: string;
  takenAt: string;
}

export type HeatBucket = 'emerging' | 'hot' | 'classic' | 'editorial';
export type SpotContentVisibility = 'public' | 'hidden';
export type SpotContentSourceType = 'tracked' | 'planned' | 'mixed';

export interface UserProfileSummary {
  id: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  homeBase: string;
  stats: {
    archiveCount: number;
    distanceKm: number;
    spotCount: number;
    photoCount: number;
  };
}

export interface TravelArchiveSummary {
  id: string;
  title: string;
  regionName: string;
  routeSignature: Coordinate[];
  stops: ArchiveStopSummary[];
  stats: {
    distanceKm: number;
    durationHours: number;
    spotCount: number;
    photoCount: number;
  };
}

export interface ArchiveStopSummary extends SpotPreview {
  sequence: number;
}

export interface WayReference {
  id: string;
  name: string;
  heatBucket: HeatBucket;
}

export interface SpotContent {
  id: string;
  spotId: string;
  owner: UserProfileSummary;
  archive: TravelArchiveSummary;
  coverAssetUrl: string;
  capturedAt: string;
  tags: string[];
  visibility: SpotContentVisibility;
  sourceType: SpotContentSourceType;
}

export interface SpotDetail extends SpotPreview {
  tags: string[];
  photos: SpotPhoto[];
  wayIds: string[];
  contents: SpotContent[];
  relatedWays: WayReference[];
}

export interface WayPreview {
  id: string;
  name: string;
  theme: WayTheme;
  spotCount: number;
  distance: number;
  duration: number;
  coverPhoto: string;
  previewPolyline: Coordinate[];
  heatBucket: HeatBucket;
  contentCount: number;
  savedCountLabel: string;
}

export interface WayDetail extends WayPreview {
  spots: SpotPreview[];
}

export interface WayListResponse {
  ways: WayPreview[];
  total: number;
}

/* ─── Stage B: Planning ────────────────────────────── */

export interface WishlistItem {
  spotId: string;
  name: string;
  coordinate: Coordinate;
  category: SpotCategory;
  region?: SpotRegion;
  addedAt: string;
}

export interface DraftWay {
  id: string;
  name: string;
  theme: WayTheme;
  spots: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}

/* ─── Stage C: Tracking ────────────────────────────── */

export const TRACK_REVIEW_TAGS = [
  '机位极佳',
  '人烟稀少',
  '适合微醺',
  '补给方便',
  '适合停留',
  '逆光友好',
  '风大',
  '建议轻装',
  '值得二刷',
] as const;

export type TrackReviewTag = (typeof TRACK_REVIEW_TAGS)[number];
export type TrackerStatus = 'idle' | 'recording' | 'stopped' | 'error';
export type PermissionState = 'unknown' | 'granted' | 'denied';

export interface TrackPoint {
  coordinate: Coordinate;
  altitude: number | null;
  timestamp: string;
  speed: number | null;
}

export interface TrackPhotoInput {
  id: string;
  uri: string;
  width: number;
  height: number;
  coordinate: Coordinate;
  takenAt: string | null;
}

export interface PhotoCluster {
  id: string;
  centroid: Coordinate;
  photoCount: number;
  photoIds: string[];
  coverUri: string;
  takenAtStart: string | null;
  takenAtEnd: string | null;
  tags: TrackReviewTag[];
}

export interface PhotoImportSummary {
  selectedCount: number;
  importedCount: number;
  skippedNoLocation: number;
}

export interface TrackSession {
  id: string;
  startedAt: string;
  endedAt: string;
  sourceType?: 'tracked' | 'photo_import';
  archiveStatus?: 'draft' | 'ready' | 'published';
  distanceMeters: number;
  pointCount: number;
  clusterCount: number;
  photoCount: number;
  tags: TrackReviewTag[];
  routePreview: Coordinate[];
  centroid: Coordinate | null;
}

/* ─── Stage D: Footprints ─────────────────────────── */

export interface FootprintJourney {
  id: string;
  title: string;
  theme: WayTheme;
  region: string;
  startedAt: string;
  endedAt: string;
  sourceType?: TrackSession['sourceType'];
  archiveStatus?: TrackSession['archiveStatus'];
  distanceKm: number;
  durationHours: number;
  spotCount: number;
  photoCount: number;
  tags: string[];
  routePreview: Coordinate[];
  heroMetric: string;
}
