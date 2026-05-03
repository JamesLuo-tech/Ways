import type { ImagePickerAsset } from 'expo-image-picker';
import type { LocationObject } from 'expo-location';

import type {
  Coordinate,
  PhotoCluster,
  TrackPhotoInput,
  TrackPoint,
  TrackReviewTag,
  TrackSession,
} from './types';

export const TRACKER_LOCATION_TASK = 'ways-tracker-location-task';
export const PHOTO_CLUSTER_DISTANCE_METERS = 180;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value && typeof value === 'object') {
    const maybeFraction = value as { numerator?: unknown; denominator?: unknown };
    const numerator = toNumber(maybeFraction.numerator);
    const denominator = toNumber(maybeFraction.denominator);

    if (numerator !== null && denominator !== null && denominator !== 0) {
      return numerator / denominator;
    }
  }

  return null;
}

function normalizeExifCoordinate(value: unknown): number | null {
  const direct = toNumber(value);
  if (direct !== null) return direct;

  if (Array.isArray(value)) {
    const [degreesRaw, minutesRaw, secondsRaw] = value;
    const degrees = toNumber(degreesRaw);
    const minutes = toNumber(minutesRaw) ?? 0;
    const seconds = toNumber(secondsRaw) ?? 0;

    if (degrees === null) return null;
    return degrees + minutes / 60 + seconds / 3600;
  }

  return null;
}

function applyHemisphere(value: number, reference: unknown) {
  const normalizedRef = typeof reference === 'string' ? reference.toUpperCase() : '';
  return normalizedRef === 'S' || normalizedRef === 'W' ? -Math.abs(value) : Math.abs(value);
}

