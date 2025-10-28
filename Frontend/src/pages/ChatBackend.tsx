import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Layout, Input, Button, List, Empty, Tooltip, Card } from 'antd'
import { ArrowUpOutlined, SearchOutlined, EditOutlined, AudioOutlined, UploadOutlined, ClockCircleOutlined, DollarOutlined, StopOutlined } from '@ant-design/icons'
import api, { Session, ChatMessage as APIChatMessage, ChatResponse } from '../services/api'
import OCRUpload from '../components/OCRUpload'

type Role = 'user' | 'assistant' | 'system'

type ChatMessage = {
  id: string
  role: Role
  content: string
  createdAt: number
}

type Conversation = {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  session: Session // Backend session
}

// Mock user ID - Trong production nên lấy từ auth context
const MOCK_USER_ID = 'test-user-123'

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

const SidebarToggleIcon: React.FC = () => (
  <span className="toggle-icon" aria-hidden>
    <span className="toggle-left" />
    <span className="toggle-right" />
  </span>
)

const Chat: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showOCRUpload, setShowOCRUpload] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false })
  const abortControllerRef = useRef<AbortController | null>(null)

  const visibleMessages = useMemo(() => messages.filter(m => m.role !== 'system'), [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Load sessions khi component mount
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      const sessions = await api.getSessions(MOCK_USER_ID)
      
      // Convert sessions to conversations
      const newConversations: Conversation[] = await Promise.all(
        sessions.map(async (session) => {
          // Load messages for each session
          const history = await api.getHistory(session.id)
          
          const conversation: Conversation = {
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
          
          return conversation
        })
      )

      setConversations(newConversations)
      
      // Set first conversation as active if available
      if (newConversations.length > 0) {
        setActiveId(newConversations[0].id)
        setMessages(newConversations[0].messages)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
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

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    // Ensure we have an active session
    if (!activeId) {
      await handleNewChat()
      return
    }

    const userMsg: ChatMessage = {
      id: generateId('u'),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsThinking(true)
    cancelRef.current.cancelled = false

    try {
      // Call backend API
      const response: ChatResponse = await api.sendMessage({
        user_id: MOCK_USER_ID,
        session_id: activeId,
        query: text,
        suggestion: false,
      })

      if (cancelRef.current.cancelled) {
        return
      }

      // Parse response
      const answer = response.answer || ''
      const suggestion = response.suggestion

      // Create assistant message
      setIsThinking(false)
      setIsStreaming(true)

      const assistantId = generateId('a')
      const startAssistant: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: answer,
        createdAt: Date.now(),
      }
      setMessages(prev => [...prev, startAssistant])
      setIsStreaming(false)

      // Update conversation
      setConversations(prev => prev.map(c => {
        if (c.id !== activeId) return c
        return {
          ...c,
          messages: [...c.messages, userMsg, startAssistant],
          updatedAt: Date.now(),
          title: c.title === 'New Chat' ? text.slice(0, 30) : c.title,
        }
      }))

      // Reload sessions to sync with backend
      await loadSessions()
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsThinking(false)
      setIsStreaming(false)
      
      // Remove user message if failed
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    }
  }

  const handleStop = () => {
    if (!isThinking && !isStreaming) return
    cancelRef.current.cancelled = true
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setIsThinking(false)
    setIsStreaming(false)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const { TextArea } = Input

  const handleNewChat = async () => {
    try {
      // Create new session
      const session = await api.createSession(MOCK_USER_ID)
      
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
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  }

  const active = useMemo(() => {
    return conversations.find(c => c.id === activeId)
  }, [conversations, activeId])

  if (isLoading) {
    return (
      <Layout className="chat-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading...
        </div>
      </Layout>
    )
  }

  return (
    <Layout className="chat-page">
      <Layout.Sider width={280} collapsedWidth={72} collapsed={collapsed} className={`chat-sider light simple ${collapsed ? 'collapsed' : ''}`}>
        <div className="sider-toolbar simple">
          <div className="toolbar-left">
            <Button type="text" className="toggle-btn" icon={<SidebarToggleIcon />} onClick={() => setCollapsed(v => !v)} />
          </div>
          <div className="toolbar-right">
            <Tooltip title="New chat">
              <Button type="text" icon={<EditOutlined />} onClick={handleNewChat} />
            </Tooltip>
            <Button type="text" icon={<SearchOutlined />} />
          </div>
        </div>
        <div className="sider-history">
          <div className="sider-history-title"><ClockCircleOutlined className="title-icon" /> Chat History</div>
          {conversations.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span>No chat history yet<br/>Start a new conversation to see it here</span>} />
          ) : (
            <List
              dataSource={conversations}
              rowKey={(c) => c.id}
              renderItem={(c) => (
                <List.Item className={`sider-item ${c.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(c.id)}>
                  <List.Item.Meta title={c.title} description={new Date(c.updatedAt).toLocaleString()} />
                </List.Item>
              )}
            />
          )}
        </div>
      </Layout.Sider>
      <Layout.Content>
        <div className={`chat-container ${visibleMessages.length > 0 ? 'with-composer' : ''}`}>
          {visibleMessages.length === 0 ? (
              <div className="hero">
              <div className="hero-icon book">
                <DollarOutlined />
              </div>
              <h1 className="hero-title">Hỏi tôi mọi thứ về tài chính cá nhân!</h1>
              <p className="hero-sub">Tư vấn quản lý chi tiêu, lập ngân sách, kế hoạch tiết kiệm/đầu tư, phòng ngừa rủi ro. Nhập câu hỏi của bạn bên dưới.</p>
              <div className="hero-input">
                <div className="hero-row">
                  <TextArea
                    placeholder="Ví dụ: Lập ngân sách 20 triệu/tháng theo 50/30/20? hoặc Tôi nên đầu tư DCA như thế nào?"
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
                        className="chip-green" 
                        icon={<UploadOutlined />} 
                        onClick={() => setShowOCRUpload(true)}
                      />
                    </Tooltip>
                    <Button shape="circle" className="chip-green" icon={<AudioOutlined />} />
                  </div>
                  <div className="tools-right">
                    <Button
                      shape="circle"
                      className={`send-green ${input.trim() ? 'enabled' : ''}`}
                      icon={<ArrowUpOutlined />}
                      onClick={handleSend}
                      disabled={!input.trim()}
                    />
                  </div>
                </div>
              </div>
              <div className="hero-suggestions">
                <Button className="suggestion" onClick={() => setInput('Lập ngân sách 50/30/20')}>Lập ngân sách 50/30/20</Button>
                <Button className="suggestion" onClick={() => setInput('Kế hoạch đầu tư DCA')}>Kế hoạch đầu tư DCA</Button>
                <Button className="suggestion" onClick={() => setInput('Tối ưu hoá chi tiêu')}>Tối ưu hoá chi tiêu</Button>
              </div>
            </div>
          ) : (
            <>
              <Card className="chat-messages" bodyStyle={{ padding: 0 }}>
                <div style={{ padding: '1rem' }} role="log" aria-live="polite">
                  <div className="chat-stream">
                    {visibleMessages.map(msg => (
                      msg.role === 'assistant' ? (
                        <div key={msg.id} className="msg assistant">
                          <div className="assistant-article">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div key={msg.id} className="msg user">
                          <div className="user-bubble">{msg.content}</div>
                        </div>
                      )
                    ))}
                  </div>
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
              </Card>

              <div className="composer">
                <div className="hero-input">
                  <div className="hero-row">
                    <TextArea
                      placeholder="Nhập câu hỏi tài chính của bạn..."
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
                      <Button shape="circle" className="chip-green" icon={<AudioOutlined />} />
                    </div>
                    <div className="tools-right">
                      {isThinking || isStreaming ? (
                        <Button
                          shape="circle"
                          danger
                          icon={<StopOutlined />}
                          onClick={handleStop}
                        />
                      ) : (
                        <Button
                          shape="circle"
                          className={`send-green ${input.trim() ? 'enabled' : ''}`}
                          icon={<ArrowUpOutlined />}
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
      </Layout.Content>
      
      {/* OCR Upload Modal */}
      {activeId && (
        <OCRUpload
          visible={showOCRUpload}
          onCancel={() => setShowOCRUpload(false)}
          sessionId={activeId}
          userId={MOCK_USER_ID}
          onSuccess={async () => {
            // Reload messages sau khi OCR thành công
            const history = await api.getHistory(activeId)
            setMessages(history.map((msg, idx) => ({
              id: `msg-${activeId}-${idx}`,
              role: msg.role as Role,
              content: msg.content,
              createdAt: Date.now() - (history.length - idx) * 1000,
            })))
            await loadSessions()
          }}
        />
      )}
    </Layout>
  )
}

export default Chat

