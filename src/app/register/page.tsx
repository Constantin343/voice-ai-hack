'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin } from 'lucide-react';
import { signInWithLinkedIn } from '../login/actions';
import { useSearchParams, useRouter } from 'next/navigation';

// Mark the page as dynamic
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterPageContent />
        </Suspense>
    );
}

function RegisterPageContent() {
    const searchParams = useSearchParams();
    const error = searchParams?.get('error');
    const inviteCode = searchParams?.get('code');
    const [isValidating, setIsValidating] = useState(true);
    const [validationError, setValidationError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        async function validateInviteCode() {
            if (!inviteCode) {
                setValidationError('Invalid or missing invite code');
                setIsValidating(false);
                return;
            }

            try {
                const response = await fetch('/api/invite/validate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code: inviteCode }),
                });

                const data = await response.json();

                if (!data.valid) {
                    setValidationError('Invalid invite code');
                }
            } catch (error) {
                console.error('Error validating invite code:', error);
                setValidationError('Error validating invite code');
            } finally {
                setIsValidating(false);
            }
        }

        validateInviteCode();
    }, [inviteCode]);

    const handleSignIn = async () => {
        const formData = new FormData();
        formData.append('inviteCode', inviteCode || '');
        await signInWithLinkedIn(formData);
    };

    if (isValidating) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center min-h-screen">
                <div className="flex flex-col items-center mb-12">
                    <div
                        className="cursor-pointer"
                        onClick={() => router.push('/')}
                    >
                        <svg
                            width="128"
                            height="128"
                            viewBox="0 0 1200 1200"
                            fill="black"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M646.5,162.5C773.278,157.843 880.444,200.843 968,291.5C1041.05,375.71 1073.05,473.71 1064,585.5C1058.36,642.076 1038.36,692.743 1004,737.5C955.628,794.176 895.128,813.343 822.5,795C794.495,787.332 766.495,779.666 738.5,772C673.007,758.494 627.173,782.327 601,843.5C591.844,869.079 588.511,895.412 591,922.5C593.386,942.203 596.053,961.869 599,981.5C600.466,994.469 600.799,1007.47 600,1020.5C594.162,1053.85 574.328,1069.01 540.5,1066C524.12,1063.88 509.12,1058.21 495.5,1049C475.549,1035.06 457.382,1018.89 441,1000.5C385,935.167 329,869.833 273,804.5C246.069,773.966 222.069,741.299 201,706.5C145.576,608.242 139.909,507.242 184,403.5C220.058,330.776 274.224,275.942 346.5,239C425.156,200.25 508.156,176.25 595.5,167C612.625,165.159 629.625,163.659 646.5,162.5Z" />
                        </svg>
                    </div>
                </div>
                <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 space-y-6">
                    <p className="text-center">Validating invite code...</p>
                </div>
            </div>
        );
    }

    if (validationError) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center min-h-screen">
                <div className="flex flex-col items-center mb-12">
                    <div
                        className="cursor-pointer"
                        onClick={() => router.push('/')}
                    >
                        <svg
                            width="128"
                            height="128"
                            viewBox="0 0 1200 1200"
                            fill="black"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M646.5,162.5C773.278,157.843 880.444,200.843 968,291.5C1041.05,375.71 1073.05,473.71 1064,585.5C1058.36,642.076 1038.36,692.743 1004,737.5C955.628,794.176 895.128,813.343 822.5,795C794.495,787.332 766.495,779.666 738.5,772C673.007,758.494 627.173,782.327 601,843.5C591.844,869.079 588.511,895.412 591,922.5C593.386,942.203 596.053,961.869 599,981.5C600.466,994.469 600.799,1007.47 600,1020.5C594.162,1053.85 574.328,1069.01 540.5,1066C524.12,1063.88 509.12,1058.21 495.5,1049C475.549,1035.06 457.382,1018.89 441,1000.5C385,935.167 329,869.833 273,804.5C246.069,773.966 222.069,741.299 201,706.5C145.576,608.242 139.909,507.242 184,403.5C220.058,330.776 274.224,275.942 346.5,239C425.156,200.25 508.156,176.25 595.5,167C612.625,165.159 629.625,163.659 646.5,162.5Z" />
                        </svg>
                    </div>
                </div>
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
        );
    }

    return (
        <div className="container mx-auto flex flex-col items-center justify-center min-h-screen">
            <div className="flex flex-col items-center mb-12">
                <div
                    className="cursor-pointer"
                    onClick={() => router.push('/')}
                >
                    <svg
                        width="128"
                        height="128"
                        viewBox="0 0 1200 1200"
                        fill="black"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M646.5,162.5C773.278,157.843 880.444,200.843 968,291.5C1041.05,375.71 1073.05,473.71 1064,585.5C1058.36,642.076 1038.36,692.743 1004,737.5C955.628,794.176 895.128,813.343 822.5,795C794.495,787.332 766.495,779.666 738.5,772C673.007,758.494 627.173,782.327 601,843.5C591.844,869.079 588.511,895.412 591,922.5C593.386,942.203 596.053,961.869 599,981.5C600.466,994.469 600.799,1007.47 600,1020.5C594.162,1053.85 574.328,1069.01 540.5,1066C524.12,1063.88 509.12,1058.21 495.5,1049C475.549,1035.06 457.382,1018.89 441,1000.5C385,935.167 329,869.833 273,804.5C246.069,773.966 222.069,741.299 201,706.5C145.576,608.242 139.909,507.242 184,403.5C220.058,330.776 274.224,275.942 346.5,239C425.156,200.25 508.156,176.25 595.5,167C612.625,165.159 629.625,163.659 646.5,162.5Z" />
                    </svg>
                </div>
            </div>
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
    );
}