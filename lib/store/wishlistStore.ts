import { create } from 'zustand';
import type { SpotCategory, Coordinate, SpotRegion, WishlistItem } from '../types';

interface WishlistState {
  items: WishlistItem[];
  add: (spot: {
    id: string;
    name: string;
    coordinate: Coordinate;
    category: SpotCategory;
    region?: SpotRegion;
  }) => void;
  remove: (spotId: string) => void;
  has: (spotId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  add: (spot) => {
    if (get().items.some((i) => i.spotId === spot.id)) return;
    set((state) => ({
      items: [
        ...state.items,
        {
          spotId: spot.id,
          name: spot.name,
          coordinate: spot.coordinate,
          category: spot.category,
          region: spot.region,
          addedAt: new Date().toISOString(),
        },
      ],
    }));
  },
  remove: (spotId) => {
    set((state) => ({
      items: state.items.filter((i) => i.spotId !== spotId),
    }));
  },
  has: (spotId) => get().items.some((i) => i.spotId === spotId),
  clear: () => set({ items: [] }),
}));
