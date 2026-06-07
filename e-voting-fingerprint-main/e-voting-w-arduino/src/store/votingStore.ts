/**
 * Zustand Store for Voting System
 * Global state management
 */

import { create } from "zustand";
import type {
  Voter,
  Candidate,
  VotingSession,
  Admin,
  DashboardStats,
  VotingSessionStatus,
} from "../types/voting";

// API Base URL - Update this to your server URL
// Default: http://localhost:3000/api (Node.js server)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ============================================
// AUTH STORE
// ============================================

interface AuthStore {
  isAuthenticated: boolean;
  admin: Admin | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  admin: null,
  token: null,
  loading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        set({
          isAuthenticated: true,
          admin: data.admin,
          token: data.token,
          loading: false,
        });
        localStorage.setItem("adminToken", data.token);
        return true;
      } else {
        set({ error: data.message, loading: false });
        return false;
      }
    } catch (error) {
      set({ error: "Connection error", loading: false });
      return false;
    }
  },

  logout: () => {
    set({ isAuthenticated: false, admin: null, token: null });
    localStorage.removeItem("adminToken");
  },
}));

// ============================================
// VOTING STORE
// ============================================

interface VotingStore {
  // State
  currentVoter: Voter | null;
  candidates: Candidate[];
  session: VotingSession | null;
  loading: boolean;
  error: string | null;
  voteSuccess: boolean;
  needsRegistration: boolean;

  // Actions
  validateVoter: (uniqueId: string) => Promise<boolean>;
  registerVoter: (
    uniqueId: string,
    data: { name: string; section: string; age: number; gender: string },
  ) => Promise<boolean>;
  castVote: (candidateIds: string[]) => Promise<boolean>;
  fetchCandidates: () => Promise<void>;
  fetchSession: () => Promise<void>;
  resetVoting: () => void;
}

export const useVotingStore = create<VotingStore>((set, get) => ({
  currentVoter: null,
  candidates: [],
  session: null,
  loading: false,
  error: null,
  voteSuccess: false,
  needsRegistration: false,

  validateVoter: async (uniqueId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/public/voter/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueId }),
      });

      const data = await response.json();

      if (data.valid) {
        set({
          currentVoter: data.voter,
          loading: false,
          needsRegistration: data.needsRegistration || false,
        });
        return true;
      } else {
        set({ error: data.message, loading: false });
        return false;
      }
    } catch (error) {
      set({ error: "Connection error", loading: false });
      return false;
    }
  },

  registerVoter: async (
    uniqueId: string,
    voterData: { name: string; section: string; age: number; gender: string },
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/public/voter/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniqueId,
          ...voterData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        set({
          currentVoter: data.voter,
          loading: false,
          needsRegistration: false,
        });
        return true;
      } else {
        set({ error: data.message, loading: false });
        return false;
      }
    } catch (error) {
      set({ error: "Connection error", loading: false });
      return false;
    }
  },

  castVote: async (candidateIds: string[]) => {
    const { currentVoter } = get();
    if (!currentVoter) {
      set({ error: "No voter selected" });
      return false;
    }

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/public/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uniqueId: currentVoter.uniqueId,
          candidateIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        set({ voteSuccess: true, loading: false });
        return true;
      } else {
        set({ error: data.message, loading: false });
        return false;
      }
    } catch (error) {
      set({ error: "Connection error", loading: false });
      return false;
    }
  },

  fetchCandidates: async () => {
    try {
      const response = await fetch(`${API_BASE}/public/candidates`);
      const candidates = await response.json();
      set({ candidates });
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  },

  fetchSession: async () => {
    try {
      const response = await fetch(`${API_BASE}/public/session`);
      const session = await response.json();
      set({ session });
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  },

  resetVoting: () => {
    set({
      currentVoter: null,
      voteSuccess: false,
      error: null,
      needsRegistration: false,
    });
  },
}));

// ============================================
// ADMIN STORE
// ============================================

interface AdminStore {
  // State
  voters: Voter[];
  candidates: Candidate[];
  session: VotingSession | null;
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchVoters: () => Promise<void>;
  fetchCandidates: () => Promise<void>;
  fetchSession: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addCandidate: (data: {
    name: string;
    party: string;
    position: string;
    photoUrl?: string;
  }) => Promise<boolean>;
  deleteCandidate: (id: string) => Promise<boolean>;
  updateSessionStatus: (status: VotingSessionStatus) => Promise<boolean>;
  resetElection: () => Promise<boolean>;
  createTestVoters: () => Promise<boolean>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  voters: [],
  candidates: [],
  session: null,
  stats: null,
  loading: false,
  error: null,

  fetchVoters: async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    set({ loading: true });
    try {
      const response = await fetch(`${API_BASE}/admin/voters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const voters = await response.json();
      set({ voters, loading: false });
    } catch (error) {
      set({ error: "Error fetching voters", loading: false });
    }
  },

  fetchCandidates: async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/admin/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const candidates = await response.json();
      set({ candidates });
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  },

  fetchSession: async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/admin/session`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const session = await response.json();
      set({ session });
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  },

  fetchStats: async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const stats = await response.json();
      set({ stats });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  },

  addCandidate: async (data) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return false;

    set({ loading: true });
    try {
      const response = await fetch(`${API_BASE}/admin/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      set({ loading: false });

      if (result.success) {
        await get().fetchCandidates();
        return true;
      }
      return false;
    } catch (error) {
      set({ error: "Error adding candidate", loading: false });
      return false;
    }
  },

  deleteCandidate: async (id: string) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/admin/candidates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();

      if (result.success) {
        await get().fetchCandidates();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  updateSessionStatus: async (status: VotingSessionStatus) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return false;

    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/admin/session/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      set({ loading: false });

      if (result.success) {
        await get().fetchSession();
        await get().fetchStats();
        set({ error: null });
        return true;
      } else {
        set({ error: result.message || "Failed to update session status" });
        return false;
      }
    } catch (error) {
      set({ error: "Connection error", loading: false });
      return false;
    }
  },

  resetElection: async () => {
    const { token } = useAuthStore.getState();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/admin/session/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        await get().fetchSession();
        await get().fetchStats();
        await get().fetchVoters();
        await get().fetchCandidates();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  createTestVoters: async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return false;

    set({ loading: true });
    try {
      const response = await fetch(`${API_BASE}/admin/voters/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        await get().fetchVoters();
        set({ loading: false });
        return true;
      }
      return false;
    } catch (error) {
      set({ error: "Error creating test voters", loading: false });
      return false;
    }
  },
}));
