'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface KnowledgeEntry {
  id: number;
  title: string;
  summary: string;
  category: string;
}

export default function KnowledgePage() {
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserData(user)
      }
    }
    fetchUser()
  }, [supabase.auth])

  // Fetch knowledge entries
  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/knowledgebase/read')
      if (!response.ok) throw new Error('Failed to fetch entries')
      const data = await response.json()
      setKnowledgeEntries(data.entries)
    } catch (err) {
      setError('Failed to load knowledge entries')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      content: formData.get('content'),
      category: formData.get('category')
    }

    try {
      const response = await fetch('/api/knowledgebase/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to add entry')

      // Refresh the entries instead of reloading the page
      await fetchEntries()
    } catch (error) {
      console.error('Error adding entry:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Hero Section */}
      <div className="flex justify-center mb-8">
        <Card className="w-full max-w-3xl overflow-hidden">
          <div className="relative p-8 bg-gradient-to-br from-[#35f] to-black text-white">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24">
                {userData?.user_metadata?.picture ? (
                  <img 
                    src={userData.user_metadata.picture} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center text-2xl font-bold">
                    <span className="text-white">
                      {userData?.user_metadata?.full_name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">{userData?.user_metadata?.name || 'User'}</h1>
                <p className="text-lg text-blue-200">{userData?.user_metadata?.headline || 'Professional'}</p>
                <p className="text-lg max-w-2xl mx-auto text-gray-200">
                  {userData?.user_metadata?.description || 'No description available'}
                </p>
              </div>
              
              <Button 
                onClick={() => window.location.href = '/persona'}
                className="mt-8 px-8 py-6 text-lg font-semibold bg-white text-black hover:bg-white/90 transition-colors"
                size="lg"
              >
                create your publyc persona
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Knowledge Base Section */}
      <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm max-w-3xl mx-auto border-black">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-black dark:text-[#FFFBF0]">Knowledge Base</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" className="bg-black text-white hover:bg-black/90">
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogTitle>Add Knowledge Entry</DialogTitle>
            
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Enter the title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Digital Marketing</SelectItem>
                      <SelectItem value="ai">AI Technology</SelectItem>
                      <SelectItem value="content">Content Strategy</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Enter the content"
                    className="min-h-[150px]"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-black text-white hover:bg-black/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Entry'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table className="[&_tr]:border-black [&_td]:border-black [&_th]:border-black">
            <TableHeader>
              <TableRow>
                <TableHead className="text-black dark:text-[#FFFBF0]">Title</TableHead>
                <TableHead className="text-black dark:text-[#FFFBF0]">Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              ) : knowledgeEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No entries found
                  </TableCell>
                </TableRow>
              ) : (
                knowledgeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-black dark:text-[#FFFBF0] font-medium">
                      {entry.title}
                    </TableCell>
                    <TableCell className="text-black dark:text-[#FFFBF0]">
                      {entry.summary}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}