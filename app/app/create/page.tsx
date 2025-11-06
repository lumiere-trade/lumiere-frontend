"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NavigationHeader } from '@/components/navigation/NavigationHeader'
import { StrategyPanel } from '@/components/strategy/StrategyPanel'
import { Button } from '@lumiere/shared/components/ui/button'
import { Sparkles, Send } from "lucide-react"
import { storage } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { logger, LogCategory } from "@/lib/debug"

const examplePrompts = [
  "Create a momentum strategy for SOL/USD",
  "Build a mean reversion strategy using RSI",
  "Design a breakout strategy for volatile tokens",
  "Copy a successful whale wallet's trades",
]

export default function CreatePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    logger.info(LogCategory.AUTH, 'Create page mounted, checking JWT...')

    if (!storage.hasToken()) {
      logger.warn(LogCategory.AUTH, 'No JWT found, redirecting to login')
      router.replace('/login')
      return
    }

    if (!isLoading && !user) {
      logger.warn(LogCategory.AUTH, 'JWT invalid, redirecting to login')
      router.replace('/login')
    }
  }, [router, user, isLoading])

  if (!storage.hasToken() || isLoading) {
    return null
  }

  const handleSend = () => {
    if (!input.trim()) return
    
    setMessages([...messages, { role: "user", content: input }])
    setInput("")
    
    // TODO: Integrate with Prophet API
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm analyzing your request. Prophet AI integration coming soon..."
      }])
    }, 1000)
  }

  const handleExamplePrompt = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader currentPage="create" isSidebarOpen={isSidebarOpen} />

      <StrategyPanel isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div
        className="pt-[73px] transition-all duration-300"
        style={{
          marginLeft: isSidebarOpen ? '300px' : '32px',
          width: isSidebarOpen ? 'calc(100vw - 300px)' : 'calc(100vw - 32px)'
        }}
      >
        <div className="flex items-center justify-center px-6 py-12">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="w-full max-w-3xl space-y-8">
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-3">
                    Ready to create your strategy?
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Describe your trading idea in natural language
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    placeholder="How can I help you today?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    className="w-full min-h-[120px] rounded-2xl border border-primary/30 bg-card px-6 py-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                  />
                  <Button
                    size="icon"
                    className="absolute bottom-4 right-4 h-10 w-10 rounded-full"
                    onClick={handleSend}
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">Try one of these:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {examplePrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleExamplePrompt(prompt)}
                        className="rounded-xl border border-primary/20 bg-card/50 px-4 py-3 text-sm text-left transition-all hover:border-primary/40 hover:bg-card"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl ${
                    message.role === "user"
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-card border border-primary/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {message.role === "assistant" && (
                      <>
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">Prophet</span>
                      </>
                    )}
                    {message.role === "user" && (
                      <span className="text-sm font-semibold text-foreground">You</span>
                    )}
                  </div>
                  <p className="text-base leading-relaxed text-foreground">{message.content}</p>
                </div>
              ))}

              <div className="relative">
                <textarea
                  placeholder="Continue the conversation..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  className="w-full min-h-[100px] rounded-2xl border border-primary/30 bg-card px-6 py-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button
                  size="icon"
                  className="absolute bottom-4 right-4 h-10 w-10 rounded-full"
                  onClick={handleSend}
                  disabled={!input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
