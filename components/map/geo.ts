import type { Coordinate } from '../../lib/types';

export const DEFAULT_MAP_CENTER: Coordinate = [120.143, 30.254];

export function isValidCoordinate(value: unknown): value is Coordinate {
  if (!Array.isArray(value) || value.length < 2) {
    return false;
  }

  const [longitude, latitude] = value;

  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

export function sanitizeCoordinates(coordinates: Coordinate[] | null | undefined): Coordinate[] {
  return (coordinates ?? []).filter(isValidCoordinate);
}

export function getFirstValidCoordinate(...coordinateGroups: Array<Coordinate[] | null | undefined>): Coordinate {
  for (const coordinates of coordinateGroups) {
    const coordinate = sanitizeCoordinates(coordinates)[0];

    if (coordinate) {
      return coordinate;
    }
  }

  return DEFAULT_MAP_CENTER;
}

export function getRouteBounds(coordinates: Coordinate[] | null | undefined) {
  const validCoordinates = sanitizeCoordinates(coordinates);

  if (validCoordinates.length === 0) {
    return null;
  }

  let minLongitude = validCoordinates[0][0];
  let maxLongitude = validCoordinates[0][0];
  let minLatitude = validCoordinates[0][1];
  let maxLatitude = validCoordinates[0][1];

  validCoordinates.forEach(([longitude, latitude]) => {
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
    minLatitude = Math.min(minLatitude, latitude);
    maxLatitude = Math.max(maxLatitude, latitude);
  });

  return [
    [minLongitude, minLatitude] as Coordinate,
    [maxLongitude, maxLatitude] as Coordinate,
  ] as const;
}
