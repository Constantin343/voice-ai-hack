'use client'

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import * as React from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import PersonaForm, { PersonaData } from "@/components/persona/PersonaForm"

export default function PersonaPage() {
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<PersonaData>({
    introduction: '',
    uniqueness: '',
    audience: '',
    value_proposition: '',
    style: '',
    goals: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserData(user)
        
        // Fetch existing persona
        const { data: persona } = await supabase
          .from('user_personas')
          .select()
          .single()
        
        if (persona) {
          setFormData({
            introduction: persona.introduction || '',
            uniqueness: persona.uniqueness || '',
            audience: persona.audience || '',
            value_proposition: persona.value_proposition || '',
            style: persona.style || '',
            goals: persona.goals || ''
          })
        }
      }
    }
    fetchData()
  }, [supabase.auth])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Upsert persona data
      const { error: personaError } = await supabase
        .from('user_personas')
        .upsert({
          user_id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        })

      if (personaError) throw personaError

      // Update the LLM
      const response = await fetch('/api/agent/update-persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update agent persona')
      }

      router.push('/knowledgebase')
    } catch (error) {
      console.error('Error saving persona:', error)
      // Add error handling UI here if needed
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof PersonaData, value: string) => {
    setFormData((prev: PersonaData) => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-16">
        {/* Header */}
        <header className="flex items-center gap-4 border-b border-gray-200 pb-6">
          <div className="w-12 h-12">
            {userData?.user_metadata?.picture ? (
              <img 
                src={userData.user_metadata.picture} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">
                  {userData?.user_metadata?.name?.[0] || '?'}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {userData?.user_metadata?.name} 
          </h1>
        </header>

        {isSubmitting && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <p className="text-gray-800">Saving your persona...</p>
            </div>
          </div>
        )}

        <PersonaForm 
          persona={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        {/* Back Button */}
        <Button
          onClick={() => window.location.href = '/knowledgebase'}
          className="mb-2 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          variant="ghost"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
    </div>
  )
}

