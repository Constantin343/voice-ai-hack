// In LoginPage.jsx
'use client'
import { Button } from '@/components/ui/button'
import { Linkedin } from 'lucide-react'
import { signInWithLinkedIn } from './actions'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="container mx-auto flex flex-col items-center justify-center min-h-screen">
            {/* Logo and Brand Section - Made Larger */}
            <div className="flex flex-col items-center mb-12">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <svg
                        width="64"
                        height="64"
                        viewBox="0 0 1200 1200"
                        fill="black"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M646.5,162.5C773.278,157.843 880.444,200.843 968,291.5C1041.05,375.71 1073.05,473.71 1064,585.5C1058.36,642.076 1038.36,692.743 1004,737.5C955.628,794.176 895.128,813.343 822.5,795C794.495,787.332 766.495,779.666 738.5,772C673.007,758.494 627.173,782.327 601,843.5C591.844,869.079 588.511,895.412 591,922.5C593.386,942.203 596.053,961.869 599,981.5C600.466,994.469 600.799,1007.47 600,1020.5C594.162,1053.85 574.328,1069.01 540.5,1066C524.12,1063.88 509.12,1058.21 495.5,1049C475.549,1035.06 457.382,1018.89 441,1000.5C385,935.167 329,869.833 273,804.5C246.069,773.966 222.069,741.299 201,706.5C145.576,608.242 139.909,507.242 184,403.5C220.058,330.776 274.224,275.942 346.5,239C425.156,200.25 508.156,176.25 595.5,167C612.625,165.159 629.625,163.659 646.5,162.5Z" />
                    </svg>
                    <span className="text-5xl font-bold">publyc</span>
                </div>
                <p className="text-center text-gray-600 text-xl max-w-md">
                    <span className="block mb-4">
                        The modern workflow to build your personal brand and grow an audience.
                    </span>
                    <span className="block">
                        Capture your thoughts anywhere, go viral everywhere - in minutes.
                    </span>
                </p>
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
    )
}