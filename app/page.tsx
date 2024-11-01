'use client'

import * as React from "react"
import { Send, MoreVertical, ChevronLeft, Phone, Video } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { ScrollArea } from "../components/ui/scroll-area" 
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// StockData 인터페이스 추가
interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: string;
  logo: string;
}

// Message 인터페이스 추가
interface Message {
  id: number;
  sender: string;
  content: string;
}

// CodeProps 인터페이스 수정
interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

// 메시지 컴포넌트 분리
const MessageContent = ({ content, sender }: { content: string; sender: string }) => {
  if (sender === "User") {
    return <div className="whitespace-pre-wrap">{content}</div>
  }
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-invert prose-sm max-w-none"
      components={{
        p: ({ children }) => <p className="mb-2 whitespace-pre-wrap">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc list-inside">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal list-inside">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        code: ({ inline, className, children, ...props }: CodeProps) => {
          const match = /language-(\w+)/.exec(className || '')
          return inline ? (
            <code className="px-1 py-0.5 bg-zinc-800 rounded text-sm" {...props}>
              {children}
            </code>
          ) : (
            <pre className="p-3 bg-zinc-800 rounded-lg overflow-x-auto">
              <code className="text-sm" {...props}>
                {children}
              </code>
            </pre>
          )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export default function Component() {
  const [messages, setMessages] = React.useState([
    { id: 1, sender: "AI", content: "안녕하세요! Stockelper AI 어시스턴트입니다. 주식에 대해 어떤 도움이 필요하신가요?" },
  ])
  const [inputMessage, setInputMessage] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const [stockData, setStockData] = React.useState<StockData[]>([])
  const [lastUpdated, setLastUpdated] = React.useState<string>('')

  const fetchStockData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/stocks')
      const data = await response.json()
      const stockArray = Array.isArray(data) ? data : []
      setStockData(stockArray)
      setLastUpdated(new Date().toLocaleTimeString())
      console.log('Stock data updated at:', new Date().toLocaleTimeString(), stockArray)
    } catch (error) {
      console.error('주식 데이터 가져오기 실패:', error)
      setStockData([])
    }
  }

  React.useEffect(() => {
    fetchStockData()

    const interval = setInterval(fetchStockData, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async () => {
    if (inputMessage.trim() !== "") {
      const currentMessage = inputMessage;
      
      setInputMessage("");

      setMessages(prev => [...prev, { 
        id: prev.length + 1, 
        sender: "User", 
        content: currentMessage 
      }])

      setIsTyping(true)

      try {
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: currentMessage,
            session_id: "test123"
          })
        })

        const data = await response.json()
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          sender: "AI",
          content: data.response
        }])
      } catch (error) {
        console.error('Error:', error)
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          sender: "AI",
          content: "죄송합니다. 응답을 받아오는데 문제가 발생했습니다."
        }])
      } finally {
        setIsTyping(false)
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[400px] flex flex-col border-r border-zinc-800 bg-zinc-950">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-lg">NASDAQ 주요 종목</h2>
              <p className="text-xs text-zinc-400">
                마지막 업데이트: {lastUpdated}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchStockData}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          {/* Stock List */}
          <ScrollArea className="flex-1">
            {stockData.length === 0 ? (
              <div className="p-4 text-center text-zinc-400">
                데이터 로딩 중...
              </div>
            ) : (
              [...stockData]
                .sort((a: StockData, b: StockData) => {
                  if (a.symbol.startsWith('^') && !b.symbol.startsWith('^')) return -1;
                  if (!a.symbol.startsWith('^') && b.symbol.startsWith('^')) return 1;
                  return 0;
                })
                .map((stock: StockData) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center gap-4 p-5 hover:bg-zinc-800 cursor-pointer transition-colors duration-200 border-b border-zinc-800/50"
                  >
                    <img
                      src={stock.logo}
                      alt={stock.name}
                      className="h-8 w-8 rounded-full bg-zinc-800"
                      onError={(e) => {
                        e.currentTarget.src = `/placeholder.svg?height=32&width=32`
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{stock.symbol.replace('^', '')}</span>
                        <span className="font-mono">${stock.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">{stock.name}</span>
                        <span className={`text-sm ${stock.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.change}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center p-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Avatar>
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">Stockelper AI</div>
                <div className="text-sm text-zinc-400">온라인</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === "User" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender !== "User" && (
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.sender === "User"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-zinc-800 text-zinc-100 rounded-tl-none"
                    }`}
                  >
                    <MessageContent content={message.content} sender={message.sender} />
                  </div>
                </div>
              ))}
              {/* Typing indicator - Only show when isTyping is true */}
              {isTyping && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="메시지를 입력하세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-400"
              />
              <Button type="submit" size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Unified Footer */}
      <div className="p-3 text-center border-t border-zinc-800 bg-zinc-950">
        <div className="text-xs text-zinc-500">
          Made by: 가짜연구소 9th GJS stockelper
        </div>
        <div className="text-[10px] text-zinc-600 mt-1">
          © 2024 All rights reserved
        </div>
      </div>
    </div>
  )
}