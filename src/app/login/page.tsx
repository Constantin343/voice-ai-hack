'use client';

import React, { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin } from 'lucide-react';
import { signInWithLinkedIn } from './actions';
import { useSearchParams } from 'next/navigation';

// Mark page as dynamic to prevent static pre-rendering issues
export const dynamic = 'force-dynamic';

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginPageContent />
        </Suspense>
    );
}

function LoginPageContent() {
    const searchParams = useSearchParams();
    const error = searchParams?.get('error');

    return (
        <div className="container mx-auto flex flex-col items-center justify-center min-h-screen">
            {/* Logo and Brand Section */}
            <div className="flex flex-col items-center mb-12">
                {/* Logo and branding */}
            </div>

            {/* Login Box */}
            <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 space-y-6">
                <h1 className="text-center text-3xl font-bold">Sign in to your account</h1>

                {error === 'not_registered' && (
                    <div className="p-4 text-sm text-red-800 bg-red-100 rounded-lg">
                        Account not found. Please register first to use our service.
                    </div>
                )}

                {/* LinkedIn Login Button */}
                <form action={signInWithLinkedIn} method="POST" className="w-full">
                    <Button type="submit" variant="outline" className="w-full flex items-center justify-center">
                        <Linkedin className="mr-2 h-5 w-5" />
                        Continue with LinkedIn
                    </Button>
                </form>
            </div>
        </div>
    );
}