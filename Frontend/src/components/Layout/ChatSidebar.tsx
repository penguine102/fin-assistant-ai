import React from 'react'
import { Button, List, Empty, Tooltip, Dropdown, Avatar } from 'antd'
import { EditOutlined, SearchOutlined, ClockCircleOutlined, HistoryOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'

interface ChatSidebarProps {
  conversations: any[]
  activeId: string | null
  onActiveChange: (id: string) => void
  onNewChat: () => void
  onOpenOCRHistory?: () => void
  onLogout?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const SidebarToggleIcon: React.FC = () => (
  <span className="toggle-icon" aria-hidden>
    <span className="toggle-left" />
    <span className="toggle-right" />
  </span>
)

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeId,
  onActiveChange,
  onNewChat,
  onOpenOCRHistory,
  onLogout,
  collapsed = false,
  onToggleCollapse
}) => {
  const { user } = useAuth()

  const profileMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => {
        // TODO: Navigate to profile page
        console.log('Navigate to profile')
      }
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: onLogout
    }
  ]

  return (
    <div className={`chat-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toolbar">
        <div className="toolbar-left">
          {onToggleCollapse && (
            <Button 
              type="text" 
              className="toggle-btn" 
              icon={<SidebarToggleIcon />} 
              onClick={onToggleCollapse} 
            />
          )}
        </div>
        
        {!collapsed && (
          <div className="toolbar-center">
            <div className="system-title">
              <span className="title-text">Finance AI</span>
            </div>
          </div>
        )}
        
        <div className="toolbar-right">
          <Tooltip title="New chat">
            <Button type="text" icon={<EditOutlined />} onClick={onNewChat} />
          </Tooltip>
          {onOpenOCRHistory && (
            <Tooltip title="Lịch sử OCR">
              <Button type="text" icon={<HistoryOutlined />} onClick={onOpenOCRHistory} />
            </Tooltip>
          )}
          <Tooltip title="Search">
            <Button type="text" icon={<SearchOutlined />} />
          </Tooltip>
        </div>
      </div>
      
      <div className="sidebar-history">
        <div className="sidebar-history-title">
          <ClockCircleOutlined className="title-icon" /> Chat History
        </div>
        
        {conversations.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  No chat history yet<br />
                  Start a new conversation to see it here
                </span>
              }
            />
          </div>
        ) : (
          <List
            dataSource={conversations}
            rowKey={(c) => c.id}
            renderItem={(c) => (
              <List.Item 
                className={`sidebar-item ${c.id === activeId ? 'active' : ''}`} 
                onClick={() => onActiveChange(c.id)}
              >
                <List.Item.Meta 
                  title={c.title} 
                  description={new Date(c.updatedAt).toLocaleString()} 
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* User Profile Section */}
      <div className="sidebar-profile">
        <Dropdown
          menu={{ items: profileMenuItems }}
          placement="topRight"
          trigger={['click']}
        >
          <div className="profile-trigger">
            <Avatar 
              size={collapsed ? 32 : 40} 
              icon={<UserOutlined />}
              style={{ backgroundColor: '#667eea' }}
            />
            {!collapsed && (
              <div className="profile-info">
                <div className="profile-name">
                  {user?.full_name || user?.email || 'User'}
                </div>
                <div className="profile-email">
                  {user?.email}
                </div>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </div>
  )
}

export default ChatSidebar
