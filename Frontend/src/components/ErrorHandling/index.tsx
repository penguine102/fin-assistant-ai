import React from 'react'
import { Alert, Button, Result } from 'antd'
import { ReloadOutlined, HomeOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

// Error Fallback Component
interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  const navigate = useNavigate()

  const handleRetry = () => {
    if (resetError) {
      resetError()
    } else {
      window.location.reload()
    }
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '400px',
      padding: '2rem'
    }}>
      <Result
        status="error"
        title="Something went wrong"
        subTitle={error?.message || 'An unexpected error occurred'}
        extra={[
          <Button type="primary" key="retry" icon={<ReloadOutlined />} onClick={handleRetry}>
            Try Again
          </Button>,
          <Button key="home" icon={<HomeOutlined />} onClick={handleGoHome}>
            Go Home
          </Button>,
        ]}
      />
    </div>
  )
}

// Toast Notification Hook
import { message, notification } from 'antd'

export const useToast = () => {
  const showSuccess = (content: string, duration = 3) => {
    message.success({
      content,
      duration,
      style: {
        marginTop: '20vh',
      },
    })
  }

  const showError = (content: string, duration = 5) => {
    message.error({
      content,
      duration,
      style: {
        marginTop: '20vh',
      },
    })
  }

  const showWarning = (content: string, duration = 4) => {
    message.warning({
      content,
      duration,
      style: {
        marginTop: '20vh',
      },
    })
  }

  const showInfo = (content: string, duration = 3) => {
    message.info({
      content,
      duration,
      style: {
        marginTop: '20vh',
      },
    })
  }

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, description: string) => {
    notification[type]({
      message: title,
      description,
      placement: 'topRight',
      duration: 4.5,
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
  }
}

// Error Alert Component
interface ErrorAlertProps {
  message: string
  description?: string
  showIcon?: boolean
  closable?: boolean
  onClose?: () => void
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  description,
  showIcon = true,
  closable = true,
  onClose,
}) => {
  return (
    <Alert
      message={message}
      description={description}
      type="error"
      showIcon={showIcon}
      closable={closable}
      onClose={onClose}
      style={{ marginBottom: '1rem' }}
    />
  )
}

// Retry Component
interface RetryProps {
  onRetry: () => void
  loading?: boolean
  children?: React.ReactNode
}

export const Retry: React.FC<RetryProps> = ({ onRetry, loading = false, children }) => {
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      {children || (
        <div>
          <ExclamationCircleOutlined style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>Something went wrong</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            We encountered an error while loading this content.
          </p>
        </div>
      )}
      <Button 
        type="primary" 
        icon={<ReloadOutlined />} 
        onClick={onRetry}
        loading={loading}
      >
        Try Again
      </Button>
    </div>
  )
}

// Network Error Component
export const NetworkError: React.FC<{ onRetry: () => void; loading?: boolean }> = ({ 
  onRetry, 
  loading = false 
}) => {
  return (
    <Retry onRetry={onRetry} loading={loading}>
      <div>
        <ExclamationCircleOutlined style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '1rem' }}>Network Error</h3>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Please check your internet connection and try again.
        </p>
      </div>
    </Retry>
  )
}

// Empty State Component
interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '3rem 1rem',
      color: '#6b7280'
    }}>
      {icon && (
        <div style={{ marginBottom: '1rem', fontSize: '3rem' }}>
          {icon}
        </div>
      )}
      <h3 style={{ 
        marginBottom: '0.5rem', 
        color: '#111827',
        fontSize: '1.125rem',
        fontWeight: 500
      }}>
        {title}
      </h3>
      {description && (
        <p style={{ 
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {description}
        </p>
      )}
      {action && action}
    </div>
  )
}

export default {
  ErrorBoundary,
  ErrorFallback,
  useToast,
  ErrorAlert,
  Retry,
  NetworkError,
  EmptyState,
}
