/**
 * Public Routes
 */

import express from "express";
import {
  healthCheck,
  validateVoter,
  registerVoterProfile,
  castVote,
  getCandidates,
  getSession,
} from "../controllers/publicController.js";

const router = express.Router();

// Health check
router.get("/health", healthCheck);

// Voter validation
router.post("/voter/validate", validateVoter);

// Voter registration (complete profile)
router.post("/voter/register", registerVoterProfile);

// Cast vote
router.post("/vote", castVote);

// Get candidates
router.get("/candidates", getCandidates);

// Get session status
router.get("/session", getSession);

export default router;
