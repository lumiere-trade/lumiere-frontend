import Link from "next/link"
import { Twitter, MessageCircle, Send, Github, Mail } from "lucide-react"

interface FooterProps {
  isSidebarOpen?: boolean
}

export function Footer({ isSidebarOpen = false }: FooterProps) {
  return (
    <footer 
      className="fixed bottom-0 z-30 border-t border-border/50 bg-background transition-all duration-300"
      style={{
        left: isSidebarOpen ? '300px' : '0',
        width: isSidebarOpen ? 'calc(100vw - 300px)' : '100vw'
      }}
    >
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors">
              Documentation
            </Link>
            <Link href="/learn-more" className="text-muted-foreground hover:text-primary transition-colors">
              Learn More
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Use
            </Link>
            <a href="mailto:hello@lumiere.trade" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              <Mail className="w-4 h-4" />
              hello@lumiere.trade
            </a>
            <span className="text-muted-foreground">
              © {new Date().getFullYear()} Lumière
            </span>
          </div>
          
          <div className="flex gap-3 mr-8">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
              <Send className="w-5 h-5" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
