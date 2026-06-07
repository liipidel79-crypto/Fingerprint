/**
 * Admin Routes (Protected)
 */

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  adminLogin,
  getVoters,
  addCandidate,
  deleteCandidateController,
  updateSessionStatus,
  resetElection,
  getStats,
  getVotes,
  exportResultsCSV,
  createTestVoters,
} from "../controllers/AdminController.js";
import { getCandidates, getSession } from "../controllers/publicController.js";

const router = express.Router();

// Public admin route (login)
router.post("/login", adminLogin);

// Protected admin routes
router.get("/voters", requireAuth, getVoters);
router.post("/voters/test", requireAuth, createTestVoters);
router.get("/candidates", requireAuth, getCandidates);
router.post("/candidates", requireAuth, addCandidate);
router.delete("/candidates/:id", requireAuth, deleteCandidateController);
router.get("/session", requireAuth, getSession);
router.post("/session/status", requireAuth, updateSessionStatus);
router.post("/session/reset", requireAuth, resetElection);
router.get("/stats", requireAuth, getStats);
router.get("/votes", requireAuth, getVotes);
router.get("/results/csv", requireAuth, exportResultsCSV);

export default router;
