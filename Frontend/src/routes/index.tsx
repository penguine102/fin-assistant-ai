import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../components/Layout/MainLayout'
import ChatPage from '../pages/Chat/ChatPage'
import TransactionsPage from '../pages/Transactions/TransactionsPage'
import OCRHistoryPage from '../pages/OCR/OCRHistoryPage'
import UserProfilePage from '../pages/Users/UserProfilePage'
import LoginPage from '../pages/Auth/LoginPage'
import RegisterPage from '../pages/Auth/RegisterPage'
import ProtectedRoute from '../components/ProtectedRoute'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/ocr-history" element={<OCRHistoryPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}

export default AppRoutes

