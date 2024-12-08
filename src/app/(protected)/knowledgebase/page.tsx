'use client'

import React, {useState, useEffect} from 'react'
import {createClient} from "@/utils/supabase/client"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Button} from "@/components/ui/button"
import {Textarea} from "@/components/ui/textarea"
import { Pencil, Trash2 } from 'lucide-react'

interface KnowledgeEntry {
    id: number;
    title: string;
    content: string;
    summary: string;
}

export default function KnowledgePage() {
    const supabase = createClient()
    const [userData, setUserData] = useState<any>(null)
    const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const {data: {user}} = await supabase.auth.getUser()
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

    const handleUpdate = async (entry: KnowledgeEntry) => {
        try {
            const response = await fetch('/api/knowledgebase/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: entry.id,
                    title: entry.title,
                    content: editedContent,
                }),
            });

            if (!response.ok) throw new Error('Failed to update entry');
            
            await fetchEntries();
            setIsEditing(false);
            setSelectedEntry(null);
        } catch (error) {
            console.error('Error updating entry:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        
        setIsDeleting(true);
        try {
            console.log('Deleting entry:', id);
            const response = await fetch('/api/knowledgebase/delete', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id }),
            });

            const data = await response.json();
            console.log('Delete response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete entry');
            }
            
            if (data.success) {
                await fetchEntries();
                setSelectedEntry(null);
            } else {
                throw new Error(data.error || 'Failed to delete entry');
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Failed to delete entry. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

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
                                    <div
                                        className="w-full h-full bg-white/10 rounded-full flex items-center justify-center text-2xl font-bold">
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
                                {userData?.user_metadata?.location && (
                                    <p className="text-lg max-w-2xl mx-auto text-gray-200">
                                        {userData?.user_metadata?.description || 'No description available'}
                                    </p>
                                )}
                            </div>

                            <Button
                                onClick={() => window.location.href = '/persona'}
                                className="mt-8 px-8 py-6 text-lg font-semibold bg-white text-black hover:bg-white/90 transition-colors"
                                size="lg"
                            >
                                update your publyc persona
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
                                    <TableCell colSpan={2} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-red-500">{error}</TableCell>
                                </TableRow>
                            ) : knowledgeEntries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">No entries found</TableCell>
                                </TableRow>
                            ) : (
                                knowledgeEntries.map((entry) => (
                                    <TableRow key={entry.id} 
                                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                            onClick={() => setSelectedEntry(entry)}>
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

            {/* Update the View/Edit Entry Dialog */}
            {selectedEntry && (
                <Dialog open={!!selectedEntry} onOpenChange={() => {
                    setSelectedEntry(null);
                    setIsEditing(false);
                    setEditedContent('');
                }}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{selectedEntry.title}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                            <Label>Content</Label>
                            {isEditing ? (
                                <Textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="mt-2 min-h-[150px]"
                                />
                            ) : (
                                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                                    {selectedEntry.content}
                                </div>
                            )}
                        </div>
                        
                        {/* Footer buttons */}
                        <div className="mt-6 flex justify-end gap-2">
                            {isEditing ? (
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        handleUpdate({
                                            ...selectedEntry,
                                            content: editedContent
                                        });
                                    }}
                                    className="bg-black text-white hover:bg-black/90"
                                >
                                    Save Changes
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEditedContent(selectedEntry.content);
                                            setIsEditing(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleDelete(selectedEntry.id)}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}