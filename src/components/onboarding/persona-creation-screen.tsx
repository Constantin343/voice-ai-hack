'use client';
import { useState } from "react";
import { OnboardingAgent } from "./OnboardingAgent";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function PersonaCreationScreen({ onNext }: { onNext: () => void }) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [onboardingAgentId, setOnboardingAgentId] = useState("");

    const handleIsSpeaking = async (isSpeaking: boolean) => {
        if (!isSpeaking) {
            setIsSpeaking(false);
            return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Check for onboarding agent
        const { data: userAgent, error } = await supabase
            .from('user_agent')
            .select('onboarding_agent_id')
            .eq('user_id', user.id)
            .single();

        if (error || !userAgent || !userAgent.onboarding_agent_id) {
            toast.error('Setup in progress', {
                description: 'Still setting up your onboarding experience. Please try again in 20 seconds.',
            });
            return;
        }

        setOnboardingAgentId(userAgent.onboarding_agent_id);
        setIsSpeaking(true);
    }

    const handleProcessed = () => {
        setIsSpeaking(false);
        onNext();
    };

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4">
            <h2 className="text-2xl font-semibold mb-6">Let's Get to Know You</h2>
            
            {!isSpeaking && (
                <div className="w-full text-center mb-8">
                    <p className="text-muted-foreground">
                        Our AI assistant will ask you a few questions to understand your needs better.
                        Click the icon below to start the conversation.
                    </p>
                </div>
            )}

            <div 
                onClick={() => handleIsSpeaking(!isSpeaking)}
                className="cursor-pointer"
            >
                <OnboardingAgent 
                    isSpeaking={isSpeaking}
                    onboardingAgentId={onboardingAgentId}
                    onProcessed={handleProcessed}
                />
            </div>

        </div>
    );
}