import { create } from 'zustand';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  provider: string;
  created: string;
  lastUsed: string;
}

interface DashboardState {
  apiKeys: ApiKey[];
  showKeys: Record<number, boolean>;
  setApiKeys: (keys: ApiKey[]) => void;
  addApiKey: (key: ApiKey) => void;
  removeApiKey: (id: number) => void;
  toggleKeyVisibility: (keyId: number) => void;
  setKeyVisibility: (keyId: number, visible: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  apiKeys: [
    { id: 1, name: "OpenAI Production", key: "sk-proj-***", provider: "OpenAI", created: "2024-01-15", lastUsed: "2 hours ago" },
    { id: 2, name: "Anthropic Dev", key: "sk-ant-***", provider: "Anthropic", created: "2024-01-10", lastUsed: "1 day ago" }
  ],
  showKeys: {},
  setApiKeys: (keys: ApiKey[]) => set({ apiKeys: keys }),
  addApiKey: (key: ApiKey) => set((state) => ({ apiKeys: [...state.apiKeys, key] })),
  removeApiKey: (id: number) => set((state) => ({ 
    apiKeys: state.apiKeys.filter(key => key.id !== id),
    showKeys: Object.fromEntries(Object.entries(state.showKeys).filter(([keyId]) => parseInt(keyId) !== id))
  })),
  toggleKeyVisibility: (keyId: number) => set((state) => ({ 
    showKeys: { ...state.showKeys, [keyId]: !state.showKeys[keyId] }
  })),
  setKeyVisibility: (keyId: number, visible: boolean) => set((state) => ({ 
    showKeys: { ...state.showKeys, [keyId]: visible }
  })),
}));
