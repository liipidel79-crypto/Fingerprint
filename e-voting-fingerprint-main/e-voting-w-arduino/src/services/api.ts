/**
 * Express.js/Node.js API Service
 * Backend built with Express and MySQL
 *
 * Setup:
 * 1. Navigate to server/nodejs
 * 2. Run: npm install
 * 3. Configure .env with your database credentials
 * 4. Run: npm start
 * 5. Update VITE_API_URL in .env to http://localhost:3000
 */

import type {
  Voter,
  Candidate,
  VotingSession,
  Vote,
  Admin,
  VotingSessionStatus,
  DashboardStats,
} from "../types/voting";

// API Base URL - configure this in .env
// Default: http://localhost:3000/api (Node.js server)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Make API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Generate a unique voter ID
 * Format: VOT-XXXXXXXX (8 alphanumeric characters)
 */
export const generateVoterId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "VOT-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// ============================================
// VOTER OPERATIONS
// ============================================

/**
 * Register a new voter from ESP32
 */
export const registerVoter = async (
  fingerprintId: number,
  phoneNumber?: string,
): Promise<{ uniqueId: string; success: boolean }> => {
  try {
    const result = await apiRequest<{
      uniqueId: string;
      success: boolean;
      message?: string;
    }>("hardware/register", {
      method: "POST",
      body: JSON.stringify({ fingerprintId, phoneNumber }),
    });
    return result;
  } catch (error: any) {
    console.error("Register voter error:", error);
    return { uniqueId: "", success: false };
  }
};

/**
 * Get voter by unique ID
 */
export const getVoter = async (uniqueId: string): Promise<Voter | null> => {
  try {
    return await apiRequest<Voter>("voter/validate", {
      method: "POST",
      body: JSON.stringify({ uniqueId }),
    });
  } catch (error) {
    console.error("Get voter error:", error);
    return null;
  }
};

/**
 * Get all voters
 */
export const getAllVoters = async (): Promise<Voter[]> => {
  try {
    return await apiRequest<Voter[]>("voters");
  } catch (error) {
    console.error("Get all voters error:", error);
    return [];
  }
};

/**
 * Update voter status after voting
 */
export const updateVoterStatus = async (
  uniqueId: string,
  status: "not_voted" | "already_voted",
): Promise<void> => {
  // Status is updated automatically when casting vote
  console.log("Voter status update:", uniqueId, status);
};

/**
 * Subscribe to voter changes (polling - real-time not available in PHP)
 * Note: For real-time updates, consider using WebSockets or Server-Sent Events
 */
export const subscribeToVoters = (
  callback: (voters: Voter[]) => void,
): (() => void) => {
  // Poll every 5 seconds for changes
  const interval = setInterval(async () => {
    const voters = await getAllVoters();
    callback(voters);
  }, 5000);

  // Initial fetch
  getAllVoters().then(callback);

  // Return unsubscribe function
  return () => clearInterval(interval);
};

// ============================================
// CANDIDATE OPERATIONS
// ============================================

/**
 * Add a new candidate
 */
export const addCandidate = async (
  candidate: Omit<Candidate, "id" | "voteCount" | "createdAt">,
): Promise<string> => {
  try {
    const result = await apiRequest<{ id: string }>("candidate/add", {
      method: "POST",
      body: JSON.stringify(candidate),
    });
    return result.id;
  } catch (error) {
    console.error("Add candidate error:", error);
    throw error;
  }
};

/**
 * Get all candidates
 */
export const getAllCandidates = async (): Promise<Candidate[]> => {
  try {
    return await apiRequest<Candidate[]>("candidates");
  } catch (error) {
    console.error("Get all candidates error:", error);
    return [];
  }
};

/**
 * Get candidate by ID
 */
export const getCandidate = async (id: string): Promise<Candidate | null> => {
  try {
    const candidates = await getAllCandidates();
    return candidates.find((c) => c.id === id) || null;
  } catch (error) {
    console.error("Get candidate error:", error);
    return null;
  }
};

/**
 * Update candidate vote count
 */
export const incrementCandidateVotes = async (
  candidateId: string,
): Promise<void> => {
  try {
    await apiRequest("candidate/vote", {
      method: "POST",
      body: JSON.stringify({ candidateId }),
    });
  } catch (error) {
    console.error("Increment votes error:", error);
  }
};

/**
 * Delete a candidate
 */
