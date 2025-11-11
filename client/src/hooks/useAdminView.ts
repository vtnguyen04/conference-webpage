import { create } from 'zustand';

interface AdminViewStore {
  viewingSlug: string | null;
  activeSlug: string | null;
  isReadOnly: boolean;
  setViewingSlug: (slug: string) => void;
  setSlugs: (viewingSlug: string, activeSlug: string) => void;
}

export const useAdminView = create<AdminViewStore>((set, get) => ({
  viewingSlug: null,
  activeSlug: null,
  isReadOnly: false,
  setViewingSlug: (slug) => {
    const activeSlug = get().activeSlug;
    set({ viewingSlug: slug, isReadOnly: slug !== activeSlug });
  },
  setSlugs: (viewingSlug, activeSlug) => {
    set({
      viewingSlug,
      activeSlug,
      isReadOnly: viewingSlug !== activeSlug,
    });
  },
}));