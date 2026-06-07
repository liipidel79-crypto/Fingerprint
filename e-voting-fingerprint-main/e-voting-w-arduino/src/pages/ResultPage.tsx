/**
 * Results Page
 * Public page showing real-time election results
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Trophy,
  Users,
  Vote,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  party: string;
  position: string;
  voteCount: number;
}

interface Session {
  status: string;
  title: string;
}

const ResultsPage: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const [candidatesRes, sessionRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/public/candidates`,
        ),
        fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/public/session`,
        ),
      ]);

      const candidatesData = await candidatesRes.json();
      const sessionData = await sessionRes.json();

      setCandidates(candidatesData);
      setSession(sessionData);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResults();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalVotes = candidates.reduce(
    (sum, c) => sum + (Number(c.voteCount) || 0),
    0,
  );
  const sortedCandidates = [...candidates].sort(
    (a, b) => (Number(b.voteCount) || 0) - (Number(a.voteCount) || 0),
  );
  const winner =
    (Number(sortedCandidates[0]?.voteCount) || 0) > 0 ? sortedCandidates[0] : null;

  const getPercentage = (votes: number) => {
    const safeVotes = Number(votes) || 0;
    if (totalVotes === 0) return 0;
    return ((safeVotes / totalVotes) * 100).toFixed(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2 mb-4">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">
              Live Results
            </span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">
            Election Results
          </h1>
          <p className="text-slate-400">
            {session?.title || "General Election"} - Real-time updates
          </p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center"
        >
          <Users className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{candidates.length}</p>
          <p className="text-slate-400 text-sm">Candidates</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center"
        >
          <Vote className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{totalVotes}</p>
          <p className="text-slate-400 text-sm">Total Votes</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 text-center"
        >
          <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">
            {winner ? getPercentage(winner.voteCount) : 0}%
          </p>
          <p className="text-slate-400 text-sm">Leading</p>
        </motion.div>
      </div>

      {/* Winner Card */}
      {session?.status === "finished" && winner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-600 to-yellow-500 rounded-3xl p-8 text-center"
        >
          <Trophy className="w-16 h-16 text-white mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Winner</h2>
          <p className="text-4xl font-bold text-white mb-2">{winner.name}</p>
          <p className="text-amber-100 text-lg">{winner.party}</p>
          <p className="text-white/80 mt-2">
            {winner.voteCount} votes ({getPercentage(winner.voteCount)}%)
          </p>
        </motion.div>
      )}

      {/* Live Status */}
      {session?.status === "active" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-emerald-400">Live voting in progress</span>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Candidate Rankings
          </h2>
          <button
            onClick={fetchResults}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {candidates.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
            <p className="text-slate-400">No candidates available yet.</p>
          </div>
        ) : (
          sortedCandidates.map((candidate, index) => {
            const percentage = String(getPercentage(candidate.voteCount));
            const isWinner = index === 0 && candidate.voteCount > 0;

            return (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-slate-800/50 border rounded-2xl p-6 ${
                  isWinner && session?.status === "finished"
                    ? "border-amber-500/30"
                    : "border-slate-700/50"
                }`}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      isWinner && session?.status === "finished"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-white">
                        {candidate.name}
                      </h3>
                      {isWinner && session?.status === "finished" && (
                        <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-emerald-400 text-sm">
                      {candidate.party}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {candidate.voteCount}
                    </p>
                    <p className="text-slate-400 text-sm">{percentage}%</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`h-full ${
                      isWinner && session?.status === "finished"
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                        : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                    }`}
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ResultsPage;
