"use client"

import { Button } from '@lumiere/shared/components/ui/button'
import Link from "next/link"

export function MarketingHeader() {
  const handleLaunchApp = () => {
    window.location.href = 'https://app.lumiere.trade'
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background shrink-0">
      <div className="mx-auto flex items-center justify-between pl-4 md:pl-6 pr-4 md:pr-6 py-3 md:py-4">
        <Link href="/" className="flex flex-col gap-0.5 transition-all hover:brightness-110">
          <div className="text-xl md:text-2xl font-bold tracking-wider text-primary leading-none">
            LUMIERE
          </div>
          <p className="text-[10px] md:text-[11px] text-muted-foreground tracking-wide leading-none">
            Blind to emotion, guided by algorithm
          </p>
        </Link>

        <nav className="flex items-center justify-end gap-3">
          <Link href="/docs">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 md:px-8 font-semibold"
            >
              DOCS
            </Button>
          </Link>
          <Link href="/learn-more">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 md:px-8 font-semibold"
            >
              LEARN MORE
            </Button>
          </Link>
          <Link href="/terms">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6 md:px-8 font-semibold"
            >
              LEGAL
            </Button>
          </Link>
          <Button
            variant="default"
            size="lg"
            className="rounded-full px-6 md:px-8 font-semibold"
            onClick={handleLaunchApp}
          >
            LAUNCH APP
          </Button>
        </nav>
      </div>
    </header>
  )
}
