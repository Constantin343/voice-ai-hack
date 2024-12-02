'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const messages = [
    'Scraping your linkedin information',
    'Processing the information',
    'Crafting your first persona',
    'Identifying missing information',
    'Done. Let\'s round up your persona',
];

export default function DataProcessingScreen({ onNext }: { onNext: () => void }) {
    const [currentMessage, setCurrentMessage] = useState(0);
    const [showButton, setShowButton] = useState(false);
    const [hasLinkedInURL, setHasLinkedInURL] = useState(false);
    const [linkedInURL, setLinkedInURL] = useState('https://www.linkedin.com/in/<your handle>');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStartProcessing = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/agent/onboarding-persona-scraping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ linkedinProfile: linkedInURL }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit LinkedIn profile');
            }

            // Set state to start the animation
            setHasLinkedInURL(true);
        } catch (error) {
            console.error(error);
            alert('An error occurred while processing your LinkedIn profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (hasLinkedInURL) {
            const interval = setInterval(() => {
                setCurrentMessage((prev) => {
                    if (prev < messages.length - 1) return prev + 1;
                    clearInterval(interval); // Stop cycling messages after the last one
                    setTimeout(() => setShowButton(true), 500); // Show button after spinner fades out
                    return prev;
                });
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [hasLinkedInURL]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-white">
            {!hasLinkedInURL ? (
                // LinkedIn URL Input Section
                <div className="text-center w-96 p-8 bg-white shadow-lg rounded-xl border border-gray-200">
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
                        onClick={handleStartProcessing}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Start Processing'}
                    </Button>
                </div>
            ) : (
                // Data Processing Section
                <div className="text-center w-96 p-8 bg-white shadow-lg rounded-xl border border-gray-200">
                    {/* Spinner */}
                    <div
                        className={`flex justify-center items-center overflow-hidden transition-all duration-500 ${
                            showButton ? 'opacity-0 max-h-0' : 'opacity-100 max-h-14'
                        }`}
                    >
                        <Loader2 className="w-14 h-14 text-[#2d12e9] animate-spin" />
                    </div>

                    {/* Message */}
                    <p className="pt-4 text-lg font-medium text-gray-800">{messages[currentMessage]}</p>

                    {/* Button */}
                    <div
                        className={`mt-8 transition-all duration-500 ${
                            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                        }`}
                    >
                        {showButton && (
                            <Button
                                size="lg"
                                className="bg-[#2d12e9] hover:bg-[#2d12e9]/90"
                                onClick={onNext}
                            >
                                Let’s Get Started
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}