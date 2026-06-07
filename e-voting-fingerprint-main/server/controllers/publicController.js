/**
 * Public API Controllers
 */

import {
  getVoterById,
  getAllCandidates,
  getSession as getSessionDB,
  createVote,
  updateVoterStatus,
  incrementCandidateVotes,
  registerVoter,
  generateVoterId,
} from "../models/store.js";
import { io } from "../app.js";

const normalizeVoter = (voter) => {
  if (!voter) return null;
  return {
    ...voter,
    uniqueId: voter.unique_id,
    fingerprintId: voter.fingerprint_id,
    phoneNumber: voter.phone_number,
    isRegistered: voter.is_registered,
  };
};

// Health check
export const healthCheck = (req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    service: "VoteSecure API",
  });
};

// Validate voter ID (check if registered)
export const validateVoter = async (req, res) => {
  try {
    const { uniqueId } = req.body;

    if (!uniqueId) {
      return res.status(400).json({
        valid: false,
        message: "Voter ID is required",
      });
    }

    const voter = normalizeVoter(await getVoterById(uniqueId));

    if (!voter) {
      return res.json({
        valid: false,
        message: "Invalid Voter ID",
      });
    }

    if (voter.status === "already_voted") {
      return res.json({
        valid: false,
        voter,
        message: "You have already voted",
      });
    }

    const session = await getSessionDB();
    if (session.status !== "active") {
      return res.json({
        valid: false,
        voter,
        message: "Voting is not active",
      });
    }

    // Check if voter is registered
    if (!voter.isRegistered) {
      return res.json({
        valid: true,
        voter,
        needsRegistration: true,
        message: "Please complete your profile first",
      });
    }

    res.json({
      valid: true,
      voter,
      needsRegistration: false,
      message: "Valid voter ID",
    });
  } catch (error) {
    console.error("Error validating voter:", error);
    res.status(500).json({
      valid: false,
      message: "Server error",
    });
  }
};

// Register voter (update profile)
export const registerVoterProfile = async (req, res) => {
  try {
    const { uniqueId, name, section, age, gender } = req.body;

    // Trim string fields and check for empty values
    const trimmedName = name ? String(name).trim() : "";
    const trimmedSection = section ? String(section).trim() : "";
    const trimmedGender = gender ? String(gender).trim() : "";
    const ageNum = age !== undefined && age !== null ? parseInt(age) : NaN;

    if (
      !uniqueId ||
      !trimmedName ||
      !trimmedSection ||
      isNaN(ageNum) ||
      ageNum <= 0 ||
      !trimmedGender
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and age must be a positive number",
      });
    }

    const voter = normalizeVoter(await getVoterById(uniqueId));
    if (!voter) {
      return res.json({
        success: false,
        message: "Invalid Voter ID",
      });
    }

    const updatedVoter = normalizeVoter(
      await registerVoter(uniqueId, {
        name: trimmedName,
        section: trimmedSection,
        age: ageNum,
        gender: trimmedGender,
      }),
    );

    res.json({
      success: true,
      voter: updatedVoter,
      message: "Profile completed successfully",
    });

    // Emit notification to all connected clients
    io.emit('newUserRegistered', {
      message: 'New user registered',
      voter: {
        name: updatedVoter.name,
        section: updatedVoter.section,
      },
    });
  } catch (error) {
    console.error("Error registering voter:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Cast vote
export const castVote = async (req, res) => {
  try {
    const { uniqueId, candidateIds } = req.body;

    if (!uniqueId || !candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Voter ID and Candidate IDs array are required",
      });
    }

    const voter = normalizeVoter(await getVoterById(uniqueId));

    if (!voter) {
      return res.json({
        success: false,
        message: "Invalid Voter ID",
      });
    }

    if (voter.status === "already_voted") {
      return res.json({
        success: false,
        message: "You have already voted",
      });
    }

    if (!voter.isRegistered) {
      return res.json({
        success: false,
        message: "Please complete your profile registration first",
      });
    }

    const session = await getSessionDB();
    if (session.status !== "active") {
      return res.json({
        success: false,
        message: "Voting is not active",
      });
    }

    // Check if all candidates exist
    const candidates = await getAllCandidates();
    const invalidCandidates = candidateIds.filter(candidateId => 
      !candidates.find(c => String(c.id) === String(candidateId))
    );

    if (invalidCandidates.length > 0) {
      return res.json({
        success: false,
        message: "Invalid candidate(s) selected",
      });
    }

    // Record votes for all candidates
    for (const candidateId of candidateIds) {
      await createVote({
        voter_unique_id: uniqueId,
        candidate_id: candidateId,
      });
      await incrementCandidateVotes(candidateId);
    }

    // Update voter status to already_voted
    await updateVoterStatus(uniqueId, "already_voted");

    res.json({
      success: true,
      message: "Votes cast successfully! Salamat! / Thank you!",
    });
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get candidates (public)
export const getCandidates = async (req, res) => {
  try {
    const candidates = (await getAllCandidates()).map((candidate) => ({
      ...candidate,
      voteCount: Number(candidate.vote_count ?? candidate.voteCount ?? 0),
      photoUrl: candidate.photo_url ?? candidate.photoUrl ?? "",
      createdAt: candidate.created_at ?? candidate.createdAt ?? null,
    }));
    res.json(candidates);
  } catch (error) {
    console.error("Error getting candidates:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get session status (public)
export const getSession = async (req, res) => {
  try {
    const session = await getSessionDB();
    res.json(session);
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
