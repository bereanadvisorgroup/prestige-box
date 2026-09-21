import { create } from "zustand";

export type DrawerEntityType = "client" | "company";

interface EntityDrawerState {
  isOpen: boolean;
  entityType: DrawerEntityType | null;
  entityId: string | null;
  openDrawer: (entityType: DrawerEntityType, entityId: string) => void;
  closeDrawer: () => void;
}

export const useEntityDrawerStore = create<EntityDrawerState>((set) => ({
  isOpen: false,
  entityType: null,
  entityId: null,
  openDrawer: (entityType, entityId) => set({ isOpen: true, entityType, entityId }),
  closeDrawer: () => set({ isOpen: false, entityType: null, entityId: null }),
}));
