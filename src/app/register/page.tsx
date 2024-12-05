'use client'
import { Button } from '@/components/ui/button'
import { Linkedin } from 'lucide-react'
import { signInWithLinkedIn } from '../login/actions'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { redirect } from 'next/navigation'

const VALID_INVITE_CODE = 'EARLY-ACCESS-2024'

export default function RegisterPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const inviteCode = searchParams.get('code')

    useEffect(() => {
        // Redirect to home if no invite code or invalid code
        if (!inviteCode || inviteCode !== VALID_INVITE_CODE) {
            redirect('/')
        }
    }, [inviteCode])

    // Create a bound version of signInWithLinkedIn with the invite code
    const handleSignIn = async () => {
        const formData = new FormData()
        formData.append('inviteCode', inviteCode || '')
        await signInWithLinkedIn(formData)
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