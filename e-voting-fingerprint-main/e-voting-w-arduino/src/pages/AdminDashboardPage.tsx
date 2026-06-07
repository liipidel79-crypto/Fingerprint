/**
 * Admin Dashboard Page
 * Complete dashboard for managing the election
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Vote,
  BarChart3,
  Settings,
  Play,
  Pause,
  StopCircle,
  RotateCcw,
  Plus,
  Trash2,
  LogOut,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
} from "lucide-react";
import { useAuthStore, useAdminStore } from "../store/votingStore";
import type { VotingSessionStatus } from "../types/voting";
import { io } from "socket.io-client";

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const {
    voters,
    candidates,
    session,
    stats,
    error,
    fetchVoters,
    fetchCandidates,
    fetchSession,
    fetchStats,
    addCandidate,
    deleteCandidate,
    updateSessionStatus,
    resetElection,
    createTestVoters,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState<
    "overview" | "voters" | "candidates" | "results"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    party: "",
    position: "",
  });
  const [addingCandidate, setAddingCandidate] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`Copied: ${text}`);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`Copied: ${text}`);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin");
    }
  }, [navigate]);

  // Fetch data on mount
  useEffect(() => {
    fetchVoters();
    fetchCandidates();
    fetchSession();
    fetchStats();

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchStats();
      fetchVoters();
      fetchCandidates();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Socket.IO for real-time notifications
  useEffect(() => {
    const socket = io('http://localhost:3000'); // Adjust URL if needed

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('newUserRegistered', (data) => {
      console.log('Received newUserRegistered event:', data);
      setNotification(data.message);
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleStatusChange = async (status: VotingSessionStatus) => {
    const success = await updateSessionStatus(status);
    if (!success) {
      alert("Failed to update session status. Please try again.");
    }
  };

  const handleResetElection = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset the election? This will clear all votes and reset the session.",
      )
    ) {
      await resetElection();
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.party || !newCandidate.position)
      return;

    setAddingCandidate(true);
    const success = await addCandidate(newCandidate);
    setAddingCandidate(false);

    if (success) {
      setShowAddCandidate(false);
      setNewCandidate({ name: "", party: "", position: "" });
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/admin/results/csv`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `election_results_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export CSV error:", error);
      alert("Failed to export CSV. Please try again.");
    }
  };

  const filteredVoters = voters.filter(
    (v) =>
      (v.uniqueId &&
        v.uniqueId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.status && v.status.toLowerCase?.().includes(searchTerm.toLowerCase())),
  );

  const getStatusColor = (status: VotingSessionStatus) => {
    switch (status) {
      case "active":
        return "bg-emerald-500";
      case "paused":
        return "bg-amber-500";
      case "finished":
        return "bg-red-500";
      default:
        return "bg-slate-500";
    }
  };

  const getStatusText = (status: VotingSessionStatus) => {
    switch (status) {
      case "active":
        return "Active";
      case "paused":
        return "Paused";
      case "finished":
        return "Finished";
      default:
        return "Pending";
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "voters", label: "Voters", icon: Users },
    { id: "candidates", label: "Candidates", icon: Vote },
    { id: "results", label: "Results", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">Manage your election</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              fetchVoters();
              fetchCandidates();
              fetchStats();
            }}
            className="p-2 bg-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400">{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Session Control */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(session?.status || "pending")}`}
            />
            <div>
              <h3 className="text-white font-semibold">
                {session?.title || "Election"}
              </h3>
              <p className="text-slate-400 text-sm">
                Status: {getStatusText(session?.status || "pending")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {session?.status !== "active" && session?.status !== "finished" && (
              <button
                onClick={() => handleStatusChange("active")}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
            )}

            {session?.status === "active" && (
              <button
                onClick={() => handleStatusChange("paused")}
                className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}

            {session?.status === "paused" && (
              <button
                onClick={() => handleStatusChange("active")}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
            )}

            {session?.status !== "finished" && (
              <button
                onClick={() => handleStatusChange("finished")}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop</span>
              </button>
            )}

            {session?.status === "finished" && (
              <button
                onClick={handleResetElection}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Election</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-700/50 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid md:grid-cols-4 gap-4"
          >
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-cyan-400" />
                <span className="text-2xl font-bold text-white">
                  {stats?.totalRegistered || 0}
                </span>
              </div>
              <p className="text-slate-400 text-sm">Total Registered</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Vote className="w-8 h-8 text-emerald-400" />
                <span className="text-2xl font-bold text-white">
                  {stats?.totalVoted || 0}
                </span>
              </div>
              <p className="text-slate-400 text-sm">Total Voted</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">
                  {stats?.totalCandidates || 0}
                </span>
              </div>
              <p className="text-slate-400 text-sm">Candidates</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Settings className="w-8 h-8 text-amber-400" />
                <span className="text-2xl font-bold text-white">
                  {stats?.votingProgress || 0}%
                </span>
              </div>
              <p className="text-slate-400 text-sm">Voting Progress</p>
            </div>

            {/* Progress Bar */}
            <div className="md:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Voter Turnout</span>
                <span className="text-slate-400">
                  {stats?.totalVoted || 0} / {stats?.totalRegistered || 0}
                </span>
              </div>
              <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats?.votingProgress || 0}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Voters Tab */}
        {activeTab === "voters" && (
          <motion.div
            key="voters"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search voters..."
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Create Test Voters Button */}
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  const success = await createTestVoters();
                  if (success) {
                    alert("Test voters created successfully!");
                  } else {
                    alert("Failed to create test voters. Please try again.");
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Test Voters</span>
              </button>
            </div>

            {/* Voters List */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/30">
                    <tr>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">
                        Voter ID
                      </th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">
                        Fingerprint ID
                      </th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">
                        Name
                      </th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">
                        Section
                      </th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">
                        Age / Gender
                      </th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-slate-400 font-medium">
                        Voted At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVoters.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-slate-400"
                        >
                          No voters found
                        </td>
                      </tr>
                    ) : (
                      filteredVoters.map((voter) => {
                        const voterId = voter.uniqueId;
                        const fingerprintId = String(voter.fingerprintId);
                        return (
                          <tr
                            key={voter.id}
                            className="border-t border-slate-700/50"
                          >
                            <td className="px-6 py-4">
                              <span className="font-mono text-white text-sm">
                                {voterId}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-cyan-400 text-sm bg-slate-700/50 px-2 py-1 rounded">
                                  {fingerprintId}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(fingerprintId)}
                                  className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-600/50 rounded transition-colors"
                                  title="Copy Fingerprint ID"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {voter.name || (
                                <span className="text-slate-500">
                                  Not registered
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {voter.section || "-"}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {voter.age ? `${voter.age} / ${voter.gender}` : "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  voter.status === "already_voted"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-slate-600/50 text-slate-300"
                                }`}
                              >
                                {voter.status === "already_voted"
                                  ? "Voted"
                                  : "Not Voted"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {voter.votedAt
                                ? new Date(voter.votedAt).toLocaleDateString()
                                : "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Candidates Tab */}
        {activeTab === "candidates" && (
          <motion.div
            key="candidates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Add Candidate Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddCandidate(!showAddCandidate)}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Candidate</span>
              </button>
            </div>

            {/* Add Candidate Form */}
            <AnimatePresence>
              {showAddCandidate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
                >
                  <form onSubmit={handleAddCandidate} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={newCandidate.name}
                          onChange={(e) =>
                            setNewCandidate({
                              ...newCandidate,
                              name: e.target.value,
                            })
                          }
                          placeholder="Candidate name"
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Party
                        </label>
                        <input
                          type="text"
                          value={newCandidate.party}
                          onChange={(e) =>
                            setNewCandidate({
                              ...newCandidate,
                              party: e.target.value,
                            })
                          }
                          placeholder="Party/Organization"
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Position
                        </label>
                        <input
                          type="text"
                          value={newCandidate.position}
                          onChange={(e) =>
                            setNewCandidate({
                              ...newCandidate,
                              position: e.target.value,
                            })
                          }
                          placeholder="Position"
                          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAddCandidate(false)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingCandidate}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        {addingCandidate ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        <span>Add</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Candidates Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {candidate.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {candidate.name}
                        </h3>
                        <p className="text-emerald-400 text-sm">
                          {candidate.party}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCandidate(candidate.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">
                    {candidate.position}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Votes</span>
                    <span className="text-2xl font-bold text-white">
                      {candidate.voteCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Results Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700/30">
                  <tr>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">
                      Candidate
                    </th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">
                      Party
                    </th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">
                      Position
                    </th>
                    <th className="text-right px-6 py-4 text-slate-400 font-medium">
                      Votes
                    </th>
                    <th className="text-right px-6 py-4 text-slate-400 font-medium">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidates
                    .sort((a, b) =>
                      (Number(b.voteCount) || 0) - (Number(a.voteCount) || 0),
                    )
                    .map((candidate, index) => {
                      const totalVotes = candidates.reduce(
                        (sum, c) => sum + (Number(c.voteCount) || 0),
                        0,
                      );
                      const percentage =
                        totalVotes > 0
                          ? (
                              ((Number(candidate.voteCount) || 0) / totalVotes) *
                              100
                            ).toFixed(1)
                          : "0";
                      const isWinner =
                        index === 0 && (Number(candidate.voteCount) || 0) > 0;

                      return (
                        <tr
                          key={candidate.id}
                          className="border-t border-slate-700/50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {isWinner && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              )}
                              <span
                                className={`font-semibold ${isWinner ? "text-emerald-400" : "text-white"}`}
                              >
                                {candidate.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {candidate.party}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {candidate.position}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-white font-bold">
                              {candidate.voteCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-slate-300">
                              {percentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Winner Announcement */}
            {session?.status === "finished" && candidates.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Winner</h3>
                <p className="text-3xl font-bold text-white">
                  {
                    candidates.reduce((prev, current) =>
                      prev.voteCount > current.voteCount ? prev : current,
                    ).name
                  }
                </p>
                <p className="text-emerald-100 mt-2">
                  {
                    candidates.reduce((prev, current) =>
                      prev.voteCount > current.voteCount ? prev : current,
                    ).voteCount
                  }{" "}
                  votes
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboardPage;
