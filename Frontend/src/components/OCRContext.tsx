import React from 'react'
import { Card, Tag, Typography, Divider } from 'antd'
import { FileTextOutlined, DollarOutlined, CalendarOutlined, ShopOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

interface OCRContextProps {
  ocrData?: any
  visible?: boolean
}

const OCRContext: React.FC<OCRContextProps> = ({ ocrData, visible = false }) => {
  if (!visible || !ocrData) return null

  const { result } = ocrData

  if (!result) return null


  return (
    <Card 
      style={{ 
        margin: '16px 0',
        background: '#f0f9ff',
        border: '2px solid #0ea5e9',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '100%'
      }}
      styles={{
        body: { padding: '20px' }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <FileTextOutlined style={{ fontSize: '20px', color: '#3b82f6', marginRight: '12px' }} />
        <Title level={4} style={{ margin: 0, color: '#1e40af', fontWeight: 600 }}>
          Thông tin hóa đơn đã được trích xuất:
        </Title>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {result.amount && (
          <div>
            <Text style={{ fontSize: '15px', fontWeight: 600, color: '#475569' }}>Số tiền:</Text>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
              <DollarOutlined style={{ color: '#16a34a', fontSize: '22px', marginRight: '8px' }} />
              <Text strong style={{ color: '#16a34a', fontSize: '22px', fontWeight: 600 }}>
                {new Intl.NumberFormat('vi-VN', { 
                  style: 'currency', 
                  currency: result.amount.currency || 'VND' 
                }).format(result.amount.value)}
              </Text>
            </div>
          </div>
        )}

        {result.transaction_date && (
          <div>
            <Text style={{ fontSize: '15px', fontWeight: 600, color: '#475569' }}>Ngày:</Text>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
              <CalendarOutlined style={{ color: '#f59e0b', fontSize: '22px', marginRight: '8px' }} />
              <Text style={{ fontSize: '17px', fontWeight: 500 }}>{result.transaction_date}</Text>
            </div>
          </div>
        )}

        {result.category && (
          <div>
            <Text style={{ fontSize: '15px', fontWeight: 600, color: '#475569' }}>Danh mục:</Text>
            <div style={{ marginTop: '8px' }}>
              <Tag color="blue" style={{ fontSize: '15px', padding: '8px 14px', fontWeight: 500 }}>
                {result.category.name}
              </Tag>
              <Text type="secondary" style={{ fontSize: '13px', marginLeft: '8px', color: '#94a3b8' }}>
                ({result.category.code})
              </Text>
            </div>
          </div>
        )}
      </div>

      {result.items && result.items.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <Text type="secondary" style={{ fontSize: '16px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>Mặt hàng:</Text>
          <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #cbd5e1', padding: '16px 20px', borderRadius: '10px' }}>
            {result.items.map((item: any, index: number) => (
              <div key={index} style={{ fontSize: '15px', marginBottom: '8px', lineHeight: '1.6', color: '#1e293b', fontWeight: 500 }}>
                • {item.name} {item.qty && <Text type="secondary" style={{ fontSize: '14px', color: '#64748b' }}>(x{item.qty})</Text>}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.meta && result.meta.warnings && result.meta.warnings.length > 0 && (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>Cảnh báo:</Text>
            <div style={{ marginTop: '4px' }}>
              {result.meta.warnings.map((warning: string, index: number) => (
                <Tag key={index} color="orange" style={{ fontSize: '10px', marginBottom: '2px' }}>
                  {warning}
                </Tag>
              ))}
            </div>
          </div>
        </>
      )}

    </Card>
  )
}

export default OCRContext

