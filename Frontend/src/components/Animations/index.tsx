import React from 'react'
import { colors, transitions } from '../../design-system'

// Animation Components
interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 300,
  direction = 'up',
}) => {
  const getTransform = () => {
    switch (direction) {
      case 'up':
        return 'translateY(20px)'
      case 'down':
        return 'translateY(-20px)'
      case 'left':
        return 'translateX(20px)'
      case 'right':
        return 'translateX(-20px)'
      default:
        return 'translateY(20px)'
    }
  }

  return (
    <div
      style={{
        animation: `fadeIn${direction} ${duration}ms ease-out ${delay}ms both`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  )
}

// Slide In Animation
interface SlideInProps {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  delay?: number
  duration?: number
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction = 'left',
  delay = 0,
  duration = 300,
}) => {
  const getTransform = () => {
    switch (direction) {
      case 'left':
        return 'translateX(-100%)'
      case 'right':
        return 'translateX(100%)'
      case 'up':
        return 'translateY(-100%)'
      case 'down':
        return 'translateY(100%)'
      default:
        return 'translateX(-100%)'
    }
  }

  return (
    <div
      style={{
        animation: `slideIn${direction} ${duration}ms ease-out ${delay}ms both`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  )
}

// Scale Animation
interface ScaleProps {
  children: React.ReactNode
  scale?: number
  delay?: number
  duration?: number
  trigger?: 'hover' | 'click' | 'always'
}

export const Scale: React.FC<ScaleProps> = ({
  children,
  scale = 1.05,
  delay = 0,
  duration = 200,
  trigger = 'hover',
}) => {
  const getAnimation = () => {
    switch (trigger) {
      case 'hover':
        return `scaleHover ${duration}ms ease-out ${delay}ms both`
      case 'click':
        return `scaleClick ${duration}ms ease-out ${delay}ms both`
      default:
        return `scaleAlways ${duration}ms ease-out ${delay}ms both`
    }
  }

  return (
    <div
      style={{
        animation: getAnimation(),
        animationFillMode: 'both',
        cursor: trigger === 'hover' || trigger === 'click' ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  )
}

// Pulse Animation
interface PulseProps {
  children: React.ReactNode
  duration?: number
  delay?: number
  infinite?: boolean
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  duration = 1000,
  delay = 0,
  infinite = false,
}) => {
  return (
    <div
      style={{
        animation: `pulse ${duration}ms ease-in-out ${delay}ms ${infinite ? 'infinite' : 'both'}`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  )
}

// Bounce Animation
interface BounceProps {
  children: React.ReactNode
  delay?: number
  duration?: number
}

export const Bounce: React.FC<BounceProps> = ({
  children,
  delay = 0,
  duration = 600,
}) => {
  return (
    <div
      style={{
        animation: `bounce ${duration}ms ease-out ${delay}ms both`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  )
}

// Shake Animation
interface ShakeProps {
  children: React.ReactNode
  delay?: number
  duration?: number
}

export const Shake: React.FC<ShakeProps> = ({
  children,
  delay = 0,
  duration = 500,
}) => {
  return (
    <div
      style={{
        animation: `shake ${duration}ms ease-out ${delay}ms both`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  )
}

// Loading Dots Animation
export const LoadingDots: React.FC = () => {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: colors.primary[500],
          animation: 'loadingDot 1.4s ease-in-out infinite both',
          animationDelay: '0ms',
        }}
      />
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: colors.primary[500],
          animation: 'loadingDot 1.4s ease-in-out infinite both',
          animationDelay: '160ms',
        }}
      />
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: colors.primary[500],
          animation: 'loadingDot 1.4s ease-in-out infinite both',
          animationDelay: '320ms',
        }}
      />
    </div>
  )
}

// Progress Bar Animation
interface ProgressBarProps {
  progress: number
  duration?: number
  color?: string
  height?: number
}

export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  duration = 1000,
  color = colors.primary[500],
  height = 4,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: colors.gray[200],
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '2px',
          transition: `width ${duration}ms ease-out`,
        }}
      />
    </div>
  )
}

// CSS Animations
const animationsCSS = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideInDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes scaleHover {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.05);
  }
}

@keyframes scaleClick {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes scaleAlways {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translateY(0);
  }
  40%, 43% {
    transform: translateY(-30px);
  }
  70% {
    transform: translateY(-15px);
  }
  90% {
    transform: translateY(-4px);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-10px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(10px);
  }
}

@keyframes loadingDot {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Hover Effects */
.hover-lift {
  transition: all 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hover-glow {
  transition: all 0.2s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.hover-scale {
  transition: all 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.02);
}

/* Focus Effects */
.focus-ring {
  transition: all 0.2s ease;
}

.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Button Animations */
.btn-press {
  transition: all 0.1s ease;
}

.btn-press:active {
  transform: scale(0.98);
}

/* Card Animations */
.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}
`

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = animationsCSS
  document.head.appendChild(style)
}

export default {
  FadeIn,
  SlideIn,
  Scale,
  Pulse,
  Bounce,
  Shake,
  LoadingDots,
  AnimatedProgressBar,
}
