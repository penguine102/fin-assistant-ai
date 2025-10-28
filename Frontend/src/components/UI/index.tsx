import React from 'react'
import { Button, Card, Input, Form, Select, DatePicker, InputNumber } from 'antd'
import { colors, spacing, typography, shadows, borderRadius } from '../../design-system'

const { Option } = Select
const { TextArea } = Input

// Enhanced Button Component
interface EnhancedButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  className?: string
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  children,
  onClick,
  type = 'button',
  fullWidth = false,
  className,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary[500],
          borderColor: colors.primary[500],
          color: '#ffffff',
          '&:hover': {
            backgroundColor: colors.primary[600],
            borderColor: colors.primary[600],
          },
        }
      case 'secondary':
        return {
          backgroundColor: colors.secondary[500],
          borderColor: colors.secondary[500],
          color: '#ffffff',
          '&:hover': {
            backgroundColor: colors.secondary[600],
            borderColor: colors.secondary[600],
          },
        }
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border.medium,
          color: colors.text.primary,
          '&:hover': {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.dark,
          },
        }
      case 'danger':
        return {
          backgroundColor: colors.error[500],
          borderColor: colors.error[500],
          color: '#ffffff',
          '&:hover': {
            backgroundColor: colors.error[600],
            borderColor: colors.error[600],
          },
        }
      default:
        return {}
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: '32px',
          padding: '0 12px',
          fontSize: typography.fontSize.sm,
        }
      case 'medium':
        return {
          height: '40px',
          padding: '0 16px',
          fontSize: typography.fontSize.base,
        }
      case 'large':
        return {
          height: '48px',
          padding: '0 20px',
          fontSize: typography.fontSize.lg,
        }
      default:
        return {}
    }
  }

  return (
    <Button
      type={variant === 'primary' ? 'primary' : variant === 'danger' ? 'primary' : 'default'}
      danger={variant === 'danger'}
      ghost={variant === 'ghost'}
      loading={loading}
      disabled={disabled}
      icon={icon}
      onClick={onClick}
      htmlType={type}
      block={fullWidth}
      className={className}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        borderRadius: borderRadius.xl,
        fontWeight: typography.fontWeight.medium,
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
      }}
    >
      {children}
    </Button>
  )
}

// Enhanced Card Component
interface EnhancedCardProps {
  variant?: 'default' | 'elevated' | 'outlined'
  padding?: 'none' | 'small' | 'medium' | 'large'
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode[]
  hoverable?: boolean
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  variant = 'default',
  padding = 'medium',
  children,
  title,
  subtitle,
  actions,
  hoverable = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          boxShadow: shadows.lg,
          border: 'none',
        }
      case 'outlined':
        return {
          boxShadow: 'none',
          border: `1px solid ${colors.border.medium}`,
        }
      default:
        return {
          boxShadow: shadows.base,
          border: `1px solid ${colors.border.light}`,
        }
    }
  }

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 }
      case 'small':
        return { padding: spacing.sm }
      case 'medium':
        return { padding: spacing.lg }
      case 'large':
        return { padding: spacing.xl }
      default:
        return { padding: spacing.lg }
    }
  }

  return (
    <Card
      hoverable={hoverable}
      style={{
        ...getVariantStyles(),
        borderRadius: borderRadius.lg,
        backgroundColor: colors.background.primary,
        transition: hoverable ? 'all 0.2s ease' : 'none',
      }}
      bodyStyle={getPaddingStyles()}
      title={title ? (
        <div>
          <div style={{ 
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: subtitle ? spacing.xs : 0,
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}>
              {subtitle}
            </div>
          )}
        </div>
      ) : undefined}
      actions={actions}
    >
      {children}
    </Card>
  )
}

