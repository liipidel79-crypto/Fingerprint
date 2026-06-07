/**
 * Home Page
 * Landing page for the voting system
 */

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Vote,
  Fingerprint,
  Shield,
  Users,
  CheckCircle2,
  ArrowRight,
  Smartphone,
} from "lucide-react";

const HomePage: React.FC = () => {
  const features = [
    {
      icon: Fingerprint,
      title: "Fingerprint Registration",
      description:
        "Register securely using biometric fingerprint scanning at our hardware station.",
    },
    {
      icon: Smartphone,
      title: "Unique Voter ID",
      description:
        "Receive your unique VOT-XXXXXXXX ID via SMS for secure online voting.",
    },
    {
      icon: Shield,
      title: "One Vote Per Person",
      description: "System ensures each registered voter can only vote once.",
    },
    {
      icon: CheckCircle2,
      title: "Real-time Results",
      description:
        "Watch live voting results as they come in with real-time updates.",
    },
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 mb-6">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-sm font-medium">
              Secure Voting System
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Vote Securely with
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Fingerprint Technology
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Modern biometric voting system with hardware fingerprint
            registration and real-time online voting. Secure, transparent, and
            accessible.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/vote"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200"
            >
              <Vote className="w-5 h-5" />
              <span>Start Voting</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/results"
              className="inline-flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 border border-slate-600"
            >
              <Users className="w-5 h-5" />
              <span>View Results</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;

          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all duration-300"
            >
              <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </motion.div>
          );
        })}
      </section>

      {/* How It Works */}
      <section className="bg-slate-800/30 rounded-3xl p-8 md:p-12">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Register at Station",
              description:
                "Visit our hardware registration station to enroll your fingerprint. You'll receive a unique Voter ID via SMS.",
            },
            {
              step: "02",
              title: "Enter Your ID",
              description:
                "Go to the voting page and enter your unique Voter ID (e.g., VOT-7K9M2P4Q) to verify your identity.",
            },
            {
              step: "03",
              title: "Cast Your Vote",
              description:
                "Select your preferred candidate and confirm your vote. You'll receive a confirmation message.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
              className="relative"
            >
              <div className="text-6xl font-bold text-emerald-500/20 mb-4">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-slate-400">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-12">
        <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-3xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Vote?</h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto">
            Make your voice heard. Enter your Voter ID and cast your vote
            securely.
          </p>
          <Link
            to="/vote"
            className="inline-flex items-center space-x-2 bg-white text-emerald-600 px-8 py-4 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
          >
            <Vote className="w-5 h-5" />
            <span>Go to Voting Page</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
