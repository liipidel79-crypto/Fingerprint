/**
 * Database Models
 * MySQL Database Operations
 */

import {
  executeQuery,
  getRow,
  getRows,
  insertRow,
  updateRows,
} from "./database.js";

// ============================================
// ADMIN OPERATIONS
// ============================================

export const getAdminByUsername = async (username) => {
  const query = "SELECT * FROM admins WHERE username = ?";
  return await getRow(query, [username]);
};

export const createAdmin = async (adminData) => {
  const { username, email, password_hash } = adminData;
  const created_at = new Date();
  const created_at_timestamp = Math.floor(created_at.getTime() / 1000);

  const query = `
    INSERT INTO admins (username, email, password_hash, created_at, created_at_timestamp)
    VALUES (?, ?, ?, ?, ?)
  `;
  const id = await insertRow(query, [
    username,
    email,
    password_hash,
    created_at,
    created_at_timestamp,
  ]);
  return { id, ...adminData, created_at, created_at_timestamp };
};

// ============================================
// VOTER OPERATIONS
// ============================================

export const getAllVoters = async () => {
  const query = "SELECT * FROM voters ORDER BY created_at DESC";
  return await getRows(query);
};

export const getVoterById = async (uniqueId) => {
  const query = "SELECT * FROM voters WHERE unique_id = ?";
  return await getRow(query, [uniqueId]);
};

export const getVoterByFingerprint = async (fingerprintId) => {
  const query = "SELECT * FROM voters WHERE fingerprint_id = ?";
  return await getRow(query, [fingerprintId]);
};

export const createVoter = async (voterData) => {
  const { fingerprintId, uniqueId, phoneNumber } = voterData;
  const created_at = new Date();
  const created_at_timestamp = Math.floor(created_at.getTime() / 1000);

  const query = `
    INSERT INTO voters (
      fingerprint_id,
      unique_id,
      phone_number,
      name,
      section,
      age,
      gender,
      status,
      is_registered,
      created_at,
      created_at_timestamp
    )
    VALUES (?, ?, ?, NULL, NULL, NULL, NULL, 'not_voted', FALSE, ?, ?)
  `;
  const id = await insertRow(query, [
    fingerprintId,
    uniqueId,
    phoneNumber || null,
    created_at,
    created_at_timestamp,
  ]);
  return {
    id,
    ...voterData,
    name: null,
    section: null,
    age: null,
    gender: null,
    status: "not_voted",
    is_registered: false,
    created_at,
    created_at_timestamp,
  };
};

export const registerVoter = async (uniqueId, voterData) => {
  const { name, section, age, gender } = voterData;
  const query = `
    UPDATE voters
    SET name = ?, section = ?, age = ?, gender = ?, is_registered = TRUE, updated_at = NOW()
    WHERE unique_id = ?
  `;
  await updateRows(query, [name, section, age, gender, uniqueId]);
  const updatedVoter = await getVoterById(uniqueId);
  return updatedVoter;
};

export const updateVoterStatus = async (uniqueId, status) => {
  const query = "UPDATE voters SET status = ? WHERE unique_id = ?";
  return await updateRows(query, [status, uniqueId]);
};

