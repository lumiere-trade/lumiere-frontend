"use client"

import { Button } from '@lumiere/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@lumiere/shared/components/ui/dialog'
import { Settings, Copy } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { useLogger } from "@/hooks/use-logger"
import { LogCategory } from "@/lib/debug"

export function UserProfileModal() {
  const log = useLogger('UserProfileModal', LogCategory.COMPONENT)
  const { toast } = useToast()
  const { user } = useAuth()

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const handleCopyAddress = () => {
    if (user?.walletAddress) {
      log.info('Copying wallet address')
      navigator.clipboard.writeText(user.walletAddress)
      toast({
        title: "Address copied!",
        description: "Wallet address copied to clipboard",
      })
      log.info('Wallet address copied to clipboard')
    } else {
      log.warn('Attempted to copy address but no wallet connected')
      toast({
        title: "Error",
        description: "No wallet address to copy",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => log.info('Settings dialog opened')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border border-primary/30 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">User Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">Wallet Address</label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <span className="flex-1 font-mono text-sm">
                {user?.walletAddress ? shortenAddress(user.walletAddress) : "Not connected"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopyAddress}
                disabled={!user?.walletAddress}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">Wallet Type</label>
            <div className="rounded-lg border border-border bg-background px-3 py-2 capitalize text-sm">
              {user?.walletType || "Unknown"}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">Member Since</label>
            <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Not available"}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
