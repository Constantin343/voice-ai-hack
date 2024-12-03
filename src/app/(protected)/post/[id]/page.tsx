'use client'
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, PenSquare, RotateCcw, Share2, ImagePlus, X, Copy, Check } from 'lucide-react'
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
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [showRegenerationSuccess, setShowRegenerationSuccess] = useState(false)
 // const [media, setMedia] = useState<string | null>(null)
  const [selectedText, setSelectedText] = useState("")
  const [aiInstructions, setAiInstructions] = useState("")
  const [regeneratedText, setRegeneratedText] = useState<string | null>(null)
  const [isRegeneratingSelection, setIsRegeneratingSelection] = useState(false)
  const [selectionStart, setSelectionStart] = useState<number | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null)
  const [isTwitterPopupOpen, setIsTwitterPopupOpen] = useState(false)
  const [activeNetwork, setActiveNetwork] = useState<'x' | 'linkedin' | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
        setRegeneratedText(null) // Clear any previous regeneration
      } else {
        clearSelection()
      }
    }
  }

  const clearSelection = () => {
    setSelectedText('')
    setSelectionStart(null)
    setSelectionEnd(null)
    setAiInstructions('')
    setRegeneratedText(null)
  }

  const regenerateSelectedText = async () => {
    if (!currentPost || !textareaRef.current || !selectedText || !aiInstructions) return;
    
    setIsRegeneratingSelection(true);
    try {
      // Prepare the request body and ensure proper encoding
      const requestBody = {
        postId: currentPost.id,
        selectedText: selectedText.replace(/[\uD800-\uDFFF]/g, ''), // Remove surrogate pairs
        fullText: (editMode === 'x' ? currentPost.x_description : currentPost.linkedin_description)?.replace(/[\uD800-\uDFFF]/g, ''),
        regenerationInstructions: aiInstructions,
        platform: editMode
      };

      const response = await fetch('/api/post/regenerate-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate text');
      }

      setRegeneratedText(data.data.regeneratedText);
    } catch (error) {
      console.error('Error regenerating text:', error);
      alert(error instanceof Error ? error.message : 'Failed to regenerate text');
    } finally {
      setIsRegeneratingSelection(false);
    }
  }

  const applyRegeneratedText = () => {
    if (!currentPost || !textareaRef.current || !regeneratedText || selectionStart === null || selectionEnd === null) return;

    const currentValue = textareaRef.current.value;
    const newValue = currentValue.slice(0, selectionStart) + 
                     regeneratedText + 
                     currentValue.slice(selectionEnd);

    if (editMode === 'x') {
      if (newValue.length > 280) {
        alert("The regenerated text would exceed X's character limit");
        return;
      }
      setCurrentPost({
        ...currentPost,
        x_description: newValue
      });
    } else if (editMode === 'linkedin') {
      setCurrentPost({
        ...currentPost,
        linkedin_description: newValue
      });
    }

    clearSelection();
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

  const handleRegenerate = async () => {
    if (!currentPost || !regeneratePrompt) return;

    setIsRegenerating(true);
    try {
      const response = await fetch('/api/post/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: currentPost.id,
          regenerationInstructions: regeneratePrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate post');
      }

      const { data } = await response.json();
      
      setCurrentPost({
        ...currentPost,
        x_description: data.x_description,
        linkedin_description: data.linkedin_description,
      });

      setRegeneratePrompt('');
      setShowRegenerationSuccess(true);
      setTimeout(() => setShowRegenerationSuccess(false), 3000);
    } catch (error) {
      console.error('Error regenerating post:', error);
      // You might want to show an error toast here
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentPost?.x_description, currentPost?.linkedin_description, editMode]);

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
                className="h-[400px] p-4 rounded-md border bg-white overflow-y-auto"
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
                className="min-h-[180px]"
              />
              <Button 
                className="mt-4 w-full relative" 
                disabled={!regeneratePrompt || isRegenerating}
                onClick={handleRegenerate}
              >
                {isRegenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Regenerate Posts
                  </>
                )}
              </Button>
              {showRegenerationSuccess && (
                <div className="mt-2 text-center text-sm text-green-600 animate-fade-out">
                  Regeneration complete!
                </div>
              )}
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
                        className="min-h-[100px] h-auto resize-none"
                        style={{ height: textareaRef.current?.scrollHeight + 'px' }}
                        onSelect={handleTextSelection}
                      />
                      <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                        {charCount}/280
                      </div>
                    </div>
                    {selectedText && (
                      <div className="space-y-2 p-4 border rounded-md bg-gray-50">
                        <div className="text-sm font-medium text-gray-700">Selected Text:</div>
                        <div className="p-2 bg-white rounded border">{selectedText}</div>
                        
                        <Textarea
                          placeholder="Enter instructions for regenerating this text"
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
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={regenerateSelectedText} 
                            disabled={!aiInstructions || isRegeneratingSelection}
                            className="relative"
                          >
                            {isRegeneratingSelection ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Regenerate Selection
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={clearSelection}
                          >
                            Cancel
                          </Button>
                        </div>

                        {regeneratedText && (
                          <div className="mt-4 space-y-2">
                            <div className="text-sm font-medium text-gray-700">Regenerated Text:</div>
                            <div className="p-2 bg-white rounded border">{regeneratedText}</div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={applyRegeneratedText}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Apply Changes
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setRegeneratedText(null)}
                              >
                                Discard
                              </Button>
                            </div>
                          </div>
                        )}
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
                    className="min-h-[100px] h-auto p-4 rounded-md border bg-white whitespace-pre-wrap"
                  >
                    {currentPost?.x_description || ''}
                  </div>
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
                        className="min-h-[100px] h-auto resize-none"
                        style={{ height: textareaRef.current?.scrollHeight + 'px' }}
                        onSelect={handleTextSelection}
                      />
                    </div>
                    {selectedText && (
                      <div className="space-y-2 p-4 border rounded-md bg-gray-50">
                        <div className="text-sm font-medium text-gray-700">Selected Text:</div>
                        <div className="p-2 bg-white rounded border">{selectedText}</div>
                        
                        <Textarea
                          placeholder="Enter instructions for regenerating this text"
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
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={regenerateSelectedText} 
                            disabled={!aiInstructions || isRegeneratingSelection}
                            className="relative"
                          >
                            {isRegeneratingSelection ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Regenerate Selection
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={clearSelection}
                          >
                            Cancel
                          </Button>
                        </div>

                        {regeneratedText && (
                          <div className="mt-4 space-y-2">
                            <div className="text-sm font-medium text-gray-700">Regenerated Text:</div>
                            <div className="p-2 bg-white rounded border">{regeneratedText}</div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={applyRegeneratedText}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Apply Changes
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setRegeneratedText(null)}
                              >
                                Discard
                              </Button>
                            </div>
                          </div>
                        )}
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
                    className="min-h-[100px] h-auto p-4 rounded-md border bg-white whitespace-pre-wrap"
                  >
                    {currentPost?.linkedin_description || ''}
                  </div>
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


