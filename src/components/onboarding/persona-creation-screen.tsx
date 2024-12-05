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
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center max-w-2xl mx-auto px-4 py-12">
                <h2 className="text-2xl font-semibold mb-6">Let's Get to Know You</h2>
                
                {!isSpeaking && (
                    <div className="w-full text-center mb-8">
                        <p className="text-muted-foreground">
                            Our AI assistant will ask you a few questions to understand your needs better.
                            Click the icon below to start the conversation.
                        </p>
                    </div>
                )}

                <div>
                    <OnboardingAgent 
                        isSpeaking={isSpeaking}
                        onboardingAgentId={onboardingAgentId}
                        onProcessed={handleProcessed}
                        onClick={() => handleIsSpeaking(!isSpeaking)}
                    />
                </div>

                <div className="mt-8 z-10">
                    {isSpeaking ? (
                        <button
                            onClick={() => handleIsSpeaking(false)}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            End Conversation
                        </button>
                    ) : (
                        <button
                            onClick={onNext}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Skip for now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}