/**
 * Hardware (ESP32) Routes
 */

import express from "express";
import {
  registerVoter,
  checkFingerprint,
  scanFingerprint,
} from "../controllers/hardwareController.js";

const router = express.Router();

// Register voter from hardware
router.post("/register", registerVoter);

// Check fingerprint enrollment
router.post("/check-fingerprint", checkFingerprint);

// Scan and store fingerprint data from Arduino
router.post("/scan", scanFingerprint);

export default router;
