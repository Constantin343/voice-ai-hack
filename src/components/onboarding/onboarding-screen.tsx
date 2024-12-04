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

    const handleLinkedInScraping = async (url: string) => {
        await fetch('/api/agent/onboarding-persona-scraping', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ linkedinProfile: url }),
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