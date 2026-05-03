import { create } from 'zustand';
import { fetchSpotDetail } from '../api';
import type { SpotDetail } from '../types';

interface SpotStoreState {
  selectedSpot: SpotDetail | null;
  isSheetOpen: boolean;
  isLoading: boolean;
  error: string | null;
  openSpot: (spotId: string) => Promise<void>;
  closeSpot: () => void;
}

export const useSpotStore = create<SpotStoreState>((set) => ({
  selectedSpot: null,
  isSheetOpen: false,
  isLoading: false,
  error: null,
  openSpot: async (spotId) => {
    set({ isLoading: true, isSheetOpen: true, error: null });

    try {
      const selectedSpot = await fetchSpotDetail(spotId);
      set({ selectedSpot, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '点位详情加载失败',
      });
    }
  },
  closeSpot: () => {
    set({ isSheetOpen: false });
  },
}));
