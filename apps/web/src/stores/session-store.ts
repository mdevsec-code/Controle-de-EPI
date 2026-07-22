import { create } from "zustand";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionState {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
