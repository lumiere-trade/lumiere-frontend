import Link from "next/link"
import { Twitter, MessageCircle, Send, Github, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold tracking-wider text-primary">
              LUMIERE
            </div>
            <p className="text-[13px] text-muted-foreground">
              Blind to emotion, guided by algorithm
            </p>
          </div>
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
            <a href="mailto:hello@lumiere.trade" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              hello@lumiere.trade
            </a>
            <span className="text-muted-foreground">
              © {new Date().getFullYear()} Lumiere
            </span>
          </div>
          <div className="flex gap-3">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </a>
            <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
              <Send className="w-4 h-4" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
