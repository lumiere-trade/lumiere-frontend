"use client"

import { useEffect, useRef } from "react"
import { Sparkles, Loader2, X } from "lucide-react"
import { Button } from "@lumiere/shared/components/ui/button"

interface Message {
  role: "user" | "assistant"
  content: string
  isThinking?: boolean
}

interface ProphetChatModalProps {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
}

export function ProphetChatModal({ isOpen, onClose, messages }: ProphetChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (!isOpen) return null

  return (
    <div 
      className="fixed bottom-56 left-0 right-0 z-50 px-6"
      style={{
        marginLeft: '300px',
        width: 'calc(100vw - 300px)'
      }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-primary/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Prophet AI</h2>
                <p className="text-sm text-muted-foreground">Strategy Creation Assistant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-[450px] overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Start by describing your trading strategy idea.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try: "Generate strategy using RSI"
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0">
                    {message.isThinking ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.isThinking
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-background border border-primary/20"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
