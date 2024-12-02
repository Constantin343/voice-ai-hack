import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ShareLinkedInProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareLinkedIn({ isOpen, onClose }: ShareLinkedInProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>LinkedIn Sharing Best Practices</DialogTitle>
          <DialogDescription>
            Tips for maximizing your post's impact
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none mt-4 space-y-2 text-muted-foreground">
        <ul className="list-disc pl-4 space-y-1">
          <li>Do not ghost post!<br />Engage at least 10 mins before and after posting</li>
          <li>Best times: Tuesday-Thursday, 10 AM - 12 PM</li>
          <li>Optimal frequency: 2-5 posts per week</li>
          <li>Space posts &gt;24 hours apart</li>
        </ul>
        <p className="text-sm mt-4 italic">
          Pro tip: Don't include external links in your posts - LinkedIn's algorithm favors content that keeps users on the platform. If needed, invite readers to DM you for links or post links in the comments.
        </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
