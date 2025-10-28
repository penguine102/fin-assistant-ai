import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Form, Input, InputNumber, Select, DatePicker, Modal, message, Statistic, Row, Col } from 'antd'
import { PlusOutlined, DollarOutlined } from '@ant-design/icons'
import { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { PageLoading, TableSkeleton } from '../../components/Loading'
import { useToast, ErrorAlert, EmptyState } from '../../components/ErrorHandling'
import { EnhancedButton, EnhancedCard, EnhancedForm, EnhancedInput, EnhancedSelect, StatusBadge } from '../../components/UI'
import { FadeIn, Scale } from '../../components/Animations'

const { Option } = Select
const { TextArea } = Input

interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'income' | 'expense'
  category: string | null
  note: string | null
  occurred_at: string
  created_at: string
}

const TransactionsPage: React.FC = () => {
  const { user } = useAuth()
  const userId = user?.id || 'demo-user'
  const { showSuccess, showError } = useToast()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    // Note: Backend doesn't have GET /transactions endpoint yet
    // For now, we'll just show the summary and allow creating transactions
  }, [])

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true)
      const occurredAt = dayjs(values.occurred_at).format('YYYY-MM-DD HH:mm:ss')
      
      await api.createTransaction({
        user_id: userId,
        amount: values.amount,
        type: values.type,
        category: values.category,
        note: values.note,
        occurred_at: occurredAt,
      })

      showSuccess('Transaction created successfully!')
      setModalVisible(false)
      form.resetFields()
    } catch (error: any) {
      console.error('Failed to create transaction:', error)
      showError('Failed to create transaction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      render: (text: string) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <StatusBadge status={type === 'income' ? 'success' : 'error'}>
          {type.toUpperCase()}
        </StatusBadge>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Transaction) => (
        <span style={{ 
          color: record.type === 'income' ? '#22c55e' : '#ef4444',
          fontWeight: 500
        }}>
          {record.type === 'expense' ? '-' : '+'}
          {amount.toLocaleString('vi-VN')} VND
        </span>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || '-',
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      render: (note: string) => note || '-',
    },
  ]

  return (
    <FadeIn>
      <div>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <EnhancedCard 
              variant="elevated" 
              title="Transactions"
              subtitle="Manage your income and expenses"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Transactions</h2>
                  <p style={{ margin: 0, color: '#6b7280' }}>Track your financial activities</p>
                </div>
                <Scale trigger="hover">
                  <EnhancedButton 
                    variant="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => setModalVisible(true)}
                  >
                    Add Transaction
                  </EnhancedButton>
                </Scale>
              </div>
            </EnhancedCard>
          </Col>
        </Row>

        <EnhancedCard variant="outlined">
          <EmptyState
            title="No transactions yet"
            description="Start tracking your income and expenses by adding your first transaction"
            icon={<DollarOutlined style={{ fontSize: '3rem', color: '#9ca3af' }} />}
            action={
              <EnhancedButton 
                variant="primary" 
                onClick={() => setModalVisible(true)}
                icon={<PlusOutlined />}
              >
                Add Your First Transaction
              </EnhancedButton>
            }
          />
        </EnhancedCard>

        <Modal
          title="Add Transaction"
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
          }}
          footer={null}
          width={600}
        >
          <EnhancedForm
            // @ts-ignore
            form={form}
            onSubmit={handleSubmit}
            layout="vertical"
          >
            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true, message: 'Please select transaction type' }]}
            >
              <EnhancedSelect
                options={[
                  { label: 'Income', value: 'income' },
                  { label: 'Expense', value: 'expense' },
                ]}
                placeholder="Select transaction type"
                required
              />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Amount"
              rules={[{ required: true, message: 'Please enter amount' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter amount"
                min={0}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                // @ts-ignore
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
            >
              <EnhancedInput
                placeholder="e.g., Food, Transportation, Salary"
                variant="outlined"
              />
            </Form.Item>

            <Form.Item
              name="occurred_at"
              label="Date & Time"
              rules={[{ required: true, message: 'Please select date and time' }]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="note"
              label="Note"
            >
              <TextArea rows={3} placeholder="Additional notes..." />
            </Form.Item>

            <Form.Item>
              <EnhancedButton 
                type="submit" 
                variant="primary" 
                fullWidth
                loading={loading}
              >
                Create Transaction
              </EnhancedButton>
            </Form.Item>
          </EnhancedForm>
        </Modal>
      </div>
    </FadeIn>
  )
}

export default TransactionsPage

