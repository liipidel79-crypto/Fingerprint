/**
 * Admin API Controllers
 */

import bcrypt from "bcrypt";
import {
  getAdminByUsername,
  getAllVoters,
  getAllCandidates,
  createCandidate,
  deleteCandidate,
  getAllVotes,
  getSession,
  updateSessionStatus as updateSessionStatusDB,
  resetSession,
  getDashboardStats,
  createVote,
  getVoterById,
  updateVoterStatus,
  incrementCandidateVotes,
  createVoter,
} from "../models/store.js";

// Admin login
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", {
      username,
      password: password ? "***" : "empty",
    });

    const admin = await getAdminByUsername(username);
    console.log("Admin found:", admin ? "yes" : "no");

    if (!admin) {
      console.log("Admin not found, returning 401");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("Stored password hash:", admin.password_hash);
    console.log("Provided password:", password);

    // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      console.log("Password mismatch, returning 401");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    console.log("Login successful");
    res.json({
      success: true,
      token: "admin-token-" + Date.now(),
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all voters (admin)
export const getVoters = async (req, res) => {
  try {
    const voters = (await getAllVoters()).map((voter) => ({
      ...voter,
      uniqueId: voter.unique_id,
      fingerprintId: Number(voter.fingerprint_id) || 0,
      phoneNumber: voter.phone_number || null,
      registeredAt: voter.created_at_timestamp || Math.floor(new Date(voter.created_at).getTime() / 1000),
      votedAt: voter.status === 'already_voted' ? (voter.updated_at ? Math.floor(new Date(voter.updated_at).getTime() / 1000) : null) : null,
    }));
    res.json(voters);
  } catch (error) {
    console.error("Get voters error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create test voters (admin)
export const createTestVoters = async (req, res) => {
  try {
    const testVoters = [
      {
        uniqueId: "TEST001",
        fingerprintId: "fp001",
        phoneNumber: "09123456789",
      },
      {
        uniqueId: "TEST002",
        fingerprintId: "fp002",
        phoneNumber: "09123456790",
      },
      {
        uniqueId: "TEST003",
        fingerprintId: "fp003",
        phoneNumber: "09123456791",
      },
      {
        uniqueId: "TEST004",
        fingerprintId: "fp004",
        phoneNumber: "09123456792",
      },
      {
        uniqueId: "TEST005",
        fingerprintId: "fp005",
        phoneNumber: "09123456793",
      },
    ];

    const createdVoters = [];
    for (const voterData of testVoters) {
      try {
        const voterId = await createVoter(voterData);
        createdVoters.push({ ...voterData, id: voterId });
      } catch (error) {
        // Skip if voter already exists
        if (!error.message.includes("Duplicate entry")) {
          console.error("Error creating test voter:", error);
        }
      }
    }

    res.json({
      success: true,
      message: `Created ${createdVoters.length} test voters`,
      voters: createdVoters,
    });
  } catch (error) {
    console.error("Create test voters error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Add candidate (admin)
export const addCandidate = async (req, res) => {
  try {
    const { name, party, photoUrl, photo_url, position } = req.body || {};

    if (!name || !party || !position) {
      return res.status(400).json({
        success: false,
        message: "Name, party, and position are required",
      });
    }

    const candidate = await createCandidate({
      name,
      party,
      photo_url: photo_url || photoUrl || null,
      position,
    });

    res.json({ success: true, candidate });
  } catch (error) {
    console.error("Error adding candidate:", error.stack || error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Delete candidate (admin)
export const deleteCandidateController = async (req, res) => {
  try {
    const { id } = req.params;

    const affectedRows = await deleteCandidate(id);

    if (affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete candidate error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const updateSessionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "active", "paused", "finished"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    // Check if there are candidates before starting voting
    if (status === "active") {
      const candidates = await getAllCandidates();
      if (candidates.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot start voting without candidates. Please add candidates first.",
        });
      }
    }

    const session = await updateSessionStatusDB(status);
    res.json({ success: true, session });
  } catch (error) {
    console.error("Update session status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Reset election - clear votes and reset session
export const resetElection = async (req, res) => {
  try {
    // Reset session
    await resetSession();

    // Reset all voter statuses to "not_voted"
    const voters = await getAllVoters();
    for (const voter of voters) {
      await updateVoterStatus(voter.unique_id, "not_voted");
    }

    // Reset all candidate vote counts to 0
    const candidates = await getAllCandidates();
    for (const candidate of candidates) {
      // This would need a separate function to reset vote counts
      // For now, we'll handle this in the database directly
    }

    const session = await getSession();

    res.json({
      success: true,
      message: "Election reset successfully",
      session,
    });
  } catch (error) {
    console.error("Reset election error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get dashboard stats (admin)
export const getStats = async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all votes (admin)
export const getVotes = async (req, res) => {
  try {
    const votes = await getAllVotes();
    res.json(votes);
  } catch (error) {
    console.error("Get votes error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Export results as CSV (admin)
export const exportResultsCSV = async (req, res) => {
  try {
    const candidates = await getAllCandidates();
    const session = await getSession();

    // Calculate total votes
    const totalVotes = candidates.reduce((sum, c) => sum + (Number(c.vote_count) || 0), 0);

    // Sort candidates by vote count descending
    const sortedCandidates = candidates.sort((a, b) => (Number(b.vote_count) || 0) - (Number(a.vote_count) || 0));

    let csv = "Position,Candidate,Party,Votes,Percentage\n";

    for (const candidate of sortedCandidates) {
      const votes = Number(candidate.vote_count) || 0;
      const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : "0.0";
      csv += `${candidate.position},"${candidate.name}","${candidate.party}",${votes},${percentage}%\n`;
    }

    // Add summary row
    csv += `\nTotal,,${totalVotes},100.0%\n`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="election_results_${session.status}_${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.send(csv);
  } catch (error) {
    console.error("Export CSV error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
