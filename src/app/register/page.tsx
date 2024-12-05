'use client'
import { Button } from '@/components/ui/button'
import { Linkedin } from 'lucide-react'
import { signInWithLinkedIn } from '../login/actions'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function RegisterPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const inviteCode = searchParams.get('code')
    const [isValidating, setIsValidating] = useState(true)
    const [validationError, setValidationError] = useState<string | null>(null)

    useEffect(() => {
        async function validateInviteCode() {
            if (!inviteCode) {
                setValidationError('Invalid or missing invite code')
                setIsValidating(false)
                return
            }

            try {
                const response = await fetch('/api/invite/validate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code: inviteCode }),
                })

                const data = await response.json()
                
                if (!data.valid) {
                    setValidationError('Invalid invite code')
                }
            } catch (error) {
                console.error('Error validating invite code:', error)
                setValidationError('Error validating invite code')
            } finally {
                setIsValidating(false)
            }
        }

        validateInviteCode()
    }, [inviteCode])

    // Create a bound version of signInWithLinkedIn with the invite code
    const handleSignIn = async () => {
        const formData = new FormData()
        formData.append('inviteCode', inviteCode || '')
        await signInWithLinkedIn(formData)
    }

    if (isValidating) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center min-h-screen">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 space-y-6">
                    <p className="text-center">Validating invite code...</p>
                </div>
            </div>
        )
    }

    if (validationError) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center min-h-screen">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 space-y-6">
                    <div className="p-4 text-sm text-red-800 bg-red-100 rounded-lg">
                        {validationError}
                    </div>
                    <p className="text-center text-sm text-gray-600">
                        <a href="/" className="text-blue-600 hover:underline">
                            Return to Landing Page
                        </a>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 space-y-6">
                <h1 className="text-center text-3xl font-bold">Create your account</h1>
                
                {error === 'not_registered' && (
                    <div className="p-4 text-sm text-blue-800 bg-blue-100 rounded-lg">
                        Please create an account to get started.
                    </div>
                )}

                <div className="bg-green-100 p-4 rounded-lg">
                    <p className="text-green-800 text-sm">
                        Welcome! You've been invited to join the beta.
                    </p>
                </div>

                <Button 
                    onClick={handleSignIn}
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                >
                    <Linkedin className="mr-2 h-5 w-5" />
                    Register with LinkedIn
                </Button>

                <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <a href="/login" className="text-blue-600 hover:underline">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    )
} 