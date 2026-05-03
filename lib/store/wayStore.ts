import { create } from 'zustand';
import { fetchWayDetail, fetchWays } from '../api';
import type { WayDetail, WayPreview } from '../types';

interface WayStoreState {
  ways: WayPreview[];
  selectedWay: WayDetail | null;
  selectedWayId: string | null;
  isLoading: boolean;
  error: string | null;
  loadWays: () => Promise<void>;
  selectWay: (wayId: string) => Promise<void>;
}

export const useWayStore = create<WayStoreState>((set, get) => ({
  ways: [],
  selectedWay: null,
  selectedWayId: null,
  isLoading: false,
  error: null,
  loadWays: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetchWays();
      const firstWayId = response.ways[0]?.id ?? null;

      set({
        ways: response.ways,
        selectedWayId: firstWayId,
        isLoading: false,
      });

      if (firstWayId) {
        await get().selectWay(firstWayId);
      } else {
        set({ selectedWay: null });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '路线加载失败',
      });
    }
  },
  selectWay: async (wayId) => {
    set({ selectedWayId: wayId, error: null });

    try {
      const selectedWay = await fetchWayDetail(wayId);
      set({ selectedWay });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '路线详情加载失败',
      });
    }
  },
}));
