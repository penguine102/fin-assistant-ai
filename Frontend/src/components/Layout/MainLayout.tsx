import React from 'react'
import { Outlet } from 'react-router-dom'

const MainLayout: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      <div
        style={{
          flex: 1,
          padding: '0',
          background: '#ffffff',
          overflow: 'auto',
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout

