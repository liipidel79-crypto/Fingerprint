/**
 * Main Layout Component
 * Provides consistent layout across all pages
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Vote, Shield, Users, BarChart3, Home } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/vote", label: "Vote", icon: Vote },
    { path: "/results", label: "Results", icon: BarChart3 },
    { path: "/admin", label: "Admin", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 p-2 rounded-lg">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Vote<span className="text-emerald-400">Secure</span>
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © 2024 VoteSecure. Secure Fingerprint Voting System.
            </p>
            <div className="flex items-center space-x-4 text-sm text-slate-400">
              <span className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Hardware Registration</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Real-time Results</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