// Enhanced Input Component
interface EnhancedInputProps {
  variant?: 'default' | 'filled' | 'outlined'
  size?: 'small' | 'medium' | 'large'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  label?: string
  required?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  variant = 'outlined',
  size = 'medium',
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  required = false,
  prefix,
  suffix,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: colors.background.secondary,
          border: 'none',
          borderRadius: borderRadius.xl,
        }
      case 'outlined':
        return {
          backgroundColor: colors.background.primary,
          border: `1px solid ${error ? colors.error[500] : colors.border.medium}`,
          borderRadius: borderRadius.xl,
        }
      default:
        return {
          backgroundColor: colors.background.primary,
          border: `1px solid ${colors.border.light}`,
          borderRadius: borderRadius.xl,
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: '32px',
          fontSize: typography.fontSize.sm,
        }
      case 'medium':
        return {
          height: '40px',
          fontSize: typography.fontSize.base,
        }
      case 'large':
        return {
          height: '48px',
          fontSize: typography.fontSize.lg,
        }
      default:
        return {}
    }
  }

  return (
    <div>
      {label && (
        <label style={{
          display: 'block',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
          marginBottom: spacing.xs,
        }}>
          {label}
          {required && <span style={{ color: colors.error[500], marginLeft: spacing.xs }}>*</span>}
        </label>
      )}
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        prefix={prefix}
        suffix={suffix}
        style={{
          ...getVariantStyles(),
          ...getSizeStyles(),
          transition: 'all 0.2s ease',
        }}
      />
      {error && (
        <div style={{
          fontSize: typography.fontSize.xs,
          color: colors.error[500],
          marginTop: spacing.xs,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

// Enhanced Form Component
interface EnhancedFormProps {
  children: React.ReactNode
  onSubmit?: (values: any) => void
  initialValues?: any
  layout?: 'vertical' | 'horizontal' | 'inline'
  size?: 'small' | 'medium' | 'large'
}

export const EnhancedForm: React.FC<EnhancedFormProps> = ({
  children,
  onSubmit,
  initialValues,
  layout = 'vertical',
  size = 'medium',
}) => {
  const [form] = Form.useForm()

  const handleSubmit = (values: any) => {
    onSubmit?.(values)
  }

  return (
    <Form
      form={form}
      layout={layout}
      // @ts-ignore
      size={size}
      initialValues={initialValues}
      onFinish={handleSubmit}
      style={{
        width: '100%',
      }}
    >
      {children}
    </Form>
  )
}

// Enhanced Select Component
interface EnhancedSelectProps {
  options: { label: string; value: any }[]
  placeholder?: string
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
  error?: string
  label?: string
  required?: boolean
  size?: 'small' | 'medium' | 'large'
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  options,
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  label,
  required = false,
  size = 'medium',
}) => {
  return (
    <div>
      {label && (
        <label style={{
          display: 'block',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
          marginBottom: spacing.xs,
        }}>
          {label}
          {required && <span style={{ color: colors.error[500], marginLeft: spacing.xs }}>*</span>}
        </label>
      )}
      <Select
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        // @ts-ignore
      size={size}
        style={{
          width: '100%',
          borderRadius: borderRadius.xl,
        }}
        options={options}
      />
      {error && (
        <div style={{
          fontSize: typography.fontSize.xs,
          color: colors.error[500],
          marginTop: spacing.xs,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

// Status Badge Component
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'default'
  children: React.ReactNode
  size?: 'small' | 'medium' | 'large'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  size = 'medium',
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return {
          backgroundColor: colors.success[100],
          color: colors.success[700],
          border: `1px solid ${colors.success[200]}`,
        }
      case 'warning':
        return {
          backgroundColor: colors.warning[100],
          color: colors.warning[700],
          border: `1px solid ${colors.warning[200]}`,
        }
      case 'error':
        return {
          backgroundColor: colors.error[100],
          color: colors.error[700],
          border: `1px solid ${colors.error[200]}`,
        }
      case 'info':
        return {
          backgroundColor: colors.primary[100],
          color: colors.primary[700],
          border: `1px solid ${colors.primary[200]}`,
        }
      default:
        return {
          backgroundColor: colors.gray[100],
          color: colors.gray[700],
          border: `1px solid ${colors.gray[200]}`,
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: `${spacing.xs} ${spacing.sm}`,
          fontSize: typography.fontSize.xs,
        }
      case 'medium':
        return {
          padding: `${spacing.sm} ${spacing.md}`,
          fontSize: typography.fontSize.sm,
        }
      case 'large':
        return {
          padding: `${spacing.md} ${spacing.lg}`,
          fontSize: typography.fontSize.base,
        }
      default:
        return {}
    }
  }

  return (
    <span
      style={{
        ...getStatusStyles(),
        ...getSizeStyles(),
        borderRadius: borderRadius.full,
        fontWeight: typography.fontWeight.medium,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </span>
  )
}

export default {
  EnhancedButton,
  EnhancedCard,
  EnhancedInput,
  EnhancedForm,
  EnhancedSelect,
  StatusBadge,
}
