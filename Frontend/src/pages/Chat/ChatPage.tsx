import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Input, Button, Tooltip, Modal, DatePicker, Statistic, Row, Col, List, Tag, Empty, message } from 'antd'
import { SendOutlined, AudioOutlined, UploadOutlined, DollarOutlined, PauseOutlined, EditOutlined, BarChartOutlined, HistoryOutlined } from '@ant-design/icons'
import api, { Session, ChatResponse } from '../../services/api'
import OCRUpload from '../../components/OCRUpload'
import OCRContext from '../../components/OCRContext'
import ChatSidebar from '../../components/Layout/ChatSidebar'
import FormattedResponse from '../../components/FormattedResponse'
import { useAuth } from '../../context/AuthContext'
import { PageLoading } from '../../components/Loading'
import { ErrorBoundary, useToast, ErrorAlert } from '../../components/ErrorHandling'
import { EnhancedButton } from '../../components/UI'
import '../../styles/chat-sidebar.css'
import '../../styles/formatted-response.css'

type Role = 'user' | 'assistant' | 'system'

type ChatMessage = {
  id: string
  role: Role
  content: string
  createdAt: number
  metadata?: any
}

type Conversation = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  session: Session
}

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

const ChatPage: React.FC = () => {
  const { user } = useAuth()
  const userId = user?.id || 'demo-user'
  const { showSuccess, showError } = useToast()
  
  const [collapsed, setCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showOCRUpload, setShowOCRUpload] = useState(false)
  const [ocrContext, setOcrContext] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<any>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showOCRHistoryModal, setShowOCRHistoryModal] = useState(false)
  const [ocrHistory, setOcrHistory] = useState<any[]>([])
  const [ocrHistoryLoading, setOcrHistoryLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false })
  // @ts-ignore
  const streamingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const visibleMessages = useMemo(() => messages, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingRef.current) {
        clearInterval(streamingRef.current)
      }
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [userId])

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const sessions = await api.getSessions(userId)
      
      const newConversations: Conversation[] = await Promise.all(
        sessions.map(async (session) => {
          const history = await api.getHistory(session.id)
          console.log(`Session ${session.id} history:`, history)
          
          return {
            id: session.id,
            title: session.session_name,
            messages: history.map((msg, idx) => ({
              id: `msg-${session.id}-${idx}`,
              role: msg.role as Role,
              content: msg.content,
              createdAt: Date.now() - (history.length - idx) * 1000,
            })),
            createdAt: new Date(session.created_at).getTime(),
            updatedAt: new Date(session.updated_at).getTime(),
            session,
          }
        })
      )

      setConversations(newConversations)
      
      if (newConversations.length > 0) {
        setActiveId(newConversations[0].id)
        setMessages(newConversations[0].messages)
      }
    } catch (error: any) {
      console.error('Failed to load sessions:', error)
      setError(error.response?.data?.detail || 'Failed to load chat sessions')
      showError('Failed to load chat sessions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeId) {
      const conversation = conversations.find(c => c.id === activeId)
      if (conversation) {
        setMessages(conversation.messages)
      }
    }
  }, [activeId, conversations])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || !activeId) return

    // Clear input immediately for better UX
    setInput('')
    
    const userMsg: ChatMessage = {
      id: generateId('u'),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }
    // Add user message immediately (optimistic UI)
    setMessages(prev => [...prev, userMsg])
    setIsThinking(true)
    cancelRef.current.cancelled = false

    try {
      const response: ChatResponse = await api.sendMessage({
        user_id: userId,
        session_id: activeId,
        query: text,
        suggestion: true,
      })

      if (cancelRef.current.cancelled) return

      const answer = response.answer || ''
      setIsThinking(false)
      
      // Add assistant response with streaming effect
      const assistantId = generateId('a')
      
      // Create initial empty message
      const startAssistant: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
      }
      
      // Add empty message first
      setMessages(prev => [...prev, startAssistant])
      
      // Stream the response character by character for better UX
      if (answer) {
        let currentIndex = 0
        const streamingInterval = setInterval(() => {
          if (currentIndex < answer.length) {
            setMessages(prev => prev.map(msg => 
              msg.id === assistantId 
                ? { ...msg, content: answer.substring(0, currentIndex + 1) }
                : msg
            ))
            currentIndex++
          } else {
            clearInterval(streamingInterval)
            streamingRef.current = null
            // Auto scroll after streaming completes
            setTimeout(() => {
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }
        }, 3) // 3ms delay between characters for faster streaming (3-4x faster)
        streamingRef.current = streamingInterval
      }

      // Update local state without refreshing all sessions
      setConversations(prev => prev.map(c => {
        if (c.id !== activeId) return c
        
        // Update title with first message if it's the first message in the conversation
        const isFirstMessage = c.messages.length === 0
        const newTitle = isFirstMessage 
          ? (text.length > 30 ? text.substring(0, 30) + '...' : text)
          : c.title
        
        return {
          ...c,
          messages: [...c.messages, userMsg, startAssistant],
          updatedAt: Date.now(),
          title: newTitle,
        }
      }))

      // Don't refresh sessions immediately to avoid page reload effect
      // loadSessions() will be called on mount and when switching sessions
    } catch (error: any) {
      console.error('Failed to send message:', error)
      setIsThinking(false)
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
      showError('Failed to send message. Please try again.')
      // Restore input on error
      setInput(text)
    }
  }, [input, activeId, userId])

  const handleStop = () => {
    if (!isThinking && !isStreaming) return
    cancelRef.current.cancelled = true
    setIsThinking(false)
    setIsStreaming(false)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = async () => {
    try {
      const session = await api.createSession(userId)
      
      const conversation: Conversation = {
        id: session.id,
        title: session.session_name,
        messages: [],
        createdAt: new Date(session.created_at).getTime(),
        updatedAt: new Date(session.updated_at).getTime(),
        session,
      }
      
      setConversations(prev => [conversation, ...prev])
      setActiveId(conversation.id)
      setMessages([])
      setInput('')
      showSuccess('New chat created!')
    } catch (error: any) {
      console.error('Failed to create new chat:', error)
      showError('Failed to create new chat. Please try again.')
    }
  }

  const handleGetSummary = async () => {
    if (!startDate || !endDate) {
      showError('Vui lòng chọn khoảng thời gian')
      return
    }
    
    try {
      setSummaryLoading(true)
      const result = await api.getSummary(userId, startDate, endDate)
      setSummaryData(result)
      showSuccess('Lấy tổng kết thành công!')
    } catch (error: any) {
      console.error('Failed to get summary:', error)
      showError('Không thể lấy tổng kết. Vui lòng thử lại.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleStartDateChange = (date: any, dateString: string) => {
    // Format: YYYY-MM-DD 00:00:00
    setStartDate(`${dateString} 00:00:00`)
  }

  const handleEndDateChange = (date: any, dateString: string) => {
    // Format: YYYY-MM-DD 23:59:59
    setEndDate(`${dateString} 23:59:59`)
  }

  const handleOpenOCRHistory = async () => {
    setShowOCRHistoryModal(true)
    await loadOCRHistory()
  }

  const loadOCRHistory = async () => {
    try {
      setOcrHistoryLoading(true)
      const history = await api.getOCRHistory(userId)
      setOcrHistory(history)
    } catch (error: any) {
      console.error('Failed to load OCR history:', error)
      showError('Không thể tải lịch sử OCR')
    } finally {
      setOcrHistoryLoading(false)
    }
  }

  const handleSaveOCRToTransaction = async (ocrItem: any) => {
    if (!ocrItem.result || !user) return
    
    try {
      // Convert OCR data to transaction format
      const transaction = {
        user_id: user.id,
        amount: ocrItem.result.amount.value,
        type: 'expense' as 'expense',
        category: ocrItem.result.category?.name || undefined,
        note: ocrItem.result.items?.map((item: any) => item.name).join(', ') || undefined,
        occurred_at: `${ocrItem.result.transaction_date} 00:00:00`
      }
      
      await api.createTransaction(transaction)
      
      // Mark OCR as saved
      await api.markOCRSaved(ocrItem.id)
      
      // Update local state
      setOcrHistory(prev => prev.map(item => 
        item.id === ocrItem.id 
          ? { ...item, saved_to_transactions: true }
          : item
      ))
      
      message.success('Đã lưu vào Transactions!')
    } catch (error: any) {
      console.error('Failed to save transaction:', error)
      message.error('Không thể lưu transaction. Vui lòng thử lại.')
    }
  }

  const { TextArea } = Input

  if (isLoading) {
    return <PageLoading />
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <ErrorAlert 
          message="Failed to load chat" 
          description={error}
          onClose={() => setError(null)}
        />
        <EnhancedButton 
          variant="primary" 
          onClick={() => loadSessions()}
          icon={<EditOutlined />}
        >
          Retry
        </EnhancedButton>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`chat-page ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onActiveChange={setActiveId}
          onNewChat={handleNewChat}
          onOpenOCRHistory={handleOpenOCRHistory}
          onLogout={() => {
            // TODO: Implement logout logic
            console.log('Logout clicked')
          }}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(v => !v)}
        />
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
          <div className={`chat-container ${visibleMessages.length > 0 ? 'with-composer' : ''}`}>
            {visibleMessages.length === 0 ? (
              <div className="hero">
                <div className="hero-icon book">
                  <DollarOutlined />
                </div>
                <h1 className="hero-title">Hỏi tôi mọi thứ về tài chính cá nhân!</h1>
                <p className="hero-sub">Tư vấn quản lý chi tiêu, lập ngân sách, kế hoạch tiết kiệm/đầu tư</p>
                <div className="hero-input">
                  <div className="hero-row">
                    <TextArea
                      placeholder="Ví dụ: Lập ngân sách 20 triệu/tháng?"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      variant="borderless"
                      className="hero-textarea"
                    />
                  </div>
                  <div className="hero-tools">
                    <div className="tools-left">
                      <Tooltip title="Upload hóa đơn">
                        <Button 
                          shape="circle" 
                          className="chip-green upload-button" 
                          icon={<UploadOutlined />} 
                          onClick={() => setShowOCRUpload(true)}
                        />
                      </Tooltip>
                      <Button shape="circle" className="chip-green audio-button" icon={<AudioOutlined />} />
                    </div>
                    <div className="tools-right">
                      <EnhancedButton
                        variant="primary"
                        size="small"
                        className="send-button"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        disabled={!input.trim()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="chat-stream" style={{ padding: '1rem', background: 'transparent' }}>
                  {visibleMessages.map(msg => {
                    console.log('Rendering message:', msg.role, msg.content.substring(0, 50))
                    if (msg.role === 'assistant') {
                      return (
                        <div key={msg.id} className="msg assistant">
                          <div className="assistant-article">
                            <FormattedResponse content={msg.content} />
                          </div>
                        </div>
                      )
                    } else if (msg.role === 'system') {
                      // Parse OCR data from content text
                      const parseOCRFromContent = (content: string) => {
                        try {
                          const lines = content.split('\n')
                          
                          // Check if this is OCR content
                          if (!content.includes('📄 OCR Result:')) {
                            return null
                          }
                          
                          const ocrData: any = {}
                          
                          lines.forEach(line => {
                            // Parse date
                            if (line.includes('📅 Date:')) {
                              const match = line.match(/📅 Date:\s*(.+)/)
                              if (match) ocrData.transaction_date = match[1].trim()
                            }
                            
                            // Parse amount
                            if (line.includes('💰 Amount:')) {
                              const match = line.match(/💰 Amount:\s*(.+)\s+(.+)/)
                              if (match) {
                                const value = match[1].replace(/,/g, '')
                                const currency = match[2].trim()
                                ocrData.amount = {
                                  value: parseFloat(value) || 0,
                                  currency: currency
                                }
                              }
                            }
                            
                            // Parse category
                            if (line.includes('🏷️ Category:')) {
                              const match = line.match(/🏷️ Category:\s*(.+)\s*\((.+)\)/)
                              if (match) {
                                ocrData.category = {
                                  name: match[1].trim(),
                                  code: match[2].trim()
                                }
                              }
                            }
                            
                            // Parse items
                            if (line.includes('🛒 Items:')) {
                              if (!ocrData.items) ocrData.items = []
                            }
                            
                            if (line.trim().startsWith('- ')) {
                              if (!ocrData.items) ocrData.items = []
                              const match = line.match(/-\s*(.+)\s*\(qty:\s*(\d+)\)/)
                              if (match) {
                                ocrData.items.push({
                                  name: match[1].trim(),
                                  qty: parseInt(match[2])
                                })
                              }
                            }
                          })
                          
                          return Object.keys(ocrData).length > 0 ? { result: ocrData } : null
                        } catch (e) {
                          console.error('Failed to parse OCR from content:', e)
                          return null
                        }
                      }
                      
                      const ocrData = parseOCRFromContent(msg.content)
                      
                      return (
                        <div key={msg.id} className="msg system">
                          {ocrData ? (
                            <OCRContext 
                              ocrData={ocrData} 
                              visible={true} 
                            />
                          ) : (
                            <div className="system-bubble">
                              <div className="system-header">
                                <span className="system-icon">📄</span>
                                <span className="system-title">OCR Context</span>
                              </div>
                              <div className="system-content">
                                <pre style={{ 
                                  whiteSpace: 'pre-wrap', 
                                  fontFamily: 'inherit',
                                  margin: 0,
                                  fontSize: '14px',
                                  lineHeight: '1.5'
                                }}>
                                  {msg.content}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    } else {
                      return (
                        <div key={msg.id} className="msg user">
                          <div className="user-bubble">{msg.content}</div>
                        </div>
                      )
                    }
                  })}
                  
                  {isThinking && (
                    <div className="msg assistant">
                      <div className="assistant-article thinking">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                        <span style={{ marginLeft: 8, color: '#6b7280', fontSize: 14 }}>Thinking…</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="composer">
                  <div className="hero-input">
                    <div className="hero-row">
                      <TextArea
                        placeholder="Nhập câu hỏi..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoSize={{ minRows: 1, maxRows: 6 }}
                        variant="borderless"
                        className="hero-textarea"
                      />
                    </div>
                    <div className="hero-tools">
                      <div className="tools-left">
                        <Tooltip title="Upload hóa đơn">
                          <Button 
                            shape="circle" 
                            className="chip-green" 
                            icon={<UploadOutlined />} 
                            onClick={() => setShowOCRUpload(true)}
                          />
                        </Tooltip>
                        <Tooltip title="Tổng kết chi tiêu">
                          <Button 
                            shape="circle" 
                            className="chip-green" 
                            icon={<BarChartOutlined />} 
                            onClick={() => setShowSummaryModal(true)}
                          />
                        </Tooltip>
                        <Button shape="circle" className="chip-green audio-button" icon={<AudioOutlined />} />
                      </div>
                      <div className="tools-right">
                        {isThinking || isStreaming ? (
                          <EnhancedButton 
                            variant="danger" 
                            size="small"
                            icon={<PauseOutlined />} 
                            onClick={handleStop}
                          />
                        ) : (
                          <EnhancedButton 
                            variant="primary" 
                            size="small"
                            className="send-button"
                            icon={<SendOutlined />} 
                            onClick={handleSend} 
                            disabled={!input.trim()}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {activeId && (
          <OCRUpload
            visible={showOCRUpload}
            onCancel={() => setShowOCRUpload(false)}
            sessionId={activeId}
            userId={userId}
            onSuccess={async (ocrResult) => {
              // Store OCR context for display
              if (ocrResult) {
                setOcrContext(ocrResult)
              }
              
              // Reload sessions to get updated history with OCR system message
              await loadSessions()
              showSuccess('OCR processing completed!')
            }}
          />
        )}

        {/* Summary Modal */}
        <Modal
          title={<><DollarOutlined style={{ marginRight: 8 }} /> Tổng kết chi tiêu</>}
          open={showSummaryModal}
          onCancel={() => {
            setShowSummaryModal(false)
            setSummaryData(null)
            setStartDate('')
            setEndDate('')
          }}
          footer={[
            <Button key="cancel" onClick={() => {
              setShowSummaryModal(false)
              setSummaryData(null)
              setStartDate('')
              setEndDate('')
            }}>
              Đóng
            </Button>,
            <Button 
              key="get" 
              type="primary" 
              onClick={handleGetSummary}
              loading={summaryLoading}
            >
              Lấy tổng kết
            </Button>
          ]}
          width={700}
        >
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Từ ngày:
              </label>
              <DatePicker
                style={{ width: '100%' }}
                onChange={handleStartDateChange}
                placeholder="Chọn ngày bắt đầu"
                format="YYYY-MM-DD"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                Đến ngày:
              </label>
              <DatePicker
                style={{ width: '100%' }}
                onChange={handleEndDateChange}
                placeholder="Chọn ngày kết thúc"
                format="YYYY-MM-DD"
              />
            </div>
          </div>

          {summaryData && (
            <div style={{ marginTop: 24, padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Thu nhập"
                    value={summaryData.income || 0}
                    precision={0}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#3f8600', fontSize: '20px', fontWeight: 600 }}
                    suffix="đ"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Chi tiêu"
                    value={summaryData.expense || 0}
                    precision={0}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#cf1322', fontSize: '20px', fontWeight: 600 }}
                    suffix="đ"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Thuần"
                    value={summaryData.net || 0}
                    precision={0}
                    prefix={<DollarOutlined />}
                    valueStyle={{ 
                      color: summaryData.net >= 0 ? '#3f8600' : '#cf1322',
                      fontWeight: 700,
                      fontSize: '20px'
                    }}
                    suffix="đ"
                  />
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* OCR History Modal */}
        <Modal
          title={<><HistoryOutlined style={{ marginRight: 8 }} /> Lịch sử OCR</>}
          open={showOCRHistoryModal}
          onCancel={() => {
            setShowOCRHistoryModal(false)
            setOcrHistory([])
          }}
          footer={[
            <Button key="close" onClick={() => {
              setShowOCRHistoryModal(false)
              setOcrHistory([])
            }}>
              Đóng
            </Button>
          ]}
          width={800}
        >
          {ocrHistoryLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Empty description="Đang tải lịch sử..." />
            </div>
          ) : ocrHistory.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Empty 
                description="Chưa có lịch sử OCR"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <List
              dataSource={ocrHistory}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>
                          {item.original_filename}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8a8f96' }}>
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <Tag color={item.status === 'completed' ? 'green' : item.status === 'failed' ? 'red' : 'orange'}>
                        {item.status}
                      </Tag>
                    </div>
                    
                    {item.result && (
                      <div style={{ 
                        marginTop: 12, 
                        padding: 12, 
                        background: '#f9fafb', 
                        borderRadius: 8,
                        border: '1px solid #e5e7eb'
                      }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                              Số tiền:
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>
                              {new Intl.NumberFormat('vi-VN', { 
                                style: 'currency', 
                                currency: item.result.amount.currency || 'VND' 
                              }).format(item.result.amount.value)}
                            </div>
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                              Ngày:
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 500 }}>
                              {item.result.transaction_date}
                            </div>
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                              Danh mục:
                            </div>
                            <Tag color="blue">{item.result.category.name}</Tag>
                          </Col>
                        </Row>
                        
                        {item.result.items && item.result.items.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                              Mặt hàng:
                            </div>
                            <div style={{ fontSize: '13px', color: '#1e293b' }}>
                              {item.result.items.map((i: any, idx: number) => (
                                <div key={idx} style={{ marginBottom: 4 }}>
                                  • {i.name} {i.qty && <span style={{ color: '#64748b' }}>(x{i.qty})</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div style={{ marginTop: 12, textAlign: 'right' }}>
                          {item.saved_to_transactions ? (
                            <Tag color="green" style={{ fontSize: '12px', padding: '4px 8px' }}>
                              ✓ Đã lưu vào Transactions
                            </Tag>
                          ) : (
                            <Button 
                              type="primary" 
                              size="small"
                              icon={<DollarOutlined />}
                              onClick={() => handleSaveOCRToTransaction(item)}
                            >
                              Lưu vào Transactions
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!item.result && item.status === 'completed' && (
                      <div style={{ color: '#8a8f96', fontSize: '13px', marginTop: 8 }}>
                            Chưa có kết quả OCR
                          </div>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Modal>
      </div>
    </ErrorBoundary>
  )
}

export default ChatPage
