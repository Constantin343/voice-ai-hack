'use client';

import {useMemo, useState} from "react";
import IntroVideoScreen from "@/components/onboarding/intro-video-screen";
import DataProcessingScreen from "@/components/onboarding/data-processing-screen";
import PersonaCreationScreen from "@/components/onboarding/persona-creation-screen";
import SummaryScreen from "@/components/onboarding/summary-screen";
import RequestLinkedinScreen from "@/components/onboarding/request-linkedin-screen";
import { Toaster } from 'sonner';
import {createClient} from "@/utils/supabase/client";
import {useRouter} from "next/navigation";

export default function OnboardingScreen() {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [currentStep, setCurrentStep] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const goToNextStep = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentStep((prevStep) => prevStep + 1);
            setIsTransitioning(false);
        }, 500); // Match the animation duration
    };

    const handleLinkedInScraping = (url: string) => {
        // Start scraping profile and posts in parallel
        const profilePromise = fetch('/api/agent/onboarding/scrape-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkedinProfile: url }),
        }).then((res) => {
            if (!res.ok) {
                return Promise.reject(new Error('Failed to scrape profile data'));
            }
            return res.json();
        });

        const postsPromise = fetch('/api/agent/onboarding/scrape-posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkedinProfile: url }),
        }).then((res) => {
            if (!res.ok) {
                return Promise.reject(new Error('Failed to scrape post data'));
            }
            return res.json();
        });

        // Chain promises to handle scraping, persona creation, and agent creation sequentially
        Promise.all([profilePromise, postsPromise])
            .then(() => {
                // Create persona
                return fetch('/api/agent/onboarding/create-persona', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }).then((res) => {
                    if (!res.ok) {
                        return Promise.reject(new Error('Failed to create persona'));
                    }
                    return res.json();
                });
            })
            .then((personaResponse) => {
                const persona = personaResponse.persona;

                // Create agent
                return fetch('/api/agent/onboarding/create-agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ persona }),
                }).then((res) => {
                    if (!res.ok) {
                        return Promise.reject(new Error('Failed to create agent'));
                    }
                });
            })
            .then(() => {
                // Success message
                alert('LinkedIn scraping completed successfully!');
            })
            .catch((error) => {
                // Error handling
                console.error('Error during LinkedIn scraping:', error);
                alert(`An error occurred: ${error.message}`);
            });
    };
    const handleOnboardingCompletion = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        await supabase
            .from('users')
            .upsert({
                is_onboarded: true,
                user_id: user?.id,
            })
            .eq('user_id', user?.id);
        router.refresh()
    }

    const screens = [
        <RequestLinkedinScreen onLinkedInSubmit={handleLinkedInScraping} onNext={goToNextStep} />,
        <IntroVideoScreen onNext={goToNextStep} />,
        <DataProcessingScreen onNext={goToNextStep} />,
        <PersonaCreationScreen onNext={goToNextStep} />,
        <SummaryScreen onNext={handleOnboardingCompletion} />,
    ];

    return (
        <div className="min-h-screen flex flex-col overflow-hidden relative">
            {screens[currentStep]}
            <Toaster />
        </div>
    );
}