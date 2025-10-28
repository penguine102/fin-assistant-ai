import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, message } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      message.error('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      await loginUser({ email, password })
      message.success('Login successful!')
      navigate('/chat')
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Login failed')
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
            Finance AI
          </h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
              type="email"
              size="large"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<LoginOutlined />}
            block
            style={{ 
              height: '48px',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            Sign In
          </Button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{ color: '#666' }}>
              Don't have an account?{' '}
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/register')
                }}
                style={{ color: '#667eea', fontWeight: 500 }}
              >
                Sign up
              </a>
            </span>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default LoginPage