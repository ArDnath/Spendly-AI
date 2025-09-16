import { create } from 'zustand';

interface ExampleState {
  isModalOpen: boolean;
  inputValue: string;
  inputError: string;
  setModalOpen: (open: boolean) => void;
  setInputValue: (value: string) => void;
  setInputError: (error: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
}

export const useExampleStore = create<ExampleState>((set, get) => ({
  isModalOpen: false,
  inputValue: '',
  inputError: '',
  setModalOpen: (open: boolean) => set({ isModalOpen: open }),
  setInputValue: (value: string) => set({ inputValue: value }),
  setInputError: (error: string) => set({ inputError: error }),
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    set({ inputValue: value });
    if (get().inputError) {
      set({ inputError: '' });
    }
  },
  handleSubmit: () => {
    const { inputValue } = get();
    if (!inputValue.trim()) {
      set({ inputError: 'This field is required' });
      return;
    }
    set({ isModalOpen: true });
  },
}));