export const deleteCandidate = async (id: string): Promise<void> => {
  try {
    await apiRequest("candidate/delete", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  } catch (error) {
    console.error("Delete candidate error:", error);
  }
};

/**
 * Subscribe to candidate changes (polling)
 */
export const subscribeToCandidates = (
  callback: (candidates: Candidate[]) => void,
): (() => void) => {
  const interval = setInterval(async () => {
    const candidates = await getAllCandidates();
    callback(candidates);
  }, 5000);

  getAllCandidates().then(callback);

  return () => clearInterval(interval);
};

// ============================================
// SESSION OPERATIONS
// ============================================

/**
 * Initialize or get voting session
 */
export const getOrCreateSession = async (): Promise<VotingSession> => {
  try {
    return await apiRequest<VotingSession>("session");
  } catch (error) {
    console.error("Get session error:", error);
    return {
      id: "default",
      status: "pending",
      title: "General Election",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
};

/**
 * Update voting session status
 */
export const updateSessionStatus = async (
  status: VotingSessionStatus,
): Promise<void> => {
  try {
    await apiRequest("session/update", {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    console.error("Update session status error:", error);
  }
};

/**
 * Subscribe to session changes (polling)
 */
export const subscribeToSession = (
  callback: (session: VotingSession | null) => void,
): (() => void) => {
  const interval = setInterval(async () => {
    const session = await getOrCreateSession();
    callback(session);
  }, 5000);

  getOrCreateSession().then(callback);

  return () => clearInterval(interval);
};

// ============================================
// VOTE OPERATIONS
// ============================================

/**
 * Cast a vote
 */
export const castVote = async (
  voterUniqueId: string,
  candidateId: string,
): Promise<{ success: boolean; voteId?: string; error?: string }> => {
  try {
    const result = await apiRequest<{
      success: boolean;
      voteId?: string;
      error?: string;
    }>("vote/cast", {
      method: "POST",
      body: JSON.stringify({ voterUniqueId, candidateId }),
    });
    return result;
  } catch (error: any) {
    console.error("Cast vote error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all votes
 */
export const getAllVotes = async (): Promise<Vote[]> => {
  try {
    return await apiRequest<Vote[]>("votes");
  } catch (error) {
    console.error("Get all votes error:", error);
    return [];
  }
};

/**
 * Subscribe to vote changes (polling)
 */
export const subscribeToVotes = (
  callback: (votes: Vote[]) => void,
): (() => void) => {
  const interval = setInterval(async () => {
    const votes = await getAllVotes();
    callback(votes);
  }, 5000);

  getAllVotes().then(callback);

  return () => clearInterval(interval);
};

// ============================================
// ADMIN OPERATIONS
// ============================================

/**
 * Get admin by username
 */
export const getAdminByUsername = async (): Promise<Admin | null> => {
  // For login, use the admin login endpoint
  return null;
};

/**
 * Admin login
 */
export const adminLogin = async (
  username: string,
  password: string,
): Promise<{ success: boolean; admin?: Admin; error?: string }> => {
  try {
    const result = await apiRequest<{
      success: boolean;
      id?: string;
      username?: string;
      email?: string;
      error?: string;
    }>("admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (result.success) {
      return {
        success: true,
        admin: {
          id: result.id!,
          username: result.username!,
          email: result.email!,
          passwordHash: "",
          createdAt: Date.now(),
        },
      };
    }

    return { success: false, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const result = await apiRequest<{
      totalRegistered: number;
      totalVoted: number;
      totalCandidates: number;
      sessionStatus: VotingSessionStatus;
    }>("admin/stats");

    const votingProgress =
      result.totalRegistered > 0
        ? Math.round((result.totalVoted / result.totalRegistered) * 100)
        : 0;

    return {
      totalRegistered: result.totalRegistered,
      totalVoted: result.totalVoted,
      totalCandidates: result.totalCandidates,
      sessionStatus: result.sessionStatus,
      votingProgress,
    };
  } catch (error: unknown) {
    console.error("Get dashboard stats error:", error);
    return {
      totalRegistered: 0,
      totalVoted: 0,
      totalCandidates: 0,
      sessionStatus: "pending",
      votingProgress: 0,
    };
  }
};

/**
 * Reset election (clear votes and reset session)
 */
export const resetElection = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const result = await apiRequest<{ success: boolean; message: string }>(
      "admin/session/reset",
      {
        method: "POST",
      },
    );
    return { success: result.success };
  } catch (error: unknown) {
    console.error("Reset election error:", error);
    return { success: false, error: (error as Error).message };
  }
};

/**
 * Create default admin (for initial setup)
 */
export const createDefaultAdmin = async (): Promise<void> => {
  // Admin is created in database.sql
  console.log("Default admin: username=admin, password=admin123");
};

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check API connection
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const result = await apiRequest<{ status: string }>("health");
    return result.status === "ok";
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
};
