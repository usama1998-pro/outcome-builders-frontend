import { create } from "zustand";

type AuthState = {
  token: string | null;
  hydrated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,

  setToken: (token) => {
    localStorage.setItem("access_token", token);
    set({ token });
  },

  clearToken: () => {
    localStorage.removeItem("access_token");
    set({ token: null });
  },

  hydrate: () => {
    const storedToken = localStorage.getItem("access_token");
    set({ token: storedToken, hydrated: true });
  },
}));
