/**
 * Voting System Type Definitions
 * Complete type definitions for the fingerprint-based voting system
 */

// ============================================
// ENUMS
// ============================================

export type VotingSessionStatus = "pending" | "active" | "paused" | "finished";

export type VoterStatus = "not_voted" | "already_voted";

// ============================================
// CORE INTERFACES
// ============================================

/**
 * Registered Voter - stored in database
 */
export interface Voter {
  id: string;
  uniqueId: string; // Generated unique voter ID (e.g., "VOT-7K9M2P4Q")
  fingerprintId: number; // AS608 fingerprint template ID
  phoneNumber?: string; // Optional phone for SMS notification
  name?: string; // Voter full name
  section?: string; // Voter section/class
  age?: number; // Voter age
  gender?: string; // Voter gender
  is_registered?: boolean; // Whether voter completed profile
  status: VoterStatus;
  registeredAt: number; // Unix timestamp
  votedAt?: number; // Unix timestamp when voted
}

/**
 * Candidate for election
 */
export interface Candidate {
  id: string;
  name: string;
  party: string;
  photoUrl?: string;
  position: string;
  voteCount: number;
  createdAt: number;
}

/**
 * Voting session - controls the election
 */
export interface VotingSession {
  id: string;
  status: VotingSessionStatus;
  title: string;
  description?: string;
  startTime?: number;
  endTime?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Individual vote record (for audit)
 */
export interface Vote {
  id: string;
  voterId: string;
  candidateId: string;
  votedAt: number;
}

/**
 * Admin user for dashboard access
 */
export interface Admin {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: number;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

/**
 * Request to validate voter ID
 */
export interface ValidateVoterRequest {
  uniqueId: string;
}

/**
 * Response for voter validation
 */
export interface ValidateVoterResponse {
  valid: boolean;
  voter?: Voter;
  message: string;
}

/**
 * Request to cast a vote
 */
export interface CastVoteRequest {
  uniqueId: string;
  candidateId: string;
}

/**
 * Response for vote casting
 */
export interface CastVoteResponse {
  success: boolean;
  message: string;
}

/**
 * Request to register a new voter (from ESP32)
 */
export interface RegisterVoterRequest {
  fingerprintId: number;
  phoneNumber?: string;
}

/**
 * Response for voter registration
 */
export interface RegisterVoterResponse {
  success: boolean;
  uniqueId: string;
  message: string;
}

/**
 * Request to add a candidate
 */
export interface AddCandidateRequest {
  name: string;
  party: string;
  photoUrl?: string;
  position: string;
}

/**
 * Request to update session status
 */
export interface UpdateSessionRequest {
  status: VotingSessionStatus;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalRegistered: number;
  totalVoted: number;
  totalCandidates: number;
  sessionStatus: VotingSessionStatus;
  votingProgress: number;
}

// ============================================
// REAL-TIME SUBSCRIPTION TYPES
// ============================================

export interface RealtimeVotersUpdate {
  type: "voters";
  data: Voter[];
}

export interface RealtimeCandidatesUpdate {
  type: "candidates";
  data: Candidate[];
}

export interface RealtimeSessionUpdate {
  type: "session";
  data: VotingSession;
}

export interface RealtimeVotesUpdate {
  type: "votes";
  data: Vote[];
}

export type RealtimeUpdate =
  | RealtimeVotersUpdate
  | RealtimeCandidatesUpdate
  | RealtimeSessionUpdate
  | RealtimeVotesUpdate;

// ============================================
// UI STATE TYPES
// ============================================

export interface AuthState {
  isAuthenticated: boolean;
  admin: Admin | null;
  loading: boolean;
}

export interface VotingState {
  currentVoter: Voter | null;
  candidates: Candidate[];
  session: VotingSession | null;
  loading: boolean;
  error: string | null;
}

// ============================================
// FORM TYPES
// ============================================

export interface LoginFormData {
  username: string;
  password: string;
}

export interface CandidateFormData {
  name: string;
  party: string;
  position: string;
  photoUrl?: string;
}

// ============================================
// ESP32 HARDWARE TYPES
// ============================================

/**
 * ESP32 hardware configuration
 */
export interface ESP32Config {
  wifiSsid: string;
  wifiPassword: string;
  firebaseProjectId: string;
  firebaseApiKey: string;
  firebaseDatabaseUrl: string;
  apiBaseUrl: string;
}

/**
 * Hardware pin mappings for ESP32
 */
export interface HardwarePins {
  fingerprintRx: number; // GPIO pin for fingerprint sensor RX
  fingerprintTx: number; // GPIO pin for fingerprint sensor TX
  sim900lRx: number; // GPIO pin for SIM900L RX
  sim900lTx: number; // GPIO pin for SIM900L TX
  lcdSda: number; // GPIO pin for LCD I2C SDA
  lcdScl: number; // GPIO pin for LCD I2C SCL
}

// Default pin configuration for ESP32
export const DEFAULT_HARDWARE_PINS: HardwarePins = {
  fingerprintRx: 16,
  fingerprintTx: 17,
  sim900lRx: 4,
  sim900lTx: 2,
  lcdSda: 21,
  lcdScl: 22,
};
