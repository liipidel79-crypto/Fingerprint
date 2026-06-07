/**
 * Voting Page
 * Public page for casting votes
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Fingerprint,
  User,
} from "lucide-react";

import { useVotingStore } from "../store/votingStore";

const VotingPage: React.FC = () => {
  const [voterId, setVoterId] = useState("");
  const [registrationData, setRegistrationData] = useState({
    name: "",
    section: "",
    age: "",
    gender: "",
  });

  const [registering, setRegistering] = useState(false);

  const {
    currentVoter,
    candidates,
    session,
    loading,
    error,
    voteSuccess,
    needsRegistration,
    validateVoter,
    registerVoter,
    castVote,
    fetchCandidates,
    fetchSession,
    resetVoting,
  } = useVotingStore();

  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const [voting, setVoting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidates();
    fetchSession();
  }, []);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voterId.trim()) return;

    await validateVoter(voterId.trim().toUpperCase());
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = registrationData.name?.trim() || "";
    const section = registrationData.section?.trim() || "";
    const age = parseInt(registrationData.age);
    const gender = registrationData.gender?.trim() || "";

    if (
      !currentVoter ||
      !name ||
      !section ||
      isNaN(age) ||
      age <= 0 ||
      !gender
    ) {
      return;
    }

    setRegistering(true);
    const success = await registerVoter(currentVoter.uniqueId, {
      name,
      section,
      age,
      gender,
    });
    setRegistering(false);

    if (success) {
      setRegistrationData({ name: "", section: "", age: "", gender: "" });
      await validateVoter(currentVoter.uniqueId);
      fetchCandidates();
    }
  };

  const handleVote = async () => {
    // Check if all positions have been selected
    const positions = [...new Set(candidates.map(c => c.position))];
    const missingPositions = positions.filter(pos => !selectedCandidates[pos]);
    
    if (missingPositions.length > 0) {
      setLocalError(`Please select candidates for all positions: ${missingPositions.join(', ')}`);
      return;
    }

    setVoting(true);
    setLocalError(null);
    
    // Cast votes for all selected candidates
    const candidateIds = Object.values(selectedCandidates);
    await castVote(candidateIds);
    
    setVoting(false);
  };

  const handleReset = () => {
    setVoterId("");
    setSelectedCandidates({});
    resetVoting();
  };

  // Success State
  if (voteSuccess) {
    return (
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-3xl p-8 text-center"
        >
          <div className="bg-emerald-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Vote Cast Successfully!
          </h2>

          <p className="text-slate-300 mb-6">
            Salamat! Your vote has been recorded. Thank you for participating in
            the election.
          </p>

          <button
            onClick={handleReset}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Cast Another Vote
          </button>
        </motion.div>
      </div>
    );
  }

  // Session Not Active
  if (session && session.status !== "active") {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-amber-500/30 rounded-3xl p-8 text-center">
          <div className="bg-amber-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Voting Not Active
          </h2>

          <p className="text-slate-300 mb-6">
            {session.status === "pending"
              ? "The voting session has not started yet. Please wait for the administrator to start the election."
              : session.status === "paused"
                ? "Voting is currently paused. Please wait for it to resume."
                : "The voting session has ended."}
          </p>

          <p className="text-slate-400 text-sm">Session: {session.title}</p>
        </div>
      </div>
    );
  }

  // Voter Registration Form
  if (currentVoter && needsRegistration) {
    return (
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8"
        >
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Complete Your Profile
            </h2>
            <p className="text-slate-400 mt-2">
              Please fill in your information before voting
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={registrationData.name}
                onChange={(e) =>
                  setRegistrationData({
                    ...registrationData,
                    name: e.target.value,
                  })
                }
                placeholder="Enter your full name"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Section/Class
              </label>
              <input
                type="text"
                value={registrationData.section}
                onChange={(e) =>
                  setRegistrationData({
                    ...registrationData,
                    section: e.target.value,
                  })
                }
                placeholder="e.g., Grade 10-A"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Age
              </label>
              <input
                type="number"
                value={registrationData.age}
                onChange={(e) =>
                  setRegistrationData({
                    ...registrationData,
                    age: e.target.value,
                  })
                }
                placeholder="Enter your age"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Gender
              </label>
              <select
                value={registrationData.gender}
                onChange={(e) =>
                  setRegistrationData({
                    ...registrationData,
                    gender: e.target.value,
                  })
                }
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                registering ||
                !registrationData.name?.trim() ||
                !registrationData.section?.trim() ||
                !registrationData.age ||
                !registrationData.gender?.trim()
              }
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {registering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl font-medium transition-colors"
            >
              Use Different Voter ID
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Voter Validation Form
  if (!currentVoter) {
    return (
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8"
        >
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Fingerprint className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Enter Voter ID</h2>
            <p className="text-slate-400 mt-2">
              Enter your unique Voter ID received via SMS during registration
            </p>
          </div>

          <form onSubmit={handleValidate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Voter ID
              </label>
              <input
                type="text"
                value={voterId}
                onChange={(e) => setVoterId(e.target.value.toUpperCase())}
                placeholder="e.g., VOT-7K9M2P4Q"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono text-lg"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !voterId.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <Vote className="w-5 h-5" />
                  <span>Validate & Continue</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm text-center">
              Don't have a Voter ID? Visit our registration station to enroll
              with your fingerprint.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Candidate Selection
  return (
    <div className="max-w-4xl mx-auto">
      {/* Voter Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-4 mb-8 flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/20 w-10 h-10 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Verified Voter</p>
            <p className="text-white font-mono font-medium">
              {currentVoter.uniqueId}
            </p>
            {currentVoter.name && (
              <p className="text-slate-300 text-sm mt-1">
                {currentVoter.name} • {currentVoter.section}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleReset}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Change
        </button>
      </motion.div>

      {/* Candidate Selection */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Select Your Candidates</h2>
        <p className="text-slate-400 mt-2">Choose one candidate for each position</p>
      </div>

      {(error || localError) && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error || localError}</p>
        </div>
      )}

      {candidates.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl p-8 text-center">
          <p className="text-slate-400">No candidates available yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Group candidates by position */}
          {[...new Set(candidates.map(c => c.position))].map((position) => {
            const positionCandidates = candidates.filter(c => c.position === position);
            return (
              <div key={position} className="bg-slate-800/30 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">
                  {position}
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {positionCandidates.map((candidate) => (
                      <motion.button
                        key={candidate.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedCandidates(prev => ({
                          ...prev,
                          [position]: candidate.id
                        }))}
                        className={`bg-slate-800/50 border-2 rounded-2xl p-6 text-left transition-all duration-200 ${
                          selectedCandidates[position] === candidate.id
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-slate-700/50 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                              selectedCandidates[position] === candidate.id
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {candidate.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white">
                              {candidate.name}
                            </h3>
                            <p className="text-emerald-400 text-sm">
                              {candidate.party}
                            </p>
                          </div>
                          {selectedCandidates[position] === candidate.id && (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vote Button */}
      {Object.keys(selectedCandidates).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <button
            onClick={handleVote}
            disabled={voting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {voting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Recording Votes...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Vote</span>
              </>
            )}
          </button>

          <p className="text-center text-slate-400 text-sm mt-4">
            Once you vote, you cannot change your selection
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default VotingPage;
