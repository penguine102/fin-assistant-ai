import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Layout, Input, Button, Card, List, Empty, Tooltip } from 'antd'
import { ArrowUpOutlined, SearchOutlined, EditOutlined, AudioOutlined, UploadOutlined, ClockCircleOutlined, DollarOutlined, StopOutlined } from '@ant-design/icons'
import { findMockReply } from '../mocks/chatMock'

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
}

const initialMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'system',
    content: 'Bạn là Trợ lý Tài chính cá nhân (Finance Assistant). Nhiệm vụ: tư vấn quản lý chi tiêu, lập ngân sách, đầu tư cơ bản, cảnh báo rủi ro. Ngôn ngữ: Tiếng Việt, giải thích ngắn gọn, có ví dụ số liệu khi phù hợp.',
    createdAt: Date.now() - 10000,
  },
]

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function mockFinanceReply(userText: string): string {
  const text = userText.toLowerCase()
  if (/(ngân sách|budget)/.test(text)) {
    return [
      '**Gợi ý ngân sách 50/30/20:**',
      '- 50% thiết yếu (nhà ở, ăn uống, đi lại)',
      '- 30% mong muốn (giải trí, du lịch)',
      '- 20% tiết kiệm/đầu tư',
      'Ví dụ thu nhập 20tr: 10tr thiết yếu, 6tr mong muốn, 4tr tiết kiệm.',
    ].join('\n')
  }
  if (/(đầu tư|invest|chứng khoán|etf)/.test(text)) {
    return [
      '**Khung đầu tư cơ bản:**',
      '- Ưu tiên quỹ dự phòng 3-6 tháng chi tiêu',
      '- Phân bổ: 60-80% ETF/Index, 10-20% trái phiếu, 5-10% tiền mặt',
      '- Đa dạng hoá, DCA hàng tháng, tránh all-in một thời điểm',
      'Lưu ý: Đây không phải khuyến nghị mua bán cụ thể.',
    ].join('\n')
  }
  if (/(nợ|vay|credit|thẻ)/.test(text)) {
    return [
      '**Quy tắc xử lý nợ:**',
      '- Trả nợ lãi cao trước (snowball/avalanche)',
      '- Hạn chế nợ tiêu dùng, ưu tiên nợ phục vụ sản xuất/giá trị tăng',
      '- Tỷ lệ trả nợ/tháng <= 30-40% thu nhập',
    ].join('\n')
  }
  if (/(bảo hiểm|insurance)/.test(text)) {
    return [
      '**Nguyên tắc bảo hiểm:**',
      '- Bảo hiểm y tế, nhân thọ/tài sản theo nhu cầu',
      '- Phí bảo hiểm thường <= 10% thu nhập năm',
      '- So sánh điều khoản, loại trừ trước khi ký',
    ].join('\n')
  }
  return [
    'Tôi đã ghi nhận câu hỏi. Bạn có thể cung cấp:',
    '- Thu nhập, chi phí cố định/thay đổi',
    '- Mục tiêu (mua nhà, quỹ học, nghỉ hưu)',
    '- Khẩu vị rủi ro (thấp/vừa/cao), thời gian đầu tư',
    'Tôi sẽ gợi ý kế hoạch phù hợp.',
  ].join('\n')
}

const SidebarToggleIcon: React.FC = () => (
  <span className="toggle-icon" aria-hidden>
    <span className="toggle-left" />
    <span className="toggle-right" />
  </span>
)

const Chat: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([{
    id: 'c1',
    title: 'New chat',
    messages: initialMessages,
    createdAt: Date.now() - 9000,
    updatedAt: Date.now() - 9000,
  }])
  const [activeId, setActiveId] = useState<string>('c1')
  const active = useMemo(() => conversations.find(c => c.id === activeId)!, [conversations, activeId])
  const [messages, setMessages] = useState<ChatMessage[]>(active.messages)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false })

  const visibleMessages = useMemo(() => messages.filter(m => m.role !== 'system'), [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  useEffect(() => {
    setMessages(active.messages)
  }, [activeId])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
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

    // Chuẩn bị trả lời (ưu tiên mock), sau đó delay 3s rồi stream
    const mocked = findMockReply(text)
    const fullReply = mocked ?? mockFinanceReply(text)

    // Chờ 3 giây để mô phỏng suy nghĩ
    await new Promise(r => setTimeout(r, 3000))
    if (cancelRef.current.cancelled) {
      setIsThinking(false)
      return
    }

    // Bắt đầu stream từng ký tự
    setIsThinking(false)
    setIsStreaming(true)
    const assistantId = generateId('a')
    const startAssistant: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }
    setMessages(prev => [...prev, startAssistant])

    let accumulated = ''
    const textArray = Array.from(fullReply)
    for (let i = 0; i < textArray.length; i++) {
      if (cancelRef.current.cancelled) {
        break
      }
      accumulated += textArray[i]
      // Nhịp gõ mượt: tăng nhẹ với ký tự xuống dòng/đoạn
      const ch = textArray[i]
      let delay = 14
      if (ch === '\n') delay = 28
      if (ch === '.' || ch === ',' || ch === ';' || ch === '!' || ch === '?') delay = 18
      // Giảm số lần setState: chỉ cập nhật mỗi 2 ký tự hoặc khi gặp xuống dòng / dấu kết câu
      const shouldFlush = i % 2 === 0 || ch === '\n' || ch === '.' || ch === '!' || ch === '?' 
      if (shouldFlush) {
        await new Promise(r => setTimeout(r, delay))
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m))
      }
    }

    // Sau khi stream xong, ghi lại vào lịch sử hội thoại với toàn bộ nội dung
    const finalAssistant: ChatMessage = { ...startAssistant, content: accumulated }
    setIsStreaming(false)
    setConversations(prev => prev.map(c => {
      if (c.id !== activeId) return c
      const currentMessages = messages
      const next: Conversation = {
        ...c,
        messages: [...currentMessages, userMsg, finalAssistant],
        updatedAt: Date.now(),
        title: c.title === 'New chat' && currentMessages.filter(m => m.role !== 'system').length === 0
          ? (userMsg.content.slice(0, 30) || 'Cuộc trò chuyện')
          : c.title,
      }
      return next
    }))
  }

  const handleStop = () => {
    if (!isThinking && !isStreaming) return
    cancelRef.current.cancelled = true
    if (isThinking) setIsThinking(false)
    // isStreaming sẽ được tắt khi vòng lặp kiểm tra cờ và kết thúc
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const { TextArea } = Input

  const handleNewChat = () => {
    const id = generateId('c')
    const conv: Conversation = {
      id,
      title: 'New chat',
      messages: initialMessages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setConversations(prev => [conv, ...prev])
    setActiveId(id)
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
                    <Button shape="circle" className="chip-green" icon={<UploadOutlined />} />
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
                <Card className="suggestion">Lập ngân sách 50/30/20</Card>
                <Card className="suggestion">Kế hoạch đầu tư DCA</Card>
                <Card className="suggestion">Tối ưu hoá chi tiêu</Card>
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
                      <Button shape="circle" className="chip-green" icon={<UploadOutlined />} />
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
    </Layout>
  )
}

export default Chat


