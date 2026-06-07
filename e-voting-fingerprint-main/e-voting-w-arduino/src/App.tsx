/**
 * Main App Component with Routing
 * VoteSecure - Fingerprint Voting System
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Components/layout/Layout";
import HomePage from "./pages/HomePage";
import VotingPage from "./pages/VotingPage";
import ResultsPage from "./pages/ResultPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vote" element={<VotingPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
