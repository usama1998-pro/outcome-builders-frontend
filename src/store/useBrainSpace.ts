import { create } from "zustand";
import { persist } from "zustand/middleware";

type BrainSpaceState = {
  currentBrainSpaceId: number | null;
  setCurrentBrainSpaceId: (id: number | null) => void;
};

export const useBrainSpaceStore = create<BrainSpaceState>()(
  persist(
    (set) => ({
      currentBrainSpaceId: null,
      setCurrentBrainSpaceId: (id) => {
        set({ currentBrainSpaceId: id });
      },
    }),
    {
      name: "brain-space-storage",
    }
  )
);

