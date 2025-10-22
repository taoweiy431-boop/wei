import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import Navbar from '@/components/Navbar';
import Home from '@/pages/Home';
import AuthPage from '@/pages/Auth';
import Hall from '@/pages/Hall';
import MyTasks from '@/pages/MyTasks';
import Profile from '@/pages/Profile';
import CSR from '@/pages/CSR';
import GameAuth from '@/pages/GameAuth';
import GamePlatforms from '@/pages/GamePlatforms';
import GameAuthReview from '@/pages/GameAuthReview';
import PlayerWorkspace from './pages/PlayerWorkspace';
import AdminGameInfo from './pages/AdminGameInfo';
import CSRConsole from './pages/CSRConsole';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';

const Root = () => (
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/hall" element={<Hall />} />
      <Route path="/tasks" element={<MyTasks />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/csr" element={<CSR />} />
      <Route path="/workspace" element={<PlayerWorkspace />} />
      <Route path="/admin/game-info" element={<AdminGameInfo />} />
        <Route path="/csr/console" element={<CSRConsole />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/game-auth" element={<GameAuth />} />
        <Route path="/game-platforms" element={<GamePlatforms />} />
        <Route path="/game-auth-review" element={<GameAuthReview />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById('root')!).render(<Root />);