import React from 'react'
import { colors, transitions } from '../../design-system'

// Advanced Animation Components
interface MorphingButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  morphing?: boolean
  onClick?: () => void
  disabled?: boolean
}

export const MorphingButton: React.FC<MorphingButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  morphing = true,
  onClick,
  disabled = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          color: '#ffffff',
          border: 'none',
        }
      case 'secondary':
        return {
          background: 'transparent',
          color: 'var(--color-primary)',
          border: '2px solid var(--color-primary)',
        }
      case 'ghost':
        return {
          background: 'transparent',
          color: 'var(--color-primary)',
          border: 'none',
        }
      default:
        return {}
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: '8px 16px', fontSize: '0.875rem' }
      case 'medium':
        return { padding: '12px 24px', fontSize: '1rem' }
      case 'large':
        return { padding: '16px 32px', fontSize: '1.125rem' }
      default:
        return {}
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`morphing-button ${morphing ? 'morphing' : ''}`}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        borderRadius: '12px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        transform: 'translateZ(0)',
      }}
    >
      <span style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </span>
      {morphing && (
        <div
          className="morphing-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            borderRadius: '12px',
          }}
        />
      )}
    </button>
  )
}

// Floating Action Button
interface FloatingActionButtonProps {
  icon: React.ReactNode
  onClick?: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  size?: 'small' | 'medium' | 'large'
  color?: string
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  position = 'bottom-right',
  size = 'medium',
  color = 'var(--color-primary)',
}) => {
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom: '24px', right: '24px' }
      case 'bottom-left':
        return { bottom: '24px', left: '24px' }
      case 'top-right':
        return { top: '24px', right: '24px' }
      case 'top-left':
        return { top: '24px', left: '24px' }
      default:
        return { bottom: '24px', right: '24px' }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: '48px', height: '48px', fontSize: '1.2rem' }
      case 'medium':
        return { width: '56px', height: '56px', fontSize: '1.4rem' }
      case 'large':
        return { width: '64px', height: '64px', fontSize: '1.6rem' }
      default:
        return { width: '56px', height: '56px', fontSize: '1.4rem' }
    }
  }

  return (
    <button
      onClick={onClick}
      className="floating-action-button"
      style={{
        ...getPositionStyles(),
        ...getSizeStyles(),
        position: 'fixed',
        borderRadius: '50%',
        background: color,
        color: '#ffffff',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1000,
      }}
    >
      {icon}
    </button>
  )
}

// Glassmorphism Card
interface GlassmorphismCardProps {
  children: React.ReactNode
  blur?: number
  opacity?: number
  border?: boolean
  className?: string
}

export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({
  children,
  blur = 10,
  opacity = 0.1,
  border = true,
  className = '',
}) => {
  return (
    <div
      className={`glassmorphism-card ${className}`}
      style={{
        background: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur}px)`,
        borderRadius: '16px',
        border: border ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      {children}
    </div>
  )
}

// Parallax Container
interface ParallaxContainerProps {
  children: React.ReactNode
  speed?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

export const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
  children,
  speed = 0.5,
  direction = 'up',
  className = '',
}) => {
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset * speed)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return `translateY(${offset}px)`
      case 'down':
        return `translateY(${-offset}px)`
      case 'left':
        return `translateX(${offset}px)`
      case 'right':
        return `translateX(${-offset}px)`
      default:
        return `translateY(${offset}px)`
    }
  }

  return (
    <div
      className={`parallax-container ${className}`}
      style={{
        transform: getTransform(),
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  )
}

// Magnetic Button
interface MagneticButtonProps {
  children: React.ReactNode
  strength?: number
  onClick?: () => void
  className?: string
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.3,
  onClick,
  className = '',
}) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const deltaX = (e.clientX - centerX) * strength
    const deltaY = (e.clientY - centerY) * strength

    setPosition({ x: deltaX, y: deltaY })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`magnetic-button ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'transform 0.1s ease-out',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}

// CSS for advanced animations
const advancedAnimationsCSS = `
.morphing-button {
  position: relative;
  overflow: hidden;
}

.morphing-button.morphing:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.morphing-button.morphing:hover .morphing-overlay {
  opacity: 1;
}

.morphing-button.morphing:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.floating-action-button:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.floating-action-button:active {
  transform: scale(0.95);
}

.glassmorphism-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.magnetic-button {
  transition: transform 0.1s ease-out;
}

/* Dark mode support */
[data-theme="dark"] .glassmorphism-card {
  background: rgba(30, 41, 59, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .morphing-button {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .morphing-button:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .floating-action-button {
    width: 48px !important;
    height: 48px !important;
    font-size: 1.2rem !important;
  }
  
  .glassmorphism-card {
    padding: 16px;
    border-radius: 12px;
  }
}
`

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = advancedAnimationsCSS
  document.head.appendChild(style)
}

export default {
  MorphingButton,
  FloatingActionButton,
  GlassmorphismCard,
  ParallaxContainer,
  MagneticButton,
}
