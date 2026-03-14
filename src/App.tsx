import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import SeoAndThemeManager from "@/components/SeoAndThemeManager";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
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
        <SeoAndThemeManager />
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
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/surahs" element={
              <AdminProtectedRoute>
                <AdminSurahs />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/surah-texts" element={
              <AdminProtectedRoute>
                <AdminSurahTexts />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/rankings" element={
              <AdminProtectedRoute>
                <AdminRankings />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/learning" element={
              <AdminProtectedRoute>
                <AdminLearning />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/wallet" element={
              <AdminProtectedRoute>
                <AdminWallet />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/videos" element={
              <AdminProtectedRoute>
                <AdminVideos />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <AdminProtectedRoute>
                <AdminUsers />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/pins" element={
              <AdminProtectedRoute>
                <AdminPins />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <AdminProtectedRoute>
                <AdminPayments />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/cms" element={
              <AdminProtectedRoute>
                <AdminCMS />
              </AdminProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
