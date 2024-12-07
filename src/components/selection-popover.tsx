'use client'

import { useState, useEffect, useRef } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { X } from 'lucide-react'

interface SelectionPopoverProps {
  selectedText: string
  onClose: () => void
  onRegenerate: (instruction: string) => Promise<void>
}

export function SelectionPopover({
  selectedText,
  onClose,
  onRegenerate
}: SelectionPopoverProps) {
  const [instruction, setInstruction] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 144) // 144px = 6 lines * 24px line height
    textarea.style.height = `${newHeight}px`
    textarea.style.overflowY = textarea.scrollHeight > 144 ? 'auto' : 'hidden'
  }

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstruction(e.target.value)
    adjustTextareaHeight()
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [instruction])

  const handleRegenerate = async () => {
    if (!instruction) return
    setIsLoading(true)
    setError(null)
    
    try {
      await onRegenerate(instruction)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to regenerate text')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    setInstruction(action)
    setIsLoading(true)
    setError(null)
    
    try {
      await onRegenerate(action)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to regenerate text')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <style jsx>{`
        @keyframes shadowPulse {
          0% {
            box-shadow: 0 0 20px 0px rgba(59, 130, 246, 0.1);
            transform: translateY(0);
          }
          50% {
            box-shadow: 0 0 30px 5px rgba(59, 130, 246, 0.2);
            transform: translateY(-2px);
          }
          100% {
            box-shadow: 0 0 20px 0px rgba(59, 130, 246, 0.1);
            transform: translateY(0);
          }
        }
        .animate-shadow {
          animation: shadowPulse 3s ease-in-out infinite;
        }

        @media (min-width: 1024px) {
          .main-content-centered {
            width: calc(100% - 240px);
            margin-left: 240px;
          }
        }
      `}</style>
      <div className="main-content-centered">
        <div className="max-w-3xl mx-auto px-8">
          <div ref={popoverRef} className="bg-white w-full animate-shadow rounded-xl">
            <div className="relative p-6">
              {/* Close button - always in top right */}
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Selected text */}
              <div className="text-gray-600 mb-4 pr-8">
                Selected text: <div className="text-gray-900 mt-1 max-h-[10em] overflow-y-auto whitespace-pre-wrap scrollbar-thin">{selectedText}</div>
              </div>

              {/* Input field */}
              <textarea
                ref={textareaRef}
                placeholder="Enter regeneration instructions..."
                value={instruction}
                onChange={handleInstructionChange}
                className="w-full p-3 mb-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-400 min-h-[3.5rem] resize-none"
                rows={2}
                style={{
                  lineHeight: '1.5rem',
                }}
              />

              {error && (
                <div className="text-sm text-red-500 mb-4">
                  {error}
                </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => handleQuickAction('Make shorter')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 9h16M4 15h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Make shorter
                </button>
                <button
                  onClick={() => handleQuickAction('Fix grammar')}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  <span className="font-serif">T</span>
                  Fix grammar
                </button>
              </div>

              {/* Regenerate button */}
              <button
                onClick={handleRegenerate}
                disabled={isLoading || !instruction}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4V2M12 22v-2M6 12H4m16 0h-2m-.364-5.636l-1.414 1.414M5.778 18.222l-1.414 1.414m0-12.728l1.414 1.414m12.728 12.728l-1.414-1.414M12 17a5 5 0 100-10 5 5 0 000 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Regenerate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 