import { mockSpots, mockWayDetails, mockWays } from './mock-data';
import type { SpotDetail, WayDetail, WayListResponse, WayTheme } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

function withQuery(path: string, query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  return `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`请求失败，状态码 ${response.status}`);
  }

  return (await response.json()) as T;
}

function normalizeSpotDetail(spot: SpotDetail): SpotDetail {
  return {
    ...spot,
    contents: Array.isArray(spot.contents) ? spot.contents : [],
    relatedWays: Array.isArray(spot.relatedWays) ? spot.relatedWays : [],
  };
}

export async function fetchWays(params: {
  bbox?: string;
  theme?: WayTheme;
  limit?: number;
} = {}): Promise<WayListResponse> {
  try {
    return await requestJson<WayListResponse>(
      withQuery('/api/ways', {
        bbox: params.bbox,
        theme: params.theme,
        limit: params.limit ?? 20,
      }),
    );
  } catch {
    const ways = params.theme ? mockWays.filter((way) => way.theme === params.theme) : mockWays;
    return { ways, total: ways.length };
  }
}

export async function fetchWayDetail(wayId: string): Promise<WayDetail> {
  try {
    return await requestJson<WayDetail>(`${API_BASE_URL}/api/ways/${wayId}`);
  } catch {
    const fallback = mockWayDetails[wayId];

    if (!fallback) {
      throw new Error(`未找到对应路线：${wayId}`);
    }

    return fallback;
  }
}

export async function fetchSpotDetail(spotId: string): Promise<SpotDetail> {
  try {
    const spot = await requestJson<SpotDetail>(`${API_BASE_URL}/api/spots/${spotId}`);
    return normalizeSpotDetail(spot);
  } catch {
    const fallback = mockSpots[spotId];

    if (!fallback) {
      throw new Error(`未找到对应点位：${spotId}`);
    }

    return normalizeSpotDetail(fallback);
  }
}
