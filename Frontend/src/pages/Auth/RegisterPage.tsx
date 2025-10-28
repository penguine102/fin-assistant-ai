import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const { registerUser } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !confirmPassword) {
      message.error('Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      message.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      message.error('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      await registerUser({ email, password, full_name: fullName || undefined })
      message.success('Registration successful!')
      navigate('/chat')
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            Create Account
          </h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Sign up to get started
          </p>
        </div>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '16px' }}>
            <Input
              prefix={<UserOutlined />}
              placeholder="Full Name (Optional)"
              size="large"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              type="email"
              size="large"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
              size="large"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            block
            style={{ 
              height: '48px',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            Create Account
          </Button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ color: '#666' }}>
              Already have an account?{' '}
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/login')
                }}
                style={{ color: '#667eea', fontWeight: 500 }}
              >
                Sign in
              </a>
            </span>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default RegisterPage
