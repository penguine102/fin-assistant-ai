import React from 'react'
import { colors, typography } from '../../design-system'

// Advanced Typography Components
interface TypographyProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const Heading1: React.FC<TypographyProps> = ({ children, className = '', style = {} }) => (
  <h1
    className={`heading-1 ${className}`}
    style={{
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: 1.2,
      color: colors.text.primary,
      margin: 0,
      ...style,
    }}
  >
    {children}
  </h1>
)

export const Heading2: React.FC<TypographyProps> = ({ children, className = '', style = {} }) => (
  <h2
    className={`heading-2 ${className}`}
    style={{
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: 1.3,
      color: colors.text.primary,
      margin: 0,
      ...style,
    }}
  >
    {children}
  </h2>
)

export const Heading3: React.FC<TypographyProps> = ({ children, className = '', style = {} }) => (
  <h3
    className={`heading-3 ${className}`}
    style={{
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: 1.4,
      color: colors.text.primary,
      margin: 0,
      ...style,
    }}
  >
    {children}
  </h3>
)

export const Body: React.FC<TypographyProps> = ({ children, className = '', style = {} }) => (
  <p
    className={`body ${className}`}
    style={{
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.normal,
      lineHeight: 1.6,
      color: colors.text.secondary,
      margin: 0,
      ...style,
    }}
  >
    {children}
  </p>
)

export const Caption: React.FC<TypographyProps> = ({ children, className = '', style = {} }) => (
  <span
    className={`caption ${className}`}
    style={{
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: 1.4,
      color: colors.text.tertiary,
      ...style,
    }}
  >
    {children}
  </span>
)

// Gradient Text Component
interface GradientTextProps {
  children: React.ReactNode
  gradient?: string
  className?: string
  style?: React.CSSProperties
}

export const GradientText: React.FC<GradientTextProps> = ({
  // @ts-ignore
  children,
  gradient = 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
  className = '',
  style = {},
}) => (
  <span
    className={`gradient-text ${className}`}
    style={{
      background: gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      ...style,
    }}
  >
    {children}
  </span>
)

// Icon Components
interface IconProps {
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}

export const FinanceIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`finance-icon ${className}`}
    style={style}
  >
    <path
      d="M12 2L2 7L12 12L22 7L12 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 17L12 22L22 17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 12L12 17L22 12"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ChartIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`chart-icon ${className}`}
    style={style}
  >
    <path
      d="M18 20V10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 20V4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 20V14"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const WalletIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`wallet-icon ${className}`}
    style={style}
  >
    <path
      d="M19 7H5C3.89543 7 3 7.89543 3 9V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V9C21 7.89543 20.1046 7 19 7Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 11H16.01"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 3V5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 3V5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const TrendingUpIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`trending-up-icon ${className}`}
    style={style}
  >
    <path
      d="M22 7L13.5 15.5L8.5 10.5L2 17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 7H22V13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const TrendingDownIcon: React.FC<IconProps> = ({ size = 24, color = 'currentColor', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`trending-down-icon ${className}`}
    style={style}
  >
    <path
      d="M22 17L13.5 8.5L8.5 13.5L2 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 17H22V11"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Animated Icon Component
interface AnimatedIconProps extends IconProps {
  animation?: 'spin' | 'pulse' | 'bounce' | 'shake'
  duration?: number
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  animation = 'spin',
  duration = 1000,
  // @ts-ignore
  children,
  className = '',
  style = {},
}) => {
  const getAnimationStyle = () => {
    switch (animation) {
      case 'spin':
        return {
          animation: `spin ${duration}ms linear infinite`,
        }
      case 'pulse':
        return {
          animation: `pulse ${duration}ms ease-in-out infinite`,
        }
      case 'bounce':
        return {
          animation: `bounce ${duration}ms ease-in-out infinite`,
        }
      case 'shake':
        return {
          animation: `shake ${duration}ms ease-in-out infinite`,
        }
      default:
        return {}
    }
  }

  return (
    <div
      className={`animated-icon ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...getAnimationStyle(),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// CSS for animations
const iconAnimationsCSS = `
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-8px);
  }
  70% {
    transform: translateY(-4px);
  }
  90% {
    transform: translateY(-2px);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px);
  }
}

.gradient-text {
  display: inline-block;
}

/* Dark mode support */
[data-theme="dark"] .heading-1,
[data-theme="dark"] .heading-2,
[data-theme="dark"] .heading-3 {
  color: rgba(248, 250, 252, 0.9);
}

[data-theme="dark"] .body {
  color: rgba(203, 213, 225, 0.8);
}

[data-theme="dark"] .caption {
  color: rgba(148, 163, 184, 0.7);
}

/* Responsive typography */
@media (max-width: 768px) {
  .heading-1 {
    font-size: 2rem !important;
  }
  
  .heading-2 {
    font-size: 1.5rem !important;
  }
  
  .heading-3 {
    font-size: 1.25rem !important;
  }
}
`

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = iconAnimationsCSS
  document.head.appendChild(style)
}

export default {
  Heading1,
  Heading2,
  Heading3,
  Body,
  Caption,
  GradientText,
  FinanceIcon,
  ChartIcon,
  WalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AnimatedIcon,
}