function extractExifCoordinate(exif: Record<string, any> | null | undefined): Coordinate | null {
  if (!exif) return null;

  const latitude =
    normalizeExifCoordinate(exif.latitude) ??
    normalizeExifCoordinate(exif.Latitude) ??
    normalizeExifCoordinate(exif.GPSLatitude);
  const longitude =
    normalizeExifCoordinate(exif.longitude) ??
    normalizeExifCoordinate(exif.Longitude) ??
    normalizeExifCoordinate(exif.GPSLongitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  const signedLatitude = applyHemisphere(latitude, exif.GPSLatitudeRef ?? exif.LatitudeRef);
  const signedLongitude = applyHemisphere(longitude, exif.GPSLongitudeRef ?? exif.LongitudeRef);

  if (!Number.isFinite(signedLatitude) || !Number.isFinite(signedLongitude)) {
    return null;
  }

  return [signedLongitude, signedLatitude];
}

function sortNullableDates(values: Array<string | null>) {
  return [...values].sort((left, right) => {
    if (left === right) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return left.localeCompare(right);
  });
}

function computeCentroid(coordinates: Coordinate[]): Coordinate {
  const [longitudeSum, latitudeSum] = coordinates.reduce<[number, number]>(
    (acc, [longitude, latitude]) => [acc[0] + longitude, acc[1] + latitude],
    [0, 0],
  );

  return [longitudeSum / coordinates.length, latitudeSum / coordinates.length];
}

export function distanceBetweenCoordinates(from: Coordinate, to: Coordinate) {
  const earthRadius = 6371000;
  const latitudeDelta = toRadians(to[1] - from[1]);
  const longitudeDelta = toRadians(to[0] - from[0]);
  const fromLatitude = toRadians(from[1]);
  const toLatitude = toRadians(to[1]);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function buildTrackPoint(location: LocationObject): TrackPoint {
  return {
    coordinate: [location.coords.longitude, location.coords.latitude],
    altitude: location.coords.altitude,
    speed: location.coords.speed,
    timestamp: new Date(location.timestamp).toISOString(),
  };
}

export function accumulateDistance(points: TrackPoint[]) {
  if (points.length < 2) return 0;

  return points.slice(1).reduce((total, point, index) => {
    return total + distanceBetweenCoordinates(points[index].coordinate, point.coordinate);
  }, 0);
}

export function mergeTrackPoints(existing: TrackPoint[], incomingLocations: LocationObject[]) {
  const incomingPoints = incomingLocations.map(buildTrackPoint);
  const merged = [...existing];

  incomingPoints.forEach((point) => {
    const lastPoint = merged.at(-1);

    if (
      lastPoint &&
      lastPoint.timestamp === point.timestamp &&
      lastPoint.coordinate[0] === point.coordinate[0] &&
      lastPoint.coordinate[1] === point.coordinate[1]
    ) {
      return;
    }

    merged.push(point);
  });

  return merged;
}

export function buildPhotoInputs(assets: ImagePickerAsset[]) {
  const imported: TrackPhotoInput[] = [];
  let skippedNoLocation = 0;

  assets.forEach((asset, index) => {
    const coordinate = extractExifCoordinate(asset.exif);

    if (!coordinate) {
      skippedNoLocation += 1;
      return;
    }

    imported.push({
      id: asset.assetId ?? `${asset.uri}-${index}`,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      coordinate,
      takenAt:
        asset.exif?.DateTimeOriginal ??
        asset.exif?.DateTimeDigitized ??
        asset.exif?.DateTime ??
        null,
    });
  });

  return { imported, skippedNoLocation };
}

export function dedupePhotos(photos: TrackPhotoInput[]) {
  const seen = new Set<string>();

  return photos.filter((photo) => {
    const key = `${photo.id}:${photo.uri}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function clusterPhotos(
  photos: TrackPhotoInput[],
  thresholdMeters = PHOTO_CLUSTER_DISTANCE_METERS,
): PhotoCluster[] {
  const orderedPhotos = [...photos].sort((left, right) => {
    if (left.takenAt && right.takenAt) return left.takenAt.localeCompare(right.takenAt);
    if (left.takenAt) return -1;
    if (right.takenAt) return 1;
    return left.id.localeCompare(right.id);
  });

  const clusterBuckets: Array<{ photos: TrackPhotoInput[]; tags: TrackReviewTag[] }> = [];

  orderedPhotos.forEach((photo) => {
    let bestClusterIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    clusterBuckets.forEach((cluster, index) => {
      const centroid = computeCentroid(cluster.photos.map((item) => item.coordinate));
      const distance = distanceBetweenCoordinates(centroid, photo.coordinate);

      if (distance <= thresholdMeters && distance < bestDistance) {
        bestDistance = distance;
        bestClusterIndex = index;
      }
    });

    if (bestClusterIndex === -1) {
      clusterBuckets.push({ photos: [photo], tags: [] });
      return;
    }

    clusterBuckets[bestClusterIndex].photos.push(photo);
  });

  return clusterBuckets.map((cluster, index) => {
    const dates = sortNullableDates(cluster.photos.map((photo) => photo.takenAt));

    return {
      id: `cluster-${index + 1}`,
      centroid: computeCentroid(cluster.photos.map((photo) => photo.coordinate)),
      photoCount: cluster.photos.length,
      photoIds: cluster.photos.map((photo) => photo.id),
      coverUri: cluster.photos[0].uri,
      takenAtStart: dates[0] ?? null,
      takenAtEnd: dates.at(-1) ?? null,
      tags: cluster.tags,
    };
  });
}

export function preserveClusterTags(nextClusters: PhotoCluster[], previousClusters: PhotoCluster[]) {
  const previousByPhotoSet = new Map<string, TrackReviewTag[]>();

  previousClusters.forEach((cluster) => {
    previousByPhotoSet.set(cluster.photoIds.slice().sort().join('|'), cluster.tags);
  });

  return nextClusters.map((cluster) => ({
    ...cluster,
    tags: previousByPhotoSet.get(cluster.photoIds.slice().sort().join('|')) ?? [],
  }));
}

export function buildTrackSession(params: {
  sessionId: string;
  startedAt: string;
  endedAt: string;
  points: TrackPoint[];
  clusters: PhotoCluster[];
}): TrackSession {
  const allTags = Array.from(
    new Set(params.clusters.flatMap((cluster) => cluster.tags)),
  );
  const routePreview = params.points.map((point) => point.coordinate);
  const centroid =
    params.clusters.length > 0
      ? computeCentroid(params.clusters.map((cluster) => cluster.centroid))
      : routePreview.length > 0
        ? computeCentroid(routePreview)
        : null;

  return {
    id: params.sessionId,
    startedAt: params.startedAt,
    endedAt: params.endedAt,
    distanceMeters: accumulateDistance(params.points),
    pointCount: params.points.length,
    clusterCount: params.clusters.length,
    photoCount: params.clusters.reduce((sum, cluster) => sum + cluster.photoCount, 0),
    tags: allTags,
    routePreview,
    centroid,
  };
}
