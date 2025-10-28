import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import '../../styles/navbar.css'

interface NavItem {
  key: string
  icon: React.ReactNode
  label: string
}

const Navbar: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()

  const menuItems: NavItem[] = [
    {
      key: '/chat',
      icon: <span>💬</span>,
      label: 'Chat AI',
    },
    {
      key: '/transactions',
      icon: <span>💰</span>,
      label: 'Transactions',
    },
    {
      key: '/ocr-history',
      icon: <span>📄</span>,
      label: 'OCR History',
    },
    {
      key: '/profile',
      icon: <span>👤</span>,
      label: 'Profile',
    },
  ]

  const selectedKey = location.pathname === '/' ? '/chat' : location.pathname

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link to="/chat" className="navbar-brand">Finance AI</Link>
        <div className="navbar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              to={item.key}
              className={`navbar-item ${selectedKey === item.key ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="navbar-controls">
        {user && (
          <div className="navbar-user">
            <div className="navbar-avatar"><UserOutlined /></div>
            <span className="navbar-email">{user.email}</span>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
