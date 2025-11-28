import React, { useState, useRef, useEffect } from 'react'
import { Input, Button, Avatar, Spin, message } from 'antd'
import { SendOutlined, UserOutlined, RobotOutlined, ClearOutlined } from '@ant-design/icons'
import { chatWithAgent, type ChatMessage } from '@/services/agent'
import './ChatInterface.css'

interface ChatInterfaceProps {
  onNodeHighlight?: (nodeIds: string[]) => void
  onPathHighlight?: (path: string[]) => void
  style?: React.CSSProperties
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onNodeHighlight,
  onPathHighlight,
  style
}) => {
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是少纳言中医知识图谱智能助手。我可以帮你：\n\n• 查询中医概念和术语\n• 分析节点之间的关系\n• 推荐相关知识点\n• 解答中医相关问题\n\n请告诉我你想了解什么？',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await chatWithAgent(userMessage.content, messages, sessionId)
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata
      }

      setMessages(prev => [...prev, assistantMessage])

      // 处理高亮
      if (response.metadata?.highlightNodes && onNodeHighlight) {
        onNodeHighlight(response.metadata.highlightNodes)
      }
      if (response.metadata?.highlightPath && onPathHighlight) {
        onPathHighlight(response.metadata.highlightPath)
      }

      // 处理建议操作
      if (response.metadata?.suggestions) {
        message.info(`发现 ${response.metadata.suggestions.length} 个相关建议`)
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试，或者尝试重新表述你的问题。',
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: '对话已清空。我可以帮你查询中医知识、分析关系、推荐相关内容。请告诉我你想了解什么？',
        timestamp: new Date()
      }
    ])
    if (onNodeHighlight) onNodeHighlight([])
    if (onPathHighlight) onPathHighlight([])
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-interface" style={style}>
      <div className="chat-header">
        <div className="chat-header__title">
          <RobotOutlined className="chat-header__icon" />
          <span>少纳言智能助手</span>
        </div>
        <Button
          type="text"
          icon={<ClearOutlined />}
          onClick={handleClear}
          size="small"
          className="chat-header__clear"
        >
          清空
        </Button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message chat-message--${msg.role}`}
          >
            <Avatar
              icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              className={`chat-message__avatar chat-message__avatar--${msg.role}`}
            />
            <div className="chat-message__content">
              <div className="chat-message__text">
                {msg.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              {msg.metadata?.nodes && msg.metadata.nodes.length > 0 && (
                <div className="chat-message__nodes">
                  <div className="chat-message__nodes-label">相关节点：</div>
                  <div className="chat-message__nodes-list">
                    {msg.metadata.nodes.map((node, i) => (
                      <span key={i} className="chat-message__node-tag">
                        {node.name || node.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {msg.metadata?.suggestions && msg.metadata.suggestions.length > 0 && (
                <div className="chat-message__suggestions">
                  <div className="chat-message__suggestions-label">建议操作：</div>
                  {msg.metadata.suggestions.map((suggestion, i) => (
                    <Button
                      key={i}
                      type="link"
                      size="small"
                      onClick={() => setInput(suggestion)}
                      className="chat-message__suggestion-btn"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
              <div className="chat-message__time">
                {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message chat-message--assistant">
            <Avatar
              icon={<RobotOutlined />}
              className="chat-message__avatar chat-message__avatar--assistant"
            />
            <div className="chat-message__content">
              <Spin size="small" />
              <span style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.6)' }}>
                正在思考...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <Input.TextArea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入你的问题，例如：什么是脾虚？脾虚和什么证候相关？"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
          className="chat-input"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          disabled={!input.trim()}
          className="chat-send-btn"
        >
          发送
        </Button>
      </div>
    </div>
  )
}

export default ChatInterface

