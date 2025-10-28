import React from 'react'
import { Spin, Skeleton } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large'
  tip?: string
  spinning?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'default', 
  tip = 'Loading...', 
  spinning = true 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '2rem' 
    }}>
      <Spin 
        size={size} 
        spinning={spinning}
        indicator={<ReloadOutlined style={{ fontSize: 24 }} spin />}
      >
        <div style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
          {tip}
        </div>
      </Spin>
    </div>
  )
}

// Skeleton Components
export const CardSkeleton: React.FC = () => (
  <div style={{ 
    padding: '1.5rem', 
    border: '1px solid #e5e7eb', 
    borderRadius: '0.5rem',
    backgroundColor: '#ffffff'
  }}>
    <Skeleton active paragraph={{ rows: 3 }} />
  </div>
)

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div style={{ padding: '1rem' }}>
    <Skeleton active paragraph={{ rows }} />
  </div>
)

export const ChatSkeleton: React.FC = () => (
  <div style={{ padding: '1rem' }}>
    <div style={{ marginBottom: '1rem' }}>
      <Skeleton.Avatar active size="small" />
      <Skeleton.Input active style={{ width: '60%', marginLeft: '0.5rem' }} />
    </div>
    <div style={{ marginBottom: '1rem' }}>
      <Skeleton.Avatar active size="small" />
      <Skeleton.Input active style={{ width: '80%', marginLeft: '0.5rem' }} />
    </div>
    <div>
      <Skeleton.Avatar active size="small" />
      <Skeleton.Input active style={{ width: '70%', marginLeft: '0.5rem' }} />
    </div>
  </div>
)

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0.75rem 0',
        borderBottom: index < items - 1 ? '1px solid #e5e7eb' : 'none'
      }}>
        <Skeleton.Avatar active size="default" />
        <div style={{ marginLeft: '0.75rem', flex: 1 }}>
          <Skeleton.Input active style={{ width: '60%', marginBottom: '0.25rem' }} />
          <Skeleton.Input active style={{ width: '40%' }} />
        </div>
      </div>
    ))}
  </div>
)

// Progress Components
interface ProgressBarProps {
  percent: number
  status?: 'normal' | 'success' | 'exception' | 'active'
  showInfo?: boolean
  strokeColor?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percent, 
  status = 'normal',
  showInfo = true,
  strokeColor
}) => {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        width: '100%', 
        height: '8px', 
        backgroundColor: '#e5e7eb', 
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: strokeColor || (status === 'success' ? '#22c55e' : status === 'exception' ? '#ef4444' : '#3b82f6'),
          transition: 'width 0.3s ease',
          borderRadius: '4px'
        }} />
      </div>
      {showInfo && (
        <div style={{ 
          textAlign: 'right', 
          marginTop: '0.25rem', 
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          {percent}%
        </div>
      )}
    </div>
  )
}

// Loading States for Different Components
export const PageLoading: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '400px' 
  }}>
    <LoadingSpinner size="large" tip="Loading page..." />
  </div>
)

export const ContentLoading: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: '2rem' 
  }}>
    <LoadingSpinner tip="Loading content..." />
  </div>
)

export const ButtonLoading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
    <ReloadOutlined style={{ marginRight: '0.5rem' }} />
    {children}
  </div>
)

// Shimmer Effect
export const ShimmerEffect: React.FC = () => (
  <div style={{
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '0.25rem',
    height: '1rem',
    width: '100%'
  }} />
)

// Add shimmer animation to CSS
const shimmerCSS = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = shimmerCSS
  document.head.appendChild(style)
}

export default {
  LoadingSpinner,
  CardSkeleton,
  TableSkeleton,
  ChatSkeleton,
  ListSkeleton,
  ProgressBar,
  PageLoading,
  ContentLoading,
  ButtonLoading,
  ShimmerEffect,
}
