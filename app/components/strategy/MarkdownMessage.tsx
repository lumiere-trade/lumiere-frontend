"use client"

import ReactMarkdown from 'react-markdown'

interface MarkdownMessageProps {
  content: string
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none select-text">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-foreground mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-foreground mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-foreground mt-3 mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-base text-foreground leading-relaxed mb-2">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-foreground">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-base text-foreground">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-sm font-mono text-foreground">
              {children}
            </code>
          ),
          pre: ({ children }) => {
            const getTextContent = (node: any): string => {
              if (typeof node === 'string') return node
              if (Array.isArray(node)) return node.map(getTextContent).join('')
              if (node?.props?.children) return getTextContent(node.props.children)
              return ''
            }

            const textContent = getTextContent(children).trim()

            if (!textContent || textContent.length === 0) {
              return null
            }

            return (
              <pre className="p-3 rounded-lg bg-background border border-primary/20 overflow-x-auto mb-3">
                {children}
              </pre>
            )
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-3">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-4 border-t border-primary/20" />
          ),
          a: ({ href, children }) => (
            
              <a href={href}
              className="text-primary hover:text-primary/80 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
