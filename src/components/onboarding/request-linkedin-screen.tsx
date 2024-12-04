'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function RequestLinkedinScreen({
                                                  onLinkedInSubmit,
                                                  onNext,
                                              }: {
    onLinkedInSubmit: (url: string) => void;
    onNext: () => void;
}) {
    const [linkedInURL, setLinkedInURL] = useState('https://www.linkedin.com/in/<your handle>');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            onLinkedInSubmit(linkedInURL);
        } catch (error) {
            console.error('Error during LinkedIn submission:', error);
            alert('An error occurred while submitting your LinkedIn profile. Please try again.');
        } finally {
            setIsSubmitting(false);
            onNext(); // Navigate to the next step immediately
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen px-4 bg-gradient-to-br from-blue-50 to-white">
            {/* Logo Section */}
            <div className="flex flex-col items-center mb-24">
                <div className="flex items-center gap-4">
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

            {/* Input Section */}
            <div className="text-center w-full max-w-md p-6 bg-white shadow-lg rounded-xl border border-gray-200">
                <p className="text-lg font-medium text-gray-800 mb-4">
                    Enter your LinkedIn URL to get started:
                </p>
                <input
                    type="text"
                    value={linkedInURL}
                    onChange={(e) => setLinkedInURL(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2d12e9] focus:border-transparent"
                    disabled={isSubmitting}
                />
                <Button
                    size="lg"
                    className={`mt-4 bg-[#2d12e9] hover:bg-[#2d12e9]/90 w-full ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Processing...' : 'Let\'s go!'}
                </Button>
                <p className="mt-4 text-sm text-gray-500">
                    We are using your LinkedIn account data to create your personalized AI.
                </p>
            </div>
        </div>
    );
}