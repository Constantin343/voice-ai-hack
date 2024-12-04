'use client'

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Share2 } from 'lucide-react'
import { useParams, useRouter, notFound } from "next/navigation"
import { ShareTwitter } from "@/components/share-twitter"
import { ShareLinkedIn } from "@/components/share-linkedin"
import type { Tables } from "@/lib/database.types"
import { createClient } from "@/utils/supabase/client"
import { ToastProvider, Toast, ToastViewport } from "@/components/ui/toast"
import { SelectionPopover } from "@/components/selection-popover"

const textareaStyles = {
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '0.5rem',
  padding: '1rem',
  width: '100%',
  minHeight: '100px',
  outline: 'none',
  '::selection': {
    backgroundColor: '#dbeafe',
    color: 'inherit'
  },
  '::-moz-selection': {
    backgroundColor: '#dbeafe',
    color: 'inherit'
  }
}

interface Selection {
  text: string
  textarea: HTMLTextAreaElement
  start: number
  end: number
}

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const [currentPost, setCurrentPost] = useState<Tables<'content_items'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [charCount, setCharCount] = useState(0)
  const [isTwitterPopupOpen, setIsTwitterPopupOpen] = useState(false)
  const [isLinkedInPopupOpen, setIsLinkedInPopupOpen] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()
  const [lastSavedContent, setLastSavedContent] = useState<{
    x_description?: string,
    linkedin_description?: string
  }>({})

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .eq('id', params.id)
          .single()
        
        if (error) throw error
        
        if (data) {
          if (data.x_description && data.x_description.length > 280) {
            data.x_description = data.x_description.substring(0, 280)
          }
          setCharCount(data.x_description?.length || 0)
          setCurrentPost(data)
          setLastSavedContent({
            x_description: data.x_description,
            linkedin_description: data.linkedin_description
          })
        } else {
          notFound()
        }
      } catch (error) {
        console.error('Error fetching post:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPost()
    }
  }, [params.id])

  useEffect(() => {
    const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }

    const textareas = document.querySelectorAll('textarea')
    textareas.forEach(textarea => {
      adjustTextareaHeight(textarea as HTMLTextAreaElement)
      textarea.addEventListener('input', () => adjustTextareaHeight(textarea as HTMLTextAreaElement))
    })
  }, [currentPost?.x_description, currentPost?.linkedin_description])

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection) return
    
    const text = selection.toString().trim()
    if (text.length > 0) {
      const textarea = document.activeElement as HTMLTextAreaElement
      if (textarea?.tagName === 'TEXTAREA') {
        setSelection({
          text,
          textarea,
          start: textarea.selectionStart,
          end: textarea.selectionEnd
        })
      }
    } else {
      setSelection(null)
    }
  }

  const handleRegenerate = async (instruction: string) => {
    if (!currentPost || !selection) return
    
    try {
      const { textarea, start, end, text } = selection
      
      const platform = textarea.getAttribute('data-platform')
      if (platform !== 'x' && platform !== 'linkedin') {
        throw new Error('Invalid platform')
      }

      const fullText = platform === 'x' ? 
        currentPost.x_description || '' : 
        currentPost.linkedin_description || ''

      const response = await fetch('/api/post/regenerate-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: currentPost.id,
          selectedText: text,
          fullText,
          regenerationInstructions: instruction,
          platform
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate text')
      }

      const currentValue = textarea.value
      const newValue = currentValue.slice(0, start) + data.data.regeneratedText + currentValue.slice(end)
      
      if (platform === 'x' && newValue.length > 280) {
        throw new Error("The regenerated text would exceed X's character limit")
      }

      // Update the textarea value and trigger change event
      textarea.value = newValue
      const event = new Event('change', { bubbles: true })
      textarea.dispatchEvent(event)

      // Update state
      setCurrentPost(prev => {
        if (!prev) return null
        return {
          ...prev,
          [platform === 'x' ? 'x_description' : 'linkedin_description']: newValue
        }
      })

      if (platform === 'x') {
        setCharCount(newValue.length)
      }

      // Auto-save
      const saveResponse = await fetch('/api/db/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentPost.id,
          [platform === 'x' ? 'x_description' : 'linkedin_description']: newValue,
        }),
      })

      if (!saveResponse.ok) {
        console.warn('Failed to auto-save regenerated text')
      }

    } catch (error) {
      console.error('Error regenerating text:', error)
      throw error // Re-throw to let the popup handle the error
    }
  }

  const handleShare = (network: 'x' | 'linkedin') => {
    if (network === 'linkedin') {
      setIsLinkedInPopupOpen(true);
    } else {
      setIsTwitterPopupOpen(true);
    }
  }

  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>, platform: 'x' | 'linkedin') => {
    if (!currentPost) return
    
    let newText = e.target.value
    if (platform === 'x' && newText.length > 280) {
      newText = newText.substring(0, 280)
    }
    
    if (platform === 'x') {
      setCharCount(newText.length)
    }
    
    setCurrentPost(prev => {
      if (!prev) return null
      return {
        ...prev,
        [platform === 'x' ? 'x_description' : 'linkedin_description']: newText
      }
    })

    // Setup auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/db/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentPost.id,
            [platform === 'x' ? 'x_description' : 'linkedin_description']: newText,
          }),
        })

        if (!response.ok) throw new Error('Failed to auto-save')
        
        setLastSavedContent(prev => ({
          ...prev,
          [platform === 'x' ? 'x_description' : 'linkedin_description']: newText
        }))
      } catch (error) {
        console.error('Error auto-saving:', error)
      }
    }, 1000) // Auto-save after 1 second of no typing
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentPost) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ToastProvider>
        {showToast && (
          <Toast className="fixed bottom-4 right-4 w-auto h-auto p-2 bg-black text-white">
            <span>Copied!</span>
          </Toast>
        )}
        <ToastViewport />

        <main className="container max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8 space-y-6">
              <h1 className="text-2xl font-bold">{currentPost?.title}</h1>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Description</h2>
                  <div 
                    className="p-4 rounded-lg border border-gray-200"
                    contentEditable={false}
                  >
                    {currentPost?.details}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">X Post</h2>
                    <div className="flex gap-2">
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-md"
                        onClick={() => copyToClipboard(currentPost?.x_description || '')}
                      >
                        <Copy className="h-5 w-5 text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-md"
                        onClick={() => handleShare('x')}
                      >
                        <Share2 className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      data-platform="x"
                      value={currentPost?.x_description || ''}
                      onChange={(e) => handleTextChange(e, 'x')}
                      onSelect={handleTextSelection}
                      className="w-full p-4 rounded-lg border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
                      placeholder="Write your X post..."
                      rows={1}
                    />
                    <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                      {charCount}/280
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">LinkedIn Post</h2>
                    <div className="flex gap-2">
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-md"
                        onClick={() => copyToClipboard(currentPost?.linkedin_description || '')}
                      >
                        <Copy className="h-5 w-5 text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-md"
                        onClick={() => handleShare('linkedin')}
                      >
                        <Share2 className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    data-platform="linkedin"
                    value={currentPost?.linkedin_description || ''}
                    onChange={(e) => handleTextChange(e, 'linkedin')}
                    onSelect={handleTextSelection}
                    className="w-full p-4 rounded-lg border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
                    placeholder="Write your LinkedIn post..."
                    rows={1}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        {selection && (
          <SelectionPopover
            selectedText={selection.text}
            onClose={() => setSelection(null)}
            onRegenerate={handleRegenerate}
          />
        )}

        <ShareTwitter
          isOpen={isTwitterPopupOpen}
          onClose={() => setIsTwitterPopupOpen(false)}
        />
        
        <ShareLinkedIn
          isOpen={isLinkedInPopupOpen}
          onClose={() => setIsLinkedInPopupOpen(false)}
        />
      </ToastProvider>
    </div>
  );
}


