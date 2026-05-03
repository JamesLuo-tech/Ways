import { create } from 'zustand';
import type { DraftWay, WayTheme, WishlistItem } from '../types';

interface PlanState {
  draft: DraftWay | null;
  isBuilding: boolean;

  startRoute: (theme?: WayTheme) => void;
  setName: (name: string) => void;
  setTheme: (theme: WayTheme) => void;
  addSpot: (item: WishlistItem) => void;
  removeSpot: (spotId: string) => void;
  reorderSpots: (from: number, to: number) => void;
  clearDraft: () => void;
}

let draftCounter = 0;

export const usePlanStore = create<PlanState>((set) => ({
  draft: null,
  isBuilding: false,

  startRoute: (theme = 'custom') => {
    draftCounter += 1;
    set({
      isBuilding: true,
      draft: {
        id: `draft-${Date.now()}-${draftCounter}`,
        name: '',
        theme,
        spots: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  },

  setName: (name) =>
    set((state) => {
      if (!state.draft) return state;
      return { draft: { ...state.draft, name, updatedAt: new Date().toISOString() } };
    }),

  setTheme: (theme) =>
    set((state) => {
      if (!state.draft) return state;
      return { draft: { ...state.draft, theme, updatedAt: new Date().toISOString() } };
    }),

  addSpot: (item) =>
    set((state) => {
      if (!state.draft) return state;
      if (state.draft.spots.some((s) => s.spotId === item.spotId)) return state;
      return {
        draft: {
          ...state.draft,
          spots: [...state.draft.spots, item],
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  removeSpot: (spotId) =>
    set((state) => {
      if (!state.draft) return state;
      return {
        draft: {
          ...state.draft,
          spots: state.draft.spots.filter((s) => s.spotId !== spotId),
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  reorderSpots: (from, to) =>
    set((state) => {
      if (!state.draft) return state;
      const spots = [...state.draft.spots];
      const [moved] = spots.splice(from, 1);
      spots.splice(to, 0, moved);
      return {
        draft: { ...state.draft, spots, updatedAt: new Date().toISOString() },
      };
    }),

  clearDraft: () => set({ draft: null, isBuilding: false }),
}));
