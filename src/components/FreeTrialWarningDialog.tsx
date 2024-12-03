'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Image from 'next/image'

interface FreeTrialWarningDialogProps {
  isOpen: boolean
  onClose: () => void
  remainingPosts: number
}

export function FreeTrialWarningDialog({ isOpen, onClose, remainingPosts }: FreeTrialWarningDialogProps) {
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

  const handleBookCall = () => {
    window.open('https://booking.akiflow.com/publyc', '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">Your Free Trial is Almost Over!</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 sm:gap-6 mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/20 p-3 sm:p-4 rounded-lg">
              <div className="flex-1">
                <div className="h-2 bg-orange-200 dark:bg-orange-800 rounded-full">
                  <div 
                    className="h-2 bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${(remainingPosts / 10) * 100}%` }}
                  />
                </div>
                <p className="text-xs sm:text-sm mt-2 text-orange-700 dark:text-orange-300">
                  {10 - remainingPosts}/10 posts used
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-base sm:text-lg">Upgrade Now</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-sm sm:text-base">
                  <span className="mr-2">✨</span>
                  Unlimited posts
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="mr-2">🚀</span>
                  Priority support
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <span className="mr-2">🔥</span>
                  Advanced features
                </li>
              </ul>
              <Button 
                onClick={handleUpgrade} 
                disabled={isLoading}
                className="w-full mt-2"
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

            <div className="space-y-3 sm:space-y-4 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6">
              <h4 className="font-semibold text-base sm:text-lg">Or Book a Feedback Call</h4>
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                  <Image
                    src="/images/Leon-image.jpeg"
                    alt="Leon - Co-founder"
                    fill
                    sizes="(max-width: 768px) 48px, 64px"
                    className="rounded-full object-cover"
                    priority
                  />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">Leon</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Co-founder @ Publyc</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm">
                Book a 15-min feedback call with Leon to help us improve Publyc and get 50 additional free posts!
              </p>
              <Button 
                variant="outline" 
                onClick={handleBookCall}
                className="w-full mt-2 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                Book Feedback Call
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 