export const storeFingerScan = async (scanData) => {
  const { voterId, fingerprintId, quality, matchScore } = scanData;
  const scanned_at = new Date();
  const scanned_at_timestamp = Math.floor(scanned_at.getTime() / 1000);

  const query = `
    INSERT INTO finger_scans (voter_id, fingerprint_id, quality, match_score, scanned_at, scanned_at_timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const id = await insertRow(query, [
    voterId,
    fingerprintId,
    quality,
    matchScore,
    scanned_at,
    scanned_at_timestamp,
  ]);
  return id;
};

// ============================================
// CANDIDATE OPERATIONS
// ============================================

export const getAllCandidates = async () => {
  const query = "SELECT * FROM candidates ORDER BY created_at DESC";
  return await getRows(query);
};

export const getCandidateById = async (id) => {
  const query = "SELECT * FROM candidates WHERE id = ?";
  return await getRow(query, [id]);
};

export const createCandidate = async (candidateData) => {
  const { name, party, photo_url, position } = candidateData;
  const created_at = new Date();
  const created_at_timestamp = Math.floor(created_at.getTime() / 1000);

  const query = `
    INSERT INTO candidates (name, party, photo_url, position, vote_count, created_at, created_at_timestamp)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `;
  const id = await insertRow(query, [
    name,
    party,
    photo_url || null,
    position,
    created_at,
    created_at_timestamp,
  ]);
  return {
    id,
    ...candidateData,
    vote_count: 0,
    created_at,
    created_at_timestamp,
  };
};

export const deleteCandidate = async (id) => {
  const query = "DELETE FROM candidates WHERE id = ?";
  return await updateRows(query, [id]);
};

export const incrementCandidateVotes = async (candidateId) => {
  const query =
    "UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?";
  return await updateRows(query, [candidateId]);
};

// ============================================
// VOTE OPERATIONS
// ============================================

export const getAllVotes = async () => {
  const query = `
    SELECT v.*, c.name as candidate_name, c.party as candidate_party
    FROM votes v
    JOIN candidates c ON v.candidate_id = c.id
    ORDER BY v.created_at DESC
  `;
  return await getRows(query);
};

export const createVote = async (voteData) => {
  const { voter_unique_id, candidate_id } = voteData;
  const created_at = new Date();
  const created_at_timestamp = Math.floor(created_at.getTime() / 1000);

  const query = `
    INSERT INTO votes (voter_unique_id, candidate_id, created_at, created_at_timestamp)
    VALUES (?, ?, ?, ?)
  `;
  const id = await insertRow(query, [
    voter_unique_id,
    candidate_id,
    created_at,
    created_at_timestamp,
  ]);
  return { id, ...voteData, created_at, created_at_timestamp };
};

export const getVotesByVoter = async (voterUniqueId) => {
  const query = "SELECT * FROM votes WHERE voter_unique_id = ?";
  return await getRows(query, [voterUniqueId]);
};

// ============================================
// SESSION OPERATIONS
// ============================================

export const getSession = async () => {
  const query = "SELECT * FROM sessions WHERE id = 1"; // Assuming single session
  const session = await getRow(query);

  if (!session) {
    // Create default session if not exists
    return await createDefaultSession();
  }

  return session;
};

export const createDefaultSession = async () => {
  const created_at = new Date();

  const query = `
    INSERT INTO sessions (id, status, title, description, created_at, updated_at)
    VALUES (1, 'pending', 'General Election', 'Main voting session', ?, ?)
  `;
  await insertRow(query, [created_at, created_at]);
  return await getSession();
};

export const updateSessionStatus = async (status) => {
  const updated_at = new Date();

  let query = "UPDATE sessions SET status = ?, updated_at = ?";
  const params = [status, updated_at];

  if (status === "active") {
    query += ", start_time = ?";
    params.push(updated_at);
  } else if (status === "finished") {
    query += ", end_time = ?";
    params.push(updated_at);
  }

  query += " WHERE id = 1";
  await updateRows(query, params);
  return await getSession();
};

export const resetSession = async () => {
  const updated_at = new Date();

  const query = `
    UPDATE sessions
    SET status = 'pending',
        start_time = NULL,
        end_time = NULL,
        updated_at = ?
    WHERE id = 1
  `;
  await updateRows(query, [updated_at]);
  return await getSession();
};

// ============================================
// DASHBOARD STATS
// ============================================

export const getDashboardStats = async () => {
  // Get total registered voters
  const totalRegisteredQuery = "SELECT COUNT(*) as count FROM voters";
  const totalRegisteredResult = await getRow(totalRegisteredQuery);
  const totalRegistered = totalRegisteredResult.count;

  // Get total voted
  const totalVotedQuery =
    'SELECT COUNT(*) as count FROM voters WHERE status = "already_voted"';
  const totalVotedResult = await getRow(totalVotedQuery);
  const totalVoted = totalVotedResult.count;

  // Get total candidates
  const totalCandidatesQuery = "SELECT COUNT(*) as count FROM candidates";
  const totalCandidatesResult = await getRow(totalCandidatesQuery);
  const totalCandidates = totalCandidatesResult.count;

  // Get session status
  const session = await getSession();
  const sessionStatus = session.status;

  // Calculate voting progress
  const votingProgress =
    totalRegistered > 0 ? Math.round((totalVoted / totalRegistered) * 100) : 0;

  return {
    totalRegistered,
    totalVoted,
    totalCandidates,
    sessionStatus,
    votingProgress,
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const generateVoterId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "VOT-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
