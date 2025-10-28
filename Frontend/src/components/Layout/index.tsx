import React from 'react'
import { colors, spacing, borderRadius, shadows } from '../../design-system'

// Grid System
interface GridProps {
  children: React.ReactNode
  columns?: number
  gap?: keyof typeof spacing
  className?: string
  style?: React.CSSProperties
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 12,
  gap = 'md',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: spacing[gap],
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface GridItemProps {
  children: React.ReactNode
  span?: number
  start?: number
  end?: number
  className?: string
  style?: React.CSSProperties
}

export const GridItem: React.FC<GridItemProps> = ({
  children,
  span,
  start,
  end,
  className = '',
  style = {},
}) => {
  const gridStyle = {
    gridColumn: span ? `span ${span}` : start && end ? `${start} / ${end}` : undefined,
    ...style,
  }

  return (
    <div className={`grid-item ${className}`} style={gridStyle}>
      {children}
    </div>
  )
}

// Flexbox Components
interface FlexProps {
  children: React.ReactNode
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  gap?: keyof typeof spacing
  className?: string
  style?: React.CSSProperties
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = 'nowrap',
  gap = 'md',
  className = '',
  style = {},
}) => {
  const getJustifyContent = () => {
    switch (justify) {
      case 'start': return 'flex-start'
      case 'end': return 'flex-end'
      case 'center': return 'center'
      case 'between': return 'space-between'
      case 'around': return 'space-around'
      case 'evenly': return 'space-evenly'
      default: return 'flex-start'
    }
  }

  const getAlignItems = () => {
    switch (align) {
      case 'start': return 'flex-start'
      case 'end': return 'flex-end'
      case 'center': return 'center'
      case 'stretch': return 'stretch'
      case 'baseline': return 'baseline'
      default: return 'flex-start'
    }
  }

  return (
    <div
      className={`flex ${className}`}
      style={{
        display: 'flex',
        flexDirection: direction,
        justifyContent: getJustifyContent(),
        alignItems: getAlignItems(),
        flexWrap: wrap,
        gap: spacing[gap],
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Container Component
interface ContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: keyof typeof spacing
  center?: boolean
  className?: string
  style?: React.CSSProperties
}

export const Container: React.FC<ContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'lg',
  center = true,
  className = '',
  style = {},
}) => {
  const getMaxWidth = () => {
    switch (maxWidth) {
      case 'sm': return '640px'
      case 'md': return '768px'
      case 'lg': return '1024px'
      case 'xl': return '1280px'
      case '2xl': return '1536px'
      case 'full': return '100%'
      default: return '1280px'
    }
  }

  return (
    <div
      className={`container ${className}`}
      style={{
        maxWidth: getMaxWidth(),
        padding: spacing[padding],
        margin: center ? '0 auto' : '0',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Card Layout Components
interface CardLayoutProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined' | 'glassmorphism'
  padding?: keyof typeof spacing
  borderRadius?: keyof typeof borderRadius
  shadow?: keyof typeof shadows
  hoverable?: boolean
  className?: string
  style?: React.CSSProperties
}

export const CardLayout: React.FC<CardLayoutProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  borderRadius = 'lg',
  shadow = 'md',
  hoverable = false,
  className = '',
  style = {},
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.background.primary,
          boxShadow: shadows[shadow],
          border: 'none',
        }
      case 'outlined':
        return {
          backgroundColor: colors.background.primary,
          border: `1px solid ${colors.border.medium}`,
          boxShadow: 'none',
        }
      case 'glassmorphism':
        return {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: shadows[shadow],
        }
      default:
        return {
          backgroundColor: colors.background.primary,
          border: `1px solid ${colors.border.light}`,
          boxShadow: shadows[shadow],
        }
    }
  }

  return (
    <div
      className={`card-layout ${hoverable ? 'hoverable' : ''} ${className}`}
      style={{
        ...getVariantStyles(),
        padding: spacing[padding],
        borderRadius: borderRadius[borderRadius],
        transition: hoverable ? 'all 0.3s ease' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Section Component
interface SectionProps {
  children: React.ReactNode
  background?: 'primary' | 'secondary' | 'tertiary' | 'transparent'
  padding?: keyof typeof spacing
  className?: string
  style?: React.CSSProperties
}

export const Section: React.FC<SectionProps> = ({
  children,
  background = 'primary',
  padding = 'xl',
  className = '',
  style = {},
}) => {
  const getBackgroundColor = () => {
    switch (background) {
      case 'primary': return colors.background.primary
      case 'secondary': return colors.background.secondary
      case 'tertiary': return colors.background.tertiary
      case 'transparent': return 'transparent'
      default: return colors.background.primary
    }
  }

  return (
    <section
      className={`section ${className}`}
      style={{
        backgroundColor: getBackgroundColor(),
        padding: spacing[padding],
        ...style,
      }}
    >
      {children}
    </section>
  )
}

// Stack Component
interface StackProps {
  children: React.ReactNode
  direction?: 'vertical' | 'horizontal'
  spacing?: keyof typeof spacing
  align?: 'start' | 'center' | 'end' | 'stretch'
  className?: string
  style?: React.CSSProperties
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'vertical',
  spacing = 'md',
  align = 'start',
  className = '',
  style = {},
}) => {
  const getAlignItems = () => {
    switch (align) {
      case 'start': return 'flex-start'
      case 'center': return 'center'
      case 'end': return 'flex-end'
      case 'stretch': return 'stretch'
      default: return 'flex-start'
    }
  }

  return (
    <div
      className={`stack ${className}`}
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        alignItems: getAlignItems(),
        gap: spacing[spacing],
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Spacer Component
interface SpacerProps {
  size?: keyof typeof spacing
  axis?: 'vertical' | 'horizontal' | 'both'
  className?: string
  style?: React.CSSProperties
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  axis = 'vertical',
  className = '',
  style = {},
}) => {
  const getSpacingStyle = () => {
    switch (axis) {
      case 'vertical':
        return { height: spacing[size] }
      case 'horizontal':
        return { width: spacing[size] }
      case 'both':
        return { width: spacing[size], height: spacing[size] }
      default:
        return { height: spacing[size] }
    }
  }

  return (
    <div
      className={`spacer ${className}`}
      style={{
        ...getSpacingStyle(),
        ...style,
      }}
    />
  )
}

// Divider Component
interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  thickness?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color = colors.border.light,
  className = '',
  style = {},
}) => {
  const getDividerStyle = () => {
    if (orientation === 'horizontal') {
      return {
        width: '100%',
        height: `${thickness}px`,
        backgroundColor: color,
      }
    } else {
      return {
        height: '100%',
        width: `${thickness}px`,
        backgroundColor: color,
      }
    }
  }

  return (
    <div
      className={`divider ${className}`}
      style={{
        ...getDividerStyle(),
        ...style,
      }}
    />
  )
}

// CSS for hover effects
const layoutCSS = `
.card-layout.hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Dark mode support */
[data-theme="dark"] .card-layout {
  background-color: rgba(30, 41, 59, 0.8);
  border-color: rgba(71, 85, 105, 0.3);
}

[data-theme="dark"] .section {
  background-color: rgba(15, 23, 42, 0.8);
}

/* Responsive grid */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr !important;
    gap: 1rem;
  }
  
  .flex {
    flex-direction: column;
  }
  
  .container {
    padding: 1rem;
  }
}

/* Print styles */
@media print {
  .card-layout {
    box-shadow: none !important;
    border: 1px solid #000 !important;
  }
  
  .section {
    background-color: transparent !important;
  }
}
`

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = layoutCSS
  document.head.appendChild(style)
}

export default {
  Grid,
  GridItem,
  Flex,
  Container,
  CardLayout,
  Section,
  Stack,
  Spacer,
  Divider,
}
