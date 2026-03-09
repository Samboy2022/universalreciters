import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Payment from "./pages/Payment";
import Dashboard from "./pages/Dashboard";
import Streaming from "./pages/Streaming";
import Leaderboard from "./pages/Leaderboard";
import Wallet from "./pages/Wallet";
import Chat from "./pages/Chat";
import Learn from "./pages/dashboard/Learn";
import Recite from "./pages/dashboard/Recite";
import Rankings from "./pages/dashboard/Rankings";
import Settings from "./pages/dashboard/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPins from "./pages/admin/AdminPins";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSurahs from "./pages/admin/AdminSurahs";
import AdminSurahTexts from "./pages/admin/AdminSurahTexts";
import AdminRankings from "./pages/admin/AdminRankings";
import AdminLearning from "./pages/admin/AdminLearning";
import AdminWallet from "./pages/admin/AdminWallet";
import AdminCMS from "./pages/admin/AdminCMS";
import AdminLogin from "./pages/admin/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected user routes */}
            <Route path="/payment" element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/learn" element={
              <ProtectedRoute>
                <Learn />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/recite" element={
              <ProtectedRoute>
                <Recite />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/rankings" element={
              <ProtectedRoute>
                <Rankings />
              </ProtectedRoute>
            } />
            <Route path="/streaming" element={
              <ProtectedRoute>
                <Streaming />
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/surahs" element={
              <ProtectedRoute requireAdmin>
                <AdminSurahs />
              </ProtectedRoute>
            } />
            <Route path="/admin/surah-texts" element={
              <ProtectedRoute requireAdmin>
                <AdminSurahTexts />
              </ProtectedRoute>
            } />
            <Route path="/admin/rankings" element={
              <ProtectedRoute requireAdmin>
                <AdminRankings />
              </ProtectedRoute>
            } />
            <Route path="/admin/learning" element={
              <ProtectedRoute requireAdmin>
                <AdminLearning />
              </ProtectedRoute>
            } />
            <Route path="/admin/wallet" element={
              <ProtectedRoute requireAdmin>
                <AdminWallet />
              </ProtectedRoute>
            } />
            <Route path="/admin/videos" element={
              <ProtectedRoute requireAdmin>
                <AdminVideos />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/pins" element={
              <ProtectedRoute requireAdmin>
                <AdminPins />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute requireAdmin>
                <AdminPayments />
              </ProtectedRoute>
            } />
            <Route path="/admin/cms" element={
              <ProtectedRoute requireAdmin>
                <AdminCMS />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
