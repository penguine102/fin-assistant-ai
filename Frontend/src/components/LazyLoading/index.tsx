import React, { Suspense, lazy } from 'react'
import { PageLoading } from '../Loading'

// Lazy load pages for code splitting
export const ChatPage = lazy(() => import('../../pages/Chat/ChatPage'))
export const TransactionsPage = lazy(() => import('../../pages/Transactions/TransactionsPage'))
export const OCRHistoryPage = lazy(() => import('../../pages/OCR/OCRHistoryPage'))
export const UserProfilePage = lazy(() => import('../../pages/Users/UserProfilePage'))
export const LoginPage = lazy(() => import('../../pages/Auth/LoginPage'))

// Lazy load components
export const OCRUpload = lazy(() => import('../OCRUpload'))

// Higher-order component for lazy loading with fallback
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode = <PageLoading />
) => {
  return (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  )
}

// Lazy loaded routes with loading fallback
export const LazyChatPage = withLazyLoading(ChatPage)
export const LazyTransactionsPage = withLazyLoading(TransactionsPage)
export const LazyOCRHistoryPage = withLazyLoading(OCRHistoryPage)
export const LazyUserProfilePage = withLazyLoading(UserProfilePage)
export const LazyLoginPage = withLazyLoading(LoginPage)
export const LazyOCRUpload = withLazyLoading(OCRUpload)

export default {
  ChatPage,
  TransactionsPage,
  OCRHistoryPage,
  UserProfilePage,
  LoginPage,
  OCRUpload,
  withLazyLoading,
  LazyChatPage,
  LazyTransactionsPage,
  LazyOCRHistoryPage,
  LazyUserProfilePage,
  LazyLoginPage,
  LazyOCRUpload,
}
