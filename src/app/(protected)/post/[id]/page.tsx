'use client'
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, PenSquare, RotateCcw, Share2, ImagePlus, X, Copy } from 'lucide-react'
import {notFound, useParams, useRouter} from "next/navigation"
import Image from "next/image"
import { ShareTwitter } from "@/components/share-twitter"
import { ShareLinkedIn } from "@/components/share-linkedin"
import type { Tables } from "@/lib/database.types"
import { createClient } from "@/utils/supabase/client"
import { ToastProvider, Toast, ToastViewport } from "@/components/ui/toast"

// add media functionality is not fully implemented yet and therefore the respective code in comments

const textareaStyles = {
  backgroundColor: 'white',
  '::selection': {
    backgroundColor: '#dbeafe',
    color: 'inherit'
  },
  '::-moz-selection': {
    backgroundColor: '#dbeafe',
    color: 'inherit'
  }
}

export default function PostPage() {
  const params = useParams()
  const router = useRouter();
  const [editMode, setEditMode] = useState<'x' | 'linkedin' | null>(null)
  const [regeneratePrompt, setRegeneratePrompt] = useState("")
  const [currentPost, setCurrentPost] = useState<Tables<'content_items'> | null>(null)
  const [loading, setLoading] = useState(true)
 // const [media, setMedia] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState("")
  const [aiInstructions, setAiInstructions] = useState("")
  const [isTwitterPopupOpen, setIsTwitterPopupOpen] = useState(false)
  const [activeNetwork, setActiveNetwork] = useState<'x' | 'linkedin' | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [charCount, setCharCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [isLinkedInPopupOpen, setIsLinkedInPopupOpen] = useState(false)

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

  // const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0]
  //   if (file) {
  //     const imageUrl = URL.createObjectURL(file)
  //     setMedia(imageUrl)
  //   }
  // }

  // const removeImage = () => {
  //   setMedia(null)
  // }

  const handleTextSelection = () => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = textarea.value.substring(start, end)
      if (selectedText.length > 0) {
        setSelectedText(selectedText)
        setSelectionStart(start)
        setSelectionEnd(end)
      } else {
        setSelectedText('')
        setSelectionStart(null)
        setSelectionEnd(null)
      }
    }
  }

  const clearSelection = () => {
    if (textareaRef.current) {
      textareaRef.current.style.backgroundColor = 'transparent'
    }
    setSelectedText('')
  }

  const regenerateSelectedText = () => {
    if (!currentPost || !textareaRef.current) return;
    
    const currentValue = textareaRef.current.value
    const start = currentValue.indexOf(selectedText)
    if (start !== -1) {
      const newValue = currentValue.slice(0, start) + 
                       selectedText + " [AI regenerated: " + aiInstructions + "]" + 
                       currentValue.slice(start + selectedText.length)
      
      if (editMode === 'x') {
        setCurrentPost({
          ...currentPost,
          x_description: newValue ?? ''
        })
      } else if (editMode === 'linkedin') {
        setCurrentPost({
          ...currentPost,
          linkedin_description: newValue ?? ''
        })
      }
    }
    setSelectedText("")
    setAiInstructions("")
  }

  const handleShare = (network: 'x' | 'linkedin') => {
    if (network === 'linkedin') {
      setIsLinkedInPopupOpen(true)
    } else {
      setIsTwitterPopupOpen(true)
    }
  }

  const authorizeTwitter = () => {
    console.log(`Scheduling post for ${activeNetwork}`)
    if (activeNetwork === 'x') {
      const redirect = `post/${params.id}`
      router.push(`/auth/twitter?redirect=${encodeURIComponent(redirect)}`);
    } else {
      router.push('/auth/linkedin');
    }
    setIsTwitterPopupOpen(false)
  }

  const handlePublish = async () => {
    if (!currentPost || !activeNetwork) return;

    try {
      if (activeNetwork === 'x') {
        const response = await fetch('/api/platforms/twitter/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tweetContent: currentPost.x_description, // Using the X description from the current post
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to publish the post to X.');
        }

        const result = await response.json();
        console.log('Successfully published to X:', result);
        alert('Post successfully published to X!');
      } else if (activeNetwork === 'linkedin') {
        // Placeholder for LinkedIn publishing logic
        console.log('Publishing to LinkedIn is not implemented yet.');
      }
    } catch (error) {
      console.error('Error publishing to X:', error);
      alert(`Failed to publish to X: ${(error as Error).message}`);
    } finally {
      setIsTwitterPopupOpen(false); // Close the share popup after the action
    }
  };

  const handleXDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentPost) return;
    
    const newText = e.target.value || ''
    if (newText.length > 280) {
      console.log("X posts are limited to 280 characters")
      return
    }
    
    setCharCount(newText.length)
    setCurrentPost({ 
      ...currentPost, 
      x_description: newText
    });
  }

  const handleLinkedInDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentPost) return;
    setCurrentPost({ 
      ...currentPost, 
      linkedin_description: e.target.value || '' // Fallback to empty string
    });
  }

  const handleSave = async () => {
    if (!currentPost) return

    try {
      const response = await fetch('/api/db/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: currentPost.id,
          x_description: currentPost.x_description,
          linkedin_description: currentPost.linkedin_description,
        }),
      })

      if (!response.ok) throw new Error('Failed to update post')
      
      setEditMode(null)
    } catch (error) {
      console.error('Error saving post:', error)
      // You might want to show an error toast here
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!currentPost) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastProvider>
        {showToast && (
          <Toast className="fixed bottom-4 right-4 w-auto h-auto p-2 bg-black text-white">
            <span>Copied!</span>
          </Toast>
        )}
        <ToastViewport />
        <header className="sticky top-0 bg-background z-40">
          <div className="container p-2">
          </div>
        </header>

        <main className="container max-w-2xl mx-auto p-4 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{currentPost?.title || ''}</h1>
            <time className="text-blue-600 font-medium">
              Last updated: {new Date(currentPost?.created_at || new Date()).toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
              })}
            </time>
          </div>

          {/* <div className="space-y-4">
            {media ? (
              <div className="relative aspect-video">
                <Image 
                  src={media}
                  alt="Uploaded media"
                  fill
                  className="object-cover rounded-lg"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-[200px] bg-muted rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <ImagePlus className="h-8 w-8 mb-2 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Add Media</span>
                </label>
              </div>
            )}
          </div> */}

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="h-[200px] p-4 rounded-md border bg-white overflow-y-auto"
              >
                {currentPost?.details || ''}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Regeneration Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter instructions to regenerate the posts (e.g. 'Use more emojis' or 'Include this information: ...')"
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
                className="min-h-[100px]"
              />
              <Button className="mt-4 w-full" disabled={!regeneratePrompt}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Regenerate Posts
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold">X Post</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setEditMode('x')}
                  >
                    <PenSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(currentPost?.x_description || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleShare('x')}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editMode === 'x' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        value={currentPost?.x_description || ''}
                        onChange={handleXDescriptionChange}
                        className="min-h-[200px] max-h-[200px] overflow-y-auto relative z-10 bg-white"
                        onSelect={handleTextSelection}
                      />
                      <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                        {charCount}/280
                      </div>
                      {selectedText && selectionStart !== null && selectionEnd !== null && (
                        <div 
                          className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
                        >
                          <div 
                            className="absolute bg-blue-100"
                            style={{
                              left: `${selectionStart! * 8}px`, // Approximate character width
                              width: `${(selectionEnd! - selectionStart!) * 8}px`, // Width based on selection length
                              top: '0',
                              height: '100%'
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {selectedText && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Enter AI instructions for the selected text"
                          value={aiInstructions}
                          onChange={(e) => {
                            setAiInstructions(e.target.value)
                            if (textareaRef.current) {
                              const text = textareaRef.current.value;
                              const start = text.indexOf(selectedText);
                              if (start !== -1) {
                                textareaRef.current.setSelectionRange(start, start + selectedText.length);
                              }
                            }
                          }}
                          className="min-h-[50px]"
                        />
                        <Button onClick={regenerateSelectedText} disabled={!aiInstructions}>
                          Regenerate Selected Text
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditMode(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="bg-black text-white hover:bg-black/90"
                        onClick={handleSave}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="h-[200px] p-4 rounded-md border bg-white overflow-y-auto"
                    dangerouslySetInnerHTML={{ 
                      __html: currentPost?.x_description || ''
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold">LinkedIn Post</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setEditMode('linkedin')}
                  >
                    <PenSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(currentPost?.linkedin_description || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleShare('linkedin')}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editMode === 'linkedin' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        value={currentPost?.linkedin_description || ''}
                        onChange={handleLinkedInDescriptionChange}
                        className="min-h-[200px] max-h-[200px] overflow-y-auto relative z-10 bg-transparent"
                        onSelect={handleTextSelection}
                      />
                      {selectedText && selectionStart !== null && selectionEnd !== null && (
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(90deg, 
                              transparent 0%,
                              #dbeafe ${(selectionStart / (textareaRef.current?.value.length || 1)) * 100}%, 
                              #dbeafe ${(selectionEnd / (textareaRef.current?.value.length || 1)) * 100}%,
                              transparent ${(selectionEnd / (textareaRef.current?.value.length || 1)) * 100}%
                            )`
                          }}
                        />
                      )}
                    </div>
                    {selectedText && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Enter AI instructions for the selected text"
                          value={aiInstructions}
                          onChange={(e) => {
                            setAiInstructions(e.target.value)
                            if (textareaRef.current) {
                              const text = textareaRef.current.value;
                              const start = text.indexOf(selectedText);
                              if (start !== -1) {
                                textareaRef.current.setSelectionRange(start, start + selectedText.length);
                              }
                            }
                          }}
                          className="min-h-[50px]"
                        />
                        <Button onClick={regenerateSelectedText} disabled={!aiInstructions}>
                          Regenerate Selected Text
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditMode(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="bg-black text-white hover:bg-black/90"
                        onClick={handleSave}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="h-[200px] p-4 rounded-md border bg-white overflow-y-auto"
                    dangerouslySetInnerHTML={{ 
                      __html: currentPost?.linkedin_description || ''
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </main>

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
  )
}


