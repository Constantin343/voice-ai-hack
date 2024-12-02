import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ShareTwitterProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareTwitter({ isOpen, onClose }: ShareTwitterProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>X Sharing Best Practices</DialogTitle>
          <DialogDescription>
            Tips for maximizing your tweet's reach
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none mt-4 space-y-2 text-muted-foreground">
          <ul className="list-disc pl-4 space-y-1">
          <li>Warm up engagement 10 minutes before posting by interacting with your feed</li>
          <li>Stay active 10-15 minutes after posting to boost initial momentum</li>
          <li>It's the initial engagement that matters most on X</li>

          </ul>
          <p className="text-sm mt-4 italic">
            Pro tip: X's algorithm evaluates each tweet individually - you can post as frequently as you want without penalty. The only thing that matters is the time people spend interacting with the particular tweet.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
