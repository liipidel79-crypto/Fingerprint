/**
 * Hardware (ESP32) API Controllers
 */

import {
  getVoterByFingerprint,
  createVoter,
  generateVoterId,
  storeFingerScan,
} from "../models/store.js";
import { io } from "../app.js";

// Register voter from ESP32
export const registerVoter = async (req, res) => {
  try {
    const { fingerprintId, phoneNumber } = req.body;

    if (!fingerprintId) {
      return res.status(400).json({
        success: false,
        uniqueId: "",
        message: "Fingerprint ID is required",
      });
    }

    // Check if fingerprint already registered
    const existingVoter = await getVoterByFingerprint(fingerprintId);
    if (existingVoter) {
      return res.json({
        success: false,
        uniqueId: existingVoter.unique_id,
        message: "Fingerprint already registered",
      });
    }

    // Generate unique voter ID
    const uniqueId = generateVoterId();

    const voter = await createVoter({
      fingerprintId,
      uniqueId,
      phoneNumber,
    });

    res.json({
      success: true,
      uniqueId,
      message: "Registration successful! Your Voter ID: " + uniqueId,
    });

    // Emit notification to all connected clients
    io.emit('newUserRegistered', {
      message: 'New user registered',
      voter: {
        uniqueId,
        fingerprintId,
      },
    });
    console.log('Emitted newUserRegistered event for voter:', uniqueId);
  } catch (error) {
    console.error("Error registering voter:", error);
    res.status(500).json({
      success: false,
      uniqueId: "",
      message: "Server error",
    });
  }
};

// Check if fingerprint is already enrolled
export const checkFingerprint = async (req, res) => {
  try {
    const { fingerprintId } = req.body;

    const voter = await getVoterByFingerprint(fingerprintId);

    if (voter) {
      return res.json({
        enrolled: true,
        uniqueId: voter.unique_id,
      });
    }

    res.json({ enrolled: false, uniqueId: null });
  } catch (error) {
    console.error("Error checking fingerprint:", error);
    res.status(500).json({ enrolled: false, uniqueId: null });
  }
};

// Scan and store fingerprint data from Arduino
export const scanFingerprint = async (req, res) => {
  try {
    const { fingerprintId, quality, matchScore } = req.body;

    if (!fingerprintId) {
      return res.status(400).json({
        success: false,
        message: "Fingerprint ID is required",
      });
    }

    let voter = await getVoterByFingerprint(fingerprintId);
    let newlyCreated = false;

    if (!voter) {
      const uniqueId = generateVoterId();
      await createVoter({
        fingerprintId,
        uniqueId,
        phoneNumber: null,
      });

      // Re-fetch the inserted voter row so we have the actual DB values
      voter = await getVoterByFingerprint(fingerprintId);
      newlyCreated = true;
    }

    const scanData = {
      voterId: voter.id,
      fingerprintId,
      quality: quality || null,
      matchScore: matchScore || null,
    };

    await storeFingerScan(scanData);

    res.json({
      success: true,
      voterFound: !newlyCreated,
      newlyCreated,
      voterData: {
        unique_id: voter.unique_id,
        name: voter.name || null,
        is_registered: voter.is_registered,
      },
      message: newlyCreated
        ? "Fingerprint recorded. Please complete the profile registration."
        : "Fingerprint scanned successfully",
    });
  } catch (error) {
    console.error("Error scanning fingerprint:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing fingerprint scan",
    });
  }
};
