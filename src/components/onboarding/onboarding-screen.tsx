'use client';
import {useState} from "react";
import IntroVideoScreen from "@/components/onboarding/intro-video-screen";
import DataProcessingScreen from "@/components/onboarding/data-processing-screen";
import PersonaCreationScreen from "@/components/onboarding/persona-creation-screen";
import SummaryScreen from "@/components/onboarding/summary-screen";

export default function OnboardingScreen() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const goToNextStep = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentStep((prevStep) => prevStep + 1);
            setIsTransitioning(false);
        }, 500); // Match the animation duration
    };

    const screens = [
        <IntroVideoScreen onNext={goToNextStep}/>,
        <DataProcessingScreen onNext={goToNextStep}/>,
        <PersonaCreationScreen onNext={goToNextStep}/>,
        <SummaryScreen onNext={() => console.log("Onboarding completed!")}/>
    ];

    return (
        <div className="min-h-screen flex flex-col overflow-hidden relative">
            {screens.map((screen, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-transform duration-500 ${
                        index === currentStep
                            ? "translate-x-0"
                            : index < currentStep
                                ? "-translate-x-full"
                                : "translate-x-full"
                    }`}
                >
                    {screen}
                </div>
            ))}
        </div>
    );
}