'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface UpgradeDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function UpgradeDialog({ isOpen, onClose }: UpgradeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      })
      const data = await response.json()
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Free Tier Limit Reached</DialogTitle>
          <DialogDescription>
            You've reached your 10 free posts limit. Upgrade to our premium plan for unlimited posts and exclusive features.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <h4 className="font-semibold">Premium Plan Includes:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Unlimited posts</li>
              <li>Priority support</li>
              <li>Coming soon: Advanced features</li>
            </ul>
          </div>
          <Button 
            onClick={handleUpgrade} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Upgrade Now'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 