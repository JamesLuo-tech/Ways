import { Alert, Linking, Platform } from 'react-native';
import type { Coordinate } from './types';

/**
 * Launch an external navigation app with a list of waypoints.
 * Tries Amap first (popular in China), then Google Maps, then Apple Maps.
 */
export async function openExternalNav(coords: Coordinate[]): Promise<void> {
  if (coords.length < 2) return;

  const origin = coords[0];
  const destination = coords[coords.length - 1];
  const waypoints = coords.slice(1, -1);

  // Try Amap (高德地图)
  const amapUrl = buildAmapUrl(origin, destination, waypoints);
  if (await Linking.canOpenURL(amapUrl)) {
    await Linking.openURL(amapUrl);
    return;
  }

  // Try Google Maps
  const googleUrl = buildGoogleMapsUrl(origin, destination, waypoints);
  if (await Linking.canOpenURL(googleUrl)) {
    await Linking.openURL(googleUrl);
    return;
  }

  // Fallback: Apple Maps (iOS) or web Google Maps
  if (Platform.OS === 'ios') {
    const appleUrl = buildAppleMapsUrl(origin, destination, waypoints);
    await Linking.openURL(appleUrl);
    return;
  }

  // Web fallback
  await Linking.openURL(buildGoogleMapsWebUrl(origin, destination, waypoints));
}

function buildAmapUrl(origin: Coordinate, dest: Coordinate, waypoints: Coordinate[]): string {
  // Amap uses lat,lng format
  const dlat = dest[1];
  const dlng = dest[0];
  let url = `amapuri://route/plan/?dlat=${dlat}&dlon=${dlng}&dname=终点&dev=0&t=2`;
  // Amap doesn't support multiple waypoints in URI scheme, use origin
  url += `&slat=${origin[1]}&slon=${origin[0]}&sname=起点`;
  return url;
}

function buildGoogleMapsUrl(
  origin: Coordinate,
  dest: Coordinate,
  waypoints: Coordinate[],
): string {
  const o = `${origin[1]},${origin[0]}`;
  const d = `${dest[1]},${dest[0]}`;
  let url = `comgooglemaps://?saddr=${o}&daddr=${d}&directionsmode=walking`;
  if (waypoints.length > 0) {
    const wp = waypoints.map((c) => `${c[1]},${c[0]}`).join('|');
    url += `&waypoints=${wp}`;
  }
  return url;
}

function buildAppleMapsUrl(
  origin: Coordinate,
  dest: Coordinate,
  waypoints: Coordinate[],
): string {
  const d = `${dest[1]},${dest[0]}`;
  const o = `${origin[1]},${origin[0]}`;
  return `maps://?saddr=${o}&daddr=${d}&dirflg=w`;
}

function buildGoogleMapsWebUrl(
  origin: Coordinate,
  dest: Coordinate,
  waypoints: Coordinate[],
): string {
  const o = `${origin[1]},${origin[0]}`;
  const d = `${dest[1]},${dest[0]}`;
  let url = `https://www.google.com/maps/dir/${o}/${d}`;
  if (waypoints.length > 0) {
    const wp = waypoints.map((c) => `${c[1]},${c[0]}`).join('/');
    url = `https://www.google.com/maps/dir/${o}/${wp}/${d}`;
  }
  return url;
}
