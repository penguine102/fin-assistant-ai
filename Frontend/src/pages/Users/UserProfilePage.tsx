import React from 'react'
import { Card, Descriptions, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'

const UserProfilePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar size={80} icon={<UserOutlined />} />
          <h2 style={{ marginTop: 16, marginBottom: 0 }}>{user?.email || 'User'}</h2>
        </div>

        <Descriptions bordered column={1}>
          <Descriptions.Item label="Email">{user?.email || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Full Name">{user?.full_name || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="User ID">{user?.id || 'N/A'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default UserProfilePage

