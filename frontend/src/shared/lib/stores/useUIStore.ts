import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIStore {
  modals: {
    createPosition: boolean;
    editApiKey: boolean;
    confirmDelete: string | null;
    createApiKey: boolean;
    editPosition: boolean;
    settingsDialog: boolean;
  };
  setModal: <K extends keyof UIStore['modals']>(
    modal: K,
    value: UIStore['modals'][K]
  ) => void;
  closeAllModals: () => void;
}

const initialModals: UIStore['modals'] = {
  createPosition: false,
  editApiKey: false,
  confirmDelete: null,
  createApiKey: false,
  editPosition: false,
  settingsDialog: false,
};

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      modals: initialModals,
      setModal: (modal, value) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modal]: value,
          },
        })),
      closeAllModals: () =>
        set(() => ({
          modals: initialModals,
        })),
    }),
    {
      name: 'ui-store',
    }
  )
);
